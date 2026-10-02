/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { motion } from 'motion/react';
import { Card, Eyebrow, Grid, H1, H3, Lede, Note, Reveal, Row, Small, Source } from '../components/ui.jsx';
import { controllerById } from '../data.js';
import { fmt } from '../theme.js';

const COPY = {
  blizzard: {
    title: 'A four-day blizzard',
    body: 'No sun, turbines locked out above their wind limit, and heating demand up because it is even colder.',
  },
  genset_failure: {
    title: 'The big generator breaks',
    body: 'The 125 kW generator is out for 48 hours in the middle of winter. Only the small 60 kW unit is left.',
  },
  forecast_bust: {
    title: 'The forecast is badly wrong',
    body: 'For 12 hours the forecast promises a sunny, windy spell that never arrives. The weather itself is unchanged.',
  },
};

function Bar({ value, max, color, label, events }) {
  const t = useTheme();
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <Row justify="space-between">
        <span css={css`font-size: 13.5px; font-weight: 650; color: ${color};`}>{label}</span>
        <span css={css`font-size: 13.5px; font-variant-numeric: tabular-nums; color: ${value > 0 ? t.color.bad : t.color.good}; font-weight: 700;`}>
          {fmt(value, 1)} kWh{events !== undefined && ` · ${events} ${events === 1 ? 'failure' : 'failures'}`}
        </span>
      </Row>
      <div css={css`height: 12px; border-radius: 999px; background: ${t.color.sunken}; margin-top: 6px; overflow: hidden;`}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(value > 0 ? 3 : 0, pct)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          css={css`height: 100%; border-radius: 999px; background: ${color};`}
        />
      </div>
    </div>
  );
}

export default function Stress({ season }) {
  const t = useTheme();
  const C = controllerById(season, 'C');
  const entries = Object.entries(season.scenarios);
  const max = Math.max(...entries.flatMap(([, s]) => Object.values(s.controllers).map((m) => m.unserved_critical_kwh)), 1);

  return (
    <>
      <Reveal>
        <Eyebrow>When things go wrong</Eyebrow>
        <H1>Three bad days, tested on purpose</H1>
        <Lede>
          A plan that only works in good weather is not a plan. Each test below re-runs the same winter with one thing broken, and
          counts how much critical power — science instruments and life safety — the station lost.
        </Lede>
      </Reveal>

      <Grid>
        {entries.map(([id, s], k) => {
          const b = s.controllers.B;
          const c = s.controllers.C;
          return (
            <Reveal key={id} delay={k * 0.06}>
              <Card whileHover={{ y: -3, boxShadow: t.shadow.lift }} css={css`height: 100%;`}>
                <Row justify="space-between">
                  <H3>{COPY[id]?.title ?? s.label}</H3>
                  <Source kind="optimised" />
                </Row>
                <Small>{COPY[id]?.body ?? s.label}</Small>
                <div css={css`display: flex; flex-direction: column; gap: 14px; margin-top: 16px;`}>
                  {b ? (
                    <Bar value={b.unserved_critical_kwh} max={max} color={t.controller.B} label="Rule-based" events={b.critical_outage_events} />
                  ) : (
                    <Small css={css`margin: 0;`}>Only HIMSHAKTI uses a forecast, so only it can be fooled by one.</Small>
                  )}
                  <Bar value={c.unserved_critical_kwh} max={max} color={t.controller.C} label="HIMSHAKTI" events={c.critical_outage_events} />
                </div>
                {id === 'forecast_bust' && (
                  <Small>
                    Fuel used: {fmt(c.fuel_l)} L, against {fmt(C.fuel_l)} L with an accurate forecast. The plan is re-made every 6
                    hours, so a wrong forecast is corrected before it can do damage.
                  </Small>
                )}
                {id === 'genset_failure' && c.unserved_critical_kwh > 0 && (
                  <Small>Honest result: HIMSHAKTI degrades here too — one failure instead of three — but it does not escape unharmed.</Small>
                )}
              </Card>
            </Reveal>
          );
        })}
      </Grid>

      <Note tone="sky" title="How the tests are run">
        Same {season.window.scored_days}-day window, same tank, same station model. The blizzard and generator failure change what
        actually happens; the forecast test changes only what the controller is told. Every number comes from a full closed-loop run.
      </Note>
    </>
  );
}
