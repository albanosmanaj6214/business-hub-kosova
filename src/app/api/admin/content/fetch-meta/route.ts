import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Lexon meta-të e një faqeje (titull, përshkrim, datë, emër i faqes) PA AI —
// mjafton për të parambushur formularin e panairit/lajmit nga një URL.
// Ekstraktimi i thellë me Haiku mbetet te /api/admin/grants/extract.

const Body = z.object({ url: z.string().url() })

function pick(re: RegExp, html: string): string | null {
  const m = html.match(re)
  return m ? decodeEntities(m[1].trim()) : null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#8211;|&ndash;/g, '-').replace(/&#8220;|&#8221;/g, '"')
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  const url = parsed.data.url

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KBH-Admin/1.0)' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return NextResponse.json({ error: `Faqja ktheu ${res.status}` }, { status: 400 })
    const html = (await res.text()).slice(0, 400_000)

    const title =
      pick(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i, html) ??
      pick(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i, html) ??
      pick(/<title[^>]*>([^<]+)<\/title>/i, html)

    const description =
      pick(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i, html) ??
      pick(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i, html) ??
      pick(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i, html)

    const siteName =
      pick(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i, html) ??
      new URL(url).hostname.replace(/^www\./, '')

    const publishedAt =
      pick(/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i, html) ??
      pick(/<time[^>]+datetime="([^"]+)"/i, html)

    return NextResponse.json({
      ok: true,
      meta: {
        title,
        description,
        siteName,
        publishedAt: publishedAt ? publishedAt.slice(0, 10) : null,
        url,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Faqja s\'u arrit dot: ' + (err as Error).message },
      { status: 400 },
    )
  }
}
