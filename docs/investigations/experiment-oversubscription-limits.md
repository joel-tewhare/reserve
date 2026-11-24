Work: experiment-oversubscription-limits
Status: complete
Related: docs/architecture/system-model.md, docs/briefs/reserve.md
Supersedes: none

## Evidence

Backend `EXPERIMENT_LIMITS` (authoritative):

- `maxUserQuantity`: 10
- `maxCompetingRequests`: 100
- `maxConcurrency`: 25
- `maxTotalRequests`: 120

`validateExperimentConfig` checks only those resource bounds. It does **not** compare demand to available inventory.

Frontend mirrors those limits via `/api/v1/experiments/limits` and disables confirm with a generic “exceeds constrained experiment limits” message. No inventory-gated admission.

With competing requests as 1-ticket each, maximum configurable ticket demand was `10 + 100 = 110` against demo capacity `100` — technically oversubscribed, but only marginally. Higher competing demand hit the resource ceiling and surfaced the generic warning.

## Classification

Local/Traced product defect relative to accepted intent: oversubscribed experiments are a central capability; proportionate resource limits must not prevent meaningful oversubscription. No new architectural contract required.

## Conclusion

**Proceed** — raise resource ceilings enough for clear oversubscription, keep inventory scarcity resolved by allocation, and surface specific validation failures + supported ranges in the console.

Next: implement
