# Pink Monster — Polar Mission Console

**SIH26061 · Fuel-Survivability Energy Management · Internal hackathon demo**

A working, offline-capable browser simulation for a polar research station. Configure resources, compare a reactive controller with a forecast planner, inject disruptions, inspect hourly decisions and export the complete run.

This internal-round build demonstrates the proposed workflow. It uses seeded synthetic weather and synthetic forecast ranges. **Trained ML, analysis of validated data and final performance claims are reserved for the final build.** The supplied CSV and presentation are draft reference material, not validation evidence.

## Run locally

Install Node.js 24 LTS, extract the source, and open a terminal in the project directory:

```sh
npm run dev
```

Open `http://localhost:3000`. No package installation, API key, database or internet connection is required to run the local demo. Serve it over HTTP; opening `index.html` directly as a file will not reliably support JavaScript modules, workers or the example JSON.

```sh
npm test
npm run build
```

The source is dependency-free JavaScript. `npm run build` validates JavaScript, asset paths and the precomputed example against a fresh simulation. `dist/` is the deployable application, not an intermediate folder. No TypeScript check is required in this implementation.

## Live deployment

The accompanying delivery includes a privately hosted demo. Judge access must be verified before that URL is used for submission. To publish from your own GitHub account:

1. Create a repository and upload **the contents** of this source folder, including `.github/workflows/deploy.yml` and `dist/`.
2. Use `main` as the default branch.
3. In repository **Settings → Pages**, choose **GitHub Actions** as the build source.
4. Push to `main`, or run **Deploy demo to GitHub Pages** in Actions.
5. Open the deployment URL returned by the workflow. Check it while signed out before sending it to judges.

The workflow runs simulation checks, validates assets and publishes `dist/`. Relative asset paths support a repository subpath. GitHub Pages availability depends on repository/account settings. The workflow has only contents-read, pages-write and OIDC permissions.

Alternative hosts: import the repository into Vercel using the included `vercel.json`, or Netlify using `netlify.toml`. The build command is `npm run build`; output is `dist`. A static host can also serve `dist/` directly. No backend secrets are needed.

## Demo flow

1. Run the default 30-day mission.
2. Compare fuel consumption, **all** unserved energy, critical shortfall and battery end energy.
3. Open Dispatch explorer. Change the controller and hour; explain generation, battery charge/discharge, demand priorities and reserve.
4. Open Resilience lab and run Four-day blizzard, Generator failure and Forecast misses a lull.
5. Inspect fuel allowance, carry-forward balance and the four-hour sampling advisory.
6. Open Model & guide, then export Hourly CSV and Full run JSON.

Use **Open companion guide** to keep instructions beside the application. The full [Markdown build guide](dist/BUILD_GUIDE.md) includes a voiceover script, architecture, assumptions and the submission checklist.

## Capabilities

| Requirement | Internal-round implementation |
|---|---|
| Station resources | Solar, wind, battery energy/power, initial charge, fuel and 1–210 mission days |
| Weather and demand | Deterministic seed, stylised solar/wind, cold-dependent demand, illustrative snow/icing factors |
| Diesel | 60 / 125 kW units; one active; 30% minimum loading; finite-tank fuel accounting |
| Battery | 15–95% SOC, charge/discharge limits, 95% efficiency in each direction |
| Rules controller | Measured net load and battery thresholds |
| Forecast planner | Approximate 36-hour, width-14 beam search; refresh every 6 hours and on detected availability changes |
| Load priorities | Critical 50%, essential 30%, domestic 20%; unmet energy disclosed separately |
| Fuel survivability | Remaining tank, initial allowance, carry-forward and revised daily allowance |
| Reserve | Synthetic forecast ranges, selectable battery reserve targets and one-hour headroom |
| Sampling | Advisory four-hour window; does not reschedule a real load |
| Disruption tests | Blizzard, 125 kW unit failure and missed renewable lull |
| Inspection | Fuel chart, comparison table, hourly chart, power balance and explanations |
| Export | Actual computed hourly CSV and complete JSON including configuration and model version |
| Offline use | Local HTTP server; no external assets, APIs or runtime dependencies |

## Important scope boundaries

- The planner is approximate beam search, **not** MILP or a globally optimal solution.
- Synthetic forecasts are derived from the generated weather with perturbations. They are not independent trained predictions. The blizzard is anticipated; the missed-lull test explicitly introduces forecast failure.
- No ERA5 ingestion, pvlib pipeline, trained LightGBM, PuLP/HiGHS solver, sensors or equipment-control connection is present.
- Fuel allowances are advisory and influence a soft scarcity cost; they are not a hard daily cap. Reserve is a heuristic, not a reliability guarantee.
- The controller comparison does not force equal ending battery energy. Read fuel differences alongside all unmet energy and terminal battery energy.
- The station and generator parameters are illustrative. There is no frequency/transient model, generator start delay, ramping constraint, minimum up/down time, thermal network, cold battery derating or multi-year reliability evaluation.
- This is a hackathon simulation, not equipment-control software.

See [final ML integration plan](docs/FINAL_ML_INTEGRATION.md) for the final-round boundary.

## Project map

```text
dist/
  index.html                  App entrypoint
  app.js                      Dashboard, charts, guide, controls and exports
  style.css                   Responsive pink / navy interface
  simulation.js               Physical model, forecasts, controllers and accounting
  worker.js                   Background simulation
  data/default-run.json       Reproducible starting example, computed by the engine
  BUILD_GUIDE.md               Companion guide and narrated-demo script
scripts/
  serve.mjs                   Local static server
  check.mjs                   Syntax, assets and example consistency checks
tests/simulation.test.mjs     Energy, fuel, limits, scenarios and reproducibility
docs/
  FINAL_ML_INTEGRATION.md      Final-round data / ML / solver plan
  references/                 Original uploaded guide, CSV and six-slide concept PPT
.github/workflows/deploy.yml  GitHub Pages deployment
vercel.json                  Vercel static deployment
netlify.toml                 Netlify static deployment
```

## Submission checklist

- [x] Working demo source, instructions and deployment configuration.
- [x] Complete Markdown build guide and voiceover script.
- [x] Supplied six-slide concept PPT included under `docs/references/`.
- [ ] Review the final **six-slide PPT**. Replace provisional performance claims with the demonstrated internal-round scope. The guide provides a corrected speaking outline.
- [ ] Record a **video of the actual app with voiceover**, upload it and put its accessible link below. A script is included; a recorded video is not included in this package.
- [ ] Publish or upload the source to the team's own **GitHub repository**. This package does not create a GitHub repository on your behalf.
- [ ] Add the **live deployment link**, verify judge access and check whether software-track bonus criteria apply.
- [ ] Add screenshots and any other organizer-required resources. Include hardware diagrams only if hardware is part of the submission.
- [ ] Fill Team ID and member roles; confirm the organizer's deadline and year directly.

| Submission field | Team to complete |
|---|---|
| Team ID | Pending |
| Members and roles | Pending |
| GitHub repository | Pending |
| Final six-slide PPT | Pending review of supplied concept deck |
| Narrated application video | Pending recording |
| Judge-accessible live URL | Pending access verification |
| Organizer deadline | Confirm directly |

## Source material

The three uploaded files are preserved unchanged in `docs/references/`. The new simulation does not train on or replay the draft CSV. Historical figures in those references are not reproduced as this demo's performance claims. The deck's listed final stack and research references inform the proposed direction, but those integrations are not represented as implemented here.

## Verification

The automated checks cover energy conservation, battery efficiency and limits, finite fuel, minimum generator loading, priority shedding, same-seed reproducibility, identical measured inputs for both controllers, 96-hour blizzard, unexpected renewable lull, immediate fault/restoration replanning, zero-resource conditions, CSV completeness, invalid inputs and a full 210-day simulation. Browser visual and end-to-end tests have not been performed in this delivery. Optional WebMCP tools are feature-detected; a supported browser context was unavailable for validation.

Note: on Vercel set the project Root Directory to `web`; this file is read relative to it.
