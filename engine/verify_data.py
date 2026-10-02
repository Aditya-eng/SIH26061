"""Cross-check every published number against its source.

    python verify_data.py            # prints PASS / FAIL per check, exits 1 on any FAIL

What it checks:
  * results/run.json is internally consistent (daily series sum to the totals, the tank
    balances, derived percentages recompute, headline == comparison table);
  * results/metrics.csv matches run.json;
  * the seasonal fuel plan's numbers mean what the documents say they mean;
  * the simulated window length matches the label used for it;
  * the web app's exported data (../web/public/data) matches run.json exactly.

A FAIL here means a document, slide or screen is showing a number that the pipeline did not
produce. Fix the label or the number; never silence the check.
"""

from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUN = ROOT / "results" / "run.json"
METRICS = ROOT / "results" / "metrics.csv"
WEB_DATA = ROOT.parent / "web" / "public" / "data"

failures: list[str] = []
warnings: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))
    if not ok:
        failures.append(name)


def warn(name: str, detail: str) -> None:
    print(f"  WARN  {name}  ({detail})")
    warnings.append(name)


def close(a: float, b: float, tol: float) -> bool:
    return a is not None and b is not None and abs(float(a) - float(b)) <= tol


def main() -> int:
    run = json.loads(RUN.read_text(encoding="utf-8"))
    comp = {r["controller"]: r for r in run["comparison"]}
    head = run["headline"]
    fp = run["fuel_plan"]["metrics"]
    tank = fp["tank_l"]

    print("\n[1] daily series vs controller totals")
    for name, d in run["daily"].items():
        c = comp[name]
        check(f"{name}: sum(daily fuel) == total fuel",
              close(sum(d["fuel_l"]), c["fuel_l"], 2.0),
              f"{sum(d['fuel_l']):,.1f} vs {c['fuel_l']:,.1f}")
        check(f"{name}: tank - fuel == remaining",
              close(tank - c["fuel_l"], c["fuel_remaining_l"], 1.0),
              f"{tank - c['fuel_l']:,.1f} vs {c['fuel_remaining_l']:,.1f}")
        check(f"{name}: last daily remaining == remaining",
              close(d["fuel_remaining_l"][-1], c["fuel_remaining_l"], 1.0))
        check(f"{name}: sum(daily unserved critical) == total",
              close(sum(d["unserved_critical_kwh"]), c["unserved_critical_kwh"], 0.5),
              f"{sum(d['unserved_critical_kwh']):,.2f} vs {c['unserved_critical_kwh']:,.2f}")
        check(f"{name}: SoC within battery limits",
              all(0.149 <= s <= 0.951 for s in d["soc_frac"]))

    print("\n[2] derived figures recompute")
    b, cc, dd = comp["B"]["fuel_l"], comp["C"]["fuel_l"], comp["D"]["fuel_l"]
    check("C fuel vs B %", close(100 * (cc - b) / b, comp["C"]["fuel_vs_B_pct"], 0.01),
          f"{100 * (cc - b) / b:.2f}%")
    check("gap to oracle closed %",
          close(100 * (b - cc) / (b - dd), comp["C"]["gap_to_oracle_closed_pct"], 0.01),
          f"{100 * (b - cc) / (b - dd):.1f}%")
    check("headline fuel vs B == table", close(head["fuel_vs_B_pct"], comp["C"]["fuel_vs_B_pct"], 1e-9))
    check("headline outages C == table",
          head["critical_outage_events_C"] == comp["C"]["critical_outage_events"])
    check("headline outages B == table",
          head["critical_outage_events_B"] == comp["B"]["critical_outage_events"])
    check("headline clean-air C == table",
          close(head["clean_air_compliance_C_pct"], comp["C"]["clean_air_compliance_pct"], 1e-9))
    check("metrics list == comparison table",
          all(close(m["fuel_l"], comp[m["controller"]]["fuel_l"], 1e-6) for m in run["metrics"]))

    print("\n[3] metrics.csv == run.json")
    with open(METRICS, encoding="utf-8") as fh:
        rows = {r["controller"]: r for r in csv.DictReader(fh)}
    for name, c in comp.items():
        r = rows.get(name)
        check(f"{name}: csv fuel == json fuel", r is not None and close(float(r["fuel_l"]), c["fuel_l"], 0.01))
        check(f"{name}: csv outages == json outages",
              r is not None and int(float(r["critical_outage_events"])) == c["critical_outage_events"])

    print("\n[4] simulated window length vs its label")
    rp = run["meta"]["run_params"]
    hours = comp["C"]["hours"]
    sim_days = hours / 24
    check("all controllers simulate the same hours",
          len({c["hours"] for c in comp.values()}) == 1, f"{hours} h")
    if abs(sim_days - rp["days"]) > 0.5:
        warn("window label vs simulated hours",
             f"label says {rp['days']:.0f} days; controllers were scored over {hours} h = "
             f"{sim_days:.1f} days (48 h warm-up excluded). Say '{sim_days:.0f} scored days "
             f"of a {rp['days']:.0f}-day window'.")

    print("\n[5] seasonal fuel plan semantics")
    check("allowance sums to planned total",
          close(sum(run["fuel_plan"]["allowance"]["litres"]), fp["planned_total_l"], 5.0),
          f"{sum(run['fuel_plan']['allowance']['litres']):,.0f} vs {fp['planned_total_l']:,.0f}")
    check("planned total == usable tank when binding",
          (not fp["budget_binding"]) or close(fp["planned_total_l"], fp["available_l"], 5.0))
    if fp["p_target_need_l"] > fp["worst_year_need_l"]:
        warn("'P99 need' is not a year's need",
             f"p_target_need {fp['p_target_need_l']:,.0f} L exceeds the worst ensemble year "
             f"{fp['worst_year_need_l']:,.0f} L: it is the SUM of per-day 99th percentiles, an "
             f"envelope no single year reaches. Never call it 'the P99 year'.")
    if fp["budget_binding"]:
        warn("survivability target not honoured by the tank",
             f"the plan was scaled to {100 * fp['allocation_scaled_by']:.0f}% of the per-day P99 "
             f"envelope to fit {fp['available_l']:,.0f} L, and P(run dry) under heuristic "
             f"operation is {100 * fp['p_run_dry_uncontrolled']:.1f}%. The 99% figure is a "
             f"TARGET, not a guarantee in this configuration.")

    print("\n[6] stress tests present and sane")
    for scen, s in run["scenarios"].items():
        for ctl, m in s["controllers"].items():
            check(f"{scen}/{ctl}: unserved >= 0 and events >= 0",
                  m["unserved_critical_kwh"] >= 0 and m["critical_outage_events"] >= 0)

    print("\n[7] web data matches the pipeline")
    season_path = WEB_DATA / "season.json"
    if not season_path.exists():
        warn("web export", f"{season_path} not found - run export_web_data.py")
    else:
        web = json.loads(season_path.read_text(encoding="utf-8"))
        for row in web["controllers"]:
            src = comp[row["id"]]
            check(f"web {row['id']}: fuel", close(row["fuel_l"], src["fuel_l"], 0.05))
            check(f"web {row['id']}: outages", row["critical_outage_events"] == src["critical_outage_events"])
            check(f"web {row['id']}: unserved", close(row["unserved_critical_kwh"], src["unserved_critical_kwh"], 0.05))
        for name, d in run["daily"].items():
            wd = web["daily"][name]
            check(f"web daily {name}: same length and totals",
                  len(wd["fuel_l"]) == len(d["fuel_l"]) and close(sum(wd["fuel_l"]), sum(d["fuel_l"]), 2.0))
        station = WEB_DATA / "station.json"
        if station.exists():
            st = json.loads(station.read_text(encoding="utf-8"))
            tiers_ok = all(
                close(sum(st["hourly"][k][i] for k in ("load_critical_kw", "load_essential_kw",
                                                        "load_deferrable_kw", "load_sheddable_kw")),
                      st["hourly"]["load_kw"][i], 0.06)
                for i in range(0, len(st["hourly"]["load_kw"]), 97)
            )
            check("web station: load tiers sum to total load", tiers_ok)
            check("web station: no synthetic weather flag", st["provenance"]["weather"].startswith("ERA5"))

    print(f"\n{len(failures)} FAIL, {len(warnings)} WARN")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
