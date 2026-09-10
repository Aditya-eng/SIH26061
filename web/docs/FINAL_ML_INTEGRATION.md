# Final-round ML integration boundary

The internal-round browser simulation is complete as a demonstration layer. The team intends to analyse a trained model on suitable data for the final build. No model is trained on the attached draft CSV here.

## Proposed integration contract

Replace the synthetic `forecast()` input with forecasts issued at an explicit timestamp. Preserve one-hour values and units:

```json
{
  "issued_at": "ISO-8601 timestamp with timezone",
  "model_version": "trained model identifier",
  "horizon_hours": 36,
  "steps": [
    {
      "valid_at": "ISO-8601 timestamp with timezone",
      "load_kw": 0,
      "pv_kw": 0,
      "wind_kw": 0,
      "renewable_low_kw": 0,
      "renewable_high_kw": 0
    }
  ]
}
```

Zeros above describe the schema only and are not a fitted forecast. The final controller must consume only forecasts and observations available at its issue time. The simulator's present forecast function accepts generated future weather for demonstration; it must not be reused as an ML evaluation pipeline.

## Data work

Resolve the actual station and location, UTC/local convention, meter definitions, demand classes, equipment limits and resupply date. Retain raw weather separately from processed features and document every transform. Track units and missing intervals; do not silently fill weather gaps with future observations. The draft CSV alone does not provide a measured training dataset.

Use chronological splits and held-out years. Fit transformations on training data only. Evaluate load and renewable point errors and interval coverage. Compare simple persistence / seasonal baselines with trained models before feeding forecasts to scheduling.

## Optimisation and evaluation

Implement the proposed constrained solver with generator start/stop and loading constraints, finite fuel, battery efficiency, reserve, actual flexible-load windows and a stated terminal battery policy. Distinguish fault detection from future fault knowledge. Evaluate several weather years and disruption scenarios with the same realised inputs for every controller.

Report fuel use, all unserved energy by tier, critical outage hours, curtailment, battery end state and compute time. State whether fuel budgets and reserves are hard constraints or advisory targets. Avoid extrapolating a single synthetic run into station reliability or operational savings.

## Interface reuse

Keep the existing console and export schema where practical. Add provenance and issue timestamps to forecast panels, and name the active model and scheduler explicitly. Do not rename beam search to MILP or synthetic ranges to ML intervals without implementing and evaluating the corresponding method.
