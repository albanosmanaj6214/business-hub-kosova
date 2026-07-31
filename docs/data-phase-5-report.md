# Data Phase 5 — ASKdata Governance & Rollout Readiness Report

Branch `data/phase-5-askdata-governance`, based on approved Phase 4 `884f58b`.
Isolated worktree `/var/www/bh-phase5`. Owner-confirmed scope: **readiness package,
keep ASKdata DRAFT**. Additive; no schema change; no production change; ASKdata
stays DRAFT + inactive; no approval; no activation; not deployed; not merged.

## What was built
- `readiness.ts`: reuses the Phase 1 `activationReadiness` gate. Provides safe
  OPERATIONAL values (proposed rate limit 30/min, timeout 20s) and an explicit
  list of governance gaps. Governance REVIEW values (licence, terms, attribution,
  owner, reviewer, freshness SLA, release schedule) are intentionally left
  null/not_reviewed — NOT invented. `checkAskdataReadiness()` reports NOT ready.
  `askdataGovernedSourceData()` = the DRAFT + inactive governed Source row.
- `readiness.test.ts` (default suite): ASKdata is not activation-ready in DRAFT;
  the gaps are listed; approval != activation (only a fully-governed APPROVED
  source is ready).
- `readiness.pgtest.ts` (isolated DB): onboards the governed DRAFT source, reads
  it back, and confirms `activationReadiness` reports NOT ready with the blockers.
- Docs: this report, the production rollout runbook, and the readiness checklist.

## Factual grounding (read-only probe)
- ASK site `ask.rks-gov.net` reachable (HTTP 200).
- The PxWeb JSON-stat response exposes NO `license` field (only
  `source: "Kosovo Agency of Statistics"`). Therefore the licence/terms MUST be
  reviewed manually against ASK's published terms — nothing was fabricated.

## Governance blockers (must be resolved by a human before activation)
Terms of use, licence, attribution, robots/automated-use, release calendar,
freshness SLA, owner, reviewer — then DRAFT → PENDING_REVIEW → APPROVED, and only
later, separately authorized, APPROVED → ACTIVE.

## Verified isolated
prisma validate, tsc, lint, full default tests, build; the migration chain
Phase 1 → 2 core → patch → 4 re-verified on a prod clone; the governance
readiness pgtest proven against an isolated DB. Production untouched.

## Non-goals honored
No approval, no activation, no schedule, no homepage/TRADE_PULSE, no
`ExportGuide.marketStats`, no additional ASKdata datasets, no Eurostat/Comtrade,
no deploy/merge, no invented licence/attribution terms.
