# ASKdata Rollout Readiness Checklist

Status legend: ✅ ready · ⏳ pending human action · ⛔ blocker (must be resolved
before activation). ASKdata stays **DRAFT + inactive** until every ⛔/⏳ is ✅.

## Technical readiness (done in Phases 2–4)
- ✅ Canonical ingestion pipeline (Phase 2) proven idempotent + versioned.
- ✅ ASKdata adapter + PxWeb client + JSON-stat parser (Phase 3), SSRF-safe.
- ✅ Statistical layer: StatisticalDataset/Observation, exact values, revisions (Phase 4).
- ✅ Isolated migration chain Phase 1 → 2 core → patch → 4 verified on a prod clone.
- ✅ Dry-run leaves no durable statistical data.
- ✅ Live isolated proof: real tab08 data ingested into an isolated DB.

## Governance review (Phase 5 — REQUIRED, not invented)
- ⛔ **Terms of use** — review ASK open-data terms; record `termsOfUseStatus`.
      (The PxWeb API exposes NO machine-readable licence — manual review required.)
- ⛔ **Licence** — record the ASK data licence after review. Do not invent.
- ⛔ **Attribution** — record required attribution to the Kosovo Agency of Statistics.
- ⛔ **robots / automated-use** — confirm PxWeb automated use is permitted.
- ⏳ **Release calendar** — record ASK's tab08 publication cadence (yearly).
- ⏳ **Freshness SLA** — define `freshnessSlaHours` for yearly data.
- ⛔ **Owner** — assign a responsible owner.
- ⛔ **Reviewer** — assign a reviewer.

## Lifecycle (governance console; approval ≠ activation)
- ⏳ DRAFT → PENDING_REVIEW (after governance review recorded).
- ⏳ PENDING_REVIEW → APPROVED (reviewer sign-off; still inactive).
- ⛔ APPROVED → ACTIVE (explicit owner authorization; separate step — NOT part of readiness).

## Production rollout (see the runbook)
- ⏳ Backup + preflight verified.
- ⏳ Migration chain applied via reviewed SQL (not `migrate deploy`).
- ⏳ Post-apply verification (44 sources unchanged, tables empty).
- ⏳ Schedule connected only after ACTIVE (a later, separately-authorized step).

## Current gate result
`checkAskdataReadiness()` → **NOT ready**. Missing: owner, reviewer, licence /
terms review, and APPROVED lifecycle. This is expected and correct for Phase 5.
