import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { countAudience } from '@/lib/audience-server'
import { parseAudience } from '@/lib/dispatch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Parapamje live: sa biznese e marrin nje artikull me kete audience.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = parseAudience(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const count = await countAudience(parsed.criteria)
  return NextResponse.json({ count })
}
