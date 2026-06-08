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
      'beverages', 'wine', 'food technology', 'agri-food', 'agribusiness', 'agriculture',
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
      'tekstil-konfeksion', 'tekstil dhe konfeksion', 'tekstil', 'textile', 'textiles',
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
      'druri dhe mobilje', 'druri-mobilje', 'dru dhe mobilje', 'druri', 'wood',
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
      'metale dhe makineri', 'metale e makineri', 'metalpunues', 'metale', 'machinery',
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
    if (variants.has(normalizeToken(t))) return true
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
