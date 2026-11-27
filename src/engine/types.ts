export type WheelType = 'european' | 'american';

export type PocketColor = 'red' | 'black' | 'green';

export type BettingStrategy =
  | 'martingale'
  | 'flat'
  | 'grand_martingale'
  | 'reverse_martingale'
  | 'fibonacci'
  | 'dalembert';

export type TargetDirection =
  | 'opposite'
  | 'same'
  | 'fixed_red'
  | 'fixed_black';

export type SimulationStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'busted';

export type LogRetentionCap = 'all' | 10000 | 50000;

export interface SimulationConfig {
  numTables: number; // 1..10
  wheelType: WheelType;
  playersPerTable: number; // 1..50
  startingBankroll: number; // default $1,000
  baseBet: number; // default $10
  tableMaxBet: number; // default $500
  unlimitedMaxBet: boolean;
  streakTriggerLength: number; // 0..5
  targetDirection: TargetDirection;
  strategy: BettingStrategy;
  totalSpins: number; // 1..1,000,000
  spinsPerSecond: number; // 10..10000 or Infinity (Max Speed)
  maxSpeed: boolean;
  logRetentionCap: LogRetentionCap;
  autoResetLog: boolean;
}

export interface ChartPoint {
  spin: number;
  totalPool: number;
}

export interface TableSnapshot {
  tableIndex: number; // 0-based
  startingPool: number;
  currentPool: number;
  netProfit: number;
  activePlayers: number;
  bustedPlayers: number;
  totalPlayers: number;
  longestSameColorStreak: number;
  longestSameColorName: 'Red' | 'Black' | 'None';
  longestLosingStreak: number;
  currentStreakColor: 'red' | 'black' | null;
  currentStreakCount: number;
  recentPockets: number[]; // last 8 pocket indices
}

export interface SimulationSnapshot {
  status: SimulationStatus;
  currentSpin: number;
  totalSpins: number;
  startingTotalPool: number;
  currentTotalPool: number;
  netProfit: number;
  peakTotalPool: number;
  peakProfit: number;
  peakSpin: number;
  minTotalPool: number;
  totalPlayers: number;
  survivingPlayers: number;
  bustedPlayers: number;
  longestColorStreak: number;
  longestColorStreakLabel: string;
  longestPlayerLosingStreak: number;
  redCount: number;
  blackCount: number;
  greenCount: number;
  totalTableSpins: number;
  totalWagered: number;
  expectedHouseLoss: number;
  chartPoints: ChartPoint[];
  tables: TableSnapshot[];
  logCounts: number[]; // logged spins count per table
}
