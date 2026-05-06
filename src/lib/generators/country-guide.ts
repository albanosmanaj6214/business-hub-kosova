import Anthropic from '@anthropic-ai/sdk'
import type { PrismaClient } from '@prisma/client'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 32000
const MAX_SEARCHES = 6

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'placeholder') {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    // Web-search calls can take several minutes (multiple searches + 16k output).
    // Bump well above the SDK's default request timeout.
    _client = new Anthropic({ timeout: 15 * 60 * 1000, maxRetries: 1 })
  }
  return _client
}

// ---------- Schema (mirrors Prisma JSONB shape) ----------

export interface BiText { sq: string; en: string }
export interface SourceRef { title?: string; url: string }

export interface RequiredDoc {
  name: BiText
  description: BiText
  mandatory: boolean
  issuedBy?: string
  sourceUrl: string
}

export interface Certification {
  name: string
  appliesTo: string[]
  description: BiText
  mandatory: boolean
  authority?: string
  sourceUrl: string
}

export interface LabelingRule {
  rule: BiText
  mandatory: boolean
  sourceUrl: string
}

export interface SectorRuleGroup {
  sector: string
  rules: LabelingRule[]
}

export interface TradeAgreement {
  name: string
  benefit: BiText
  sourceUrl: string
}

export interface CountryContact {
  role: string
  name?: string
  address?: string
  phone?: string
  email?: string
  url?: string
}

export interface CountryGuide {
  countryCode: string
  country: string
  flag: string
  marketOverview: BiText
  customs: {
    vat: string
    importDuties: BiText
    authority: { name: string; url: string }
    sourceUrl: string
  }
  requiredDocs: RequiredDoc[]
  certifications: Certification[]
  labeling: {
    languages: string[]
    rules: LabelingRule[]
  }
  sectorRules: SectorRuleGroup[]
  tradeAgreements: TradeAgreement[]
  contacts: CountryContact[]
  citations: SourceRef[]
}

// ---------- Generator ----------

const SYSTEM_PROMPT = `You are a Kosovo trade-policy researcher producing structured export guides
for Kosovo-based SMEs. You MUST use the web_search tool to ground every fact
in authoritative primary sources. Prefer (in order):

  1. Official EU bodies: ec.europa.eu, taxation-customs.ec.europa.eu, single-market-economy.ec.europa.eu, eur-lex.europa.eu
  2. National customs / regulatory agencies of the destination country (.gov / .gouv / .gov.uk / national domains)
  3. The Kosovo customs authority: dogana.rks-gov.net
  4. Multilateral trade portals: Access2Markets (madb / myeu), WTO ePing
  5. Major embassies and chambers of commerce

Hard rules:
- Every concrete claim (rate, requirement, authority, document name) MUST be backed by a sourceUrl that you actually visited.
- Do NOT invent figures, deadlines, document names, or authorities. If unsure, omit the item rather than guess.
- All "*Sq" fields are Albanian (formal, business register). "*En" fields are English.
- "mandatory" = true means goods cannot legally be placed on the market without this. Use false for "recommended" / "good practice".
- Trade agreements: cite the actual SAA/CEFTA/PEM/etc. text or the EU summary page, not news articles.
- Include a final "citations" array listing every URL you actually used.

Output a single STRICT JSON object matching the schema in the user message.
No markdown fences, no commentary, no preamble. Start with '{' end with '}'.`

export interface GenerateCountryGuideOptions {
  countryCode: string
  countryNameSq: string
  countryNameEn: string
  flag: string
  /** Override max web searches (cost knob). Default 6. */
  maxSearches?: number
}

export interface GenerateCountryGuideResult {
  guide: CountryGuide
  usage: { input_tokens: number; output_tokens: number; web_search_requests?: number }
  rawJson: string
}

const SCHEMA_HINT = `{
  "countryCode": "<ISO-2>",
  "country": "<destination country name in Albanian>",
  "flag": "<emoji>",
  "marketOverview": { "sq": "<2-3 paragrafë në shqip>", "en": "<2-3 paragraphs in English>" },
  "customs": {
    "vat": "<standard VAT rate, e.g. '19% (standard) / 7% (reduced)'>",
    "importDuties": { "sq": "...", "en": "..." },
    "authority": { "name": "<official customs authority>", "url": "<authority website>" },
    "sourceUrl": "<best single citation for VAT/duties>"
  },
  "requiredDocs": [
    {
      "name": { "sq": "Faturë komerciale", "en": "Commercial invoice" },
      "description": { "sq": "...", "en": "..." },
      "mandatory": true,
      "issuedBy": "Eksportuesi",
      "sourceUrl": "..."
    }
    // include 6-12 items: invoice, packing list, certificate of origin (EUR.1 / FORM A / non-preferential), bill of lading / CMR, customs declaration, import licence (if any), phyto/health certificate (if applicable), insurance certificate, etc.
  ],
  "certifications": [
    {
      "name": "CE Marking",
      "appliesTo": ["elektrike", "lodra", "makineri"],
      "description": { "sq": "...", "en": "..." },
      "mandatory": true,
      "authority": "EU notified body",
      "sourceUrl": "..."
    }
    // 4-10 items relevant to the country: CE/UKCA/FDA/Halal/ISO/BIO/GOST/etc.
  ],
  "labeling": {
    "languages": ["<required languages on label>"],
    "rules": [
      { "rule": { "sq": "...", "en": "..." }, "mandatory": true, "sourceUrl": "..." }
      // 4-8 rules: language, allergen marking, country of origin, net quantity, font size minimums, expiry/durability, nutrition info, etc.
    ]
  },
  "sectorRules": [
    {
      "sector": "Ushqim dhe pije",
      "rules": [
        { "rule": { "sq": "...", "en": "..." }, "mandatory": true, "sourceUrl": "..." }
      ]
    }
    // include 3-6 sector groups Kosovo SMEs commonly export: Ushqim/pije, Tekstil-konfeksion, Druri-mobilje, Metale e makineri, TIK e shërbime, Kozmetikë
  ],
  "tradeAgreements": [
    {
      "name": "EU-Kosovo Stabilisation and Association Agreement",
      "benefit": { "sq": "...", "en": "..." },
      "sourceUrl": "..."
    }
    // include all that grant Kosovo preferential access to this destination
  ],
  "contacts": [
    {
      "role": "Ambasada e Kosovës në <vend>",
      "name": "...",
      "address": "...",
      "phone": "...",
      "email": "...",
      "url": "..."
    }
    // 2-4 contacts: KS embassy/consulate in destination, destination embassy in Pristina if any, KS Chamber of Commerce equivalent, customs help desk
  ],
  "citations": [{ "title": "...", "url": "..." }]
}`

function buildUserPrompt(opts: GenerateCountryGuideOptions): string {
  return `Produce an export guide for Kosovo-based SMEs exporting goods to ${opts.countryNameEn} (${opts.countryCode}).

Use web_search to verify every concrete claim against primary sources. Prioritise EU portals for EU/EEA/Switzerland destinations, the destination country's official customs authority, and the Kosovo customs authority (dogana.rks-gov.net) where Kosovo-side rules matter.

Cover everything a Kosovo exporter must know to legally place goods on the ${opts.countryNameEn} market: VAT, customs duties, mandatory documents per shipment, conformity certifications (CE / UKCA / FDA / Halal / ISO / GOST etc. as applicable), labelling and language requirements, sector-specific rules for the sectors Kosovo SMEs typically export (food & drink, textiles, wood/furniture, metals/machinery, ICT services, cosmetics), all trade agreements granting Kosovo preferential access, and key institutional contacts.

Include the country's flag emoji as "flag". Use ISO-2 code "${opts.countryCode}" as countryCode. Use "${opts.countryNameSq}" as country (Albanian name).

Return STRICT JSON exactly matching this schema (no markdown fences, no commentary):

${SCHEMA_HINT}`
}

export async function generateCountryGuide(opts: GenerateCountryGuideOptions): Promise<GenerateCountryGuideResult> {
  const userPrompt = buildUserPrompt(opts)
  // Stream the response so we don't hit transport timeouts on long
  // web-search-heavy generations. Final message is reconstructed via the
  // SDK's stream helpers.
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: 'web_search_20250305' as any,
        name: 'web_search',
        max_uses: opts.maxSearches ?? MAX_SEARCHES,
      } as any,
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })
  const resp = await stream.finalMessage()

  const textBlocks = resp.content.filter((b) => b.type === 'text') as Array<{ type: 'text'; text: string }>
  const fullText = textBlocks.map((b) => b.text).join('\n').trim()
  if (!fullText) throw new Error('Claude returned no text content')
  if (resp.stop_reason === 'max_tokens') {
    throw new Error(`Response truncated at max_tokens (${MAX_TOKENS}). Last 200 chars: ...${fullText.slice(-200)}`)
  }

  // Strip optional code fences and trailing commentary; isolate the JSON object.
  let raw = fullText.replace(/^```(?:json)?\s*/i, '').trim()
  // Find the first '{' and the matching closing '}' by brace counting (the
  // model sometimes appends a notes section after the JSON).
  const start = raw.indexOf('{')
  if (start < 0) throw new Error(`No JSON object in response: ${raw.slice(0, 200)}`)
  let depth = 0
  let end = -1
  let inString = false
  let escape = false
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = false }
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end < 0) throw new Error(`Unbalanced braces in JSON response`)
  const jsonText = raw.slice(start, end + 1)

  let guide: CountryGuide
  try {
    guide = JSON.parse(jsonText) as CountryGuide
  } catch (err) {
    throw new Error(`JSON.parse failed: ${(err as Error).message}\nFirst 500 chars:\n${jsonText.slice(0, 500)}`)
  }

  return {
    guide,
    usage: {
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      web_search_requests: (resp.usage as any).server_tool_use?.web_search_requests,
    },
    rawJson: jsonText,
  }
}

/**
 * Persists a generated guide into the ExportGuide table. Uses countryCode
 * as the upsert key. Sets generatedBy='claude' and lastResearchedAt=now.
 * The legacy markdown `content` field gets a flat SQ rendering so the
 * existing /dashboard/guides UI keeps working until the new view ships.
 */
export async function persistCountryGuide(prisma: PrismaClient, guide: CountryGuide): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.exportGuide.findUnique({ where: { countryCode: guide.countryCode } })

  const flatSq = renderFlatSq(guide)
  const flatEn = renderFlatEn(guide)
  const data = {
    title: `Udhëzues eksporti për ${guide.country}`,
    titleSq: `Udhëzues eksporti për ${guide.country}`,
    titleEn: `Export guide for ${guide.country}`,
    content: flatSq,
    contentSq: flatSq,
    contentEn: flatEn,
    country: guide.country,
    countryCode: guide.countryCode,
    flag: guide.flag,
    sectors: (guide.sectorRules ?? []).map((s) => s.sector),
    tags: ['claude-research', 'auto-generated'],
    isPublished: false, // requires admin review before going live

    marketOverview: guide.marketOverview as any,
    customs: guide.customs as any,
    requiredDocs: guide.requiredDocs as any,
    certifications: guide.certifications as any,
    labeling: guide.labeling as any,
    sectorRules: guide.sectorRules as any,
    tradeAgreements: guide.tradeAgreements as any,
    contacts: guide.contacts as any,
    citations: guide.citations as any,

    schemaVersion: 1,
    generatedBy: 'claude',
    lastResearchedAt: new Date(),
  }

  if (existing) {
    await prisma.exportGuide.update({ where: { id: existing.id }, data })
    return { id: existing.id, created: false }
  }
  const created = await prisma.exportGuide.create({ data })
  return { id: created.id, created: true }
}

function renderFlatSq(g: CountryGuide): string {
  const lines: string[] = []
  lines.push(`# Udhëzues eksporti — ${g.country} ${g.flag}\n`)
  lines.push(`## Përmbledhje e tregut\n${g.marketOverview.sq}\n`)
  lines.push(`## Dogana dhe TVSH\n- TVSH: ${g.customs.vat}\n- Autoriteti: ${g.customs.authority.name} — ${g.customs.authority.url}\n- ${g.customs.importDuties.sq}\n`)
  lines.push(`## Dokumentet e detyrueshme`)
  for (const d of g.requiredDocs) {
    lines.push(`- ${d.mandatory ? '✅' : '⚪'} **${d.name.sq}** — ${d.description.sq}\n  Burimi: ${d.sourceUrl}`)
  }
  lines.push(`\n## Çertifikimet`)
  for (const c of g.certifications) {
    lines.push(`- ${c.mandatory ? '✅' : '⚪'} **${c.name}** (${c.appliesTo.join(', ')}) — ${c.description.sq}\n  Burimi: ${c.sourceUrl}`)
  }
  lines.push(`\n## Marrëveshjet tregtare`)
  for (const t of g.tradeAgreements) {
    lines.push(`- **${t.name}**: ${t.benefit.sq}\n  Burimi: ${t.sourceUrl}`)
  }
  return lines.join('\n')
}
function renderFlatEn(g: CountryGuide): string {
  const lines: string[] = []
  lines.push(`# Export guide — ${g.country} ${g.flag}\n`)
  lines.push(`## Market overview\n${g.marketOverview.en}\n`)
  lines.push(`## Customs and VAT\n- VAT: ${g.customs.vat}\n- Authority: ${g.customs.authority.name} — ${g.customs.authority.url}\n- ${g.customs.importDuties.en}\n`)
  lines.push(`## Required documents`)
  for (const d of g.requiredDocs) {
    lines.push(`- ${d.mandatory ? '[M]' : '[O]'} **${d.name.en}** — ${d.description.en}\n  Source: ${d.sourceUrl}`)
  }
  lines.push(`\n## Certifications`)
  for (const c of g.certifications) {
    lines.push(`- ${c.mandatory ? '[M]' : '[O]'} **${c.name}** (${c.appliesTo.join(', ')}) — ${c.description.en}\n  Source: ${c.sourceUrl}`)
  }
  return lines.join('\n')
}

/** Quick shape check before committing to DB. */
export function validateCountryGuide(g: CountryGuide): string[] {
  const errors: string[] = []
  if (!g.countryCode || g.countryCode.length !== 2) errors.push('countryCode must be ISO-2')
  if (!g.country) errors.push('missing country')
  if (!g.flag) errors.push('missing flag')
  if (!g.marketOverview?.sq || !g.marketOverview?.en) errors.push('marketOverview missing sq/en')
  if (!g.customs?.authority?.url) errors.push('customs.authority.url missing')
  if (!Array.isArray(g.requiredDocs) || g.requiredDocs.length < 3) errors.push('requiredDocs must have at least 3 items')
  if (!Array.isArray(g.certifications)) errors.push('certifications must be an array')
  if (!Array.isArray(g.citations) || g.citations.length < 3) errors.push('citations must have at least 3 entries')
  // Every required doc / certification / sector rule should have a sourceUrl.
  ;(g.requiredDocs ?? []).forEach((d, i) => {
    if (!d.sourceUrl) errors.push(`requiredDocs[${i}] missing sourceUrl`)
  })
  ;(g.certifications ?? []).forEach((c, i) => {
    if (!c.sourceUrl) errors.push(`certifications[${i}] missing sourceUrl`)
  })
  return errors
}
