export type SectorSlug =
  | 'ushqim-dhe-pije'
  | 'tekstil-konfeksion'
  | 'druri-mobilje'
  | 'metale-makineri'
  | 'kozmetike'
  | 'tik'
  | 'ndertim-materiale'

export interface SectorDef {
  slug: SectorSlug
  sq: string
  en: string
  de: string
  icon: 'Utensils' | 'Shirt' | 'TreePine' | 'Settings' | 'Heart' | 'Cpu' | 'Building2'
  color: string
  tagline: { sq: string; en: string; de: string }
  variants: string[]
}

export const SECTORS: SectorDef[] = [
  {
    slug: 'ushqim-dhe-pije',
    sq: 'Ushqim dhe pije',
    en: 'Food & Beverage',
    de: 'Lebensmittel & Getränke',
    icon: 'Utensils',
    color: '#E74C3C',
    tagline: {
      sq: 'Eksportuesit e ushqimit, pijeve, mishit, bulmetit dhe produkteve bujqësore.',
      en: 'Exporters of food, beverages, meat, dairy and agricultural products.',
      de: 'Exporteure von Lebensmitteln, Getränken, Fleisch, Milchprodukten und landwirtschaftlichen Erzeugnissen.',
    },
    variants: [
      'ushqim dhe pije', 'ushqim & pije', 'ushqim', 'food & beverage', 'food and beverages',
      'beverages', 'food & beverages', 'food and beverage', 'wine', 'food technology', 'agri-food', 'agribusiness', 'agriculture',
      'mish', 'bulmet', 'mjaltë', 'fruta & perime', 'fruta', 'perime', 'verë',
      'konserva', 'pastiçeri', 'erëza', 'vaj', 'peshk', 'kafshë',
    ],
  },
  {
    slug: 'tekstil-konfeksion',
    sq: 'Tekstil dhe konfeksion',
    en: 'Textile & Fashion',
    de: 'Textil & Mode',
    icon: 'Shirt',
    color: '#9B59B6',
    tagline: {
      sq: 'Prodhuesit e veshjeve, tekstileve teknike, lëkurës dhe aksesorëve.',
      en: 'Manufacturers of apparel, technical textiles, leather and accessories.',
      de: 'Hersteller von Bekleidung, technischen Textilien, Leder und Accessoires.',
    },
    variants: [
      'tekstil-konfeksion', 'tekstil dhe konfeksion', 'tekstil', 'textile', 'textiles', 'textiles & apparel', 'textile & apparel', 'apparel',
      'fashion', 'leather', 'lëkurë',
    ],
  },
  {
    slug: 'druri-mobilje',
    sq: 'Druri dhe mobilje',
    en: 'Wood & Furniture',
    de: 'Holz & Möbel',
    icon: 'TreePine',
    color: '#27AE60',
    tagline: {
      sq: 'Industria e drurit, mobiljeve, parketit dhe produkteve të pyjeve.',
      en: 'Wood industry, furniture, flooring and forest products.',
      de: 'Holzindustrie, Möbel, Bodenbeläge und Forstprodukte.',
    },
    variants: [
      'druri dhe mobilje', 'druri-mobilje', 'dru dhe mobilje', 'druri', 'wood', 'wood & furniture', 'wood and furniture',
      'forestry', 'furniture', 'mobilje',
    ],
  },
  {
    slug: 'metale-makineri',
    sq: 'Metale dhe makineri',
    en: 'Metals & Machinery',
    de: 'Metall & Maschinen',
    icon: 'Settings',
    color: '#34495E',
    tagline: {
      sq: 'Përpunimi i metaleve, makineri industriale, elektronika dhe pjesë rezervë.',
      en: 'Metal processing, industrial machinery, electronics and spare parts.',
      de: 'Metallverarbeitung, Industriemaschinen, Elektronik und Ersatzteile.',
    },
    variants: [
      'metale dhe makineri', 'metale e makineri', 'metalpunues', 'metale', 'machinery', 'metals & machinery', 'metals and machinery',
      'industrial', 'electronics', 'electrical',
    ],
  },
  {
    slug: 'kozmetike',
    sq: 'Kozmetikë',
    en: 'Cosmetics',
    de: 'Kosmetik',
    icon: 'Heart',
    color: '#E91E63',
    tagline: {
      sq: 'Prodhuesit e produkteve kozmetike, kujdesit personal dhe parfumeve.',
      en: 'Manufacturers of cosmetics, personal care and fragrance products.',
      de: 'Hersteller von Kosmetik-, Körperpflege- und Duftprodukten.',
    },
    variants: ['kozmetikë', 'kozmetika', 'kozmetikë / cosmetics', 'cosmetics', 'kimi'],
  },
  {
    slug: 'tik',
    sq: 'TIK dhe shërbime dixhitale',
    en: 'ICT & Digital Services',
    de: 'IKT & Digitale Dienste',
    icon: 'Cpu',
    color: '#2E86C1',
    tagline: {
      sq: 'Kompanitë e softuerit, outsourcing-ut dhe shërbimeve teknologjike.',
      en: 'Software companies, IT outsourcing and technology services.',
      de: 'Softwareunternehmen, IT-Outsourcing und Technologiedienstleistungen.',
    },
    variants: [
      'tik dhe shërbime', 'tik dhe shërbime dixhitale', 'tik dhe shërbime digjitale',
      'tik', 'teknologji informacioni dhe shërbime', 'ict', 'it', 'biotechnology',
      'advanced materials', 'deep tech',
    ],
  },
  {
    slug: 'ndertim-materiale',
    sq: 'Ndërtim dhe materiale',
    en: 'Construction & Materials',
    de: 'Bau & Baumaterialien',
    icon: 'Building2',
    color: '#F39C12',
    tagline: {
      sq: 'Eksportuesit e materialeve të ndërtimit, çimentos, gurit dhe mineraleve.',
      en: 'Exporters of construction materials, cement, stone and minerals.',
      de: 'Exporteure von Baumaterialien, Zement, Stein und Mineralien.',
    },
    variants: [
      'materiale ndërtimi', 'building materials', 'construction', 'ndërtim',
      'mining', 'real estate', 'architecture',
    ],
  },
]

export function sectorBySlug(slug: string): SectorDef | undefined {
  return SECTORS.find((s) => s.slug === slug)
}

function normalizeToken(s: string): string {
  return s.trim().toLowerCase()
}

export function sectorMatches(sector: SectorDef, tags: readonly string[]): boolean {
  const variants = new Set(sector.variants.map(normalizeToken))
  for (const t of tags) {
    const norm = normalizeToken(t)
    if (variants.has(norm)) return true
    // Bilingual tags like "Ushqim dhe pije / Food & Beverages" must match either side.
    const parts = norm.split(/\s*[\/,|]\s*/).filter(Boolean)
    for (const p of parts) {
      if (variants.has(p)) return true
    }
  }
  return false
}

export function inferSectorSlugs(tags: readonly string[]): SectorSlug[] {
  return SECTORS.filter((s) => sectorMatches(s, tags)).map((s) => s.slug)
}

// Bridge from the registration/settings sector label (a display string like
// "Dru & Mobileri") to the canonical sector slug used across opportunities.
export const REGISTER_SECTOR_SLUG: Record<string, SectorSlug | null> = {
  'Prodhim Ushqimor': 'ushqim-dhe-pije',
  'Bujqesi': 'ushqim-dhe-pije',
  'Tekstile': 'tekstil-konfeksion',
  'Ndertimtari': 'ndertim-materiale',
  'Teknologji': 'tik',
  'Metalurgji': 'metale-makineri',
  'Minerale': 'ndertim-materiale',
  'Dru & Mobileri': 'druri-mobilje',
  'Plastike & Kimikate': 'kozmetike',
  'Energji': null,
  'Tjeter': null,
}

export function userSectorSlug(sector?: string | null): SectorSlug | null {
  if (!sector) return null
  if (sector in REGISTER_SECTOR_SLUG) return REGISTER_SECTOR_SLUG[sector]
  if (sectorBySlug(sector)) return sector as SectorSlug
  return inferSectorSlugs([sector])[0] ?? null
}

// ----------------------------------------------------------------------------
// Personalization v1 helpers
// ----------------------------------------------------------------------------

// Coerce a free-text user.sector + new sectors[] array into a canonical slug list.
// Reading-side helper for the bridge period while we still have both columns.
export function userSectorSlugs(
  user: { sector?: string | null; sectors?: readonly string[] | null },
): SectorSlug[] {
  if (user.sectors && user.sectors.length) {
    return user.sectors.filter((s): s is SectorSlug => !!sectorBySlug(s))
  }
  const legacy = userSectorSlug(user.sector ?? null)
  return legacy ? [legacy] : []
}

// True when the user has no canonical sector picked yet.
export function hasNoSector(
  user: { sector?: string | null; sectors?: readonly string[] | null },
): boolean {
  return userSectorSlugs(user).length === 0
}

// Deep personalization filter.
//
// Rules:
//  - Universal item (empty targetSectors[] OR `cross-cutting` tag): always shows.
//  - Otherwise: shows when item.targetSectors[] intersects user.sectors[].
//
// `userSectors` may be empty — that means the user has not picked a sector,
// in which case we show everything (no useful filter to apply).
export function matchesUserSectors(
  item: { targetSectors?: readonly string[] | null; tags?: readonly string[] | null },
  userSectors: readonly string[],
): boolean {
  if (!userSectors || userSectors.length === 0) return true
  const target = item.targetSectors ?? []
  const tags = item.tags ?? []
  if (target.length === 0) return true
  if (tags.includes('cross-cutting')) return true
  for (const t of target) {
    if (userSectors.includes(t)) return true
  }
  return false
}

// Returns a human-readable Albanian label for a list of slugs, e.g.
// ['druri-mobilje', 'tik'] -> 'Druri dhe mobilje, TIK dhe shërbime dixhitale'.
export function sectorsLabel(slugs: readonly string[]): string {
  return slugs
    .map((s) => sectorBySlug(s)?.sq)
    .filter(Boolean)
    .join(', ')
}
