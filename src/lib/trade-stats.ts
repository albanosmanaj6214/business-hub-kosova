/**
 * Kosovo trade statistics shown on the homepage Trade Pulse band.
 *
 * Burimet (viti i plotë 2025, janar–dhjetor):
 *   - ASK Tregtia e Jashtme: https://ask.rks-gov.net
 *   - BQK Bilanci i Pagesave: https://bqk-kos.org/statistikat/  (shërbime TIK)
 *
 * Shifrat 2025 (ASK, raportuar publikisht):
 *   Eksporte mallrash: €942.1M (−0.2% nga €944.3M në 2024)
 *   Importe mallrash:  €7.048 mld (rritje ~9%)
 *   Deficiti tregtar:  €6.1 mld (+13.3% nga 2024)
 *   Mbulim eksport/import: 13.4% (ra nga 14.6% në 2024)
 *   Eksport shërbimesh TIK: €398M (BQK, +14%)
 *
 * ⚠️ Përditëso kur ASK publikon raportin vjetor final 2025 / të dhënat 2026.
 */

export interface TradeStat {
  key: string
  label: string
  value: string
  changePct: number
  changeLabel: string
  spark: number[]
  good: boolean
}

export const TRADE_PULSE = {
  asOf: '2025',
  source: 'ASK / BQK',
  sourceUrl: 'https://ask.rks-gov.net',
  verified: false,  // ⚠ ASK/BQK-origin por jo ende konfirmuar nga PDF-i parësor; konfirmo para launch
  narrative:
    'Hendeku tregtar i Kosovës po thellohet: mbi €7 miliardë importe përballë më pak se €1 miliard eksporte. Sa më i madh hendeku, aq më e madhe mundësia për prodhimin dhe eksportin vendor.',
  stats: [
    { key: 'exports',  label: 'Eksporte mallrash (2025)', value: '€942 mln',  changePct: -0.2, changeLabel: '0.2%',  spark: [474, 755, 920, 819, 944, 942], good: true },
    { key: 'imports',  label: 'Importe mallrash (2025)',  value: '€7.05 mld', changePct: 9,    changeLabel: '9%',    spark: [3.3, 4.0, 5.1, 6.0, 6.45, 7.05], good: false },
    { key: 'coverage', label: 'Mbulim eksport/import',    value: '13.4%',     changePct: -1.2, changeLabel: '1.2pp', spark: [14.5, 19.0, 18.2, 13.7, 14.6, 13.4], good: true },
    { key: 'ict',      label: 'Eksport shërbimesh TIK',   value: '€398 mln',  changePct: 14,   changeLabel: '14%',   spark: [180, 240, 300, 349, 398], good: true },
  ] as TradeStat[],
}
