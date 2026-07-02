import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runRegistrySource, REGISTRY_KINDS } from '@/lib/scrapers/framework/runner'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') return null
  return session
}

// POST: run a registry source now, or toggle its active state.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as any
  const { id, action } = body as { id?: string; action?: string }
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  if (action === 'create') {
    // Burim i ri i regjistruar vetem me URL (nga /admin/permbajtja/burim-i-ri).
    // Hyn JOAKTIV + publikim 'review' — asgje s'del pa aprovimin e adminit.
    const { name, baseUrl, feedUrl, kind, category } = (await Promise.resolve(body)) as any
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
    return NextResponse.json({ ok: true, id: created.id, code: created.code })
  }


  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const source = await prisma.source.findUnique({ where: { id } })
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

  if (action === 'toggle') {
    const updated = await prisma.source.update({ where: { id }, data: { isActive: !source.isActive } })
    return NextResponse.json({ ok: true, isActive: updated.isActive })
  }

  if (action === 'run') {
    if (!source.kind || !REGISTRY_KINDS.includes(source.kind)) {
      return NextResponse.json({ error: 'This is a custom source. Run it from the AI Scraper page.' }, { status: 400 })
    }
    const result = await runRegistrySource(source, 'MANUAL')
    return NextResponse.json({ ok: result.ok, result })
  }

  return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 })
}
