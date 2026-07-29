import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sourceGovernanceSchema, endpointSchema, toClientSource } from '@/lib/ingestion/source-validation'
import { assertTierAllowsContentTypes, canTransition, isActivation, activationReadiness, type Lifecycle, type Tier } from '@/lib/ingestion/source-governance'
import { probeConnection, UnsafeUrlError } from '@/lib/ingestion/safe-url'

// SUPER_ADMIN only. Governance mutations for the source registry. Secrets are
// never returned. Approval and activation are SEPARATE transitions; activation
// requires prior APPROVED + governance preconditions. Creating/approving a
// source never activates ingestion and never changes a schedule.
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') return null
  return session!.user as { id?: string; email?: string }
}

export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'action i munguar' }, { status: 400 })
  const actor = { actorId: admin.id, actorEmail: admin.email }

  try {
    switch (body.action) {
      case 'create': {
        const parsed = sourceGovernanceSchema.safeParse(body.data)
        if (!parsed.success) return NextResponse.json({ error: 'validim', issues: parsed.error.issues }, { status: 400 })
        const d = parsed.data
        assertTierAllowsContentTypes(d.tier as Tier, d.contentTypes)
        const created = await prisma.source.create({
          data: {
            code: d.code, name: d.name, tier: d.tier, baseUrl: d.baseUrl, category: 'MIXED',
            strategies: {}, institutionName: d.institutionName, description: d.notes,
            officialDomain: d.officialDomain, sourceType: d.sourceType, country: d.country,
            language: d.language ?? 'sq', contentTypes: d.contentTypes, relevantRoles: d.relevantRoles,
            sectorsHint: d.relevantSectors, relevantCountries: d.relevantCountries,
            accessMethod: d.accessMethod, authenticationType: d.authenticationType, secretReference: d.secretReference,
            license: d.license, termsOfUseStatus: d.termsOfUseStatus, attributionRequirements: d.attributionRequirements,
            rateLimitPerMin: d.rateLimitPerMin, concurrencyLimit: d.concurrencyLimit, requestTimeoutMs: d.requestTimeoutMs,
            freshnessSlaHours: d.freshnessSlaHours, owner: d.owner, reviewer: d.reviewer, notes: d.notes,
            // Safe defaults: never active, never auto-publish, starts DRAFT.
            isActive: false, autoPublishAllowed: false, lifecycle: 'DRAFT', healthStatus: 'UNKNOWN',
          },
        })
        await logAudit({ ...actor, action: 'SOURCE_GOV_CREATE', entityType: 'Source', entityId: created.id, summary: `Krijoi burim draft ${created.code} (tier ${created.tier})` })
        return NextResponse.json({ source: toClientSource(created as Record<string, unknown>) })
      }

      case 'update': {
        if (typeof body.id !== 'string') return NextResponse.json({ error: 'id i munguar' }, { status: 400 })
        const parsed = sourceGovernanceSchema.partial().safeParse(body.data)
        if (!parsed.success) return NextResponse.json({ error: 'validim', issues: parsed.error.issues }, { status: 400 })
        const d = parsed.data
        const existing = await prisma.source.findUnique({ where: { id: body.id } })
        if (!existing) return NextResponse.json({ error: 'nuk u gjet' }, { status: 404 })
        const tier = (d.tier ?? existing.tier) as Tier
        const contentTypes = d.contentTypes ?? existing.contentTypes
        assertTierAllowsContentTypes(tier, contentTypes)
        const updated = await prisma.source.update({
          where: { id: body.id },
          data: {
            name: d.name, tier: d.tier, baseUrl: d.baseUrl, institutionName: d.institutionName,
            officialDomain: d.officialDomain, sourceType: d.sourceType, country: d.country, language: d.language,
            contentTypes: d.contentTypes, relevantRoles: d.relevantRoles, sectorsHint: d.relevantSectors,
            relevantCountries: d.relevantCountries, accessMethod: d.accessMethod, authenticationType: d.authenticationType,
            secretReference: d.secretReference, license: d.license, termsOfUseStatus: d.termsOfUseStatus,
            attributionRequirements: d.attributionRequirements, rateLimitPerMin: d.rateLimitPerMin,
            concurrencyLimit: d.concurrencyLimit, requestTimeoutMs: d.requestTimeoutMs, freshnessSlaHours: d.freshnessSlaHours,
            owner: d.owner, reviewer: d.reviewer, notes: d.notes,
          },
        })
        await logAudit({ ...actor, action: 'SOURCE_GOV_UPDATE', entityType: 'Source', entityId: updated.id, summary: `Përditësoi qeverisjen e burimit ${updated.code}` })
        return NextResponse.json({ source: toClientSource(updated as Record<string, unknown>) })
      }

      case 'transition': {
        const { id, to } = body
        if (typeof id !== 'string' || typeof to !== 'string') return NextResponse.json({ error: 'id/to i munguar' }, { status: 400 })
        const existing = await prisma.source.findUnique({ where: { id } })
        if (!existing) return NextResponse.json({ error: 'nuk u gjet' }, { status: 404 })
        const from = existing.lifecycle as Lifecycle | null
        if (!canTransition(from, to as Lifecycle)) {
          return NextResponse.json({ error: `Tranzicion i palejuar: ${from ?? 'legacy'} -> ${to}` }, { status: 409 })
        }
        // Activation gate: ACTIVE requires prior APPROVED + governance preconditions.
        if (isActivation(to as Lifecycle)) {
          const readiness = activationReadiness({
            tier: existing.tier, institutionName: existing.institutionName, baseUrl: existing.baseUrl,
            accessMethod: existing.accessMethod, kind: existing.kind, license: existing.license,
            termsOfUseStatus: existing.termsOfUseStatus, rateLimitPerMin: existing.rateLimitPerMin,
            requestTimeoutMs: existing.requestTimeoutMs, owner: existing.owner, reviewer: existing.reviewer,
            lifecycle: from,
          })
          if (!readiness.ok) {
            return NextResponse.json({ error: 'Parakushtet e aktivizimit nuk plotësohen', missing: readiness.missing }, { status: 422 })
          }
        }
        const deactivating = ['PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED'].includes(to)
        const updated = await prisma.source.update({
          where: { id },
          data: { lifecycle: to as Lifecycle, ...(isActivation(to as Lifecycle) ? { isActive: true } : deactivating ? { isActive: false } : {}) },
        })
        await logAudit({ ...actor, action: 'SOURCE_LIFECYCLE', entityType: 'Source', entityId: id, summary: `${existing.code}: ${from ?? 'legacy'} -> ${to}`, meta: { from, to, activated: isActivation(to as Lifecycle) } })
        return NextResponse.json({ source: toClientSource(updated as Record<string, unknown>) })
      }

      case 'testConnection': {
        // SSRF-guarded reachability probe with safe metrics only. Never activates.
        if (typeof body.url !== 'string') return NextResponse.json({ error: 'url i munguar' }, { status: 400 })
        const probe = await probeConnection(body.url, { timeoutMs: 12000, maxBytes: 2_000_000, maxRedirects: 3 })
        return NextResponse.json({ ...probe, note: 'Testi i lidhjes nuk aprovon dhe nuk aktivizon burimin.' })
      }

      case 'addEndpoint': {
        if (typeof body.sourceId !== 'string') return NextResponse.json({ error: 'sourceId i munguar' }, { status: 400 })
        const parsed = endpointSchema.safeParse(body.data)
        if (!parsed.success) return NextResponse.json({ error: 'validim', issues: parsed.error.issues }, { status: 400 })
        const ep = await prisma.sourceEndpoint.create({ data: { sourceId: body.sourceId, ...parsed.data } })
        await logAudit({ ...actor, action: 'SOURCE_ENDPOINT_ADD', entityType: 'SourceEndpoint', entityId: ep.id, summary: `Shtoi endpoint te burimi ${body.sourceId}` })
        return NextResponse.json({ endpoint: toClientSource(ep as Record<string, unknown>) })
      }

      case 'updateEndpoint': {
        if (typeof body.endpointId !== 'string') return NextResponse.json({ error: 'endpointId i munguar' }, { status: 400 })
        const parsed = endpointSchema.partial().safeParse(body.data)
        if (!parsed.success) return NextResponse.json({ error: 'validim', issues: parsed.error.issues }, { status: 400 })
        const ep = await prisma.sourceEndpoint.update({ where: { id: body.endpointId }, data: parsed.data })
        await logAudit({ ...actor, action: 'SOURCE_ENDPOINT_UPDATE', entityType: 'SourceEndpoint', entityId: ep.id, summary: `Përditësoi endpoint ${ep.id}` })
        return NextResponse.json({ endpoint: toClientSource(ep as Record<string, unknown>) })
      }

      case 'toggleEndpoint': {
        if (typeof body.endpointId !== 'string' || typeof body.enabled !== 'boolean') return NextResponse.json({ error: 'endpointId/enabled i munguar' }, { status: 400 })
        // Enabling endpoint CONFIG does not connect live scraping in Phase 1.
        const ep = await prisma.sourceEndpoint.update({ where: { id: body.endpointId }, data: { enabled: body.enabled } })
        await logAudit({ ...actor, action: 'SOURCE_ENDPOINT_UPDATE', entityType: 'SourceEndpoint', entityId: ep.id, summary: `Endpoint ${ep.id} enabled=${body.enabled}` })
        return NextResponse.json({ endpoint: toClientSource(ep as Record<string, unknown>) })
      }

      case 'deleteEndpoint': {
        if (typeof body.endpointId !== 'string') return NextResponse.json({ error: 'endpointId i munguar' }, { status: 400 })
        await prisma.sourceEndpoint.delete({ where: { id: body.endpointId } })
        await logAudit({ ...actor, action: 'SOURCE_ENDPOINT_DELETE', entityType: 'SourceEndpoint', entityId: body.endpointId, summary: 'Fshiu endpoint' })
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'action i panjohur' }, { status: 400 })
    }
  } catch (e) {
    if (e instanceof UnsafeUrlError) return NextResponse.json({ error: e.message }, { status: 422 })
    const msg = e instanceof Error ? e.message : 'gabim i brendshëm'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
