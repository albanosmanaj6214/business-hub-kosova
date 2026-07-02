import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  extractFromPdf,
  extractFromHtmlPage,
  fetchTextTolerant,
  deadlineToDate,
} from '@/lib/extractors/claude-pdf'

const NOISE_PDF = [/flamuri/i, /logo/i, /banner/i, /stema/i]

async function findPdfUrl(pageUrl: string): Promise<string | null> {
  if (pageUrl.toLowerCase().endsWith('.pdf')) return pageUrl
  try {
    const html = await fetchTextTolerant(pageUrl)
    const matches = Array.from(html.matchAll(/href="([^"]*\.pdf)"/gi), m => m[1])
    const real = matches.find(m => !NOISE_PDF.some(p => p.test(m)))
    if (!real) return null
    return real.startsWith('http') ? real : new URL(real, pageUrl).toString()
  } catch {
    return null
  }
}

const Body = z.object({
  url: z.string().url(),
  context: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as any)?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

  const url = parsed.data.url
  try {
    const pdfUrl = await findPdfUrl(url)
    const extracted = pdfUrl
      ? await extractFromPdf({ pdfUrl, context: parsed.data.context })
      : await extractFromHtmlPage({ pageUrl: url, context: parsed.data.context })

    const deadlineDate = deadlineToDate(extracted.deadline)
    return NextResponse.json({
      ok: true,
      url,
      pdfUrl,
      extracted,
      deadlineISO: deadlineDate ? deadlineDate.toISOString().slice(0, 10) : null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
