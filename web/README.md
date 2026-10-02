# Pink Monster — Polar Mission Console

**SIH26061 · Fuel-survivability energy management · Team Pink Monster**

**Live:** https://aditya-eng.github.io/SIH26061/

An offline browser console for a polar research station. Configure solar, wind, battery and fuel,
compare a rule-based controller with a forecast planner, break things on purpose, inspect every
hourly decision and export the run.

It runs on **real Antarctic weather**: ERA5 reanalysis for India's Maitri station, hourly, from
1 May 2023. Solar, wind and station demand come from the HIMSHAKTI engine's physics model of the
station on that weather. Every number on screen is computed in your browser from your inputs.

## Run it

Node.js 20 or later:

```sh
npm run dev        # http://localhost:3000
npm test           # 10 checks
npm run build      # syntax, assets, and the saved example reproduces exactly
```

No install step, API key, database or internet connection is needed — the weather record is
bundled in `dist/data/maitri-2023.js`. Serve over HTTP rather than opening `index.html` directly.

## Demo flow

1. Run the default 30-day mission (1–30 May 2023, 6,300 L tank).
2. Compare fuel, all unserved energy, critical shortfall and end battery for both controllers.
3. Open **Dispatch explorer**: pick an hour and a controller; read the power balance, the
   priority panel and the reason for the decision.
4. Open **Resilience lab** and run the blizzard, generator failure and missed-lull tests. Each is
   placed at the most demanding point of the mission; both controllers are shown side by side.
5. Check the fuel allowance, carry-forward and the four-hour sampling advisory.
6. Open **Model & guide**, then export the hourly CSV and full-run JSON.

The full narrated walkthrough is in [`dist/BUILD_GUIDE.md`](dist/BUILD_GUIDE.md).

## What is in the model

| Part | Implementation |
|---|---|
| Weather | ERA5 reanalysis, hourly, Maitri (−70.75, 11.75) |
| Solar / wind | Engine physics model per installed kW × your capacities (snow cover, cold air density, icing included) |
| Demand | Engine physics model: headcount, heat loss at measured temperature, snow-melt water, 20 kW science and life safety |
| Priorities | Critical, essential, domestic from the model; shed domestic first, critical last |
| Diesel | 60 / 125 kW units, one active, 30% minimum load, finite tank |
| Battery | 15–95% charge, power limit, 95% efficiency each way |
| Rules controller | Hourly reaction to measured demand, renewables and battery thresholds |
| Forecast planner | 36-hour, width-14 beam search; re-plans every 6 h and on generator faults; protection layer starts a generator if a measured shortfall exceeds the plan |
| Forecast | Persistence from the real record: latest wind, same-hour-yesterday solar and demand |
| Stress tests | Blizzard (96 h), 125 kW failure (48 h), missed wind lull (48 h), each at the mission's most demanding point |
| Export | Hourly CSV and full JSON with configuration, data source and model version |

The planner is an approximate search, not a proof of optimality — the full HIMSHAKTI engine in
`../engine` uses trained forecasts and a mixed-integer optimiser. See
[`docs/FINAL_ML_INTEGRATION.md`](docs/FINAL_ML_INTEGRATION.md) for how the two connect.

This is decision support for a hackathon demonstration. It does not control station equipment.

## Project map

```text
dist/
  index.html               entry point
  app.js                   views, charts, explanations, exports
  style.css                interface theme (Figtree bundled in fonts/)
  simulation.js            weather and forecast from the record, dispatch, controllers, accounting
  worker.js                runs the simulation off the UI thread
  data/maitri-2023.js      hourly station record (engine/export_demo_weather.py)
  data/default-run.json    the example shown on load, produced by the current code
  vendor/motion.js         Motion animation library (MIT), bundled for offline use
  BUILD_GUIDE.md           step-by-step demo guide and voiceover
scripts/   serve.mjs (local server), check.mjs (build checks)
tests/     simulation.test.mjs
docs/      FINAL_ML_INTEGRATION.md
```

## Deploy

GitHub Actions publishes `dist/` to GitHub Pages on every push to `main`
(`.github/workflows/deploy-demo.yml` at the repository root). Netlify (`netlify.toml`, base
`web`) and Vercel (`vercel.json`, Root Directory `web`) also work.
