import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scrapeNews, upsertNewsItems } from '@/lib/scrapers/news'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Skrepon feed-et e lajmeve dhe i ruan PENDING. Vetem admin. Lajmet futen ne radhe
// te Qendra e Dispeçimit; asgje s'u shkon bizneseve derisa admini te caktoje audiencen.
export async function POST() {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { feeds, items } = await scrapeNews()
  const { created, updated } = await upsertNewsItems(items)

  return NextResponse.json({ ok: true, feeds, found: items.length, created, updated })
}
