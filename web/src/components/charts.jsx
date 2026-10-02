/** @jsxImportSource @emotion/react */
// Composable SVG charts, in the spirit of Bklit UI: a chart is assembled from a frame plus
// series (Line, Area, Stack, Bars, Bands, HRule, Cursor) rather than configured through one
// monolithic component. One scale places every mark, tick and label. Motion draws paths in.
import { css, useTheme } from '@emotion/react';
import { motion, useReducedMotion } from 'motion/react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fmt } from '../theme.js';

const Ctx = createContext(null);
const useScales = () => useContext(Ctx);

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceMax(v) {
  if (!v || v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s + 1e-9);
  return step * p;
}

export function Chart({
  n,
  yMax,
  yMin = 0,
  height = 280,
  xLabel,
  xTicks = [],
  yTicks = 4,
  yFormat = (v) => fmt(v),
  yUnit,
  hover,
  onHover,
  tooltip,
  children,
}) {
  const t = useTheme();
  const [ref, width] = useWidth();
  const pad = { l: 52, r: 16, t: 14, b: 30 };
  const top = niceMax(yMax);
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const x = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - ((v - yMin) / (top - yMin)) * ih;
  // pick a tick count whose step is a round number (1, 2, 2.5 or 5 x 10^k)
  const isNice = (v) => {
    const p = 10 ** Math.floor(Math.log10(v));
    return [1, 2, 2.5, 5, 10].some((m) => Math.abs(v / p - m) < 1e-6);
  };
  const count = [yTicks, 4, 5, 3, 6, 2].find((k) => isNice((top - yMin) / k)) ?? yTicks;
  const ticks = Array.from({ length: count + 1 }, (_, k) => yMin + ((top - yMin) * k) / count);

  const scales = useMemo(() => ({ x, y, n, pad, iw, ih, width, height, top }), [width, height, n, top, yMin]);

  const handleMove = (e) => {
    if (!onHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.l) / iw) * (n - 1));
    onHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div ref={ref} css={css`position: relative; width: 100%;`}>
      <svg
        width={width}
        height={height}
        role="img"
        onMouseMove={handleMove}
        onMouseLeave={() => onHover && onHover(null)}
        css={css`display: block; overflow: visible; touch-action: pan-y;`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} stroke={t.color.line} strokeWidth="1" />
            <text x={pad.l - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11.5" fill={t.color.muted}>
              {yFormat(v)}
            </text>
          </g>
        ))}
        {yUnit && (
          <text x={pad.l + 6} y={pad.t + 12} textAnchor="start" fontSize="11" fill={t.color.muted}>
            {yUnit}
          </text>
        )}
        {xTicks.map(({ i, label }) => (
          <text key={`${i}-${label}`} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11.5" fill={t.color.muted}>
            {label}
          </text>
        ))}
        {xLabel && (
          <text x={width - pad.r} y={height - 8} textAnchor="end" fontSize="11" fill={t.color.muted}>
            {xLabel}
          </text>
        )}
        <Ctx.Provider value={scales}>{children}</Ctx.Provider>
        {hover !== null && hover !== undefined && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={t.color.ink} strokeOpacity="0.35" strokeDasharray="3 3" />
        )}
      </svg>
      {tooltip && hover !== null && hover !== undefined && (
        <div
          css={css`
            position: absolute;
            top: 6px;
            left: ${Math.min(Math.max(x(hover) + 12, pad.l), width - 230)}px;
            width: 216px;
            pointer-events: none;
            background: ${t.color.surface};
            border: 1px solid ${t.color.line};
            border-radius: 12px;
            box-shadow: ${t.shadow.lift};
            padding: 10px 12px;
            font-size: 12.5px;
            line-height: 1.5;
            color: ${t.color.text};
            z-index: 2;
          `}
        >
          {tooltip(hover)}
        </div>
      )}
    </div>
  );
}

function linePath(values, x, y) {
  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v === null || v === undefined || Number.isNaN(v)) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d || 'M0,0';
}

function areaPath(lower, upper, x, y) {
  const n = upper.length;
  let d = `M${x(0)},${y(upper[0] ?? 0)}`;
  for (let i = 1; i < n; i += 1) d += `L${x(i).toFixed(1)},${y(upper[i] ?? 0).toFixed(1)}`;
  for (let i = n - 1; i >= 0; i -= 1) d += `L${x(i).toFixed(1)},${y(lower[i] ?? 0).toFixed(1)}`;
  return `${d}Z`;
}

export function Line({ values, color, width = 2.2, dashed = false, opacity = 1 }) {
  const { x, y } = useScales();
  const reduce = useReducedMotion();
  const d = linePath(values, x, y);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? '6 5' : undefined}
      initial={reduce || dashed ? false : { pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

export function Area({ values, color, opacity = 0.14 }) {
  const { x, y } = useScales();
  const zero = values.map(() => 0);
  return <path d={areaPath(zero, values, x, y)} fill={color} fillOpacity={opacity} />;
}

/** Stacked areas, bottom to top in the order given. */
export function Stack({ series }) {
  const { x, y } = useScales();
  let lower = series[0].values.map(() => 0);
  return series.map((s) => {
    const upper = s.values.map((v, i) => lower[i] + (v || 0));
    const d = areaPath(lower, upper, x, y);
    lower = upper;
    return (
      <motion.path
        key={s.label}
        d={d}
        fill={s.color}
        fillOpacity={0.85}
        initial={false}
        animate={{ d }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
    );
  });
}

export function Bars({ values, color, opacity = 0.9 }) {
  const { x, y, iw, n } = useScales();
  const bw = Math.max(1, (iw / Math.max(1, n)) * 0.7);
  return values.map((v, i) =>
    v > 0 ? (
      <motion.rect
        key={i}
        x={x(i) - bw / 2}
        width={bw}
        y={y(v)}
        height={Math.max(0, y(0) - y(v))}
        rx={Math.min(2, bw / 2)}
        fill={color}
        fillOpacity={opacity}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        style={{ originY: 1 }}
        transition={{ duration: 0.6, delay: Math.min(i * 0.004, 0.6) }}
      />
    ) : null,
  );
}

/** Shade the x-ranges where mask[i] is truthy. */
export function Bands({ mask, color, opacity = 0.1 }) {
  const { x, pad, ih, n } = useScales();
  const half = n > 1 ? (x(1) - x(0)) / 2 : 0;
  const out = [];
  let s = null;
  mask.forEach((m, i) => {
    if (m && s === null) s = i;
    if ((!m || i === mask.length - 1) && s !== null) {
      const e = m ? i : i - 1;
      out.push(<rect key={s} x={x(s) - half} width={x(e) - x(s) + 2 * half} y={pad.t} height={ih} fill={color} fillOpacity={opacity} />);
      s = null;
    }
  });
  return out;
}

export function HRule({ y: value, color, label }) {
  const { y, pad, width } = useScales();
  return (
    <g>
      <line x1={pad.l} x2={width - pad.r} y1={y(value)} y2={y(value)} stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
      {label && (
        <text x={pad.l + 6} y={y(value) - 6} textAnchor="start" fontSize="11.5" fontWeight="600" fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Cursor({ index, color }) {
  const { x, pad, ih } = useScales();
  if (index === null || index === undefined) return null;
  return (
    <motion.line
      initial={false}
      animate={{ x1: x(index), x2: x(index) }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      y1={pad.t}
      y2={pad.t + ih}
      stroke={color}
      strokeWidth="2"
    />
  );
}

export function Dot({ index, value, color }) {
  const { x, y } = useScales();
  if (index === null || index === undefined || value === null || value === undefined) return null;
  return (
    <motion.circle
      initial={false}
      animate={{ cx: x(index), cy: y(value) }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      r="5"
      fill="#fff"
      stroke={color}
      strokeWidth="2.5"
    />
  );
}

/** A fuel tank that drains. The level is the real remaining litres on the chosen day. */
export function Tank({ litres, capacity, reserve, color, label, sub }) {
  const t = useTheme();
  const frac = Math.max(0, Math.min(1, litres / capacity));
  const reserveFrac = reserve / capacity;
  const low = litres <= reserve;
  return (
    <div css={css`display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 96px;`}>
      <div
        css={css`
          position: relative;
          width: 76px;
          height: 190px;
          border-radius: 22px;
          background: ${t.color.sunken};
          border: 2px solid ${t.color.lineStrong};
          overflow: hidden;
        `}
      >
        <motion.div
          initial={false}
          animate={{ height: `${frac * 100}%`, backgroundColor: low ? t.color.bad : color }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          css={css`position: absolute; left: 0; right: 0; bottom: 0; opacity: 0.88;`}
        />
        <div
          css={css`
            position: absolute;
            left: 0;
            right: 0;
            bottom: ${reserveFrac * 100}%;
            border-top: 2px dashed ${t.color.bad};
            opacity: 0.7;
          `}
        />
      </div>
      <div css={css`font-weight: 720; font-size: 14px; color: ${t.color.ink}; text-align: center;`}>{label}</div>
      <div css={css`font-size: 13px; color: ${low ? t.color.bad : t.color.muted}; font-variant-numeric: tabular-nums; text-align: center;`}>
        {sub}
      </div>
    </div>
  );
}

/** Two-way grid of cells coloured by a value - used for the sizing map. */
export function Heatmap({ rows, cols, cell, rowLabel, colLabel, selected, onSelect, color, legend }) {
  const t = useTheme();
  return (
    <div css={css`overflow-x: auto;`}>
      <table css={css`border-collapse: separate; border-spacing: 4px; font-size: 12.5px; font-variant-numeric: tabular-nums;`}>
        <thead>
          <tr>
            <th css={css`text-align: left; color: ${t.color.muted}; font-weight: 600; padding: 0 6px 0 0;`}>
              {rowLabel} ↓ / {colLabel} →
            </th>
            {cols.map((c) => (
              <th key={c} css={css`color: ${t.color.muted}; font-weight: 600; padding: 2px 4px;`}>{fmt(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th css={css`text-align: right; color: ${t.color.muted}; font-weight: 600; padding-right: 6px;`}>{fmt(r)}</th>
              {cols.map((c) => {
                const v = cell(r, c);
                const isSel = selected && selected[0] === r && selected[1] === c;
                return (
                  <td key={c}>
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      onClick={() => onSelect(r, c)}
                      title={legend(v)}
                      css={css`
                        width: 54px;
                        height: 34px;
                        border-radius: 8px;
                        border: ${isSel ? `2px solid ${t.color.ink}` : '1px solid rgba(15,27,45,0.06)'};
                        background: ${color(v)};
                        color: ${t.color.ink};
                        font: inherit;
                        font-weight: 650;
                        cursor: pointer;
                      `}
                    >
                      {v.display}
                    </motion.button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
