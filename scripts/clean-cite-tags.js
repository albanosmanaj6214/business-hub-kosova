const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// Strip <cite index="...">INNER</cite> → INNER. Also handle:
//   <cite index="...">INNER (no closing) — keep INNER until next tag
//   Orphan </cite>, orphan <cite ...>
function stripCite(input) {
  if (typeof input !== 'string') return { value: input, changed: false }
  let s = input
  let changed = false
  // Closed tags first (greedy across newlines)
  const re1 = /<cite\s+[^>]*>([\s\S]*?)<\/cite>/g
  const after1 = s.replace(re1, (_m, inner) => { changed = true; return inner })
  // Orphan opening tags
  const after2 = after1.replace(/<cite\s+[^>]*>/g, () => { changed = true; return '' })
  // Orphan closing tags
  const after3 = after2.replace(/<\/cite>/g, () => { changed = true; return '' })
  return { value: after3, changed }
}

function stripCiteDeep(obj) {
  let anyChanged = false
  if (obj == null) return { value: obj, changed: false }
  if (typeof obj === 'string') {
    const r = stripCite(obj)
    return { value: r.value, changed: r.changed }
  }
  if (Array.isArray(obj)) {
    const next = obj.map((v) => {
      const r = stripCiteDeep(v)
      if (r.changed) anyChanged = true
      return r.value
    })
    return { value: next, changed: anyChanged }
  }
  if (typeof obj === 'object') {
    const next = {}
    for (const [k, v] of Object.entries(obj)) {
      const r = stripCiteDeep(v)
      if (r.changed) anyChanged = true
      next[k] = r.value
    }
    return { value: next, changed: anyChanged }
  }
  return { value: obj, changed: false }
}

const TEXT_FIELDS = ['title', 'titleSq', 'titleEn', 'titleDe', 'content', 'contentSq', 'contentEn', 'contentDe']
const JSONB_FIELDS = ['marketOverview', 'customs', 'tradeAgreements', 'requiredDocs', 'certifications', 'labeling', 'sectorRules', 'contacts']

;(async () => {
  const guides = await p.exportGuide.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: { country: 'asc' },
  })

  console.log(`Scanning ${guides.length} published guides…\n`)

  let touched = 0
  let totalFieldsCleaned = 0
  const perGuide = []

  for (const g of guides) {
    const updateData = {}
    let fieldsCleaned = 0

    for (const f of TEXT_FIELDS) {
      const r = stripCite(g[f])
      if (r.changed) {
        updateData[f] = r.value
        fieldsCleaned++
      }
    }
    for (const f of JSONB_FIELDS) {
      const r = stripCiteDeep(g[f])
      if (r.changed) {
        updateData[f] = r.value
        fieldsCleaned++
      }
    }

    if (fieldsCleaned > 0) {
      await p.exportGuide.update({ where: { id: g.id }, data: updateData })
      touched++
      totalFieldsCleaned += fieldsCleaned
      perGuide.push({ country: g.country, fieldsCleaned })
    }
  }

  console.log(`Guides touched: ${touched} / ${guides.length}`)
  console.log(`Total field-cleanings: ${totalFieldsCleaned}\n`)
  console.log('Per-guide breakdown:')
  for (const r of perGuide) {
    console.log(`  ${r.country.padEnd(35)} ${r.fieldsCleaned} field(s)`)
  }

  await p.$disconnect()
})()
