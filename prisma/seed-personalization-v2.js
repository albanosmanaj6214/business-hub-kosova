// prisma/seed-personalization-v2.js
//
// One-off cleanup script for personalization v2 semantics.
//
// Rules:
//   * cross-cutting tag = universal opt-in (shown to every user with sectors[]).
//   * non-empty targetSectors[] = shown only to users whose sectors[] intersect.
//   * empty targetSectors[] without cross-cutting = uncategorized, hidden in
//     personalized view (visible only via ?all=1).
//
// This script reads every active TradeFair + Grant, classifies it based on
// well-known fair names and sectors[] / tags heuristics, and writes back a
// canonical targetSectors[] / tags[] pair.
//
// Idempotent: re-running the script does not duplicate tags.

/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const CANONICAL = [
  'ushqim-dhe-pije',
  'tekstil-konfeksion',
  'druri-mobilje',
  'metale-makineri',
  'kozmetike',
  'tik',
  'ndertim-materiale',
]

// ----------------------------------------------------------------------------
// Trade fair name -> targetSectors mapping.
// Keys are case-insensitive substrings checked against TradeFair.name.
// Order matters only when two patterns could match: first hit wins.
// ----------------------------------------------------------------------------
const FAIR_RULES = [
  // Food & beverage
  { match: /\banuga\b/i,            targets: ['ushqim-dhe-pije'] },
  { match: /\bsial\b/i,              targets: ['ushqim-dhe-pije'] },
  { match: /cibus\s*tec/i,           targets: ['ushqim-dhe-pije', 'metale-makineri'] },
  { match: /biofach/i,               targets: ['ushqim-dhe-pije'] },
  { match: /\bism\b/i,               targets: ['ushqim-dhe-pije'] },
  { match: /vinitaly/i,              targets: ['ushqim-dhe-pije'] },
  { match: /prowein/i,               targets: ['ushqim-dhe-pije'] },
  { match: /fruit\s*logistica/i,     targets: ['ushqim-dhe-pije'] },
  { match: /gulfood/i,               targets: ['ushqim-dhe-pije'] },
  { match: /food\s*expo/i,           targets: ['ushqim-dhe-pije'] },
  { match: /alimentaria/i,           targets: ['ushqim-dhe-pije'] },
  { match: /tuttofood/i,             targets: ['ushqim-dhe-pije'] },
  { match: /\bplma\b/i,              targets: ['ushqim-dhe-pije'] },
  { match: /nordic\s*organic/i,      targets: ['ushqim-dhe-pije'] },
  { match: /ife\s*london/i,          targets: ['ushqim-dhe-pije'] },
  { match: /indagra/i,               targets: ['ushqim-dhe-pije'] },
  { match: /igeho/i,                 targets: ['ushqim-dhe-pije'] },
  { match: /polagra/i,               targets: ['ushqim-dhe-pije'] },
  { match: /worldfood/i,             targets: ['ushqim-dhe-pije'] },
  { match: /alles\s*f(ü|u)r\s*den\s*gast/i, targets: ['ushqim-dhe-pije'] },

  // Construction & materials
  { match: /expo\s*real/i,           targets: ['ndertim-materiale'] },
  { match: /\bbau\s*munich\b/i,      targets: ['ndertim-materiale'] },
  { match: /^bau\s+/i,               targets: ['ndertim-materiale'] },
  { match: /mosbuild/i,              targets: ['ndertim-materiale'] },
  { match: /light\s*\+\s*building/i, targets: ['ndertim-materiale'] },
  { match: /\bbig\s*5\b/i,           targets: ['ndertim-materiale'] },
  { match: /\br\+t\b/i,              targets: ['ndertim-materiale', 'metale-makineri'] },

  // Wood & furniture
  { match: /domotex/i,               targets: ['ndertim-materiale', 'druri-mobilje'] },
  { match: /interzum/i,              targets: ['druri-mobilje'] },
  { match: /intermob/i,              targets: ['druri-mobilje'] },
  { match: /\bligna\b/i,             targets: ['druri-mobilje', 'metale-makineri'] },
  { match: /salone\s*del\s*mobile/i, targets: ['druri-mobilje'] },
  { match: /meble\s*polska/i,        targets: ['druri-mobilje'] },

  // Textile & fashion / cosmetics
  { match: /premi(è|e)re\s*vision/i, targets: ['tekstil-konfeksion'] },
  { match: /texworld/i,              targets: ['tekstil-konfeksion'] },
  { match: /lineapelle/i,            targets: ['tekstil-konfeksion'] },
  { match: /pitti\s*filati/i,        targets: ['tekstil-konfeksion'] },
  { match: /heimtextil/i,            targets: ['tekstil-konfeksion'] },
  { match: /cosmoprof/i,             targets: ['kozmetike', 'tekstil-konfeksion'] },

  // Metals, machinery, electronics
  { match: /hannover\s*messe/i,      targets: ['metale-makineri'] },
  { match: /emo\s*milano/i,          targets: ['metale-makineri'] },
  { match: /\bbauma\b/i,             targets: ['metale-makineri', 'ndertim-materiale'] },
  { match: /\bmsv\s*brno\b/i,        targets: ['metale-makineri'] },
  { match: /plast\s*eurasia/i,       targets: ['metale-makineri'] },

  // ICT / digital
  { match: /\bifa\s*berlin\b/i,      targets: ['tik'] },

  // Out of scope (Tourism / Maritime / generic): explicit empty + no cross-cutting.
  { match: /\bitb\s*berlin\b/i,      targets: [] },
  { match: /\bsmm\s*hamburg\b/i,     targets: [] },
]

// Heuristic fallback: scan a fair's sectors[] for keyword hints when name
// rules don't match.
const SECTOR_KEYWORDS = [
  { slug: 'druri-mobilje',     re: /\b(dru|druri|mobilje|mobile|furniture|wood|forest)\b/i },
  { slug: 'ushqim-dhe-pije',   re: /\b(ushqim|pije|food|beverage|wine|agri|agro|dairy|meat|bulmet|mish|fruit|vegetable|perime|fruta)\b/i },
  { slug: 'tekstil-konfeksion', re: /\b(tekstil|textile|fashion|apparel|leather|l(ë|e)kur(ë|e))\b/i },
  { slug: 'kozmetike',         re: /\b(kozmetik|cosmetic|beauty|fragrance|kimi)\b/i },
  { slug: 'metale-makineri',   re: /\b(metal|makineri|machinery|metalurg|electronics|industrial)\b/i },
  { slug: 'ndertim-materiale', re: /\b(nd(ë|e)rtim|construction|building|materials|cement|mining|architect)\b/i },
  { slug: 'tik',               re: /\b(tik|ict|software|digital|technology|teknologji)\b/i },
]

function classifyFair(fair) {
  const name = fair.name || ''
  for (const rule of FAIR_RULES) {
    if (rule.match.test(name)) {
      return { targets: rule.targets, source: 'rule' }
    }
  }
  // Fallback: scan sectors[] keywords.
  const hay = (fair.sectors || []).join(' ')
  const hits = new Set()
  for (const k of SECTOR_KEYWORDS) {
    if (k.re.test(hay) || k.re.test(name)) hits.add(k.slug)
  }
  return { targets: Array.from(hits), source: hits.size ? 'keyword' : 'empty' }
}

// ----------------------------------------------------------------------------
// Grant rules
// ----------------------------------------------------------------------------

// Cross-cutting: funding instruments that legitimately apply to every sector.
const GRANT_CROSS_CUTTING = [
  /fondi\s*kosovar\s*p(ë|e)r\s*garanci\s*kreditore/i,
  /\bgaranci\s*kreditore\b/i,
  /\bcosme\b.*sme/i,
  /single\s*market\s*programme/i,
  /sme\s*innovation.*export\s*promotion/i,
  /export\s*growth.*market\s*diversification/i,
  /export\s*market\s*entry\s*support/i,
  /digjitalizimit/i,
  /digitalization\s*services/i,
  /certifikim\s*t(ë|e)\s*produkteve/i,
  /product\s*certification/i,
  /vler(ë|e)sues\s*i\s*biznesit/i,
]

// Per-sector grant title patterns.
const GRANT_RULES = [
  { match: /industri(\s|s(ë|e))\s*kreative|industris(ë|e)\s*kreative|creative\s*industr/i,
    targets: ['tik', 'tekstil-konfeksion'] },
  { match: /web\s*summit/i,                       targets: ['tik'] },
  { match: /makineri.*prodhuese|advanced\s*manufacturing|processing\s*machinery/i,
    targets: ['metale-makineri', 'ushqim-dhe-pije', 'druri-mobilje', 'tekstil-konfeksion', 'kozmetike', 'ndertim-materiale'] },
  { match: /eic\s*accelerator|horizon\s*europe/i, targets: ['tik'] },
  { match: /world\s*bank.*cerp|technology\s*adoption.*export/i,
    targets: ['metale-makineri', 'ushqim-dhe-pije', 'tik'] },
  { match: /ebrd.*small\s*business/i,             targets: ['tik', 'ushqim-dhe-pije', 'metale-makineri'] },
  { match: /usaid.*private\s*sector/i,            targets: ['tik', 'ushqim-dhe-pije'] },
  // CERTIFICATION call mentions metalurgjia in sectors[] -> manufacturing sectors.
  { match: /msme.*product\s*certification/i,
    targets: ['metale-makineri', 'ushqim-dhe-pije', 'kozmetike', 'tekstil-konfeksion', 'druri-mobilje', 'ndertim-materiale'] },
]

function classifyGrant(g) {
  const title = g.title || ''
  // Cross-cutting first.
  for (const re of GRANT_CROSS_CUTTING) {
    if (re.test(title)) return { crossCutting: true, targets: [], source: 'cross-cutting' }
  }
  for (const rule of GRANT_RULES) {
    if (rule.match.test(title)) return { crossCutting: false, targets: rule.targets, source: 'rule' }
  }
  // Sectors[] keyword fallback.
  const hay = [(g.sectors || []).join(' '), title].join(' ')
  const hits = new Set()
  for (const k of SECTOR_KEYWORDS) {
    if (k.re.test(hay)) hits.add(k.slug)
  }
  // Special: 'metalurgji' / 'metale'
  if (/metalurg/i.test(hay)) hits.add('metale-makineri')
  if (/prodhim|p(ë|e)rpunim/i.test(hay)) {
    // Manufacturing-leaning subsidies: tag all manufacturing sectors.
    hits.add('metale-makineri'); hits.add('ushqim-dhe-pije'); hits.add('druri-mobilje');
    hits.add('tekstil-konfeksion'); hits.add('kozmetike'); hits.add('ndertim-materiale');
  }
  return { crossCutting: false, targets: Array.from(hits), source: hits.size ? 'keyword' : 'empty' }
}

function uniq(arr) { return Array.from(new Set(arr)) }
function eqArr(a, b) {
  if (a.length !== b.length) return false
  const sa = [...a].sort(); const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

async function run() {
  let fairs = await prisma.tradeFair.findMany({ where: { deletedAt: null } })
  let grants = await prisma.grant.findMany({ where: { deletedAt: null } })

  let fairChanged = 0
  let fairWithTargets = 0
  let fairCrossCutting = 0
  let fairEmpty = 0

  for (const f of fairs) {
    const before = uniq((f.targetSectors || []).filter((s) => CANONICAL.includes(s)))
    const cls = classifyFair(f)
    const after = uniq(cls.targets.filter((s) => CANONICAL.includes(s)))

    // Don't strip a legitimate already-correct value if our rule returned empty
    // from a keyword fallback miss. Only overwrite when we have a confident rule
    // (source !== 'empty') OR when the existing value was empty.
    let next = after
    if (cls.source === 'empty' && before.length > 0) next = before

    if (!eqArr(before, next)) {
      await prisma.tradeFair.update({ where: { id: f.id }, data: { targetSectors: next } })
      fairChanged++
    }

    if (next.length > 0) fairWithTargets++
    else if ((f.tags || []).includes('cross-cutting')) fairCrossCutting++
    else fairEmpty++
  }

  let grantChanged = 0
  let grantWithTargets = 0
  let grantCrossCutting = 0
  let grantEmpty = 0
  let grantDeactivated = 0

  for (const g of grants) {
    // Soft-deactivate broken-title grants.
    if ((g.title || '').trim().startsWith('<img')) {
      if (g.isActive) {
        await prisma.grant.update({ where: { id: g.id }, data: { isActive: false } })
        grantDeactivated++
      }
      continue
    }

    const beforeTargets = uniq((g.targetSectors || []).filter((s) => CANONICAL.includes(s)))
    const beforeTags = g.tags || []
    const cls = classifyGrant(g)

    let nextTargets = beforeTargets
    let nextTags = beforeTags

    if (cls.crossCutting) {
      if (!nextTags.includes('cross-cutting')) {
        nextTags = uniq([...nextTags, 'cross-cutting'])
      }
      // Don't force-clear targetSectors for cross-cutting items; keep any
      // legitimate per-sector hint if already present.
    } else if (cls.source !== 'empty') {
      nextTargets = uniq(cls.targets.filter((s) => CANONICAL.includes(s)))
      // Remove a stale cross-cutting tag if we now have a specific sector list.
      if (nextTargets.length > 0) nextTags = nextTags.filter((t) => t !== 'cross-cutting')
    }

    const targetsChanged = !eqArr(beforeTargets, nextTargets)
    const tagsChanged = !eqArr(beforeTags, nextTags)
    if (targetsChanged || tagsChanged) {
      await prisma.grant.update({
        where: { id: g.id },
        data: {
          ...(targetsChanged ? { targetSectors: nextTargets } : {}),
          ...(tagsChanged ? { tags: nextTags } : {}),
        },
      })
      grantChanged++
    }

    if (nextTags.includes('cross-cutting')) grantCrossCutting++
    else if (nextTargets.length > 0) grantWithTargets++
    else grantEmpty++
  }

  console.log(JSON.stringify({
    fairs: {
      total: fairs.length,
      changed: fairChanged,
      withTargets: fairWithTargets,
      crossCutting: fairCrossCutting,
      uncategorized: fairEmpty,
    },
    grants: {
      total: grants.length,
      changed: grantChanged,
      withTargets: grantWithTargets,
      crossCutting: grantCrossCutting,
      uncategorized: grantEmpty,
      deactivatedBrokenTitle: grantDeactivated,
    },
  }, null, 2))
}

run()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
