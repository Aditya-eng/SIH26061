# HIMSHAKTI web console

The public face of SIH26061: how an Antarctic research station should spend one tank of fuel a
year. **Live:** https://aditya-eng.github.io/SIH26061/

## What it shows — and what it does not

The console displays the real engine's outputs and nothing else. There is no simulation, random
number generator or placeholder data in this app; a test fails if one is added.

| Data | Source | Label on screen |
|---|---|---|
| Weather | ERA5 reanalysis (ECMWF/Copernicus), hourly, at Maitri's coordinates | *Measured weather* |
| Station loads, solar, wind, snow and ice | The engine's physics model of the station | *Modelled station* |
| Every controller result | Closed-loop runs in `../engine` on that weather | *Optimised result* |
| Forecast accuracy | LightGBM quantile forecasts scored on an unseen year | *ML forecast* |

No polar station publishes its electricity use, so loads are modelled rather than measured. The
model includes one disclosed, fixed pseudo-random component (hour-to-hour domestic and workshop
variation); it is shown on the data page.

The JSON in `public/data/` is written by `../engine/export_web_data.py` and cross-checked by
`../engine/verify_data.py`. Never edit it by hand.

## Pages

| Page | What it answers |
|---|---|
| **Overview** | The problem in three sentences, two tanks draining over the same winter, the three headline results |
| **The winter** | Day-by-day fuel for all five controllers, with a play button, the reserve line and the days critical power failed |
| **Hour by hour** | One real week (17–23 May 2023): where every kilowatt came from, battery charge, clean-air windows, and a plain-English reading of any hour |
| **Bad days** | Blizzard, generator failure and a badly wrong forecast — critical energy lost, rule-based vs HIMSHAKTI |
| **Design Maitri II** | Sliders for solar, wind and battery size over 144 real combinations; diesel need and winters that run dry across eight ERA5 winters |
| **The data** | Provenance of every number, season weather, availability vs weather, forecast accuracy, the honest limits of the fuel budget, all 64 assumptions |

## Stack

- **React 19** with **Vite**
- **[Emotion](https://emotion.sh)** — all styling, one theme object (`src/theme.js`)
- **[Motion](https://motion.dev)** — path drawing, springs, the sliding tab indicator, the morphing play button, number tickers
- Design patterns borrowed (not copied) from **[Bklit UI](https://ui.bklit.com)** — composable charts built from frame + series parts; **[Kokonut UI](https://kokonutui.com)** — shimmer heading, lifting cards; **[Watermelon UI](https://ui.watermelon.sh)** — segmented control, play/pause morph, rolling numbers. Those libraries are Tailwind registries; their patterns are re-implemented here in Emotion so the app has one styling system.
- Charts are hand-built SVG (`src/components/charts.jsx`) — no chart library.
- Font: Figtree, bundled through Fontsource so the built site works offline.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # 12 data-integrity tests
npm run build      # -> dist/
npm run preview    # serve the built site on http://localhost:3000
```

Serve the folder over HTTP; opening `dist/index.html` from disk will not load the data files.

## Refresh the data after a new engine run

```bash
cd ../engine
python run.py --days 210        # ~75 min, all controllers and stress tests
python export_web_data.py       # writes ../web/public/data/*.json
python verify_data.py           # must report 0 FAIL
cd ../web && npm test && npm run build
```

## Deploy

GitHub Actions (`.github/workflows/deploy-demo.yml`) runs the tests, builds and publishes
`web/dist` to GitHub Pages on every push to `main`. Netlify (`netlify.toml`, base `web`) and Vercel
(`vercel.json`, set Root Directory to `web`) also work.
