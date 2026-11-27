import React, { useEffect, useRef, useState } from 'react';
import { SimulationSnapshot } from '../engine/types';
import { PaletteTheme } from '../utils/themes';

interface TrajectoryChartProps {
  snapshot: SimulationSnapshot;
  theme: PaletteTheme;
}

interface HoverInfo {
  x: number;
  y: number;
  spin: number;
  totalPool: number;
  net: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ snapshot, theme }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const { chartPoints, startingTotalPool, peakTotalPool, peakSpin, peakProfit, currentSpin } =
    snapshot;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(260, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const padLeft = 72;
      const padRight = 24;
      const padTop = 26;
      const padBottom = 34;
      const plotW = Math.max(10, width - padLeft - padRight);
      const plotH = Math.max(10, height - padTop - padBottom);

      let yMin = startingTotalPool;
      let yMax = startingTotalPool;
      for (let i = 0; i < chartPoints.length; i++) {
        const val = chartPoints[i].totalPool;
        if (val < yMin) yMin = val;
        if (val > yMax) yMax = val;
      }

      const span = yMax - yMin;
      const minPad = Math.max(startingTotalPool * 0.05, 50);
      const padAmt = span < minPad ? minPad : span * 0.12;
      const domainMin = Math.max(0, yMin - padAmt);
      const domainMax = yMax + padAmt;
      const domainRange = Math.max(1, domainMax - domainMin);

      const maxSpin = Math.max(1, chartPoints[chartPoints.length - 1]?.spin || 1, currentSpin);

      const xForSpin = (spin: number) => padLeft + (spin / maxSpin) * plotW;
      const yForPool = (pool: number) =>
        padTop + plotH - ((pool - domainMin) / domainRange) * plotH;

      // Grid lines
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const ticks = 4;
      for (let i = 0; i <= ticks; i++) {
        const val = domainMin + (domainRange * i) / ticks;
        const y = yForPool(val);
        ctx.strokeStyle = theme.chartGrid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();

        ctx.fillStyle = theme.chartLabel;
        ctx.fillText(`$${Math.round(val).toLocaleString()}`, padLeft - 10, y);
      }

      // X-axis labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xTicks = 5;
      for (let i = 0; i <= xTicks; i++) {
        const sp = Math.round((maxSpin * i) / xTicks);
        const x = xForSpin(sp);
        ctx.fillStyle = theme.chartLabel;
        ctx.fillText(sp.toLocaleString(), x, padTop + plotH + 10);
      }

      const baseY = yForPool(startingTotalPool);

      if (chartPoints.length >= 2) {
        // Above baseline (Profit)
        ctx.save();
        ctx.beginPath();
        ctx.rect(padLeft, padTop, plotW, Math.max(0, baseY - padTop));
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(xForSpin(chartPoints[0].spin), baseY);
        for (let i = 0; i < chartPoints.length; i++) {
          ctx.lineTo(xForSpin(chartPoints[i].spin), yForPool(chartPoints[i].totalPool));
        }
        ctx.lineTo(xForSpin(chartPoints[chartPoints.length - 1].spin), baseY);
        ctx.closePath();
        ctx.fillStyle = theme.chartProfitFill;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < chartPoints.length; i++) {
          const x = xForSpin(chartPoints[i].spin);
          const y = yForPool(chartPoints[i].totalPool);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = theme.chartProfitLine;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();

        // Below baseline (Loss)
        ctx.save();
        ctx.beginPath();
        ctx.rect(padLeft, baseY, plotW, Math.max(0, padTop + plotH - baseY));
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(xForSpin(chartPoints[0].spin), baseY);
        for (let i = 0; i < chartPoints.length; i++) {
          ctx.lineTo(xForSpin(chartPoints[i].spin), yForPool(chartPoints[i].totalPool));
        }
        ctx.lineTo(xForSpin(chartPoints[chartPoints.length - 1].spin), baseY);
        ctx.closePath();
        ctx.fillStyle = theme.chartLossFill;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < chartPoints.length; i++) {
          const x = xForSpin(chartPoints[i].spin);
          const y = yForPool(chartPoints[i].totalPool);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = theme.chartLossLine;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      }

      // Baseline dashed line
      ctx.save();
      ctx.strokeStyle = theme.chartBaseline;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, baseY);
      ctx.lineTo(padLeft + plotW, baseY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = theme.chartBaseline;
      ctx.font = '600 10px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        `Start $${startingTotalPool.toLocaleString()}`,
        padLeft + 6,
        Math.max(padTop + 12, baseY - 4)
      );

      // Peak marker
      if (peakSpin > 0 && peakProfit > 0) {
        const px = xForSpin(peakSpin);
        const py = yForPool(peakTotalPool);

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = theme.chartProfitLine;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.surface;
        ctx.stroke();

        const labelText = `Peak +$${Math.round(peakProfit).toLocaleString()} (#${peakSpin.toLocaleString()})`;
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        const textW = ctx.measureText(labelText).width;
        const labelX = Math.min(
          Math.max(px, padLeft + textW / 2 + 8),
          padLeft + plotW - textW / 2 - 8
        );
        const labelY = Math.max(padTop + 14, py - 12);

        ctx.fillStyle = theme.profitText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(labelText, labelX, labelY);
      }

      // Hover crosshair
      if (hoverInfo) {
        ctx.save();
        ctx.strokeStyle = theme.dim;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hoverInfo.x, padTop);
        ctx.lineTo(hoverInfo.x, padTop + plotH);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hoverInfo.x, hoverInfo.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = hoverInfo.net >= 0 ? theme.chartProfitLine : theme.chartLossLine;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = theme.surface;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [
    chartPoints,
    startingTotalPool,
    peakTotalPool,
    peakSpin,
    peakProfit,
    currentSpin,
    hoverInfo,
    theme,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || chartPoints.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    const padLeft = 72;
    const padRight = 24;
    const padTop = 26;
    const padBottom = 34;
    const plotW = Math.max(10, rect.width - padLeft - padRight);
    const plotH = Math.max(10, rect.height - padTop - padBottom);

    if (mouseX < padLeft || mouseX > padLeft + plotW) {
      setHoverInfo(null);
      return;
    }

    const maxSpin = Math.max(1, chartPoints[chartPoints.length - 1]?.spin || 1, currentSpin);
    const targetSpin = ((mouseX - padLeft) / plotW) * maxSpin;

    let lo = 0;
    let hi = chartPoints.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (chartPoints[mid].spin < targetSpin) lo = mid + 1;
      else hi = mid;
    }
    const candidateA = chartPoints[Math.max(0, lo - 1)];
    const candidateB = chartPoints[lo];
    const nearest =
      Math.abs(candidateA.spin - targetSpin) < Math.abs(candidateB.spin - targetSpin)
        ? candidateA
        : candidateB;

    let yMin = startingTotalPool;
    let yMax = startingTotalPool;
    for (let i = 0; i < chartPoints.length; i++) {
      if (chartPoints[i].totalPool < yMin) yMin = chartPoints[i].totalPool;
      if (chartPoints[i].totalPool > yMax) yMax = chartPoints[i].totalPool;
    }
    const span = yMax - yMin;
    const minPad = Math.max(startingTotalPool * 0.05, 50);
    const padAmt = span < minPad ? minPad : span * 0.12;
    const domainMin = Math.max(0, yMin - padAmt);
    const domainRange = Math.max(1, yMax + padAmt - domainMin);

    const x = padLeft + (nearest.spin / maxSpin) * plotW;
    const y = padTop + plotH - ((nearest.totalPool - domainMin) / domainRange) * plotH;

    setHoverInfo({
      x,
      y,
      spin: nearest.spin,
      totalPool: nearest.totalPool,
      net: nearest.totalPool - startingTotalPool,
    });
  };

  return (
    <div
      id="trajectory"
      className="rounded-xl border border-[var(--t-border)] bg-[var(--t-surface)] p-5"
      style={{ boxShadow: theme.glowShadow }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[var(--t-border-soft)]">
        <div>
          <h2 className="text-base font-bold text-[var(--t-text)]">
            Combined Bankroll Trajectory
          </h2>
          <p className="text-xs text-[var(--t-dim)] mt-0.5">
            Profit windows shaded above baseline · House-edge attrition shaded below
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--t-muted)] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs inline-block"
              style={{ backgroundColor: theme.chartProfitLine }}
              aria-hidden="true"
            />
            In Profit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs inline-block"
              style={{ backgroundColor: theme.chartLossLine }}
              aria-hidden="true"
            />
            Below Baseline
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full h-72 sm:h-80 mt-3">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
          className="w-full h-full block cursor-crosshair"
        />

        {chartPoints.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-[var(--t-surface)] border border-[var(--t-border)] rounded-lg px-4 py-2 text-xs text-[var(--t-muted)]">
              Press <strong className="text-[var(--t-text)]">Start</strong> or{' '}
              <strong className="text-[var(--t-text)]">Step (+1)</strong> to plot the live bankroll
              trajectory
            </div>
          </div>
        )}

        {hoverInfo && (
          <div
            className="pointer-events-none absolute top-2 right-3 rounded-md px-3 py-1.5 text-xs font-mono tabular-nums shadow-sm border border-[var(--t-border)]"
            style={{ backgroundColor: theme.subtle, color: theme.text }}
          >
            Spin #{hoverInfo.spin.toLocaleString()} · Pool $
            {Math.round(hoverInfo.totalPool).toLocaleString()} ·{' '}
            <span style={{ color: hoverInfo.net >= 0 ? theme.profitText : theme.lossText }}>
              {hoverInfo.net >= 0 ? '+' : '-'}$
              {Math.abs(Math.round(hoverInfo.net)).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
