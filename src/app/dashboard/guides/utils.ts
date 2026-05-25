import type { Locale } from '@/lib/i18n'

export type GuideRow = {
  id: string
  title: string
  titleSq: string | null
  titleEn: string | null
  titleDe: string | null
  content: string
  contentSq: string | null
  contentEn: string | null
  contentDe: string | null
  country: string
  sectors: string[]
}

export function pickTitle(g: GuideRow, l: Locale): string {
  if (l === 'sq') return g.titleSq || g.title
  if (l === 'de') return g.titleDe || g.titleEn || g.title
  return g.titleEn || g.title
}

export function pickContent(g: GuideRow, l: Locale): string {
  if (l === 'sq') return g.contentSq || g.content
  if (l === 'de') return g.contentDe || g.contentEn || g.content
  return g.contentEn || g.content
}

export type RegionKey =
  | 'EU'
  | 'EFTA_UK'
  | 'WB'
  | 'EUROPE_OTHER'
  | 'MENA'
  | 'NA'
  | 'APAC'

export const REGION_ORDER: RegionKey[] = [
  'EU',
  'EFTA_UK',
  'WB',
  'EUROPE_OTHER',
  'MENA',
  'NA',
  'APAC',
]

type RegionLabel = {
  sq: string
  en: string
  de: string
  shortSq: string
  shortEn: string
  shortDe: string
}

export const REGION_LABELS: Record<RegionKey, RegionLabel> = {
  EU: {
    sq: 'Bashkimi Evropian',
    en: 'European Union',
    de: 'Europäische Union',
    shortSq: 'BE',
    shortEn: 'EU',
    shortDe: 'EU',
  },
  EFTA_UK: {
    sq: 'EFTA dhe Mbretëria e Bashkuar',
    en: 'EFTA and the United Kingdom',
    de: 'EFTA und Vereinigtes Königreich',
    shortSq: 'EFTA & MB',
    shortEn: 'EFTA & UK',
    shortDe: 'EFTA & UK',
  },
  WB: {
    sq: 'Ballkani Perëndimor',
    en: 'Western Balkans',
    de: 'Westbalkan',
    shortSq: 'Ballkani',
    shortEn: 'W. Balkans',
    shortDe: 'Westbalkan',
  },
  EUROPE_OTHER: {
    sq: 'Evropa tjetër',
    en: 'Other Europe',
    de: 'Übriges Europa',
    shortSq: 'Evropë tj.',
    shortEn: 'Other Europe',
    shortDe: 'Übriges EU',
  },
  MENA: {
    sq: 'Lindja e Mesme dhe Afrika Veriore',
    en: 'Middle East and North Africa',
    de: 'Naher Osten und Nordafrika',
    shortSq: 'MENA',
    shortEn: 'MENA',
    shortDe: 'MENA',
  },
  NA: {
    sq: 'Amerika e Veriut',
    en: 'North America',
    de: 'Nordamerika',
    shortSq: 'Amerikë',
    shortEn: 'N. America',
    shortDe: 'Nordamerika',
  },
  APAC: {
    sq: 'Azia-Paqësori',
    en: 'Asia-Pacific',
    de: 'Asien-Pazifik',
    shortSq: 'Azi-Paqësor',
    shortEn: 'Asia-Pac',
    shortDe: 'Asien-Pazifik',
  },
}

const SETS: Record<RegionKey, Set<string>> = {
  EU: new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
    'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
    'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]),
  EFTA_UK: new Set(['CH', 'IS', 'NO', 'LI', 'GB']),
  WB: new Set(['AL', 'BA', 'ME', 'MK', 'RS', 'XK']),
  EUROPE_OTHER: new Set(['MD', 'TR', 'UA', 'BY', 'AM', 'GE', 'AZ']),
  MENA: new Set([
    'SA', 'AE', 'QA', 'KW', 'BH', 'OM',
    'IL', 'EG', 'MA', 'TN', 'DZ', 'LY',
    'JO', 'LB', 'SY', 'IQ',
  ]),
  NA: new Set(['US', 'CA', 'MX']),
  APAC: new Set([
    'CN', 'IN', 'JP', 'KR', 'SG', 'MY', 'TH', 'VN', 'ID',
    'PH', 'AU', 'NZ', 'TW', 'HK', 'PK', 'BD', 'LK', 'KZ',
  ]),
}

export function regionFor(code?: string | null): RegionKey {
  if (!code) return 'EUROPE_OTHER'
  const c = code.toUpperCase()
  for (const key of REGION_ORDER) {
    if (SETS[key].has(c)) return key
  }
  return 'EUROPE_OTHER'
}
