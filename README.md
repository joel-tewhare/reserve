# Reserve

Local-first, AWS-oriented engineering portfolio project: concurrent allocation of finite ticket inventory, demonstrated through an Engineering Console that combines a realistic reservation journey with inspectable PostgreSQL-backed evidence.

## Quick start

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:reset
npm run dev
```

- Console / client: http://localhost:5173
- API: http://localhost:3000

Requires Docker for local PostgreSQL.

## What v1 demonstrates

- Immediate-final, all-or-nothing ticket allocation
- Genuine competing reservation requests under constrained concurrent demand
- No preferential treatment for the interactive console user
- Reconciliation of successful reservation counts, allocated ticket quantities, and remaining inventory against PostgreSQL
- Honest uncertain/transport outcomes (not equated with authoritative allocation failure)

## Proof

```bash
npm run db:up
npm test
npm run typecheck
```

## Documentation

- Product brief: `docs/briefs/reserve.md`
- System model: `docs/architecture/system-model.md`
- MVP plan: `docs/plans/reserve-mvp.md`

## Out of scope for v1

Temporary holds, payments, messaging workers, multi-instance distribution, AWS service integration/deployment, and the full static portfolio preview. AWS-oriented architecture remains directional intent; this environment does not claim verified AWS deployment.
