import 'server-only'
import { prisma } from '@/lib/prisma'
import { STATIC_PROVENANCE, DATA_SOURCE_CATALOG, type ProvenanceRow, type SourceKind } from './registry'

// Mbledh provenancën e gjithë platformës në një listë të vetme, të kërkueshme.
// Pjesa nga databaza llogaritet çdo herë (asnjë kopje që mund të vjetrohet);
// pjesa statike vjen nga registry.ts sepse ajo përmbajtje jeton në kod.

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null)
const domainOf = (u: string | null) =>
  (u || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase()

// Kompanitë private të certifikimit dhe testimit nuk mund të jenë burimi që thotë
// se një certifikim kërkohet — ato e shesin vetë shërbimin.
const PRIVATE_HOSTS = ['sgs.com', 'intertek.com', 'bureauveritas', 'tuv', 'dnv', 'wwbridge-cert.com',
  'brcglobalstandards.com', 'productregistrationuae.com', 'gistnet.com', 'fssc.com',
  'globalgap.org', 'nsf.org', 'ul.com', 'dekra', 'eurofins', 'controlunion', 'kiwa', 'qima.com']
// Guida tregtare të qeverive të treta: e sakta për ta, jo domosdo për një eksportues kosovar.
const THIRD_GOV_HOSTS = ['trade.gov', 'export.gov', 'fas.usda.gov', 'cbp.gov', 'privacyshield.gov',
  'fsis.usda.gov', 'ttb.gov']

function classifyUrl(url: string | null): SourceKind {
  const d = domainOf(url)
  if (!d) return 'PA_BURIM'
  if (PRIVATE_HOSTS.some((h) => d.includes(h))) return 'PRIVAT'
  if (THIRD_GOV_HOSTS.some((h) => d.includes(h))) return 'DYTESOR'
  if (d.endsWith('europa.eu') || d.includes('.europa.eu')) return 'PARESOR'
  if (d.includes('iso.org') || d.includes('codexalimentarius')) return 'AUTORITET'
  if (/\.gov(\.[a-z]{2})?$|\.gob\.[a-z]{2}$|\.go\.[a-z]{2}$|rks-gov\.net$/.test(d)) return 'AUTORITET'
  return 'DYTESOR'
}

export interface ProvenanceReport {
  rows: ProvenanceRow[]
  counts: Record<SourceKind, number>
  modules: string[]
  generatedAt: string
}

export async function collectProvenance(): Promise<ProvenanceReport> {
  const rows: ProvenanceRow[] = [...STATIC_PROVENANCE]

  // ── Dataset-et zyrtare ─────────────────────────────────────────────────────
  for (const d of DATA_SOURCE_CATALOG) {
    rows.push({
      module: 'Dataset-et zyrtare',
      route: '—',
      item: `${d.name} · ${d.dataset}`,
      source: d.what,
      url: d.url,
      checkedAt: null,
      kind: 'STATISTIKE',
    })
  }

  // ── Statistikat e tregjeve: një rresht për dataset, me datën reale ────────
  const stats = await prisma.marketStat.groupBy({
    by: ['sourceName', 'sourceDataset', 'kind'],
    _count: { _all: true },
    _max: { retrievedAt: true, year: true },
  }).catch(() => [])
  for (const s of stats) {
    const one = await prisma.marketStat.findFirst({
      where: { sourceDataset: s.sourceDataset, kind: s.kind },
      select: { sourceUrl: true },
    })
    rows.push({
      module: 'Atlasi i tregjeve',
      route: '/dashboard/atlasi',
      item: `${s.kind} — ${s._count._all} vlera (viti më i ri ${s._max.year ?? '—'})`,
      source: `${s.sourceName} · ${s.sourceDataset}`,
      url: one?.sourceUrl ?? null,
      checkedAt: iso(s._max.retrievedAt),
      kind: 'STATISTIKE',
    })
  }

  // ── Kërkesat e tregut: një rresht për akt ligjor ──────────────────────────
  const reqs = await prisma.marketRequirement.findMany({
    where: { status: 'VERIFIED' },
    select: { titleSq: true, legalActName: true, legalActUrl: true, verifiedAt: true,
              requirementType: true, marketGroup: true, productGroup: true },
    orderBy: [{ requirementType: 'asc' }, { titleSq: 'asc' }],
  }).catch(() => [])
  for (const r of reqs) {
    rows.push({
      module: 'Kërkesat e tregut (greenlight)',
      route: '/dashboard/atlasi',
      item: `[${r.requirementType}] ${r.marketGroup} · ${r.productGroup} — ${r.titleSq}`,
      source: r.legalActName ?? '—',
      url: r.legalActUrl,
      checkedAt: iso(r.verifiedAt),
      kind: r.requirementType === 'BUYER_EXPECTED'
        ? 'DYTESOR'
        : (r.legalActUrl ? classifyUrl(r.legalActUrl) : 'PA_BURIM'),
      note: r.requirementType === 'BUYER_EXPECTED'
        ? 'Pritshmëri e blerësit, jo detyrim ligjor — pa akt me qëllim.'
        : (!r.legalActUrl ? 'Kërkesë detyruese pa akt të cituar.' : undefined),
    })
  }

  // ── Certifikimet brenda udhëzuesve të vendeve ─────────────────────────────
  const guides = await prisma.exportGuide.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { country: true, countryCode: true, certifications: true, customs: true },
    orderBy: { country: 'asc' },
  }).catch(() => [])
  for (const g of guides) {
    const certs = Array.isArray(g.certifications) ? (g.certifications as unknown[]) : []
    for (const c of certs) {
      if (!c || typeof c !== 'object') continue
      const o = c as { name?: string; sourceUrl?: string; authority?: string }
      const url = o.sourceUrl ?? null
      const kind = classifyUrl(url)
      rows.push({
        module: 'Udhëzuesit e eksportit — certifikime',
        route: `/dashboard/guides`,
        item: `${g.country} — ${o.name ?? 'pa emër'}`,
        source: o.authority ?? domainOf(url) ?? '—',
        url,
        checkedAt: null,
        kind,
        note: kind === 'DYTESOR'
          ? 'Burim dytësor. Kërkesat e qasjes në treg ndryshojnë sipas vendit të origjinës — duhet akti i tregut.'
          : kind === 'PRIVAT' ? 'Kompani private që e shet vetë certifikimin.' : undefined,
      })
    }
    const cu = g.customs as { authority?: { name?: string; url?: string } } | null
    if (cu?.authority?.url) {
      rows.push({
        module: 'Udhëzuesit e eksportit — dogana',
        route: '/dashboard/guides',
        item: `${g.country} — autoriteti doganor`,
        source: cu.authority.name ?? '—',
        url: cu.authority.url,
        checkedAt: null,
        kind: classifyUrl(cu.authority.url),
      })
    }
  }

  // ── Burimet e scraper-it ──────────────────────────────────────────────────
  const sources = await prisma.source.findMany({
    select: { code: true, name: true, baseUrl: true, isActive: true,
              health: { select: { lastSuccessAt: true } } },
    orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
  }).catch(() => [])
  for (const s of sources) {
    rows.push({
      module: s.isActive ? 'Burimet e monitoruara' : 'Burimet në proces shtimi',
      route: '/admin/sources',
      item: `${s.code} — ${s.name}`,
      source: s.isActive ? 'Scraper aktiv' : 'I planifikuar, nuk monitorohet',
      url: s.baseUrl,
      checkedAt: iso(s.health?.lastSuccessAt),
      kind: 'AUTORITET',
    })
  }

  // ── Grantet publike ───────────────────────────────────────────────────────
  const grants = await prisma.grant.findMany({
    where: { deletedAt: null, isActive: true, NOT: { tags: { has: 'legacy_synthetic' } } },
    select: { title: true, titleSq: true, provider: true, url: true, scrapedAt: true },
    orderBy: { scrapedAt: 'desc' },
  }).catch(() => [])
  for (const g of grants) {
    rows.push({
      module: 'Financime — grante',
      route: '/dashboard/burime-financimi',
      item: (g.titleSq ?? g.title).slice(0, 110),
      source: g.provider,
      url: g.url,
      checkedAt: iso(g.scrapedAt),
      kind: g.url ? 'AUTORITET' : 'PA_BURIM',
    })
  }

  const counts = rows.reduce((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1
    return acc
  }, {} as Record<SourceKind, number>)

  return {
    rows,
    counts,
    modules: Array.from(new Set(rows.map((r) => r.module))).sort((a, b) => a.localeCompare(b, 'sq')),
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  }
}
