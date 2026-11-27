import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from 'lucide-react';
import { SimulationConfig, SimulationSnapshot } from '../engine/types';
import { PaletteTheme } from '../utils/themes';

interface BankrollHeroProps {
  snapshot: SimulationSnapshot;
  config: SimulationConfig;
  theme: PaletteTheme;
}

function formatCurrency(val: number): string {
  const abs = Math.abs(Math.round(val));
  return `$${abs.toLocaleString('en-US')}`;
}

function formatSignedCurrency(val: number): string {
  const rounded = Math.round(val);
  if (rounded > 0) return `+$${rounded.toLocaleString('en-US')}`;
  if (rounded < 0) return `-$${Math.abs(rounded).toLocaleString('en-US')}`;
  return '$0';
}

export const BankrollHero: React.FC<BankrollHeroProps> = ({ snapshot, config, theme }) => {
  const {
    status,
    currentSpin,
    totalSpins,
    startingTotalPool,
    currentTotalPool,
    netProfit,
    peakTotalPool,
    peakProfit,
    peakSpin,
    totalPlayers,
  } = snapshot;

  const isInProfit = netProfit > 0;
  const isInLoss = netProfit < 0;
  const isFinished = status === 'completed' || status === 'busted';
  const progressPct = totalSpins > 0 ? Math.min(100, (currentSpin / totalSpins) * 100) : 0;
  const netPct = startingTotalPool > 0 ? (netProfit / startingTotalPool) * 100 : 0;

  const heroStyle: React.CSSProperties = {
    backgroundColor: isInProfit
      ? theme.profitBg
      : isInLoss
        ? theme.lossBg
        : theme.surface,
    borderColor: isInProfit
      ? theme.profitBorder
      : isInLoss
        ? theme.lossBorder
        : theme.border,
    boxShadow: theme.glowShadow,
  };

  const tickerColor = isInProfit
    ? theme.profitText
    : isInLoss
      ? theme.lossText
      : theme.text;

  const badgeStyle: React.CSSProperties = isInProfit
    ? {
        backgroundColor: theme.profitBg,
        borderColor: theme.profitBorder,
        color: theme.profitText,
      }
    : isInLoss
      ? {
          backgroundColor: theme.lossBg,
          borderColor: theme.lossBorder,
          color: theme.lossText,
        }
      : {
          backgroundColor: theme.subtle,
          borderColor: theme.border,
          color: theme.muted,
        };

  const edgePct = config.wheelType === 'european' ? '2.70%' : '5.26%';
  const wheelLabel =
    config.wheelType === 'european' ? 'European Single-Zero (0)' : 'American Double-Zero (0, 00)';

  return (
    <section id="simulation" aria-label="Aggregate Bankroll Hero" className="space-y-4">
      <div
        style={heroStyle}
        className="rounded-xl border transition-colors duration-150 p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Primary Live Ticker */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[var(--t-muted)]">
              <span>
                Combined Bankroll Across {config.numTables}{' '}
                {config.numTables === 1 ? 'Table' : 'Tables'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {totalPlayers} Total Players × {formatCurrency(config.startingBankroll)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{wheelLabel}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div
                style={{ color: tickerColor }}
                className="font-mono tabular-nums text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-none transition-colors duration-150"
              >
                {formatCurrency(currentTotalPool)}
              </div>

              <div
                style={badgeStyle}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-mono font-semibold tabular-nums border"
              >
                {isInProfit ? (
                  <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : isInLoss ? (
                  <TrendingDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Minus className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>{formatSignedCurrency(netProfit)}</span>
                <span className="text-xs font-normal opacity-80">
                  ({netPct >= 0 ? '+' : ''}
                  {netPct.toFixed(1)}%)
                </span>
                <span className="text-[11px] font-sans font-semibold uppercase tracking-wide ml-1">
                  {isInProfit ? 'In Profit' : isInLoss ? 'In Loss' : 'Even'}
                </span>
              </div>

              {(currentSpin > 0 && (netProfit !== 0 || isFinished)) && (
                <div
                  role="status"
                  aria-live="polite"
                  className="marquee-callout relative inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 whitespace-nowrap"
                  style={
                    {
                      backgroundColor: isInProfit
                        ? theme.profitText
                        : isInLoss
                          ? theme.lossText
                          : theme.surface,
                      borderColor: isInProfit
                        ? '#FDE047'
                        : isInLoss
                          ? '#FCA5A5'
                          : theme.border,
                      color:
                        isInProfit || isInLoss
                          ? theme.isDark
                            ? '#06120E'
                            : '#FFFFFF'
                          : theme.text,
                      '--flash-color': isInProfit
                        ? 'rgba(52, 211, 153, 0.75)'
                        : isInLoss
                          ? 'rgba(248, 113, 113, 0.75)'
                          : 'rgba(148, 163, 184, 0.35)',
                      '--flash-glow': isInProfit
                        ? 'rgba(250, 204, 21, 0.55)'
                        : isInLoss
                          ? 'rgba(239, 68, 68, 0.5)'
                          : 'rgba(148, 163, 184, 0.2)',
                    } as React.CSSProperties
                  }
                >
                  {/* Left Speech Caret */}
                  <span
                    aria-hidden="true"
                    className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 border-l-2 border-b-2"
                    style={{
                      backgroundColor: isInProfit
                        ? theme.profitText
                        : isInLoss
                          ? theme.lossText
                          : theme.surface,
                      borderColor: isInProfit
                        ? '#FDE047'
                        : isInLoss
                          ? '#FCA5A5'
                          : theme.border,
                    }}
                  />

                  {/* Top Flashing Marquee Bulbs */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 left-4 right-4 flex justify-between pointer-events-none"
                  >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i % 2 === 0 ? 'marquee-bulb-even' : 'marquee-bulb-odd'
                        }`}
                        style={{
                          backgroundColor: isInProfit
                            ? i % 2 === 0
                              ? '#FEF08A'
                              : '#FFFFFF'
                            : isInLoss
                              ? i % 2 === 0
                                ? '#FDE047'
                                : '#FECACA'
                              : '#CBD5E1',
                          boxShadow: '0 0 6px rgba(255, 255, 255, 0.9)',
                        }}
                      />
                    ))}
                  </span>

                  {/* Bottom Flashing Marquee Bulbs */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-4 right-4 flex justify-between pointer-events-none"
                  >
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i % 2 === 0 ? 'marquee-bulb-odd' : 'marquee-bulb-even'
                        }`}
                        style={{
                          backgroundColor: isInProfit
                            ? i % 2 === 0
                              ? '#FFFFFF'
                              : '#FEF08A'
                            : isInLoss
                              ? i % 2 === 0
                                ? '#FECACA'
                                : '#FDE047'
                              : '#CBD5E1',
                          boxShadow: '0 0 6px rgba(255, 255, 255, 0.9)',
                        }}
                      />
                    ))}
                  </span>

                  <span className="relative z-10 flex items-center gap-2 font-display font-extrabold text-base sm:text-lg tracking-tight">
                    <span>
                      {isInProfit ? 'You Made' : isInLoss ? 'You Lost' : 'You Broke Even'}
                    </span>
                    <span
                      className="font-mono tabular-nums text-2xl sm:text-3xl font-black px-2.5 py-0.5 rounded-lg shadow-xs"
                      style={{
                        backgroundColor: isInProfit || isInLoss ? '#090D16' : theme.subtle,
                        color: isInProfit
                          ? '#4ADE80'
                          : isInLoss
                            ? '#FCA5A5'
                            : theme.text,
                        border: `1px solid ${
                          isInProfit
                            ? 'rgba(253, 224, 71, 0.65)'
                            : isInLoss
                              ? 'rgba(252, 165, 165, 0.65)'
                              : theme.border
                        }`,
                      }}
                    >
                      {netProfit === 0 ? '$0' : `${formatCurrency(netProfit)}!`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side High-Water Mark & Starting Pool Comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--t-border)] lg:pl-6 shrink-0">
            <div>
              <div className="text-xs text-[var(--t-muted)]">Starting Pool</div>
              <div className="font-mono tabular-nums text-lg font-semibold text-[var(--t-text)] mt-0.5">
                {formatCurrency(startingTotalPool)}
              </div>
              <div className="text-xs text-[var(--t-dim)] mt-0.5">Baseline</div>
            </div>

            <div>
              <div className="text-xs text-[var(--t-muted)]">Peak Profit Reached</div>
              <div
                style={{ color: peakProfit > 0 ? theme.profitText : theme.muted }}
                className="font-mono tabular-nums text-lg font-semibold mt-0.5"
              >
                +{formatCurrency(peakProfit)}
              </div>
              <div className="text-xs text-[var(--t-dim)] font-mono tabular-nums mt-0.5">
                {peakSpin > 0
                  ? `${formatCurrency(peakTotalPool)} at Spin #${peakSpin.toLocaleString()}`
                  : 'Not yet peaked'}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-xs text-[var(--t-muted)]">Spin Progress</div>
              <div className="font-mono tabular-nums text-lg font-semibold text-[var(--t-text)] mt-0.5">
                {currentSpin.toLocaleString()} / {totalSpins.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--t-muted)] mt-0.5 font-medium">
                {status === 'idle' && 'Ready to simulate'}
                {status === 'running' && 'Running live'}
                {status === 'paused' && 'Paused'}
                {status === 'completed' && 'Target reached'}
                {status === 'busted' && 'All players busted'}
              </div>
            </div>
          </div>
        </div>

        {/* Smooth Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full bg-[var(--t-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full transition-[width] duration-75"
              style={{
                width: `${progressPct}%`,
                backgroundColor:
                  status === 'busted'
                    ? theme.lossText
                    : isInProfit
                      ? theme.profitText
                      : theme.accent,
              }}
            />
          </div>
        </div>
      </div>

      {/* Final Verdict Banner when simulation completes or all players bust */}
      {isFinished && (
        <div
          role="region"
          aria-label="Simulation Final Verdict"
          className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-5 sm:p-6"
          style={{ boxShadow: theme.glowShadow }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[var(--t-border)]">
            <div className="flex items-center gap-2.5">
              {status === 'busted' ? (
                <AlertTriangle
                  className="w-5 h-5 shrink-0"
                  style={{ color: theme.lossText }}
                  aria-hidden="true"
                />
              ) : (
                <Award
                  className="w-5 h-5 shrink-0"
                  style={{ color: theme.accent }}
                  aria-hidden="true"
                />
              )}
              <h2 className="text-base sm:text-lg font-bold text-[var(--t-text)]">
                {status === 'busted'
                  ? `Simulation Ended Early — All ${totalPlayers} Players Ruined at Spin #${currentSpin.toLocaleString()}`
                  : `Final Verdict After ${currentSpin.toLocaleString()} Spins`}
              </h2>
            </div>
            <div className="text-xs text-[var(--t-muted)]">
              House Edge: {edgePct} ·{' '}
              {peakProfit > 0 && netProfit < peakProfit
                ? `Gave back ${formatCurrency(peakProfit - netProfit)} from peak`
                : netProfit >= 0
                  ? 'Short-term variance held ahead of expectation'
                  : 'Law of Large Numbers eroded bankrolls'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <div className="p-3.5 rounded-lg bg-[var(--t-subtle)] border border-[var(--t-border)]">
              <div className="text-xs font-medium text-[var(--t-muted)]">Starting Total Money</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-[var(--t-text)] mt-1">
                {formatCurrency(startingTotalPool)}
              </div>
              <div className="text-xs text-[var(--t-dim)] mt-1">
                {totalPlayers} players × {formatCurrency(config.startingBankroll)}
              </div>
            </div>

            <div
              className="p-3.5 rounded-lg border"
              style={{
                backgroundColor: theme.profitBg,
                borderColor: theme.profitBorder,
              }}
            >
              <div className="text-xs font-medium" style={{ color: theme.profitText }}>
                Peak Profit (&ldquo;If You Had Quit At The Top&rdquo;)
              </div>
              <div
                className="font-mono tabular-nums text-2xl font-bold mt-1"
                style={{ color: theme.profitText }}
              >
                +{formatCurrency(peakProfit)}
              </div>
              <div
                className="text-xs font-mono tabular-nums mt-1 opacity-90"
                style={{ color: theme.profitText }}
              >
                {peakSpin > 0
                  ? `Pool hit ${formatCurrency(peakTotalPool)} at Spin #${peakSpin.toLocaleString()}`
                  : 'Never rose above starting pool'}
              </div>
            </div>

            <div
              className="p-3.5 rounded-lg border"
              style={{
                backgroundColor: netProfit >= 0 ? theme.profitBg : theme.lossBg,
                borderColor: netProfit >= 0 ? theme.profitBorder : theme.lossBorder,
              }}
            >
              <div
                className="text-xs font-medium"
                style={{ color: netProfit >= 0 ? theme.profitText : theme.lossText }}
              >
                Final Ending Money
              </div>
              <div
                className="font-mono tabular-nums text-2xl font-bold mt-1"
                style={{ color: netProfit >= 0 ? theme.profitText : theme.lossText }}
              >
                {formatCurrency(currentTotalPool)}
              </div>
              <div
                className="text-xs font-mono font-semibold tabular-nums mt-1"
                style={{ color: netProfit >= 0 ? theme.profitText : theme.lossText }}
              >
                Net {formatSignedCurrency(netProfit)} ({netPct >= 0 ? '+' : ''}
                {netPct.toFixed(2)}%)
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-[var(--t-muted)] leading-relaxed">
            {peakProfit > 0 && netProfit < 0
              ? `Short-term variance pushed the group +${formatCurrency(peakProfit)} into profit at Spin #${peakSpin.toLocaleString()}, tempting players to keep spinning — before the ${edgePct} house edge and losing streaks pulled the ending pool down to ${formatCurrency(currentTotalPool)}.`
              : netProfit >= 0
                ? `Over ${currentSpin.toLocaleString()} spins, short-term positive variance kept the pool ahead by ${formatSignedCurrency(netProfit)}. Increase the spin count toward 100,000+ to watch the ${edgePct} house edge assert the Law of Large Numbers.`
                : `Across ${currentSpin.toLocaleString()} spins (${snapshot.totalTableSpins.toLocaleString()} table-spins), the ${edgePct} house edge steadily drained the aggregate pool to ${formatCurrency(currentTotalPool)}.`}
          </p>
        </div>
      )}
    </section>
  );
};
