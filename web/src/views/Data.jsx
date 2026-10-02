/** @jsxImportSource @emotion/react */
import { css, useTheme } from '@emotion/react';
import { useMemo, useState } from 'react';
import { Area, Chart, Line } from '../components/charts.jsx';
import { Card, Eyebrow, Grid, H1, H3, Lede, Note, Reveal, Row, Segmented, Small, Source, Stat } from '../components/ui.jsx';
import { daily } from '../data.js';
import { fmt, fmtDate } from '../theme.js';

export default function Data({ season, station }) {
  const t = useTheme();
  const a = station.annual;
  const fp = season.fuel_plan;
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const temp = useMemo(() => daily(station.hourly.time, station.hourly.temp_c), [station]);
  const wind = useMemo(() => daily(station.hourly.time, station.hourly.wind_ms), [station]);
  const pvAvail = useMemo(() => daily(station.hourly.time, station.hourly.pv_kw), [station]);
  const pvPot = useMemo(() => daily(station.hourly.time, station.hourly.pv_potential_kw), [station]);
  const wAvail = useMemo(() => daily(station.hourly.time, station.hourly.wind_kw), [station]);
  const wPot = useMemo(() => daily(station.hourly.time, station.hourly.wind_potential_kw), [station]);
  const loadD = useMemo(() => daily(station.hourly.time, station.hourly.load_kw), [station]);

  const months = temp
    .map((d, i) => ({ d: d.date, i }))
    .filter(({ d }) => d.endsWith('-01'))
    .map(({ d, i }) => ({ i, label: fmtDate(d, { month: 'short' }) }));

  const m = season.monthly;
  const monthTicks = m.month.map((mm, i) => ({ i, label: fmtDate(`${mm}-01`, { month: 'short' }) }));

  const rows = season.assumptions.filter(
    (r) =>
      (filter === 'all' || (filter === 'assumed' ? r.is_assumption : !r.is_assumption)) &&
      (!q || `${r.parameter} ${r.source}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <Reveal>
        <Eyebrow>Where every number comes from</Eyebrow>
        <H1>Real weather, a modelled station, honest limits</H1>
        <Lede>
          Nothing on this site is randomly generated. Each figure comes from one of three places, and every chart is labelled with
          which one.
        </Lede>
      </Reveal>

      <Grid>
        <Card>
          <Source kind="measured" />
          <H3 css={css`margin-top: 10px;`}>Weather — measured</H3>
          <Small>{station.provenance.weather}. Temperature, wind speed and direction, sunlight, snowfall, pressure and humidity, every hour.</Small>
        </Card>
        <Card>
          <Source kind="modelled" />
          <H3 css={css`margin-top: 10px;`}>Station — modelled</H3>
          <Small>
            No polar station publishes its electricity use, so the load is built from physics — {station.provenance.load}. Solar uses{' '}
            {station.provenance.generation}.
          </Small>
          <Small>
            One honest detail: {station.provenance.load_variation}. It is the only part of the project that is not measured or physically
            derived, and it is fixed, so every run is reproducible.
          </Small>
        </Card>
        <Card>
          <Source kind="optimised" />
          <H3 css={css`margin-top: 10px;`}>Results — computed</H3>
          <Small>
            Five controllers run hour by hour on that weather and that station. The window opens on{' '}
            {fmtDate(season.window.start, { day: 'numeric', month: 'short', year: 'numeric' })}; the first {season.window.warmup_hours} hours are
            warm-up, so scoring covers {season.window.scored_hours} hours ({season.window.scored_days} days) from{' '}
            {fmtDate(new Date(Date.parse(`${season.window.start}T00:00:00Z`) + season.window.warmup_hours * 3600e3).toISOString().slice(0, 10), {
              day: 'numeric',
              month: 'short',
            })}
            .
          </Small>
        </Card>
      </Grid>

      <Reveal>
        <Grid>
          <Stat label={`Mean air temperature, ${a.year}`} note={`Coldest hour ${a.min_temp_c} °C`}>{a.mean_temp_c} °C</Stat>
          <Stat label="Mean wind speed" note="At 10 m, ERA5">{a.mean_wind_ms} m/s</Stat>
          <Stat label="Electricity the station uses" note={`Peak ${fmt(a.peak_load_kw, 1)} kW (modelled)`}>{fmt(a.load_mwh, 1)} MWh</Stat>
          <Stat label="Covered by sun and wind" note={`${fmt(a.pv_mwh, 1)} MWh solar, ${fmt(a.wind_mwh, 1)} MWh wind available`} tone="accent">
            {a.renewable_share_of_load_pct}%
          </Stat>
        </Grid>
      </Reveal>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>The season&apos;s weather at Maitri</H3>
            <Source kind="measured" />
          </Row>
          <Grid css={css`margin-top: 10px;`}>
            <div>
              <Small css={css`margin: 0 0 4px;`}>Daily mean temperature (°C), with the day&apos;s range</Small>
              <Chart n={temp.length} yMin={-40} yMax={10} height={200} xTicks={months} yTicks={5} yFormat={(v) => fmt(v)}>
                <Line values={temp.map((d) => d.max)} color={t.color.sky} width={1} opacity={0.4} />
                <Line values={temp.map((d) => d.min)} color={t.color.sky} width={1} opacity={0.4} />
                <Line values={temp.map((d) => d.value)} color={t.color.sky} width={2.4} />
              </Chart>
            </div>
            <div>
              <Small css={css`margin: 0 0 4px;`}>Daily mean wind speed (m/s)</Small>
              <Chart n={wind.length} yMax={Math.max(...wind.map((d) => d.value))} height={200} xTicks={months}>
                <Area values={wind.map((d) => d.value)} color={t.supply.wind} opacity={0.2} />
                <Line values={wind.map((d) => d.value)} color={t.supply.wind} width={2} />
              </Chart>
            </div>
          </Grid>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>Weather says one thing, the equipment delivers another</H3>
            <Source kind="modelled" />
          </Row>
          <Small>
            Dotted: what the sun and wind could have produced. Solid: what was actually available after snow on the panels and ice on the
            blades. That gap is why HIMSHAKTI forecasts availability, not just weather.
          </Small>
          <Chart
            n={pvAvail.length}
            yMax={Math.max(...wPot.map((d) => d.value), ...pvPot.map((d) => d.value), ...loadD.map((d) => d.value))}
            height={230}
            yUnit="kW"
            xTicks={months}
          >
            <Line values={loadD.map((d) => d.value)} color={t.color.ink} width={1.6} dashed />
            <Line values={pvPot.map((d) => d.value)} color={t.supply.pv} width={1.4} dashed />
            <Line values={pvAvail.map((d) => d.value)} color="#c99a1f" width={2.4} />
            <Line values={wPot.map((d) => d.value)} color={t.supply.wind} width={1.4} dashed />
            <Line values={wAvail.map((d) => d.value)} color="#2f7fb5" width={2.4} />
          </Chart>
          <Row gap="16px" css={css`font-size: 12.5px; color: ${t.color.muted}; margin-top: 6px;`}>
            <span css={css`color: #c99a1f; font-weight: 650;`}>— solar</span>
            <span css={css`color: #2f7fb5; font-weight: 650;`}>— wind</span>
            <span css={css`color: ${t.color.ink}; font-weight: 650;`}>··· station demand (daily mean)</span>
          </Row>
        </Card>
      </Reveal>

      <Reveal>
        <Grid cols="1fr 1fr">
          <Card>
            <Row justify="space-between">
              <H3>Demand vs people on station</H3>
              <Source kind="modelled" />
            </Row>
            <Small>Fewer people in winter, yet the station uses about as much power: heating takes over. Monthly means.</Small>
            <Chart n={m.month.length} yMax={Math.max(...m.load_kw, ...m.occupancy)} height={200} xTicks={monthTicks}>
              <Line values={m.load_kw} color={t.color.accent} width={2.6} />
              <Line values={m.occupancy} color={t.color.warn} width={2} dashed />
            </Chart>
            <Row gap="16px" css={css`font-size: 12.5px; margin-top: 6px;`}>
              <span css={css`color: ${t.color.accent}; font-weight: 650;`}>— demand (kW)</span>
              <span css={css`color: ${t.color.warn}; font-weight: 650;`}>— people</span>
            </Row>
          </Card>
          <Card>
            <Row justify="space-between">
              <H3>Forecast accuracy</H3>
              <Source kind="forecast" />
            </Row>
            <Small>Tested on {season.window.test_year}, a year the model never saw. &ldquo;Inside the band&rdquo; is how often reality stayed below the model&apos;s high estimate — the honesty that matters for keeping a safe reserve.</Small>
            <table
              css={css`
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 14px;
                font-variant-numeric: tabular-nums;
                td, th { padding: 8px 6px; border-bottom: 1px solid ${t.color.line}; text-align: right; }
                td:first-of-type, th:first-of-type { text-align: left; }
                th { font-size: 12px; color: ${t.color.muted}; font-weight: 650; }
              `}
            >
              <thead>
                <tr><th>Forecast of</th><th>Typical error</th><th>Error %</th><th>Inside the band</th></tr>
              </thead>
              <tbody>
                {[['load_kw', 'Demand'], ['pv_kw', 'Solar'], ['wind_kw', 'Wind']].map(([k, label]) => (
                  <tr key={k}>
                    <td>{label}</td>
                    <td>{fmt(season.forecast[k].mae, 2)} kW</td>
                    <td>{fmt(season.forecast[k].mape_pct, 1)}%</td>
                    <td>{fmt(100 * season.forecast[k].p90_coverage, 0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Grid>
      </Reveal>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>The fuel budget, and what it can and cannot promise</H3>
            <Source kind="measured" />
          </Row>
          <Grid css={css`margin-top: 12px;`}>
            <Stat label="Fuel in the tank" note={`${fmt(fp.reserve_floor_l)} L kept back as an emergency reserve`}>{fmt(fp.tank_l)} L</Stat>
            <Stat label="An average past winter would need" note={`Worst of ${season.window.ensemble_years.length} winters: ${fmt(fp.worst_year_need_l)} L`}>
              {fmt(fp.mean_year_need_l)} L
            </Stat>
            <Stat label="Winters a simple rule runs dry" tone="warn" note="Under a basic operating rule, across the past winters">
              {fmt(fp.p_run_dry_heuristic_pct, 1)}%
            </Stat>
          </Grid>
          <Note tone="warn" title="Read this before quoting the 99% target">
            HIMSHAKTI aims to keep critical power on until the ship returns in 99% of winters. With this tank that target cannot be met:
            the daily allowance built for it adds up to {fmt(fp.daily_p99_envelope_l)} L, so it was scaled to {fmt(fp.scaled_to_fit_pct, 0)}% to
            fit the {fmt(fp.usable_l)} L that can actually be used. The tank is deliberately tight so the trade-off is visible. In the{' '}
            {season.window.test_year} winter tested above, HIMSHAKTI still finished with no critical failures — but that is one winter, not
            a guarantee.
          </Note>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <Row justify="space-between">
            <H3>Every assumption, with its source</H3>
            <Row gap="10px">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search parameters"
                aria-label="Search parameters"
                css={css`
                  font: inherit;
                  font-size: 14px;
                  padding: 8px 12px;
                  border-radius: 999px;
                  border: 1px solid ${t.color.lineStrong};
                  min-width: 200px;
                  &:focus { outline: 2px solid ${t.color.accent}; outline-offset: 1px; }
                `}
              />
              <Segmented
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: `All ${season.assumptions.length}` },
                  { value: 'sourced', label: 'From a source' },
                  { value: 'assumed', label: 'Our assumption' },
                ]}
              />
            </Row>
          </Row>
          <Small>Rows marked &ldquo;our assumption&rdquo; are where the station model is a judgement call. Each has a sensitivity range.</Small>
          <div css={css`overflow-x: auto; margin-top: 12px; max-height: 520px; overflow-y: auto;`}>
            <table
              css={css`
                width: 100%;
                border-collapse: collapse;
                font-size: 13.5px;
                td, th { padding: 9px 8px; border-bottom: 1px solid ${t.color.line}; vertical-align: top; text-align: left; }
                th { position: sticky; top: 0; background: ${t.color.surface}; font-size: 12px; color: ${t.color.muted}; font-weight: 650; }
              `}
            >
              <thead>
                <tr><th>Parameter</th><th>Value</th><th>Range tested</th><th>Source</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.parameter}>
                    <td css={css`font-family: ${t.font.mono}; font-size: 12.5px; color: ${t.color.ink};`}>{r.parameter}</td>
                    <td css={css`white-space: nowrap; font-variant-numeric: tabular-nums;`}>
                      {typeof r.value === 'number' ? fmt(r.value, Math.abs(r.value) < 10 && r.value % 1 ? 3 : 0) : String(r.value)} {r.unit && r.unit !== '-' ? r.unit : ''}
                    </td>
                    <td css={css`white-space: nowrap; color: ${t.color.muted};`}>{r.sensitivity ? r.sensitivity.join(' – ') : '—'}</td>
                    <td>
                      <span
                        css={css`
                          display: inline-block;
                          font-size: 11px;
                          font-weight: 700;
                          padding: 2px 7px;
                          border-radius: 999px;
                          margin-right: 6px;
                          background: ${r.is_assumption ? t.color.warnSoft : t.color.goodSoft};
                          color: ${r.is_assumption ? t.color.warn : t.color.good};
                        `}
                      >
                        {r.is_assumption ? 'our assumption' : 'sourced'}
                      </span>
                      <span css={css`color: ${t.color.text};`}>{r.source.replace(/^(ASSUMPTION|DESIGN CHOICE):\s*/, '')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </>
  );
}
