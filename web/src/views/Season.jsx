/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bars, Chart, Cursor, Dot, HRule, Line, Tank } from '../components/charts.jsx';
import { Card, Chip, Eyebrow, Grid, H1, H3, Lede, PlayButton, Reveal, Row, Small, Source } from '../components/ui.jsx';
import { controllerById, cumulative, firstDayBelow } from '../data.js';
import { fmt, fmtDate } from '../theme.js';

const ORDER = ['A', 'B', 'C', 'C-point', 'D'];

export default function Season({ season }) {
  const t = useTheme();
  const dates = season.daily.C.date;
  const n = dates.length;
  const fp = season.fuel_plan;
  const [shown, setShown] = useState({ A: false, B: true, C: true, 'C-point': false, D: true });
  const [day, setDay] = useState(n - 1);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => {
      setDay((d) => {
        if (d >= n - 1) {
          setPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, 45);
    return () => clearInterval(timer.current);
  }, [playing, n]);

  const togglePlay = () => {
    if (!playing && day >= n - 1) setDay(0);
    setPlaying((p) => !p);
  };

  const months = useMemo(
    () =>
      dates
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => d.endsWith('-01'))
        .map(({ d, i }) => ({ i, label: fmtDate(d, { month: 'short' }) })),
    [dates],
  );

  const cumB = cumulative(season.daily.B.unserved_critical_kwh);
  const cumC = cumulative(season.daily.C.unserved_critical_kwh);
  const bDry = firstDayBelow(season.daily.B.fuel_remaining_l, 1);
  const cursor = hover ?? day;

  return (
    <>
      <Reveal>
        <Eyebrow>The whole winter</Eyebrow>
        <H1>{season.window.scored_days} days, one tank, five ways to spend it</H1>
        <Lede>
          Every line below ran on exactly the same weather and the same station. Press play and watch where the fuel goes. The
          rule-based operator and the fixed schedule both empty the tank before the season ends; HIMSHAKTI does not.
        </Lede>
      </Reveal>

      <Card>
        <Row justify="space-between">
          <Row gap="8px">
            {ORDER.map((id) => (
              <Chip key={id} active={shown[id]} color={t.controller[id]} onClick={() => setShown((s) => ({ ...s, [id]: !s[id] }))}>
                {controllerById(season, id).name}
              </Chip>
            ))}
          </Row>
          <Row gap="10px">
            <PlayButton playing={playing} onClick={togglePlay} />
          </Row>
        </Row>

        <Grid cols="1fr 220px" gap="18px" css={css`margin-top: 16px;`}>
          <div>
            <Chart
              n={n}
              yMax={fp.tank_l}
              height={320}
              yUnit="litres"
              xTicks={months}
              hover={hover}
              onHover={setHover}
              tooltip={(i) => (
                <>
                  <div css={css`font-weight: 700; color: ${t.color.ink}; margin-bottom: 4px;`}>
                    {fmtDate(dates[i], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {ORDER.filter((id) => shown[id]).map((id) => (
                    <Row key={id} justify="space-between">
                      <span css={css`color: ${t.controller[id]}; font-weight: 650;`}>{controllerById(season, id).name}</span>
                      <span css={css`font-variant-numeric: tabular-nums;`}>{fmt(season.daily[id].fuel_remaining_l[i])} L</span>
                    </Row>
                  ))}
                </>
              )}
            >
              <HRule y={fp.reserve_floor_l} color={t.color.bad} label={`Emergency reserve ${fmt(fp.reserve_floor_l)} L`} />
              {ORDER.filter((id) => shown[id]).map((id) => (
                <Line
                  key={id}
                  values={season.daily[id].fuel_remaining_l}
                  color={t.controller[id]}
                  width={id === 'C' ? 3.2 : 2}
                  dashed={id === 'D'}
                />
              ))}
              <Cursor index={cursor} color={t.color.ink} />
              {shown.C && <Dot index={cursor} value={season.daily.C.fuel_remaining_l[cursor]} color={t.controller.C} />}
              {shown.B && <Dot index={cursor} value={season.daily.B.fuel_remaining_l[cursor]} color={t.controller.B} />}
            </Chart>
            <input
              type="range"
              min={0}
              max={n - 1}
              value={day}
              onChange={(e) => {
                setPlaying(false);
                setDay(Number(e.target.value));
              }}
              aria-label="Day of season"
              css={css`width: 100%; margin-top: 8px; accent-color: ${t.color.accent};`}
            />
            <Row justify="space-between">
              <Small css={css`margin: 0;`}>
                Day {day + 1} of {n} · {fmtDate(dates[day], { weekday: 'short', day: 'numeric', month: 'long' })}
              </Small>
              <Row gap="6px">
                <Source kind="measured" />
                <Source kind="optimised" />
              </Row>
            </Row>
          </div>

          <div css={css`display: flex; flex-direction: column; gap: 14px; align-items: center;`}>
            <Row justify="center" gap="14px" align="flex-start">
              <Tank
                litres={season.daily.B.fuel_remaining_l[day]}
                capacity={fp.tank_l}
                reserve={fp.reserve_floor_l}
                color={t.controller.B}
                label="Rule-based"
                sub={season.daily.B.fuel_remaining_l[day] <= 1 ? 'Empty' : `${fmt(season.daily.B.fuel_remaining_l[day])} L`}
              />
              <Tank
                litres={season.daily.C.fuel_remaining_l[day]}
                capacity={fp.tank_l}
                reserve={fp.reserve_floor_l}
                color={t.controller.C}
                label="HIMSHAKTI"
                sub={`${fmt(season.daily.C.fuel_remaining_l[day])} L`}
              />
            </Row>
            <div css={css`width: 100%; font-size: 13px; color: ${t.color.text}; line-height: 1.6;`}>
              <Row justify="space-between">
                <span>Critical energy lost so far</span>
              </Row>
              <Row justify="space-between">
                <span css={css`color: ${t.controller.B}; font-weight: 650;`}>Rule-based</span>
                <b css={css`color: ${cumB[day] > 0 ? t.color.bad : t.color.good};`}>{fmt(cumB[day], 1)} kWh</b>
              </Row>
              <Row justify="space-between">
                <span css={css`color: ${t.controller.C}; font-weight: 650;`}>HIMSHAKTI</span>
                <b css={css`color: ${cumC[day] > 0 ? t.color.bad : t.color.good};`}>{fmt(cumC[day], 1)} kWh</b>
              </Row>
            </div>
          </div>
        </Grid>
      </Card>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>When the rule-based operator ran short</H3>
            <Source kind="optimised" />
          </Row>
          <Small>
            Each bar is a day on which critical load — science instruments and life safety — went unserved. HIMSHAKTI had none.
            {bDry !== null && ` The rule-based tank ran dry on ${fmtDate(dates[bDry], { day: 'numeric', month: 'long' })}.`}
          </Small>
          <div css={css`margin-top: 10px;`}>
            <Chart
              n={n}
              yMax={Math.max(1, ...season.daily.B.unserved_critical_kwh)}
              height={170}
              yUnit="kWh"
              xTicks={months}
              yTicks={2}
            >
              <Bars values={season.daily.B.unserved_critical_kwh} color={t.controller.B} />
              <Bars values={season.daily.C.unserved_critical_kwh} color={t.controller.C} />
            </Chart>
          </div>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <H3>Every controller, the whole season</H3>
          <div css={css`overflow-x: auto; margin-top: 12px;`}>
            <table
              css={css`
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
                font-variant-numeric: tabular-nums;
                th,
                td {
                  padding: 10px 10px;
                  border-bottom: 1px solid ${t.color.line};
                  text-align: right;
                  white-space: nowrap;
                }
                th:first-of-type,
                td:first-of-type {
                  text-align: left;
                  white-space: normal;
                }
                th {
                  font-size: 12px;
                  color: ${t.color.muted};
                  font-weight: 650;
                }
              `}
            >
              <thead>
                <tr>
                  <th>Controller</th>
                  <th>Diesel used</th>
                  <th>vs rule-based</th>
                  <th>Critical failures</th>
                  <th>Critical energy lost</th>
                  <th>Renewables used</th>
                  <th>Clean-air hours kept</th>
                </tr>
              </thead>
              <tbody>
                {season.controllers.map((c) => (
                  <tr key={c.id} css={c.id === 'C' ? css`background: ${t.color.accentSoft};` : undefined}>
                    <td>
                      <div css={css`font-weight: 700; color: ${t.controller[c.id]};`}>{c.name}</div>
                      <div css={css`font-size: 12.5px; color: ${t.color.muted};`}>{c.blurb}</div>
                    </td>
                    <td>
                      {fmt(c.fuel_l)} L{c.ran_dry && <div css={css`font-size: 12px; color: ${t.color.bad};`}>tank ran dry</div>}
                    </td>
                    <td css={css`color: ${c.fuel_vs_B_pct < 0 ? t.color.good : t.color.muted};`}>
                      {c.id === 'B' ? '—' : `${c.fuel_vs_B_pct > 0 ? '+' : ''}${fmt(c.fuel_vs_B_pct, 1)}%`}
                    </td>
                    <td css={css`color: ${c.critical_outage_events ? t.color.bad : t.color.good}; font-weight: 700;`}>
                      {c.critical_outage_events}
                    </td>
                    <td>{fmt(c.unserved_critical_kwh, 1)} kWh</td>
                    <td>{fmt(c.renewable_utilisation_pct, 1)}%</td>
                    <td>{fmt(c.clean_air_compliance_pct, 1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Small>
            Perfect foresight is not a competitor — it shows the ceiling. HIMSHAKTI gets {fmt(controllerById(season, 'C').gap_to_oracle_closed_pct)}
            % of the way from the rule-based result to that ceiling. &ldquo;Clean-air hours kept&rdquo; is the share of hours with wind
            blowing toward the air samplers in which no generator ran.
          </Small>
        </Card>
      </Reveal>
    </>
  );
}
