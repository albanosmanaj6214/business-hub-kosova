import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classifySource, LEGACY_CUSTOM_CODES } from '@/lib/ingestion/source-governance'
import { SourceGovernanceClient } from './SourceGovernanceClient'

export const dynamic = 'force-dynamic'

// SUPER_ADMIN-only registry console. Read on the server, mutate via the
// governance API. Secrets are stored as env-var NAMES only, so nothing secret
// leaves the server here.
export default async function SourceGovernancePage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') redirect('/dashboard')

  const rows = await prisma.source.findMany({
    orderBy: [{ tier: 'asc' }, { code: 'asc' }],
    include: {
      health: true,
      endpoints: { orderBy: { priority: 'asc' } },
    },
  })

  const sources = rows.map((s) => {
    const health = s.health
    const cls = classifySource({
      isActive: s.isActive,
      kind: (s as { kind?: string | null }).kind ?? null,
      isLegacyCustom: LEGACY_CUSTOM_CODES.includes(s.code),
      consecutiveFailures: health?.consecutiveFailures ?? 0,
      hasEverSucceeded: !!health?.lastSuccessAt,
    })
    return {
      id: s.id, code: s.code, name: s.name, tier: s.tier,
      institutionName: s.institutionName ?? null, officialDomain: s.officialDomain ?? null,
      baseUrl: s.baseUrl ?? null, country: s.country ?? null, language: s.language ?? null,
      sourceType: s.sourceType ?? null, kind: (s as { kind?: string }).kind ?? null,
      contentTypes: s.contentTypes ?? [], relevantRoles: s.relevantRoles ?? [],
      sectorsHint: s.sectorsHint ?? [], relevantCountries: s.relevantCountries ?? [],
      accessMethod: s.accessMethod ?? null, authenticationType: s.authenticationType ?? null,
      secretReference: s.secretReference ?? null, license: s.license ?? null,
      termsOfUseStatus: s.termsOfUseStatus ?? null, attributionRequirements: s.attributionRequirements ?? null,
      rateLimitPerMin: s.rateLimitPerMin ?? null, concurrencyLimit: s.concurrencyLimit ?? null,
      requestTimeoutMs: s.requestTimeoutMs ?? null, freshnessSlaHours: s.freshnessSlaHours ?? null,
      owner: s.owner ?? null, reviewer: s.reviewer ?? null, notes: s.notes ?? null,
      lifecycle: (s.lifecycle as string | null) ?? null, isActive: s.isActive,
      autoPublishAllowed: (s as { autoPublishAllowed?: boolean }).autoPublishAllowed ?? false,
      healthStatus: s.healthStatus ?? 'UNKNOWN',
      lastSuccessAt: health?.lastSuccessAt ? health.lastSuccessAt.toISOString() : null,
      consecutiveFailures: health?.consecutiveFailures ?? 0,
      sourceClass: cls,
      endpoints: s.endpoints.map((e) => ({
        id: e.id, name: e.name, url: e.url, endpointType: e.endpointType ?? null,
        enabled: e.enabled, priority: e.priority ?? null, healthStatus: e.healthStatus ?? null,
      })),
    }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Regjistri i burimeve — qeverisje</h1>
        <p className="text-sm text-ink-muted mt-1">
          Krijim, aprovim dhe aktivizim i kontrolluar i burimeve. Aprovimi nuk aktivizon. Sekretet ruhen si emra env, kurrë si vlera.
          Ky ekran nuk ekzekuton importe dhe nuk ndryshon orare.
        </p>
      </div>
      <SourceGovernanceClient sources={sources} />
    </div>
  )
}
