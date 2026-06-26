// Burim zyrtar: lista e marreveshjeve te tatimit te dyfishte (Ministria e Financave / ATK),
// e jep perdoruesi. Verifikuar me: (ne pritje). Jo keshille ligjore/tatimore. Pa te dhena sintetike.

export interface DoubleTaxTreaty {
  country: string        // ISO2 uppercase
  countrySq: string      // emri i shtetit ne shqip
  hasTreaty: boolean
  status: 'in_force' | 'signed' | 'negotiating' | 'none'
  signed?: string
  inForce?: string
  url: string            // lidhje zyrtare
  note?: { sq: string }
}

// BOSH derisa te mbushet nga lista zyrtare e perdoruesit. Pa te dhena sintetike.
export const DOUBLE_TAX_TREATIES: DoubleTaxTreaty[] = []

export function treatyForCountry(
  iso2: string,
  list: DoubleTaxTreaty[] = DOUBLE_TAX_TREATIES,
): DoubleTaxTreaty | undefined {
  const q = (iso2 ?? '').trim().toUpperCase()
  if (!q) return undefined
  return list.find((t) => t.country.toUpperCase() === q)
}
