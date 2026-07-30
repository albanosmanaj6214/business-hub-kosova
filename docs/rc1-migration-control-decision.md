# RC1 Migration Control Decision

## Production migration state (read-only inspection)
- `_prisma_migrations` EXISTS in production with **22 recorded migrations** (0 failed/rolled-back).
- The **4 RC migrations are NOT recorded** (pending): phase1_source_governance, phase2_ingestion_core, phase2_idempotency_patch, phase4_statistical_layer.
- The RC `prisma/migrations/` folder holds 25 migrations (21 historical + 4 new).
- **Divergence:** one migration recorded in production — `20260626135122_add_segment_axes` — is **absent from the RC folder** (pruned from the tree at some point). `prisma migrate status` reports this as: "The migration from the database are not found locally." Last common migration: `20260701090000_wave2_roles_and_company`.
- Production evolved partly via `db push` (schema drift vs migration history).

## Empirical test on a fresh production clone (`businesshub_gateqa`)
`prisma migrate deploy`:
- Reports the `add_segment_axes` divergence as **informational**, then **applies exactly the 4 pending migrations and records them** — exit **0**. The missing-local migration does NOT block deploy (deploy only applies folder-migrations not yet in the DB).
- Second run: **"No pending migrations to apply"** (idempotent), exit 0.
- Migrations recorded exactly 4, 0 duplicates.

## SELECTED METHOD: `prisma migrate deploy`
Rationale:
- It is the Prisma-native, auditable, reproducible command — identical in rehearsal and production.
- It records migration history authoritatively in `_prisma_migrations` (no manual `resolve`).
- Tables created via `migrate deploy` are owned by the application DB user (avoids the table-ownership/permission mismatch seen when applying SQL as the `postgres` superuser).
- It is idempotent and applies ONLY the 4 additive pending migrations.
- It tolerates the pre-existing `add_segment_axes` divergence.

Not selected: manual `psql -f` + `prisma migrate resolve --applied` (works, proven in RC1, but requires an extra manual recording step and applying as `postgres` created ownership issues). Not selected: `prisma db push` (never for production; not a migration).

## Exact rehearsal result (selected method)
On a fresh clone restored from a production backup:
- Baseline: Source 44 / Grant 125 / TradeFair 46 / Opportunity 96 / Company 24 / User 28; IngestionRecord absent.
- `prisma migrate deploy` (run 1): applied all 4, exit 0.
- `prisma migrate deploy` (run 2): "No pending migrations to apply", exit 0.
- Recorded exactly 4, 0 duplicates.
- Post counts unchanged (identical to baseline). New tables (ImportRun/IngestionRecord/StatisticalObservation/SourceCitation) present and EMPTY. Citation stat columns present. ASKdata source rows 0. `isActive=true` count 8 (no activation). 15 test/demo companies preserved (10 demo set intact). 0 invalid FKs.
- Rollback compatibility: the ec8d5ff production Prisma client reads the migrate-deployed clone (User 28 / Company 24 / Grant 125) — additive-safe.

## Known-issue / future hygiene (not required for RC1)
The `add_segment_axes` local/DB divergence is pre-existing and does not affect this additive deploy. To make `migrate status` fully clean long-term, a separate follow-up should restore or squash that migration into the tree; NOT required for the RC1 additive deployment and out of scope here.
