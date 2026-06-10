import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runRegistrySource, REGISTRY_KINDS } from '@/lib/scrapers/framework/runner'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') return null
  return session
}

// POST: run a registry source now, or toggle its active state.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: string }
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

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
