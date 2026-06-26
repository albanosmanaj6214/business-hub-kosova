// Burim zyrtar: lista e zonave ekonomike/industriale (KIESA / MINT), e jep perdoruesi.
// Verifikuar me: (ne pritje). Jo keshille ligjore. Pa te dhena sintetike.

export interface EconomicZone {
  id: string
  name: string
  municipality: string
  type: 'industrial' | 'economic' | 'technology' | 'business'
  url?: string
  note?: { sq: string }
}

// BOSH derisa te mbushet nga lista zyrtare e perdoruesit. Pa te dhena sintetike.
export const ECONOMIC_ZONES: EconomicZone[] = []

export function zonesByMunicipality(
  list: EconomicZone[] = ECONOMIC_ZONES,
): { municipality: string; zones: EconomicZone[] }[] {
  const map = new Map<string, EconomicZone[]>()
  for (const z of list) {
    const arr = map.get(z.municipality) ?? []
    arr.push(z)
    map.set(z.municipality, arr)
  }
  return Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((municipality) => ({ municipality, zones: map.get(municipality)! }))
}
