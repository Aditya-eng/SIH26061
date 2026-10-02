/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Bands, Chart, Cursor, Line, Stack } from '../components/charts.jsx';
import { Card, Eyebrow, Grid, H1, H3, Lede, Note, Reveal, Row, Segmented, Small, Source } from '../components/ui.jsx';
import { controllerById } from '../data.js';
import { fmt, fmtDate } from '../theme.js';

function explain(w, s, i) {
  const parts = [];
  const load = w.load_kw[i];
  // wind and sun are what was available; battery and diesel are what was dispatched
  const offered = [
    ['wind', w.wind_kw[i]],
    ['the sun', w.pv_kw[i]],
  ].filter(([, v]) => v > 0.5);
  const dispatched = [
    ['the battery', w.discharge_kw[i]],
    ['diesel', w.gen_kw[i]],
  ].filter(([, v]) => v > 0.5);
  parts.push(`The station needed ${fmt(load, 0)} kW.`);
  parts.push(
    offered.length
      ? `${offered.map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)} offered ${fmt(v, 0)} kW`).join(' and ')}.`
      : 'Wind and sun offered nothing.',
  );
  if (dispatched.length) parts.push(`The rest came from ${dispatched.map(([k, v]) => `${k} (${fmt(v, 0)} kW)`).join(' and ')}.`);
  if (w.charge_kw[i] > 0.5) parts.push(`Spare power topped up the battery by ${fmt(w.charge_kw[i], 0)} kW.`);
  if (w.clean_air_window[i]) {
    parts.push(
      w.gen_kw[i] > 0.5
        ? 'Wind was carrying exhaust toward the air samplers, but a generator still had to run.'
        : 'Wind was carrying exhaust toward the air samplers, so the generators stayed off.',
    );
  }
  if (w.unserved_critical_kwh[i] > 0.01) parts.push(`${fmt(w.unserved_critical_kwh[i], 1)} kWh of critical load went unserved.`);
  if (s) parts.push(`Outside it was ${fmt(s.temp, 1)} °C with ${fmt(s.wind, 1)} m/s of wind.`);
  return parts.join(' ');
}

export default function Week({ season, station }) {
  const t = useTheme();
  const ids = Object.keys(season.week);
  const [who, setWho] = useState('C');
  const [hour, setHour] = useState(null);
  const [pinned, setPinned] = useState(30);
  const w = season.week[who];
  const n = w.time.length;
  const i = hour ?? pinned;

  // weather for the same hours, joined on timestamp from the station file
  const wx = useMemo(() => {
    const idx = new Map(station.hourly.time.map((tt, k) => [tt, k]));
    return w.time.map((tt) => {
      const k = idx.get(tt.replace(' ', 'T'));
      return k === undefined ? null : { temp: station.hourly.temp_c[k], wind: station.hourly.wind_ms[k] };
    });
  }, [w.time, station]);

  const dayTicks = w.time
    .map((tt, k) => ({ tt, k }))
    .filter(({ tt }) => tt.endsWith('00:00'))
    .map(({ tt, k }) => ({ i: k, label: fmtDate(tt.replace(' ', 'T'), { weekday: 'short', day: 'numeric' }) }));

  const maxSupply = Math.max(
    ...ids.flatMap((id) => season.week[id].load_kw.map((l, k) =>
      Math.max(l, season.week[id].wind_kw[k] + season.week[id].pv_kw[k] + season.week[id].discharge_kw[k] + season.week[id].gen_kw[k]))),
  );
  const totals = (key) => w[key].reduce((a, b) => a + (b || 0), 0);
  const caHours = w.clean_air_window.reduce((a, b) => a + b, 0);
  const caViol = w.clean_air_violation.reduce((a, b) => a + b, 0);

  return (
    <>
      <Reveal>
        <Eyebrow>Hour by hour</Eyebrow>
        <H1>One week in the polar night</H1>
        <Lede>
          {fmtDate(season.week_start, { day: 'numeric', month: 'long' })} to{' '}
          {fmtDate(w.time[n - 1].replace(' ', 'T'), { day: 'numeric', month: 'long', year: 'numeric' })}. The sun barely rises, so
          wind, battery and diesel carry the station. Pick a controller and point at any hour to see what it did — and why.
        </Lede>
      </Reveal>

      <Card>
        <Row justify="space-between">
          <Segmented
            value={who}
            onChange={setWho}
            options={ids.map((id) => ({ value: id, label: controllerById(season, id).name, dot: t.controller[id] }))}
          />
          <Row gap="6px">
            <Source kind="measured" />
            <Source kind="optimised" />
          </Row>
        </Row>

        <Row gap="16px" css={css`margin-top: 14px; font-size: 13px; color: ${t.color.text};`}>
          {[
            ['Wind', t.supply.wind],
            ['Sun', t.supply.pv],
            ['Battery', t.supply.battery],
            ['Diesel', t.supply.diesel],
          ].map(([l, c]) => (
            <span key={l} css={css`display: inline-flex; align-items: center; gap: 6px;`}>
              <span css={css`width: 12px; height: 12px; border-radius: 3px; background: ${c};`} />
              {l}
            </span>
          ))}
          <span css={css`display: inline-flex; align-items: center; gap: 6px;`}>
            <span css={css`width: 16px; border-top: 2.5px dotted ${t.color.ink};`} />
            Demand
          </span>
          <span css={css`display: inline-flex; align-items: center; gap: 6px;`}>
            <span css={css`width: 12px; height: 12px; border-radius: 3px; background: ${t.color.bad}; opacity: 0.25;`} />
            Wind toward air samplers
          </span>
        </Row>

        <div css={css`margin-top: 10px;`} onClick={() => hour !== null && setPinned(hour)}>
          <Chart n={n} yMax={maxSupply} height={300} yUnit="kW" xTicks={dayTicks} hover={hour} onHover={setHour}>
            <Bands mask={w.clean_air_window} color={t.color.bad} opacity={0.12} />
            <Stack
              series={[
                { label: 'wind', values: w.wind_kw, color: t.supply.wind },
                { label: 'pv', values: w.pv_kw, color: t.supply.pv },
                { label: 'battery', values: w.discharge_kw, color: t.supply.battery },
                { label: 'diesel', values: w.gen_kw, color: t.supply.diesel },
              ]}
            />
            <Line values={w.load_kw} color={t.color.ink} width={2} dashed />
            {hour === null && <Cursor index={pinned} color={t.color.accent} />}
          </Chart>
        </div>

        <div css={css`margin-top: 6px;`}>
          <Small css={css`margin: 0 0 4px;`}>Battery charge</Small>
          <Chart n={n} yMax={100} height={120} yUnit="%" xTicks={dayTicks} yTicks={2} hover={hour} onHover={setHour}>
            <Line values={w.soc_frac.map((v) => v * 100)} color={t.controller[who]} width={2.4} />
            {hour === null && <Cursor index={pinned} color={t.color.accent} />}
          </Chart>
        </div>
      </Card>

      <Grid cols="1.4fr 1fr">
        <Card>
          <Row justify="space-between">
            <H3>
              {fmtDate(w.time[i].replace(' ', 'T'), { weekday: 'long', day: 'numeric', month: 'short' })}, {w.time[i].slice(11)}
            </H3>
            <span css={css`font-size: 12.5px; color: ${t.color.muted};`}>{hour === null ? 'pinned hour' : 'hovering'}</span>
          </Row>
          <AnimatePresence mode="wait">
            <motion.p
              key={`${who}-${i}`}
              initial={{ y: 4 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.18 }}
              css={css`font-size: 15.5px; line-height: 1.6; color: ${t.color.text}; margin: 10px 0 0;`}
            >
              {explain(w, wx[i], i)}
            </motion.p>
          </AnimatePresence>
          <Small>Point at the chart to read any hour; click to pin it.</Small>
        </Card>
        <Card>
          <H3>This week, {controllerById(season, who).name}</H3>
          <div css={css`margin-top: 10px; font-size: 14px; line-height: 1.9; font-variant-numeric: tabular-nums;`}>
            <Row justify="space-between"><span>Diesel generated</span><b>{fmt(totals('gen_kw'))} kWh</b></Row>
            <Row justify="space-between"><span>Wind available</span><b>{fmt(totals('wind_kw'))} kWh</b></Row>
            <Row justify="space-between"><span>Battery discharged</span><b>{fmt(totals('discharge_kw'))} kWh</b></Row>
            <Row justify="space-between">
              <span>Clean-air hours with a generator on</span>
              <b css={css`color: ${caViol ? t.color.warn : t.color.good};`}>{caViol} of {caHours}</b>
            </Row>
            <Row justify="space-between">
              <span>Critical energy lost</span>
              <b css={css`color: ${totals('unserved_critical_kwh') > 0.01 ? t.color.bad : t.color.good};`}>
                {fmt(totals('unserved_critical_kwh'), 1)} kWh
              </b>
            </Row>
          </div>
        </Card>
      </Grid>

      <Note tone="sky" title="Why only one week">
        The engine stores every controller&apos;s hour-by-hour log for this one week; the full season is kept as daily totals (on the
        previous page). Both come from the same runs, so the numbers agree.
      </Note>
    </>
  );
}
