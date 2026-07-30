# KIESA Cutover-Readiness Scorecard (Phase 4) — factual, no invented percentages

| Requirement | Status | Evidence |
|---|---|---|
| Identity parity | **READY** | officialId=itemId + sha1 legacyExternalId; reconciliation matches legacy Opportunity/Grant by identity/URL, never title. |
| Grant field parity | **PARTIAL** | title/url/provider/publicationDate READY; deadline/amount BLOCKED (AI-only). |
| Fair field parity | **PARTIAL** | name/website/publicationDate READY; start/end dates BLOCKED (in PDF). |
| Deadline accuracy | **BLOCKED** | deadline lives inside the PDF; deterministic extraction returns null. |
| Amount accuracy | **BLOCKED** | amount lives inside the PDF; deterministic extraction returns null. |
| Description completeness | **PARTIAL** | deterministic bodyText available; richer legacy description is AI-derived. |
| Provenance | **READY** | listing + per-detail RawSnapshot + citation via the pipeline; proven in pgtests. |
| Idempotency | **READY** | stable identity; multi-cycle shadow creates no new records. |
| Versioning | **READY** | canonical IngestionRecord/version machinery (Phase 2), unchanged. |
| Health monitoring | **READY** | canonical runtime label + SourceHealth integration (Phase 2/3). |
| Governance | **BLOCKED** | KIESA canonical governance config is DRAFT; owner/reviewer unassigned. |
| Terms & attribution | **BLOCKED** | not reviewed (not invented). |
| Scheduler readiness | **NOT APPLICABLE (this phase)** | scheduler stays disabled; adapter status='draft'. |
| Rollback readiness | **READY** | legacy KIESA runtime untouched + active; documented rollback in the cutover runbook. |

**Recommendation: DO NOT CUT OVER.** Material domain fields (deadline, amount) are BLOCKED
without an accepted fallback, and governance/terms are unresolved. Canonical KIESA is a
validated shadow pilot with identity + listing + publicationDate + provenance parity, but
not functional field parity.
