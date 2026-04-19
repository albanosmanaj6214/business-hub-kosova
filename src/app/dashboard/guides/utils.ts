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
