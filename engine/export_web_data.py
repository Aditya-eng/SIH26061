"""Export the real pipeline's outputs for the web app. No synthetic data leaves this script.

    python export_web_data.py          # writes ../web/public/data/{season,station,sizing}.json

season.json   every controller's totals, daily series, the hourly demo week, stress tests,
              forecast skill, fuel plan and the full assumptions table - copied from
              results/run.json, never recomputed, so the site cannot disagree with the deck.
station.json  the hourly station state for the scored season: ERA5 weather at Maitri and the
              physics twin built from it (loads, PV, wind, snow cover, icing, clean-air windows).
sizing.json   the Maitri II sizing grid: diesel need over the resupply season for every PV x wind
              x battery combination, across all eight ERA5 ensemble years.

Provenance is written into every file so the UI can label each number honestly:
  measured  = ERA5 reanalysis (ECMWF), hourly, at the station grid point
  modelled  = physics twin (no public electrical-load data exists for any polar station)
  optimised = closed-loop controller output on the measured weather
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from polarems.config import load_config  # noqa: E402
from polarems.fuelbudget import daily_fuel_need  # noqa: E402
from polarems.twin import build_twin, gensets  # noqa: E402
from polarems.weather import fetch_year  # noqa: E402

OUT = ROOT.parent / "web" / "public" / "data"
RUN = ROOT / "results" / "run.json"

LABELS = {
    "A": ("Fixed schedule", "Diesel on a clock. The weak baseline."),
    "B": ("Rule-based", "A well-tuned operator's rules, acting every hour. The fair baseline."),
    "C": ("HIMSHAKTI", "Forecast-aware plan inside a seasonal fuel budget. Our controller."),
    "C-point": ("HIMSHAKTI, no uncertainty", "Same planner with single-value forecasts. Shows what the AI adds."),
    "D": ("Perfect foresight", "Knows the future exactly. The best anyone could do - a ceiling, not a rival."),
}


def r(x, nd=2):
    if x is None:
        return None
    if isinstance(x, float) and (np.isnan(x) or np.isinf(x)):
        return None
    return round(float(x), nd)


def season_json(run: dict) -> dict:
    comp = {row["controller"]: row for row in run["comparison"]}
    rp = run["meta"]["run_params"]
    scored_hours = int(comp["C"]["hours"])
    controllers = []
    for cid in ["A", "B", "C", "C-point", "D"]:
        c = comp[cid]
        name, blurb = LABELS[cid]
        controllers.append({
            "id": cid,
            "name": name,
            "blurb": blurb,
            "fuel_l": r(c["fuel_l"], 1),
            "fuel_remaining_l": r(c["fuel_remaining_l"], 1),
            "ran_dry": bool(c["ran_dry"]),
            "fuel_vs_B_pct": r(c["fuel_vs_B_pct"], 2),
            "gap_to_oracle_closed_pct": r(c["gap_to_oracle_closed_pct"], 1),
            "critical_outage_events": int(c["critical_outage_events"]),
            "critical_outage_hours": int(c["critical_outage_hours"]),
            "unserved_critical_kwh": r(c["unserved_critical_kwh"], 2),
            "renewable_utilisation_pct": r(c["renewable_utilisation_pct"], 1),
            "curtailed_kwh": r(c["curtailed_kwh"], 0),
            "clean_air_compliance_pct": r(c["clean_air_compliance_pct"], 1),
            "clean_air_windows": int(c["clean_air_windows"]),
            "clean_air_violation_hours": int(c["clean_air_violation_hours"]),
            "starts": int(c["starts"]),
            "genset_total_runtime_h": int(c["genset_total_runtime_h"]),
            "battery_equivalent_full_cycles": r(c["battery_equivalent_full_cycles"], 1),
            "mean_solve_time_ms": r(c.get("mean_solve_time_ms"), 0),
        })

    daily = {}
    for cid, d in run["daily"].items():
        daily[cid] = {k: (v if k == "date" else [r(x, 2) for x in v]) for k, v in d.items()}

    week = {}
    for cid, w in run["demo_week"].items():
        week[cid] = {k: (v if k == "time" else [r(x, 3) for x in v]) for k, v in w.items()}

    scenarios = {}
    for sid, s in run["scenarios"].items():
        scenarios[sid] = {
            "label": s["label"],
            "controllers": {
                cid: {
                    "fuel_l": r(m["fuel_l"], 1),
                    "unserved_critical_kwh": r(m["unserved_critical_kwh"], 1),
                    "critical_outage_events": int(m["critical_outage_events"]),
                    "clean_air_compliance_pct": r(m["clean_air_compliance_pct"], 1),
                    "fuel_remaining_l": r(m["fuel_remaining_l"], 1),
                }
                for cid, m in s["controllers"].items()
            },
        }

    fp = run["fuel_plan"]["metrics"]
    return {
        "provenance": {
            "source": "engine/results/run.json - closed-loop runs on ERA5 reanalysis",
            "generated_at": run["meta"]["generated_at"],
            "weather": "ERA5 reanalysis (ECMWF/Copernicus), hourly, Maitri -70.7667, 11.7333",
            "load": "physics twin - no public electrical-load data exists for any polar station",
        },
        "window": {
            "start": rp["season_start"][:10],
            "end": rp["season_end"][:10],
            "window_days": int(round(rp["days"])),
            "warmup_hours": 48,
            "scored_hours": scored_hours,
            "scored_days": round(scored_hours / 24, 1),
            "horizon_h": rp["horizon_h"],
            "control_step_h": rp["control_step_h"],
            "test_year": rp["test_year"],
            "train_years": rp["train_years"],
            "ensemble_years": rp["mc_years"],
        },
        "station": run["meta"]["station"],
        "ps": {k: run["meta"][k] for k in ("problem_statement", "title", "organization",
                                             "department", "official_description",
                                             "theme_portal", "category")},
        "headline": {k: r(v, 2) if isinstance(v, float) else v for k, v in run["headline"].items()},
        "controllers": controllers,
        "daily": daily,
        "week": week,
        "week_start": rp["demo_week_start"],
        "scenarios": scenarios,
        "forecast": {k: {kk: r(vv, 4) for kk, vv in v.items()} for k, v in run["forecast"].items()},
        "fuel_plan": {
            "tank_l": fp["tank_l"],
            "reserve_floor_l": fp["reserve_floor_l"],
            "usable_l": fp["available_l"],
            "target_survivability": fp["target_survivability"],
            "mean_year_need_l": r(fp["mean_year_need_l"], 0),
            "worst_year_need_l": r(fp["worst_year_need_l"], 0),
            "daily_p99_envelope_l": r(fp["p_target_need_l"], 0),
            "scaled_to_fit_pct": r(100 * fp["allocation_scaled_by"], 1),
            "binding": bool(fp["budget_binding"]),
            "p_run_dry_heuristic_pct": r(100 * fp["p_run_dry_uncontrolled"], 1),
            "allowance": {
                "date": run["fuel_plan"]["allowance"]["date"],
                "litres": [r(x, 1) for x in run["fuel_plan"]["allowance"]["litres"]],
            },
        },
        "monthly": run["validation"],
        "assumptions": run["assumptions"],
    }


def station_json(cfg, start: str, hours: int) -> dict:
    year = int(cfg["simulation.test_year"])
    w = fetch_year(cfg["station.latitude"], cfg["station.longitude"], year)
    # same seed as run.py, so this is exactly the station the controllers were scored on
    twin = build_twin(w, cfg, seed=int(cfg["simulation.seed"]) + year)
    season = twin.loc[pd.Timestamp(start):].head(hours)
    cols = {
        "temp_c": 1, "wind_ms": 1, "wind_dir_deg": 0, "ghi_wm2": 0, "snowfall_cm": 2,
        "occupancy": 1, "load_kw": 2, "load_critical_kw": 2, "load_essential_kw": 2,
        "load_deferrable_kw": 2, "load_sheddable_kw": 2, "pv_kw": 2, "pv_potential_kw": 2,
        "wind_kw": 2, "wind_potential_kw": 2, "snow_cover": 3, "icing_risk": 3,
    }
    hourly = {"time": [t.strftime("%Y-%m-%dT%H:00") for t in season.index]}
    for c, nd in cols.items():
        hourly[c] = [r(x, nd) for x in season[c].to_numpy()]
    hourly["clean_air_window"] = [int(x) for x in season["clean_air_window"].to_numpy()]

    year_twin = twin  # whole test year, for the annual facts on the data page
    renew = (year_twin["pv_kw"] + year_twin["wind_kw"]).clip(upper=year_twin["load_kw"])
    return {
        "provenance": {
            "weather": "ERA5 reanalysis (ECMWF/Copernicus) via Open-Meteo archive API, hourly, grid point -70.75, 11.75",
            "load": "headcount, envelope heat loss, snow-melt water and a 24/7 science load",
            "load_variation": "domestic demand varies +/-8% and summer workshop use 40-100% of peak, hour to hour, from a fixed pseudo-random sequence (seed 26061+year) - part of the model, not measured",
            "generation": "pvlib plane-of-array PV at 70 deg tilt; manufacturer power curve with air-density correction",
            "availability": "snow-cover and blade-icing state model",
        },
        "hourly": hourly,
        "annual": {
            "year": year,
            "load_mwh": r(year_twin["load_kw"].sum() / 1000, 1),
            "pv_mwh": r(year_twin["pv_kw"].sum() / 1000, 1),
            "wind_mwh": r(year_twin["wind_kw"].sum() / 1000, 1),
            "renewable_share_of_load_pct": r(100 * renew.sum() / year_twin["load_kw"].sum(), 1),
            "peak_load_kw": r(year_twin["load_kw"].max(), 1),
            "clean_air_hours": int(year_twin["clean_air_window"].sum()),
            "hours": int(len(year_twin)),
            "mean_temp_c": r(year_twin["temp_c"].mean(), 1),
            "min_temp_c": r(year_twin["temp_c"].min(), 1),
            "mean_wind_ms": r(year_twin["wind_ms"].mean(), 2),
        },
    }


def sizing_json(cfg, gens) -> dict:
    """PV and wind output scale linearly with installed capacity in the twin (snow and ice
    derates are fractions, the density-corrected power curve is a per-kW fraction), and load
    does not depend on sizing - so each weather year is built once and rescaled. This is the
    same calculation as sizing.py, without rebuilding the twin 600 times."""
    pv_grid = [40, 80, 120, 160, 200, 250]
    wind_grid = [30, 60, 90, 120, 180, 240]
    batt_grid = [200, 400, 600, 800]
    base_pv = float(cfg["pv.kwp"])
    base_wind = float(cfg["wind.rated_kw"]) * int(cfg["wind.n_turbines"])
    years = list(cfg["simulation.mc_years"])
    mm, dd = (int(x) for x in str(cfg["fuel.resupply_mmdd"]).split("-"))
    # Same calendar days the seasonal fuel plan covers (1 Feb - 30 Aug, every date the scored
    # season touches), so the sizing page and the data page quote identical figures for the
    # configured station.
    days = 211

    seasons = {}
    for y in years:
        tw = build_twin(fetch_year(cfg["station.latitude"], cfg["station.longitude"], y), cfg,
                        seed=int(cfg["simulation.seed"]) + y)
        seasons[y] = tw.loc[pd.Timestamp(y, mm, dd):].head(days * 24)[["load_kw", "pv_kw", "wind_kw"]]

    usable = float(cfg["fuel.tank_litres_at_season_start"]) - float(cfg["fuel.reserve_floor_litres"])
    rows = []
    for pv in pv_grid:
        for wind in wind_grid:
            for batt in batt_grid:
                needs = []
                for y in years:
                    s = seasons[y].copy()
                    s["pv_kw"] = s["pv_kw"] * pv / base_pv
                    s["wind_kw"] = s["wind_kw"] * wind / base_wind
                    needs.append(float(daily_fuel_need(s, gens, batt).sum()))
                needs = np.array(needs)
                rows.append({
                    "pv_kwp": pv, "wind_kw": wind, "battery_kwh": batt,
                    "mean_l": r(needs.mean(), 0), "worst_l": r(needs.max(), 0),
                    "best_l": r(needs.min(), 0),
                    "years_dry": int((needs > usable).sum()), "years": len(years),
                })
    return {
        "provenance": "Monte Carlo over ERA5 weather years; heuristic dispatch at daily resolution (no MILP)",
        "season_days": days,
        "years": years,
        "tank_l": float(cfg["fuel.tank_litres_at_season_start"]),
        "usable_l": usable,
        "configured": {"pv_kwp": base_pv, "wind_kw": base_wind, "battery_kwh": float(cfg["battery.capacity_kwh"])},
        "grid": {"pv_kwp": pv_grid, "wind_kw": wind_grid, "battery_kwh": batt_grid},
        "rows": rows,
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    run = json.loads(RUN.read_text(encoding="utf-8"))
    cfg = load_config()
    gens = gensets(cfg)

    season = season_json(run)
    (OUT / "season.json").write_text(json.dumps(season, separators=(",", ":")), encoding="utf-8")
    print(f"season.json   {(OUT / 'season.json').stat().st_size / 1e3:,.0f} KB")

    rp = run["meta"]["run_params"]
    station = station_json(cfg, rp["season_start"][:10], 5041)
    (OUT / "station.json").write_text(json.dumps(station, separators=(",", ":")), encoding="utf-8")
    print(f"station.json  {(OUT / 'station.json').stat().st_size / 1e3:,.0f} KB  "
          f"({len(station['hourly']['time'])} h, renewable share {station['annual']['renewable_share_of_load_pct']}%)")

    sizing = sizing_json(cfg, gens)
    (OUT / "sizing.json").write_text(json.dumps(sizing, separators=(",", ":")), encoding="utf-8")
    cfgrow = next(x for x in sizing["rows"] if x["pv_kwp"] == 120 and x["wind_kw"] == 90 and x["battery_kwh"] == 400)
    print(f"sizing.json   {(OUT / 'sizing.json').stat().st_size / 1e3:,.0f} KB  "
          f"({len(sizing['rows'])} configs; configured 120/90/400 -> mean {cfgrow['mean_l']:,.0f} L, "
          f"dry in {cfgrow['years_dry']}/{cfgrow['years']} years)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
