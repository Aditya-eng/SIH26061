import { useEffect, useState } from 'react';

// Every number on screen comes from these three files, exported from the engine's real run
// by engine/export_web_data.py and cross-checked by engine/verify_data.py. Nothing in the
// UI generates, perturbs or invents data.
const FILES = ['season', 'station', 'sizing'];

export function useData() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    Promise.all(
      FILES.map((f) =>
        fetch(`./data/${f}.json`).then((r) => {
          if (!r.ok) throw new Error(`${f}.json could not be loaded (HTTP ${r.status}).`);
          return r.json();
        }),
      ),
    )
      .then(([season, station, sizing]) => alive && setState({ status: 'ready', season, station, sizing }))
      .catch((e) => alive && setState({ status: 'error', message: e.message }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

// ---- derived facts, computed from the exported series only ----

export function firstDayBelow(series, threshold) {
  const i = series.findIndex((v) => v !== null && v < threshold);
  return i < 0 ? null : i;
}

export function cumulative(series) {
  let acc = 0;
  return series.map((v) => (acc += v || 0));
}

export function controllerById(season, id) {
  return season.controllers.find((c) => c.id === id);
}

/** Aggregate an hourly array into calendar days (mean or sum). */
export function daily(times, values, how = 'mean') {
  const out = new Map();
  times.forEach((t, i) => {
    const d = t.slice(0, 10);
    const v = values[i];
    if (v === null || v === undefined) return;
    const cur = out.get(d) || { s: 0, n: 0, min: Infinity, max: -Infinity };
    cur.s += v;
    cur.n += 1;
    cur.min = Math.min(cur.min, v);
    cur.max = Math.max(cur.max, v);
    out.set(d, cur);
  });
  return [...out.entries()].map(([date, c]) => ({
    date,
    value: how === 'sum' ? c.s : c.s / c.n,
    min: c.min,
    max: c.max,
  }));
}
