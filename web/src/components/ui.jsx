/** @jsxImportSource @emotion/react */
// UI primitives. Patterns borrowed, not copied: the sliding segmented control, morphing play
// button and rolling number from Watermelon UI's micro-interactions; the shimmer heading and
// lifting cards from Kokonut UI. Built here with Emotion + Motion instead of Tailwind so the
// console has one styling system and no utility-class build step.
import styled from '@emotion/styled';
import { css, keyframes, useTheme } from '@emotion/react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { fmt } from '../theme.js';

export const Page = styled.main`
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 22px 72px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

// shouldForwardProp: motion.section is a component, so Emotion would otherwise pass `tight` to the DOM
export const Card = styled(motion.section, { shouldForwardProp: (p) => p !== 'tight' })`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.line};
  border-radius: ${(p) => p.theme.radius.lg};
  box-shadow: ${(p) => p.theme.shadow.card};
  padding: ${(p) => (p.tight ? '16px 18px' : '22px 24px')};
  min-width: 0;
`;

export const Grid = styled.div`
  display: grid;
  gap: ${(p) => p.gap || '16px'};
  grid-template-columns: ${(p) => p.cols || 'repeat(auto-fit, minmax(220px, 1fr))'};
  align-items: ${(p) => p.align || 'stretch'};
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const Row = styled.div`
  display: flex;
  gap: ${(p) => p.gap || '12px'};
  align-items: ${(p) => p.align || 'center'};
  justify-content: ${(p) => p.justify || 'flex-start'};
  flex-wrap: wrap;
`;

export const Eyebrow = styled.div`
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(p) => p.color || p.theme.color.accent};
`;

export const H1 = styled.h1`
  font-size: clamp(30px, 4.4vw, 48px);
  line-height: 1.06;
  letter-spacing: -0.025em;
  font-weight: 760;
  color: ${(p) => p.theme.color.ink};
  margin: 6px 0 0;
  text-wrap: balance;
`;

export const H2 = styled.h2`
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.015em;
  font-weight: 720;
  color: ${(p) => p.theme.color.ink};
  margin: 0;
  text-wrap: balance;
`;

export const H3 = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.theme.color.ink};
  margin: 0;
`;

export const Lede = styled.p`
  font-size: 17px;
  line-height: 1.55;
  color: ${(p) => p.theme.color.text};
  margin: 10px 0 0;
  max-width: 64ch;
`;

export const Small = styled.p`
  font-size: 13.5px;
  line-height: 1.55;
  color: ${(p) => p.theme.color.muted};
  margin: 6px 0 0;
  max-width: 72ch;
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${(p) => p.theme.color.line};
  margin: 14px 0;
`;

/** Where a number comes from. Shown next to every figure that matters. */
const PROVENANCE = {
  measured: { label: 'Measured weather', tone: 'sky', title: 'ERA5 reanalysis (ECMWF), hourly, at the station grid point' },
  modelled: { label: 'Modelled station', tone: 'warn', title: 'Physics model of the station. No public electrical-load data exists for any polar station.' },
  optimised: { label: 'Optimised result', tone: 'accent', title: 'Output of the closed-loop controllers running on the measured weather' },
  forecast: { label: 'ML forecast', tone: 'violet', title: 'LightGBM quantile forecast, scored on an unseen year' },
};

export function Source({ kind }) {
  const t = useTheme();
  const p = PROVENANCE[kind];
  const tones = {
    sky: [t.color.skySoft, t.color.sky],
    warn: [t.color.warnSoft, t.color.warn],
    accent: [t.color.accentSoft, t.color.accent],
    violet: ['#efedfb', '#6f61c9'],
  };
  const [bg, fg] = tones[p.tone];
  return (
    <span
      title={p.title}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 650;
        padding: 3px 9px;
        border-radius: 999px;
        background: ${bg};
        color: ${fg};
        white-space: nowrap;
        cursor: help;
      `}
    >
      <span css={css`width: 6px; height: 6px; border-radius: 50%; background: ${fg};`} />
      {p.label}
    </span>
  );
}

const shimmer = keyframes`
  0% { background-position: 200% 50%; }
  100% { background-position: -200% 50%; }
`;

/** Kokonut-style shimmer: a slow gradient sweep across one accent phrase. */
export function Shimmer({ children }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  return (
    <span
      css={css`
        background: linear-gradient(100deg, ${t.color.accent} 20%, #46b8a6 40%, ${t.color.sky} 55%, ${t.color.accent} 80%);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        ${reduce ? css`animation: none;` : css`animation: ${shimmer} 7s linear infinite;`}
      `}
    >
      {children}
    </span>
  );
}

/** Rolls a number up from zero the first time it scrolls into view. */
export function Ticker({ value, nd = 0, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView || reduce) {
      setShown(value);
      return undefined;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return (
    <span ref={ref} css={css`font-variant-numeric: tabular-nums;`}>
      {prefix}
      {fmt(shown, nd)}
      {suffix}
    </span>
  );
}

/** Big-number tile. */
export function Stat({ label, children, note, tone }) {
  const t = useTheme();
  const colour = tone ? t.color[tone] : t.color.ink;
  return (
    <Card
      tight
      whileHover={{ y: -3, boxShadow: t.shadow.lift }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div css={css`font-size: 13px; font-weight: 600; color: ${t.color.muted};`}>{label}</div>
      <div
        css={css`
          font-size: 34px;
          font-weight: 760;
          letter-spacing: -0.03em;
          color: ${colour};
          margin-top: 4px;
          line-height: 1.1;
        `}
      >
        {children}
      </div>
      {note && <div css={css`font-size: 13px; color: ${t.color.muted}; margin-top: 6px; line-height: 1.45;`}>{note}</div>}
    </Card>
  );
}

/** Watermelon-style segmented control: the selection pill slides between options. */
export function Segmented({ options, value, onChange, size = 'md' }) {
  const t = useTheme();
  const id = useId();
  return (
    <div
      role="tablist"
      css={css`
        display: inline-flex;
        gap: 2px;
        padding: 4px;
        border-radius: 999px;
        background: ${t.color.sunken};
        border: 1px solid ${t.color.line};
        max-width: 100%;
        overflow-x: auto;
      `}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            css={css`
              position: relative;
              border: 0;
              background: none;
              cursor: pointer;
              font: inherit;
              font-size: ${size === 'sm' ? '13px' : '14px'};
              font-weight: 620;
              color: ${active ? t.color.ink : t.color.muted};
              padding: ${size === 'sm' ? '6px 12px' : '8px 16px'};
              border-radius: 999px;
              white-space: nowrap;
              transition: color 0.2s;
              &:focus-visible {
                outline: 2px solid ${t.color.accent};
                outline-offset: 2px;
              }
            `}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                css={css`
                  position: absolute;
                  inset: 0;
                  border-radius: 999px;
                  background: ${t.color.surface};
                  box-shadow: 0 1px 3px rgba(15, 27, 45, 0.1);
                `}
              />
            )}
            <span css={css`position: relative; display: inline-flex; align-items: center; gap: 7px;`}>
              {o.dot && <span css={css`width: 8px; height: 8px; border-radius: 50%; background: ${o.dot};`} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Play/pause that morphs between the two shapes instead of swapping icons. */
export function PlayButton({ playing, onClick, label }) {
  const t = useTheme();
  const play = 'M8 5 L19 12 L8 19 Z';
  const pause = 'M7 5 L10.5 5 L10.5 19 L7 19 Z M13.5 5 L17 5 L17 19 L13.5 19 Z';
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-label={playing ? 'Pause' : 'Play'}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 0;
        cursor: pointer;
        font: inherit;
        font-weight: 680;
        font-size: 14px;
        color: #fff;
        background: ${t.color.accent};
        padding: 9px 16px 9px 12px;
        border-radius: 999px;
        box-shadow: 0 4px 14px rgba(15, 143, 128, 0.28);
        &:focus-visible {
          outline: 2px solid ${t.color.ink};
          outline-offset: 2px;
        }
      `}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <motion.path
          fill="#fff"
          initial={false}
          animate={{ d: playing ? pause : play }}
          transition={{ duration: 0.25 }}
        />
      </svg>
      {label ?? (playing ? 'Pause' : 'Play the season')}
    </motion.button>
  );
}

/** Range slider that snaps to the values that were actually computed. */
export function SnapSlider({ label, unit, values, value, onChange }) {
  const t = useTheme();
  const idx = Math.max(0, values.indexOf(value));
  return (
    <label css={css`display: block;`}>
      <Row justify="space-between">
        <span css={css`font-size: 14px; font-weight: 640; color: ${t.color.ink};`}>{label}</span>
        <span css={css`font-size: 15px; font-weight: 720; color: ${t.color.accent}; font-variant-numeric: tabular-nums;`}>
          {fmt(value)} {unit}
        </span>
      </Row>
      <input
        type="range"
        min={0}
        max={values.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(values[Number(e.target.value)])}
        css={css`
          width: 100%;
          margin-top: 10px;
          accent-color: ${t.color.accent};
          cursor: pointer;
        `}
      />
      <Row justify="space-between">
        {values.map((v) => (
          <span key={v} css={css`font-size: 11.5px; color: ${v === value ? t.color.ink : t.color.muted};`}>
            {fmt(v)}
          </span>
        ))}
      </Row>
    </label>
  );
}

export function Chip({ active, color, onClick, children }) {
  const t = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={active}
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font: inherit;
        font-size: 13px;
        font-weight: 620;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid ${active ? color : t.color.line};
        background: ${active ? `${color}14` : t.color.surface};
        color: ${active ? t.color.ink : t.color.muted};
        transition: background 0.2s, border-color 0.2s;
      `}
    >
      <span
        css={css`
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${active ? color : t.color.lineStrong};
          transition: background 0.2s;
        `}
      />
      {children}
    </motion.button>
  );
}

export function Note({ tone = 'accent', title, children }) {
  const t = useTheme();
  const map = {
    accent: [t.color.accentSoft, t.color.accent],
    warn: [t.color.warnSoft, t.color.warn],
    sky: [t.color.skySoft, t.color.sky],
  };
  const [bg, fg] = map[tone];
  return (
    <div
      css={css`
        background: ${bg};
        border-radius: ${t.radius.md};
        padding: 14px 16px;
        font-size: 14px;
        line-height: 1.55;
        color: ${t.color.text};
      `}
    >
      {title && <div css={css`font-weight: 720; color: ${fg}; margin-bottom: 4px;`}>{title}</div>}
      {children}
    </div>
  );
}

/** Section wrapper: rests visible, nudges up a few pixels as it arrives. */
export function Reveal({ children, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
