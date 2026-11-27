export type PaletteId = 'white' | 'black' | 'neon' | 'fire' | 'green' | 'gold';

export interface PaletteTheme {
  id: PaletteId;
  label: string;
  isDark: boolean;
  canvas: string;
  surface: string;
  subtle: string;
  input: string;
  border: string;
  borderSoft: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  accentHover: string;
  accentFg: string;
  profitBg: string;
  profitBorder: string;
  profitText: string;
  lossBg: string;
  lossBorder: string;
  lossText: string;
  chartGrid: string;
  chartBaseline: string;
  chartLabel: string;
  chartProfitLine: string;
  chartProfitFill: string;
  chartLossLine: string;
  chartLossFill: string;
  headerBg: string;
  glowShadow: string;
}

export const PALETTE_THEMES: Record<PaletteId, PaletteTheme> = {
  white: {
    id: 'white',
    label: 'White Based',
    isDark: false,
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    subtle: '#F1F5F9',
    input: '#F8FAFC',
    border: '#E2E8F0',
    borderSoft: '#F1F5F9',
    text: '#0F172A',
    muted: '#475569',
    dim: '#64748B',
    accent: '#0F172A',
    accentHover: '#1E293B',
    accentFg: '#FFFFFF',
    profitBg: 'rgba(236, 253, 245, 0.75)',
    profitBorder: '#A7F3D0',
    profitText: '#047857',
    lossBg: 'rgba(254, 242, 242, 0.75)',
    lossBorder: '#FECACA',
    lossText: '#DC2626',
    chartGrid: '#E2E8F0',
    chartBaseline: '#0F172A',
    chartLabel: '#64748B',
    chartProfitLine: '#16A34A',
    chartProfitFill: 'rgba(22, 163, 74, 0.16)',
    chartLossLine: '#DC2626',
    chartLossFill: 'rgba(220, 38, 38, 0.14)',
    headerBg: 'rgba(255, 255, 255, 0.94)',
    glowShadow: 'none',
  },
  black: {
    id: 'black',
    label: 'Black Based',
    isDark: true,
    canvas: '#09090B',
    surface: '#141417',
    subtle: '#1F1F25',
    input: '#18181D',
    border: '#27272A',
    borderSoft: '#1E1E24',
    text: '#FAFAFA',
    muted: '#A1A1AA',
    dim: '#71717A',
    accent: '#F4F4F5',
    accentHover: '#E4E4E7',
    accentFg: '#09090B',
    profitBg: 'rgba(16, 185, 129, 0.12)',
    profitBorder: 'rgba(52, 211, 153, 0.35)',
    profitText: '#34D399',
    lossBg: 'rgba(239, 68, 68, 0.12)',
    lossBorder: 'rgba(248, 113, 113, 0.35)',
    lossText: '#F87171',
    chartGrid: '#27272A',
    chartBaseline: '#E4E4E7',
    chartLabel: '#A1A1AA',
    chartProfitLine: '#34D399',
    chartProfitFill: 'rgba(52, 211, 153, 0.18)',
    chartLossLine: '#F87171',
    chartLossFill: 'rgba(248, 113, 113, 0.18)',
    headerBg: 'rgba(20, 20, 23, 0.94)',
    glowShadow: 'none',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    isDark: true,
    canvas: '#050816',
    surface: '#0C1229',
    subtle: '#141D42',
    input: '#090E22',
    border: '#273570',
    borderSoft: '#1B2552',
    text: '#F0F9FF',
    muted: '#93C5FD',
    dim: '#7DD3FC',
    accent: '#22D3EE',
    accentHover: '#06B6D4',
    accentFg: '#04101B',
    profitBg: 'rgba(16, 185, 129, 0.16)',
    profitBorder: '#10B981',
    profitText: '#34D399',
    lossBg: 'rgba(244, 63, 94, 0.16)',
    lossBorder: '#F43F5E',
    lossText: '#FB7185',
    chartGrid: '#1E2959',
    chartBaseline: '#22D3EE',
    chartLabel: '#93C5FD',
    chartProfitLine: '#22D3EE',
    chartProfitFill: 'rgba(34, 211, 238, 0.18)',
    chartLossLine: '#F43F5E',
    chartLossFill: 'rgba(244, 63, 94, 0.2)',
    headerBg: 'rgba(12, 18, 41, 0.94)',
    glowShadow: '0 0 24px rgba(34, 211, 238, 0.12)',
  },
  fire: {
    id: 'fire',
    label: 'Fire Based',
    isDark: true,
    canvas: '#160907',
    surface: '#24100C',
    subtle: '#361812',
    input: '#1C0C09',
    border: '#54261B',
    borderSoft: '#3D1B14',
    text: '#FFF7ED',
    muted: '#FDBA74',
    dim: '#FB923C',
    accent: '#F97316',
    accentHover: '#FB923C',
    accentFg: '#160907',
    profitBg: 'rgba(34, 197, 94, 0.14)',
    profitBorder: 'rgba(74, 222, 128, 0.4)',
    profitText: '#4ADE80',
    lossBg: 'rgba(239, 68, 68, 0.18)',
    lossBorder: 'rgba(248, 113, 113, 0.45)',
    lossText: '#FCA5A5',
    chartGrid: '#451E15',
    chartBaseline: '#FDBA74',
    chartLabel: '#FDBA74',
    chartProfitLine: '#4ADE80',
    chartProfitFill: 'rgba(74, 222, 128, 0.18)',
    chartLossLine: '#F97316',
    chartLossFill: 'rgba(249, 115, 22, 0.22)',
    headerBg: 'rgba(36, 16, 12, 0.94)',
    glowShadow: '0 0 24px rgba(249, 115, 22, 0.12)',
  },
  green: {
    id: 'green',
    label: 'Green Based',
    isDark: true,
    canvas: '#052214',
    surface: '#0A3320',
    subtle: '#11472D',
    input: '#072919',
    border: '#1B5E3D',
    borderSoft: '#134A30',
    text: '#ECFDF5',
    muted: '#A7F3D0',
    dim: '#6EE7B7',
    accent: '#34D399',
    accentHover: '#10B981',
    accentFg: '#032012',
    profitBg: 'rgba(16, 185, 129, 0.18)',
    profitBorder: 'rgba(52, 211, 153, 0.45)',
    profitText: '#6EE7B7',
    lossBg: 'rgba(239, 68, 68, 0.16)',
    lossBorder: 'rgba(248, 113, 113, 0.45)',
    lossText: '#FCA5A5',
    chartGrid: '#175235',
    chartBaseline: '#A7F3D0',
    chartLabel: '#A7F3D0',
    chartProfitLine: '#34D399',
    chartProfitFill: 'rgba(52, 211, 153, 0.22)',
    chartLossLine: '#F87171',
    chartLossFill: 'rgba(248, 113, 113, 0.2)',
    headerBg: 'rgba(10, 51, 32, 0.94)',
    glowShadow: '0 0 24px rgba(16, 185, 129, 0.12)',
  },
  gold: {
    id: 'gold',
    label: 'Royal Gold',
    isDark: true,
    canvas: '#0B1120',
    surface: '#131C31',
    subtle: '#1D2945',
    input: '#0F172A',
    border: '#2B3B5E',
    borderSoft: '#1E2A47',
    text: '#F8FAFC',
    muted: '#CBD5E1',
    dim: '#94A3B8',
    accent: '#F59E0B',
    accentHover: '#FBBF24',
    accentFg: '#0F172A',
    profitBg: 'rgba(16, 185, 129, 0.15)',
    profitBorder: 'rgba(52, 211, 153, 0.4)',
    profitText: '#34D399',
    lossBg: 'rgba(239, 68, 68, 0.15)',
    lossBorder: 'rgba(248, 113, 113, 0.4)',
    lossText: '#F87171',
    chartGrid: '#253352',
    chartBaseline: '#FBBF24',
    chartLabel: '#CBD5E1',
    chartProfitLine: '#34D399',
    chartProfitFill: 'rgba(52, 211, 153, 0.18)',
    chartLossLine: '#F87171',
    chartLossFill: 'rgba(248, 113, 113, 0.18)',
    headerBg: 'rgba(19, 28, 49, 0.94)',
    glowShadow: '0 0 24px rgba(245, 158, 11, 0.1)',
  },
};

export const PALETTE_ORDER: PaletteId[] = [
  'white',
  'black',
  'neon',
  'fire',
  'green',
  'gold',
];

export function applyPaletteToDocument(theme: PaletteTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-palette', theme.id);
  root.style.colorScheme = theme.isDark ? 'dark' : 'light';
  root.style.setProperty('--t-canvas', theme.canvas);
  root.style.setProperty('--t-surface', theme.surface);
  root.style.setProperty('--t-subtle', theme.subtle);
  root.style.setProperty('--t-input', theme.input);
  root.style.setProperty('--t-border', theme.border);
  root.style.setProperty('--t-border-soft', theme.borderSoft);
  root.style.setProperty('--t-text', theme.text);
  root.style.setProperty('--t-muted', theme.muted);
  root.style.setProperty('--t-dim', theme.dim);
  root.style.setProperty('--t-accent', theme.accent);
  root.style.setProperty('--t-accent-hover', theme.accentHover);
  root.style.setProperty('--t-accent-fg', theme.accentFg);
  root.style.setProperty('--t-profit-bg', theme.profitBg);
  root.style.setProperty('--t-profit-border', theme.profitBorder);
  root.style.setProperty('--t-profit-text', theme.profitText);
  root.style.setProperty('--t-loss-bg', theme.lossBg);
  root.style.setProperty('--t-loss-border', theme.lossBorder);
  root.style.setProperty('--t-loss-text', theme.lossText);
  root.style.setProperty('--t-header-bg', theme.headerBg);
  root.style.setProperty('--t-glow', theme.glowShadow);
}
