import Anthropic from '@anthropic-ai/sdk'

// Truly perpetual programs (no specific deadline ever). Match by substring, case-insensitive.
// Annual cycles do NOT belong here — they're 'has_deadline' year by year.
const KNOWN_ONGOING_KEYWORDS = [
  'Fondi Kosovar për Garanci Kreditore',
  'FKGK',
]

export type Audience = 'business' | 'civil_society' | 'mixed' | 'unknown'

export interface ClassifyResult {
  source: 'heuristic' | 'ai' | 'fallback'
  deadline: Date | null
  isOngoing: boolean
  audience: Audience
  confidence: 'high' | 'medium' | 'low'
  evidence: string
}

const client = new Anthropic()

const SYSTEM_PROMPT = `You classify Kosovo grant / funding announcements (Albanian, English, or mixed).

Given a page, you must answer TWO independent questions:

(A) AUDIENCE — who is this call for?
- "business": for SMEs, micro/small businesses, manufacturers, exporters, startups, entrepreneurs
- "civil_society": for NGOs, OJF, OJQ, "organizata të shoqërisë civile", non-profit associations
- "mixed": explicitly accepts both businesses AND NGOs
- "unknown": page does not say clearly

(B) DEADLINE / ONGOING — when does it close?
- A specific submission deadline date → return as deadline "YYYY-MM-DD"
- The program is TRULY PERPETUAL (always open, no annual cycle, no end date ever) → isOngoing=true. Examples: credit guarantee funds (FKGK), rolling-basis loan programs.
- An annual or yearly recurring cycle is NOT ongoing — each year is a separate call. If you see "Thirrje 2024", "Thirrje 2025", "Thirrje 2026" listed, these are CYCLES, not ongoing. If the current year's deadline is shown, return it. Otherwise no_deadline.
- If the page is archive/index/navigation only and the actual call is not visible → no_deadline, confidence "low"

Respond STRICT JSON only:
{ "audience": "business" | "civil_society" | "mixed" | "unknown",
  "deadline": "YYYY-MM-DD" or null,
  "isOngoing": true or false,
  "confidence": "high" | "medium" | "low",
  "evidence": "<≤20 word reason>" }

Rules:
- Never guess a deadline; never set isOngoing for annual cycles.
- Only set audience="civil_society" if the page explicitly addresses NGOs/OJF/OJQ as the primary or sole audience. When in doubt, use "unknown" or "mixed".
- "Thirrje për organizatat e shoqërisë civile" → civil_society.
- "Thirrje për biznese mikro/të vogla/të mesme" → business.`

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
  description?: string | null
  descriptionSq?: string | null
}): Promise<ClassifyResult> {
  // 1) Heuristic for known truly-perpetual programs
  const haystack = `${grant.title} ${grant.titleSq ?? ''} ${grant.provider}`.toLowerCase()
  for (const kw of KNOWN_ONGOING_KEYWORDS) {
    if (haystack.includes(kw.toLowerCase())) {
      return {
        source: 'heuristic',
        deadline: null,
        isOngoing: true,
        audience: 'business',
        confidence: 'high',
        evidence: `Provider/title matches known ongoing program: ${kw}`,
      }
    }
  }

  // 2) AI classification — uses URL if available, else falls back to title/description text
  let pageText = ''
  if (grant.url) {
    try {
      pageText = await fetchAndClean(grant.url)
    } catch (err) {
      pageText = ''
    }
  }
  // Always include title + description as backup context
  const context = `Title: ${grant.titleSq || grant.title}
Provider: ${grant.provider}
URL: ${grant.url ?? '(none)'}
Description: ${grant.descriptionSq || grant.description || '(none)'}

${pageText ? `Page content:\n${pageText}` : '(could not fetch page content)'}`

  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: context }],
    })
    const block = resp.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('no text response')
    const m = block.text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('no JSON found')
    const parsed = JSON.parse(m[0]) as {
      audience?: Audience
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
      audience: parsed.audience ?? 'unknown',
      confidence: parsed.confidence ?? 'medium',
      evidence: parsed.evidence ?? '',
    }
  } catch (err: any) {
    return {
      source: 'fallback',
      deadline: null,
      isOngoing: false,
      audience: 'unknown',
      confidence: 'low',
      evidence: `Classifier failed: ${err?.message ?? err}`,
    }
  }
}

/**
 * Convert classification result into DB field updates.
 *
 * Conservative policy (per user preference):
 *  - NEVER set isActive=false based on classifier alone — keep grants visible in archive.
 *  - Audience determines public/hidden visibility.
 *  - Bucketing (Aktive vs Të skaduara) is handled by the page based on deadline + isOngoing.
 */
export function classifyResultToUpdate(result: ClassifyResult): Record<string, any> {
  const upd: Record<string, any> = {
    classifiedAt: new Date(),
    classificationSource: result.source,
    audience: result.audience,
  }
  if (result.deadline) {
    upd.deadline = result.deadline
    upd.isOngoing = false
    // Keep isActive based on whether deadline is still in future
    upd.isActive = result.deadline.getTime() > Date.now()
  } else if (result.isOngoing) {
    upd.isOngoing = true
    upd.isActive = true
  } else {
    // No deadline confirmed — leave isActive untouched; bucket UI shows it under "Të skaduara" with "Afati i paqartë"
    upd.isOngoing = false
  }
  return upd
}
