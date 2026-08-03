// Grupet e produkteve (Faza 1b-B, struktura e miratuar 2026-08-02). Vala 1: ushqimi.
// Sektorë të tjerë shtohen me valë të verifikuara (druri: mobilje/paleta/pelet, etj).

export interface ProductGroup {
  slug: string
  sq: string
  sectors: string[] // sektorët e platformës ku ofrohet ky grup
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  { slug: 'bulmet', sq: 'Bulmet', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'mish', sq: 'Mish dhe produkte mishi', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'veze', sq: 'Vezë', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'mjalte', sq: 'Mjaltë dhe produkte bletarie', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'fruta-perime-fresketa', sq: 'Fruta-perime të freskëta', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'kerpudha-pylli', sq: 'Kërpudha dhe produkte të egra pylli', sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { slug: 'ushqime-ngrira', sq: 'Ushqime të ngrira', sectors: ['ushqim-dhe-pije'] },
  { slug: 'perpunime-bimore', sq: 'Produkte bimore të përpunuara (konserva, brumëra, vajra)', sectors: ['ushqim-dhe-pije'] },
  { slug: 'pije-joalkoolike', sq: 'Pije joalkoolike (ujë, lëngje)', sectors: ['ushqim-dhe-pije'] },
  { slug: 'pije-alkoolike', sq: 'Pije alkoolike (verë, birrë, të forta)', sectors: ['ushqim-dhe-pije'] },
  { slug: 'furra-embelsira', sq: 'Furra dhe ëmbëlsira', sectors: ['ushqim-dhe-pije'] },
]

export function productGroupsForSectors(sectors: string[]): ProductGroup[] {
  return PRODUCT_GROUPS.filter((g) => g.sectors.some((s) => sectors.includes(s)))
}

export function productGroupLabel(slug: string): string {
  return PRODUCT_GROUPS.find((g) => g.slug === slug)?.sq ?? slug
}

// ── Grupet e tregjeve (Harta 2 e miratuar) ───────────────────────────────────
const EU_EFTA = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IS','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','CH','NO'])
const GULF_HALAL = new Set(['AE','SA','QA','KW','EG','MA','MY','ID'])
const CEFTA = new Set(['AL','MK','ME','RS','BA','MD'])
const US_CA = new Set(['US','CA'])

export type MarketGroup = 'EU_EFTA' | 'UK' | 'US_CA' | 'GULF_HALAL' | 'CEFTA' | 'OTHER'

export function marketGroupFor(countryCode: string): MarketGroup {
  if (EU_EFTA.has(countryCode)) return 'EU_EFTA'
  if (countryCode === 'GB') return 'UK'
  if (US_CA.has(countryCode)) return 'US_CA'
  if (GULF_HALAL.has(countryCode)) return 'GULF_HALAL'
  if (CEFTA.has(countryCode)) return 'CEFTA'
  return 'OTHER'
}

export const MARKET_GROUP_LABEL: Record<MarketGroup, string> = {
  EU_EFTA: 'BE + EFTA',
  UK: 'Mbretëria e Bashkuar',
  US_CA: 'SHBA + Kanada',
  GULF_HALAL: 'Tregjet me kërkesë halal',
  CEFTA: 'Ballkani / CEFTA',
  OTHER: 'Treg tjetër',
}
