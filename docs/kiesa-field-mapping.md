# KIESA Canonical Field Mapping (Phase 4)

Deterministic canonical extraction. `null` when a value cannot be determined without
interpretation. Substantive grant terms (deadline, amount, eligibility) live inside the
attached PDF documents and are **not** deterministically available (AI-only — see the
AI-enrichment decision + scorecard). Shadow mode persists NONE of these to domain tables.

## Source fields (deterministic)
| Canonical field | Source | Reliability |
|---|---|---|
| itemId | listing href `id=2,5,<n>` | reliable |
| title | listing `h4 a` | reliable |
| type | classifyKiesaTitle (GRANT/FAIR/REGULATION) | reliable |
| officialUrl | absolute detail URL | reliable |
| publicationDate | detail "Location, dd/mm/yyyy" | reliable when present, else null |
| location | text before the date | optional |
| attachmentUrls | detail `a[href$=".pdf"]` | reliable when present |
| bodyText | detail `.content-inner` text | optional (raw, not interpreted) |
| legacyExternalId | sha1("KIESA:<itemId>") | reliable (reconciliation) |
| deadline / amount / eligibility | inside PDF | **null (AI-only)** |

## Destination mapping (for FUTURE cutover — NOT persisted in shadow)
| Domain | Field | Canonical source | Fallback | Null behavior | Legacy compat |
|---|---|---|---|---|---|
| Grant | title | title | listing title | required | same |
| Grant | url | officialUrl | — | required | same (matches legacy Grant.url) |
| Grant | provider | 'KIESA' | — | constant | same |
| Grant | deadline | (PDF, AI-only) | existing value | null preserved | legacy sets via Haiku |
| Grant | amount | (PDF, AI-only) | existing value | null preserved | legacy sets via Haiku |
| Grant | descriptionSq | bodyText | title | null→title | legacy AI richer |
| Grant | publishedAt | publicationDate | null | null preserved | legacy often null → canonical improvement |
| TradeFair | name/website/startDate | title/officialUrl/publicationDate | — | dates null until PDF | same identity by website=url |
| Opportunity | externalId | sha1("KIESA:<itemId>") | — | required | EXACT match to legacy |
| Opportunity | type/title/sourceUrl | type/title/officialUrl | — | required | same |

Cutover must preserve current routes, filters, deadlines, event dates, institution,
source URL, eligibility text, descriptions and existing identifiers — deadlines/amounts
therefore still require the AI-enrichment step (or a future rule-based PDF parser) before
canonical can replace legacy without data loss.
