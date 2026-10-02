// Integrity tests for the data the console displays, and a guard against synthetic data
// creeping back into the UI. Run with `npm test` (node --test, no dependencies).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const load = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}.json`, import.meta.url), 'utf8'));
const season = load('season');
const station = load('station');
const sizing = load('sizing');
const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('every controller total equals the sum of its daily series', () => {
  for (const c of season.controllers) {
    const d = season.daily[c.id];
    assert.ok(near(sum(d.fuel_l), c.fuel_l, 2), `${c.id} fuel ${sum(d.fuel_l)} vs ${c.fuel_l}`);
    assert.ok(near(sum(d.unserved_critical_kwh), c.unserved_critical_kwh, 0.5), `${c.id} unserved`);
    assert.ok(near(d.fuel_remaining_l.at(-1), c.fuel_remaining_l, 1), `${c.id} remaining`);
  }
});

test('the tank balances: tank minus fuel used equals fuel left', () => {
  for (const c of season.controllers) {
    assert.ok(near(season.fuel_plan.tank_l - c.fuel_l, c.fuel_remaining_l, 1), c.id);
  }
});

test('headline percentages recompute from the totals', () => {
  const by = Object.fromEntries(season.controllers.map((c) => [c.id, c]));
  const pct = (100 * (by.C.fuel_l - by.B.fuel_l)) / by.B.fuel_l;
  assert.ok(near(pct, by.C.fuel_vs_B_pct, 0.01));
  const gap = (100 * (by.B.fuel_l - by.C.fuel_l)) / (by.B.fuel_l - by.D.fuel_l);
  assert.ok(near(gap, by.C.gap_to_oracle_closed_pct, 0.1));
  assert.equal(season.headline.critical_outage_events_C, by.C.critical_outage_events);
  assert.equal(season.headline.critical_outage_events_B, by.B.critical_outage_events);
});

test('the scored window is labelled with its real length', () => {
  const w = season.window;
  assert.equal(w.scored_hours, w.window_days * 24 + 1 - w.warmup_hours, 'scored = window + final hour - warm-up');
  assert.ok(near(w.scored_days, w.scored_hours / 24, 0.05));
  assert.ok(w.scored_days < w.window_days, 'warm-up hours are excluded from scoring');
});

test('station loads: the four priority tiers add up to total demand', () => {
  const h = station.hourly;
  for (let i = 0; i < h.load_kw.length; i += 1) {
    const tiers = h.load_critical_kw[i] + h.load_essential_kw[i] + h.load_deferrable_kw[i] + h.load_sheddable_kw[i];
    assert.ok(near(tiers, h.load_kw[i], 0.06), `hour ${i}`);
  }
});

test('available renewables never exceed what the weather allowed', () => {
  const h = station.hourly;
  for (let i = 0; i < h.pv_kw.length; i += 1) {
    assert.ok(h.pv_kw[i] <= h.pv_potential_kw[i] + 0.01, `pv hour ${i}`);
    assert.ok(h.wind_kw[i] <= h.wind_potential_kw[i] + 0.01, `wind hour ${i}`);
  }
});

test('week logs: battery charge stays within its limits', () => {
  for (const [id, w] of Object.entries(season.week)) {
    for (const s of w.soc_frac) assert.ok(s >= 0.149 && s <= 0.951, `${id} soc ${s}`);
  }
});

test('sizing grid is complete and internally ordered', () => {
  const g = sizing.grid;
  assert.equal(sizing.rows.length, g.pv_kwp.length * g.wind_kw.length * g.battery_kwh.length);
  for (const r of sizing.rows) {
    assert.ok(r.best_l <= r.mean_l && r.mean_l <= r.worst_l, `${r.pv_kwp}/${r.wind_kw}/${r.battery_kwh}`);
    assert.ok(r.years_dry >= 0 && r.years_dry <= r.years);
  }
  const cfg = sizing.rows.find((r) => r.pv_kwp === sizing.configured.pv_kwp && r.wind_kw === sizing.configured.wind_kw && r.battery_kwh === sizing.configured.battery_kwh);
  assert.ok(cfg, 'the configured station is in the grid');
});

test('the fuel plan reports the 99% target honestly', () => {
  const fp = season.fuel_plan;
  // the per-day P99 envelope is not a year's need and must exceed the worst real year
  assert.ok(fp.daily_p99_envelope_l > fp.worst_year_need_l);
  if (fp.binding) assert.ok(fp.scaled_to_fit_pct < 100);
});

test('every data file states where its numbers come from', () => {
  assert.match(season.provenance.weather, /^ERA5/);
  assert.match(station.provenance.weather, /^ERA5/);
  assert.match(sizing.provenance, /ERA5/);
  // the WEATHER must never be synthetic; the load model's fixed variation is disclosed separately
  for (const f of [season, station]) assert.doesNotMatch(f.provenance.weather, /synthetic|seeded|random/i);
  assert.match(station.provenance.load_variation, /pseudo-random/, 'load variation is disclosed in plain words');
});

test('no synthetic data generators in the UI source', () => {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  for (const file of walk(src)) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /Math\.random|crypto\.getRandomValues|faker|seededRandom/, file);
  }
});

test('sizing page and fuel plan quote the same numbers for the modelled station', () => {
  const c = sizing.configured;
  const row = sizing.rows.find((r) => r.pv_kwp === c.pv_kwp && r.wind_kw === c.wind_kw && r.battery_kwh === c.battery_kwh);
  const fp = season.fuel_plan;
  assert.ok(near(row.mean_l, fp.mean_year_need_l, 1), `mean ${row.mean_l} vs ${fp.mean_year_need_l}`);
  assert.ok(near(row.worst_l, fp.worst_year_need_l, 1), `worst ${row.worst_l} vs ${fp.worst_year_need_l}`);
  assert.ok(near((100 * row.years_dry) / row.years, fp.p_run_dry_heuristic_pct, 0.1), 'share of winters that run dry');
  assert.equal(sizing.usable_l, fp.usable_l);
});
