Work: reserve-mvp
Status: complete
Related: docs/plans/reserve-mvp.md, docs/architecture/system-model.md
Supersedes: none

## Shipped

- Engineering Console with progressive reservation-under-demand journey (event inventory → demand conditions → confirm → personal outcome → wider evidence)
- PostgreSQL-backed event inventory and reservations using direct SQL (`pg`) with row locks and transactional all-or-nothing allocation
- Constrained concurrent experiment orchestration as genuine competing reservation requests (interactive request shuffled among generated demand; same allocator; no preferential path)
- Reset to known demo initial conditions
- Required automated correctness tests against live PostgreSQL
- Local Compose Postgres, README setup, Auth0/SQLite/knex fruit boilerplate removed from the runtime path
- Dependency change: added `pg`; removed unused Auth0/SQLite/knex/eslint-config stack pieces that blocked clean install

## Not touched

- Temporary holds, payments, messaging, multi-instance topology, AWS integration/deployment, GitHub Pages preview
- Dedicated k6/load benchmarking product surface
- Comprehensive uncertain-outcome recovery workflows

## Invariants

Preserved as documented in the living system model, including reservation outcome authority (transport failure ≠ authoritative allocation failure).

## Deviations

- Four passes executed continuously in one implement invocation; durable history captured here rather than four separate pass reports.
- Pass 2 did not expose a half-finished write path: authoritative allocation and concurrent orchestration landed together with transactional guarantees (allowed by the plan’s Pass 2→3 sequencing rule).
- ESLint Academy config removed to unblock dependency resolution; `typecheck` + Vitest are the named proof tools for this MVP.

## Proof

- `docker compose up -d db`
- `npm test` — 5/5 passing (all-or-nothing, invalid quantity, authoritative rejection, concurrent no-oversell + reconciliation, constrained experiment)
- `npm run typecheck` — pass

Human console walkthrough remains expected after closeout.

## Remaining limitations

- Uncertain/transport outcomes are labelled honestly in the console; no retry/recovery product
- Console experiments are complementary; broader load tooling not included
- AWS remains architectural intent only

## Architecture

System model remains accurate. No consequential new architectural truth required beyond recording that v1 uses direct `pg` SQL against containerised PostgreSQL — already within the living model’s PostgreSQL requirement.
