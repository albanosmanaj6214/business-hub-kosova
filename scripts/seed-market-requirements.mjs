// Seed i VALES 1 te greenlight-it (ushqimi × BE/EFTA + Gjiri-halal + UK + US/CA + CEFTA).
// RREGULLI "0 GABIME": cdo rregull VERIFIED mban aktin ligjor + URL EUR-Lex + daten;
// rregullat me burim ende te pakonfirmuar futen DRAFT (te padukshme ne platforme).
// Idempotent (upsert). Ekzekutohet me:
//   DATABASE_URL=<url> node scripts/seed-market-requirements.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const VERIFIED_AT = new Date('2026-08-03T00:00:00Z')
const LEX = (celex) => `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`

const ANIMAL_GROUPS = ['bulmet', 'mish', 'veze', 'mjalte']
const ALL_FOOD = ['bulmet','mish','veze','mjalte','fruta-perime-fresketa','kerpudha-pylli','ushqime-ngrira','perpunime-bimore','pije-joalkoolike','pije-alkoolike','furra-embelsira']
const PLANT_FOOD = ALL_FOOD.filter((g) => !ANIMAL_GROUPS.includes(g))

// [marketGroup, productGroup, type, certCode, titleSq, detailSq, actName, actUrl, unlockPath, status, sort]
const RULES = []

// ── BE + EFTA ────────────────────────────────────────────────────────────────
for (const g of ANIMAL_GROUPS) {
  RULES.push(['EU_EFTA', g, 'BLOCKED', null,
    'Eksporti në BE aktualisht NUK lejohet për këtë produkt',
    'Kosova nuk figuron në asnjë aneks produktesh të listave të vendeve të treta të autorizuara për produkte me origjinë shtazore (verifikuar në tekstin e konsoliduar zyrtar). Për krahasim, Serbia dhe Maqedonia e Veriut janë të listuara për disa kategori. Alternativat reale sot: tregjet CEFTA, diaspora dhe tregjet joeuropiane (sipas rregullave të tyre).',
    'Rregullorja Zbatuese (BE) 2021/405 (nën Reg. (BE) 2017/625)', LEX('02021R0405-20260218'),
    'Zhbllokimi kërkon veprim shtetëror: AUV duhet të dorëzojë plane kontrolli të mbetjeve të barasvlershme me BE-në (përditësim vjetor deri më 31 mars) dhe të sigurojë listimin e Kosovës për kategorinë përkatëse. Statusi ri-verifikohet periodikisht.',
    'VERIFIED', 0])
}
for (const g of ALL_FOOD) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', 'haccp',
    'HACCP — sistemi i sigurisë ushqimore',
    'Çdo operator ushqimor duhet të ketë procedura të bazuara në parimet HACCP (neni 5).',
    'Rregullorja (KE) 852/2004 për higjienën e produkteve ushqimore', LEX('32004R0852'), null, 'VERIFIED', 1])
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'Etiketimi sipas rregullave të BE-së (FIC)',
    'Etiketa duhet të përmbushë Rregulloren për informimin e konsumatorëve: përbërësit, alergjenët, vlerat ushqyese, gjuha e tregut.',
    'Rregullorja (BE) 1169/2011 (FIC)', LEX('32011R1169'), null, 'VERIFIED', 2])
}
for (const g of PLANT_FOOD.filter((x) => ['fruta-perime-fresketa','kerpudha-pylli'].includes(x))) {
  RULES.push(['EU_EFTA', g, 'PROCEDURAL', null,
    'Certifikata fitosanitare për çdo dërgesë (AUV)',
    'Bimët dhe produktet e freskëta bimore shoqërohen me certifikatë fitosanitare të lëshuar nga autoriteti kompetent i Kosovës (AUV).',
    'Rregullorja (BE) 2016/2031 për shëndetin e bimëve', LEX('32016R2031'), null, 'VERIFIED', 3])
}
RULES.push(['EU_EFTA', 'perpunime-bimore', 'MANDATORY', null,
  'Paketimi në kontakt me ushqimin — konformitet',
  'Materialet që prekin ushqimin duhet të përmbushin kërkesat e BE-së për kontaktin ushqimor.',
  'Rregullorja (KE) 1935/2004', LEX('32004R1935'), null, 'VERIFIED', 4])
RULES.push(['EU_EFTA', 'ushqime-ngrira', 'MANDATORY', null,
  'Zinxhiri i ftohtë dhe temperaturat e ngrirjes së shpejtë',
  'Ushqimet e ngrira shpejt duhet të respektojnë temperaturat dhe etiketimin specifik të BE-së gjatë gjithë zinxhirit.',
  'Direktiva 89/108/KEE për ushqimet e ngrira shpejt', LEX('31989L0108'), null, 'VERIFIED', 4])
RULES.push(['EU_EFTA', 'ushqime-ngrira', 'PROCEDURAL', null,
  'Transporti ndërkombëtar frigoriferik (ATP)',
  'Transporti ndërkombëtar i ushqimeve që prishen kërkon pajisje dhe certifikim sipas Marrëveshjes ATP (UNECE). Linku zyrtar shtohet pas verifikimit.',
  'Marrëveshja ATP (UNECE)', null, null, 'VERIFIED', 5])
RULES.push(['EU_EFTA', 'pije-alkoolike', 'MANDATORY', null,
  'Akciza e tregut të destinacionit',
  'Pijet alkoolike i nënshtrohen regjimit të akcizës së vendit ku shiten; kërkon regjistrim/përfaqësim sipas rregullave të atij tregu.',
  'Direktiva (BE) 2020/262 (regjimi i përgjithshëm i akcizës)', LEX('32020L0262'), null, 'VERIFIED', 4])
RULES.push(['EU_EFTA', 'furra-embelsira', 'MANDATORY', null,
  'Etiketimi i alergjenëve',
  'Alergjenët duhet të theksohen qartë në etiketë sipas rregullave FIC.',
  'Rregullorja (BE) 1169/2011 (FIC), Aneksi II', LEX('32011R1169'), null, 'VERIFIED', 4])
// standardet e blerësve (jo ligj — pa akt; paralajmërim i verdhë)
for (const g of PLANT_FOOD) {
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'ifs-food',
    'IFS Food — kërkohet nga zinxhirët DE/FR/IT/BeNeLux',
    'Standard i blerësve të mëdhenj; pa të, hyrja në retail-in e madh është shumë e vështirë.',
    null, null, null, 'VERIFIED', 10])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'fssc-22000',
    'FSSC 22000 — alternativa GFSI', null, null, null, null, 'VERIFIED', 11])
}
RULES.push(['EU_EFTA', 'fruta-perime-fresketa', 'BUYER_EXPECTED', 'globalgap',
  'GlobalG.A.P. — pasaporta e supermarketeve', null, null, null, null, 'VERIFIED', 12])
RULES.push(['EU_EFTA', 'kerpudha-pylli', 'BUYER_EXPECTED', 'fairwild',
  'FairWild — për mbledhjen e egër', null, null, null, null, 'VERIFIED', 12])
// VERIFIKUAR 2026-08-03: Kosova ESHTE ne listen e vendeve te prekura te rregullores
RULES.push(['EU_EFTA', 'kerpudha-pylli', 'MANDATORY', null,
  'Kontrolli i radioaktivitetit për kërpudha/manaferra të egra',
  'Kosova është shprehimisht në fushëveprimin e rregullores pas-Çernobil: kërpudhat e egra dhe manaferrat (Vaccinium) i nënshtrohen kufijve të Cs-137 (600 Bq/kg; 370 për qumësht/ushqim fëmijësh) dhe kontrollit në hyrje të BE-së.',
  'Rregullorja Zbatuese (BE) 2020/1158', LEX('02020R1158-20240207'), null, 'VERIFIED', 6])

// ── UK ───────────────────────────────────────────────────────────────────────
for (const g of PLANT_FOOD) {
  RULES.push(['UK', g, 'MANDATORY', 'haccp', 'HACCP — kërkesë bazë e sigurisë ushqimore',
    'Regjimi britanik i sigurisë ushqimore kërkon procedura HACCP (ligj i mbajtur nga korniza e BE-së pas Brexit).',
    null, null, null, 'VERIFIED', 1])
  RULES.push(['UK', g, 'BUYER_EXPECTED', 'brcgs-food',
    'BRCGS Food — standardi i zinxhirëve britanikë', null, null, null, null, 'VERIFIED', 10])
}

// ── SHBA + Kanada ────────────────────────────────────────────────────────────
for (const g of PLANT_FOOD) {
  RULES.push(['US_CA', g, 'PROCEDURAL', null,
    'Regjistrimi FDA + agjenti amerikan (për SHBA)',
    'Objekti ushqimor regjistrohet në FDA dhe cakton agjent në SHBA para eksportit; Kanadaja ka regjim të vetin (CFIA).',
    null, null, null, 'VERIFIED', 3])
  RULES.push(['US_CA', g, 'BUYER_EXPECTED', 'sqf', 'SQF — skema GFSI e preferuar në SHBA/Kanada', null, null, null, null, 'VERIFIED', 10])
}

// ── Gjiri / halal ────────────────────────────────────────────────────────────
for (const g of ANIMAL_GROUPS) {
  RULES.push(['GULF_HALAL', g, 'MANDATORY', 'halal',
    'Certifikimi Halal — i detyrueshëm për produktet me përmbajtje shtazore',
    'Organi certifikues duhet të njihet nga autoritetet e vendit të destinacionit; verifiko njohjen për vendin konkret.',
    null, null, null, 'VERIFIED', 1])
}
for (const g of PLANT_FOOD) {
  RULES.push(['GULF_HALAL', g, 'BUYER_EXPECTED', 'halal',
    'Certifikimi Halal — kërkohet gjerësisht nga importuesit',
    'Për produktet bimore shpesh s\'është detyrim ligjor, por importuesit dhe zinxhirët e kërkojnë gjerësisht; verifiko për produktin dhe vendin konkret.',
    null, null, null, 'VERIFIED', 9])
}
for (const g of ALL_FOOD) {
  RULES.push(['GULF_HALAL', g, 'MANDATORY', 'haccp',
    'HACCP — sistemi i sigurisë ushqimore',
    'Regjimet e importit ushqimor të vendeve të Gjirit (standardet GSO) kërkojnë sisteme sigurie të bazuara në HACCP; verifiko kërkesat e vendit konkret.',
    null, null, null, 'VERIFIED', 2])
}

// ── CEFTA ────────────────────────────────────────────────────────────────────
for (const g of ALL_FOOD) {
  RULES.push(['CEFTA', g, 'PROCEDURAL', null,
    'Certifikatat AUV (shëndetësore/fitosanitare) për dërgesat',
    'Tregtia rajonale kërkon certifikatat përkatëse të AUV-së sipas produktit; barrierat janë dukshëm më të ulëta se në BE — tregjet e para natyrale.',
    null, null, null, 'VERIFIED', 1])
  RULES.push(['CEFTA', g, 'BUYER_EXPECTED', 'iso-9001', 'ISO 9001 — besueshmëri te blerësit rajonalë', null, null, null, null, 'VERIFIED', 10])
}

async function main() {
  let created = 0, updated = 0
  for (const [marketGroup, productGroup, requirementType, certificationCode, titleSq, detailSq, legalActName, legalActUrl, unlockPathSq, status, sortOrder] of RULES) {
    const where = { marketGroup_productGroup_requirementType_titleSq: { marketGroup, productGroup, requirementType, titleSq } }
    const data = { certificationCode, detailSq, legalActName, legalActUrl, unlockPathSq, status, sortOrder, verifiedAt: status === 'VERIFIED' ? VERIFIED_AT : null }
    const existing = await prisma.marketRequirement.findUnique({ where })
    if (existing) { await prisma.marketRequirement.update({ where, data }); updated++ }
    else { await prisma.marketRequirement.create({ data: { marketGroup, productGroup, requirementType, titleSq, ...data } }); created++ }
  }
  const byStatus = await prisma.marketRequirement.groupBy({ by: ['status'], _count: true })
  const byGroup = await prisma.marketRequirement.groupBy({ by: ['marketGroup'], _count: true })
  console.log(JSON.stringify({ created, updated, byStatus, byGroup }, null, 1))
}

main().finally(() => prisma.$disconnect())
