# Pink Monster — Internal-Round Build & Demo Guide

**Project:** Fuel-Survivability Energy Management  
**Problem statement:** SIH26061  
**Team:** Pink Monster  
**Stage:** Internal hackathon prototype

## 1. What this demo is meant to show

Show how an offline decision-support console can coordinate diesel, solar, wind and battery resources to protect critical station loads until resupply. The internal round demonstrates the workflow and simulated decisions. **ML model training, analysis of validated data and final performance evaluation will be done for the final build.**

The supplied guide and six-slide concept presentation define the product direction. The supplied hourly CSV is an unfinished earlier example. It is preserved as reference material, not treated as training data, ground truth or a validated benchmark.

The app has four views: Mission overview, Dispatch explorer, Resilience lab and Model & guide. Use the companion-guide button on desktop to place instructions beside the app.

## 2. Run the actual application

Use Node.js 24 LTS. From the extracted source directory:

```sh
npm run dev
```

Open `http://localhost:3000`. No dependency installation or API key is required. The application must be served over HTTP rather than opened as a `file://` page. Local execution needs no internet once the files and Node.js are available.

```sh
npm test
npm run build
```

`npm run build` checks syntax, local assets and consistency of the starting example with the current engine. Deploy `dist/`. This implementation uses JavaScript, so the earlier guide's TypeScript-specific commands do not apply.

## 3. Demonstration, step by step

### A. Configure and run

Start with 30 days, 16,000 litres of fuel, 80 kW solar, 100 kW wind, a 400 kWh battery, a 100 kW battery power limit, 65% initial SOC and seed 61. Leave the reserve setting at Balanced and choose Polar winter.

Click **Run simulation**. The simulator computes both controllers in a background worker. A progress message identifies the controller and mission day. Cancel preserves the last completed result.

Changing a setting marks the visible result as belonging to the previous run. Run again to apply the new configuration. The example initially shown on page load was produced by exactly the same simulation engine; it is not hard-coded presentation data.

### B. Explain the mission overview

Read fuel at the end of the mission, critical demand served, all unmet demand and battery end state. The chart compares the two controllers with a straight-line fuel budget trajectory.

The comparison table reports both controllers' fuel use, all unmet energy, critical unmet energy and final stored battery energy. Do not announce a fuel advantage without these other quantities. Ending batteries are not constrained to be equal. A lower fuel result is an outcome of this synthetic run, not validated operational savings.

### C. Inspect the dispatch

Open **Dispatch explorer** and move the hour slider. Select either controller.

Show solar, wind, the active diesel unit and battery charge/discharge. Match these against station demand, served demand and curtailment. Read the dispatch explanation and whether the planner refreshed at that hour.

Positive battery power supplies demand. Negative power charges the battery. The battery panel shows stored energy, SOC, its 15–95% operating band and the selected reserve target. Headroom is an instantaneous one-hour capacity estimate, not an outage probability or firm reliability margin.

The three priority rows show shortages for critical, essential and domestic demand. Domestic demand is shed first when supply is insufficient, then essential, then critical.

### D. Explain fuel budgeting

The starting daily allowance equals initial fuel divided by mission days. The cumulative unused allowance is carried forward. A negative carry-forward balance means fuel has been spent ahead of the original budget.

The revised daily allowance is fuel remaining at the start of the selected hour divided by remaining mission time, with a one-day minimum denominator. The planner applies a soft scarcity cost using remaining fuel. The daily allowance is advisory rather than a hard dispatch constraint.

### E. Run disruption scenarios

Open **Resilience lab**. Each stress-test button computes a fresh run for both controllers using current station settings.

| Scenario | What changes | What to inspect |
|---|---|---|
| Polar winter | Synthetic low solar, variable wind and cold-dependent demand | Normal dispatch and fuel profile |
| Four-day blizzard | Solar and wind are zero for 96 hours | Diesel dependence, fuel use and battery reserve |
| Generator failure | The 125 kW unit is unavailable for 48 hours; the 60 kW unit remains | Restricted capacity, shortfalls and fault-triggered replanning |
| Forecast misses a lull | Actual wind falls to 3% for 48 hours; the synthetic forecast misses the drop | Forecast optimism, reserve changes and shortages |

The disruption begins at hour `min(240, floor(total_hours / 3))`. Its end is capped by mission duration. Therefore short missions truncate the nominal 96- or 48-hour disruption. The UI displays the actual window.

The simplified blizzard forecast anticipates the loss of renewables. Generator faults become known when detected at the hourly boundary. The planner then assumes the observed equipment availability persists over its horizon; recovery is not known in advance. The missed-lull scenario is intentionally optimistic.

### F. Show the sampling advisory

The console suggests the best four-hour period in the first day using the largest average lower-range renewable margin after station demand. It labels a negative margin explicitly.

This suggests when an operator could examine a sampling task. It does not create a new sampling load or actually move a task. A full flexible-load scheduler belongs in the final build.

### G. Export and explain the limits

Download **Hourly CSV** and **Full run JSON**. Exports contain the latest completed run, not settings that have not yet been applied. The JSON includes the actual configuration, model version, disruption window, both controllers and summary results.

Open **Model & guide**. Explain what the internal prototype implements and what the final-round architecture will add. The model is not connected to physical equipment.

## 4. Implemented model

| Component | Behavior |
|---|---|
| Duration | 1–210 days, one-hour steps |
| Weather | Seeded synthetic short daylight, variable wind and temperature |
| Demand | Base station demand, daytime increase and temperature-dependent increase |
| Snow / icing | Illustrative fixed factors: solar 0.72, wind 0.82 |
| Solar / wind | Adjustable nameplate capacities; output cannot be negative |
| Diesel | One of 60 / 125 kW units; minimum output 30% of rating |
| Fuel model | 60 kW: `2.1 + 0.24 × P` L/h; 125 kW: `3.5 + 0.25 × P` L/h |
| Empty / low tank | Generator output is limited by fuel; it switches off if the fuel cannot support minimum output for one hour |
| Battery | 15–95% SOC; energy and power constraints; 95% charge and 95% discharge efficiency |
| Load shares | Critical 50%, essential 30%, domestic 20% |
| Rules | Measured demand and renewables; SOC thresholds and generator hysteresis |
| Planner | Width-14 beam search, seven discrete generator actions, 36-hour horizon |
| Replanning | Every six hours, plus detected generator availability changes |
| Objective | Strong shortage penalties by priority, fuel scarcity, starts and heuristic reserve costs |
| Reserve targets | Lean 25%, balanced 35%, conservative 45% of battery capacity |
| Exports | Actual values, not rounded dashboard numbers |

Hourly electrical balance:

```text
PV + wind + diesel + battery discharge
    = served load + battery charge + curtailment

E_next = E + 0.95 × charge − discharge / 0.95
```

Because the interval is one hour, the numerical kW flow corresponds to kWh for that interval. Energy losses are tracked separately. Charging and discharging cannot occur simultaneously in the model.

The planner shortage weights are 10,000,000 / 100,000 / 10,000 per kWh for critical / essential / domestic demand. These are weighted penalties, not a mathematical lexicographic or global-optimality guarantee. Approximate search can make imperfect choices. The UI does not assume the planner always wins.

## 5. What remains for the final build

The internal round does not contain ERA5 ingestion, pvlib-based physical forecasting, trained LightGBM, a MILP solver, sensors or hardware control. Forecast ranges are synthetic and use the generated weather as their starting point. They are not independently trained ML forecasts or calibrated confidence intervals.

The proposed final stack in the PPT is Python, ERA5, pvlib, LightGBM, PuLP + HiGHS and Plotly. It is a roadmap, not a description of this browser implementation. Keeping the demo independent of that stack makes the internal workflow usable now while data and model evaluation remain unfinished.

Final-round work:

1. Establish the station location, weather time zone, equipment ratings, load categories and resupply horizon.
2. Calibrate generator fuel curves, renewable derating and battery behavior against credible station or equipment data.
3. Ingest historical weather and measured loads, recording provenance, missing data and units.
4. Train independent forecasts. Use chronological train / validation / held-out year splits. Avoid future-data leakage.
5. Evaluate forecast error and quantile coverage before using ranges to size reserves.
6. Implement a formal solver with generator constraints, fuel budgets, battery bounds and flexible task timing.
7. Compare controllers on identical scenarios, disclose all load shortfalls and account for final battery energy.
8. Test several weather years, seeds, blizzards, unexpected lulls and equipment faults.
9. Validate operator decisions, then a low-voltage bench prototype if hardware is part of the submission.

Not modeled here: subhour stability and frequency, thermal networks, ramp rates, start delays, minimum up/down time, cold battery derating, actual sensor feedback or physical actuation. It is not safe to use this prototype to control station equipment.

## 6. Suggested voiceover for the real app recording

Record the actual application, not a slideshow of screenshots. Aim for approximately three minutes. Rehearse once so the controls and exports work on the recording machine. Keep narration consistent with the numbers on screen rather than reading provisional totals from the draft PPT.

**0:00–0:25 — Problem and configuration**

“Pink Monster is a fuel-survivability energy management concept for polar research stations. The aim is to coordinate diesel, renewables and battery reserve while keeping critical loads supplied until resupply. This internal-round prototype uses synthetic inputs to demonstrate the workflow. Here I can change the mission duration, available fuel and station resources.”

**0:25–0:55 — Run and comparison**

“I am running the same mission with two controllers. The rules controller reacts to current demand and battery charge. The forecast planner searches a 36-hour schedule and refreshes it every six hours. We compare fuel use together with all unmet demand, critical shortages and the battery's final energy. These are computed simulation outcomes, not validated field results.”

**0:55–1:30 — Hourly dispatch and fuel budget**

“The dispatch explorer shows exactly what happened in each hour. Renewable power, diesel and the battery balance the station's served demand. The battery has energy, power and state-of-charge limits. When available supply is insufficient, domestic demand is reduced before essential and critical demand. This panel also shows the fuel allowance, carry-forward balance and available reserve.”

**1:30–2:10 — Disruption**

“Now I will run the four-day blizzard. Solar and wind become zero during the disruption window. The resulting fuel and battery changes are calculated by the model. The other scenarios remove the larger generator or make the forecast miss a renewable lull. We inspect the actual shortfalls instead of assuming the planner always succeeds.”

**2:10–2:35 — Advisory and exports**

“The console offers a four-hour sampling-window advisory using the renewable forecast margin. It does not yet schedule a real sampling load. I can export every hourly decision as CSV and the full configuration and results as JSON, so this run can be inspected and reproduced.”

**2:35–3:00 — Final-round path**

“For this internal round, the working contribution is the console, physical simulation, controller comparison and resilience testing. Validated weather ingestion, trained ML forecasts, formal optimisation and hardware validation are the next stage. The model screen makes this boundary clear.”

A narrated video has not been generated in this package. The team must record and attach the actual app demonstration.

## 7. Six-slide PPT alignment

The uploaded PPT already contains six slides. Its overall problem → solution → technical approach → feasibility → impact → references structure fits the demo. Keep that structure while distinguishing proposed final components from internal-round functions.

| Slide | Internal-round message and demo alignment |
|---|---|
| 1 · Problem | Fuel-survivability EMS for polar research stations; SIH26061; Team Pink Monster |
| 2 · Proposed solution | Fuel allowance, renewable forecast ranges, diesel / battery decisions and load priorities |
| 3 · Technical approach | Show the actual browser simulator and approximate 36h / 6h planner. Label Python / ERA5 / LightGBM / MILP as the proposed final stack |
| 4 · Feasibility | Working offline simulation, configurable equipment and disruption tests; data and hardware validation remain future work |
| 5 · Demonstrated outcomes | Use a screenshot of one current run and its exact configuration. Show fuel, all shortages and end battery together. Do not use the provisional 210-day / 8,615 L figure as an internal-round result |
| 6 · References and next steps | Keep relevant research / method references from the concept deck; label implementation status. Do not cite the absent technical brief as available evidence |

The original concept PPT is preserved unchanged in `docs/references/`. It is not relabeled as a completed or validated final deck. The absent `SIH_HANDOFF_BRIEF_claude.md` mentioned in its references was not supplied and was not used.

## 8. GitHub and live deployment

Upload the full source-folder contents to the team's own GitHub repository. For GitHub Pages, choose GitHub Actions in the repository's Pages settings and run the included deployment workflow on `main`. The workflow tests the engine and publishes `dist/`.

Vercel and Netlify configuration files are also included. Both use `npm run build` and output `dist`. No backend credentials are required. Verify any hosted URL from a signed-out browser before promising access to judges. The privately hosted review demo may require your account.

Recommended repository content:

- Complete source and README.
- Final **six-page / six-slide PPT**.
- Link to the recorded application demo **with voiceover**.
- Live deployment link for any software-track bonus.
- Screenshots, this build guide and actual exported runs.
- Team ID and member roles.
- Hardware diagrams only if the chosen submission includes hardware.

Confirm additional organizer requirements, deadline and year directly. Do not mark the PPT review, recording or judge-access check as complete until the team actually performs them.

## 9. Code map and verification

- `dist/simulation.js`: deterministic weather, forecast assumptions, dispatch physics, planner, accounting and CSV generation.
- `dist/worker.js`: runs the model outside the UI thread.
- `dist/app.js`: all four views, controls, SVG charts, explanations, guide and downloads.
- `dist/style.css`: responsive navy / pink interface.
- `dist/data/default-run.json`: starting run produced by the current engine.
- `scripts/serve.mjs`: local HTTP server.
- `scripts/check.mjs`: syntax, asset and default-run consistency checks.
- `tests/simulation.test.mjs`: energy/fuel conservation, physical limits, priority shedding, faults, reproducibility, export and full-horizon checks.
- `README.md`: setup, deployment and submission status.
- `docs/FINAL_ML_INTEGRATION.md`: final-round implementation boundary.

Automated checks include the zero-resource case and a 210-day mission. The model checks do not establish field reliability or substitute for browser end-to-end testing. No browser visual/end-to-end tests were performed for this delivery; optional WebMCP integration could not be validated in a supported browser context.

## 10. Source provenance

`Pink_Monster_Build_Guide.md`, `pink-monster-hourly.csv` and `Pink_Monster_SIH26061_Visual_Edition.pptx` are preserved unchanged under `docs/references/`. They were used to establish scope and interaction flow. This implementation does not depend on the earlier app URL or unavailable earlier source folder. It is a new, standalone internal-round demo.
