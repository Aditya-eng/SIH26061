/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Card, Eyebrow, Grid, H1, H2, H3, Lede, Note, Reveal, Row, Shimmer, Small, Source, Stat, Ticker } from '../components/ui.jsx';
import { Tank } from '../components/charts.jsx';
import { controllerById, firstDayBelow } from '../data.js';
import { fmt, fmtDate } from '../theme.js';

export default function Story({ season, station, go }) {
  const t = useTheme();
  const reduce = useReducedMotion();
  const B = controllerById(season, 'B');
  const C = controllerById(season, 'C');
  const D = controllerById(season, 'D');
  const fp = season.fuel_plan;
  const dates = season.daily.C.date;
  const last = dates.length - 1;

  // drain both tanks once, from the first scored day to the last
  const [day, setDay] = useState(reduce ? last : 0);
  useEffect(() => {
    if (reduce) return undefined;
    const c = animate(0, last, { duration: 4.2, ease: 'easeInOut', delay: 0.4, onUpdate: (v) => setDay(Math.round(v)) });
    return () => c.stop();
  }, [last, reduce]);

  const bReserveDay = firstDayBelow(season.daily.B.fuel_remaining_l, fp.reserve_floor_l);
  const bDryDay = firstDayBelow(season.daily.B.fuel_remaining_l, 1);
  const bLeft = season.daily.B.fuel_remaining_l[day];
  const cLeft = season.daily.C.fuel_remaining_l[day];

  return (
    <>
      <Reveal>
        <Grid cols="1.25fr 1fr" gap="26px" align="center">
          <div>
            <Eyebrow>SIH26061 · Ministry of Earth Sciences · NCPOR</Eyebrow>
            <H1>
              One fuel ship a year.
              <br />
              <Shimmer>Keep the science running.</Shimmer>
            </H1>
            <Lede>
              India&apos;s Antarctic station at Maitri gets fuel once a year. HIMSHAKTI decides, hour by hour, how to spend that one tank
              so critical power never runs out before the next ship — and so the station&apos;s own diesel smoke stays away from its
              own air samplers.
            </Lede>
            <Row gap="8px" css={css`margin-top: 16px;`}>
              <Source kind="measured" />
              <Source kind="modelled" />
              <Source kind="optimised" />
            </Row>
          </div>
          <Card>
            <Row justify="space-between" align="baseline">
              <H3>Same winter, same station, two tanks</H3>
              <span css={css`font-size: 13px; color: ${t.color.muted}; font-variant-numeric: tabular-nums;`}>
                {fmtDate(dates[day], { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </Row>
            <Row justify="space-around" align="flex-start" css={css`margin-top: 18px;`}>
              <Tank
                litres={bLeft}
                capacity={fp.tank_l}
                reserve={fp.reserve_floor_l}
                color={t.controller.B}
                label="Rule-based"
                sub={bLeft <= 1 ? 'Tank empty' : `${fmt(bLeft)} L left`}
              />
              <Tank
                litres={cLeft}
                capacity={fp.tank_l}
                reserve={fp.reserve_floor_l}
                color={t.controller.C}
                label="HIMSHAKTI"
                sub={`${fmt(cLeft)} L left`}
              />
            </Row>
            <Small css={css`text-align: center; margin: 14px auto 0;`}>
              Dashed line: the {fmt(fp.reserve_floor_l)} L emergency reserve.
              {bDryDay !== null && ` The rule-based tank is empty on ${fmtDate(dates[bDryDay])}.`}
            </Small>
          </Card>
        </Grid>
      </Reveal>

      <Reveal delay={0.05}>
        <Grid>
          <Stat label="Less diesel than a tuned rule-based operator" tone="accent" note={`${fmt(B.fuel_l - C.fuel_l)} litres over the season`}>
            <Ticker value={-C.fuel_vs_B_pct} nd={1} suffix="%" />
          </Stat>
          <Stat label="Times critical power failed" tone="good" note={`The rule-based operator failed ${B.critical_outage_events} times, losing ${fmt(B.unserved_critical_kwh)} kWh`}>
            <Ticker value={C.critical_outage_events} /> <span css={css`font-size: 20px; color: ${t.color.muted};`}>vs {B.critical_outage_events}</span>
          </Stat>
          <Stat label="Of the best result anyone could get" tone="sky" note={`Measured against a planner that knows the future perfectly (${fmt(D.fuel_l)} L)`}>
            <Ticker value={C.gap_to_oracle_closed_pct} suffix="%" />
          </Stat>
        </Grid>
      </Reveal>

      <Reveal>
        <Card>
          <H2>Why a polar station is a different problem</H2>
          <Grid css={css`margin-top: 16px;`}>
            {[
              ['One delivery a year', 'There is no fuel truck. Whatever is in the tank in February has to last until the ship comes back.'],
              ['Heat peaks in the dark', `Heating is the biggest load and it peaks in winter, when the sun is gone for weeks. In ${station.annual.year} the station's coldest hour was ${station.annual.min_temp_c} °C.`],
              ['Smoke spoils the science', 'Diesel exhaust drifting over the air samplers corrupts the very measurements the station exists to make.'],
            ].map(([title, body], i) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                css={css`background: ${t.color.sunken}; border-radius: ${t.radius.md}; padding: 16px;`}
              >
                <div css={css`font-size: 13px; font-weight: 700; color: ${t.color.accent};`}>0{i + 1}</div>
                <H3 css={css`margin-top: 4px;`}>{title}</H3>
                <Small>{body}</Small>
              </motion.div>
            ))}
          </Grid>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <H2>How HIMSHAKTI decides</H2>
          <Grid css={css`margin-top: 16px;`}>
            {[
              ['Forecast', 'forecast', 'A machine-learning model predicts load, sun and wind for the next 48 hours — and, just as importantly, how unsure it is.'],
              ['Budget', 'optimised', `Eight past winters set a daily fuel allowance, so a mild autumn is not allowed to spend August's fuel.`],
              ['Plan', 'optimised', 'Every 6 hours an optimiser chooses which generator runs, when the battery charges, and what can wait — inside that budget.'],
            ].map(([title, kind, body]) => (
              <div key={title} css={css`border: 1px solid ${t.color.line}; border-radius: ${t.radius.md}; padding: 16px;`}>
                <Row justify="space-between">
                  <H3>{title}</H3>
                  <Source kind={kind} />
                </Row>
                <Small>{body}</Small>
              </div>
            ))}
          </Grid>
          <Row gap="10px" css={css`margin-top: 18px;`}>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => go('season')} css={btn(t, true)}>
              Watch the whole winter →
            </motion.button>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => go('data')} css={btn(t, false)}>
              Where these numbers come from
            </motion.button>
          </Row>
        </Card>
      </Reveal>

      <Reveal>
        <Note tone="sky" title="What is real here">
          The weather is real: hourly ERA5 reanalysis at Maitri&apos;s coordinates for {season.window.test_year}. The station&apos;s
          electricity use is modelled from physics, because no polar station publishes its load data. Every result is the output
          of the controllers running on that weather — scored over {season.window.scored_days} days of a {season.window.window_days}
          -day window (the first {season.window.warmup_hours} hours are warm-up).
          {fp.binding &&
            ' The 99% survival target is a goal, not a promise: this tank cannot cover it in every past winter — see the data page.'}
        </Note>
      </Reveal>
    </>
  );
}

export const btn = (t, primary) => css`
  border: ${primary ? '0' : `1px solid ${t.color.lineStrong}`};
  cursor: pointer;
  font: inherit;
  font-weight: 680;
  font-size: 14.5px;
  padding: 11px 18px;
  border-radius: 999px;
  color: ${primary ? '#fff' : t.color.ink};
  background: ${primary ? t.color.accent : t.color.surface};
  box-shadow: ${primary ? '0 4px 14px rgba(15,143,128,0.25)' : 'none'};
  &:focus-visible {
    outline: 2px solid ${t.color.ink};
    outline-offset: 2px;
  }
`;
