// Deterministic APPLICATION-CHANNEL extraction: official portal / application URL /
// email / physical submission address / designated institution / downloadable form.
// Preserves source text + location. Never claims the platform itself submits anything.
import type { TextSource, Provenance } from './types'
import { sourceChunks } from './chunks'

export type ChannelType = 'portal' | 'url' | 'email' | 'physical_address' | 'application_form_download' | 'institution'
export interface ApplicationChannel { type: ChannelType; value: string; matchedText: string; provenance: Provenance }

const URL_RE = /https?:\/\/[^\s|)<>"']+/gi
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PORTAL = /portal|e-?aplikim|e-?kosova|online\s+application|aplikimi\s+online|platform[eë]?\s+elektronike/i
const ADDRESS = /adres[aë]|rr(uga|\.)\s+|address|prishtin[eë].*(rr|nr)\.?|k[eë]ni\s+objekt/i
const INSTITUTION = /\bkiesa\b|\bmint\b|minist(ria|ry)\s+e?\s+(tregtis|industris|innovation)/i

export function findApplicationChannels(sources: TextSource[]): ApplicationChannel[] {
  const out: ApplicationChannel[] = []
  const seen = new Set<string>()
  const push = (type: ChannelType, value: string, matchedText: string, prov: Provenance) => {
    const k = `${type}:${value.toLowerCase()}`
    if (seen.has(k)) return
    seen.add(k); out.push({ type, value, matchedText: matchedText.slice(0, 200), provenance: prov })
  }
  for (const s of sources) {
    if (!s.extractable) continue
    // A downloadable application form attachment is itself a channel.
    if (s.role === 'application_form' && s.url) push('application_form_download', s.url, s.url, { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: `${s.kind}:file` })
    for (const c of sourceChunks(s)) {
      const prov: Provenance = { sourceKind: s.kind, attachmentId: s.attachmentId, url: s.url, role: s.role, locator: c.locator }
      for (const m of Array.from(c.text.matchAll(EMAIL_RE))) push('email', m[0], c.text, prov)
      for (const m of Array.from(c.text.matchAll(URL_RE))) push(PORTAL.test(c.text) ? 'portal' : 'url', m[0].replace(/[.,;]+$/, ''), c.text, prov)
      if (PORTAL.test(c.text) && !URL_RE.test(c.text)) push('portal', c.text.slice(0, 120), c.text, prov)
      if (ADDRESS.test(c.text)) push('physical_address', c.text.slice(0, 160), c.text, prov)
      if (INSTITUTION.test(c.text)) push('institution', (c.text.match(INSTITUTION)?.[0] ?? '').toUpperCase(), c.text, prov)
    }
  }
  return out
}
