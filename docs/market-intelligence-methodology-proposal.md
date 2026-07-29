# Market Intelligence Methodology — Proposal (Phase 0)

Proposal only. Fixes the labeling and freshness problems found in the audit (`docs/data-ingestion-audit.md` sections 11, and the market-intel agent findings).

## 1. The core defect to fix

Today the export guide presents a destination country's **total household final-consumption expenditure** (Eurostat `nama_10_co3_p3`, COICOP) as "Market size for your sector" (`dashboard/guides/[id]/page.tsx:233`). That is not the addressable market for a Kosovo exporter: it counts all domestic and foreign suppliers and all domestic production, and ignores Kosovo's share and import demand. It also mixes vintages (2022 expenditure + 2025 population + growth "nga 2015" vs a 2017-2022 trend). This must be corrected before scaling.

## 2. Indicator labeling rules (mandatory)

Never label import value as market size. Use exact labels, each tied to a defined formula and source:

- "Vlera e importeve" — destination imports of the HS group (import demand; the correct proxy for addressable export market).
- "Vlera e eksporteve" — destination or Kosovo exports.
- "Konsumi i dukshëm" (apparent consumption) — only when computed as production + imports − exports from sources that measure each.
- "Vlerësim i tregut" — only when a documented methodology supports it.
- "Prodhimi vendor" — only from a source that measures production.
- "Shpenzimet e familjeve" — the current COICOP figure, kept but clearly labeled as a broad consumer-spending proxy, not the export market.

Prefer **destination imports of the product (by HS)** as the headline "market" indicator for exporters, with Kosovo's current export value and Kosovo's share of destination imports shown beside it.

## 3. Unit value

Unit value is not price. Compute only when value + quantity + a comparable quantity unit exist and observation quality is acceptable. Store formula, source values, unit, and outlier status. Label "Vlerë mesatare për njësi", never "Çmimi i tregut" unless the source measures price.

## 4. Currency normalization

Preserve `valueOriginal`/`currencyOriginal` always. If a normalized value is produced, use an official exchange-rate source, store the exact rate + rate date/period + method, never overwrite the original, and label current-price vs constant-price. Do not compare nominal values across long periods without a stated limitation.

## 5. Revisions and availability

Store revision status (preliminary/revised/final/estimated/confidential/unavailable). Before computing growth: verify both periods exist and use compatible classification versions; never treat a missing period as zero; never read a reporting gap as a market collapse. Growth windows must match the trend actually shown (fix the "nga 2015" vs 2017-2022 mismatch).

## 6. Mirror data

When Kosovo-reported trade is unavailable/incomplete and partner-reported mirror data are used, label them "të dhëna pasqyrë (mirror)", show the reporting partners, explain the limitation, and never present mirror data as Kosovo's directly reported value.

## 7. Indicator catalogue (compute only where data support it)

Import value; export value; annual growth; 3-year and 5-year CAGR; market share; top supplier countries + concentration; Kosovo export value; Kosovo share of destination imports; quantity; unit value; seasonality (where monthly data exist); tariff indicator; number of periods available; data freshness; completeness. Each indicator carries: source, dataset id, period, unit, classification version, and a freshness/verification badge.

## 8. Storage

Retire the un-written `ExportGuide.marketStats` JSON as the source of truth. Compute indicators from `StatisticalObservation` rows (`docs/statistical-data-dictionary-proposal.md`) and cache a rendered snapshot with `computedAt`, `sourceCitationIds`, and `methodologyNote`. Move the homepage `TRADE_PULSE` numbers (currently `verified:false` constants in `src/lib/trade-stats.ts`) into verified DB rows and render a "Kërkon verifikim" badge whenever a figure is unverified.

## 9. Market-attractiveness score (deferred)

Do not ship a single attractiveness score until data completeness is measured, indicators + weights are documented and approved, and missing-data behavior is defined. When shipped, make weights Admin-configurable, show the reasons (not only a number), and never describe the score as a guarantee of commercial success.

## 10. Pilot (Eurostat)

The Eurostat pilot (see audit section 25) should implement, for one HS/COICOP group and 2-3 destinations: import value (Comext) as the headline, correct period + `checkedAt`, preserved original units, a `StatisticalObservation` write, a `SourceCitation`, and the corrected labels above. This replaces the hand-injected `marketStats` for those guides with reproducible, correctly-labeled data.
