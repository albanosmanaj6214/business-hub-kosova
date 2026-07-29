import { prisma } from '@/lib/prisma'
import { classifySource, LEGACY_CUSTOM_CODES, type SourceClass } from '@/lib/ingestion/source-governance'

export interface ClassifiedSource {
  id: string
  code: string
  name: string
  tier: string
  isActive: boolean
  kind: string | null
  category: string
  lifecycle: string | null
  healthStatus: string
  lastSuccessAt: Date | null
  consecutiveFailures: number
  sourceClass: SourceClass
}

/** Load every source with its computed operational classification (governance view). */
export async function loadClassifiedSources(): Promise<ClassifiedSource[]> {
  const sources = await prisma.source.findMany({
    orderBy: [{ tier: 'asc' }, { isActive: 'desc' }, { code: 'asc' }],
    include: { health: true },
  })
  return sources.map((s) => {
    const isLegacyCustom = LEGACY_CUSTOM_CODES.includes(s.code)
    const consecutiveFailures = s.health?.consecutiveFailures ?? 0
    const lastSuccessAt = s.health?.lastSuccessAt ?? null
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      tier: s.tier,
      isActive: s.isActive,
      kind: s.kind,
      category: s.category,
      lifecycle: s.lifecycle,
      healthStatus: s.healthStatus,
      lastSuccessAt,
      consecutiveFailures,
      sourceClass: classifySource({
        isActive: s.isActive,
        kind: s.kind,
        isLegacyCustom,
        consecutiveFailures,
        hasEverSucceeded: lastSuccessAt != null,
      }),
    }
  })
}
