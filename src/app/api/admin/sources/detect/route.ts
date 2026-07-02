import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Detekton llojin e një burimi vetëm nga URL-ja: rss / wordpress / html.
// SUPER_ADMIN only — regjistrimi i burimeve është infrastrukturë kritike.

const Body = z.object({ url: z.string().url() })

async function tryFetch(url: string, timeoutMs = 10000): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KBH-SourceDetect/1.0)' },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    })
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  const inputUrl = parsed.data.url.replace(/\/+$/, '')
  const origin = new URL(inputUrl).origin
  const evidence: string[] = []

  // 1) Vetë URL-ja është feed?
  const direct = await tryFetch(inputUrl)
  if (direct?.ok) {
    const ct = direct.headers.get('content-type') ?? ''
    const text = (await direct.text()).slice(0, 200_000)
    if (/xml|rss|atom/.test(ct) || /<rss[\s>]|<feed[\s>]/.test(text.slice(0, 2000))) {
      return NextResponse.json({ ok: true, kind: 'rss', feedUrl: inputUrl, evidence: ['URL-ja është vetë RSS/Atom feed'] })
    }
    // 2) HTML me link te feed-i?
    const feedLink = text.match(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]+href="([^"]+)"/i)
      ?? text.match(/<link[^>]+href="([^"]+)"[^>]+type="application\/(?:rss|atom)\+xml"/i)
    if (feedLink) {
      const feedUrl = feedLink[1].startsWith('http') ? feedLink[1] : new URL(feedLink[1], inputUrl).toString()
      evidence.push('Faqja deklaron RSS feed në <head>')
      return NextResponse.json({ ok: true, kind: 'rss', feedUrl, evidence })
    }
    // 3) WordPress?
    if (/wp-content|wp-json|wp-includes/.test(text)) {
      const wpApi = await tryFetch(origin + '/wp-json/wp/v2/posts?per_page=1', 8000)
      if (wpApi?.ok) {
        evidence.push('Faqja është WordPress me REST API të hapur')
        return NextResponse.json({ ok: true, kind: 'wordpress', feedUrl: origin + '/wp-json/wp/v2/posts', evidence })
      }
      const wpFeed = await tryFetch(inputUrl + '/feed/', 8000)
      if (wpFeed?.ok && /xml|rss/.test(wpFeed.headers.get('content-type') ?? '')) {
        evidence.push('WordPress me /feed/ aktiv')
        return NextResponse.json({ ok: true, kind: 'rss', feedUrl: inputUrl + '/feed/', evidence })
      }
      evidence.push('WordPress pa API/feed të hapur — kalon në HTML')
    }
    // 4) Provo /feed konvencional
    const conv = await tryFetch(inputUrl + '/feed', 8000)
    if (conv?.ok && /xml|rss/.test(conv.headers.get('content-type') ?? '')) {
      return NextResponse.json({ ok: true, kind: 'rss', feedUrl: inputUrl + '/feed', evidence: ['/feed ekziston'] })
    }
    // 5) Fallback: html adapter (lista të thjeshta)
    evidence.push('S\'u gjet feed — do të përdoret adapteri HTML (lexon lista lidhjesh)')
    return NextResponse.json({ ok: true, kind: 'html', feedUrl: inputUrl, evidence })
  }

  return NextResponse.json({ error: 'URL-ja s\'u arrit dot. Kontrollo adresën.' }, { status: 400 })
}
