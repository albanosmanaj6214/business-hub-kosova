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
  // Bujqësia shtesë (vala 2)
  { slug: 'bime-mjekesore-aromatike', sq: 'Bimë mjekësore-aromatike (MAP)', sectors: ['bujqesi-blegtori'] },
  // Druri dhe mobiljet (vala 2)
  { slug: 'mobilje', sq: 'Mobilje', sectors: ['druri-mobilje'] },
  { slug: 'dyer-dritare', sq: 'Dyer dhe dritare', sectors: ['druri-mobilje'] },
  { slug: 'parket', sq: 'Parket dhe dysheme druri', sectors: ['druri-mobilje'] },
  { slug: 'paleta-ambalazh-druri', sq: 'Paleta dhe ambalazh druri', sectors: ['druri-mobilje'] },
  { slug: 'pelet', sq: 'Pelet druri', sectors: ['druri-mobilje'] },
  // Tekstili (vala 2)
  { slug: 'konfeksion', sq: 'Konfeksion', sectors: ['tekstil-konfeksion'] },
  { slug: 'trikotazh', sq: 'Trikotazh', sectors: ['tekstil-konfeksion'] },
  { slug: 'uniforma-veshje-pune', sq: 'Uniforma dhe veshje pune', sectors: ['tekstil-konfeksion'] },
  { slug: 'tekstile-teknike', sq: 'Tekstile teknike', sectors: ['tekstil-konfeksion'] },
  // Lëkura (vala 2)
  { slug: 'kepuce', sq: 'Këpucë', sectors: ['lekure-kepuce'] },
  { slug: 'canta-aksesore', sq: 'Çanta dhe aksesorë', sectors: ['lekure-kepuce'] },
  { slug: 'regje-lekure', sq: 'Regje lëkure', sectors: ['lekure-kepuce'] },
  // Letra/paketimi (vala 2)
  { slug: 'karton-ambalazh', sq: 'Karton dhe ambalazh', sectors: ['leter-paketim'] },
  { slug: 'leter', sq: 'Letër', sectors: ['leter-paketim'] },
  { slug: 'etiketa-print', sq: 'Etiketa dhe print', sectors: ['leter-paketim'] },
  // Plastika/goma (vala 2)
  { slug: 'paketim-plastik', sq: 'Paketim plastik', sectors: ['plastika-goma'] },
  { slug: 'profile-gypa', sq: 'Profile dhe gypa', sectors: ['plastika-goma'] },
  { slug: 'pjese-teknike-plastike', sq: 'Pjesë teknike plastike/gome', sectors: ['plastika-goma'] },
  { slug: 'riciklim-plastik', sq: 'Riciklim plastik', sectors: ['plastika-goma'] },
  // Kimia/kozmetika (vala 2)
  { slug: 'kozmetike', sq: 'Kozmetikë', sectors: ['kimi-kozmetike'] },
  { slug: 'detergjente-higjiene', sq: 'Detergjentë dhe higjienë', sectors: ['kimi-kozmetike'] },
  { slug: 'ngjyra-llaqe', sq: 'Ngjyra dhe llaqe', sectors: ['kimi-kozmetike'] },
  { slug: 'kimikate-industriale', sq: 'Kimikate industriale', sectors: ['kimi-kozmetike'] },
  // Farmaceutika (vala 2)
  { slug: 'barna', sq: 'Barna', sectors: ['farmaceutike-mjekesore'] },
  { slug: 'pajisje-mjekesore', sq: 'Pajisje mjekësore', sectors: ['farmaceutike-mjekesore'] },
  { slug: 'suplemente', sq: 'Suplemente', sectors: ['farmaceutike-mjekesore'] },
  // Metalet (vala 2)
  { slug: 'konstruksione-metalike', sq: 'Konstruksione metalike', sectors: ['metale-makineri'] },
  { slug: 'perpunim-cnc', sq: 'Përpunim CNC / pjesë metalike', sectors: ['metale-makineri'] },
  { slug: 'pjese-auto', sq: 'Pjesë auto', sectors: ['metale-makineri', 'plastika-goma'] },
  { slug: 'makineri-pajisje', sq: 'Makineri dhe pajisje', sectors: ['metale-makineri'] },
  // Elektrike (vala 2)
  { slug: 'pajisje-shtepiake', sq: 'Pajisje shtëpiake', sectors: ['pajisje-elektrike'] },
  { slug: 'komponente-elektrike', sq: 'Komponentë elektrikë/elektronikë', sectors: ['pajisje-elektrike'] },
  { slug: 'ndricim', sq: 'Ndriçim', sectors: ['pajisje-elektrike'] },
  // Ndërtimi (vala 2)
  { slug: 'cimento-beton', sq: 'Çimento dhe beton', sectors: ['ndertim-materiale'] },
  { slug: 'gur-qeramike', sq: 'Gur dhe qeramikë', sectors: ['ndertim-materiale'] },
  { slug: 'dritare-profile', sq: 'Dritare dhe profile', sectors: ['ndertim-materiale'] },
  { slug: 'izolime', sq: 'Izolime', sectors: ['ndertim-materiale'] },
  // Artizanati (vala 2)
  { slug: 'zejtari', sq: 'Zejtari dhe punime dore', sectors: ['artizanat-kreative'] },
  { slug: 'lodra', sq: 'Lodra', sectors: ['artizanat-kreative'] },
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
