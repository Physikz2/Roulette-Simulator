import React, { useState } from 'react';
import {
  BettingStrategy,
  SimulationConfig,
  SimulationStatus,
  TargetDirection,
} from '../engine/types';
import { STRATEGY_META } from '../engine/rouletteEngine';
import { PaletteTheme } from '../utils/themes';

interface ConfigPanelProps {
  config: SimulationConfig;
  status: SimulationStatus;
  theme: PaletteTheme;
  onChangeStructural: (patch: Partial<SimulationConfig>) => void;
  onChangeLive: (patch: Partial<SimulationConfig>) => void;
  onSaveAsDefault: () => void;
  onResetFactoryDefault: () => void;
}

const SPIN_PRESETS = [
  { label: '100', value: 100 },
  { label: '1,000', value: 1000 },
  { label: '10,000', value: 10000 },
  { label: '100,000', value: 100000 },
  { label: '1,000,000', value: 1000000 },
];

const SPEED_PRESETS = [
  { label: '10/s', value: 10, max: false },
  { label: '100/s', value: 100, max: false },
  { label: '1,000/s', value: 1000, max: false },
  { label: '10,000/s', value: 10000, max: false },
  { label: 'Max', value: 10000, max: true },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  status,
  theme,
  onChangeStructural,
  onChangeLive,
  onSaveAsDefault,
  onResetFactoryDefault,
}) => {
  const isRunning = status === 'running';
  const strategyInfo = STRATEGY_META[config.strategy];
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveClick = () => {
    onSaveAsDefault();
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1600);
  };

  return (
    <aside
      aria-label="Simulation Configuration"
      className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-5 space-y-5"
      style={{ boxShadow: theme.glowShadow }}
    >
      <div className="flex items-center justify-between border-b border-[var(--t-border-soft)] pb-3">
        <h2 className="text-base font-bold text-[var(--t-text)]">Simulation Parameters</h2>
        {isRunning && (
          <span className="text-xs font-medium text-[var(--t-dim)]">Pause to edit rules</span>
        )}
      </div>

      {/* 1. Multi-Table & Wheel */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-semibold text-[var(--t-dim)] tracking-wide">
          Tables & Wheel Geometry
        </h3>

        {/* Wheel Type Toggle */}
        <div>
          <label className="block text-xs font-medium text-[var(--t-muted)] mb-1.5">
            Wheel Standard
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--t-subtle)] rounded-lg">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeStructural({ wheelType: 'european' })}
              className="px-2.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap disabled:opacity-60"
              style={
                config.wheelType === 'european'
                  ? { backgroundColor: theme.surface, color: theme.text }
                  : { color: theme.muted }
              }
            >
              European (0) · 2.70%
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeStructural({ wheelType: 'american' })}
              className="px-2.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap disabled:opacity-60"
              style={
                config.wheelType === 'american'
                  ? { backgroundColor: theme.surface, color: theme.text }
                  : { color: theme.muted }
              }
            >
              American (0,00) · 5.26%
            </button>
          </div>
        </div>

        {/* Number of Tables */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label htmlFor="num-tables" className="font-medium text-[var(--t-muted)]">
              Parallel Tables
            </label>
            <span className="font-mono tabular-nums font-semibold text-[var(--t-text)]">
              {config.numTables} {config.numTables === 1 ? 'Table' : 'Tables'}
            </span>
          </div>
          <input
            id="num-tables"
            type="range"
            min={1}
            max={10}
            step={1}
            disabled={isRunning}
            value={config.numTables}
            onChange={(e) => onChangeStructural({ numTables: Number(e.target.value) })}
            className="w-full h-1.5 bg-[var(--t-subtle)] rounded-lg cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] font-mono text-[var(--t-dim)] mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <hr className="border-[var(--t-border-soft)]" />

      {/* 2. Players & Bankroll */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-semibold text-[var(--t-dim)] tracking-wide">
          Players & Bankroll Limits
        </h3>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label htmlFor="players-per-table" className="font-medium text-[var(--t-muted)]">
              Players per Table
            </label>
            <span className="font-mono tabular-nums font-semibold text-[var(--t-text)]">
              {config.playersPerTable} ({config.numTables * config.playersPerTable} total)
            </span>
          </div>
          <input
            id="players-per-table"
            type="range"
            min={1}
            max={50}
            step={1}
            disabled={isRunning}
            value={config.playersPerTable}
            onChange={(e) => onChangeStructural({ playersPerTable: Number(e.target.value) })}
            className="w-full h-1.5 bg-[var(--t-subtle)] rounded-lg cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] font-mono text-[var(--t-dim)] mt-1">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="starting-bankroll"
              className="block text-xs font-medium text-[var(--t-muted)] mb-1"
            >
              Bankroll / Player ($)
            </label>
            <input
              id="starting-bankroll"
              type="number"
              min={10}
              max={1000000}
              step={100}
              disabled={isRunning}
              value={config.startingBankroll}
              onChange={(e) => {
                const v = Math.max(10, Math.min(1000000, Number(e.target.value) || 100));
                onChangeStructural({ startingBankroll: v });
              }}
              className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="base-bet"
              className="block text-xs font-medium text-[var(--t-muted)] mb-1"
            >
              Base Unit Bet ($)
            </label>
            <input
              id="base-bet"
              type="number"
              min={1}
              max={10000}
              step={5}
              disabled={isRunning}
              value={config.baseBet}
              onChange={(e) => {
                const v = Math.max(1, Math.min(10000, Number(e.target.value) || 1));
                onChangeStructural({ baseBet: v });
              }}
              className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="max-bet" className="text-xs font-medium text-[var(--t-muted)]">
              Table Max Bet Limit ($)
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--t-muted)] cursor-pointer">
              <input
                type="checkbox"
                disabled={isRunning}
                checked={config.unlimitedMaxBet}
                onChange={(e) => onChangeStructural({ unlimitedMaxBet: e.target.checked })}
                className="rounded border-[var(--t-border)] accent-[var(--t-accent)]"
              />
              <span>Unlimited</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="max-bet"
              type="number"
              min={config.baseBet}
              max={10000000}
              step={50}
              disabled={isRunning || config.unlimitedMaxBet}
              value={config.tableMaxBet}
              onChange={(e) => {
                const v = Math.max(config.baseBet, Number(e.target.value) || config.baseBet);
                onChangeStructural({ tableMaxBet: v });
              }}
              className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-50"
            />
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeStructural({ tableMaxBet: 500, unlimitedMaxBet: false })}
              className="px-2.5 py-2 text-xs font-mono font-medium border border-[var(--t-border)] rounded-lg text-[var(--t-muted)] hover:bg-[var(--t-subtle)] whitespace-nowrap disabled:opacity-50"
            >
              $500
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeStructural({ tableMaxBet: 1000, unlimitedMaxBet: false })}
              className="px-2.5 py-2 text-xs font-mono font-medium border border-[var(--t-border)] rounded-lg text-[var(--t-muted)] hover:bg-[var(--t-subtle)] whitespace-nowrap disabled:opacity-50"
            >
              $1,000
            </button>
          </div>
        </div>
      </div>

      <hr className="border-[var(--t-border-soft)]" />

      {/* 3. Streak Trigger & Betting Strategy */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-semibold text-[var(--t-dim)] tracking-wide">
          Streak Trigger & Progression
        </h3>

        <div>
          <label className="block text-xs font-medium text-[var(--t-muted)] mb-1.5">
            Wait for Consecutive Same-Color Spins
          </label>
          <div className="grid grid-cols-6 gap-1 p-1 bg-[var(--t-subtle)] rounded-lg">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={isRunning}
                onClick={() => onChangeStructural({ streakTriggerLength: n })}
                className="py-1.5 text-xs font-mono font-semibold rounded-md transition-colors disabled:opacity-60"
                style={
                  config.streakTriggerLength === n
                    ? { backgroundColor: theme.surface, color: theme.text }
                    : { color: theme.muted }
                }
              >
                {n === 0 ? '0' : `${n}x`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--t-dim)] mt-1">
            {config.streakTriggerLength === 0
              ? 'Bet immediately on every spin (no waiting).'
              : `Wait for ${config.streakTriggerLength} Reds or ${config.streakTriggerLength} Blacks in a row. Green (0/00) resets count.`}
          </p>
        </div>

        <div>
          <label
            htmlFor="target-direction"
            className="block text-xs font-medium text-[var(--t-muted)] mb-1"
          >
            Target Color Direction
          </label>
          <select
            id="target-direction"
            disabled={isRunning}
            value={config.targetDirection}
            onChange={(e) =>
              onChangeStructural({ targetDirection: e.target.value as TargetDirection })
            }
            className="w-full px-2.5 py-2 text-xs font-medium bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-60"
          >
            <option value="opposite">Bet Opposite Color (Gambler&apos;s Fallacy)</option>
            <option value="same">Bet Same Color (Streak Riding)</option>
            <option value="fixed_red">Always Bet Red</option>
            <option value="fixed_black">Always Bet Black</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="strategy-select"
            className="block text-xs font-medium text-[var(--t-muted)] mb-1"
          >
            Betting Progression System
          </label>
          <select
            id="strategy-select"
            disabled={isRunning}
            value={config.strategy}
            onChange={(e) =>
              onChangeStructural({ strategy: e.target.value as BettingStrategy })
            }
            className="w-full px-2.5 py-2 text-xs font-medium bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-60"
          >
            {(Object.keys(STRATEGY_META) as BettingStrategy[]).map((key) => (
              <option key={key} value={key}>
                {STRATEGY_META[key].label} ({STRATEGY_META[key].shortFormula})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[var(--t-dim)] mt-1.5 leading-relaxed">
            {strategyInfo.description}
          </p>
        </div>
      </div>

      <hr className="border-[var(--t-border-soft)]" />

      {/* 4. Spin Count & Execution Speed */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-semibold text-[var(--t-dim)] tracking-wide">
          Horizon & Execution Speed
        </h3>

        <div>
          <label
            htmlFor="total-spins"
            className="block text-xs font-medium text-[var(--t-muted)] mb-1"
          >
            Total Simulated Spins (1 – 1,000,000)
          </label>
          <input
            id="total-spins"
            type="number"
            min={1}
            max={1000000}
            disabled={isRunning}
            value={config.totalSpins}
            onChange={(e) => {
              const v = Math.max(1, Math.min(1000000, Number(e.target.value) || 100));
              onChangeStructural({ totalSpins: v });
            }}
            className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-[var(--t-input)] border border-[var(--t-border)] rounded-lg text-[var(--t-text)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)] disabled:opacity-60"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SPIN_PRESETS.map((preset) => {
              const active = config.totalSpins === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={isRunning}
                  onClick={() => onChangeStructural({ totalSpins: preset.value })}
                  className="px-2 py-1 text-[11px] font-mono font-medium rounded border transition-colors whitespace-nowrap disabled:opacity-60"
                  style={
                    active
                      ? {
                          backgroundColor: theme.accent,
                          color: theme.accentFg,
                          borderColor: theme.accent,
                        }
                      : {
                          backgroundColor: theme.surface,
                          color: theme.muted,
                          borderColor: theme.border,
                        }
                  }
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label htmlFor="speed-slider" className="font-medium text-[var(--t-muted)]">
              Execution Rate
            </label>
            <span className="font-mono tabular-nums font-semibold text-[var(--t-text)]">
              {config.maxSpeed
                ? 'Max Speed'
                : `${config.spinsPerSecond.toLocaleString()} spins/sec`}
            </span>
          </div>
          <input
            id="speed-slider"
            type="range"
            min={1}
            max={4}
            step={0.05}
            disabled={config.maxSpeed}
            value={Math.log10(Math.max(10, Math.min(10000, config.spinsPerSecond)))}
            onChange={(e) => {
              const val = Math.round(Math.pow(10, Number(e.target.value)));
              onChangeLive({ spinsPerSecond: val, maxSpeed: false });
            }}
            className="w-full h-1.5 bg-[var(--t-subtle)] rounded-lg cursor-pointer disabled:opacity-40"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SPEED_PRESETS.map((preset) => {
              const active = preset.max
                ? config.maxSpeed
                : !config.maxSpeed && config.spinsPerSecond === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChangeLive({
                      spinsPerSecond: preset.value,
                      maxSpeed: preset.max,
                    })
                  }
                  className="px-2 py-1 text-[11px] font-mono font-medium rounded border transition-colors whitespace-nowrap"
                  style={
                    active
                      ? {
                          backgroundColor: theme.accent,
                          color: theme.accentFg,
                          borderColor: theme.accent,
                        }
                      : {
                          backgroundColor: theme.surface,
                          color: theme.muted,
                          borderColor: theme.border,
                        }
                  }
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <hr className="border-[var(--t-border-soft)]" />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleSaveClick}
          className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--t-border)] bg-[var(--t-subtle)] text-[var(--t-text)] hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {savedNotice ? 'Saved as Default' : 'Save as Default'}
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={onResetFactoryDefault}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          Factory Reset
        </button>
      </div>
    </aside>
  );
};
