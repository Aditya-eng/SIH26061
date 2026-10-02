// One palette for the whole console: a calm polar morning, not a control room.
// Controller colours are fixed so a reader learns them once: amber is the rule-based
// baseline, teal is ours, sky-blue dashed is the perfect-foresight ceiling.

export const theme = {
  color: {
    ground: '#f4f7fb',
    surface: '#ffffff',
    sunken: '#eef3f8',
    ink: '#0f1b2d',
    text: '#33445a',
    muted: '#66778c',
    line: '#e2e9f1',
    lineStrong: '#cfd9e4',
    accent: '#0f8f80',
    accentSoft: '#e3f4f1',
    sky: '#4a86d6',
    skySoft: '#e7f0fb',
    good: '#1e9466',
    goodSoft: '#e4f5ed',
    warn: '#c98216',
    warnSoft: '#fbf1df',
    bad: '#d9574b',
    badSoft: '#fbe9e7',
  },
  controller: {
    A: '#94a3b5',
    B: '#d99a2b',
    C: '#0f8f80',
    'C-point': '#8d7fd8',
    D: '#4a86d6',
  },
  supply: {
    wind: '#5aa7d8',
    pv: '#f0c24b',
    battery: '#8d7fd8',
    diesel: '#e07a5f',
  },
  font: {
    sans: '"Figtree Variable", "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace',
  },
  radius: { sm: '8px', md: '14px', lg: '20px', pill: '999px' },
  shadow: {
    card: '0 1px 2px rgba(15,27,45,0.04), 0 4px 16px rgba(15,27,45,0.05)',
    lift: '0 2px 4px rgba(15,27,45,0.05), 0 12px 32px rgba(15,27,45,0.09)',
  },
};

export const fmt = (x, nd = 0) =>
  x === null || x === undefined || Number.isNaN(x)
    ? '—'
    : Number(x).toLocaleString('en-IN', { minimumFractionDigits: nd, maximumFractionDigits: nd });

export const fmtDate = (iso, opts = { day: 'numeric', month: 'short' }) =>
  new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : `${iso}:00Z`).toLocaleDateString('en-GB', {
    ...opts,
    timeZone: 'UTC',
  });
