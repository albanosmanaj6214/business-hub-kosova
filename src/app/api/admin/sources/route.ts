import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runRegistrySource, REGISTRY_KINDS } from '@/lib/scrapers/framework/runner'
import { runCustomSourceByCode, isCustomSource, isRunning } from '@/lib/scrapers/run-source'
import { loadSourceHealth, loadSourceAlerts } from '@/lib/scrapers/health-server'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') return null
  return session
}

// GET: per-source operational health + the alert list (SUPER_ADMIN only).
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  if (url.searchParams.get('view') === 'alerts') {
    return NextResponse.json({ alerts: await loadSourceAlerts() })
  }
  const health = await loadSourceHealth({ includeConfigOnly: url.searchParams.get('all') === '1' })
  const alerts = health.filter((h) => h.alert)
  return NextResponse.json({ health, alertCount: alerts.length })
}

// POST: create / toggle / run one selected source (registry OR custom).
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as any
  const { id, action } = body as { id?: string; action?: string }
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  if (action === 'create') {
    const { name, baseUrl, feedUrl, kind, category } = body as any
    if (!name || !baseUrl || !kind) {
      return NextResponse.json({ error: 'name, baseUrl dhe kind kerkohen' }, { status: 400 })
    }
    const validKinds = ['rss', 'wordpress', 'html', 'pdf']
    if (!validKinds.includes(kind)) {
      return NextResponse.json({ error: 'kind i panjohur' }, { status: 400 })
    }
    const validCats = ['GRANT', 'FAIR', 'REGULATION', 'MIXED']
    const cat = validCats.includes(category) ? category : 'MIXED'
    const code = String(name)
      .toLowerCase()
      .replace(/[ëç]/g, (c: string) => (c === 'ë' ? 'e' : 'c'))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6)
    const created = await prisma.source.create({
      data: {
        code,
        name: String(name).slice(0, 200),
        tier: 'B',
        baseUrl: String(baseUrl).slice(0, 500),
        category: cat as any,
        language: 'sq',
        strategies: { feedUrl: feedUrl ?? baseUrl },
        kind,
        publishMode: 'review',
        isActive: false,
        orgCategory: cat === 'GRANT' ? 'institucion' : null,
      },
    })
    await logAudit({ action: 'SOURCE_CREATE', entityType: 'SOURCE', entityId: created.id, summary: `Regjistroi burim të ri: ${created.name} (${kind})` })
    return NextResponse.json({ ok: true, id: created.id, code: created.code })
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const source = await prisma.source.findUnique({ where: { id } })
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

  if (action === 'toggle') {
    const updated = await prisma.source.update({ where: { id }, data: { isActive: !source.isActive } })
    await logAudit({ action: 'SOURCE_TOGGLE', entityType: 'SOURCE', entityId: id, summary: `${source.name}: ${updated.isActive ? 'aktivizua' : 'çaktivizua'}` })
    return NextResponse.json({ ok: true, isActive: updated.isActive })
  }

  // Run exactly ONE selected source. Custom scrapers and framework/registry sources
  // are both supported here; nothing else is triggered. Concurrency-guarded.
  if (action === 'run') {
    if (isCustomSource(source.code)) {
      if (isRunning(source.code)) {
        return NextResponse.json({ ok: false, skipped: true, error: `Burimi ${source.code} është duke u ekzekutuar tashmë.` }, { status: 409 })
      }
      const result = await runCustomSourceByCode(source.code, { triggeredBy: 'MANUAL' })
      await logAudit({ action: 'SOURCE_RUN', entityType: 'SOURCE', entityId: id, summary: `Run manual (custom) ${source.code}: ${result.ok ? 'ok' : 'dështoi'} (${result.items ?? 0} artikuj)` })
      return NextResponse.json({ ok: result.ok, result }, { status: result.ok ? 200 : 200 })
    }
    if (source.kind && REGISTRY_KINDS.includes(source.kind)) {
      const result = await runRegistrySource(source, 'MANUAL')
      await logAudit({ action: 'SOURCE_RUN', entityType: 'SOURCE', entityId: id, summary: `Run manual (framework) ${source.code}: ${result.ok ? 'ok' : 'dështoi'}` })
      return NextResponse.json({ ok: result.ok, result })
    }
    return NextResponse.json({ error: 'Ky burim s\'ka adapter/scraper (config-only).' }, { status: 400 })
  }

  return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 })
}
