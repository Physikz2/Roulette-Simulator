import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { PaletteTheme } from '../utils/themes';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PaletteTheme;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] shadow-2xl overflow-hidden"
        style={{ boxShadow: theme.glowShadow !== 'none' ? theme.glowShadow : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--t-border)] bg-[var(--t-subtle)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen
              className="w-5 h-5 shrink-0"
              style={{ color: theme.accent }}
              aria-hidden="true"
            />
            <div>
              <h2 id="instructions-modal-title" className="text-base sm:text-lg font-bold">
                Simulation Instructions &amp; Settings Reference
              </h2>
              <p className="text-xs text-[var(--t-dim)]">
                Complete guide to every wheel rule, betting progression, and readout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close instructions"
            className="p-1.5 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:text-[var(--t-text)] transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm leading-relaxed">
          {/* Quick Start & Educational Thesis */}
          <section className="rounded-lg border border-[var(--t-border)] bg-[var(--t-subtle)] p-4 space-y-1.5">
            <h3 className="text-sm font-bold text-[var(--t-text)]">
              How It Works: Variance vs. Law of Large Numbers
            </h3>
            <p className="text-xs sm:text-sm text-[var(--t-muted)]">
              Over small spin counts (e.g. 100–200 spins), random variance frequently lifts the
              group into profit—tempting players to keep playing. Over large spin counts (10,000+
              spins), the fixed casino house edge (<span className="font-mono">2.70%</span> European
              or <span className="font-mono">5.26%</span> American) inevitably pulls aggregate
              bankrolls downward.
            </p>
          </section>

          {/* 1. Tables & Wheel Geometry */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-bold border-b border-[var(--t-border-soft)] pb-1.5">
              1. Tables &amp; Wheel Geometry
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-[13px]">
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">Wheel Standard</dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  <strong>European (0):</strong> 37 pockets (<span className="font-mono">0</span>,{' '}
                  <span className="font-mono">1–36</span>), <span className="font-mono">2.70%</span>{' '}
                  house edge.
                  <br />
                  <strong>American (0, 00):</strong> 38 pockets (<span className="font-mono">0</span>
                  , <span className="font-mono">00</span>, <span className="font-mono">1–36</span>),{' '}
                  <span className="font-mono">5.26%</span> house edge.
                </dd>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">Parallel Tables (1–10)</dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  Runs multiple independent roulette wheels simultaneously. Each table maintains its
                  own random spin stream, streak counter, and player pool, and displays a breakdown
                  table when set above 1.
                </dd>
              </div>
            </dl>
          </section>

          {/* 2. Players & Bankroll Limits */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-bold border-b border-[var(--t-border-soft)] pb-1.5">
              2. Players &amp; Bankroll Limits
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-[13px]">
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">
                  Players per Table &amp; Starting Bankroll
                </dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  Seat <span className="font-mono">1–50</span> players per table, each starting with
                  the configured bankroll (default <span className="font-mono">$1,000</span>). Your
                  Total Starting Pool equals{' '}
                  <span className="font-mono">Tables × Players × Bankroll</span>.
                </dd>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">
                  Base Unit Bet &amp; Table Max Limit
                </dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  <strong>Base Bet:</strong> Minimum <span className="font-mono">1x</span> wager
                  unit. Players with less than 1 base unit left are marked <strong>Ruined</strong>.
                  <br />
                  <strong>Table Max Bet:</strong> Caps any single wager (or check{' '}
                  <strong>Unlimited</strong>). Shows how table caps break Martingale recovery.
                </dd>
              </div>
            </dl>
          </section>

          {/* 3. Streak Trigger & Target Direction */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-bold border-b border-[var(--t-border-soft)] pb-1.5">
              3. Streak Trigger &amp; Target Color Direction
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-[13px]">
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">
                  Wait for Consecutive Same-Color Spins (0, 1x–5x)
                </dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  Choose <span className="font-mono">0</span> to bet immediately on every spin, or{' '}
                  <span className="font-mono">1x–5x</span> to wait until that many Reds or Blacks
                  land in a row before betting. Landing on Green (<span className="font-mono">0</span>{' '}
                  or <span className="font-mono">00</span>) resets the active streak to zero.
                </dd>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <dt className="font-semibold text-[var(--t-text)]">Target Color Direction</dt>
                <dd className="text-[var(--t-muted)] mt-1">
                  <strong>Bet Opposite Color:</strong> Classic Gambler&apos;s Fallacy (e.g., 3 Reds{' '}
                  &rarr; bet Black).
                  <br />
                  <strong>Bet Same Color:</strong> Rides the streak (e.g., 3 Reds &rarr; bet Red).
                  <br />
                  <strong>Always Bet Red / Black:</strong> Always bets that fixed color when
                  triggered.
                </dd>
              </div>
            </dl>
          </section>

          {/* 4. Betting Progression Systems */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-bold border-b border-[var(--t-border-soft)] pb-1.5">
              4. Betting Progression Systems (Even-Money 1:1 Payouts)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-[13px]">
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">Martingale</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Doubles bet after every loss (<span className="font-mono">1x, 2x, 4x, 8x...</span>)
                  and resets to <span className="font-mono">1x</span> after a win.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">Flat Betting</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Always wagers <span className="font-mono">1x</span> base unit regardless of wins
                  or losses.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">Grand Martingale</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Doubles bet plus adds 1 extra unit on each loss (
                  <span className="font-mono">1x, 3x, 7x, 15x...</span>); resets on win.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">Reverse Martingale (Paroli)</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Doubles bet after each win up to 3 consecutive wins, then resets; returns to{' '}
                  <span className="font-mono">1x</span> on loss.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">Fibonacci</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Follows <span className="font-mono">1, 1, 2, 3, 5, 8, 13...</span> forward 1 step
                  on loss and back 2 steps on win.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--t-border)] bg-[var(--t-input)]">
                <div className="font-semibold text-[var(--t-text)]">D&apos;Alembert</div>
                <p className="text-[var(--t-muted)] mt-1">
                  Increases by <span className="font-mono">+1</span> unit after a loss and decreases
                  by <span className="font-mono">-1</span> unit (minimum{' '}
                  <span className="font-mono">1x</span>) after a win.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Controls, Spin Log & Readouts */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-bold border-b border-[var(--t-border-soft)] pb-1.5">
              5. Controls, Spin Log, Exports &amp; Audio
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px] text-[var(--t-muted)] list-disc pl-5">
              <li>
                <strong className="text-[var(--t-text)]">Execution Toolbar:</strong> Use{' '}
                <strong>Start / Pause / Resume</strong> for continuous runs,{' '}
                <strong>Step (+1 Spin)</strong> to inspect one spin at a time, or{' '}
                <strong>1-Click Experiments</strong> (<strong>Short Spurt 150</strong>,{' '}
                <strong>Long Run 100,000</strong>, or <strong>Run Custom</strong> for any spin
                count up to 1,000,000).
              </li>
              <li>
                <strong className="text-[var(--t-text)]">Execution Rate:</strong> Adjust speed from{' '}
                <span className="font-mono">10 spins/sec</span> to{' '}
                <span className="font-mono">10,000 spins/sec</span> or <strong>Max Speed</strong>{' '}
                while keeping the bankroll ticker smooth at 60fps.
              </li>
              <li>
                <strong className="text-[var(--t-text)]">Color-Matched Spin Log:</strong> Red,
                Black, and Green numbers stream live right above the controls.{' '}
                <strong>Circled numbers</strong> mark spins where at least one bet was placed (hover
                to see Won/Lost); uncircled numbers were waiting spins.
              </li>
              <li>
                <strong className="text-[var(--t-text)]">Log Retention &amp; Export:</strong> Choose{' '}
                <em>All Spins</em>, <em>Last 10,000</em>, or <em>Last 50,000</em>, toggle{' '}
                <strong>Auto-Reset Log on New Run</strong>, or download clean{' '}
                <span className="font-mono">.txt</span> / color-matched{' '}
                <span className="font-mono">.html</span> reports.
              </li>
              <li>
                <strong className="text-[var(--t-text)]">
                  Save as Default, Palettes &amp; Bell Chime:
                </strong>{' '}
                Your parameters and chosen <strong>Color Palette</strong> (6 themes) auto-save in
                your browser. When a run finishes or all players bust, a synthesized 3-tone bell
                plays and a Final Verdict Banner compares your Peak Profit against your Ending Pool.
              </li>
            </ul>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-[var(--t-border)] bg-[var(--t-subtle)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: theme.accentFg }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
