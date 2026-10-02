# SIH26061 — Complete Project Context

Everything about this project in one file: the problem statement, the strategy, both
codebases, every number, every repo, every deliverable, every bug found and fixed, and what
is still open. Last updated 2026-10-02.

---

## 1. Quick reference

| Item | Value |
|---|---|
| Competition | Smart India Hackathon 2026 |
| Problem Statement ID | **SIH26061** |
| Title | AI-Driven Smart Energy Management System for Polar Research Stations |
| Organisation | Ministry of Earth Sciences (MoES) |
| Department | National Centre for Polar and Ocean Research (NCPOR) |
| Category | Software |
| Theme (portal, authoritative) | **Clean & Green Technology** |
| Portal deadline | 30 September 2026 |
| Idea / product name | **HIMSHAKTI** (him = snow, shakti = power) |
| Demo codename | **Pink Monster** (team name in the web demo: "Team Pink Monster") |
| GitHub repo | https://github.com/Aditya-eng/SIH26061 (public, branch `main`) |
| Live demo | https://aditya-eng.github.io/SIH26061/ (GitHub Pages, confirmed HTTP 200 on 2026-10-02) |
| Local repo | `C:\Users\Aditya Garg\OneDrive\Desktop\claude_code_folder1\SIH26061` |
| Original engine working copy | `C:\Users\Aditya Garg\OneDrive\Desktop\claude_code_folder1\sih26061-polar-ems` (has the `.venv`) |
| Git identity | Aditya-eng / gargadi2405@gmail.com |

**The complete official problem statement** (it really is one sentence — there is no
Background, Detailed Description, Expected Solution, dataset link or YouTube link):

> "Develop an intelligent energy-management system using AI for load forecasting, renewable
> energy integration and fuel optimization under extreme polar conditions."

---

## 2. Timeline of what was done

| Date | Work |
|---|---|
| 2026-08-27 | Strategy/feasibility analysis PDF produced (by Claude Opus) — `Downloads\SIH26061_Analysis (1).pdf`, 19 pages |
| 2026-09-03 | Portal verified directly; three corrections to the PDF found (deadline, theme, official text). Full Python engine built, tested, first runs |
| 2026-09-04 | Calibration, soft fuel budget, information-leak fixes, dashboard, docs, sizing/sensitivity/watcher/setpoint tools |
| 2026-09-08 | SIH idea deck (6 slides, official template) generated from results; 210-day run relaunched |
| 2026-09-09 | 210-day run completed (all controllers + stress tests). Deck regenerated with final numbers. `HANDOFF_BRIEF.md` written for external review (GPT Pro) |
| 2026-09-10 | Pink Monster web demo received as zip; combined repo built and pushed to GitHub; CI + Pages workflows; three bugs found and fixed (requirements.txt, Pages enablement, demo worker never started) |
| 2026-09-10 | SIH project submission form text drafted (description + tech stack) |
| 2026-10-02 | Pages confirmed live. This file written |

---

## 3. The strategic thesis (why this wins or loses)

### The generic reading is a solved market
Forecasting + optimisation + dashboard is shipped commercially today: ABB Ability Microgrid
Plus, Schneider EcoStruxure Microgrid Advisor, Siemens microgrid controllers, Hitachi e-mesh,
SMA Fuel Save Controller. HOMER Pro is the standard sizing tool; NREL REopt does economics.
Open source covers the backend: PyPSA, oemof, MicroGridsPy, pandapower, GridLAB-D, OpenDSS;
RAMP for loads; PowerGridWorld/Gym-ANM/CityLearn for RL. MPC for isolated microgrids is a
mature literature. **The combination is a feature checklist, not an innovation.**

Self-assessed score: ~3.5/10 pitched as "AI energy management platform"; ~7.5/10 pitched as
"fuel-survivability and science-integrity operating policy for Maitri II".

### The three genuinely polar-specific differentiators
1. **Annual-resupply fuel budgeting** — one fuel delivery a year, no supplier until the ship
   returns. Objective = maximise P(critical load served until resupply), not minimise cost.
2. **Science-integrity-constrained dispatch** — the station's own diesel exhaust corrupts its
   own atmospheric measurements; generator hours are priced when forecast wind carries exhaust
   into the clean-air sampling sector.
3. **Physical-availability forecasting** — snow-buried panels and iced blades decorrelate from
   the weather forecast.

### Rules of the pitch
- Never lead with "platform" or "dashboard".
- Table stakes (forecasting, MILP, battery, load priorities) are built but not pitched.
- Lead reliability (critical outages) before fuel %.
- Always quote fuel against the **tuned** baseline B, with the oracle bound beside it.
- The four nouns in the official sentence (load forecasting, renewable integration, fuel
  optimisation, extreme conditions) must all be visible.
- End on limitations / the Assumptions tab.

---

## 4. Verified facts used by the model

From de Witt, Chung & Lee (2024), *Sustainability* 16(1) 426, doi:10.3390/su16010426:
- 81 Antarctic stations, 37 use renewables; essentially all keep diesel backup.
- Demand peaks in **winter** when population is at its **minimum**.
- Largest loads are heat-related (space heating, water heating, snow melting).
- Gensets waste fuel off their efficiency point; diesel–battery hybrids fix this.
- Fuel delivered on a months-to-a-year cycle ("mid-term energy security").
- **Local diesel emissions corrupt the station's own atmospheric science.**
- Blade de-icing costs ~2–12% of nameplate.
- Wind and solar are seasonally complementary (solar Oct–Feb; wind spring/autumn).
- PV gains 0.35–0.5%/K below STC; snow albedo boosts irradiance; cold air gives turbines ~20%
  more at ~−37 °C.
- Failures are physical: turbine collapse at Mario Zucchelli, generator short at Neumayer III
  (2011), PV glass shattered by wind-blown ice, drift buries arrays.
- Demand restriction at Johann Gregor Mendel saved fuel but hurt comfort.
- Princess Elisabeth runs high renewable share with a battery and load-prioritising microgrid.

Indian context:
- **Maitri** (1989, Schirmacher Oasis, 70°45′52″S 11°44′03″E), ~25 winter / 40–45 summer.
- **Bharati** (2012, Larsemann Hills, 69°24.41′S 76°11.72′E).
- **Maitri II**: approved ~₹2,000 crore, target January 2029, green station (wind + solar,
  waste-heat recovery, unmanned data relay). No published operating policy — our use case.

---

## 5. Portal facts (verified 2026-09-03 on sih.gov.in/sih2026PS)

Three corrections to the original analysis PDF:
1. Deadline is **30 Sep 2026** (PDF said 20 Sep).
2. Theme is **Clean & Green Technology** (mirrors said Miscellaneous / Renewable Energy).
3. Official text **was retrievable** — and it is one sentence. The portal is machine-fetchable.

Neighbouring MoES/NCPOR statements (portal themes): 26059 Antarctic sea-ice/navigation
(Transportation & Logistics), **26060 remote-management platform for Indian Antarctic
stations (Smart Automation — adjacent, easy to confuse)**, 26062 expedition logistics (Smart
Automation), 26063 polar outreach portal (Smart Education), 26064/26065 Robotics and Drones.

Ideas submitted at check time: SIH26061 0/500; portal-wide 189/226 statements at 0, max 4/500
(submissions had just opened — not evidence of low competition).

---

## 6. Data sources (all status-checked)

### Used by the code
| Purpose | Endpoint |
|---|---|
| Hourly ERA5 weather | `https://archive-api.open-meteo.com/v1/archive` (no key) |
| PS record | `https://sih.gov.in/sih2026PS` (used by `watch_ps.py`) |

ERA5 query: lat −70.7667, lon 11.7333; hourly `temperature_2m, wind_speed_10m (km/h → ÷3.6),
wind_direction_10m (from-direction), shortwave_radiation, snowfall (cm), surface_pressure,
relative_humidity_2m`; `models=era5`, UTC; years 2015–2023; cached as
`engine/data/cache/era5_-70.767_11.733_YYYY.parquet` (9 files, ~1.3 MB, committed).

### Verified alternatives
- ERA5 at source (CDS, needs account): https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels , https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land
- SCAR READER: https://legacy.bas.ac.uk/met/READER/ (surface: `/surface/stationpt.html`)
- AMRC/AMRDC Antarctic AWS: https://amrdcdata.ssec.wisc.edu/dataset
- BSRN radiation: https://bsrn.awi.de/stations/listings/
- Global Solar Atlas: https://globalsolaratlas.info/map
- **NCPOR Indian polar met portal (live, shows Maitri & Bharati): https://data.ncpor.res.in/** — sibling `npdc.ncpor.res.in` did not connect from the campus network
- COMNAP facilities: https://www.comnap.aq/antarctic-facilities-information ; mirror https://github.com/PolarGeospatialCenter/comnap-antarctic-facilities ; catalogue PDF via comnap squarespace link

### The data gap
**No public electrical-load data exists for any polar research station.** Load is synthetic,
bottom-up. Shape proxies if needed: Building Data Genome 2
(https://github.com/buds-lab/building-data-genome-project-2), ASHRAE GEPIII (Kaggle), Open
Power System Data household, UMass Smart*, RAMP (https://www.rampdemand.org/).

---

## 7. Repository layout (github.com/Aditya-eng/SIH26061)

```
SIH26061/
├── README.md                    explains both codebases, results, how to run
├── PROJECT_CONTEXT.md           this file (not yet committed)
├── .gitignore  .gitattributes   LF normalisation; binary rules; generated files marked
├── .github/workflows/
│   ├── ci.yml                   engine tests + 14-day smoke run; demo tests + build check
│   └── deploy-demo.yml          builds web/dist → GitHub Pages (enablement: true)
├── engine/                      the real Python pipeline
│   ├── config/station.json      64 annotated parameters
│   ├── src/polarems/            config, weather, twin, availability, cleanair, forecast,
│   │                            fuelbudget, dispatch, controllers, harness, metrics,
│   │                            scenarios, setpoints, report
│   ├── run.py calibrate.py sizing.py sensitivity.py watch_ps.py emit_setpoints.py make_ppt.py
│   ├── dashboard/               template.html, vendor/plotly.min.js, dashboard.html (generated)
│   ├── data/cache/              ERA5 Parquet 2015–2023
│   ├── results/                 run.json (210-day), metrics.csv, sizing.csv/json
│   ├── submission/              SIH26061_Idea_Presentation.pptx/.pdf + README
│   ├── assets/deck/             deck figures
│   ├── docs/                    demo_script.md, findings_and_suggestions.md, HANDOFF_BRIEF.md
│   ├── tests/test_core.py       14 tests (~2 s)
│   └── requirements.txt
└── web/                         Pink Monster browser demo
    ├── dist/                    index.html, app.js, simulation.js, worker.js, style.css,
    │                            favicon.svg, BUILD_GUIDE.md, data/default-run.json  ← what Pages serves
    ├── scripts/                 serve.mjs (port 3000), check.mjs (build validation)
    ├── tests/simulation.test.mjs  8 tests
    ├── docs/                    FINAL_ML_INTEGRATION.md, references/ (build guide, Visual Edition pptx, hourly csv, provenance.json)
    └── package.json netlify.toml vercel.json
```

### Commit history
| Commit | Message |
|---|---|
| `750f010` | SIH26061: polar station energy engine + Pink Monster demo (initial, 78 files) |
| `aabea53` | Pages: self-provision the site and deploy on any main push |
| `f6a81bc` | Fix Netlify/Vercel config for the web/ subfolder |
| `732192a` | Fix requirements.txt: it was missing every real dependency |
| `cccad90` | Fix the demo never running: app never posted the config to its worker |

### CI status
- `ci.yml` on `732192a`: **success** (after the requirements fix).
- `deploy-demo.yml`: failed at `configure-pages` until Pages/workflow permissions were enabled
  in repo settings; site now live (200).

---

## 8. Engine — technical detail

**Environment:** Python 3.14 locally (CI uses 3.12). numpy 2.5.2, pandas 3.0.5, scipy 1.18.1,
PuLP 3.3.2, highspy 1.15.1, lightgbm 4.7.0, scikit-learn 1.9.0, pvlib 0.15.2, pyarrow 25.0.1,
plotly 7.0.0, matplotlib 3.11.1, python-pptx 1.0.2, requests 2.34.2, pytest 9.1.1.

### 8.1 Configuration (`config/station.json`)
Every leaf: `{value, unit, source, confidence, sensitivity:[lo,hi]}`; `ASSUMPTION:` / `DESIGN
CHOICE:` sources are flagged in the dashboard's Assumptions tab.

| Group | Values |
|---|---|
| Site | Maitri, −70.7667, 11.7333, 130 m |
| Population | 45 summer (15 Nov–1 Mar), 25 winter, 10-day ramps |
| Thermal | UA 4.2 kW/K, setpoint 20 °C, electrified heat 0.45, waste-heat recovery 0.35, snow-melt 11 kWh/person/day |
| Loads | science 12 kW, life-safety 8 kW, domestic 0.42 kW/person, workshop 18 kW peak (summer) |
| PV | 120 kWp, 70° tilt, north-facing, albedo 0.85, temp coeff −0.004/K, losses 0.12, bifacial 0.10 |
| Wind | 3 × 30 kW, hub 20 m, cut-in 3.5 / rated 12 / cut-out 25 m/s, shear 0.14, de-ice 6% |
| Battery | 400 kWh / 150 kW, SoC 15–95%, RTE 0.90, degradation 0.02 L-eq/kWh |
| DG1 | 125 kW, a 0.084, b 0.246, start 3.5 L, min load 30%, min up/down 2 h |
| DG2 | 60 kW, a 0.084, b 0.252, start 2.0 L |
| Fuel | tank **72,000 L** (calibrated), reserve floor 6,000 L, resupply 1 Feb, target 0.99 |
| Clean air | inlet bearing 45°, half-width 60°, wind 1–8 m/s, penalty 40 L-eq/genset-h, soft |
| Snow/ice | accum 0.22/cm, scour 0.030/h per m/s >8, melt >−2 °C, weekly clean if >0.4, icing −12…+0.5 °C, max derate 0.55 |
| Simulation | train 2019–2022, test 2023, MC 2015–2022, horizon 36 h, step 6 h, seed 26061 |

**Tank calibration:** `calibrate.py` — baseline B burns 111,314 L/year (0 outages) and 73,719 L
over the 210-day season with an unlimited tank; configured tank 72,000 L ≈ 0.98×, so
survivability is genuinely at stake. Disclosed as a design choice.

### 8.2 Modules
- **weather.py** — Open-Meteo ERA5 fetch, retries, Parquet cache per year.
- **twin.py** — occupancy ramp; heating `UA·max(0,Tset−T) − 0.12·occ`, ×(1−WHR)×electrified;
  snow-melt diurnal + colder-snow factor; domestic with N(1,0.08) noise; workshop summer-only;
  tiers critical (science+life), essential (heat+melt), deferrable (workshop), sheddable
  (domestic). PV via pvlib solar position → Erbs → isotropic POA → Faiman cell temp. Wind via
  shear + `ρ=p/(R·T)` density ratio + cubic power curve. Affine genset fuel `L/h = a·Prated + b·P`.
- **availability.py** — snow-cover integrator, icing risk with 4 h half-life persistence,
  derates PV ×(1−cover) and wind ×(1−0.55·risk), de-icing decision.
- **cleanair.py** — plume direction = wind_from+180; flag if within ±60° of inlet and 1–8 m/s,
  or stagnation <1 m/s. ~23% of hours flagged at Maitri.
- **forecast.py** — `NWP` degrades truth with AR(1) error ∝ √(lead/48) (temp 0.35, wind 0.55,
  dir 0.50, GHI 0.45, snow 0.70, pressure 0.25, RH 0.40). LightGBM quantile α 0.1/0.5/0.9,
  9 models, direct multi-horizon (leads 1–48), 22 features, 420,249 rows, ~35 s training.
- **fuelbudget.py** — daily fuel need per weather year; 8-year ensemble by day-of-year; daily
  allowance = 99th percentile, scaled to tank; online `horizon_budget` = window allowance +
  clip(0.35·carry, ±0.5·window), floor 0.15·window.
- **dispatch.py** — MILP (PuLP/HiGHS, gap 2%, 3 s limit, 4 threads), 36 h horizon. Vars:
  commitment, power, start, charge/discharge, SoC, battery reserve, curtail, tier shed,
  over_budget. Reserve = (load p90−p50) + (renewable p50−p10). Objective in litre-equivalents:
  fuel + starts + clean-air penalty + 0.02·throughput + shed penalties (critical 5000, essential
  40, deferrable 3, sheddable 8) + 0.001·curtail + **25·over_budget (soft budget)**. Tight
  pairwise min-up/down (aggregated form was 40× slower).
- **controllers.py** — A fixed schedule; B tuned rule-based (hourly, persistence, SoC 0.45/0.85/
  0.25); C proposed MPC; C-point ablation (point forecast, fixed 10% reserve); D perfect-
  foresight oracle. Tier split from last 24 h of history and clean-air flags from forecast wind
  (no information leaks; only D sees truth).
- **harness.py** — shared physical resolver: cheapest-marginal genset allocation within min-load,
  battery absorbs/supplies, shed sheddable→deferrable→essential→critical; dry tank forces off.
- **metrics.py** — fuel, % vs A/B, gap closed to oracle, outage events/kWh, renewable use,
  curtailment, runtime, starts, battery cycles, clean-air compliance, solve time.
- **scenarios.py** — blizzard (4 days), primary genset failure (48 h), forecast bust (12 h).
- **setpoints.py** — 10-register Modbus map + MQTT topics `station/maitri2/ems/...` (untested on hardware).
- **report.py** — `results/run.json`, `dashboard/dashboard.html` (Plotly inlined, offline).

### 8.3 Tools
| Command | Purpose | Time |
|---|---|---|
| `python run.py --days 210` | full season, all controllers + stress tests | ~60–75 min |
| `python run.py --days 30 --no-scenarios --controllers A,B,C` | sanity | ~4 min |
| `python calibrate.py` | size the tank | ~1 min |
| `python sizing.py` | Maitri II PV/wind/battery sweep | seconds |
| `python sensitivity.py` | B vs C at parameter extremes | ~20 min |
| `python watch_ps.py --all-moes` | portal diff | seconds |
| `python emit_setpoints.py` | Modbus/MQTT replay | ~2 min |
| `python make_ppt.py --team "..." --team-id ...` | build the SIH deck | seconds |
| `python -m pytest tests -q` | 14 tests | ~2 s |

---

## 9. Engine results — all numbers

### 9.1 Main 210-day season (2023-02-01 → 2023-08-30, 5,041 h)
Tank 72,000 L, floor 6,000 L, horizon 36 h, step 6 h, identical weather for all.

| Controller | Fuel (L) | vs B | Critical outages | Unserved critical (kWh) | Renewable used | Clean-air compliance | Starts |
|---|---|---|---|---|---|---|---|
| A fixed schedule | 72,000 (**dry**) | 0% | 36 | 9,266.6 | 69.1% | 40.5% | 280 |
| B tuned rule-based | 72,000 (**dry**) | 0% | 6 | 328.4 | 84.8% | 27.4% | 277 |
| **C proposed** | **63,384.7** | **−12.0%** | **0** | **0.0** | 92.5% | 43.7% | 437 |
| C-point ablation | 63,279.6 | −12.1% | 1 | 8.3 | 92.7% | 43.3% | 439 |
| D oracle | 62,484.6 | −13.2% | 0 | 0.0 | 93.5% | 49.0% | 358 |

- **C closes 91% of the B→D gap.**
- Both baselines empty the tank; C finishes above the reserve floor.
- Wall clock: C 608 s, C-point 888 s, D 605 s (840 solves each); A 2.8 s, B 8.3 s.

### 9.2 Stress tests (same season)
| Scenario | B unserved critical | C unserved critical |
|---|---|---|
| Four-day blizzard | 809.1 kWh / 8 events | **0.0 kWh / 0 events** |
| Primary genset down 48 h | 325.8 kWh / 3 events | 97.9 kWh / 1 event |
| 12 h forecast bust | — | 0.0 kWh; fuel 63,373 L vs 63,385 nominal |

### 9.3 Forecast skill (unseen 2023, walk-forward)
| Target | MAE | MAPE | p90 coverage |
|---|---|---|---|
| Load | 1.82 kW | 2.2% | 89% |
| PV | 3.01 kW | 12.1% | 93% |
| Wind | 6.53 kW | 20.0% | 90% |

### 9.4 Seasonal allocator
Usable 66,000 L; mean-year need 72,024 L; P99-year need 132,303 L; **binding**.

### 9.5 Twin characteristics (2023)
Annual load 733.2 MWh; PV 213.5 MWh; wind 290.3 MWh; renewable share ~57%; peak load 118.1 kW;
winter mean 84.8 kW @ 25 people vs summer 88.1 kW @ 45 (per-capita demand ~doubles in winter;
essential/heat load higher in winter — total load is NOT higher, so don't overclaim).

### 9.6 Sizing sweep (210-day season, 8 years, tank 72,000 L)
| PV kWp | Wind kW | Battery kWh | Mean season L | P99 L | P(run dry) |
|---|---|---|---|---|---|
| 200 | 180 | 400 | 44,252 | 51,888 | 0% |
| 120 | 180 | 400 | 49,024 | 55,851 | 0% |
| 80 | 180 | 400 | 53,147 | 59,971 | 0% |
| 200 | 90 | 400 | 65,125 | 73,938 | 50% |
| 120 | 90 | 400 (configured) | 71,701 | 80,567 | 88% |
| 80 | 90 | 400 | 76,834 | 86,049 | 88% |

Smallest configuration that never runs dry: **80 kWp PV / 180 kW wind / 400 kWh battery**.

### 9.7 Early 30-day run (old 210,000 L tank, superseded)
A 14,238 L; B 7,183 L (9 outages, pre-fix); C 6,642 L (0); D 6,463 L. Only historical.

---

## 10. Pink Monster web demo (`web/`)

**What it is:** dependency-free JavaScript browser simulation of the same workflow — **seeded
synthetic weather**, not ERA5. Its numbers are illustrative; never quote them as the engine's.

- Node ≥20 (developed on 24); no `npm install`; `npm run dev` → http://localhost:3000.
- `npm test` (8 tests incl. 210-day invariant), `npm run build` (asset + reproducibility check).
- Planner: beam search width 14, 36 h horizon, re-plan every 6 h and on availability change.
- Gensets 60/125 kW, one active, 30% min load; idle 2.1/3.5 L/h, slope 0.24/0.25.
- Battery 15–95% SoC, 95% each way. Load tiers fixed 50/30/20.
- Allowance = flat `fuel / days remaining` (simpler than the engine's Monte Carlo).
- Defaults: 30 days, solar 80 kW, wind 100 kW, battery 400 kWh/100 kW, fuel 16,000 L, SoC 65%, seed 61.
- Default 30-day result: rules 9,889 L vs planner 9,382 L (−5.1%), 0 unmet.
- Run time after fix: 7 d ~1.0 s, 30 d ~1.0 s, 90 d ~2.0 s, 210 d ~2.0 s (raw sim 46–217 ms).
- CSV export: 1,441 rows × 29 columns including a plain-English `reason` per hour.

**Views:**
- **Mission overview** — configure station, run, 4 KPIs (fuel left, critical served, unmet,
  battery end), fuel vs straight-line budget chart, rules vs planner table.
- **Dispatch explorer** — any hour: timeline, power balance, reserve & priorities, forecast at
  that hour, fuel allowance & carry-forward. The "not a black box" view.
- **Resilience lab** — polar winter, four-day blizzard, generator failure, forecast misses a lull.
- **Model & guide** — calculation method, scope, build guide, CSV/JSON exports.

---

## 11. Bugs found and fixed (worth knowing)

| Bug | Effect | Fix |
|---|---|---|
| Aggregated min-up/down constraint | 18–21 s MILP solves | Tight pairwise form → ~0.5 s |
| Hard fuel-budget row | 3 s time-limit hits, possible infeasibility | Soft budget priced at 25 L-eq/L → ~0.3 s |
| Baseline B deciding every 6 h | 82 outages/yr — strawman | Hourly decisions → 0 outages/yr |
| Tank 210,000 L | allocator never bound; differentiator invisible | Calibrated 72,000 L |
| MPC used future tier shares & true clean-air flags | information leak | History shares; forecast-wind flags |
| Unbounded carry-over credit | frugal autumn → unlimited winter | Clamped ±0.5·window |
| DataFrame stored in `.attrs` | pandas crash | Stored as list of dicts |
| `requirements.txt` had only 2 lines | CI failed at import (~25 s) | Restored 10 deps (`732192a`) |
| Pages not enabled / token read-only | deploy failed at `configure-pages` | `enablement: true` + repo settings; now live |
| **Demo `app.js` never called `worker.postMessage`** | Run simulation hung forever; all shown results were the precomputed JSON | One line added (`cccad90`) |

---

## 12. Deliverables and where they are

| Deliverable | Location |
|---|---|
| Strategy analysis PDF (input) | `Downloads\SIH26061_Analysis (1).pdf` |
| SIH idea template (input) | `Downloads\SIH2025-IDEA-Presentation-Format.pptx` |
| Pink Monster zip (input) | `Downloads\Pink_Monster_Demo_Source.zip` |
| **Idea deck** (6 slides, HIMSHAKTI) | `engine/submission/SIH26061_Idea_Presentation.pptx` + `.pdf` |
| Deck figures | `engine/assets/deck/` |
| Offline engine dashboard | `engine/dashboard/dashboard.html` |
| Results | `engine/results/run.json`, `metrics.csv`, `sizing.csv` |
| Demo script + Q&A | `engine/docs/demo_script.md` |
| Findings & suggestions | `engine/docs/findings_and_suggestions.md` |
| External review brief (GPT Pro) | `engine/docs/HANDOFF_BRIEF.md` |
| Deployable demo zip (fixed) | `Downloads\pink-monster-dist.zip` (230 KB) |
| Live demo | https://aditya-eng.github.io/SIH26061/ |

### Deck structure (official template, 6 slides)
1. Title — PS ID, title, theme, category, Team ID/Name (**still placeholders**), HIMSHAKTI tagline.
2. Idea — "fuel survivability, not another dashboard": proposed solution, detailed explanation, how it addresses the problem, innovation; tank chart + clean-air sector rose.
3. Technical approach — stack + 7-stage pipeline diagram.
4. Feasibility & viability — feasibility, risks, strategies; controller comparison chart.
5. Impact & benefits — NCPOR / Maitri II; impact tiles.
6. Research & references.
Portal accepts **PDF only**.

---

## 13. Submission form text (SIH project submission Google Form)

Form fields: Email, Team Name, PS ID, PS Title, Theme, Category, **Project Description
(paragraph)**, **Technology Stack (paragraph)**, GitHub link, PPT link (Drive/OneDrive), Demo
video (optional), Declaration.

Short fields: PS ID `SIH26061`; Title as above; Theme `Clean & Green Technology`; Category
Software; GitHub `https://github.com/Aditya-eng/SIH26061`.

**Project Description** — Problem (one delivery a year, fragile renewables, thermal loads peak
when generation is worst, own exhaust contaminates science, commercial EMS assume refillable
tanks) → Proposed solution (two-level: Monte Carlo allocator over 9 years ERA5 holding ≥99%
survivability; MILP re-planning on 36 h horizon; LightGBM quantiles size reserve) → Key
features (physics twin, resupply budgeting, science-integrity dispatch, availability
forecasting, sourced parameters, offline) → Impact (−12% fuel vs tuned baseline, 0 vs 6
critical outages, 91% of oracle gap, blizzard 809 kWh → 0; Maitri II applicability).

**Technology Stack** — Python 3.12+, JavaScript ES modules; LightGBM, scikit-learn, NumPy,
pandas, SciPy; PuLP + HiGHS, rolling-horizon MPC, Monte Carlo; pvlib; ERA5 via open archive,
Parquet/pyarrow; dependency-free JS frontend with Web Workers, Plotly; no database by design
(offline-first); GitHub Actions CI, GitHub Pages, pytest; Modbus/MQTT interfaces.

---

## 14. Demo recording guide

- Record either the live site or `npm run dev` (localhost:3000). Press **Reset** first.
- One-liner: "A polar station gets one fuel delivery a year — this decides how to spend it so
  the science never goes dark before the ship comes back."
- Don't open the CSV in Excel on camera — click export, say "1,440 rows, 29 columns, a reason
  for every decision", move on (or cut to a pre-opened window for 2–3 s).
- Keep saying "simulation" / "synthetic weather" over demo footage; engine numbers belong to
  the engine.

### Five-minute pitch order
0:00–0:45 the two polar constraints · 0:45–1:45 season replay / fuel gauges · 1:45–2:30
blizzard · 2:30–3:15 clean-air window · 3:15–4:15 results vs B and D + ablation · 4:15–5:00
assumptions and limitations.

### Hard questions (short answers)
- *Why AI?* Dispatch is MILP; AI provides calibrated uncertainty that sizes reserve (ablation C-point).
- *ABB/Schneider do this?* For refillable tanks — not one annual resupply, not exhaust contamination.
- *Your data?* Weather real (ERA5); load synthetic and sourced — Assumptions tab.
- *Wrong forecast?* Re-solve every step, P90 reserve, forecast-bust test shows 0 kWh lost.
- *Hardware?* Modbus/MQTT setpoints exist; hardware-in-the-loop is next.

---

## 15. Known weaknesses (state them first)
1. Same team built simulator and controller (mitigated: tuned B, oracle D, ablation, sensitivity).
2. No real polar load data.
3. Winter-peak signal weaker than literature in total-load terms.
4. High renewable share (~57%) invites "does diesel matter?" — lead with winter.
5. Maitri II ratings speculative → framed as sizing/policy explorer.
6. Single test year, single seed, no confidence intervals.
7. Ablation is thin: C-point uses 0.17% less fuel with 1 outage vs 0 — one event.
8. No hardware in the loop.
9. Demo and engine use different physics/allowance logic (see §16).

---

## 16. Open to-dos and suggestions

**Before submission/next round**
- Fill Team Name / Team ID → `python make_ppt.py --team "..." --team-id ...`, re-export PDF, upload to Drive ("anyone with link").
- Commit this file if wanted (`git add PROJECT_CONTEXT.md`).
- Confirm with SPOC that SIH26061 (not 26060) is blocked for the team.
- Try pulling real Maitri AWS data from data.ncpor.res.in to replace/validate ERA5.

**Engine**
- Checkpoint each controller's log as it completes (long runs lose everything on crash).
- `make_ppt.py` hardcodes `~/Downloads/...pptx` — commit template, add `--template`.
- Move penalties and solver settings into `station.json`.
- Add `pyproject.toml`; drop `sys.path.insert` hacks.
- Tests for carry-over clamp and controller B thresholds.
- Rename `pct_runtime_at_efficiency_point` (affine curve optimum is 100% load).
- Pin requirements; `--offline` flag.
- Multi-seed / multi-year runs with confidence intervals to make the ablation decisive.

**Demo**
- Unify physics: feed engine `station.json` and allocator allowance into `web/dist/data/`.
- Reformat `app.js`/`simulation.js` (minified-style lines).
- Rename `forecast()`'s `pv` field (it carries all renewables; `wind: 0`).
- Update README's "privately hosted demo" section to the live URL.
- Show the allowance curve visually.

**Repo**
- Add a LICENSE.
- Plotly is stored twice (vendor + inlined) — fine but explains repo size (~14 MB).

---

## 17. References
- de Witt, Chung & Lee (2024). Mapping Renewable Energy among Antarctic Research Stations. Sustainability 16(1), 426. doi:10.3390/su16010426
- Modeling Hybrid Renewable Microgrids in Remote Northern Regions. Energies (2025) 18, 5827. doi:10.3390/en18215827
- Learning from Arctic Microgrids. Sustainability (2025) 17, 5996. doi:10.3390/su17135996
- MPC-based EMS for an isolated electro-thermal microgrid. Energy Conversion and Management (2024)
- Parent & Ilinca (2011). Anti-icing and de-icing techniques for wind turbines. Cold Regions Sci. Tech. 65, 88–96
- Obara et al. (2013), Syowa Base energy networks, Applied Energy 111
- Olivier et al. (2008), SANAE IV solar evaluation, Renewable Energy 33
- Tin et al. (2010), Energy under extreme conditions: Antarctica, Renewable Energy 35
- Tools: ERA5 (ECMWF/Copernicus), pvlib, LightGBM, HiGHS, PuLP
