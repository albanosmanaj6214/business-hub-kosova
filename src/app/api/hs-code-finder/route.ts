import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are an HS Code finder for a Kosovo business export platform. The business types a product description (usually in Albanian, sometimes English).

Return STRICT JSON matching this schema:
{
  "candidates": [
    {
      "hs6": "440710",
      "name": "Druri i sharruar i koniferëve, trashësi mbi 6 mm",
      "confidence": "high" | "medium" | "low",
      "reasoning": "Pse ky kod është i mundshëm (1 fjali shqip)"
    }
  ],
  "verifyChecklist": [
    "Specifiko llojin e drurit (lisi, ahu, pisha, etj.)",
    "Konfirmo trashësinë në mm"
  ],
  "typicalDocuments": [
    "Certifikatë origjine (EUR.1 ose CEFTA)",
    "Certifikatë fitosanitare nëse eksportohet jashtë BE-së"
  ],
  "notes": "Vëzhgim shtesë i shkurtër (1-2 fjali)",
  "disclaimer": "Kodi përfundimtar duhet konfirmuar me Doganën e Kosovës ose me agjent doganor. Ky është një udhëzim, jo vendim zyrtar."
}

Rules:
- Provide 1-4 candidate HS codes (6-digit, Harmonized System).
- Albanian language for all narrative fields.
- "confidence": high if product is clearly described, medium if generic, low if ambiguous.
- "verifyChecklist": 2-5 short specifics the business should clarify to narrow down (material, dimensions, processing, use).
- "typicalDocuments": 2-4 typical docs needed for products in this category.
- "disclaimer": Always include the standard disclaimer at the end.
- NEVER invent codes. If unsure, lower confidence and explain.
- Output ONLY the JSON object. No markdown, no preamble.`

interface FinderResult {
  candidates: Array<{ hs6: string; name: string; confidence: 'high' | 'medium' | 'low'; reasoning: string }>
  verifyChecklist: string[]
  typicalDocuments: string[]
  notes: string
  disclaimer: string
}

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
    _client = new Anthropic()
  }
  return _client
}

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { product?: string }
  const product = (body.product ?? '').trim()
  if (product.length < 3 || product.length > 200) {
    return NextResponse.json({ error: 'Përshkrimi i produktit duhet 3-200 karaktere' }, { status: 400 })
  }

  const queryKey = normalize(product)

  const cached = await prisma.hsQuery.findUnique({ where: { queryKey } })
  if (cached) {
    await prisma.hsQuery.update({
      where: { queryKey },
      data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
    })
    return NextResponse.json({ source: 'cache', result: cached.result as unknown as FinderResult })
  }

  let result: FinderResult
  try {
    const resp = await client().messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Produkti: ${product}` }],
    })
    const raw = (resp.content[0] && 'text' in resp.content[0]) ? resp.content[0].text : ''
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    result = JSON.parse(cleaned) as FinderResult
    if (!result.candidates || !Array.isArray(result.candidates)) {
      throw new Error('Invalid response shape')
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Përgjigja e Claude nuk u lexua: ${e.message}` }, { status: 502 })
  }

  await prisma.hsQuery.create({
    data: {
      queryKey,
      queryRaw: product,
      result: result as unknown as object,
      userId: (session.user as any)?.id ?? null,
    },
  })

  return NextResponse.json({ source: 'live', result })
}
