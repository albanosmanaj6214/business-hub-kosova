import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import type { OpportunityInput } from './types'

const BASE_URL = 'https://www.oek-kcc.org'
const LISTING_PATHS = ['/aktivitetet/', '/trajnime/']
const USER_AGENT = 'BusinessHubKosova/1.0 (+https://kosovabusinesses.aiaohub.com)'
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

type EventTypeOut = 'FAIR' | 'TRAINING' | 'WEBINAR' | 'MATCHMAKING' | 'WORKSHOP' | 'CONFERENCE' | 'SKIP'

interface ClassifyResult {
  is_event: boolean
  event_type: EventTypeOut
  title_sq?: string
  start_date?: string | null
  end_date?: string | null
  is_rolling_enrollment: boolean
  location?: string | null
  organizer?: string | null
  registration_url?: string | null
  description_sq?: string | null
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

const SYSTEM_PROMPT = `You classify Kosovo business-organization posts (Albanian) to decide if they are real, upcoming events that exporters/SMEs should attend.

You will receive: a title and the body of one article from an organization website (typically OEK — Oda Ekonomike e Kosovës).

You must decide:
1. Is this an event/training/workshop/webinar/matchmaking/conference, OR just a news/press release/announcement of past activity?
2. If yes, what type, when, where, and how to register?

Event types (use exactly one of these enum values):
- FAIR — trade fair, exhibition, market stand call (organizer takes you to a fair)
- TRAINING — multi-day skills training, certification course, professional qualification
- WEBINAR — online seminar
- MATCHMAKING — B2B meetings, business matching event, "buyer meeting"
- WORKSHOP — short hands-on session, single-day workshop
- CONFERENCE — multi-speaker industry conference, forum, summit

NEWS / PRESS RELEASES / PAST RECAPS are NOT events. Reject:
- "X reagoi për vendimin gjyqësor" — reaction to a court ruling
- "X nënshkroi memorandum" — signing announcement
- "Forumi i Brezovicës 2025 konfirmohet si destinacion" — past event recap or generic news
- "Themelimi i Forumit" — establishment news
- "Rikthimi i shpejtë i [kompanisë]" — company news

Only include if it CLEARLY describes a future event with attendees who can register or attend.

Rolling enrollment: trainings like "VLERËSUES I BIZNESIT" that start "me formimin e grupit" (with group formation) — these are open-enrollment programs with no fixed start date. Set is_rolling_enrollment=true. start_date=today, end_date=today+365d.

Today is ${new Date().toISOString().slice(0, 10)}. Events whose end_date is in the past must be rejected (is_event=false).

Respond STRICT JSON only, no commentary:
{
  "is_event": true | false,
  "event_type": "FAIR" | "TRAINING" | "WEBINAR" | "MATCHMAKING" | "WORKSHOP" | "CONFERENCE" | "SKIP",
  "title_sq": "<clean Albanian title>",
  "start_date": "YYYY-MM-DD" or null,
  "end_date": "YYYY-MM-DD" or null,
  "is_rolling_enrollment": true | false,
  "location": "<venue + city>" or null,
  "organizer": "OEK" or "<organizer name>" or null,
  "registration_url": "<full URL or email>" or null,
  "description_sq": "<1-2 sentence Albanian summary>",
  "confidence": "high" | "medium" | "low",
  "reason": "<≤20 word explanation>"
}`

interface ArticleStub {
  title: string
  href: string
  excerpt: string
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'user-agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectArticles(html: string): ArticleStub[] {
  const $ = cheerio.load(html)
  const out: ArticleStub[] = []
  $('article').each((_, el) => {
    const titleEl = $(el).find('h2, h3').first()
    const linkEl = titleEl.find('a').first().length > 0
      ? titleEl.find('a').first()
      : $(el).find('a[href*="oek-kcc.org"]').first()
    const title = titleEl.text().trim().replace(/\s+/g, ' ')
    const href = linkEl.attr('href') || ''
    if (!title || !href) return
    if (!href.startsWith('http')) return
    if (href.includes('/feed') || href.includes('/category') || href.includes('/tag')) return
    const excerpt = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 400)
    out.push({ title, href, excerpt })
  })
  // Dedupe by href
  const seen = new Set<string>()
  return out.filter((a) => {
    if (seen.has(a.href)) return false
    seen.add(a.href)
    return true
  })
}

async function classifyArticle(client: Anthropic, stub: ArticleStub): Promise<ClassifyResult | null> {
  let body = ''
  try {
    const detailHtml = await fetchHtml(stub.href)
    const $ = cheerio.load(detailHtml)
    const article = $('article').first()
    const text = article.length ? article.text() : $('main').text() || $.text()
    body = text.replace(/\s+/g, ' ').trim().slice(0, 8000)
  } catch (err) {
    body = stub.excerpt
  }

  const userMessage = `URL: ${stub.href}
Title: ${stub.title}

Body:
${body}`

  try {
    const resp = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 600,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = resp.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') return null
    const m = block.text.match(/\{[\s\S]*\}/)
    if (!m) return null
    const parsed = JSON.parse(m[0]) as ClassifyResult
    return parsed
  } catch (err) {
    console.error('[oek] Haiku classify failed for', stub.href, err)
    return null
  }
}

export async function scrapeOek(): Promise<OpportunityInput[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[oek] ANTHROPIC_API_KEY missing, skipping')
    return []
  }
  const client = new Anthropic()

  const allStubs: ArticleStub[] = []
  for (const path of LISTING_PATHS) {
    try {
      const html = await fetchHtml(BASE_URL + path)
      const stubs = collectArticles(html)
      allStubs.push(...stubs)
    } catch (err) {
      console.error('[oek] listing fetch failed', path, err)
    }
  }

  if (allStubs.length === 0) return []

  const items: OpportunityInput[] = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const oneYear = new Date(today.getTime() + 365 * 86400 * 1000)

  for (const stub of allStubs) {
    const result = await classifyArticle(client, stub)
    if (!result) continue
    if (!result.is_event) continue
    if (result.event_type === 'SKIP') continue
    if (result.confidence === 'low') continue

    let startDate: Date
    let endDate: Date
    const tags: string[] = []

    if (result.is_rolling_enrollment) {
      startDate = today
      endDate = oneYear
      tags.push('rolling-enrollment')
    } else {
      if (!result.start_date) continue
      startDate = new Date(result.start_date)
      if (isNaN(startDate.getTime())) continue
      endDate = result.end_date ? new Date(result.end_date) : startDate
      if (isNaN(endDate.getTime())) endDate = startDate
      if (endDate < today) continue // expired — reject
    }

    const externalId = createHash('sha1').update(`OEK:${stub.href}`).digest('hex')
    const description = result.description_sq || stub.title

    items.push({
      externalId,
      type: 'FAIR',
      title: result.title_sq || stub.title,
      description,
      sourceUrl: stub.href,
      legacy: {
        provider: 'OEK',
        titleSq: result.title_sq ?? stub.title,
        descriptionSq: description,
        location: result.location ?? 'Prishtinë',
        country: 'Kosovo',
        startDate,
        endDate,
        website: stub.href,
        eventType: result.event_type as Exclude<EventTypeOut, 'SKIP'>,
        organizer: result.organizer ?? 'OEK',
        registrationUrl: result.registration_url ?? null,
        sectors: [],
        tags,
      },
    })
  }

  return items
}
