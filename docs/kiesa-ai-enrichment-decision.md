# KIESA AI-Enrichment Decision (Phase 4)

Deterministic canonical extraction reaches: itemId, title, type, official URL,
publicationDate, location, PDF attachment URLs, bodyText, stable identity. These need
**no AI**.

The following useful business fields are produced today ONLY by the legacy Haiku PDF
enrichment (they live inside the attached PDF documents, whose layout varies):

| Field | Deterministic? | Decision |
|---|---|---|
| deadline | No (inside PDF) | **Preserve as optional, gated enrichment** (post-deterministic). Never overwrite an official deterministic field. |
| funding amount / budget | No (inside PDF) | **Defer** — needs the enrichment step; a rule-based PDF parser is unreliable across KIESA PDF layouts. |
| eligible applicants | No (inside PDF) | **Defer** / manual review at cutover. |
| full description | Partial (bodyText) | **Preserve deterministic bodyText**; richer AI description stays optional. |
| sectors | No | Defer. |
| application procedure / required documents | No (inside PDF) | Defer / manual review. |

Rules: AI output must NEVER overwrite an official deterministic field; enrichment runs
AFTER deterministic extraction, is explicitly gated (existing `KIESA_ENRICH` /
`SCRAPER_AI_ENRICH`), records whether it ran, and never blocks ingestion when disabled.
No paid model call was made in this phase (all tests are deterministic + offline).

**Conclusion:** canonical KIESA can deterministically match identity + listing fields +
publicationDate + attachments, but deadline/amount/eligibility remain AI-only. Full field
parity is therefore NOT achievable deterministically today.
