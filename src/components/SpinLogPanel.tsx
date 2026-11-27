import React, { useEffect, useRef } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { LogRetentionCap, SimulationConfig } from '../engine/types';
import { POCKET_COLORS, POCKET_LABELS } from '../engine/rouletteEngine';
import { PaletteTheme } from '../utils/themes';

interface SpinLogPanelProps {
  config: SimulationConfig;
  theme: PaletteTheme;
  selectedTable: number;
  onSelectTable: (idx: number) => void;
  recentSpins: number[]; // bit-packed: pocketIdx (0..5), betPlaced (0x40), betWon (0x80)
  logCounts: number[];
  onClearLog: () => void;
  onToggleAutoReset: (val: boolean) => void;
  onChangeLogCap: (cap: LogRetentionCap) => void;
  onDownloadTxt: () => void;
  onDownloadHtml: () => void;
}

export const SpinLogPanel: React.FC<SpinLogPanelProps> = ({
  config,
  theme,
  selectedTable,
  onSelectTable,
  recentSpins,
  logCounts,
  onClearLog,
  onToggleAutoReset,
  onChangeLogCap,
  onDownloadTxt,
  onDownloadHtml,
}) => {
  const safeTableIdx = Math.min(selectedTable, Math.max(0, config.numTables - 1));
  const totalLoggedOnTable = logCounts[safeTableIdx] ?? 0;
  const totalLoggedAllTables = logCounts.reduce((acc, n) => acc + n, 0);
  const streamRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [recentSpins, safeTableIdx]);

  return (
    <section
      id="spin-log"
      aria-label="Color-Matched Spin Log"
      className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-5 space-y-4"
      style={{ boxShadow: theme.glowShadow }}
    >
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[var(--t-border)]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-[var(--t-text)]">Color-Matched Spin Log</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--t-muted)]">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-bold"
                style={{
                  border: `2px solid ${theme.accent}`,
                  color: theme.text,
                  backgroundColor: theme.subtle,
                }}
                aria-hidden="true"
              >
                7
              </span>
              <span>Circled = Bet Placed</span>
            </span>
          </div>
          <p className="text-xs text-[var(--t-dim)] mt-0.5">
            Showing {recentSpins.length.toLocaleString()} most recent spins
            {totalLoggedOnTable > recentSpins.length
              ? ` of ${totalLoggedOnTable.toLocaleString()} logged on Table ${safeTableIdx + 1} (DOM capped at 2,000 for 60fps performance)`
              : ` on Table ${safeTableIdx + 1}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto-Reset Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-subtle)] text-xs font-medium text-[var(--t-muted)] cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={config.autoResetLog}
              onChange={(e) => onToggleAutoReset(e.target.checked)}
              className="rounded border-[var(--t-border)] accent-[var(--t-accent)]"
            />
            <span>Auto-Reset Log on New Run</span>
          </label>

          {/* Retention Cap Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="log-cap" className="text-xs text-[var(--t-dim)] whitespace-nowrap">
              Retain:
            </label>
            <select
              id="log-cap"
              value={String(config.logRetentionCap)}
              onChange={(e) => {
                const raw = e.target.value;
                onChangeLogCap(raw === 'all' ? 'all' : (Number(raw) as 10000 | 50000));
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]"
            >
              <option value="all">All Spins</option>
              <option value="10000">Last 10,000</option>
              <option value="50000">Last 50,000</option>
            </select>
          </div>

          {/* Clear Log */}
          <button
            type="button"
            onClick={onClearLog}
            disabled={totalLoggedAllTables === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Log</span>
          </button>

          {/* Download .txt */}
          <button
            type="button"
            onClick={onDownloadTxt}
            disabled={totalLoggedAllTables === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download .txt</span>
          </button>

          {/* Download .html */}
          <button
            type="button"
            onClick={onDownloadHtml}
            disabled={totalLoggedAllTables === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap disabled:opacity-40"
            style={{
              backgroundColor: theme.accent,
              color: theme.accentFg,
            }}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download .html</span>
          </button>
        </div>
      </div>

      {/* Table Selector Tabs (if > 1 table) */}
      {config.numTables > 1 && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--t-subtle)] rounded-lg w-fit">
          {Array.from({ length: config.numTables }, (_, idx) => {
            const active = safeTableIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTable(idx)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                style={
                  active
                    ? { backgroundColor: theme.surface, color: theme.text }
                    : { color: theme.muted }
                }
              >
                Table {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Color-Coded Comma-Separated Stream */}
      <div
        ref={streamRef}
        className="rounded-lg border border-[var(--t-border)] bg-[var(--t-input)] p-3.5 max-h-44 overflow-y-auto font-mono text-[13px] leading-8 tabular-nums"
      >
        {recentSpins.length === 0 ? (
          <div className="text-[var(--t-dim)] text-xs py-3 text-center font-sans">
            No spins logged yet. Start or step the simulation to populate the live color-coded spin
            stream.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-y-1.5">
            {recentSpins.map((entry, idx) => {
              const pocketIdx = entry & 0x3f;
              const betPlaced = (entry & 0x40) !== 0;
              const betWon = (entry & 0x80) !== 0;

              const label = POCKET_LABELS[pocketIdx];
              const color = POCKET_COLORS[pocketIdx];

              const baseColors: React.CSSProperties = theme.isDark
                ? color === 'red'
                  ? {
                      color: '#FCA5A5',
                      backgroundColor: 'rgba(220, 38, 38, 0.22)',
                      border: betPlaced
                        ? `2px solid ${theme.accent}`
                        : '1px solid rgba(248, 113, 113, 0.35)',
                    }
                  : color === 'green'
                    ? {
                        color: '#6EE7B7',
                        backgroundColor: 'rgba(16, 185, 129, 0.22)',
                        border: betPlaced
                          ? `2px solid ${theme.accent}`
                          : '1px solid rgba(52, 211, 153, 0.4)',
                        fontWeight: 700,
                      }
                    : {
                        color: '#E2E8F0',
                        backgroundColor: 'rgba(148, 163, 184, 0.16)',
                        border: betPlaced
                          ? `2px solid ${theme.accent}`
                          : '1px solid rgba(148, 163, 184, 0.25)',
                      }
                : color === 'red'
                  ? {
                      color: '#DC2626',
                      backgroundColor: '#FEF2F2',
                      border: betPlaced ? `2px solid ${theme.accent}` : '1px solid #FECACA',
                    }
                  : color === 'green'
                    ? {
                        color: '#15803D',
                        backgroundColor: '#ECFDF5',
                        border: betPlaced ? `2px solid ${theme.accent}` : '1px solid #86EFAC',
                        fontWeight: 700,
                      }
                    : {
                        color: '#0F172A',
                        backgroundColor: '#E2E8F0',
                        border: betPlaced ? `2px solid ${theme.accent}` : '1px solid #CBD5E1',
                      };

              const style: React.CSSProperties = betPlaced
                ? {
                    ...baseColors,
                    boxShadow: `0 0 0 1px ${theme.surface}`,
                  }
                : {
                    ...baseColors,
                    opacity: 0.78,
                  };

              const tooltip = betPlaced
                ? `${label} (${color}) · Bet Placed (${betWon ? 'Won' : 'Lost'})`
                : `${label} (${color}) · Waiting (No Bet)`;

              return (
                <React.Fragment key={idx}>
                  <span
                    style={style}
                    title={tooltip}
                    className={
                      betPlaced
                        ? 'inline-flex items-center justify-center min-w-[26px] h-[24px] px-1.5 rounded-full text-xs font-bold leading-none'
                        : 'inline-block px-1.5 py-0.5 rounded text-xs font-medium leading-none'
                    }
                  >
                    {label}
                  </span>
                  {idx < recentSpins.length - 1 && (
                    <span className="text-[var(--t-dim)] mr-1.5 select-none">,</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
