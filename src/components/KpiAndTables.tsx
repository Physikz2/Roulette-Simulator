import React from 'react';
import { SimulationConfig, SimulationSnapshot } from '../engine/types';
import { POCKET_COLORS, POCKET_LABELS } from '../engine/rouletteEngine';
import { PaletteTheme } from '../utils/themes';

interface KpiAndTablesProps {
  snapshot: SimulationSnapshot;
  config: SimulationConfig;
  theme: PaletteTheme;
}

export const KpiAndTables: React.FC<KpiAndTablesProps> = ({ snapshot, config, theme }) => {
  const {
    survivingPlayers,
    bustedPlayers,
    totalPlayers,
    longestColorStreakLabel,
    longestPlayerLosingStreak,
    redCount,
    blackCount,
    greenCount,
    totalTableSpins,
    totalWagered,
    expectedHouseLoss,
    tables,
  } = snapshot;

  const survivalPct = totalPlayers > 0 ? (survivingPlayers / totalPlayers) * 100 : 0;
  const redPct = totalTableSpins > 0 ? (redCount / totalTableSpins) * 100 : 0;
  const blackPct = totalTableSpins > 0 ? (blackCount / totalTableSpins) * 100 : 0;
  const greenPct = totalTableSpins > 0 ? (greenCount / totalTableSpins) * 100 : 0;

  const theoryRed = config.wheelType === 'european' ? '48.65%' : '47.37%';
  const theoryGreen = config.wheelType === 'european' ? '2.70%' : '5.26%';

  const redText = theme.isDark ? '#FCA5A5' : '#DC2626';
  const blackText = theme.isDark ? '#E2E8F0' : '#1E293B';
  const greenText = theme.isDark ? '#6EE7B7' : '#16A34A';

  return (
    <div className="space-y-5">
      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-4">
          <div className="text-xs text-[var(--t-dim)]">Players Surviving vs. Busted</div>
          <div className="font-mono tabular-nums text-xl font-bold text-[var(--t-text)] mt-1">
            {survivingPlayers} / {totalPlayers}
          </div>
          <div className="text-xs text-[var(--t-muted)] font-mono tabular-nums mt-1">
            {survivalPct.toFixed(1)}% alive · {bustedPlayers} ruined
          </div>
        </div>

        <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-4">
          <div className="text-xs text-[var(--t-dim)]">Longest Streak Encountered</div>
          <div className="font-mono tabular-nums text-xl font-bold text-[var(--t-text)] mt-1 truncate">
            {longestColorStreakLabel}
          </div>
          <div className="text-xs text-[var(--t-muted)] font-mono tabular-nums mt-1">
            Max player loss run: {longestPlayerLosingStreak} in a row
          </div>
        </div>

        <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-4">
          <div className="text-xs text-[var(--t-dim)]">
            Empirical Color Split ({totalTableSpins.toLocaleString()} spins)
          </div>
          <div className="font-mono tabular-nums text-sm font-bold mt-1.5 flex items-center gap-2">
            <span style={{ color: redText }}>R {redPct.toFixed(2)}%</span>
            <span className="text-[var(--t-dim)]">·</span>
            <span style={{ color: blackText }}>B {blackPct.toFixed(2)}%</span>
            <span className="text-[var(--t-dim)]">·</span>
            <span style={{ color: greenText }}>G {greenPct.toFixed(2)}%</span>
          </div>
          <div className="text-[11px] text-[var(--t-dim)] font-mono tabular-nums mt-1">
            Theory: {theoryRed} / {theoryRed} / {theoryGreen}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-4">
          <div className="text-xs text-[var(--t-dim)]">Cumulative Volume & Expected Drain</div>
          <div className="font-mono tabular-nums text-xl font-bold text-[var(--t-text)] mt-1">
            ${Math.round(totalWagered).toLocaleString()}
          </div>
          <div
            className="text-xs font-mono tabular-nums mt-1"
            style={{ color: theme.lossText }}
          >
            Expected EV: -${Math.round(expectedHouseLoss).toLocaleString()} ({theoryGreen} edge)
          </div>
        </div>
      </div>

      {/* Multi-Table Comparison Grid */}
      {tables.length > 1 && (
        <section
          id="tables"
          aria-label="Multi-Table Comparison"
          className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[var(--t-border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--t-text)]">
              Multi-Table Breakdown ({tables.length} Independent Wheels)
            </h2>
            <span className="text-xs text-[var(--t-dim)]">
              Each table runs an isolated RNG stream
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--t-border)] bg-[var(--t-subtle)] text-[11px] font-semibold text-[var(--t-dim)]">
                  <th className="py-2.5 px-4">Table</th>
                  <th className="py-2.5 px-4 text-right">Starting Pool</th>
                  <th className="py-2.5 px-4 text-right">Current Pool</th>
                  <th className="py-2.5 px-4 text-right">Net P/L</th>
                  <th className="py-2.5 px-4 text-right">Surviving</th>
                  <th className="py-2.5 px-4 text-right">Longest Streak</th>
                  <th className="py-2.5 px-4">Recent Spins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--t-border-soft)] text-xs">
                {tables.map((t) => {
                  const isPos = t.netProfit > 0;
                  const isNeg = t.netProfit < 0;
                  return (
                    <tr
                      key={t.tableIndex}
                      className="hover:bg-[var(--t-subtle)]/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-semibold text-[var(--t-text)] whitespace-nowrap">
                        Table {t.tableIndex + 1}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[var(--t-muted)]">
                        ${t.startingPool.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[var(--t-text)]">
                        ${Math.round(t.currentPool).toLocaleString()}
                      </td>
                      <td
                        className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold"
                        style={{
                          color: isPos ? theme.profitText : isNeg ? theme.lossText : theme.muted,
                        }}
                      >
                        {t.netProfit >= 0 ? '+' : '-'}$
                        {Math.abs(Math.round(t.netProfit)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[var(--t-muted)]">
                        {t.activePlayers} / {t.totalPlayers}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[var(--t-muted)] whitespace-nowrap">
                        {t.longestSameColorStreak > 0
                          ? `${t.longestSameColorStreak} ${t.longestSameColorName}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1 font-mono tabular-nums">
                          {t.recentPockets.length === 0 ? (
                            <span className="text-[var(--t-dim)]">—</span>
                          ) : (
                            t.recentPockets.map((pIdx, idx) => {
                              const col = POCKET_COLORS[pIdx];
                              const tokenStyle: React.CSSProperties = theme.isDark
                                ? col === 'red'
                                  ? {
                                      backgroundColor: 'rgba(220, 38, 38, 0.22)',
                                      color: '#FCA5A5',
                                    }
                                  : col === 'green'
                                    ? {
                                        backgroundColor: 'rgba(16, 185, 129, 0.22)',
                                        color: '#6EE7B7',
                                      }
                                    : {
                                        backgroundColor: 'rgba(148, 163, 184, 0.16)',
                                        color: '#E2E8F0',
                                      }
                                : col === 'red'
                                  ? { backgroundColor: '#FEF2F2', color: '#DC2626' }
                                  : col === 'green'
                                    ? { backgroundColor: '#ECFDF5', color: '#15803D' }
                                    : { backgroundColor: '#F1F5F9', color: '#1E293B' };

                              return (
                                <span
                                  key={idx}
                                  style={tokenStyle}
                                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
                                >
                                  {POCKET_LABELS[pIdx]}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
