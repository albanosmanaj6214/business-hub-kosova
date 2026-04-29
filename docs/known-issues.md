# Known Issues

## CRITICAL: Strategy `gemini_synthesize` is a generator, not a scraper

Strategy `gemini_synthesize` (formerly mis-named `gemini_extract`) does NOT
fetch HTML from real source pages. It asks Gemini to produce grant / fair data
based on its training knowledge, regardless of which `Source` is being run.

**Implications**: data produced may be

- Out of date (Gemini may not know about 2026 grant calls)
- Hallucinated (it may invent grants that do not exist)
- Incomplete (no real URL, deadline, eligibility text from the actual program)

**Fix plan**: Phase 12 implements two new strategies:

- `http_cheerio` — fetches HTML from `Source.baseUrl`, extracts opportunities
  using static selectors (per-source config, TBD column or file).
- `gemini_extract` — true HTML extractor: fetches the page, then asks Gemini
  to return structured data from the real HTML (not from training knowledge).
  This is semantically different from `gemini_synthesize`.

Until Phase 12 ships, end users should be told that grant/fair data is
"AI-generated samples", not verified live grants. Admin UI should display
this disclaimer near content sourced from `gemini_synthesize`.

## OpportunityInput.legacy field

`OpportunityInput.legacy` carries the extra fields that the old `Grant` and
`TradeFair` tables need (provider, sectors, sq/de translations, fair dates).
This exists only so the legacy bridge can keep `Grant` / `TradeFair` populated
while the live UI still reads from those tables.

Removed in Phase 13 once UI migrates to `Opportunity`.
