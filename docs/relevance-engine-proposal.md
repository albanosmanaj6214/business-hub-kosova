# Relevance Engine — Proposal (Phase 0)

Proposal only. Extends the existing deterministic engines rather than replacing them.

## 1. What exists (from audit)

Two deterministic engines already exist and work:
- `src/lib/audience.ts matchesAudience()` — 7-axis boolean pass/fail (activityType, entitledSectors, femaleOwnership, role, country, interests, productSlugs); empty target = universal.
- `src/lib/matchmaking.ts` — weighted score (product 100 > sector 50 > interest 25 > country 10 > verified +15, MIN_SCORE 40), computed on the fly, with `reasons[]`.
Explainability already exists (`Notification.reason`, 114/114). This is the right foundation: keep it deterministic and explainable; do not replace it with an opaque AI score.

## 2. Gaps to close

- `User.entitledSectors` (used by audience) and `Company.sectors` / `diasporaProfile.sectorsOfInterest` (used by matchmaking) are not unified — the same business can match differently in the two engines.
- No HS or NACE axis; `HsQuery` (Haiku) is a disconnected silo; personalization cannot use products/HS.
- Matchmaking scores are never stored, so they cannot be ranked across sessions, audited, or explained historically.

## 3. Unified relevance profile

Build one resolved profile (server) merging: role; activityType; resolved sectors (entitledSectors ∪ company.sectors, de-duplicated); product categories + any confirmed HS codes; target countries; company size; municipality; certifications; expressed needs; femaleOwnership. Both engines read this one profile.

## 4. Factors (deterministic, weighted, explainable)

sector match; product/category match; HS match; role match; target-country match; company-size match; certification match; business-intent match; deadline proximity; source authority tier; freshness. Each contributes a documented weight; the total is a transparent sum. Store per-recommendation: `relevanceScore`, `matchedCriteria[]`, `missingCriteria[]`, `reasonShown`, `sourceId`, `freshness`.

## 5. Role priorities (which data surfaces first)

- Producer: target-market import demand, buyers/distributors, certification + product requirements, machinery grants, fairs, input suppliers, logistics, competitor countries.
- Exporter: market demand, tariffs + rules of origin, export docs, destination requirements, buyers, fairs, logistics, trends.
- Importer/trader: supplier countries, tariffs, customs obligations, transport, exchange rates, supplier discovery, restrictions.
- Buyer/distributor: verified suppliers, categories, capacity, MOQ, certifications, private-label, delivery markets.
- ICT/service: services-trade indicators, outsourcing, tenders, destination demand, data-protection rules, tech events.
- Tourism: arrivals, nights, source markets, seasonality, tourism fairs, operator partnerships, trends.
- Diaspora/investor: sector structure, company counts, investment + financing, labour indicators, costs, export potential, verified partners.
- Startup/individual: startup grants, registration guidance, accelerators, trends, mentors, sector-entry info.

## 6. Sector-to-classification bridge

Bridge the 18 platform slugs (`src/lib/sectors.ts`) to NACE divisions and HS chapters in a versioned table, so a furniture producer targeting Germany matches furniture HS chapters + furniture-import indicators, and does NOT receive veterinary/dairy/pharma content (master-spec worked example, section 26). This bridge feeds both relevance and the statistics layer.

## 7. Role of AI

AI may assist classification (HS suggestion, sector inference) but must return a confidence, is never the factual source, and low-confidence results go to review. Deterministic rules remain authoritative; the score is always explainable.

## 8. Tests

Role-relevance and sector-relevance tests (the furniture-vs-veterinary example as a golden test), HS-bridge tests, unification tests (entitledSectors ∪ company.sectors), and score-explainability tests (every recommendation has a non-empty reason).
