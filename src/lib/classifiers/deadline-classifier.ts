import Anthropic from '@anthropic-ai/sdk'

// Providers / titles known to run continuously (no deadline). Match is case-insensitive substring.
const KNOWN_ONGOING_KEYWORDS = [
  'Fondi Kosovar për Garanci Kreditore',
  'FKGK',
]

export interface ClassifyResult {
  source: 'heuristic' | 'ai' | 'fallback'
  deadline: Date | null
  isOngoing: boolean
  confidence: 'high' | 'medium' | 'low'
  evidence: string
}

const client = new Anthropic()

const SYSTEM_PROMPT = `You classify Kosovo government / EU funding announcements (in Albanian, English, or mixed).

Given the title, provider, and page content, decide:
1. Is there an explicit submission deadline mentioned? (a specific date in the future, or a phrase like "deri më DD.MM.YYYY", "deadline: ...", "afati: ...")
2. Or is the program explicitly described as continuously open / always accepting? (phrases like "i vazhdueshëm", "thirrje e hapur", "rolling basis", "always open", "open call")

Respond with STRICT JSON only, no prose:
{ "deadline": "YYYY-MM-DD" or null, "isOngoing": true or false, "confidence": "high" | "medium" | "low", "evidence": "<≤15 word quote or reason>" }

Rules:
- If a deadline date is clearly stated → return that date; isOngoing=false.
- If the page clearly says it is ongoing/perpetual → deadline=null, isOngoing=true.
- If the page is ambiguous or you cannot tell → deadline=null, isOngoing=false, confidence="low".
- Never guess a deadline. Past dates (already expired) should be returned as deadline anyway if that's what the page says, with confidence="medium".`

async function fetchAndClean(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; BusinessHubBot/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000)
}

export async function classifyGrantDeadline(grant: {
  title: string
  titleSq?: string | null
  provider: string
  url: string | null
}): Promise<ClassifyResult> {
  // 1) Heuristic: known-ongoing keywords
  const haystack = `${grant.title} ${grant.titleSq ?? ''} ${grant.provider}`.toLowerCase()
  for (const kw of KNOWN_ONGOING_KEYWORDS) {
    if (haystack.includes(kw.toLowerCase())) {
      return {
        source: 'heuristic',
        deadline: null,
        isOngoing: true,
        confidence: 'high',
        evidence: `Provider/title matches known ongoing program: ${kw}`,
      }
    }
  }

  // 2) AI fallback — needs a URL
  if (!grant.url) {
    return { source: 'fallback', deadline: null, isOngoing: false, confidence: 'low', evidence: 'No source URL to verify.' }
  }

  let pageText: string
  try {
    pageText = await fetchAndClean(grant.url)
    if (pageText.length < 200) throw new Error('page text too short')
  } catch (err: any) {
    return { source: 'fallback', deadline: null, isOngoing: false, confidence: 'low', evidence: `Fetch failed: ${err?.message ?? err}` }
  }

  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Title: ${grant.titleSq || grant.title}\nProvider: ${grant.provider}\nURL: ${grant.url}\n\nPage content:\n${pageText}`,
        },
      ],
    })
    const block = resp.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('no text response')
    const m = block.text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('no JSON in response')
    const parsed = JSON.parse(m[0]) as {
      deadline?: string | null
      isOngoing?: boolean
      confidence?: 'high' | 'medium' | 'low'
      evidence?: string
    }
    let deadline: Date | null = null
    if (parsed.deadline) {
      const d = new Date(parsed.deadline)
      if (!isNaN(d.getTime())) deadline = d
    }
    return {
      source: 'ai',
      deadline,
      isOngoing: !!parsed.isOngoing,
      confidence: parsed.confidence ?? 'medium',
      evidence: parsed.evidence ?? '',
    }
  } catch (err: any) {
    return { source: 'fallback', deadline: null, isOngoing: false, confidence: 'low', evidence: `AI failed: ${err?.message ?? err}` }
  }
}

/**
 * Apply a ClassifyResult to a grant. Returns the field updates to persist.
 * - Confident classification → update fields, set classifiedAt.
 * - Low-confidence fallback → still mark classifiedAt so we don't retry forever,
 *   AND set isActive=false to keep it out of public view until admin reviews.
 */
export function classifyResultToUpdate(result: ClassifyResult): Record<string, any> {
  const base: Record<string, any> = {
    classifiedAt: new Date(),
    classificationSource: result.source,
  }
  if (result.deadline) {
    base.deadline = result.deadline
    base.isOngoing = false
    base.isActive = result.deadline.getTime() > Date.now()
    return base
  }
  if (result.isOngoing) {
    base.isOngoing = true
    base.isActive = true
    return base
  }
  // fallback — neither deadline nor ongoing
  base.isOngoing = false
  base.isActive = false
  return base
}
