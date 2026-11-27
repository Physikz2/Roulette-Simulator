import {
  BettingStrategy,
  ChartPoint,
  LogRetentionCap,
  PocketColor,
  SimulationConfig,
  SimulationSnapshot,
  SimulationStatus,
  TableSnapshot,
} from './types';

// Pocket indices:
// 0 -> '0' (green)
// 1..36 -> '1'..'36' (red or black)
// 37 -> '00' (green)
export const POCKET_LABELS: readonly string[] = [
  '0',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36',
  '00',
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const POCKET_COLORS: readonly PocketColor[] = POCKET_LABELS.map((_, idx) => {
  if (idx === 0 || idx === 37) return 'green';
  return RED_NUMBERS.has(idx) ? 'red' : 'black';
});

// Precomputed Fibonacci table up to index 45 (beyond any realistic bankroll/max bet)
const FIB_SEQUENCE: number[] = [1, 1];
for (let i = 2; i < 48; i++) {
  FIB_SEQUENCE.push(FIB_SEQUENCE[i - 1] + FIB_SEQUENCE[i - 2]);
}

export const STRATEGY_META: Record<
  BettingStrategy,
  { label: string; shortFormula: string; description: string }
> = {
  martingale: {
    label: 'Martingale',
    shortFormula: '2x on loss · 1x on win',
    description: 'Doubles bet after every loss (1x, 2x, 4x, 8x...) to recover prior losses + 1 unit.',
  },
  flat: {
    label: 'Flat Betting',
    shortFormula: 'Always 1x base unit',
    description: 'Wagers the exact same base unit on every qualifying spin regardless of prior outcome.',
  },
  grand_martingale: {
    label: 'Grand Martingale',
    shortFormula: '2x + 1 unit on loss',
    description: 'Doubles bet plus adds 1 extra unit after each loss (1x, 3x, 7x, 15x...); resets on win.',
  },
  reverse_martingale: {
    label: 'Reverse Martingale (Paroli)',
    shortFormula: '2x on win (max 3) · 1x on loss',
    description: 'Doubles bet after wins up to a 3-win streak, then resets; returns to 1x on any loss.',
  },
  fibonacci: {
    label: 'Fibonacci',
    shortFormula: '+1 step on loss · -2 steps on win',
    description: 'Follows 1, 1, 2, 3, 5, 8, 13... advancing 1 step on loss and stepping back 2 on win.',
  },
  dalembert: {
    label: "D'Alembert",
    shortFormula: '+1 unit on loss · -1 unit on win',
    description: 'Gradual linear progression: adds 1 unit after a loss and subtracts 1 (min 1x) after a win.',
  },
};

interface PlayerState {
  bankroll: number;
  busted: boolean;
  bustedAtSpin: number | null;
  // Progression state
  multiplier: number; // Martingale, Grand Martingale, Reverse Martingale
  paroliWins: number;
  fibIndex: number;
  dalembertUnits: number;
  currentLosingStreak: number;
  longestLosingStreak: number;
}

class CompactSpinLog {
  private cap: LogRetentionCap;
  private buf: Uint8Array;
  private count: number = 0; // total pushed since last clear (if capped, total in ring <= cap)
  private writeIdx: number = 0;

  constructor(cap: LogRetentionCap, initialHint = 4096) {
    this.cap = cap;
    const initialCapacity =
      cap === 'all' ? Math.max(1024, Math.min(initialHint, 65536)) : cap;
    this.buf = new Uint8Array(initialCapacity);
  }

  public setCap(newCap: LogRetentionCap): void {
    if (this.cap === newCap) return;
    const existing = this.toArray();
    this.cap = newCap;
    if (newCap === 'all') {
      const nextCap = Math.max(4096, existing.length * 2);
      this.buf = new Uint8Array(nextCap);
      this.buf.set(existing, 0);
      this.count = existing.length;
      this.writeIdx = existing.length;
    } else {
      const slice =
        existing.length > newCap ? existing.subarray(existing.length - newCap) : existing;
      this.buf = new Uint8Array(newCap);
      this.buf.set(slice, 0);
      this.count = slice.length;
      this.writeIdx = slice.length % newCap;
    }
  }

  public push(pocketIdx: number): void {
    if (this.cap === 'all') {
      if (this.count >= this.buf.length) {
        const next = new Uint8Array(this.buf.length * 2);
        next.set(this.buf, 0);
        this.buf = next;
      }
      this.buf[this.count] = pocketIdx;
      this.count++;
      this.writeIdx = this.count;
    } else {
      this.buf[this.writeIdx] = pocketIdx;
      this.writeIdx = (this.writeIdx + 1) % this.cap;
      if (this.count < this.cap) {
        this.count++;
      }
    }
  }

  public clear(): void {
    this.count = 0;
    this.writeIdx = 0;
  }

  public get length(): number {
    return this.count;
  }

  public getRecent(limit: number): number[] {
    const n = Math.min(limit, this.count);
    const out = new Array<number>(n);
    if (n === 0) return out;

    if (this.cap === 'all' || this.count < this.cap) {
      const start = this.count - n;
      for (let i = 0; i < n; i++) {
        out[i] = this.buf[start + i];
      }
    } else {
      // Ring buffer is full: oldest is at writeIdx, newest is at writeIdx - 1
      const cap = this.cap;
      const startOffset = (this.writeIdx - n + cap) % cap;
      for (let i = 0; i < n; i++) {
        out[i] = this.buf[(startOffset + i) % cap];
      }
    }
    return out;
  }

  public toArray(): Uint8Array {
    if (this.count === 0) return new Uint8Array(0);
    if (this.cap === 'all' || this.count < this.cap) {
      return this.buf.slice(0, this.count);
    }
    const cap = this.cap;
    const out = new Uint8Array(cap);
    const tailLen = cap - this.writeIdx;
    out.set(this.buf.subarray(this.writeIdx), 0);
    out.set(this.buf.subarray(0, this.writeIdx), tailLen);
    return out;
  }
}

interface TableRuntime {
  tableIndex: number;
  players: PlayerState[];
  startingPool: number;
  currentPool: number;
  activePlayers: number;
  bustedPlayers: number;
  currentStreakColor: 'red' | 'black' | null;
  currentStreakCount: number;
  longestSameColorStreak: number;
  longestSameColorName: 'Red' | 'Black' | 'None';
  longestLosingStreak: number;
  recentPockets: number[];
}

export class RouletteSimulationEngine {
  private config: SimulationConfig;
  private status: SimulationStatus = 'idle';
  private currentSpin: number = 0;

  private tables: TableRuntime[] = [];
  private spinLogs: CompactSpinLog[] = [];

  private startingTotalPool: number = 0;
  private currentTotalPool: number = 0;
  private peakTotalPool: number = 0;
  private peakProfit: number = 0;
  private peakSpin: number = 0;
  private minTotalPool: number = 0;

  private redCount: number = 0;
  private blackCount: number = 0;
  private greenCount: number = 0;
  private totalTableSpins: number = 0;
  private totalWagered: number = 0;

  private longestColorStreak: number = 0;
  private longestColorStreakLabel: string = 'None';
  private longestPlayerLosingStreak: number = 0;

  private chartPoints: ChartPoint[] = [];

  constructor(initialConfig: SimulationConfig) {
    this.config = { ...initialConfig };
    this.initSimulation(true);
  }

  public getConfig(): SimulationConfig {
    return this.config;
  }

  public updateConfig(nextConfig: SimulationConfig, resetSimulation = true): void {
    const capChanged = this.config.logRetentionCap !== nextConfig.logRetentionCap;
    const tablesChanged = this.config.numTables !== nextConfig.numTables;
    this.config = { ...nextConfig };

    if (resetSimulation) {
      this.initSimulation(this.config.autoResetLog || tablesChanged);
    } else if (capChanged) {
      for (const log of this.spinLogs) {
        log.setCap(this.config.logRetentionCap);
      }
    }
  }

  public reset(clearLogs = this.config.autoResetLog): void {
    this.initSimulation(clearLogs);
  }

  public clearLogsOnly(): void {
    for (const log of this.spinLogs) {
      log.clear();
    }
  }

  public initSimulation(clearLogs: boolean): void {
    const { numTables, playersPerTable, startingBankroll, totalSpins, logRetentionCap } =
      this.config;

    this.status = 'idle';
    this.currentSpin = 0;
    this.startingTotalPool = numTables * playersPerTable * startingBankroll;
    this.currentTotalPool = this.startingTotalPool;
    this.peakTotalPool = this.startingTotalPool;
    this.peakProfit = 0;
    this.peakSpin = 0;
    this.minTotalPool = this.startingTotalPool;

    this.redCount = 0;
    this.blackCount = 0;
    this.greenCount = 0;
    this.totalTableSpins = 0;
    this.totalWagered = 0;

    this.longestColorStreak = 0;
    this.longestColorStreakLabel = 'None';
    this.longestPlayerLosingStreak = 0;

    this.chartPoints = [{ spin: 0, totalPool: this.startingTotalPool }];

    // Initialize or preserve spin logs
    if (clearLogs || this.spinLogs.length !== numTables) {
      this.spinLogs = Array.from(
        { length: numTables },
        () => new CompactSpinLog(logRetentionCap, totalSpins)
      );
    }

    this.tables = Array.from({ length: numTables }, (_, tIdx) => {
      const players: PlayerState[] = Array.from({ length: playersPerTable }, () => ({
        bankroll: startingBankroll,
        busted: startingBankroll < this.config.baseBet,
        bustedAtSpin: startingBankroll < this.config.baseBet ? 0 : null,
        multiplier: 1,
        paroliWins: 0,
        fibIndex: 0,
        dalembertUnits: 1,
        currentLosingStreak: 0,
        longestLosingStreak: 0,
      }));

      const active = players.filter((p) => !p.busted).length;
      const tStart = playersPerTable * startingBankroll;

      return {
        tableIndex: tIdx,
        players,
        startingPool: tStart,
        currentPool: tStart,
        activePlayers: active,
        bustedPlayers: playersPerTable - active,
        currentStreakColor: null,
        currentStreakCount: 0,
        longestSameColorStreak: 0,
        longestSameColorName: 'None',
        longestLosingStreak: 0,
        recentPockets: [],
      };
    });
  }

  public setStatus(status: SimulationStatus): void {
    this.status = status;
  }

  public getStatus(): SimulationStatus {
    return this.status;
  }

  /**
   * Executes up to `count` spins. Returns true if simulation reached completion or all busted on this batch.
   */
  public stepSpins(count: number): boolean {
    if (this.status === 'completed' || this.status === 'busted') {
      return false;
    }

    const remaining = this.config.totalSpins - this.currentSpin;
    const toRun = Math.min(count, remaining);
    if (toRun <= 0) {
      this.status = 'completed';
      return true;
    }

    const pocketRange = this.config.wheelType === 'european' ? 37 : 38;
    const baseBet = this.config.baseBet;
    const effectiveMaxBet = this.config.unlimitedMaxBet
      ? Infinity
      : this.config.tableMaxBet;
    const streakTrigger = this.config.streakTriggerLength;
    const targetDir = this.config.targetDirection;
    const strategy = this.config.strategy;
    const numTables = this.tables.length;

    let finishedNow = false;

    for (let s = 0; s < toRun; s++) {
      this.currentSpin++;
      const spinNum = this.currentSpin;
      let aggregatePool = 0;
      let totalActiveAcrossAll = 0;

      for (let t = 0; t < numTables; t++) {
        const table = this.tables[t];

        // 1. Determine if this table qualifies for a bet before the spin
        let betColor: 'red' | 'black' | null = null;
        if (streakTrigger === 0) {
          if (targetDir === 'fixed_red') {
            betColor = 'red';
          } else if (targetDir === 'fixed_black') {
            betColor = 'black';
          } else if (targetDir === 'opposite') {
            betColor = table.currentStreakColor === 'red' ? 'black' : 'red';
          } else {
            // 'same'
            betColor = table.currentStreakColor ?? 'red';
          }
        } else if (
          table.currentStreakColor !== null &&
          table.currentStreakCount >= streakTrigger
        ) {
          if (targetDir === 'opposite') {
            betColor = table.currentStreakColor === 'red' ? 'black' : 'red';
          } else if (targetDir === 'same') {
            betColor = table.currentStreakColor;
          } else if (targetDir === 'fixed_red') {
            betColor = 'red';
          } else {
            betColor = 'black';
          }
        }

        // 2. Spin the wheel for this table
        // For pocketRange === 38, index 37 represents '00'
        const pocketIdx = Math.floor(Math.random() * pocketRange);
        const outcomeColor = POCKET_COLORS[pocketIdx];

        table.recentPockets.push(pocketIdx);
        if (table.recentPockets.length > 8) {
          table.recentPockets.shift();
        }

        this.totalTableSpins++;
        if (outcomeColor === 'red') this.redCount++;
        else if (outcomeColor === 'black') this.blackCount++;
        else this.greenCount++;

        // 3. Resolve player bets if table triggered
        let anyBetPlaced = false;
        const isWin = betColor !== null && outcomeColor === betColor;
        if (betColor !== null && table.activePlayers > 0) {
          const players = table.players;
          const pLen = players.length;

          for (let i = 0; i < pLen; i++) {
            const p = players[i];
            if (p.busted) continue;

            // Calculate desired wager
            let units = 1;
            switch (strategy) {
              case 'martingale':
              case 'grand_martingale':
              case 'reverse_martingale':
                units = p.multiplier;
                break;
              case 'flat':
                units = 1;
                break;
              case 'fibonacci':
                units =
                  p.fibIndex < FIB_SEQUENCE.length
                    ? FIB_SEQUENCE[p.fibIndex]
                    : FIB_SEQUENCE[FIB_SEQUENCE.length - 1];
                break;
              case 'dalembert':
                units = p.dalembertUnits;
                break;
            }

            let wager = units * baseBet;
            if (wager > effectiveMaxBet) wager = effectiveMaxBet;
            if (wager > p.bankroll) wager = p.bankroll;
            if (wager < baseBet) {
              // Cannot cover minimum bet
              p.busted = true;
              p.bustedAtSpin = spinNum;
              table.activePlayers--;
              table.bustedPlayers++;
              continue;
            }

            anyBetPlaced = true;
            this.totalWagered += wager;

            if (isWin) {
              p.bankroll += wager;
              table.currentPool += wager;
              p.currentLosingStreak = 0;

              switch (strategy) {
                case 'martingale':
                case 'grand_martingale':
                  p.multiplier = 1;
                  break;
                case 'reverse_martingale':
                  p.paroliWins++;
                  if (p.paroliWins >= 3) {
                    p.multiplier = 1;
                    p.paroliWins = 0;
                  } else {
                    p.multiplier = p.multiplier * 2;
                  }
                  break;
                case 'fibonacci':
                  p.fibIndex = Math.max(0, p.fibIndex - 2);
                  break;
                case 'dalembert':
                  p.dalembertUnits = Math.max(1, p.dalembertUnits - 1);
                  break;
                case 'flat':
                  break;
              }
            } else {
              p.bankroll -= wager;
              table.currentPool -= wager;
              p.currentLosingStreak++;
              if (p.currentLosingStreak > p.longestLosingStreak) {
                p.longestLosingStreak = p.currentLosingStreak;
                if (p.longestLosingStreak > table.longestLosingStreak) {
                  table.longestLosingStreak = p.longestLosingStreak;
                }
                if (p.longestLosingStreak > this.longestPlayerLosingStreak) {
                  this.longestPlayerLosingStreak = p.longestLosingStreak;
                }
              }

              switch (strategy) {
                case 'martingale':
                  p.multiplier = p.multiplier * 2;
                  break;
                case 'grand_martingale':
                  p.multiplier = p.multiplier * 2 + 1;
                  break;
                case 'reverse_martingale':
                  p.multiplier = 1;
                  p.paroliWins = 0;
                  break;
                case 'fibonacci':
                  if (p.fibIndex < FIB_SEQUENCE.length - 1) {
                    p.fibIndex++;
                  }
                  break;
                case 'dalembert':
                  p.dalembertUnits++;
                  break;
                case 'flat':
                  break;
              }

              if (p.bankroll < baseBet) {
                p.busted = true;
                p.bustedAtSpin = spinNum;
                table.activePlayers--;
                table.bustedPlayers++;
              }
            }
          }
        }

        // Log spin with bet-placed (0x40) and bet-won (0x80) flags packed into upper bits
        const encodedEntry =
          (pocketIdx & 0x3f) | (anyBetPlaced ? 0x40 : 0) | (anyBetPlaced && isWin ? 0x80 : 0);
        this.spinLogs[t].push(encodedEntry);

        // 4. Update table color streak AFTER resolving this spin
        if (outcomeColor === 'green') {
          table.currentStreakColor = null;
          table.currentStreakCount = 0;
        } else if (outcomeColor === table.currentStreakColor) {
          table.currentStreakCount++;
        } else {
          table.currentStreakColor = outcomeColor;
          table.currentStreakCount = 1;
        }

        if (table.currentStreakCount > table.longestSameColorStreak && table.currentStreakColor) {
          table.longestSameColorStreak = table.currentStreakCount;
          table.longestSameColorName = table.currentStreakColor === 'red' ? 'Red' : 'Black';

          if (table.longestSameColorStreak > this.longestColorStreak) {
            this.longestColorStreak = table.longestSameColorStreak;
            this.longestColorStreakLabel = `${table.longestSameColorStreak} ${table.longestSameColorName}s in a row`;
          }
        }

        aggregatePool += table.currentPool;
        totalActiveAcrossAll += table.activePlayers;
      }

      this.currentTotalPool = aggregatePool;
      const profit = aggregatePool - this.startingTotalPool;
      if (aggregatePool > this.peakTotalPool) {
        this.peakTotalPool = aggregatePool;
        this.peakProfit = profit;
        this.peakSpin = spinNum;
      }
      if (aggregatePool < this.minTotalPool) {
        this.minTotalPool = aggregatePool;
      }

      // Record chart point with adaptive min-max decimation to keep <= 800 points
      this.recordChartPoint(spinNum, aggregatePool);

      if (totalActiveAcrossAll === 0) {
        this.status = 'busted';
        finishedNow = true;
        break;
      }

      if (spinNum >= this.config.totalSpins) {
        this.status = 'completed';
        finishedNow = true;
        break;
      }
    }

    return finishedNow;
  }

  private recordChartPoint(spin: number, totalPool: number): void {
    // Sampling interval scales smoothly with totalSpins so we stay fast on 1M runs
    const targetSpins = this.config.totalSpins;
    const minStep = targetSpins > 5000 ? Math.floor(targetSpins / 700) : 1;

    const last = this.chartPoints[this.chartPoints.length - 1];
    const isPeak = spin === this.peakSpin;
    const isEnd = spin >= targetSpins || this.status === 'busted';

    if (minStep <= 1 || isPeak || isEnd || spin - last.spin >= minStep) {
      this.chartPoints.push({ spin, totalPool });
      if (this.chartPoints.length > 900) {
        this.compactChartPoints();
      }
    }
  }

  private compactChartPoints(): void {
    // Min-max envelope decimation preserving start, exact peak, and end
    const pts = this.chartPoints;
    const compacted: ChartPoint[] = [pts[0]];
    const endIdx = pts.length - 1;

    for (let i = 1; i < endIdx; i += 4) {
      const limit = Math.min(i + 4, endIdx);
      let minPt = pts[i];
      let maxPt = pts[i];
      for (let j = i + 1; j < limit; j++) {
        if (pts[j].totalPool < minPt.totalPool) minPt = pts[j];
        if (pts[j].totalPool > maxPt.totalPool) maxPt = pts[j];
      }
      if (minPt === maxPt) {
        compacted.push(minPt);
      } else if (minPt.spin < maxPt.spin) {
        compacted.push(minPt, maxPt);
      } else {
        compacted.push(maxPt, minPt);
      }
    }
    compacted.push(pts[endIdx]);
    this.chartPoints = compacted;
  }

  public getSnapshot(): SimulationSnapshot {
    const totalPlayers = this.config.numTables * this.config.playersPerTable;
    let surviving = 0;
    let busted = 0;

    const tableSnaps: TableSnapshot[] = this.tables.map((t) => {
      surviving += t.activePlayers;
      busted += t.bustedPlayers;
      return {
        tableIndex: t.tableIndex,
        startingPool: t.startingPool,
        currentPool: t.currentPool,
        netProfit: t.currentPool - t.startingPool,
        activePlayers: t.activePlayers,
        bustedPlayers: t.bustedPlayers,
        totalPlayers: t.players.length,
        longestSameColorStreak: t.longestSameColorStreak,
        longestSameColorName: t.longestSameColorName,
        longestLosingStreak: t.longestLosingStreak,
        currentStreakColor: t.currentStreakColor,
        currentStreakCount: t.currentStreakCount,
        recentPockets: [...t.recentPockets],
      };
    });

    const houseEdgeRate = this.config.wheelType === 'european' ? 1 / 37 : 2 / 38;

    return {
      status: this.status,
      currentSpin: this.currentSpin,
      totalSpins: this.config.totalSpins,
      startingTotalPool: this.startingTotalPool,
      currentTotalPool: this.currentTotalPool,
      netProfit: this.currentTotalPool - this.startingTotalPool,
      peakTotalPool: this.peakTotalPool,
      peakProfit: this.peakProfit,
      peakSpin: this.peakSpin,
      minTotalPool: this.minTotalPool,
      totalPlayers,
      survivingPlayers: surviving,
      bustedPlayers: busted,
      longestColorStreak: this.longestColorStreak,
      longestColorStreakLabel:
        this.longestColorStreak > 0 ? this.longestColorStreakLabel : 'No streak yet',
      longestPlayerLosingStreak: this.longestPlayerLosingStreak,
      redCount: this.redCount,
      blackCount: this.blackCount,
      greenCount: this.greenCount,
      totalTableSpins: this.totalTableSpins,
      totalWagered: this.totalWagered,
      expectedHouseLoss: this.totalWagered * houseEdgeRate,
      chartPoints: this.chartPoints,
      tables: tableSnaps,
      logCounts: this.spinLogs.map((l) => l.length),
    };
  }

  public getRecentLogSpins(tableIdx: number, limit = 2000): number[] {
    if (tableIdx < 0 || tableIdx >= this.spinLogs.length) return [];
    return this.spinLogs[tableIdx].getRecent(limit);
  }

  public generateTxtExport(): string {
    const snap = this.getSnapshot();
    const lines: string[] = [
      'MONTE CARLO ROULETTE SIMULATION LOG',
      '===================================',
      `Wheel: ${this.config.wheelType === 'european' ? 'European Single-Zero (0) — 2.70% House Edge' : 'American Double-Zero (0, 00) — 5.26% House Edge'}`,
      `Tables: ${this.config.numTables} | Players/Table: ${this.config.playersPerTable} (${snap.totalPlayers} Total Players)`,
      `Strategy: ${STRATEGY_META[this.config.strategy].label} | Base Unit: $${this.config.baseBet} | Max Bet: ${this.config.unlimitedMaxBet ? 'Unlimited' : `$${this.config.tableMaxBet}`}`,
      `Streak Trigger: ${this.config.streakTriggerLength === 0 ? 'Bet Immediately (0 wait)' : `Wait for ${this.config.streakTriggerLength} consecutive same-color spins -> ${this.config.targetDirection}`}`,
      `Spins Completed: ${snap.currentSpin.toLocaleString()} / ${snap.totalSpins.toLocaleString()}`,
      `Starting Total Pool: $${snap.startingTotalPool.toLocaleString()}`,
      `Peak Profit Reached: +$${snap.peakProfit.toLocaleString()} at Spin #${snap.peakSpin.toLocaleString()} (Pool: $${snap.peakTotalPool.toLocaleString()})`,
      `Final Ending Pool: $${snap.currentTotalPool.toLocaleString()} (Net ${snap.netProfit >= 0 ? '+' : '-'}$${Math.abs(snap.netProfit).toLocaleString()})`,
      `Players Surviving: ${snap.survivingPlayers} / ${snap.totalPlayers}`,
      `Longest Same-Color Streak: ${snap.longestColorStreakLabel}`,
      `Color Split: Red ${snap.redCount.toLocaleString()} | Black ${snap.blackCount.toLocaleString()} | Green ${snap.greenCount.toLocaleString()}`,
      '',
      'SPIN LOG PER TABLE',
      '------------------',
    ];

    for (let t = 0; t < this.spinLogs.length; t++) {
      const arr = this.spinLogs[t].toArray();
      const strList: string[] = new Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        strList[i] = POCKET_LABELS[arr[i] & 0x3f];
      }
      lines.push(`Table ${t + 1} (${arr.length.toLocaleString()} spins): ${strList.join(', ')}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  public generateHtmlExport(): string {
    const snap = this.getSnapshot();
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const tableSections: string[] = [];
    for (let t = 0; t < this.spinLogs.length; t++) {
      const arr = this.spinLogs[t].toArray();
      const chunks: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        const entry = arr[i];
        const idx = entry & 0x3f;
        const betPlaced = (entry & 0x40) !== 0;
        const label = POCKET_LABELS[idx];
        const color = POCKET_COLORS[idx];
        const cls = color === 'red' ? 'r' : color === 'black' ? 'b' : 'g';
        chunks.push(`<span class="n ${cls}${betPlaced ? ' bet' : ''}">${label}</span>`);
      }
      tableSections.push(
        `<section class="tbl"><h2>Table ${t + 1} <span class="meta">(${arr.length.toLocaleString()} logged spins · circled = bet placed)</span></h2><div class="stream">${chunks.join(', ')}</div></section>`
      );
    }

    const netSign = snap.netProfit >= 0 ? '+' : '-';
    const netAbs = Math.abs(snap.netProfit).toLocaleString();

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Monte Carlo Roulette Color-Matched Spin Log</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }
  .wrap { max-width: 1120px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  .sub { color: #475569; font-size: 13px; margin: 0 0 20px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
  .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-val { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 16px; font-weight: 700; margin-top: 4px; }
  .tbl { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 18px; }
  .tbl h2 { font-size: 15px; margin: 0 0 12px; }
  .meta { font-weight: 400; color: #64748b; font-size: 13px; }
  .stream { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; line-height: 1.9; word-break: break-word; }
  .n { display: inline-block; padding: 0 5px; border-radius: 4px; font-weight: 600; }
  .bet { border-radius: 9999px; box-shadow: 0 0 0 2px #0f172a; padding: 0 7px; font-weight: 700; }
  .r { color: #dc2626; background: #fef2f2; }
  .b { color: #1e293b; background: #f1f5f9; }
  .g { color: #16a34a; background: #f0fdf4; font-weight: 700; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Monte Carlo Roulette — Color-Matched Spin Log</h1>
  <p class="sub">${escapeHtml(this.config.wheelType === 'european' ? 'European Single-Zero (2.70% Edge)' : 'American Double-Zero (5.26% Edge)')} · ${escapeHtml(STRATEGY_META[this.config.strategy].label)} · ${snap.currentSpin.toLocaleString()} / ${snap.totalSpins.toLocaleString()} Spins</p>
  <div class="summary">
    <div><div class="stat-lbl">Starting Pool</div><div class="stat-val">$${snap.startingTotalPool.toLocaleString()}</div></div>
    <div><div class="stat-lbl">Peak Profit</div><div class="stat-val" style="color:#16a34a">+$${snap.peakProfit.toLocaleString()} (Spin #${snap.peakSpin.toLocaleString()})</div></div>
    <div><div class="stat-lbl">Ending Pool</div><div class="stat-val" style="color:${snap.netProfit >= 0 ? '#16a34a' : '#dc2626'}">$${snap.currentTotalPool.toLocaleString()} (${netSign}$${netAbs})</div></div>
    <div><div class="stat-lbl">Surviving Players</div><div class="stat-val">${snap.survivingPlayers} / ${snap.totalPlayers}</div></div>
  </div>
  ${tableSections.join('\n')}
</div>
</body>
</html>`;
  }
}
