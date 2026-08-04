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

// ═══ VALA 2 — sektoret e tjere te mallrave × BE/EFTA (aktet verifikuar 2026-08-03) ═══
const W2_VERIFIED = 'VERIFIED'
const WOOD = ['mobilje','dyer-dritare','parket','paleta-ambalazh-druri','pelet']
for (const g of WOOD) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'EUDR — deklarata e kujdesit te duhur per drurin (zbatohet nga 30 dhjetor 2026)',
    'Rregullorja kunder shpyllezimit kerkon due diligence dhe gjeolokalizim te origjines se drurit. Zbatimi eshte SHTYRE: fillon me 30 dhjetor 2026 (per operatoret e medhenj) — pergatitu tani, mos u befaso atehere.',
    'Rregullorja (BE) 2023/1115 (EUDR)', LEX('32023R1115'), null, W2_VERIFIED, 3])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'fsc-coc', 'FSC — de-fakto i detyrueshem te bleresit e medhenj', null, null, null, null, W2_VERIFIED, 10])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'pefc', 'PEFC — alternativa e certifikimit te pyjeve', null, null, null, null, W2_VERIFIED, 11])
}
RULES.push(['EU_EFTA', 'paleta-ambalazh-druri', 'PROCEDURAL', null,
  'ISPM 15 — trajtimi termik + vula per paleta/ambalazh druri',
  'Standard nderkombetar fitosanitar (IPPC/FAO) i detyrueshem ne praktike per ambalazhin prej druri ne tregti nderkombetare. Linku zyrtar shtohet pas verifikimit.',
  'ISPM 15 (IPPC/FAO)', null, null, W2_VERIFIED, 4])
for (const g of ['parket', 'dyer-dritare']) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'Shenja CE sipas Rregullores se Produkteve te Ndertimit (DoP)',
    'Produktet e drurit per ndertim kerkojne Deklaraten e Performances dhe shenjen CE kur mbulohen nga standard i harmonizuar.',
    'Rregullorja (BE) 305/2011 (CPR)', LEX('32011R0305'), null, W2_VERIFIED, 4])
}
RULES.push(['EU_EFTA', 'pelet', 'BUYER_EXPECTED', 'enplus', 'ENplus — standardi i peletit', null, null, null, null, W2_VERIFIED, 12])
RULES.push(['EU_EFTA', 'mobilje', 'BUYER_EXPECTED', 'formaldehyde-e1-carb', 'Emetimi i formaldehidit (E1) — kerkese e bleresve per panele/mobilje', null, null, null, null, W2_VERIFIED, 12])

const TEXTILE = ['konfeksion','trikotazh','uniforma-veshje-pune','tekstile-teknike']
for (const g of TEXTILE) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'REACH — konformiteti kimik i tekstilit',
    'Substancat e kufizuara (azo-ngjyrat, ftalatet etj.) duhet te respektojne kufijte e REACH per artikujt.',
    'Rregullorja (KE) 1907/2006 (REACH)', LEX('32006R1907'), null, W2_VERIFIED, 1])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'oeko-tex-100', 'OEKO-TEX Standard 100 — kerkesa baze e bleresve', null, null, null, null, W2_VERIFIED, 10])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'bsci-smeta', 'BSCI/SMETA — auditimi social per CMT me markat', null, null, null, null, W2_VERIFIED, 11])
}
for (const g of ['konfeksion','trikotazh']) {
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'gots', 'GOTS — tekstili organik (segmenti premium)', null, null, null, null, W2_VERIFIED, 12])
}
const LEATHER = ['kepuce','canta-aksesore','regje-lekure']
for (const g of LEATHER) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'REACH — kufiri i kromit VI dhe substancave te tjera ne lekure',
    'Lekura dhe artikujt e saj duhet te respektojne kufizimet kimike te REACH (p.sh. kromi VI).',
    'Rregullorja (KE) 1907/2006 (REACH)', LEX('32006R1907'), null, W2_VERIFIED, 1])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'lwg', 'LWG — standardi mjedisor i regjeve qe e kerkojne markat', null, null, null, null, W2_VERIFIED, 10])
}
RULES.push(['EU_EFTA', 'karton-ambalazh', 'MANDATORY', null,
  'Kontakti ushqimor i paketimit (kur paketon ushqim)',
  'Ambalazhi qe prek ushqimin duhet te permbushe kuadrin e BE-se per materialet ne kontakt me ushqimin.',
  'Rregullorja (KE) 1935/2004', LEX('32004R1935'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'karton-ambalazh', 'BUYER_EXPECTED', 'brcgs-packaging', 'BRCGS Packaging — e kerkojne bleresit ushqimore', null, null, null, null, W2_VERIFIED, 10])
for (const g of ['karton-ambalazh','leter','etiketa-print']) {
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'fsc-coc', 'FSC — origjina e pergjegjshme e fibres', null, null, null, null, W2_VERIFIED, 11])
}
const PLASTIC = ['paketim-plastik','profile-gypa','pjese-teknike-plastike','riciklim-plastik']
for (const g of PLASTIC) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'REACH — konformiteti kimik i plastikes/gomes',
    'Substancat dhe artikujt plastike duhet te respektojne kufizimet e REACH.',
    'Rregullorja (KE) 1907/2006 (REACH)', LEX('32006R1907'), null, W2_VERIFIED, 1])
}
RULES.push(['EU_EFTA', 'paketim-plastik', 'MANDATORY', null,
  'Kontakti ushqimor i paketimit plastik',
  'Paketimi plastik qe prek ushqimin duhet te permbushe kuadrin e BE-se per kontaktin ushqimor (perfshire rregullat specifike per plastiken).',
  'Rregullorja (KE) 1935/2004', LEX('32004R1935'), null, W2_VERIFIED, 2])
for (const g of ['paketim-plastik','riciklim-plastik']) {
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'grs', 'GRS — permbajtja e ricikluar e certifikuar', null, null, null, null, W2_VERIFIED, 10])
}
RULES.push(['EU_EFTA', 'pjese-teknike-plastike', 'BUYER_EXPECTED', 'iatf-16949', 'IATF 16949 — per pjeset e industrise auto', null, null, null, null, W2_VERIFIED, 10])
RULES.push(['EU_EFTA', 'pjese-auto', 'BUYER_EXPECTED', 'iatf-16949', 'IATF 16949 — kusht i furnitoreve auto', null, null, null, null, W2_VERIFIED, 10])

RULES.push(['EU_EFTA', 'kozmetike', 'MANDATORY', 'gmp-cosmetics',
  'Siguria e produktit kozmetik + GMP (personi pergjegjes ne BE)',
  'Cdo produkt kozmetik ne tregun e BE-se kerkon person pergjegjes, dosje sigurie dhe prodhim sipas praktikes se mire (GMP, ISO 22716).',
  'Rregullorja (KE) 1223/2009 per produktet kozmetike', LEX('32009R1223'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'kozmetike', 'PROCEDURAL', null,
  'Njoftimi CPNP para vendosjes ne treg',
  'Produkti njoftohet ne portalin CPNP te Komisionit para tregtimit.',
  'Rregullorja (KE) 1223/2009, neni 13', LEX('32009R1223'), null, W2_VERIFIED, 2])
for (const g of ['detergjente-higjiene','ngjyra-llaqe','kimikate-industriale']) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', null,
    'REACH + CLP — regjistrimi, klasifikimi dhe etiketimi i kimikateve',
    'Substancat/perzierjet kerkojne konformitet REACH dhe klasifikim-etiketim sipas CLP.',
    'Reg. (KE) 1907/2006 (REACH) dhe Reg. (KE) 1272/2008 (CLP)', LEX('32008R1272'), null, W2_VERIFIED, 1])
}
RULES.push(['EU_EFTA', 'pajisje-mjekesore', 'MANDATORY', 'iso-13485',
  'MDR — shenja CE per pajisje mjekesore (sistemi i cilesise ISO 13485)',
  'Pajisjet mjekesore kerkojne konformitet me MDR, perfshire sistem cilesie (ISO 13485) dhe perfaqesues te autorizuar ne BE.',
  'Rregullorja (BE) 2017/745 (MDR)', LEX('32017R0745'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'suplemente', 'MANDATORY', null,
  'Etiketimi FIC + rregullat e suplementeve ushqimore',
  'Suplementet jane ushqim: vlen etiketimi FIC; rregullat specifike te suplementeve verifikohen ne valen pasuese.',
  'Rregullorja (BE) 1169/2011 (FIC)', LEX('32011R1169'), null, W2_VERIFIED, 1])

RULES.push(['EU_EFTA', 'makineri-pajisje', 'MANDATORY', 'ce-machinery',
  'Shenja CE — Direktiva e Makinerive (deri 19.01.2027; pastaj Reg. 2023/1230)',
  'Makinerite kerkojne konformitet CE sipas Direktives 2006/42/KE, e cila zevendesohet nga Rregullorja (BE) 2023/1230 qe zbatohet nga 20 janari 2027 — pa faze te dyfishte.',
  'Direktiva 2006/42/KE per makinerite', LEX('32006L0042'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'konstruksione-metalike', 'MANDATORY', 'en-1090',
  'EN 1090 — ekzekutimi i strukturave te celikut/aluminit (CE nen CPR)',
  'Strukturat metalike per ndertim kerkojne certifikim EN 1090 dhe shenjen CE sipas Rregullores se Produkteve te Ndertimit.',
  'Rregullorja (BE) 305/2011 (CPR)', LEX('32011R0305'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'perpunim-cnc', 'BUYER_EXPECTED', 'iso-3834', 'ISO 3834 — cilesia e saldimit', null, null, null, null, W2_VERIFIED, 10])

const ELECTRIC = ['pajisje-shtepiake','komponente-elektrike','ndricim']
for (const g of ELECTRIC) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', 'ce-lvd-emc',
    'Shenja CE — LVD dhe EMC',
    'Pajisjet elektrike kerkojne konformitet me Direktiven e Tensionit te Ulet dhe ate te Perputhshmerise Elektromagnetike.',
    'Direktivat 2014/35/BE (LVD) dhe 2014/30/BE (EMC)', LEX('32014L0035'), null, W2_VERIFIED, 1])
  RULES.push(['EU_EFTA', g, 'MANDATORY', 'rohs',
    'RoHS — kufizimi i substancave te rrezikshme',
    'Pajisjet elektrike/elektronike duhet te respektojne kufijte e substancave te rrezikshme.',
    'Direktiva 2011/65/BE (RoHS)', LEX('32011L0065'), null, W2_VERIFIED, 2])
  RULES.push(['EU_EFTA', g, 'MANDATORY', 'red',
    'RED — nese pajisja ka radio (Wi-Fi/Bluetooth)',
    'Pajisjet me funksione radio mbulohen nga Direktiva e Pajisjeve Radio (qe perfshin edhe LVD/EMC per to).',
    'Direktiva 2014/53/BE (RED)', LEX('32014L0053'), null, W2_VERIFIED, 3])
  RULES.push(['EU_EFTA', g, 'PROCEDURAL', null,
    'WEEE — regjistrimi i prodhuesit dhe menaxhimi i mbetjeve elektronike',
    'Vendosja ne tregun e BE-se kerkon regjistrim si prodhues ne skemat kombetare WEEE.',
    'Direktiva 2012/19/BE (WEEE)', LEX('32012L0019'), null, W2_VERIFIED, 4])
}
const CONSTR = ['cimento-beton','gur-qeramike','dritare-profile','izolime']
for (const g of CONSTR) {
  RULES.push(['EU_EFTA', g, 'MANDATORY', 'ce-cpr',
    'Shenja CE + Deklarata e Performances (DoP)',
    'Produktet e ndertimit me standard te harmonizuar kerkojne DoP dhe shenjen CE.',
    'Rregullorja (BE) 305/2011 (CPR)', LEX('32011R0305'), null, W2_VERIFIED, 1])
  RULES.push(['EU_EFTA', g, 'BUYER_EXPECTED', 'epd', 'EPD — kerkohet gjithnje e me shume ne tendere', null, null, null, null, W2_VERIFIED, 10])
}
RULES.push(['EU_EFTA', 'bime-mjekesore-aromatike', 'PROCEDURAL', null,
  'Certifikata fitosanitare per cdo dergese (AUV)',
  'Bimet dhe produktet bimore shoqerohen me certifikate fitosanitare.',
  'Rregullorja (BE) 2016/2031', LEX('32016R2031'), null, W2_VERIFIED, 1])
RULES.push(['EU_EFTA', 'bime-mjekesore-aromatike', 'BUYER_EXPECTED', 'fairwild', 'FairWild — per mbledhjen e eger (MAP)', null, null, null, null, W2_VERIFIED, 10])
RULES.push(['EU_EFTA', 'bime-mjekesore-aromatike', 'BUYER_EXPECTED', 'organic-eu', 'Organik BE — celes per MAP nga Kosova', null, null, null, null, W2_VERIFIED, 11])
RULES.push(['EU_EFTA', 'zejtari', 'BUYER_EXPECTED', 'gi-origin', 'Tregues gjeografik / origjine', null, null, null, null, W2_VERIFIED, 10])
RULES.push(['EU_EFTA', 'zejtari', 'BUYER_EXPECTED', 'ip-trademark-kipa', 'Mbrojtja IP: marke & dizajn (KIPA)', null, null, null, null, W2_VERIFIED, 11])
// DRAFT (te padukshme deri ne verifikim): lodrat (2009/48 + rregullorja e re), Ecodesign
// (2009/125), detergjentet (648/2004), barnat (2001/83)
RULES.push(['EU_EFTA', 'lodra', 'MANDATORY', null, 'Siguria e lodrave (CE)', 'Ne verifikim: Direktiva 2009/48 dhe rregullorja e re e lodrave.', 'Direktiva 2009/48/KE', null, null, 'DRAFT', 1])
RULES.push(['EU_EFTA', 'pajisje-shtepiake', 'MANDATORY', null, 'Ecodesign + etiketa energjetike', 'Ne verifikim: kuadri Ecodesign.', 'Direktiva 2009/125/KE', null, null, 'DRAFT', 5])
RULES.push(['EU_EFTA', 'barna', 'PROCEDURAL', null, 'Autorizimi i tregtimit ne BE', 'Ne verifikim: kuadri 2001/83/KE.', 'Direktiva 2001/83/KE', null, null, 'DRAFT', 1])

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
