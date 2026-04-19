import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

function extractJsonArray(text: string): any[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const m = candidate.match(/\[[\s\S]*\]/)
  if (!m) throw new Error('No JSON array found in model output')
  return JSON.parse(m[0])
}

const GRANTS_SYSTEM =
  'You are an export-intelligence researcher producing data for a Kosovar SaaS platform. ' +
  'Respond ONLY with a JSON array — no preamble, no trailing prose. ' +
  'Every object must parse as valid JSON. Dates must be ISO 8601 (YYYY-MM-DD).'

const GRANTS_PROMPT = `Produce a JSON array of 8 realistic grant / funding opportunities currently relevant to Kosovo-based manufacturers and exporters.
Base them on real programs from the EU (Horizon, COSME, IPA), USAID, GIZ, EBRD, World Bank, KOSME, Ministry of Industry, Entrepreneurship and Trade of Kosovo, KIESA, and similar.
Each object must have:
- title (English)
- titleSq (Albanian)
- titleEn (English, may equal title)
- titleDe (German translation)
- description (English, 2-3 sentences)
- descriptionSq (Albanian)
- descriptionEn (English)
- descriptionDe (German)
- provider (organization name)
- amount (e.g. "EUR 10,000 - 50,000")
- currency (ISO, usually "EUR")
- deadline (ISO date within the next 8 months)
- eligibility (one paragraph)
- url (best-known real URL for the program)
- country ("Kosovo" or source country)
- sectors (array — e.g. ["Food & Beverage","Agriculture","Textiles"])
- tags (array — e.g. ["eu","export","sme"])`

const FAIRS_SYSTEM = GRANTS_SYSTEM

const FAIRS_PROMPT = `Produce a JSON array of 8 upcoming international trade fairs relevant to Kosovar exporters (food & beverage, textiles, wood, construction, ICT).
Focus on the EU, Turkey, UAE, Western Balkans. Base on real recurring fairs (Anuga, SIAL, Gulfood, ITB, Ambiente, Heimtextil, BIG 5, Trieste Export, Tirana Export, Prishtina Tech Summit, etc.).
Each object must have:
- name (English)
- nameSq (Albanian)
- nameEn (English)
- nameDe (German)
- description (English, 2-3 sentences)
- descriptionSq (Albanian)
- descriptionEn (English)
- descriptionDe (German)
- location (city)
- country
- startDate (ISO within next 14 months)
- endDate (ISO)
- website (real URL)
- sectors (array)
- tags (array)`

async function callModel(system: string, prompt: string): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${body}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Model returned no text: ' + JSON.stringify(data).slice(0, 400))

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray((parsed as any).items)) return (parsed as any).items
    throw new Error('Parsed JSON is not an array')
  } catch {
    return extractJsonArray(text)
  }
}

async function scrapeGrants() {
  const startTime = Date.now()
  try {
    const items = await callModel(GRANTS_SYSTEM, GRANTS_PROMPT)
    let created = 0
    for (const g of items) {
      try {
        await prisma.grant.create({
          data: {
            title: g.titleEn || g.title,
            titleSq: g.titleSq ?? null,
            description: g.descriptionEn || g.description,
            descriptionSq: g.descriptionSq ?? null,
            provider: g.provider || 'Unknown',
            amount: g.amount ?? null,
            currency: g.currency || 'EUR',
            deadline: g.deadline ? new Date(g.deadline) : null,
            eligibility: g.eligibility ?? null,
            url: g.url ?? null,
            country: g.country ?? 'Kosovo',
            sectors: Array.isArray(g.sectors) ? g.sectors : [],
            tags: Array.isArray(g.tags) ? g.tags : [],
          },
        })
        created++
      } catch (e) {
        console.warn('grant insert skipped:', e)
      }
    }
    await prisma.scraperLog.create({
      data: { type: 'GRANTS', status: 'SUCCESS', message: `Scraped ${created}/${items.length} grants`, itemsFound: created, duration: Date.now() - startTime },
    })
    return { success: true, count: created }
  } catch (error: any) {
    await prisma.scraperLog.create({
      data: { type: 'GRANTS', status: 'ERROR', message: String(error?.message || error), duration: Date.now() - startTime },
    })
    return { success: false, error: String(error?.message || error) }
  }
}

async function scrapeFairs() {
  const startTime = Date.now()
  try {
    const items = await callModel(FAIRS_SYSTEM, FAIRS_PROMPT)
    let created = 0
    for (const f of items) {
      try {
        await prisma.tradeFair.create({
          data: {
            name: f.nameEn || f.name,
            nameSq: f.nameSq ?? null,
            description: f.descriptionEn || f.description || null,
            descriptionSq: f.descriptionSq ?? null,
            location: f.location || 'Unknown',
            country: f.country || 'Unknown',
            startDate: new Date(f.startDate),
            endDate: new Date(f.endDate || f.startDate),
            website: f.website ?? null,
            sectors: Array.isArray(f.sectors) ? f.sectors : [],
            tags: Array.isArray(f.tags) ? f.tags : [],
          },
        })
        created++
      } catch (e) {
        console.warn('fair insert skipped:', e)
      }
    }
    await prisma.scraperLog.create({
      data: { type: 'FAIRS', status: 'SUCCESS', message: `Scraped ${created}/${items.length} fairs`, itemsFound: created, duration: Date.now() - startTime },
    })
    return { success: true, count: created }
  } catch (error: any) {
    await prisma.scraperLog.create({
      data: { type: 'FAIRS', status: 'ERROR', message: String(error?.message || error), duration: Date.now() - startTime },
    })
    return { success: false, error: String(error?.message || error) }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const authHeader = req.headers.get('x-scraper-secret')
  const isCron = !!process.env.SCRAPER_SECRET && authHeader === process.env.SCRAPER_SECRET
  const isAdmin = !!session && (session.user as any).role === 'ADMIN'
  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
  }

  const { type } = await req.json().catch(() => ({ type: 'all' }))

  if (type === 'grants') return NextResponse.json(await scrapeGrants())
  if (type === 'fairs')  return NextResponse.json(await scrapeFairs())
  if (type === 'all') {
    const [grants, fairs] = await Promise.all([scrapeGrants(), scrapeFairs()])
    return NextResponse.json({ grants, fairs })
  }
  return NextResponse.json({ error: 'Invalid type (use grants|fairs|all)' }, { status: 400 })
}

export async function GET() {
  const logs = await prisma.scraperLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  return NextResponse.json({ logs })
}
