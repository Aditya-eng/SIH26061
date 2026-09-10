# Pink Monster — Build & Demo Guide

**Project:** Fuel-Survivability Energy Management · **PS:** SIH26061

## Working app

The first working prototype is built. It lets you change station resources, simulate a mission, compare controllers, inspect hourly decisions and download results. Live app: https://pink-monster-polar-ems.yeeshu911.chatgpt.site (currently private to your account). The local app is also available at http://localhost:3000 while its server is running.

## Use it alongside this guide

1. Keep the default 30-day settings and click **Run simulation**.
2. Read **Mission overview**. Compare fuel consumption, all unserved energy, critical shortages and final battery energy.
3. Open **Dispatch explorer**. Move the hour slider to see which generator runs, how the battery responds and the available reserve.
4. Select **Four-day blizzard**, then run again. The scenario removes solar and wind during its disruption window.
5. Try **Generator failure** or **Forecast misses a lull**. Examine shortfalls rather than assuming the planner always succeeds.
6. Open **Model & assumptions** for the calculation method and limits.
7. Download **Hourly CSV** or **Full run JSON** to preserve the actual inputs and outputs.

## What we have built

| Part | Implemented behavior |
|---|---|
| Station | Adjustable solar, wind, battery, fuel and mission duration |
| Weather | Seeded synthetic weather and temperature-dependent demand |
| Diesel | 60 / 125 kW units; one active; minimum loading and fuel accounting |
| Battery | Energy and power limits, 15–95% state of charge, efficiency losses |
| Rules | Dispatch from measured demand and battery thresholds |
| Planner | Approximate 36-hour beam search, replanned every six hours |
| Priorities | Critical, essential and domestic load shortfall penalties |
| Inspection | Fuel charts, hourly power, dispatch explanations, comparisons |
| Exports | Actual computed hourly CSV and complete JSON run |

## What the first result means

With the default settings, the planner used about **6,749 litres**, versus **7,935 litres** for the rules controller. Both had zero critical energy shortfall, but the planner left about **393 kWh of lower-priority demand unserved**, while the rules controller served all demand.

This is a trade-off to improve, not proof of a better controller. A fuel-saving claim must always disclose unserved demand and battery end state. Results are synthetic and are not field measurements.

## Run the code yourself

The source folder is `outputs/pink-monster-ems` beside this guide.

Install Node.js 24, open a terminal in that folder, then run:

```sh
npm install
npm run dev
```

Open the address printed in the terminal.

```sh
# Production build
npm run build

# Simulation checks
node --experimental-strip-types tests/simulation.test.mjs

# Type checks
npx tsc --noEmit
```

## Code map

- `lib/simulation.ts` — weather, physical calculations, controller decisions and results.
- `app/page.tsx` — interactive dashboard and downloads.
- `app/globals.css` — responsive styling.
- `tests/simulation.test.mjs` — conservation, limits, failures and reproducibility checks.
- `README.md` — setup, scope and submission checklist.

## What remains before claiming the full proposed solution

The app does **not** yet contain ERA5 ingestion, trained LightGBM forecasting, a MILP solver, sensors or hardware control. Forecast errors are synthetic, reserve margins are heuristic and generator faults are known to the simplified planner. It is not safe to use this prototype to control equipment.

Next: calibrate physical models, ingest historical weather, train independent forecasts with held-out years, implement a formal solver and fault-triggered replanning, then validate a low-voltage bench prototype.

## Real application demo plan

Record the working app with voiceover: configure → run → explain the comparison → inject a disruption → inspect dispatch → export results. Show the limitations screen. This should demonstrate actual software interactions; it is separate from the six-slide PPT. The new app video has not yet been recorded.

## GitHub submission

Create the team's own repository with this source, the final six-page PPT, the narrated application video link, screenshots and the live link once judge access is verified. Add hardware diagrams only if hardware is part of the submission. Fill in Team ID and member roles. Confirm the organizer's deadline and year directly.

