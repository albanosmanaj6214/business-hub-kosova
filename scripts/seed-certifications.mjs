// Seed i katalogut te certifikimeve (v2, i miratuar 2026-07-31). Idempotent: upsert
// sipas `code`. Nje rresht per certifikim; `sectors` = union i slug-eve ku eshte
// relevant; `isCore` = shfaqet te cdo sektor. Ekzekutohet me:
//   DATABASE_URL=<url> node scripts/seed-certifications.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// slug-et e sektoreve (src/lib/sectors.ts)
const S = {
  ushqim: 'ushqim-dhe-pije', bujqesi: 'bujqesi-blegtori', tekstil: 'tekstil-konfeksion',
  lekure: 'lekure-kepuce', druri: 'druri-mobilje', metale: 'metale-makineri',
  ndertim: 'ndertim-materiale', plastika: 'plastika-goma', kimi: 'kimi-kozmetike',
  leter: 'leter-paketim', elektrike: 'pajisje-elektrike', farma: 'farmaceutike-mjekesore',
  tik: 'tik', energji: 'energji-rinovueshme', logjistike: 'logjistike-transport',
  turizem: 'turizem-mikpritje', artizanat: 'artizanat-kreative', konstruksion: 'konstruksion-inxhinieri',
}

// [code, name, kind, isCore, sectors[], whySq]
const CERTS = [
  // ── Baze (nder-sektoriale) ──
  ['iso-9001', 'ISO 9001', 'BASE', true, [], 'Sistemi i menaxhimit të cilësisë. Baza për shumicën e blerësve.'],
  ['iso-14001', 'ISO 14001', 'ENVIRONMENT', true, [], 'Menaxhimi mjedisor.'],
  ['iso-45001', 'ISO 45001', 'BASE', true, [], 'Siguria dhe shëndeti në punë.'],
  ['iso-27001', 'ISO 27001', 'BASE', true, [S.tik], 'Siguria e informacionit — themeli për TIK/BPO.'],
  ['iso-50001', 'ISO 50001', 'ENVIRONMENT', true, [S.energji], 'Menaxhimi i energjisë.'],
  ['ce-marking', 'Shenja CE', 'EU_MANDATORY', true, [], 'Konformiteti i produktit për tregun e BE-së (varet nga produkti).'],
  ['reach', 'REACH', 'EU_MANDATORY', true, [S.lekure, S.plastika, S.kimi], 'Konformiteti kimik për tregun e BE-së.'],
  ['clp', 'CLP', 'EU_MANDATORY', true, [S.kimi], 'Klasifikimi dhe etiketimi i kimikateve (BE).'],

  // ── Detyrueshme (Kosove) ──
  ['auv-approval', 'Aprovim / regjistrim në AUV', 'KS_MANDATORY', false, [S.ushqim], 'I detyrueshëm për çdo operator ushqimor në Kosovë; për mish/bulmet edhe numri i aprovimit për eksport.'],
  ['auv-phyto-vet', 'Certifikatat fitosanitare / veterinare (AUV)', 'KS_MANDATORY', false, [S.bujqesi], 'Regjistrimi i operatorit dhe certifikatat për çdo eksport bimor/shtazor.'],
  ['akppm-authorization', 'Autorizim AKPPM', 'KS_MANDATORY', false, [S.farma], 'Autorizimi i prodhimit/tregtimit nga Agjencia e Kosovës për Produkte dhe Pajisje Medicinale.'],
  ['zrre-license', 'Licencë nga ZRRE', 'KS_MANDATORY', false, [S.energji], 'Licenca e prodhimit/tregtimit të energjisë nga rregullatori i energjisë.'],
  ['transport-license-cemt', 'Licencë transporti ndërkombëtar + CEMT', 'KS_MANDATORY', false, [S.logjistike], 'Licencat dhe lejet për transport ndërkombëtar rrugor.'],
  ['mint-categorization', 'Kategorizimi zyrtar i akomodimit (MINT)', 'KS_MANDATORY', false, [S.turizem], 'Kategorizimi i detyrueshëm i hoteleve/akomodimit.'],
  ['mmphi-license', 'Licencat profesionale (MMPHI)', 'KS_MANDATORY', false, [S.konstruksion], 'Licencat e ndërtimit sipas kategorive për punë në Kosovë.'],

  // ── Siguri ushqimore ──
  ['haccp', 'HACCP', 'FOOD_SAFETY', false, [S.ushqim, S.turizem], 'Themeli i sigurisë ushqimore; e kërkon AUV për operatorët ushqimorë.'],
  ['iso-22000', 'ISO 22000', 'FOOD_SAFETY', false, [S.ushqim, S.bujqesi, S.turizem], 'Sistemi i menaxhimit të sigurisë ushqimore.'],
  ['fssc-22000', 'FSSC 22000', 'FOOD_SAFETY', false, [S.ushqim], 'Skema GFSI — e njohur nga blerësit e mëdhenj ndërkombëtarë.'],

  // ── Cilesi / kualifikim ──
  ['ifs-food', 'IFS Food', 'QUALITY', false, [S.ushqim], 'Kërkohet nga zinxhirët në Gjermani, Francë e Itali.'],
  ['brcgs-food', 'BRCGS Food', 'QUALITY', false, [S.ushqim], 'Kërkohet nga zinxhirët britanikë dhe shumë distributorë të mëdhenj.'],
  ['sqf', 'SQF', 'QUALITY', false, [S.ushqim], 'Skema GFSI e preferuar në SHBA/Kanada.'],
  ['oeko-tex-100', 'OEKO-TEX Standard 100', 'QUALITY', false, [S.tekstil], 'Pa substanca të dëmshme — kërkesa bazë e blerësve.'],
  ['oeko-tex-leather', 'OEKO-TEX Leather Standard', 'QUALITY', false, [S.lekure], 'Pa substanca të dëmshme në lëkurë.'],
  ['formaldehyde-e1-carb', 'Emetim formaldehidi (E1/CARB)', 'QUALITY', false, [S.druri], 'Kufijtë e emetimit për panele e mobilje.'],
  ['enplus', 'ENplus (pelet)', 'QUALITY', false, [S.druri, S.energji], 'Standardi i cilësisë për pelet druri.'],
  ['iso-3834', 'ISO 3834', 'QUALITY', false, [S.metale], 'Cilësia e proceseve të saldimit.'],
  ['iatf-16949', 'IATF 16949', 'QUALITY', false, [S.metale, S.plastika], 'Kusht për furnitorët e industrisë automobilistike.'],
  ['brcgs-packaging', 'BRCGS Packaging', 'QUALITY', false, [S.leter], 'Standardi i sigurisë së paketimit — e kërkojnë blerësit ushqimorë.'],
  ['iso-15378', 'ISO 15378 (paketim farmaceutik)', 'QUALITY', false, [S.leter], 'GMP i paketimit — nëse furnizon farmaceutikën.'],
  ['iec-standards', 'Standarde IEC / EN', 'QUALITY', false, [S.elektrike, S.energji], 'Standardet e produktit sipas llojit.'],
  ['soc-2', 'SOC 2', 'QUALITY', false, [S.tik], 'Kontrolle sigurie — e kërkojnë klientët amerikanë.'],
  ['pci-dss', 'PCI DSS', 'QUALITY', false, [S.tik], 'De-fakto i detyrueshëm nëse preken të dhëna kartelash pagese.'],
  ['iso-20000', 'ISO 20000', 'QUALITY', false, [S.tik], 'Menaxhimi i shërbimeve IT.'],
  ['iso-22301', 'ISO 22301', 'QUALITY', false, [S.tik], 'Vazhdimësia e biznesit — e kërkojnë klientët enterprise.'],
  ['solar-keymark', 'Solar Keymark', 'QUALITY', false, [S.energji], 'Për sisteme solare termike në tregun e BE-së.'],
  ['iso-28000', 'ISO 28000', 'QUALITY', false, [S.logjistike], 'Siguria e zinxhirit të furnizimit.'],
  ['iso-39001', 'ISO 39001', 'QUALITY', false, [S.logjistike], 'Siguria në trafikun rrugor.'],
  ['scc-sgu', 'SCC / SGU', 'QUALITY', false, [S.konstruksion], 'Kualifikimi i sigurisë që kërkohet për punë në Gjermani/Austri/Holandë.'],
  ['iso-19650-bim', 'ISO 19650 (BIM)', 'QUALITY', false, [S.konstruksion], 'Menaxhimi i informacionit të ndërtimit.'],
  ['globalgap', 'GlobalG.A.P.', 'QUALITY', false, [S.bujqesi, S.ushqim], 'Praktikat e mira bujqësore — pasaporta e eksportit për fruta-perime.'],

  // ── Mjedis / qendrueshmeri ──
  ['organic-eu', 'Organik (BE 2018/848)', 'ENVIRONMENT', false, [S.ushqim, S.bujqesi], 'Certifikimi bio për tregun e BE-së — çelës për manaferrat/MAP nga Kosova.'],
  ['fairwild', 'FairWild', 'ENVIRONMENT', false, [S.bujqesi], 'Për bimë mjekësore/aromatike dhe fruta të egra — kërkesë e blerësve ndërkombëtarë.'],
  ['gots', 'GOTS', 'ENVIRONMENT', false, [S.tekstil], 'Tekstili organik — segmenti premium.'],
  ['grs', 'GRS (Global Recycled Standard)', 'ENVIRONMENT', false, [S.tekstil, S.plastika], 'Përmbajtja e ricikluar — kërkesë në rritje nga markat.'],
  ['oeko-tex-step', 'OEKO-TEX STeP', 'ENVIRONMENT', false, [S.tekstil], 'Prodhim i qëndrueshëm i certifikuar.'],
  ['lwg', 'Leather Working Group (LWG)', 'ENVIRONMENT', false, [S.lekure], 'Standardi mjedisor i regjeve — e kërkojnë markat.'],
  ['fsc-coc', 'FSC (Chain of Custody)', 'ENVIRONMENT', false, [S.druri, S.leter], 'Origjina e përgjegjshme e drurit — de-fakto e detyrueshme te blerësit e mëdhenj.'],
  ['pefc', 'PEFC', 'ENVIRONMENT', false, [S.druri, S.leter], 'Alternativa e certifikimit të pyjeve.'],
  ['epd', 'EPD (Deklarata Mjedisore e Produktit)', 'ENVIRONMENT', false, [S.ndertim], 'Kërkohet gjithnjë e më shumë në tenderët e BE-së.'],
  ['recyclass', 'RecyClass', 'ENVIRONMENT', false, [S.plastika], 'Riciklueshmëria e paketimit.'],
  ['cosmos-ecocert', 'COSMOS / Ecocert', 'ENVIRONMENT', false, [S.kimi], 'Kozmetika natyrale/organike e certifikuar.'],
  ['weee', 'WEEE', 'ENVIRONMENT', false, [S.elektrike], 'Menaxhimi i mbetjeve elektronike.'],
  ['travelife-green-key', 'Travelife / Green Key', 'ENVIRONMENT', false, [S.turizem], 'Qëndrueshmëria për akomodim.'],

  // ── Detyrueshme (BE) sipas produktit ──
  ['eudr', 'EUDR (rregullorja e shpyllëzimit)', 'EU_MANDATORY', false, [S.druri], 'Due diligence i BE-së për origjinën e drurit — po bëhet kusht tregtimi.'],
  ['ispm-15', 'ISPM 15 (paleta/ambalazh druri)', 'EU_MANDATORY', false, [S.druri], 'Trajtimi termik + vula — i detyrueshëm për paleta e ambalazh druri në eksport.'],
  ['ce-wood', 'Shenja CE (EN 13986/14342)', 'EU_MANDATORY', false, [S.druri], 'Për produkte druri në ndërtim.'],
  ['ce-machinery', 'Shenja CE — Direktiva e Makinerive', 'EU_MANDATORY', false, [S.metale], 'Kusht për makineri në tregun e BE-së.'],
  ['en-1090', 'EN 1090', 'EU_MANDATORY', false, [S.metale, S.ndertim, S.konstruksion], 'Për struktura çeliku/alumini.'],
  ['ped', 'PED (pajisje me presion)', 'EU_MANDATORY', false, [S.metale], 'Për enë/pajisje me presion.'],
  ['ce-cpr', 'Shenja CE / CPR + DoP', 'EU_MANDATORY', false, [S.ndertim, S.konstruksion], 'Deklarata e Performancës — e detyrueshme për produkte ndërtimi në BE.'],
  ['food-contact-eu', 'Kontakt ushqimor (BE 10/2011)', 'EU_MANDATORY', false, [S.plastika, S.leter], 'Për paketim/enë që prek ushqimin.'],
  ['gmp-cosmetics', 'GMP kozmetikë (ISO 22716)', 'EU_MANDATORY', false, [S.kimi], 'Praktika e mirë prodhuese — kusht për kozmetikë në BE.'],
  ['cpnp', 'Njoftim CPNP', 'EU_MANDATORY', false, [S.kimi], 'Njoftimi i produktit kozmetik në portalin e BE-së.'],
  ['bpr', 'BPR (produkte biocide)', 'EU_MANDATORY', false, [S.kimi], 'Për dezinfektues dhe biocide.'],
  ['ce-lvd-emc', 'Shenja CE (LVD & EMC)', 'EU_MANDATORY', false, [S.elektrike], 'Tensioni i ulët dhe përputhshmëria elektromagnetike.'],
  ['red', 'RED (pajisje radio)', 'EU_MANDATORY', false, [S.elektrike], 'Për çdo pajisje me Wi-Fi/Bluetooth/radio.'],
  ['rohs', 'RoHS', 'EU_MANDATORY', false, [S.elektrike], 'Kufizimi i substancave të rrezikshme.'],
  ['ecodesign-energy-label', 'Ecodesign / etiketa energjetike', 'EU_MANDATORY', false, [S.elektrike], 'Për pajisje shtëpiake dhe ndriçim.'],
  ['gmp-eu', 'GMP (BE GMP)', 'EU_MANDATORY', false, [S.farma], 'Praktika e mirë prodhuese farmaceutike.'],
  ['iso-13485', 'ISO 13485', 'EU_MANDATORY', false, [S.farma], 'Sistemi i cilësisë për pajisje mjekësore.'],
  ['ce-mdr', 'Shenja CE / MDR', 'EU_MANDATORY', false, [S.farma], 'Rregullorja e pajisjeve mjekësore.'],
  ['ivdr', 'IVDR', 'EU_MANDATORY', false, [S.farma], 'Për diagnostikën in-vitro.'],
  ['gdp', 'GDP', 'EU_MANDATORY', false, [S.farma, S.logjistike], 'Praktika e mirë e shpërndarjes (barna) — edhe për transport/magazinim farmaceutik.'],
  ['gdpr-compliance', 'Konformitet GDPR', 'EU_MANDATORY', false, [S.tik], 'Mbrojtja e të dhënave për klientë të BE-së.'],
  ['ce-equipment', 'Shenja CE (pajisje)', 'EU_MANDATORY', false, [S.energji], 'Për pajisjet në tregun e BE-së.'],
  ['aeo', 'AEO', 'EU_MANDATORY', false, [S.logjistike], 'Operator Ekonomik i Autorizuar — lehtësime doganore.'],
  ['adr', 'ADR', 'EU_MANDATORY', false, [S.logjistike], 'Transporti i mallrave të rrezikshme.'],
  ['atp', 'ATP', 'EU_MANDATORY', false, [S.logjistike], 'Transporti ndërkombëtar frigoriferik i ushqimeve.'],
  ['ce-en71-toys', 'Shenja CE (EN 71 për lodra)', 'EU_MANDATORY', false, [S.artizanat], 'Nëse produkti e kërkon — p.sh. lodrat.'],

  // ── Social / etike ──
  ['bsci-smeta', 'BSCI / SMETA', 'SOCIAL', false, [S.tekstil, S.lekure], 'Auditimi social — kusht për punë me markat evropiane.'],
  ['grasp', 'GRASP', 'SOCIAL', false, [S.bujqesi], 'Moduli social mbi GlobalG.A.P. — e kërkojnë supermarketet.'],
  ['fairtrade', 'Fairtrade', 'SOCIAL', false, [S.bujqesi, S.artizanat], 'Tregti e drejtë për tregje specifike.'],

  // ── Sektoriale ──
  ['halal', 'Halal', 'SECTORAL', false, [S.ushqim], 'Për tregjet me kërkesë halal (diaspora + Lindja e Mesme).'],
  ['kosher', 'Kosher', 'SECTORAL', false, [S.ushqim], 'Për tregje me kërkesë kosher (SHBA etj.).'],
  ['v-label', 'V-Label (vegan/vegjetarian)', 'SECTORAL', false, [S.ushqim], 'Etiketimi për segmentin vegan në rritje.'],
  ['halal-cosmetics', 'Halal kozmetikë', 'SECTORAL', false, [S.kimi], 'Për tregje specifike.'],
  ['iso-27701', 'ISO 27701', 'SECTORAL', false, [S.tik], 'Menaxhimi i privatësisë së të dhënave.'],
  ['tisax', 'TISAX', 'SECTORAL', false, [S.tik], 'Kusht për projekte të industrisë auto gjermane.'],
  ['gi-origin', 'Tregues gjeografik / origjinë', 'SECTORAL', false, [S.artizanat], 'Mbrojtja e origjinës së produktit.'],
  ['ip-trademark-kipa', 'Mbrojtje IP: markë & dizajn (KIPA)', 'SECTORAL', false, [S.artizanat], 'Regjistrimi i markës/dizajnit — lidhet me udhëzuesin KIPA.'],
]

async function main() {
  let created = 0, updated = 0
  for (let i = 0; i < CERTS.length; i++) {
    const [code, name, kind, isCore, sectors, whySq] = CERTS[i]
    const data = { name, kind, isCore, sectors, whySq, sortOrder: i, isActive: true }
    const existing = await prisma.certification.findUnique({ where: { code } })
    if (existing) { await prisma.certification.update({ where: { code }, data }); updated++ }
    else { await prisma.certification.create({ data: { code, ...data } }); created++ }
  }
  const total = await prisma.certification.count()
  const byKind = await prisma.certification.groupBy({ by: ['kind'], _count: true })
  console.log(JSON.stringify({ created, updated, total, byKind }, null, 1))
}

main().finally(() => prisma.$disconnect())
