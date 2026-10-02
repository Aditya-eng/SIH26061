/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Heatmap } from '../components/charts.jsx';
import { Card, Eyebrow, Grid, H1, H3, Lede, Note, Reveal, Row, SnapSlider, Small, Source } from '../components/ui.jsx';
import { fmt } from '../theme.js';

function mix(a, b, f) {
  const p = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)},${Math.round(g1 + (g2 - g1) * f)},${Math.round(b1 + (b2 - b1) * f)})`;
}

export default function Sizing({ sizing }) {
  const t = useTheme();
  const g = sizing.grid;
  const cfg = sizing.configured;
  const [pv, setPv] = useState(cfg.pv_kwp);
  const [wind, setWind] = useState(cfg.wind_kw);
  const [batt, setBatt] = useState(cfg.battery_kwh);

  const find = (p, w, b) => sizing.rows.find((r) => r.pv_kwp === p && r.wind_kw === w && r.battery_kwh === b);
  const row = find(pv, wind, batt);
  const base = find(cfg.pv_kwp, cfg.wind_kw, cfg.battery_kwh);
  const usable = sizing.usable_l;

  const smallestSafe = useMemo(() => {
    const safe = sizing.rows.filter((r) => r.years_dry === 0);
    safe.sort((a, b) => a.pv_kwp + a.wind_kw + 0.25 * a.battery_kwh - (b.pv_kwp + b.wind_kw + 0.25 * b.battery_kwh));
    return safe[0];
  }, [sizing.rows]);

  const scaleMax = Math.max(...sizing.rows.map((r) => r.worst_l), usable) * 1.05;
  const pos = (v) => `${(v / scaleMax) * 100}%`;
  const safe = row.years_dry === 0;

  return (
    <>
      <Reveal>
        <Eyebrow>Design Maitri II</Eyebrow>
        <H1>How much sun, wind and battery does the new station need?</H1>
        <Lede>
          Maitri II is approved and planned as a green station. Slide the sizes below and see how much diesel the season would need
          across eight real past winters — and in how many of them a {fmt(sizing.tank_l)} L tank would run dry.
        </Lede>
      </Reveal>

      <Grid cols="1fr 1.25fr" gap="18px">
        <Card>
          <Row justify="space-between">
            <H3>Station size</H3>
            <Source kind="measured" />
          </Row>
          <div css={css`display: flex; flex-direction: column; gap: 22px; margin-top: 18px;`}>
            <SnapSlider label="Solar panels" unit="kWp" values={g.pv_kwp} value={pv} onChange={setPv} />
            <SnapSlider label="Wind turbines" unit="kW" values={g.wind_kw} value={wind} onChange={setWind} />
            <SnapSlider label="Battery" unit="kWh" values={g.battery_kwh} value={batt} onChange={setBatt} />
          </div>
          <Row gap="8px" css={css`margin-top: 18px;`}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setPv(cfg.pv_kwp);
                setWind(cfg.wind_kw);
                setBatt(cfg.battery_kwh);
              }}
              css={css`font: inherit; font-size: 13px; font-weight: 650; border: 1px solid ${t.color.lineStrong}; background: ${t.color.surface}; border-radius: 999px; padding: 7px 13px; cursor: pointer;`}
            >
              Back to the modelled station
            </motion.button>
            {smallestSafe && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setPv(smallestSafe.pv_kwp);
                  setWind(smallestSafe.wind_kw);
                  setBatt(smallestSafe.battery_kwh);
                }}
                css={css`font: inherit; font-size: 13px; font-weight: 650; border: 0; color: #fff; background: ${t.color.accent}; border-radius: 999px; padding: 7px 13px; cursor: pointer;`}
              >
                Smallest that never runs dry
              </motion.button>
            )}
          </Row>
        </Card>

        <Card>
          <H3>Diesel needed from 1 Feb to 30 Aug</H3>
          <motion.div
            key={`${pv}-${wind}-${batt}`}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            css={css`margin-top: 10px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;`}
          >
            <span css={css`font-size: 40px; font-weight: 780; letter-spacing: -0.03em; color: ${safe ? t.color.good : t.color.ink}; font-variant-numeric: tabular-nums;`}>
              {fmt(row.mean_l)} L
            </span>
            <span css={css`font-size: 14px; color: ${t.color.muted};`}>in an average winter</span>
          </motion.div>
          <div
            css={css`
              display: inline-block;
              margin-top: 8px;
              padding: 6px 12px;
              border-radius: 999px;
              font-size: 14px;
              font-weight: 700;
              background: ${safe ? t.color.goodSoft : row.years_dry >= row.years / 2 ? t.color.badSoft : t.color.warnSoft};
              color: ${safe ? t.color.good : row.years_dry >= row.years / 2 ? t.color.bad : t.color.warn};
            `}
          >
            {safe ? `Never runs dry in ${row.years} past winters` : `Runs dry in ${row.years_dry} of ${row.years} past winters`}
          </div>

          <div css={css`position: relative; height: 54px; margin-top: 26px;`}>
            <div css={css`position: absolute; top: 20px; left: 0; right: 0; height: 10px; border-radius: 999px; background: ${t.color.sunken};`} />
            <motion.div
              initial={false}
              animate={{ left: pos(row.best_l), width: `calc(${pos(row.worst_l)} - ${pos(row.best_l)})` }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              css={css`position: absolute; top: 20px; height: 10px; border-radius: 999px; background: ${safe ? t.color.good : t.color.warn}; opacity: 0.75;`}
            />
            <div css={css`position: absolute; top: 8px; bottom: 6px; left: ${pos(usable)}; border-left: 2px dashed ${t.color.bad};`} />
            <div css={css`position: absolute; top: -8px; left: ${pos(usable)}; transform: translateX(-50%); font-size: 11.5px; font-weight: 650; color: ${t.color.bad}; white-space: nowrap;`}>
              usable fuel {fmt(usable)} L
            </div>
            <div css={css`position: absolute; top: 34px; left: 0; font-size: 11.5px; color: ${t.color.muted};`}>
              best winter {fmt(row.best_l)} L · worst {fmt(row.worst_l)} L
            </div>
          </div>
          <Small>
            Compared with the modelled station ({fmt(cfg.pv_kwp)} kWp, {fmt(cfg.wind_kw)} kW, {fmt(cfg.battery_kwh)} kWh, which needs{' '}
            {fmt(base.mean_l)} L and runs dry in {base.years_dry} of {base.years} winters):{' '}
            <b>{row.mean_l <= base.mean_l ? `${fmt(base.mean_l - row.mean_l)} L less` : `${fmt(row.mean_l - base.mean_l)} L more`}</b> diesel a season.
          </Small>
        </Card>
      </Grid>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>Every combination at {fmt(batt)} kWh of battery</H3>
            <Small css={css`margin: 0;`}>Cell = average season diesel (thousand litres). Colour = winters that run dry.</Small>
          </Row>
          <div css={css`margin-top: 12px;`}>
            <Heatmap
              rows={g.pv_kwp}
              cols={g.wind_kw}
              rowLabel="Solar kWp"
              colLabel="Wind kW"
              selected={[pv, wind]}
              onSelect={(r, c) => {
                setPv(r);
                setWind(c);
              }}
              cell={(r, c) => {
                const x = find(r, c, batt);
                return { ...x, display: fmt(x.mean_l / 1000, 0) };
              }}
              color={(x) => mix('#dff3ea', '#f6c9c2', x.years_dry / x.years)}
              legend={(x) => `${fmt(x.mean_l)} L average, dry in ${x.years_dry}/${x.years} winters`}
            />
          </div>
        </Card>
      </Reveal>

      <Note tone="warn" title="How this is calculated">
        For each size, the station model is run from the February ship to 30 August ({sizing.season_days} days) in each of {sizing.years.length}{' '}
        real winters ({sizing.years[0]}–{sizing.years[sizing.years.length - 1]}, ERA5). Daily diesel need is estimated with a simple
        operating rule, not the full optimiser, so treat these as planning numbers. The full optimiser would use somewhat less.
      </Note>
    </>
  );
}
