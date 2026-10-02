# SIH26061 — HIMSHAKTI: polar station fuel survivability

**Smart India Hackathon 2026 · Problem Statement SIH26061 · Ministry of Earth Sciences (MoES) /
National Centre for Polar and Ocean Research (NCPOR) · Software · Clean & Green Technology**

> *"Develop an intelligent energy-management system using AI for load forecasting, renewable
> energy integration and fuel optimization under extreme polar conditions."* — the complete
> official problem statement.

[![CI](https://github.com/Aditya-eng/SIH26061/actions/workflows/ci.yml/badge.svg)](https://github.com/Aditya-eng/SIH26061/actions/workflows/ci.yml)
[![Deploy console](https://github.com/Aditya-eng/SIH26061/actions/workflows/deploy-demo.yml/badge.svg)](https://github.com/Aditya-eng/SIH26061/actions/workflows/deploy-demo.yml)

**Live console:** https://aditya-eng.github.io/SIH26061/

---

## The idea in one paragraph

A polar research station receives **one fuel delivery a year**. Its renewables are unpredictable
and physically fragile, its largest loads are thermal and peak exactly when generation is worst,
and **its own diesel exhaust contaminates the atmospheric measurements the station exists to
collect**. So the objective is not minimum cost per kWh — every commercial microgrid EMS already
does that — it is *keep critical load served until the ship returns*, without poisoning your own
science. That reframing is the project.

Forecasting, MILP dispatch, battery scheduling and critical-load prioritisation are all built
here, because the system needs them. They are table stakes, not the innovation: ABB, Schneider,
Siemens, SMA and HOMER ship that feature list today.

## Two parts, one set of numbers

| | [`engine/`](engine/) | [`web/`](web/) |
|---|---|---|
| What it is | The pipeline: physics model of the station, LightGBM quantile forecasts, MILP/MPC dispatch under a Monte Carlo seasonal fuel allocation | The public console: React + Emotion + Motion |
| Weather | **ERA5 reanalysis**, hourly, 9 years, Maitri (−70.7667, 11.7333) | the same — exported from the engine |
| Numbers | computed by closed-loop runs | **displayed only** — the console computes nothing and contains no synthetic data |

The console reads three JSON files written by `engine/export_web_data.py`; `engine/verify_data.py`
cross-checks every published figure against the run and fails CI on any mismatch.

**What is measured and what is modelled.** The weather is measured (reanalysis). Station
electricity use is *modelled*, because no polar station publishes its load data: it is built from
headcount, envelope heat loss, snow-melt water and a 24/7 science load. The model includes one
disclosed, fixed pseudo-random component — hour-to-hour domestic (±8%) and workshop (40–100% of
peak) variation — so runs are reproducible. Forecast errors are simulated by degrading the
reanalysis with lead-time-dependent noise, because a reanalysis is a hindcast, not a forecast.

## Results — 2023 winter

Window 2023-02-01 → 2023-08-30; the first 48 hours are warm-up, so every controller is **scored
over 4,993 hours (208 days)**. Identical weather, station and physical resolver for all. Tank
72,000 L, deliberately sized so the season is marginal (`engine/calibrate.py`), with a 6,000 L
emergency reserve.

| Controller | Diesel (L) | vs B | Critical failures | Critical energy lost | Renewables used | Clean-air hours kept |
|---|---|---|---|---|---|---|
| A — fixed schedule | 72,000 (**ran dry**) | — | 36 | 9,266.6 kWh | 69.1% | 40.5% |
| B — tuned rule-based | 72,000 (**ran dry**) | 0% | 6 | 328.4 kWh | 84.8% | 27.4% |
| **C — HIMSHAKTI** | **63,384.7** | **−12.0%** | **0** | **0.0 kWh** | 92.5% | 43.7% |
| C-point — no uncertainty | 63,279.6 | −12.1% | 1 | 8.3 kWh | 92.7% | 43.3% |
| D — perfect foresight | 62,484.6 | −13.2% | 0 | 0.0 kWh | 93.5% | 49.0% |

HIMSHAKTI closes **91%** of the gap between the tuned baseline and the perfect-foresight ceiling.
Both baselines empty the tank (the rule-based one on 21 August); HIMSHAKTI finishes with 8,615 L.

| Stress test (same window) | B — critical energy lost | C — critical energy lost |
|---|---|---|
| Four-day blizzard | 809.1 kWh / 8 failures | **0.0 kWh / 0** |
| 125 kW generator out for 48 h | 325.8 kWh / 3 failures | 97.9 kWh / 1 failure |
| 12 h badly wrong forecast | — | 0.0 kWh; fuel 63,373 L vs 63,385 L |

Forecast skill on the unseen 2023 year: load MAE 1.82 kW (2.2%), solar 3.01 kW (12.1%), wind
6.53 kW (20.0%); the p90 band contains the truth in 89–93% of hours.

### The fuel budget — what it can and cannot promise

The seasonal allocator **targets** critical load served until the ship in 99% of past winters.
With this tank it cannot meet that target: the per-day 99th-percentile allowance sums to
132,303 L (an envelope no single winter reaches — the worst of the eight needs 81,046 L), so it is
scaled to 50% to fit the 66,000 L usable. Under a simple operating rule, 7 of 8 past winters
(87.5%) would run dry. The 2023 result above is one winter, not a guarantee.

## What makes this polar rather than generic

1. **Resupply-horizon fuel budgeting** (`engine/src/polarems/fuelbudget.py`) — a Monte Carlo
   allocator over eight ERA5 winters sets a daily litre allowance; the MILP prices every litre
   beyond it, with carry-over between horizons. No commercial EMS optimises against a single
   annual resupply.
2. **Science-integrity dispatch** (`engine/src/polarems/cleanair.py`) — when *forecast* wind
   would carry exhaust toward the clean-air sampling sector, generator hours are priced and the
   battery carries the window.
3. **Physical-availability forecasting** (`engine/src/polarems/availability.py`) — snow cover and
   blade icing are state variables that decorrelate from the weather forecast.

## Running it

```bash
# console — Node >= 20
cd web && npm ci && npm run dev          # http://localhost:5173
npm test && npm run build

# engine — Python 3.12+
cd engine
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # Linux/macOS: .venv/bin/pip
.venv/Scripts/python -m pytest tests -q          # 14 tests
.venv/Scripts/python verify_data.py              # cross-checks every published number
.venv/Scripts/python run.py --days 210           # full window, ~75 min
.venv/Scripts/python export_web_data.py          # refresh the console's data
```

The ERA5 Parquet cache is committed, so tests, the pipeline and the console all work offline.

## Continuous integration

- **`ci.yml`** — engine unit tests, `verify_data.py`, and a short 14-day smoke run (never the full
  window — that is ~75 minutes of MILP solves); console tests (data integrity, no synthetic
  generators in the source) and production build.
- **`deploy-demo.yml`** — tests, builds and publishes the console to GitHub Pages on every push to
  `main`.

## Repository map

```
engine/                     the pipeline
  config/station.json       every physical number with source, confidence, sensitivity range
  src/polarems/             weather, twin, availability, cleanair, forecast, fuelbudget,
                            dispatch, controllers, harness, metrics, scenarios, setpoints, report
  run.py  calibrate.py  sizing.py  sensitivity.py  watch_ps.py  emit_setpoints.py  make_ppt.py
  export_web_data.py        writes the console's data from results/run.json + the ERA5 twin
  verify_data.py            cross-checks every published number
  data/cache/               committed ERA5 Parquet, 2015-2023
  results/                  run.json, metrics.csv (the 2023 window)
  submission/               SIH idea deck (pptx + pdf), generated from results/run.json
  docs/                     demo script + Q&A, findings, external review brief
web/                        the console (React, Emotion, Motion)
  src/                      views/, components/ (ui.jsx, charts.jsx), theme.js, data.js
  public/data/              season.json, station.json, sizing.json - exported, never hand-edited
  tests/                    data-integrity tests
```

## Honest limitations

- **No public electrical-load data exists for any polar station.** Loads are modelled; every
  parameter carries its source and a sensitivity range (Assumptions table on the console).
- **The same team wrote the simulator and the controller.** Mitigations: a tuned baseline B
  (zero critical failures over a full year with an unconstrained tank), a perfect-foresight
  ceiling, and a published ablation (C-point).
- **One test winter, one seed.** No confidence intervals yet.
- **The 99% survival target is not met by this tank** — see the fuel-budget section.
- **Maitri II ratings are not public**, so the work is framed as a sizing and operating-policy
  explorer for a station still on the drawing board.
- **No hardware in the loop.** `engine/emit_setpoints.py` emits Modbus registers and MQTT
  messages; nothing has been tested against a real generator controller.

## References

de Witt, Chung & Lee (2024), *Mapping Renewable Energy among Antarctic Research Stations*,
Sustainability 16(1) 426, doi:10.3390/su16010426 · ERA5 reanalysis (ECMWF/Copernicus) · pvlib ·
LightGBM · HiGHS. Full list in [`engine/docs/HANDOFF_BRIEF.md`](engine/docs/HANDOFF_BRIEF.md).
