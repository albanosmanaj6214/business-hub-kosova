export type SectorSlug =
  // Production & Manufacturing
  | 'ushqim-dhe-pije'
  | 'bujqesi-blegtori'
  | 'tekstil-konfeksion'
  | 'lekure-kepuce'
  | 'druri-mobilje'
  | 'metale-makineri'
  | 'ndertim-materiale'
  | 'plastika-goma'
  | 'kimi-kozmetike'
  | 'leter-paketim'
  | 'pajisje-elektrike'
  | 'farmaceutike-mjekesore'
  // Services & Technology
  | 'tik'
  | 'energji-rinovueshme'
  | 'logjistike-transport'
  | 'turizem-mikpritje'
  | 'artizanat-kreative'
  | 'konstruksion-inxhinieri'

export type SectorGroup = 'production' | 'services'

export interface SectorDef {
  slug: SectorSlug
  sq: string
  en: string
  de: string
  group: SectorGroup
  icon: SectorIconName
  color: string
  tagline: { sq: string; en: string; de: string }
  variants: string[]
}

export type SectorIconName =
  | 'Utensils' | 'Wheat' | 'Shirt' | 'Footprints' | 'TreePine'
  | 'Factory' | 'Building2' | 'Recycle' | 'FlaskConical'
  | 'Package' | 'Plug' | 'Stethoscope'
  | 'Cpu' | 'Wind' | 'Truck' | 'Hotel'
  | 'Palette' | 'HardHat'

export const SECTOR_GROUP_LABEL: Record<SectorGroup, { sq: string; en: string; de: string }> = {
  production: {
    sq: 'Industri dhe prodhim',
    en: 'Industry & Manufacturing',
    de: 'Industrie & Fertigung',
  },
  services: {
    sq: 'Shërbime dhe teknologji',
    en: 'Services & Technology',
    de: 'Dienstleistungen & Technologie',
  },
}

export const SECTORS: SectorDef[] = [
  // ── PRODUCTION ──────────────────────────────────────────────────────────
  {
    slug: 'ushqim-dhe-pije',
    sq: 'Ushqim dhe pije',
    en: 'Food & Beverage',
    de: 'Lebensmittel & Getränke',
    group: 'production',
    icon: 'Utensils',
    color: '#E74C3C',
    tagline: {
      sq: 'Prodhuesit e ushqimit, pijeve, bulmetit, mishit dhe produkteve të përpunuara.',
      en: 'Producers of food, beverages, dairy, meat and processed goods.',
      de: 'Hersteller von Lebensmitteln, Getränken, Milchprodukten, Fleisch und Verarbeitungserzeugnissen.',
    },
    variants: [
      'ushqim dhe pije', 'ushqim & pije', 'ushqim', 'food & beverage', 'food and beverages',
      'beverages', 'food & beverages', 'food and beverage', 'wine', 'food technology', 'agri-food', 'food processing',
      'mish', 'bulmet', 'mjaltë', 'fruta & perime', 'fruta', 'perime', 'verë',
      'konserva', 'pastiçeri', 'erëza', 'vaj', 'peshk',
    ],
  },
  {
    slug: 'bujqesi-blegtori',
    sq: 'Bujqësi, blegtori dhe pemtari',
    en: 'Agriculture & Livestock',
    de: 'Landwirtschaft & Viehzucht',
    group: 'production',
    icon: 'Wheat',
    color: '#7CB342',
    tagline: {
      sq: 'Fermerët, pemtarët, blegtorët dhe prodhuesit primarë bujqësorë.',
      en: 'Farmers, orchardists, ranchers and primary agricultural producers.',
      de: 'Landwirte, Obstbauern, Viehzüchter und landwirtschaftliche Erzeuger.',
    },
    variants: [
      'bujqësi', 'blegtori', 'pemtari', 'agriculture', 'agribusiness', 'farming',
      'livestock', 'horticulture', 'dairy', 'kafshë', 'fermerët', 'organic',
    ],
  },
  {
    slug: 'tekstil-konfeksion',
    sq: 'Tekstil dhe konfeksion',
    en: 'Textile & Apparel',
    de: 'Textil & Bekleidung',
    group: 'production',
    icon: 'Shirt',
    color: '#9B59B6',
    tagline: {
      sq: 'Prodhuesit e veshjeve, tekstileve teknike dhe aksesorëve.',
      en: 'Manufacturers of apparel, technical textiles and accessories.',
      de: 'Hersteller von Bekleidung, technischen Textilien und Accessoires.',
    },
    variants: [
      'tekstil-konfeksion', 'tekstil dhe konfeksion', 'tekstil', 'textile', 'textiles',
      'textiles & apparel', 'textile & apparel', 'apparel', 'fashion',
    ],
  },
  {
    slug: 'lekure-kepuce',
    sq: 'Lëkurë dhe këpucë',
    en: 'Leather & Footwear',
    de: 'Leder & Schuhe',
    group: 'production',
    icon: 'Footprints',
    color: '#8B4513',
    tagline: {
      sq: 'Prodhuesit e këpucëve, çantave, rripave dhe artikujve të lëkurës.',
      en: 'Manufacturers of footwear, bags, belts and leather goods.',
      de: 'Hersteller von Schuhen, Taschen, Gürteln und Lederwaren.',
    },
    variants: [
      'lëkurë', 'leather', 'footwear', 'këpucë', 'shoes', 'çanta', 'bags',
    ],
  },
  {
    slug: 'druri-mobilje',
    sq: 'Druri dhe mobiljet',
    en: 'Wood & Furniture',
    de: 'Holz & Möbel',
    group: 'production',
    icon: 'TreePine',
    color: '#27AE60',
    tagline: {
      sq: 'Industria e drurit, mobiljet, parketet dhe produktet e pyjeve.',
      en: 'Wood industry, furniture, flooring and forest products.',
      de: 'Holzindustrie, Möbel, Bodenbeläge und Forstprodukte.',
    },
    variants: [
      'druri dhe mobilje', 'druri-mobilje', 'dru dhe mobilje', 'druri', 'wood',
      'wood & furniture', 'wood and furniture', 'forestry', 'furniture', 'mobilje', 'flooring', 'interior',
    ],
  },
  {
    slug: 'metale-makineri',
    sq: 'Metale dhe makineri',
    en: 'Metals & Machinery',
    de: 'Metall & Maschinen',
    group: 'production',
    icon: 'Factory',
    color: '#34495E',
    tagline: {
      sq: 'Përpunimi i metaleve, makineritë industriale dhe pjesët rezervë.',
      en: 'Metal processing, industrial machinery and spare parts.',
      de: 'Metallverarbeitung, Industriemaschinen und Ersatzteile.',
    },
    variants: [
      'metale dhe makineri', 'metale e makineri', 'metalpunues', 'metale', 'machinery',
      'metals & machinery', 'metals and machinery', 'industrial', 'metalurgjia', 'metal processing',
    ],
  },
  {
    slug: 'ndertim-materiale',
    sq: 'Materialet e ndërtimit',
    en: 'Construction Materials',
    de: 'Baumaterialien',
    group: 'production',
    icon: 'Building2',
    color: '#F39C12',
    tagline: {
      sq: 'Prodhuesit e çimentos, gurit, qeramikës, dritareve dhe materialeve të ndërtimit.',
      en: 'Producers of cement, stone, ceramics, windows and construction materials.',
      de: 'Hersteller von Zement, Stein, Keramik, Fenstern und Baumaterialien.',
    },
    variants: [
      'materiale ndërtimi', 'materiale të ndërtimit', 'building materials', 'ndërtim',
      'mining', 'mineral', 'çimento', 'stone', 'guri', 'qeramikë', 'ceramics',
    ],
  },
  {
    slug: 'plastika-goma',
    sq: 'Plastika dhe goma',
    en: 'Plastics & Rubber',
    de: 'Kunststoff & Gummi',
    group: 'production',
    icon: 'Recycle',
    color: '#16A085',
    tagline: {
      sq: 'Përpunuesit e plastikës, gomës, riciklimit dhe paketimit plastik.',
      en: 'Processors of plastics, rubber, recycling and plastic packaging.',
      de: 'Verarbeiter von Kunststoff, Gummi, Recycling und Kunststoffverpackungen.',
    },
    variants: ['plastika', 'plastics', 'goma', 'rubber', 'riciklim', 'recycling'],
  },
  {
    slug: 'kimi-kozmetike',
    sq: 'Kimi dhe kozmetikë',
    en: 'Chemicals & Cosmetics',
    de: 'Chemie & Kosmetik',
    group: 'production',
    icon: 'FlaskConical',
    color: '#E91E63',
    tagline: {
      sq: 'Prodhuesit e produkteve kimike, kozmetike, parfumeve dhe kujdesit personal.',
      en: 'Producers of chemicals, cosmetics, fragrance and personal-care products.',
      de: 'Hersteller von Chemikalien, Kosmetik-, Duft- und Körperpflegeprodukten.',
    },
    variants: [
      'kozmetikë', 'kozmetika', 'kozmetikë / cosmetics', 'cosmetics', 'kimi',
      'chemicals', 'fragrance', 'personal care',
    ],
  },
  {
    slug: 'leter-paketim',
    sq: 'Letër, paketim dhe printim',
    en: 'Paper, Packaging & Print',
    de: 'Papier, Verpackung & Druck',
    group: 'production',
    icon: 'Package',
    color: '#795548',
    tagline: {
      sq: 'Prodhuesit e paketimit, letrës, etiketave dhe shërbimeve të shtypjes.',
      en: 'Manufacturers of packaging, paper, labels and print services.',
      de: 'Hersteller von Verpackungen, Papier, Etiketten und Druckdienstleistungen.',
    },
    variants: ['letër', 'paper', 'packaging', 'paketim', 'printim', 'print', 'etiketa'],
  },
  {
    slug: 'pajisje-elektrike',
    sq: 'Pajisje elektrike dhe elektronike',
    en: 'Electrical & Electronics',
    de: 'Elektro & Elektronik',
    group: 'production',
    icon: 'Plug',
    color: '#FFC107',
    tagline: {
      sq: 'Prodhuesit e kabllove, pajisjeve elektrike, elektronikës dhe komponentëve.',
      en: 'Manufacturers of cables, electrical equipment, electronics and components.',
      de: 'Hersteller von Kabeln, Elektrogeräten, Elektronik und Komponenten.',
    },
    variants: [
      'elektronikë', 'electronics', 'electrical', 'kabllo', 'cables', 'pajisje shtëpiake',
    ],
  },
  {
    slug: 'farmaceutike-mjekesore',
    sq: 'Farmaceutikë dhe pajisje mjekësore',
    en: 'Pharma & Medical Devices',
    de: 'Pharma & Medizintechnik',
    group: 'production',
    icon: 'Stethoscope',
    color: '#00BCD4',
    tagline: {
      sq: 'Prodhuesit e barnave, suplementeve, pajisjeve mjekësore dhe lëndëve të para farmaceutike.',
      en: 'Producers of medicines, supplements, medical devices and pharma inputs.',
      de: 'Hersteller von Arzneimitteln, Nahrungsergänzungsmitteln, Medizinprodukten und Pharmainputs.',
    },
    variants: ['farmaceutikë', 'pharma', 'pharmaceutical', 'medical', 'mjekësore', 'biotechnology', 'biotech'],
  },

  // ── SERVICES & TECHNOLOGY ───────────────────────────────────────────────
  {
    slug: 'tik',
    sq: 'TIK, software dhe BPO',
    en: 'ICT, Software & BPO',
    de: 'IKT, Software & BPO',
    group: 'services',
    icon: 'Cpu',
    color: '#2E86C1',
    tagline: {
      sq: 'Kompanitë e softuerit, outsourcing-ut, BPO-së dhe shërbimeve dixhitale.',
      en: 'Software, IT outsourcing, BPO and digital service companies.',
      de: 'Software-, IT-Outsourcing-, BPO- und Digitaldienstleistungsunternehmen.',
    },
    variants: [
      'tik dhe shërbime', 'tik dhe shërbime dixhitale', 'tik dhe shërbime digjitale',
      'tik', 'teknologji informacioni dhe shërbime', 'ict', 'it', 'software', 'bpo',
      'advanced materials', 'deep tech', 'ict manufacturing',
    ],
  },
  {
    slug: 'energji-rinovueshme',
    sq: 'Energji dhe e rinovueshme',
    en: 'Energy & Renewables',
    de: 'Energie & Erneuerbare',
    group: 'services',
    icon: 'Wind',
    color: '#26A69A',
    tagline: {
      sq: 'Prodhimi, shpërndarja dhe shërbimet e energjisë, përfshirë solarin, erën dhe efikasitetin energjetik.',
      en: 'Energy production, distribution and services, including solar, wind and efficiency.',
      de: 'Energieerzeugung, Verteilung und Dienstleistungen, einschließlich Solar, Wind und Effizienz.',
    },
    variants: ['energji', 'energy', 'renewable', 'solar', 'wind', 'energjia e rinovueshme'],
  },
  {
    slug: 'logjistike-transport',
    sq: 'Logjistikë dhe transport',
    en: 'Logistics & Transport',
    de: 'Logistik & Transport',
    group: 'services',
    icon: 'Truck',
    color: '#455A64',
    tagline: {
      sq: 'Operatorët e transportit, spedicionit, magazinimit dhe shpërndarjes ndërkombëtare.',
      en: 'Transport operators, freight forwarding, warehousing and international distribution.',
      de: 'Transportunternehmen, Spedition, Lagerhaltung und internationale Verteilung.',
    },
    variants: ['logjistik', 'logistics', 'transport', 'shipping', 'magazinim', 'warehousing', 'freight'],
  },
  {
    slug: 'turizem-mikpritje',
    sq: 'Turizëm dhe mikpritje',
    en: 'Tourism & Hospitality',
    de: 'Tourismus & Gastgewerbe',
    group: 'services',
    icon: 'Hotel',
    color: '#FB8C00',
    tagline: {
      sq: 'Hotelet, restorantet, agjencitë turistike dhe shërbimet e mikpritjes.',
      en: 'Hotels, restaurants, travel agencies and hospitality services.',
      de: 'Hotels, Restaurants, Reisebüros und Gastgewerbe.',
    },
    variants: ['turizëm', 'tourism', 'hotel', 'hospitality', 'mikpritje', 'restorant', 'restaurant'],
  },
  {
    slug: 'artizanat-kreative',
    sq: 'Artizanat dhe industri kreative',
    en: 'Crafts & Creative Industries',
    de: 'Kunsthandwerk & Kreativwirtschaft',
    group: 'services',
    icon: 'Palette',
    color: '#AB47BC',
    tagline: {
      sq: 'Artizanët, dizajnerët, dhe industria kreative, qeramika tradicionale, etnografia.',
      en: 'Artisans, designers, creative industries, traditional ceramics, ethnographic crafts.',
      de: 'Handwerker, Designer, Kreativwirtschaft, traditionelle Keramik, Ethnografie.',
    },
    variants: ['artizanat', 'crafts', 'creative', 'industri kreative', 'design', 'art', 'dizajn'],
  },
  {
    slug: 'konstruksion-inxhinieri',
    sq: 'Konstruksion dhe inxhinieri',
    en: 'Construction & Engineering',
    de: 'Bau & Ingenieurwesen',
    group: 'services',
    icon: 'HardHat',
    color: '#D84315',
    tagline: {
      sq: 'Kompanitë e ndërtimit, inxhinierisë civile dhe shërbimet e projektimit.',
      en: 'Construction companies, civil engineering and design services.',
      de: 'Bauunternehmen, Bauingenieurwesen und Planungsdienstleistungen.',
    },
    variants: ['konstruksion', 'construction', 'inxhinieri', 'engineering', 'architecture', 'real estate'],
  },
]

export function sectorBySlug(slug: string): SectorDef | undefined {
  return SECTORS.find((s) => s.slug === slug)
}

export function sectorsByGroup(group: SectorGroup): SectorDef[] {
  return SECTORS.filter((s) => s.group === group)
}

function normalizeToken(s: string): string {
  return s.trim().toLowerCase()
}

export function sectorMatches(sector: SectorDef, tags: readonly string[]): boolean {
  const variants = new Set(sector.variants.map(normalizeToken))
  for (const t of tags) {
    const norm = normalizeToken(t)
    if (variants.has(norm)) return true
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

// Bridge from the legacy registration sector label (display string like
// "Dru & Mobileri") to the canonical sector slug. Kept for backwards
// compatibility while old User.sector free-text values still exist.
export const REGISTER_SECTOR_SLUG: Record<string, SectorSlug | null> = {
  'Prodhim Ushqimor': 'ushqim-dhe-pije',
  'Bujqesi': 'bujqesi-blegtori',
  'Tekstile': 'tekstil-konfeksion',
  'Ndertimtari': 'ndertim-materiale',
  'Teknologji': 'tik',
  'Metalurgji': 'metale-makineri',
  'Minerale': 'ndertim-materiale',
  'Dru & Mobileri': 'druri-mobilje',
  'Plastike & Kimikate': 'plastika-goma',
  'Energji': 'energji-rinovueshme',
  'Tjeter': null,
}

export function userSectorSlug(sector?: string | null): SectorSlug | null {
  if (!sector) return null
  if (sector in REGISTER_SECTOR_SLUG) return REGISTER_SECTOR_SLUG[sector]
  if (sectorBySlug(sector)) return sector as SectorSlug
  return inferSectorSlugs([sector])[0] ?? null
}

// ── Personalization helpers (v2 semantics) ─────────────────────────────────

export function userSectorSlugs(
  user: { sector?: string | null; sectors?: readonly string[] | null },
): SectorSlug[] {
  if (user.sectors && user.sectors.length) {
    return user.sectors.filter((s): s is SectorSlug => !!sectorBySlug(s))
  }
  const legacy = userSectorSlug(user.sector ?? null)
  return legacy ? [legacy] : []
}

export function hasNoSector(
  user: { sector?: string | null; sectors?: readonly string[] | null },
): boolean {
  return userSectorSlugs(user).length === 0
}

// Personalization filter v2:
//   - `cross-cutting` tag → always shows.
//   - Non-empty targetSectors that intersects user.sectors → shows.
//   - Empty targetSectors without `cross-cutting` tag → HIDDEN (uncategorized).
//   - User has no sector → show everything (no useful filter to apply).
export function matchesUserSectors(
  item: { targetSectors?: readonly string[] | null; tags?: readonly string[] | null },
  userSectors: readonly string[],
): boolean {
  if (!userSectors || userSectors.length === 0) return true
  const tags = item.tags ?? []
  if (tags.includes('cross-cutting')) return true
  const target = item.targetSectors ?? []
  if (target.length === 0) return false
  for (const t of target) {
    if (userSectors.includes(t)) return true
  }
  return false
}

export function sectorsLabel(slugs: readonly string[]): string {
  return slugs
    .map((s) => sectorBySlug(s)?.sq)
    .filter(Boolean)
    .join(', ')
}
