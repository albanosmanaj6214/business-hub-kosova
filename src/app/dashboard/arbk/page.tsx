import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Landmark, FileText, Building2, MapPin, Briefcase, Users, UserCog, Wallet,
  Ban, GitBranch, Copy, XCircle, Globe, ClipboardCheck, ExternalLink,
  AlertTriangle, ChevronRight, CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-06-15'
const OFFICIAL_URL = 'https://arbk.rks-gov.net'

interface Procedure {
  icon: React.ComponentType<{ className?: string }>
  title: string
  summary: string
  when: string
  documents: string[]
  steps: string[]
  fee: string
  timeframe: string
  officialFormLink?: string
  officialLawRef?: string
}

const REGISTRIME: Procedure[] = [
  {
    icon: Briefcase,
    title: 'Biznes Individual (B.I.)',
    summary: 'Forma më e thjeshtë dhe më e shpejtë. Personi fizik përgjigjet me pasurinë personale për detyrimet e biznesit.',
    when: 'Kur pronari është një person i vetëm, aktiviteti është i vogël-mesatar dhe rreziku financiar është i menaxhueshëm.',
    documents: [
      'Letërnjoftim (kopje)',
      'Fotografi e formulariti A0 të plotësuar',
      'Adresa e biznesit (kontratë qiraje ose dëshmi pronësie)',
      'Kod NACE i zgjedhur për aktivitetin kryesor',
    ],
    steps: [
      'Kontrollo emrin e biznesit te arbk.rks-gov.net → "Kërko emrin". Nëse emri është i lirë, vazhdo.',
      'Krijo llogari (ose kyçu) në portalin ARBK.',
      'Plotëso formularin A0 online: emri, adresa, NACE, të dhënat e pronarit.',
      'Bashkangjit dokumentet e mësipërme si PDF.',
      'Kryej pagesën e regjistrimit online (Visa/Master/e-Kosova).',
      'Prit certifikatën elektronike (zakonisht 1-3 ditë pune, në email).',
      'Shkarko certifikatën + numrin e biznesit + numrin fiskal.',
      'Vazhdo me hapat post-regjistrim: bankë + ATK/EDI + kontabilist.',
    ],
    fee: '~1 EUR (kontrolli i emrit) + tarifa e regjistrimit (verifikoje aktualen te arbk.rks-gov.net)',
    timeframe: '1-3 ditë pune',
    officialFormLink: 'https://arbk.rks-gov.net',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, neni 12',
  },
  {
    icon: Building2,
    title: 'Shoqëri me Përgjegjësi të Kufizuar (SH.P.K.)',
    summary: 'Forma më e zakonshme për bizneset serioze. Përgjegjësia e pronarit është e kufizuar në kapitalin e investuar.',
    when: 'Kur ke 1 ose më shumë pronarë, don të kufizosh rrezikun personal financiar, ose planifikon të tërheqësh investitorë.',
    documents: [
      'Letërnjoftim i secilit pronar dhe drejtor',
      'Statuti i shoqërisë (i noterizuar)',
      'Akti themelues (i noterizuar) nëse ka >1 pronar',
      'Vendimi për emërimin e drejtorit',
      'Kontratë qiraje ose dëshmi pronësie për adresën',
      'Dëshmi për depozitimin e kapitalit fillestar (minimum 1 EUR sipas ligjit aktual, praktikisht 100+ EUR rekomandohet)',
      'Kod NACE',
    ],
    steps: [
      'Kontrollo emrin e biznesit te arbk.rks-gov.net.',
      'Përgatit statutin te noteri (kosto ~40-80 EUR në varësi të noterit).',
      'Nëse ka bashkëpronarë, përgatit aktin themelues të noterizuar.',
      'Merr vendimin për emërimin e drejtorit.',
      'Hap llogari bankare të përkohshme dhe depoziton kapitalin fillestar (nëse zgjedh të depozitosh).',
      'Krijo llogari te portali ARBK dhe plotëso formularin A1 online.',
      'Bashkangjit të gjitha dokumentet PDF të noterizuara.',
      'Kryej pagesën e regjistrimit.',
      'Prit certifikatën (zakonisht 3-5 ditë pune).',
      'Hap llogari bankare të plotë me certifikatë + statut.',
      'Aktivizo EDI/ATK dhe autorizo kontabilistin.',
    ],
    fee: 'Noteri: ~40-80 EUR statut + ~20-40 EUR akt themelues. ARBK: verifikoje tarifën aktuale.',
    timeframe: '5-10 ditë pune (varet nga shpejtësia e noterit)',
    officialFormLink: 'https://arbk.rks-gov.net',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 76-140',
  },
  {
    icon: Building2,
    title: 'Shoqëri Aksionare (Sh.A.)',
    summary: 'Për ndërmarrje të mëdha me shumë investitorë. Kapitali është i ndarë në aksione.',
    when: 'Kur planifikon të tërheqësh shumë investitorë, të listohesh në bursë, ose të operosh në sektorë të rregulluar (bankë, sigurime).',
    documents: [
      'Statuti i shoqërisë aksionare',
      'Akti themelues me listë të aksionarëve dhe aksionet e tyre',
      'Vendimi për emërimin e Këshillit Drejtues',
      'Dëshmi për kapitalin themeltar minimal (minimumi ligjor: 25,000 EUR — verifikoje aktualisht)',
      'Letërnjoftim për të gjithë anëtarët e KD dhe aksionarët themelues',
      'Adresa e selisë',
    ],
    steps: [
      'Konsulto avokat për strukturimin e statutit dhe akteve.',
      'Depoziton kapitalin themeltar në bankë (min. 25,000 EUR).',
      'Noterizim i statutit dhe akteve.',
      'Regjistrim te ARBK me formularin A2.',
      'Regjistrim shtesë nëse aktiviteti kërkon licencë (BQK për banka, AFSA për sigurime, etj.).',
    ],
    fee: 'Kapital minimal 25,000 EUR + tarifat noteriale + tarifat e regjistrimit + eventual honorar avokati.',
    timeframe: '2-4 javë',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 141-249',
  },
  {
    icon: Users,
    title: 'Ortakëri e Përgjithshme (O.P.)',
    summary: 'Dy ose më shumë persona bashkohen për të operuar biznes; të gjithë përgjigjen solidarisht me pasurinë personale.',
    when: 'Kur bashkë me partnerin/partnerët keni besim të plotë dhe planifikoni një aktivitet të thjeshtë profesional (kabinet ligjor, kontabilitet, konsulencë).',
    documents: [
      'Marrëveshja e ortakërisë (e noterizuar)',
      'Letërnjoftim për secilin ortak',
      'Adresa e biznesit',
      'Kod NACE',
    ],
    steps: [
      'Përgatitni marrëveshjen e ortakërisë te noteri (ndarja e fitimit, përgjegjësitë, largimi i ortakut).',
      'Regjistroni ortakërinë te ARBK.',
      'Regjistrohuni te ATK për tatimin personal (jo tatim korporativ).',
    ],
    fee: 'Noteri për marrëveshjen + tarifa e ARBK.',
    timeframe: '3-7 ditë pune',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 24-42',
  },
  {
    icon: Users,
    title: 'Ortakëri e Kufizuar (O.K.)',
    summary: 'Kombinim: ortakët e përgjithshëm përgjigjen solidarisht, ortakët e kufizuar përgjigjen vetëm deri në shumën e kontributit.',
    when: 'Kur ke një ortak menaxhues aktiv dhe një ose më shumë investitorë pasivë që s\'duan përgjegjësi personale.',
    documents: [
      'Marrëveshja e ortakërisë me ndarje të qartë ortakë të përgjithshëm vs të kufizuar',
      'Kontributet e secilit ortak (fond ose punë)',
      'Të tjera si Ortakëria e Përgjithshme',
    ],
    steps: [
      'Përgatit marrëveshjen te noteri me ndarje të qartë të kategorive.',
      'Regjistroni te ARBK.',
      'Regjistroni te ATK.',
    ],
    fee: 'Ngjashme me O.P.',
    timeframe: '3-7 ditë pune',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 43-75',
  },
  {
    icon: Globe,
    title: 'Degë e Kompanisë së Huaj',
    summary: 'Për kompani të huaja që dëshirojnë të operojnë në Kosovë përmes një dege (jo shoqëri e re).',
    when: 'Kompania mëmë (jashtë Kosovës) don të operojë direkt në Kosovë pa krijuar entitet të ri të pavarur.',
    documents: [
      'Certifikata e regjistrimit të kompanisë mëmë (e apostiluar dhe e përkthyer)',
      'Statuti i kompanisë mëmë',
      'Vendimi i organit kompetent për hapjen e degës',
      'Autorizimi për përfaqësuesin e degës në Kosovë',
      'Emërimi i një përfaqësuesi ligjor rezident në Kosovë',
      'Adresa e degës në Kosovë',
    ],
    steps: [
      'Merr apostille në vendin e origjinës për dokumentet e kompanisë mëmë.',
      'Përktheji dokumentet nga përkthyes gjyqësor në Kosovë.',
      'Ushtro procedurën përmes noteri dhe/ose avokat në Kosovë.',
      'Regjistro degën te ARBK me formularin A3.',
      'Aktivizo EDI/ATK; dega tatohet si njësi më vete.',
    ],
    fee: 'Apostille + përkthimet (~50-150 EUR) + noteria + tarifat ARBK.',
    timeframe: '3-6 javë (varet nga vendi i origjinës)',
    officialLawRef: 'Ligji Nr. 06/L-016 për Shoqëritë Tregtare, nenet 250-260',
  },
]

const NDRYSHIMET: Procedure[] = [
  {
    icon: MapPin,
    title: 'Ndryshim i adresës së biznesit',
    summary: 'Zhvendosje e selisë ose e njësisë.',
    when: 'Kur biznesi ndërron zyrat, magazinën, dyqanin ose adresën juridike.',
    documents: [
      'Vendim i organit menaxhues për ndryshimin e adresës',
      'Kontratë e re qiraje ose dëshmi pronësie',
      'Formulari i ndryshimit online (te ARBK)',
    ],
    steps: [
      'Kyçu te ARBK portal me llogarinë e biznesit.',
      'Zgjidh "Ndryshim adrese" te menyja e ndryshimeve.',
      'Bashkangjit kontratën e re dhe vendimin.',
      'Paguaj tarifën e ndryshimit.',
      'Prit certifikatën e re me adresën e re (1-3 ditë).',
      'Njofto ATK-në për ndryshimin (nga portali EDI).',
      'Njofto bankën për ndryshimin e adresës.',
    ],
    fee: 'Verifikoje aktualen te arbk.rks-gov.net (zakonisht simbolike, disa euro).',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: ClipboardCheck,
    title: 'Ndryshim/shtim/heqje i aktivitetit',
    summary: 'Modifikim i kodeve NACE që biznesi ushtron.',
    when: 'Kur zgjeron ose ngushton fushëveprimin (p.sh. shton eksportin, hyn në tregtinë me pakicë).',
    documents: [
      'Vendim për ndryshimin/shtimin/heqjen e aktivitetit',
      'Kodet e reja NACE',
      'Ndonjë licencë të veçantë nëse aktiviteti i ri e kërkon',
    ],
    steps: [
      'Kyçu te ARBK portal.',
      'Zgjidh "Ndryshim aktiviteti".',
      'Shto ose hiq kodet NACE nga lista.',
      'Bashkangjit vendimin dhe eventualisht licencat e nevojshme.',
      'Paguaj tarifën.',
      'Prit certifikatën e re.',
      'Njofto ATK-në për ndryshimin (kjo mund të ndryshojë regjimin tatimor).',
    ],
    fee: 'Verifikoje aktualen te ARBK.',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: Wallet,
    title: 'Ndryshim i kapitalit themeltar',
    summary: 'Rritje ose ulje e kapitalit të regjistruar (vetëm SH.P.K./Sh.A.).',
    when: 'Kur investohen fonde të reja, kur ka shtim aksionarësh, ose kur zvogëlohet kapitali pas humbjeve.',
    documents: [
      'Vendim i Kuvendit të aksionarëve/ortakëve për ndryshimin',
      'Dëshmi për pagesën e kapitalit të ri (për rritje)',
      'Statut i ndryshuar (nëse është e nevojshme)',
      'Për ulje: publikim në Gazetën Zyrtare + afat për kreditorë',
    ],
    steps: [
      'Mblidh Kuvendin dhe merr vendimin me shumicën e kërkuar (75% për SH.P.K., verifiko për Sh.A.).',
      'Nëse është rritje: deponit fondet në llogarinë bankare.',
      'Nëse është ulje: publiko njoftimin dhe prit afatin ligjor (3 muaj).',
      'Regjistro ndryshimin te ARBK me dokumentet përkatëse.',
      'Njofto ATK dhe bankën.',
    ],
    fee: 'Varion; për SH.A. ka procedurë më komplekse.',
    timeframe: 'Rritje: 3-7 ditë. Ulje: 3+ muaj.',
    officialLawRef: 'Ligji për Shoqëritë Tregtare, nenet 105-115 (SH.P.K.), 175-195 (Sh.A.)',
  },
  {
    icon: UserCog,
    title: 'Ndryshim i drejtorit/përfaqësuesit',
    summary: 'Shkarkim i drejtorit ekzistues dhe/ose emërim i drejtorit të ri.',
    when: 'Ndërrim menaxhmenti, dorëheqje, shkarkim, ose shtim përfaqësuesish të tjerë ligjorë.',
    documents: [
      'Vendim i Kuvendit ose organit kompetent',
      'Letërnjoftim i drejtorit të ri',
      'Deklarim se drejtori i ri pranon detyrën',
      'Nëse ka dorëheqje: letra e dorëheqjes',
    ],
    steps: [
      'Merr vendimin nga Kuvendi/organi kompetent.',
      'Regjistro ndryshimin te ARBK online.',
      'Njofto ATK/EDI (drejtori i ri duhet të ketë autorizim për të nënshkruar).',
      'Njofto bankën për ndryshimin e nënshkruesit të llogarisë.',
    ],
    fee: 'Simbolike.',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: Users,
    title: 'Ndryshim i pronarit/aksionarëve',
    summary: 'Shitje, transferim ose trashëgimi e pjesës së pronarit.',
    when: 'Kur një pronar shet pjesën, jep pjesën si dhuratë, ose në rast trashëgimie.',
    documents: [
      'Kontratë e shitblerjes e noterizuar (ose vendim trashëgimie)',
      'Statuti i ndryshuar nëse ndryshojnë përqindjet',
      'Miratim nga ortakët e tjerë (nëse statuti e kërkon)',
      'Për transferim te i huaji: eventual leje shtesë',
    ],
    steps: [
      'Përgatit kontratën te noteri.',
      'Merr miratimet e nevojshme sipas statutit.',
      'Regjistro ndryshimin te ARBK.',
      'Njofto ATK.',
    ],
    fee: 'Noteri + tarifat e transferimit + eventual tatim mbi fitimin kapital.',
    timeframe: '1-2 javë',
  },
  {
    icon: FileText,
    title: 'Ndryshim i emrit të biznesit',
    summary: 'Ndërrim i emrit tregtar të regjistruar.',
    when: 'Rebrending, ndryshim i strukturës, kërkesa marketingu.',
    documents: [
      'Kontroll paraprak i emrit të ri te ARBK',
      'Vendim i Kuvendit për ndryshimin',
      'Statut i ndryshuar (SH.P.K./Sh.A.)',
    ],
    steps: [
      'Kontrollo disponueshmërinë e emrit të ri online.',
      'Merr vendimin e Kuvendit.',
      'Nese SHPK/SHA: noterizo statutin e ri.',
      'Regjistro ndryshimin te ARBK.',
      'Njofto ATK, bankën, klientët, faturuesin, sistemet online.',
      'Përditëso vulën (nëse e ke), materialet e marketingut.',
    ],
    fee: '~1 EUR (kontroll emri) + tarifa e ndryshimit + noteria për SHPK/SHA.',
    timeframe: '3-7 ditë pune',
  },
  {
    icon: GitBranch,
    title: 'Hapje/mbyllje e njësisë (degë vendore)',
    summary: 'Shtim ose heqje e njësisë brenda Kosovës.',
    when: 'Kur hap dyqan të ri në qytet tjetër, magazinë, ose kur mbyll një pikë ekzistuese.',
    documents: [
      'Vendim për hapjen/mbylljen e njësisë',
      'Kontratë qiraje/dëshmi pronësie për njësinë e re',
      'Kodi NACE i aktivitetit të njësisë',
    ],
    steps: [
      'Merr vendimin.',
      'Regjistro njësinë te ARBK online.',
      'Merr certifikatën për njësinë.',
      'Njofto ATK për aktivizim/çaktivizim të njësisë tatimore.',
    ],
    fee: 'Verifikoje aktualen.',
    timeframe: '1-3 ditë pune',
  },
  {
    icon: Copy,
    title: 'Dublikat i certifikatës',
    summary: 'Rikrijim i certifikatës origjinale (humbur, dëmtuar, apo për backup).',
    when: 'Certifikata origjinale është humbur ose dëmtuar dhe të nevojitet për procedura zyrtare.',
    documents: [
      'Deklarim për humbjen (nëse është humbur)',
      'Kërkesë online',
    ],
    steps: [
      'Kyçu te ARBK portal.',
      'Zgjidh "Kërkesë për dublikat".',
      'Bashkangjit deklarimin.',
      'Paguaj tarifën.',
      'Merr dublikatin (shpesh menjëherë si PDF).',
    ],
    fee: 'Simbolike.',
    timeframe: 'Menjëherë deri në 1 ditë pune.',
  },
  {
    icon: Ban,
    title: 'Ndryshim i statusit (aktiv/pasiv)',
    summary: 'Pezullim i përkohshëm i aktivitetit pa çregjistrim total.',
    when: 'Kur ndalon operimin për disa muaj (sezonalitet, ristrukturim) por nuk don ta mbyllësh biznesin.',
    documents: [
      'Vendim për pezullim',
      'Njoftim te ATK për pezullim tatimor',
    ],
    steps: [
      'Merr vendimin.',
      'Regjistro pezullimin te ARBK.',
      'Njofto ATK me kërkesë për "pezullim aktiviteti".',
      'Gjatë pezullimit: nuk paguan tatime mbi qarkullimin, por duhet të deklarosh "zero aktivitet".',
      'Kur të riaktivizohesh, njofto sërish ARBK + ATK.',
    ],
    fee: 'Simbolike.',
    timeframe: '3-5 ditë pune',
  },
  {
    icon: XCircle,
    title: 'Çregjistrim (mbyllje e biznesit)',
    summary: 'Përfundim përfundimtar i aktivitetit dhe fshirje nga regjistri.',
    when: 'Kur biznesi mbaron aktivitetin përfundimisht (falimentim, dorëheqje, mbyllje strategjike).',
    documents: [
      'Vendim i Kuvendit për shpërbërje',
      'Certifikatë "pa detyrime" nga ATK (kjo është kritike; mund të marrë muaj)',
      'Bilanc likuidimi (auditor për SHPK/SHA)',
      'Publikim në Gazetën Zyrtare',
      'Dëshmi për shlyerjen e detyrimeve ndaj punonjësve, kreditorëve, ATK-së',
    ],
    steps: [
      'Merr vendimin e shpërbërjes.',
      'Njofto ATK-në për fillim likuidimi.',
      'Paguaj/shly të gjitha detyrimet tatimore, punonjësve, kreditorëve.',
      'Publiko njoftimin në Gazetën Zyrtare (afat 3 muaj për kreditorë).',
      'Merr certifikatën "pa detyrime" nga ATK.',
      'Regjistro likuidimin final te ARBK.',
      'Mbyll llogarinë bankare.',
      'Ruaj arkivën 7-10 vjet sipas ligjit tatimor.',
    ],
    fee: 'Auditori (SHPK/SHA) + publikimi + noteria + tarifat.',
    timeframe: '3-9 muaj (kryesisht për ATK certifikatën "pa detyrime")',
    officialLawRef: 'Ligji për Shoqëritë Tregtare, nenet 116-140 (SH.P.K.), 227-249 (Sh.A.)',
  },
]

function ProcedureCard({ p }: { p: Procedure }) {
  const Icon = p.icon
  return (
    <details className="rounded-xl border border-gray-200 bg-white group">
      <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{p.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{p.summary}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kur e përdor</h4>
          <p className="text-sm text-gray-700">{p.when}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dokumentet që duhen</h4>
          <ul className="space-y-1">
            {p.documents.map((d, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hap pas hapi</h4>
          <ol className="space-y-2">
            {p.steps.map((step, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs text-gray-500 mb-0.5">Kosto</div>
            <div className="text-sm text-gray-900 font-medium">{p.fee}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs text-gray-500 mb-0.5">Koha</div>
            <div className="text-sm text-gray-900 font-medium">{p.timeframe}</div>
          </div>
        </div>

        {(p.officialFormLink || p.officialLawRef) && (
          <div className="rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/10 p-3 space-y-2">
            {p.officialFormLink && (
              <a
                href={p.officialFormLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#1B4F72] font-medium hover:text-[#2E86C1]"
              >
                Portal zyrtar ARBK <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {p.officialLawRef && (
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Bazë ligjore:</span> {p.officialLawRef}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  )
}

export default function ARBKGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesi ARBK</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Agjencia për Regjistrimin e Bizneseve në Kosovë. Këtu janë procedurat më të përdorura,
          me dokumentet e nevojshme, hapat konkret, kostot dhe kohën. Për çdo procedurë, portali zyrtar
          është <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">arbk.rks-gov.net</a>.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifikojini gjithmonë tarifat dhe procedurat aktuale</p>
          <p>
            Ky udhëzues bazohet në gjendjen e procedurave deri më <strong>{LAST_VERIFIED}</strong>.
            Tarifat, formularët dhe procedurat mund të ndryshojnë. Verifikoji te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">portali zyrtar ARBK</a>{' '}
            para se të vazhdosh.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontrolli i emrit të biznesit</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700">
              Para se të fillosh regjistrimin, kontrollo nëse emri i biznesit është i lirë. ARBK e ka
              këtë funksion në faqen e vet. <strong>Nuk ka API publike për këtë</strong>: duhet ta bësh manualisht.
            </p>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">1</span>
                <span>Shko te <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline font-medium">arbk.rks-gov.net</a>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">2</span>
                <span>Në kërkim (rregullisht në krye të faqes) shkruaj emrin e propozuar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">3</span>
                <span>Nëse s&apos;del asnjë rezultat identik, emri është zakonisht i lirë. Nëse del rezultat i njëjtë, do të duhet emër tjetër ose shtim variantesh (p.sh. &quot;SHPK&quot;, &quot;Prodhim&quot;).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1B4F72] text-white text-xs font-semibold shrink-0 mt-0.5">4</span>
                <span>Kujdes: kontrolli online nuk garanton rezervim. Rezervimi bëhet vetëm në momentin që aplikon për regjistrim.</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Regjistrimi i biznesit (6 forma ligjore)</h2>
          <span className="text-xs text-gray-500">{REGISTRIME.length} procedura</span>
        </div>
        <div className="space-y-2">
          {REGISTRIME.map((p) => <ProcedureCard key={p.title} p={p} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Ndryshimet dhe procedurat pas regjistrimit</h2>
          <span className="text-xs text-gray-500">{NDRYSHIMET.length} procedura</span>
        </div>
        <div className="space-y-2">
          {NDRYSHIMET.map((p) => <ProcedureCard key={p.title} p={p} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">NACE Codes — klasifikimi i aktivitetit</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700">
              NACE (Nomenklatura e Aktiviteteve Ekonomike në BE) është një sistem 4-6 shifror që klasifikon
              aktivitetet ekonomike. Kosova përdor NACE Rev. 2. Çdo biznes duhet të zgjedhë të paktën një kod
              NACE si aktivitet kryesor.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
              <p className="font-semibold mb-2">Ku i gjen kodet:</p>
              <ul className="space-y-1.5">
                <li>
                  <a href="https://ask.rks-gov.net/media/2222/nace-kodet.pdf" target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline inline-flex items-center gap-1">
                    Dokumenti NACE i publikuar nga ASK-ja <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="https://ec.europa.eu/eurostat/ramon/nomenclatures/index.cfm?TargetUrl=LST_NOM_DTL&StrNom=NACE_REV2" target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline inline-flex items-center gap-1">
                    Databaza zyrtare NACE Rev. 2 (Eurostat) <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Sygjerohet të shkarkosh dokumentin PDF të ASK-së dhe të kërkosh me Ctrl+F për fjalët kyçe të aktivitetit tënd.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-900">
                <strong>Kujdes te NACE:</strong> Kodi që zgjedh ndikon në regjimin tatimor (norma tatimore për tregti vs prodhim vs shërbime), në kërkesat për licencë (disa aktivitete kërkojnë licencë të veçantë), dhe në statistikat e kompanisë. Konsulto kontabilistin nëse s&apos;je i sigurt.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Hapat pas certifikatës</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-700 mb-4">
              Certifikata e ARBK-së është vetëm fillimi. Ja çka duhet të bësh menjëherë pas:
            </p>
            <div className="space-y-3">
              {[
                { title: 'Aktivizim EDI/ATK', text: 'Kyçu te faqja e ATK-së dhe aktivizo qasjen elektronike (EDI). Do të nevojitet për të deklaruar tatime.', link: '/dashboard/tatime' },
                { title: 'Autorizim kontabilisti', text: 'Nëse do të përdorësh kontabilist të jashtëm, jepi autorizim përmes formularit të ATK-së.', link: '/dashboard/tatime' },
                { title: 'Hap llogari bankare', text: 'Me certifikatë + statut, hap llogari të plotë bankare. Bankat kryesore në Kosovë: BPB, NLB, ProCredit, Raiffeisen, TEB, BKT.' },
                { title: 'Vulë e biznesit (opsionale)', text: 'Ligjërisht nuk detyrohet më, por shumë institucione ende e kërkojnë. Kosto: 30-50 EUR.' },
                { title: 'Kontratë punësimi (nëse ke punonjës)', text: 'Regjistro punonjësit te ATK në afat 5 ditë pune nga fillimi i punës.' },
                { title: 'Kontabilitet i rregullt', text: 'Nga dita e regjistrimit, ke detyrim të mbash kontabilitet. Deklarime mujore/tremujore fillojnë.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-600">{step.text}</p>
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

      <p className="text-xs text-gray-400 max-w-3xl">
        Ky udhëzues nuk zëvendëson këshillën profesionale ligjore ose të kontabilistit. Për procedura komplekse
        (Sh.A., dega e huaj, likuidim), konsulto avokat/kontabilist. Baza ligjore kryesore: Ligji Nr. 06/L-016 për
        Shoqëritë Tregtare. Data e verifikimit të këtij udhëzuesi: {LAST_VERIFIED}.
      </p>
    </div>
  )
}
