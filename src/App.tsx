import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Palette,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Volume2,
  VolumeX,
  Zap,
  TrendingDown,
} from 'lucide-react';
import { BankrollHero } from './components/BankrollHero';
import { ConfigPanel } from './components/ConfigPanel';
import { InstructionsModal } from './components/InstructionsModal';
import { KpiAndTables } from './components/KpiAndTables';
import { SpinLogPanel } from './components/SpinLogPanel';
import { TrajectoryChart } from './components/TrajectoryChart';
import { RouletteSimulationEngine } from './engine/rouletteEngine';
import { LogRetentionCap, SimulationConfig, SimulationSnapshot } from './engine/types';
import { soundEngine } from './utils/soundEngine';
import {
  applyPaletteToDocument,
  PALETTE_ORDER,
  PALETTE_THEMES,
  PaletteId,
} from './utils/themes';

const DEFAULT_CONFIG: SimulationConfig = {
  numTables: 1,
  wheelType: 'european',
  playersPerTable: 10,
  startingBankroll: 1000,
  baseBet: 10,
  tableMaxBet: 500,
  unlimitedMaxBet: false,
  streakTriggerLength: 3,
  targetDirection: 'opposite',
  strategy: 'martingale',
  totalSpins: 10000,
  spinsPerSecond: 500,
  maxSpeed: false,
  logRetentionCap: 'all',
  autoResetLog: true,
};

const STORAGE_KEY = 'mc_roulette_saved_settings_v1';
const PALETTE_STORAGE_KEY = 'mc_roulette_palette_v1';

function loadSavedConfig(): SimulationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SimulationConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      numTables: Math.max(1, Math.min(10, Number(parsed.numTables) || DEFAULT_CONFIG.numTables)),
      playersPerTable: Math.max(
        1,
        Math.min(50, Number(parsed.playersPerTable) || DEFAULT_CONFIG.playersPerTable)
      ),
      startingBankroll: Math.max(
        10,
        Math.min(1000000, Number(parsed.startingBankroll) || DEFAULT_CONFIG.startingBankroll)
      ),
      baseBet: Math.max(1, Math.min(10000, Number(parsed.baseBet) || DEFAULT_CONFIG.baseBet)),
      totalSpins: Math.max(
        1,
        Math.min(1000000, Number(parsed.totalSpins) || DEFAULT_CONFIG.totalSpins)
      ),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadSavedPalette(): PaletteId {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY) as PaletteId | null;
    if (raw && raw in PALETTE_THEMES) return raw;
  } catch {
    // Ignore storage errors
  }
  return 'gold';
}

function saveConfigToStorage(cfg: SimulationConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore storage quota errors
  }
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [config, setConfig] = useState<SimulationConfig>(() => loadSavedConfig());
  const [paletteId, setPaletteId] = useState<PaletteId>(() => loadSavedPalette());
  const theme = PALETTE_THEMES[paletteId];

  useEffect(() => {
    applyPaletteToDocument(theme);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
    } catch {
      // Ignore
    }
  }, [theme, paletteId]);

  const engineRef = useRef<RouletteSimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new RouletteSimulationEngine(config);
  }

  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() =>
    engineRef.current!.getSnapshot()
  );
  const [selectedTable, setSelectedTable] = useState<number>(0);
  const [recentSpins, setRecentSpins] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [customSpinsStr, setCustomSpinsStr] = useState<string>(() => String(config.totalSpins));
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const spinAccRef = useRef<number>(0);
  const configRef = useRef<SimulationConfig>(config);
  configRef.current = config;

  const selectedTableRef = useRef<number>(selectedTable);
  selectedTableRef.current = selectedTable;

  const syncFromEngine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const snap = engine.getSnapshot();
    setSnapshot(snap);
    const safeTable = Math.min(selectedTableRef.current, Math.max(0, snap.tables.length - 1));
    setRecentSpins(engine.getRecentLogSpins(safeTable, 2000));
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    const engine = engineRef.current;
    if (!engine) return;

    engine.setStatus('running');
    lastTimeRef.current = performance.now();
    spinAccRef.current = 0;
    syncFromEngine();

    const tick = (now: number) => {
      const eng = engineRef.current;
      if (!eng || eng.getStatus() !== 'running') {
        rafRef.current = null;
        return;
      }

      const dtSec = Math.min(0.1, Math.max(0, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const cfg = configRef.current;
      let finished = false;

      if (cfg.maxSpeed) {
        const deadline = performance.now() + 11;
        let totalBatch = 0;
        const maxFrameSpins = Math.max(2000, Math.floor(cfg.totalSpins / 40));
        while (performance.now() < deadline && totalBatch < maxFrameSpins) {
          const chunk = Math.min(1000, maxFrameSpins - totalBatch);
          finished = eng.stepSpins(chunk);
          totalBatch += chunk;
          if (finished) break;
        }
      } else {
        spinAccRef.current += dtSec * cfg.spinsPerSecond;
        const wholeSpins = Math.floor(spinAccRef.current);
        if (wholeSpins >= 1) {
          spinAccRef.current -= wholeSpins;
          finished = eng.stepSpins(wholeSpins);
        }
      }

      syncFromEngine();

      if (finished) {
        soundEngine.playOutcomeSound(eng.getSnapshot().netProfit);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoop, syncFromEngine]);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  const handleStartOrResume = () => {
    soundEngine.unlock();
    const engine = engineRef.current;
    if (!engine) return;

    const currentStatus = engine.getStatus();
    if (currentStatus === 'running') {
      stopLoop();
      engine.setStatus('paused');
      syncFromEngine();
      return;
    }

    if (currentStatus === 'completed' || currentStatus === 'busted') {
      engine.reset(config.autoResetLog);
    } else if (currentStatus === 'idle' && config.autoResetLog) {
      engine.clearLogsOnly();
    }

    startLoop();
  };

  const handleStep = () => {
    soundEngine.unlock();
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.getStatus() === 'running') {
      stopLoop();
      engine.setStatus('paused');
    }

    if (engine.getStatus() === 'completed' || engine.getStatus() === 'busted') {
      engine.reset(config.autoResetLog);
    } else if (engine.getStatus() === 'idle' && config.autoResetLog) {
      engine.clearLogsOnly();
    }

    const prevPool = engine.getSnapshot().currentTotalPool;
    const finished = engine.stepSpins(1);
    const afterSnap = engine.getSnapshot();
    if (!finished) {
      engine.setStatus('paused');
      if (afterSnap.currentTotalPool > prevPool) {
        soundEngine.playStepOutcome(true);
      } else if (afterSnap.currentTotalPool < prevPool) {
        soundEngine.playStepOutcome(false);
      }
    } else {
      soundEngine.playOutcomeSound(afterSnap.netProfit);
    }
    syncFromEngine();
  };

  const handleReset = () => {
    stopLoop();
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset(config.autoResetLog);
    syncFromEngine();
  };

  const handleChangeStructural = (patch: Partial<SimulationConfig>) => {
    stopLoop();
    const next = { ...config, ...patch };
    setConfig(next);
    saveConfigToStorage(next);
    if (patch.totalSpins !== undefined) {
      setCustomSpinsStr(String(patch.totalSpins));
    }
    if (next.numTables - 1 < selectedTable) {
      setSelectedTable(0);
    }
    engineRef.current?.updateConfig(next, true);
    syncFromEngine();
  };

  const handleChangeLive = (patch: Partial<SimulationConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveConfigToStorage(next);
    engineRef.current?.updateConfig(next, false);
    if (patch.logRetentionCap !== undefined) {
      syncFromEngine();
    }
  };

  const handleSaveAsDefault = () => {
    saveConfigToStorage(config);
  };

  const handleResetFactoryDefault = () => {
    stopLoop();
    setConfig(DEFAULT_CONFIG);
    setCustomSpinsStr(String(DEFAULT_CONFIG.totalSpins));
    saveConfigToStorage(DEFAULT_CONFIG);
    setSelectedTable(0);
    engineRef.current?.updateConfig(DEFAULT_CONFIG, true);
    syncFromEngine();
  };

  const runComparisonPreset = (presetType: 'short' | 'long') => {
    soundEngine.unlock();
    stopLoop();
    const patch: Partial<SimulationConfig> =
      presetType === 'short'
        ? { totalSpins: 150, spinsPerSecond: 60, maxSpeed: false }
        : { totalSpins: 100000, spinsPerSecond: 10000, maxSpeed: true };

    const next = { ...config, ...patch };
    setConfig(next);
    configRef.current = next;

    const engine = engineRef.current;
    if (!engine) return;
    engine.updateConfig(next, true);
    if (next.autoResetLog) {
      engine.clearLogsOnly();
    }
    startLoop();
  };

  const runCustomSpinsExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customSpinsStr.replace(/,/g, ''), 10);
    const clamped = Math.max(
      1,
      Math.min(1000000, Number.isFinite(parsed) ? parsed : config.totalSpins)
    );
    setCustomSpinsStr(String(clamped));

    soundEngine.unlock();
    stopLoop();

    const next: SimulationConfig = { ...config, totalSpins: clamped };
    setConfig(next);
    saveConfigToStorage(next);
    configRef.current = next;

    const engine = engineRef.current;
    if (!engine) return;
    engine.updateConfig(next, true);
    if (next.autoResetLog) {
      engine.clearLogsOnly();
    }
    startLoop();
  };

  const handleSelectTable = (idx: number) => {
    setSelectedTable(idx);
    selectedTableRef.current = idx;
    const engine = engineRef.current;
    if (engine) {
      setRecentSpins(engine.getRecentLogSpins(idx, 2000));
    }
  };

  const handleClearLog = () => {
    engineRef.current?.clearLogsOnly();
    syncFromEngine();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.unlock();
    }
  };

  const handleTestBell = () => {
    soundEngine.unlock();
    soundEngine.playBellChime(true);
  };

  const handleDownloadTxt = () => {
    if (!engineRef.current) return;
    const content = engineRef.current.generateTxtExport();
    triggerDownload(content, 'roulette-spin-log.txt', 'text/plain;charset=utf-8');
  };

  const handleDownloadHtml = () => {
    if (!engineRef.current) return;
    const content = engineRef.current.generateHtmlExport();
    triggerDownload(content, 'roulette-spin-log.html', 'text/html;charset=utf-8');
  };

  const isRunning = snapshot.status === 'running';
  const isPaused = snapshot.status === 'paused';
  const isFinished = snapshot.status === 'completed' || snapshot.status === 'busted';

  return (
    <div className="min-h-screen bg-[var(--t-canvas)] text-[var(--t-text)] flex flex-col transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur border-b border-[var(--t-border)]"
        style={{ backgroundColor: theme.headerBg }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
          <a
            href="#simulation"
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--t-text)] whitespace-nowrap shrink-0"
          >
            Monte Carlo Roulette
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--t-muted)]">
            <a
              href="#simulation"
              className="hover:text-[var(--t-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Bankroll Counter
            </a>
            <a
              href="#spin-log"
              className="hover:text-[var(--t-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Spin Log
            </a>
            <a
              href="#trajectory"
              className="hover:text-[var(--t-text)] transition-colors whitespace-nowrap shrink-0"
            >
              Trajectory
            </a>
            {config.numTables > 1 && (
              <a
                href="#tables"
                className="hover:text-[var(--t-text)] transition-colors whitespace-nowrap shrink-0"
              >
                Tables
              </a>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 hover:opacity-90"
              style={{
                backgroundColor: theme.accent,
                borderColor: theme.accent,
                color: theme.accentFg,
              }}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Instructions</span>
            </button>

            {/* 6-Palette Theme Drop-Down List (DDL) */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)]">
              <Palette className="w-3.5 h-3.5 text-[var(--t-muted)] shrink-0" aria-hidden="true" />
              <select
                aria-label="Color Palette"
                value={paletteId}
                onChange={(e) => setPaletteId(e.target.value as PaletteId)}
                className="text-xs font-medium bg-transparent text-[var(--t-text)] focus:outline-none cursor-pointer pr-1"
              >
                {PALETTE_ORDER.map((id) => (
                  <option
                    key={id}
                    value={id}
                    style={{ backgroundColor: theme.surface, color: theme.text }}
                  >
                    {PALETTE_THEMES[id].label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleTestBell}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Test Bell</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0"
              style={
                isMuted
                  ? {
                      backgroundColor: theme.lossBg,
                      borderColor: theme.lossBorder,
                      color: theme.lossText,
                    }
                  : {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.muted,
                    }
              }
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Aggregate Bankroll Counter & Verdict */}
        <BankrollHero snapshot={snapshot} config={config} theme={theme} />

        {/* Color-Matched Spin Log & File Export */}
        <SpinLogPanel
          config={config}
          theme={theme}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          recentSpins={recentSpins}
          logCounts={snapshot.logCounts}
          onClearLog={handleClearLog}
          onToggleAutoReset={(val) => handleChangeLive({ autoResetLog: val })}
          onChangeLogCap={(cap: LogRetentionCap) => handleChangeLive({ logRetentionCap: cap })}
          onDownloadTxt={handleDownloadTxt}
          onDownloadHtml={handleDownloadHtml}
        />

        {/* Execution Toolbar & Comparison Presets */}
        <div
          className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          style={{ boxShadow: theme.glowShadow }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartOrResume}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap"
              style={
                isRunning
                  ? { backgroundColor: '#D97706', color: '#FFFFFF' }
                  : { backgroundColor: theme.accent, color: theme.accentFg }
              }
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Resume</span>
                </>
              ) : isFinished ? (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Run Again</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Start Simulation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStep}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-text)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap"
            >
              <StepForward className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Step (+1 Spin)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--t-border)] bg-[var(--t-surface)] text-[var(--t-muted)] hover:bg-[var(--t-subtle)] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          {/* 1-Click Variance vs. Law of Large Numbers Comparison Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--t-dim)] mr-1">
              1-Click Experiments:
            </span>
            <button
              type="button"
              onClick={() => runComparisonPreset('short')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{
                backgroundColor: theme.profitBg,
                borderColor: theme.profitBorder,
                color: theme.profitText,
              }}
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Short Spurt (150 Spins)</span>
            </button>
            <button
              type="button"
              onClick={() => runComparisonPreset('long')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{
                backgroundColor: theme.lossBg,
                borderColor: theme.lossBorder,
                color: theme.lossText,
              }}
            >
              <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Long Run (100,000 Spins)</span>
            </button>

            <form
              onSubmit={runCustomSpinsExperiment}
              className="inline-flex items-center rounded-lg border border-[var(--t-border)] bg-[var(--t-input)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--t-accent)]"
            >
              <input
                type="number"
                min={1}
                max={1000000}
                value={customSpinsStr}
                onChange={(e) => setCustomSpinsStr(e.target.value)}
                aria-label="Custom number of simulated spins"
                placeholder="Spins"
                className="w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums text-[var(--t-text)] bg-[var(--t-input)] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.accentFg,
                }}
              >
                <Play className="w-3 h-3" aria-hidden="true" />
                <span>Run Custom</span>
              </button>
            </form>
          </div>
        </div>

        {/* Two-Column Workbench: Config Deck + Live Visualization Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 xl:col-span-3">
            <ConfigPanel
              config={config}
              status={snapshot.status}
              theme={theme}
              onChangeStructural={handleChangeStructural}
              onChangeLive={handleChangeLive}
              onSaveAsDefault={handleSaveAsDefault}
              onResetFactoryDefault={handleResetFactoryDefault}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            <TrajectoryChart snapshot={snapshot} theme={theme} />
            <KpiAndTables snapshot={snapshot} config={config} theme={theme} />
          </div>
        </div>
      </main>

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        theme={theme}
      />
    </div>
  );
}
