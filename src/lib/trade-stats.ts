/**
 * Kosovo trade statistics shown on the homepage Trade Pulse band.
 *
 * ⚠️  VERIFIKO PARA LAUNCH:
 * Shifrat e mëposhtme janë vlerësime pikënisjeje. Zëvendësoji me numra
 * EKZAKTë nga raportet zyrtare para se faqja të shkojë publike:
 *   - ASK (eksport/import):  https://ask.rks-gov.net/sq/agjencia-e-statistikave-te-kosoves/tregtia-e-jashtme
 *   - BQK (shërbime, bilanc): https://bqk-kos.org/statistikat/
 *
 * Pas zëvendësimit, vendos `verified: true` dhe përditëso `asOf`.
 */

export interface TradeStat {
  key: string
  label: string
  value: string          // formatted display value
  changePct: number      // YoY change, positive = up
  changeLabel: string    // "8.3%" or "1.2pp"
  spark: number[]        // 5-7 points for the mini trend line
  good: boolean          // is an upward trend good for this metric?
}

export const TRADE_PULSE = {
  asOf: 'T3 2025',
  source: 'ASK / BQK',
  sourceUrl: 'https://ask.rks-gov.net/sq/agjencia-e-statistikave-te-kosoves/tregtia-e-jashtme',
  verified: false,        // ⚠️ set true after replacing with exact ASK/BQK figures
  narrative:
    'Kosova importon rreth gjashtë herë më shumë se sa eksporton. Çdo pikë përqindje zëvendësimi importi është një mundësi reale për prodhuesin vendor.',
  stats: [
    { key: 'exports',  label: 'Eksporte mallrash',  value: '€1.02 mld', changePct: 8.3,  changeLabel: '8.3%',  spark: [0.62, 0.69, 0.87, 1.04, 0.93, 0.97, 1.02], good: true },
    { key: 'imports',  label: 'Importe mallrash',   value: '€6.1 mld',  changePct: 4.1,  changeLabel: '4.1%',  spark: [4.2, 4.6, 5.0, 5.4, 5.7, 5.9, 6.1], good: false },
    { key: 'coverage', label: 'Mbulim eksport/import', value: '16.7%', changePct: 1.2,  changeLabel: '1.2pp', spark: [14.7, 15.0, 17.4, 19.3, 16.3, 16.4, 16.7], good: true },
    { key: 'services', label: 'Eksport shërbimesh', value: '€2.4 mld',  changePct: 12.0, changeLabel: '12%',   spark: [1.4, 1.6, 1.8, 2.0, 2.1, 2.3, 2.4], good: true },
  ] as TradeStat[],
}
