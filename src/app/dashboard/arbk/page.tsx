import Link from 'next/link'
import NextLink from 'next/link'
import { Lock as LockIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Landmark, FileText, Building2, MapPin, Briefcase, Users, UserCog, Wallet,
  Ban, GitBranch, Copy, XCircle, Globe, ExternalLink, AlertTriangle,
  ChevronRight, CheckCircle2, Monitor, Building, Phone, Info, Download, ScrollText,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { arbkTemplateLabel } from '@/lib/arbk-templates'

export const dynamic = 'force-dynamic'

// Gating i pakos (§11): FREE sheh {n} procedurat e para; pjesa tjeter kerkon Professional.
async function fullAccessForSession(): Promise<boolean> {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('@/lib/auth')
  const session = await getServerSession(authOptions)
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')
  const role = String((session?.user as { role?: string })?.role ?? '')
  return ['PROFESSIONAL', 'ENTERPRISE'].includes(tier) || ['ADMIN', 'SUPER_ADMIN'].includes(role)
}


const LAST_VERIFIED = '2026-06-15'
const OFFICIAL_URL = 'https://arbk.rks-gov.net'
const EKOSOVA_URL = 'https://ekosova.rks-gov.net'

interface Procedure {
  icon: React.ComponentType<{ className?: string }>
  title: string
  intro: string
  whoFor: string
  documents: { name: string; note?: string }[]
  steps: string[]
  fee: string
  timeframe: string
  goodToKnow?: string[]
  officialLawRef?: string
  templateKeys?: string[]
  showStatuteExplainer?: boolean
}

const OFFICES = [
  { region: 'Prishtinë (Qendra)', address: 'Rruga UÇK, Prishtinë', phone: '+383 38 200 36 601' },
  { region: 'Prizren', address: 'Zyra Rajonale ARBK, Prizren', phone: '+383 29 244 000' },
  { region: 'Pejë', address: 'Zyra Rajonale ARBK, Pejë', phone: '+383 39 434 000' },
  { region: 'Ferizaj', address: 'Zyra Rajonale ARBK, Ferizaj', phone: '+383 290 320 000' },
  { region: 'Gjilan', address: 'Zyra Rajonale ARBK, Gjilan', phone: '+383 280 320 000' },
  { region: 'Mitrovicë', address: 'Zyra Rajonale ARBK, Mitrovicë', phone: '+383 28 530 000' },
  { region: 'Gjakovë', address: 'Zyra Rajonale ARBK, Gjakovë', phone: '+383 390 320 000' },
]

const REGISTRIME: Procedure[] = [
  {
    icon: Briefcase,
    title: 'Biznes Individual (B.I.)',
    intro: 'Forma më e thjeshtë dhe më e shpejtë e biznesit. Ti si person fizik je "pronari-drejtor-punëtor" në një. Por ki kujdes një gjë të rëndësishme: përgjigjesh me pasurinë tënde personale (shtëpinë, veturën) nëse biznesi ka borxhe. Prandaj për aktivitete me rrezik më të lartë ose kur planifikon të rritesh, mendo për SH.P.K.',
    whoFor: 'E përshtatshme kur je vetëm ti si pronar, kur aktiviteti është relativisht i vogël (dyqan, servis, konsulencë personale, bar, kafe e vogël, kabinet), dhe kur je i gatshëm ta mbash me pasurinë tënde personale.',
    documents: [
      { name: 'Letërnjoftimi ose pasaporta (kopje e qartë)' },
      { name: 'Adresa e biznesit', note: 'Kjo mund të jetë edhe shtëpia jote ose ndonjë ambient tjetër. Duhet të kesh të drejtë ta përdorësh (mund të jetë e jotja, me qira, ose me pëlqim të pronarit).' },
      { name: 'Kodi NACE i aktivitetit', note: 'E gjen te dokumenti PDF i ASK-së — do të ta lidhim më poshtë.' },
      { name: 'Emri i biznesit', note: 'Verifiko paraprakisht që s\'ekziston tjetri me atë emër.' },
    ],
    steps: [
      'Kontrollo emrin e biznesit te portali ARBK — sigurohu që s\'është i zënë.',
      'Nëse regjistrohesh online: krijo llogari te arbk.rks-gov.net, plotëso formularin online, ngarko dokumentet.',
      'Nëse regjistrohesh fizikisht: shko te zyra e ARBK-së (Prishtinë ose ndonjë rajon) me dokumentet me vete.',
      'Paguan tarifën e regjistrimit — sot me karte, mund të bëhet edhe online.',
      'Prit certifikatën elektronike, që zakonisht të vjen brenda 1-3 ditësh pune përmes email-it. Nëse regjistrohesh fizikisht, ka raste kur ta japin që në ditë.',
      'Merr numrin e biznesit + numrin fiskal.',
      'Pas certifikatës: aktivizim EDI te ATK, hapja e llogarisë bankare, dhe zgjedhja e kontabilistit nëse do të përdorësh të jashtëm.',
    ],
    fee: 'Zakonisht simbolike (poshtë 10 EUR). Verifikoje aktualen te portali ARBK sepse ndryshon herë pas here.',
    timeframe: '1-3 ditë pune',
    goodToKnow: [
      'Statuti dhe akti themelues nuk kërkohen për Biznes Individual. Është forma me më së paku dokumente.',
      'Nëse ke kontratë me qiradhënësin, s\'e ke nevojë ta noterizosh — mjafton kopja.',
      'Për shtëpinë tënde, mund të deklarosh që është selia dhe s\'ke nevojë kontratë.',
    ],
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, neni 12',
  },
  {
    icon: Building2,
    title: 'Shoqëri me Përgjegjësi të Kufizuar (SH.P.K.)',
    intro: 'SH.P.K. është forma që zgjedh shumica e bizneseve serioze. Përgjegjësia jote financiare është e kufizuar në kapitalin që ke investuar — do të thotë që nëse biznesi falimenton, kreditorët nuk mund të prekin shtëpinë ose pasurinë tënde personale. Kjo është dallimi kryesor nga Biznesi Individual.',
    whoFor: 'E përshtatshme kur planifikon një biznes serioz me rrezik financiar, kur ke bashkëpronarë ose planifikon të kesh, kur do të tërheqësh investitorë ose të aplikosh për grante më vonë. Është forma standard për shumicën e SME.',
    documents: [
      { name: 'Letërnjoftimi për çdo pronar dhe për drejtorin (mund të jetë i njëjti person)' },
      { name: 'Statuti i shoqërisë', note: 'Ligjërisht mjafton të jetë me shkrim dhe i nënshkruar nga pronarët. Noterizimi nuk është detyrim absolut, por rekomandohet për siguri ligjore, veçanërisht kur ka disa pronarë. Kostoja e noterizimit është zakonisht 30-80 EUR.' },
      { name: 'Marrëveshja e pronarëve ("akti themelues")', note: 'Kërkohet vetëm kur ka më shumë se një pronar. Kjo është marrëveshja mes tyre për përqindjet, të drejtat dhe detyrimet. Njësoj si me statutin — noterizimi rekomandohet por s\'është gjithmonë i detyrueshëm.' },
      { name: 'Vendimi për emërimin e drejtorit', note: 'Nëse pronari është edhe drejtori, thjesht një vendim i thjeshtë me shkrim. Nëse drejtori është dikush tjetër, atëherë ai duhet të japë pëlqimin.' },
      { name: 'Dëshmi për adresën e biznesit', note: 'Mund të jetë kontratë qiraje, akt-pronësia nëse biznesi është pronari, ose deklaratë/pëlqim nga pronari i lokacionit (p.sh. nëse selia është në shtëpinë e babait, mjafton pëlqimi i tij me firmë).' },
      { name: 'Kodet NACE për aktivitetin', note: 'Mund të kesh një ose disa kode. Zgjidh atë kryesor + shtesa nëse aktiviteti është i larmishëm.' },
    ],
    steps: [
      'Kontrollo emrin e biznesit te portali ARBK — kërko për të parë a është i lirë.',
      'Përgatit statutin. Mund ta bësh vetë me template të thjeshta, ose me ndihmën e noterit/avokatit për siguri më të madhe.',
      'Nëse ka bashkëpronarë: përgatit marrëveshjen mes jush ("akt themelues") që tregon përqindjet e secilit.',
      'Merr vendimin për emërimin e drejtorit (mund të jetë vetë pronari, ose dikush që e emëroni).',
      'Regjistrohu në një nga tri mënyrat: (a) online te arbk.rks-gov.net, (b) përmes eKosova, ose (c) fizikisht në një zyrë ARBK.',
      'Ngarko/dorëzo dokumentet dhe paguaj tarifën e regjistrimit.',
      'Prit certifikatën elektronike (3-5 ditë pune është normale). Kur ta marrësh, ke: certifikatën, numrin e biznesit, numrin fiskal.',
      'Pas certifikatës: aktivizim i qasjes EDI te ATK, hapje e llogarisë bankare të plotë, autorizim i kontabilistit.',
      'Për kapitalin fillestar: ligji kërkon min. 1 EUR, por bankat në praktikë presin që të kesh diçka reale (100-500 EUR) kur hap llogarinë.',
    ],
    fee: 'ARBK: tarifa e regjistrimit + kontrolli i emrit. Noteria (opsionale): 30-80 EUR për statutin, 20-40 EUR për aktin themelues. Verifiko shumat aktuale te portali ARBK.',
    timeframe: '3-7 ditë pune (varet nga sa shpejt përgatiten dokumentet)',
    goodToKnow: [
      'Statuti është kontratë me vetë biznesin. Përcaktoji qartë çështjet e menaxhimit, ndarjen e fitimit, procedurën e daljes së pronarëve.',
      'Nëse je vetëm pronar, mos u shqetëso për "marrëveshjen mes pronarëve" — kjo kërkohet vetëm kur jeni disa.',
      'Kapitali fillestar i deklaruar në statut mund të jetë simbolik (100 EUR), por për projekte serioze, deklaro shumën reale që planifikon të investosh.',
      'Nëse harron një element në statut, mund të bësh amendament më vonë me vendim të Kuvendit.',
    ],
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 76-140',
    templateKeys: ['statut', 'marreveshje', 'akt-themelimi', 'vendim-drejtori', 'pelqim-drejtori'],
    showStatuteExplainer: true,
  },
  {
    icon: Building2,
    title: 'Shoqëri Aksionare (Sh.A.)',
    intro: 'Sh.A. është forma për ndërmarrjet e mëdha me shumë investitorë. Kapitali ndahet në aksione që mund të blihen dhe shiten. Kjo është forma që përdorin bankat, kompanitë e sigurimeve, dhe shpesh kompanitë që planifikojnë të listohen në bursë. Për shumicën e bizneseve, kjo formë është më e komplikuar sesa e nevojshme.',
    whoFor: 'E përshtatshme kur planifikon të tërheqësh shumë investitorë, kur do të operosh në sektorë të rregulluar (bankë, sigurime, telekom), kur planifikon rritje me kapital të huaj, ose kur don të listohesh në bursë në të ardhmen.',
    documents: [
      { name: 'Statuti i shoqërisë aksionare', note: 'Për Sh.A. kërkohen norma më strikte të përmbajtjes. Rekomandohet të përgatitet me avokat.' },
      { name: 'Akt themelues me listën e aksionarëve dhe aksionet e tyre' },
      { name: 'Vendimi për emërimin e Këshillit Drejtues (KD)', note: 'Sh.A. duhet të ketë KD me së paku 3 anëtarë.' },
      { name: 'Dëshmi për depozitimin e kapitalit themeltar minimal', note: 'Aktualisht minimumi ligjor është 25,000 EUR. Verifikoje shumën aktuale te ligji sepse mund të jetë ndryshuar.' },
      { name: 'Letërnjoftim për çdo anëtar të KD dhe çdo aksionar themelues' },
      { name: 'Adresa e selisë', note: 'Njësoj si me SH.P.K. — dëshmi për të drejtë përdorimi.' },
    ],
    steps: [
      'Rekomandohet fort të angazhosh avokat për strukturimin e statutit dhe akteve.',
      'Depoziton kapitalin themeltar në një llogari bankare të përkohshme.',
      'Noterizim i statutit dhe akteve.',
      'Regjistrim te ARBK me formularin përkatës për Sh.A.',
      'Nëse aktiviteti është i rregulluar (bankë, sigurime), do të nevojiten leje shtesë nga rregullatori (BQK për banka, AFSA për sigurime).',
    ],
    fee: 'Kapital minimal 25,000 EUR (verifikoje) + tarifat noteriale të lartësuara + tarifat ARBK + honorari i avokatit.',
    timeframe: '2-4 javë',
    goodToKnow: [
      'Për shumicën e projekteve, SH.P.K. është më praktike dhe më e lirë. Shko te Sh.A. vetëm kur ke arsye specifike.',
      'Rregullat për menaxhimin (Kuvend + KD + Këshill Mbikëqyrës) janë të komplikuara krahasuar me SH.P.K.',
    ],
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 141-249',
    templateKeys: ['statut', 'akt-themelimi', 'vendim-drejtori', 'pelqim-drejtori'],
    showStatuteExplainer: true,
  },
  {
    icon: Users,
    title: 'Ortakëri e Përgjithshme (O.P.)',
    intro: 'Ortakëria e Përgjithshme është kur dy ose më shumë persona bashkohen për të operuar biznes së bashku, ku të gjithë përgjigjen solidarisht me pasurinë personale. Është një formë e vjetër që përdoret më rrallë sot, kryesisht për praktika profesionale (kabinete ligjore, kontabilitet, konsulencë).',
    whoFor: 'E përshtatshme kur bashkë me partnerin ose partnerët e biznesit keni besim të plotë reciprok, planifikoni një aktivitet të thjeshtë profesional, dhe s\'ju shqetëson që të përgjigjeni me pasurinë personale.',
    documents: [
      { name: 'Marrëveshja e ortakërisë', note: 'Rekomandohet noterizimi për të mbrojtur të drejtat e secilit ortak. Duhet të përcaktojë qartë ndarjen e fitimit, përgjegjësitë, dhe procedurën për largimin ose vdekjen e një ortaku.' },
      { name: 'Letërnjoftim për secilin ortak' },
      { name: 'Adresa e biznesit' },
      { name: 'Kod NACE i aktivitetit' },
    ],
    steps: [
      'Përgatit marrëveshjen e ortakërisë — kjo është dokumenti më i rëndësishëm. Rekomandohet të bëhet me avokat sepse ortakëritë shpesh prishen dhe marrëveshja e mirë të mbron.',
      'Regjistroni ortakërinë te ARBK.',
      'Regjistrohuni te ATK. Kujdes: ortakëritë tatohen te niveli i çdo ortaku individualisht (tatim personal), jo si shoqëri.',
    ],
    fee: 'Noteri për marrëveshjen (opsional por rekomandohet) + tarifa ARBK.',
    timeframe: '3-7 ditë pune',
    goodToKnow: [
      'Rreziku më i madh i O.P.: çdo ortak mund t\'i angazhojë të gjithë të tjerët me veprimet e tij. Nëse njëri firmoson kontratë të keqe, të gjithë përgjigjeni.',
      'Nëse s\'e ke besimin absolut te bashkëpartneri/të, shqyrto SH.P.K. në vend të O.P.',
    ],
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 24-42',
    templateKeys: ['marreveshje'],
  },
  {
    icon: Users,
    title: 'Ortakëri e Kufizuar (O.K.)',
    intro: 'Ortakëria e Kufizuar është një kombinim: disa ortakë janë "të përgjithshëm" (menaxhojnë biznesin dhe përgjigjen me pasurinë personale), të tjerët janë "të kufizuar" (thjesht kanë investuar fonde dhe përgjigjen vetëm deri në atë shumë). Përdoret rrallë por është opsion i vlefshëm në raste specifike.',
    whoFor: 'E përshtatshme kur ke një ortak që do të menaxhojë biznesin aktivisht dhe një ose më shumë investitorë pasivë që s\'duan përgjegjësi personale. Praktikisht, sot është më e zakonshme që kjo strukturë të arrihet me SH.P.K. me përqindje të ndryshme.',
    documents: [
      { name: 'Marrëveshje ortakërie me ndarje të qartë: kush është "i përgjithshëm" dhe kush "i kufizuar"' },
      { name: 'Kontributet e secilit ortak', note: 'Ortakët e përgjithshëm shpesh kontribuojnë me punë, të kufizuarit me fonde.' },
      { name: 'Të tjera si Ortakëria e Përgjithshme' },
    ],
    steps: [
      'Përgatit marrëveshjen te noteri me ndarje të qartë të kategorive.',
      'Regjistroni te ARBK.',
      'Regjistroni te ATK.',
    ],
    fee: 'Ngjashme me O.P.',
    timeframe: '3-7 ditë pune',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 43-75',
    templateKeys: ['marreveshje'],
  },
  {
    icon: Globe,
    title: 'Degë e Kompanisë së Huaj',
    intro: 'Kjo formë përdoret kur ke tashmë një kompani të regjistruar jashtë Kosovës dhe don ta operosh direkt në Kosovë pa krijuar një entitet të ri të pavarur. Dega është pjesë e kompanisë mëmë, jo shoqëri e re.',
    whoFor: 'E përshtatshme për kompani të huaja (nga diaspora ose nga jashtë) që kanë tashmë biznes në vendin ku janë të regjistruara dhe duan të operojnë në Kosovë. P.sh. një kompani gjermane që hap degë në Prishtinë.',
    documents: [
      { name: 'Certifikata e regjistrimit të kompanisë mëmë', note: 'Duhet të jetë e apostiluar në vendin e origjinës + e përkthyer në shqip nga përkthyes gjyqësor në Kosovë.' },
      { name: 'Statuti i kompanisë mëmë (i apostiluar dhe i përkthyer)' },
      { name: 'Vendim i organit kompetent për hapjen e degës në Kosovë' },
      { name: 'Autorizim për përfaqësuesin ligjor të degës', note: 'Duhet të emërosh dikë rezident në Kosovë si përfaqësues ligjor. Ky mund të jetë familjar, avokat, ose partner.' },
      { name: 'Adresa e degës në Kosovë' },
    ],
    steps: [
      'Merr apostille në vendin e origjinës për të gjitha dokumentet zyrtare.',
      'Përktheji dokumentet nga përkthyes gjyqësor i licencuar në Kosovë.',
      'Emëro përfaqësuesin ligjor rezident dhe merr autorizimin nga kompania mëmë.',
      'Regjistro degën te ARBK. Kjo mund të kërkojë praninë tënde ose të përfaqësuesit fizikisht.',
      'Aktivizo qasjen EDI te ATK. Dega tatohet si njësi më vete në Kosovë.',
    ],
    fee: 'Apostille (varet nga vendi) + përkthimet (~50-150 EUR sipas vëllimit) + noteria + tarifat ARBK.',
    timeframe: '3-6 javë (varet nga shpejtësia e apostille në vendin e origjinës)',
    goodToKnow: [
      'Për diasporën që tashmë ka kompani jashtë (Gjermani, Zvicër, etj.), dega është alternative ndaj hapjes së një SH.P.K. së re. Konsulto kontabilistin për ta parë cila është më praktike tatimore për ty.',
      'Dega nuk krijon entitet të ri — përgjegjësia mbetet e kompanisë mëmë.',
    ],
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 250-260',
  },
]

const NDRYSHIMET: Procedure[] = [
  {
    icon: MapPin,
    title: 'Ndryshim i adresës së biznesit',
    intro: 'Kur biznesi zhvendos zyrat, magazinën, dyqanin ose adresën juridike, duhet ta lajmërosh ARBK-në brenda një afati të arsyeshëm. Ky është një nga ndryshimet më të shpeshta.',
    whoFor: 'Për çdo biznes që ndryshon vendndodhjen fizike të selisë ose të njësisë.',
    documents: [
      { name: 'Vendim i pronarit ose i Kuvendit të ortakëve për ndryshimin e adresës', note: 'Për BI, mjafton një deklarim i thjeshtë me firmë. Për SH.P.K./Sh.A., duhet vendim formal.' },
      { name: 'Dëshmi për të drejtën e përdorimit të adresës së re', note: 'Kjo NUK duhet gjithmonë të jetë kontratë qiraje ose akt-pronësia. Mund të jetë: (a) kontratë qiraje, (b) akt-pronësia nëse biznesi është pronari, (c) letër-pëlqim nga pronari i lokacionit (p.sh. nëse selia është në shtëpinë e prindërve), (d) për BI, deklaratë personale nëse është shtëpia jote.' },
    ],
    steps: [
      'Kyçu te portali ARBK me llogarinë e biznesit tënd.',
      'Zgjidh nga menyja e ndryshimeve opsionin "Ndryshim adrese" ose "Ndryshim i të dhënave".',
      'Plotëso formularin online me adresën e re + arsyen (opsionale).',
      'Bashkangjit vendimin dhe dëshminë e adresës.',
      'Paguan tarifën simbolike të ndryshimit.',
      'Prit certifikatën e re me adresën e re — zakonisht 1-3 ditë pune.',
      'Njofto ATK-në për ndryshimin (mund të bëhet nga vetë EDI-t).',
      'Njofto bankën dhe furnizuesit e rëndësishëm.',
    ],
    fee: 'Simbolike, zakonisht poshtë 10 EUR. Verifikoje aktualen.',
    timeframe: '1-3 ditë pune',
    goodToKnow: [
      'Nuk ka "formular të veçantë" në letër për këtë — bëhet online përmes portalit ARBK ose fizikisht duke plotësuar formularin që të jep zyra.',
      'Nëse ndryshon vetëm dyqanin/magazinën (jo selinë juridike), ndryshoji të dyja — selia juridike dhe njësia tregtare — janë të ndara.',
      'Pas certifikatës së re, ki kujdes të përditësosh çdo dokument që përmban adresën (kontrata, faturat, headerat e email-it).',
    ],
  },
  {
    icon: FileText,
    title: 'Ndryshim/shtim/heqje i aktivitetit (kodet NACE)',
    intro: 'Kur zgjeron ose ngushton aktivitetin e biznesit, duhet të përditësosh kodet NACE te ARBK. P.sh. nëse hyre në eksport, do shtosh kod për tregtinë ndërkombëtare.',
    whoFor: 'Për çdo biznes që fillon ose ndalon një aktivitet nga ai i deklaruar në fillim.',
    documents: [
      { name: 'Vendim për ndryshimin/shtimin/heqjen e aktivitetit', note: 'Për SH.P.K./Sh.A., vendim i Kuvendit. Për BI, thjesht deklaratë personale.' },
      { name: 'Kodet e reja NACE që do të shtohen ose atat që do të hiqen' },
      { name: 'Licencë e veçantë nëse aktiviteti i ri e kërkon', note: 'Disa aktivitete (medikamente, arma, financiare, transport ndërkombëtar) kërkojnë licencë specifike nga institucionet përkatëse para se të mund t\'i shtosh te ARBK.' },
    ],
    steps: [
      'Kyçu te portali ARBK.',
      'Zgjidh "Ndryshim aktiviteti" ose "Përditësim i kodeve NACE".',
      'Shto kodet e reja nga lista e sistemit ose hiq ato ekzistuese.',
      'Bashkangjit vendimin dhe licencat nëse janë të nevojshme.',
      'Paguan tarifën.',
      'Prit certifikatën e re me listën e re të aktiviteteve.',
      'Njofto ATK-në — kjo është kritike sepse mund të ndryshojë regjimin tatimor (p.sh. TVSH për importues).',
    ],
    fee: 'Simbolike. Verifikoje.',
    timeframe: '1-3 ditë pune',
    goodToKnow: [
      'Zgjedh kodet me kujdes — kodi kryesor NACE ndikon në statistikat e biznesit, në kërkesa për licencë, dhe në regjimin tatimor.',
      'Mund të kesh disa kode njëkohësisht: një kryesor + disa dytësore. Kryesori duhet të jetë ai që gjeneron pjesën më të madhe të qarkullimit.',
    ],
  },
  {
    icon: Wallet,
    title: 'Ndryshim i kapitalit themeltar (rritje ose ulje)',
    intro: 'Kur don ta rritësh ose ulesh kapitalin e regjistruar të shoqërisë. Aplikohet vetëm për SH.P.K. dhe Sh.A.',
    whoFor: 'Për SH.P.K./Sh.A. që dëshirojnë të reflektojnë investime të reja, hyrjen e aksionarëve, ose zvogëlim pas humbjeve.',
    documents: [
      { name: 'Vendim i Kuvendit të aksionarëve/ortakëve për ndryshimin', note: 'Për SH.P.K. zakonisht kërkohet shumica e cilësuar (p.sh. 3/4 të votave). Për Sh.A. procedura është më strikte.' },
      { name: 'Dëshmi për pagesën e kapitalit të ri (për rritje)', note: 'Zakonisht një konfirmim bankar që fondet janë depozituar.' },
      { name: 'Statuti i ndryshuar', note: 'Nëse kapitali është pjesë e statutit, duhet të përditësohet.' },
      { name: 'Për ulje: publikim në Gazetën Zyrtare + afat për kreditorë', note: 'Kjo është për të mbrojtur kreditorët që mund të kërkojnë detyrimet e tyre para se kapitali të ulet.' },
    ],
    steps: [
      'Mblidh Kuvendin dhe merr vendimin.',
      'Nëse është rritje: depoziton fondet në llogarinë bankare të biznesit dhe merr konfirmim.',
      'Nëse është ulje: publiko njoftimin në Gazetën Zyrtare dhe prit afatin ligjor (zakonisht 3 muaj) për kreditorët.',
      'Regjistro ndryshimin te ARBK me vendimin, statutin e ri, dhe dëshmitë.',
      'Njofto ATK dhe bankën.',
    ],
    fee: 'Varion; për Sh.A. ka procedurë më komplekse.',
    timeframe: 'Rritje: 3-7 ditë. Ulje: 3+ muaj për shkak të njoftimit të kreditorëve.',
  },
  {
    icon: UserCog,
    title: 'Ndryshim i drejtorit ose përfaqësuesit ligjor',
    intro: 'Kur ndërron drejtorin ekzistues, ose shton përfaqësues shtesë (p.sh. zëvendës-drejtor).',
    whoFor: 'Për çdo shoqëri kur ndryshon menaxhmenti ose përfaqësimi ligjor.',
    documents: [
      { name: 'Vendim i Kuvendit ose organit kompetent', note: 'Për Sh.A. duhet vendim i KD. Për SH.P.K. vendim i Kuvendit të ortakëve.' },
      { name: 'Letërnjoftim i drejtorit të ri' },
      { name: 'Pëlqim me shkrim i drejtorit të ri që pranon detyrën' },
      { name: 'Letra e dorëheqjes nëse drejtori i mëparshëm ka dhënë dorëheqje' },
    ],
    steps: [
      'Merr vendimin.',
      'Regjistro ndryshimin online.',
      'Njofto ATK/EDI — drejtori i ri duhet të ketë autorizim për të nënshkruar në sistemet tatimore.',
      'Njofto bankën për ndryshimin e nënshkruesit të llogarisë.',
    ],
    fee: 'Simbolike.',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: Users,
    title: 'Ndryshim i pronarit ose aksionarëve',
    intro: 'Kur një pronar shet pjesën, jep pjesën me trashëgimi, ose kur shitet shoqëria nga një pronar te tjetri.',
    whoFor: 'Për çdo shoqëri që ka ndryshim në përbërjen e pronarëve.',
    documents: [
      { name: 'Kontratë shitblerje e noterizuar', note: 'Për transfer aksionesh/pjesësh mes personave. Noterizimi është praktikisht i domosdoshëm për vlefshmërinë ligjore.' },
      { name: 'Vendim trashëgimie', note: 'Në rast të vdekjes së pronarit.' },
      { name: 'Statuti i ndryshuar nëse ndryshojnë përqindjet' },
      { name: 'Miratim nga ortakët e tjerë', note: 'Nëse statuti kërkon miratim për shitjen e pjesës (shumë statute e kërkojnë "të drejtën e parashitjes").' },
    ],
    steps: [
      'Kontrollo statutin — a kërkon miratim nga ortakët e tjerë për shitjen? Nëse po, mblidhi para se të firmoni kontratën.',
      'Përgatit kontratën te noteri.',
      'Paguan tatimin mbi fitimin kapital nëse ka (p.sh. e shet për më shumë sesa e ke blerë).',
      'Regjistro ndryshimin te ARBK me kontratën dhe statutin e ndryshuar.',
      'Njofto ATK-në.',
    ],
    fee: 'Noteri (varet nga vlera e transaksionit) + eventual tatim mbi fitimin kapital.',
    timeframe: '1-2 javë',
  },
  {
    icon: FileText,
    title: 'Ndryshim i emrit të biznesit',
    intro: 'Kur don ta ndryshosh emrin tregtar që shfaqet në certifikatë. Zakonisht bëhet gjatë rebrendimit.',
    whoFor: 'Për biznese që bëjnë rebranding ose ndryshojnë strategjinë e marketingut.',
    documents: [
      { name: 'Vendim për ndryshimin' },
      { name: 'Statut i ndryshuar (SH.P.K./Sh.A.)' },
    ],
    steps: [
      'Kontrollo në portalin ARBK a është i lirë emri i ri.',
      'Merr vendimin.',
      'Për SH.P.K./Sh.A.: ndrysho statutin.',
      'Regjistro ndryshimin online.',
      'Pas certifikatës së re: njofto ATK, bankën, klientët, furnizuesit. Përditëso vulën nëse e ke, materialet e marketingut, faqen web, headerat e email-it.',
    ],
    fee: 'Tarifa e kontrollit të emrit + tarifa e ndryshimit + noteria për statutin (nëse e noterizon).',
    timeframe: '3-7 ditë pune',
  },
  {
    icon: GitBranch,
    title: 'Hapje ose mbyllje e njësisë brenda Kosovës',
    intro: 'Kur hap një pikë të re (dyqan, magazinë, filial) në një komunë tjetër, ose kur mbyll një njësi ekzistuese.',
    whoFor: 'Për biznese me disa pika operimi.',
    documents: [
      { name: 'Vendim për hapjen/mbylljen' },
      { name: 'Dëshmi për të drejtën e përdorimit të lokacionit të ri', note: 'Njësoj si me adresën — kontratë qiraje, akt-pronësia, ose letër-pëlqim.' },
      { name: 'Kodi NACE i aktivitetit të njësisë (mund të jetë ndryshe nga selia)' },
    ],
    steps: [
      'Merr vendimin.',
      'Regjistro njësinë e re online.',
      'Merr certifikatën për njësinë.',
      'Njofto ATK për të aktivizuar/çaktivizuar njësinë tatimore.',
    ],
    fee: 'Simbolike.',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: Copy,
    title: 'Dublikat i certifikatës',
    intro: 'Kur ke humbur ose të është dëmtuar certifikata origjinale dhe të nevojitet një kopje e re zyrtare.',
    whoFor: 'Për çdo biznes që ka humbur certifikatën.',
    documents: [
      { name: 'Deklarim për humbjen', note: 'Në rast humbjeje, deklarim personal.' },
      { name: 'Kërkesa online' },
    ],
    steps: [
      'Kyçu te portali ARBK.',
      'Zgjidh "Kërkesë për dublikat".',
      'Bashkangjit deklarimin nëse është humbje.',
      'Paguan tarifën.',
      'Merr dublikatin — shpesh menjëherë si PDF.',
    ],
    fee: 'Simbolike.',
    timeframe: 'Menjëherë deri në 1 ditë pune.',
  },
  {
    icon: Ban,
    title: 'Pezullim i përkohshëm i aktivitetit',
    intro: 'Kur don ta ndalosh biznesin për një periudhë (sezonalitet, ristrukturim, arsye personale) por nuk don ta mbyllësh përgjithmonë.',
    whoFor: 'Biznese që kanë ndërprerje të përkohshme (turizmi jashtë sezoni, konstruksion në pauzë, etj.).',
    documents: [
      { name: 'Vendim për pezullim' },
      { name: 'Njoftim te ATK për pezullim tatimor', note: 'Pa këtë, do të vazhdojnë të vijnë detyrimet tatimore edhe pse s\'ke aktivitet.' },
    ],
    steps: [
      'Merr vendimin.',
      'Regjistro pezullimin te ARBK.',
      'Njofto ATK me kërkesë për "pezullim aktiviteti".',
      'Gjatë pezullimit: deklaron "zero aktivitet" te ATK, s\'paguan tatime mbi qarkullimin.',
      'Kur riaktivizohesh, njofto sërish ARBK dhe ATK.',
    ],
    fee: 'Simbolike.',
    timeframe: '3-5 ditë pune',
  },
  {
    icon: XCircle,
    title: 'Çregjistrim (mbyllje e biznesit)',
    intro: 'Kur don ta mbyllësh përfundimisht biznesin. Është procedurë më e komplikuar sepse duhet të shlyesh të gjitha detyrimet përpara.',
    whoFor: 'Biznese që ndalojnë aktivitetin përfundimisht.',
    documents: [
      { name: 'Vendim i Kuvendit për shpërbërje' },
      { name: 'Certifikatë "pa detyrime" nga ATK', note: 'Kjo është pjesa më kritike dhe që merr më shumë kohë. ATK verifikon që s\'ke borxhe tatimore para se ta lëshojë.' },
      { name: 'Bilanc likuidimi', note: 'Për SH.P.K./Sh.A. shpesh kërkohet edhe raport i auditorit.' },
      { name: 'Publikim në Gazetën Zyrtare', note: 'Për informim kreditorëve.' },
      { name: 'Dëshmi për shlyerjen e detyrimeve ndaj punonjësve, kreditorëve, ATK-së' },
    ],
    steps: [
      'Merr vendimin e shpërbërjes.',
      'Njofto ATK-në për fillimin e likuidimit.',
      'Paguaj/shly të gjitha detyrimet: tatime, punonjës, kreditorë, furnizues.',
      'Publiko njoftimin e likuidimit në Gazetën Zyrtare — afat 3 muaj për kreditorë.',
      'Merr certifikatën "pa detyrime" nga ATK.',
      'Regjistro likuidimin final te ARBK.',
      'Mbyll llogarinë bankare.',
      'Ruaj arkivën së paku 7-10 vjet sipas ligjit tatimor.',
    ],
    fee: 'Auditori (për SH.P.K./Sh.A.) + publikimi në Gazetë + noteria + tarifat ARBK.',
    timeframe: '3-9 muaj — kryesisht për shkak të certifikatës "pa detyrime" nga ATK.',
    goodToKnow: [
      'Mos e nis çregjistrimin pa i shlyer paraprakisht të gjitha detyrimet. Nëse ke borxhe të pashlyera, ATK s\'do të lëshojë certifikatën "pa detyrime" dhe procesi ngec.',
      'Nëse s\'e ke aktivitet por s\'don shpenzimet e çregjistrimit tani, pezullimi është alternativë më e lirë.',
    ],
  },
]

function ProcedureCard({ p, available }: { p: Procedure; available: Set<string> }) {
  const Icon = p.icon
  return (
    <details className="rounded-xl border border-gray-200 bg-white group">
      <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{p.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{p.intro}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">{p.intro}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Për kë është</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{p.whoFor}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dokumentet që të duhen</h4>
          <ul className="space-y-2.5">
            {p.documents.map((d, i) => (
              <li key={i} className="text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-gray-400 mt-1 shrink-0" />
                  <div>
                    <span className="font-medium">{d.name}</span>
                    {d.note && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{d.note}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Si të veprosh, hap pas hapi</h4>
          <ol className="space-y-2">
            {p.steps.map((step, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {p.showStatuteExplainer && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ScrollText className="h-4 w-4 text-indigo-700" />
              <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Çka është statuti dhe ku e merr</h4>
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">
              Statuti është &laquo;kushtetuta&raquo; e brendshme e shoqërisë tënde: dokumenti që përcakton kush janë
              pronarët e me sa përqindje, kush e drejton, si ndahet fitimi, si merren vendimet dhe çka ndodh
              kur një pronar del. Për një pronar të vetëm mjafton një statut i thjeshtë; kur ka disa pronarë,
              ai është mbrojtja jote kur lindin mosmarrëveshje.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-indigo-900">
              <li className="flex items-start gap-1.5"><span className="text-indigo-700 mt-0.5">•</span><span><strong>Template i gatshëm:</strong> shkarko modelin më poshtë dhe plotëso të dhënat e tua — mjafton për rastet e thjeshta.</span></li>
              <li className="flex items-start gap-1.5"><span className="text-indigo-700 mt-0.5">•</span><span><strong>Noter ose avokat:</strong> rekomandohet kur ka disa pronarë ose kapital të konsiderueshëm (zakonisht 30-80 EUR).</span></li>
              <li className="flex items-start gap-1.5"><span className="text-indigo-700 mt-0.5">•</span><span><strong>Vetë:</strong> ligji lejon ta hartosh vetë me shkrim dhe ta nënshkruash; noterizimi s&apos;është gjithmonë i detyrueshëm, por jep siguri.</span></li>
            </ul>
          </div>
        )}

        {p.templateKeys && p.templateKeys.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dokumentet model për shkarkim</h4>
            <div className="flex flex-wrap gap-2">
              {p.templateKeys.map((k) => available.has(k) ? (
                <a
                  key={k}
                  href={`/api/arbk-templates/${k}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1B4F72]/30 bg-[#1B4F72]/5 text-sm font-medium text-[#1B4F72] hover:bg-[#1B4F72]/10 transition-colors"
                >
                  <Download className="h-4 w-4" /> {arbkTemplateLabel(k)}
                </a>
              ) : (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400"
                  title="Do të ngarkohet së shpejti"
                >
                  <FileText className="h-4 w-4" /> {arbkTemplateLabel(k)} <span className="text-xs">(së shpejti)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs text-gray-500 mb-0.5">Sa zgjat</div>
            <div className="text-sm text-gray-900 font-medium">{p.timeframe}</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="text-xs text-green-700 mb-0.5">Regjistrimi në ARBK</div>
            <div className="text-sm text-green-900 font-semibold">Pa pagesë</div>
          </div>
        </div>

        {p.goodToKnow && p.goodToKnow.length > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Mirë të dish</h4>
            </div>
            <ul className="space-y-1.5">
              {p.goodToKnow.map((tip, i) => (
                <li key={i} className="text-xs text-blue-900 leading-relaxed flex items-start gap-1.5">
                  <span className="text-blue-700 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.officialLawRef && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Bazë ligjore:</span> {p.officialLawRef}
            </p>
          </div>
        )}
      </div>
    </details>
  )
}

export default async function ARBKGuidePage() {
  const fullAccess = await fullAccessForSession()
  const uploaded = await prisma.arbkTemplate.findMany({ select: { key: true } })
  const availableTemplates = new Set(uploaded.map((t) => t.key))
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesi ARBK</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl leading-relaxed">
          ARBK është Agjencia për Regjistrimin e Bizneseve në Kosovë. Kur don të hapësh biznes, të bësh
          ndryshime në të, ose ta çregjistrosh, kjo është institucioni ku kalojnë të gjitha procedurat.
          Këtu do të gjesh të gjitha procedurat kryesore me shpjegime hap-pas-hapi, dokumentet që të duhen,
          dhe kohën/koston që të presin.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ku dhe si mund të regjistrohesh</h2>
        <p className="text-sm text-gray-700 mb-4 max-w-3xl leading-relaxed">
          Ke tri mënyra për të kryer procedurat te ARBK. Të gjitha janë të vlefshme dhe të njohura zyrtarisht.
          Zgjidh atë që të përshtatet më mirë.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Monitor className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Online te portali ARBK</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Mënyra më e shpejtë dhe më e përdorur. Nga shtëpia ose zyra, në çdo kohë. Krijon llogari,
                plotëson formularët, ngarkon dokumentet dhe paguan online.
              </p>
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
                arbk.rks-gov.net <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <strong>Përparësi:</strong> shpejtësi, mund të bëhet nga kudo, nuk ka pritje në sportel.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Të duhet:</strong> letërnjoftim elektronik ose skanime të qarta të dokumenteve, kartë bankare.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Globe className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Përmes eKosova</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Portali qeveritar i e-shërbimeve që bashkon shumë shërbime shtetërore në një vend, përfshirë
                edhe disa shërbime të ARBK-së. E njëjta llogari punon edhe për ATK dhe të tjera.
              </p>
              <a href={EKOSOVA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
                ekosova.rks-gov.net <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <strong>Përparësi:</strong> një llogari e vetme për shumë shërbime shtetërore.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Të duhet:</strong> regjistrim i njëhershëm në eKosova. Verifikimi i identitetit mund të kërkojë një takim fizik.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
                <Building className="h-5 w-5 text-[#1B4F72]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fizikisht në zyrat e ARBK</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                Nëse preferon të kesh dikë nga ARBK që të ndihmon direkt, ose nuk je i mësuar me sistemet online,
                mund të shkosh personalisht në zyrën qendrore në Prishtinë ose në zyrat rajonale nëpër qytete.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <strong>Përparësi:</strong> asistencë direkte, mund të bësh pyetje në momentin që s\'e kupton diçka.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Të duhet:</strong> koha për ta vizituar zyrën, dokumentet fizike.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-3">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#1B4F72]" />
              Zyrat rajonale të ARBK
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Nëse zgjedh mënyrën fizike, zyra qendrore është në Prishtinë, por ke edhe këto zyra rajonale.
              Numrat mund të ndryshojnë — verifikoji te{' '}
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">portali zyrtar</a>{' '}
              para se të shkosh.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {OFFICES.map((o) => (
                <div key={o.region} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{o.region}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{o.address}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.phone}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Në disa komuna ka edhe Pika të Ofrimit të Shërbimeve (POU) ku mund të kryhen disa shërbime të ARBK-së
              më afër teje. Pyet te bashkia e komunës tënde.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifikoji tarifat dhe procedurat aktuale</p>
          <p className="leading-relaxed">
            Ky udhëzues bazohet në gjendjen e procedurave deri më <strong>{LAST_VERIFIED}</strong>. Tarifat, formularët
            dhe procedurat mund të ndryshojnë. Për një procedurë specifike, verifikoje te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">portali zyrtar ARBK</a>{' '}
            para se ta fillon.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Kontrolli i emrit të biznesit</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Para se të fillosh regjistrimin, verifiko që emri që don është i lirë. ARBK e ka këtë kontroll
              te portali. Nuk ka API automatike që ta bëjmë ne për ty — bëhet manualisht, në disa hapa:
            </p>
            <ol className="space-y-2.5 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">1</span>
                <span>Shko te <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline font-medium">arbk.rks-gov.net</a>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">2</span>
                <span>Në krye të faqes ke kutinë e kërkimit. Shkruaj emrin që dëshiron dhe kliko "Kërko".</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">3</span>
                <span>Nëse s\'del asnjë rezultat identik, emri është zakonisht i lirë dhe mund të vazhdosh me regjistrimin. Nëse del rezultat i njëjtë, do të duhet emër tjetër ose shtim variantesh (p.sh. shto "SHPK", "Prodhim", "Konsulencë").</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">4</span>
                <span>Kujdes: kontrolli online tregon vetëm çka është aktualisht i regjistruar. Nuk e rezervon emrin. Rezervimi bëhet vetëm kur aplikon zyrtarisht për regjistrim biznesi.</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Regjistrimi i biznesit — 6 forma ligjore</h2>
          <span className="text-xs text-gray-500">{REGISTRIME.length} procedura</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 max-w-3xl leading-relaxed">
          Zgjidhja e formës ligjore është vendimi më i rëndësishëm në fillim. Ndikon në atë se sa
          përgjigjesh personalisht, sa taksa paguan, dhe sa lehtë mund të tërheqësh investime më vonë.
          Ja gjashtë format kryesore, të renditura nga më e thjeshta te më e komplikuara.
        </p>
        <div className="space-y-2">
          {REGISTRIME.map((p, i) => fullAccess || i < 2 ? <ProcedureCard key={p.title} p={p} available={availableTemplates} /> : <LockedCard key={p.title} title={p.title} summary={p.intro} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Ndryshimet pas regjistrimit</h2>
          <span className="text-xs text-gray-500">{NDRYSHIMET.length} procedura</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 max-w-3xl leading-relaxed">
          Biznesi rrallëherë mbetet ashtu si e ke regjistruar në ditën e parë. Ndryshon adresa,
          shtohen aktivitete, hyjnë ose dalin pronarë. Për çdo ndryshim që prek certifikatën,
          ARBK-ja duhet të lajmërohet.
        </p>
        <div className="space-y-2">
          {NDRYSHIMET.map((p, i) => fullAccess || i < 2 ? <ProcedureCard key={p.title} p={p} available={availableTemplates} /> : <LockedCard key={p.title} title={p.title} summary={p.intro} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">NACE Codes — klasifikimi i aktivitetit</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              NACE është nomenklatura ndërkombëtare (e BE-së) që klasifikon aktivitetet ekonomike me kode 4-6 shifrore.
              Kosova përdor NACE Rev. 2. Kur regjistrohesh, duhet të zgjedhësh të paktën një kod NACE që përshkruan aktivitetin
              kryesor të biznesit tënd, plus kode dytësore nëse ke aktivitete të shumëfishta.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">Ku i gjen kodet konkrete:</p>
              <p className="text-sm text-gray-700 mb-2">
                Nuk ka nevojë t\'i mësosh përmendësh. Ne të japim dokumentin zyrtar për shkarkim dhe ti kërkon aty për aktivitetin tënd:
              </p>
              <div className="space-y-2 mt-3">
                <a href="https://ask.rks-gov.net/media/2222/nace-kodet.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline">
                  Dokumenti NACE në shqip (ASK - Agjencia e Statistikave) <ExternalLink className="h-3 w-3" />
                </a>
                <br />
                <a href="https://ec.europa.eu/eurostat/ramon/nomenclatures/index.cfm?TargetUrl=LST_NOM_DTL&StrNom=NACE_REV2" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline">
                  Baza zyrtare NACE Rev. 2 (Eurostat) <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Këshillë praktike: hape dokumentin PDF dhe përdor Ctrl+F për të kërkuar fjalët kyçe të aktivitetit tënd (p.sh. "mobilje", "software", "kafe", "përpunim").
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Pse është i rëndësishëm kodi NACE:</strong> Ai përcakton disa gjëra për biznesin tënd — a je "prodhues"
                apo "tregtar" për qëllime tatimore, a je "sherbime" apo "prodhim" për grante specifike, dhe a të duhet
                licencë e veçantë (p.sh. medikamentet). Nëse s\'je i sigurt cilin kod të zgjedhësh, konsulto kontabilistin
                ose kërko mendimin te ARBK-ja direkt.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pas certifikatës — çka të bësh menjëherë</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Certifikata e ARBK-së është fillimi, jo fundi. Ja çka duhet të bësh brenda ditëve të para që biznesi
              të fillojë të operojë ligjërisht:
            </p>
            <div className="space-y-3">
              {[
                { title: 'Aktivizim EDI/ATK', text: 'Kyçu te portali edeklarimi.atk-ks.org dhe aktivizo qasjen elektronike. Do të nevojitet për të deklaruar tatime.', link: '/dashboard/tatime' },
                { title: 'Autorizim kontabilisti (nëse do të përdorësh të jashtëm)', text: 'Nëse s\'do të bësh vetë kontabilitetin (rekomandohet), autorizoje kontabilistin te ATK me formular të veçantë.', link: '/dashboard/tatime' },
                { title: 'Hapja e llogarisë bankare', text: 'Me certifikatën dhe dokumentet, hap llogari të plotë bankare. Bankat kryesore: BPB, NLB, ProCredit, Raiffeisen, TEB, BKT.', link: '/dashboard/burime-financimi/banka' },
                { title: 'Vula e biznesit (opsionale)', text: 'Ligjërisht nuk detyrohet më, por shumë institucione ende e kërkojnë në praktikë. Kosto: 30-50 EUR.' },
                { title: 'Nëse ke punonjës', text: 'Regjistro çdo punonjës te ATK brenda 5 ditësh pune nga fillimi i punës. Përgatit kontratat e punës.', link: '/dashboard/tatime' },
                { title: 'Kontabilitet i rregullt', text: 'Nga dita e regjistrimit ke detyrim ligjor të mbash kontabilitet. Deklarimet mujore fillojnë menjëherë edhe nëse s\'ke qarkullim.', link: '/dashboard/tatime' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                    {step.link && (
                      <Link href={step.link} className="text-xs text-[#2E86C1] hover:underline font-medium mt-1 inline-block">
                        Shiko udhëzuesin →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
        Ky udhëzues është për orientim praktik dhe nuk zëvendëson këshillën profesionale. Për situata komplekse
        (Sh.A., degë të huaj, likuidim, çështje me trashëgimi), konsulto avokat ose kontabilist të licencuar. Baza
        ligjore kryesore: Ligji Nr. 06/L-016 për Shoqëritë Tregtare. Data e verifikimit të këtij udhëzuesi: {LAST_VERIFIED}.
      </p>
    </div>
  )
}

function LockedCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex items-start gap-3">
      <div className="rounded-lg bg-gray-200 p-2 shrink-0">
        <LockIcon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-500">{title}</h3>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{summary}</p>
        <NextLink href="/dashboard/subscription" className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[#1B4F72] hover:text-[#2E86C1]">
          Hapet me pakon Professional →
        </NextLink>
      </div>
    </div>
  )
}
