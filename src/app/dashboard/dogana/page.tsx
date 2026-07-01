import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Truck, FileText, Ship, Plane, Package, MapPin, ExternalLink, AlertTriangle,
  ChevronRight, CheckCircle2, FileSearch, Award, Sprout, ShieldCheck, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-06-15'
const OFFICIAL_URL = 'https://dogana.rks-gov.net'
const ASYCUDA_URL = 'https://asycuda.rks-gov.net'

interface Procedure {
  icon: React.ComponentType<{ className?: string }>
  title: string
  summary: string
  content: {
    section: string
    text?: string
    list?: string[]
  }[]
  officialLink?: string
}

const PROCEDURES: Procedure[] = [
  {
    icon: ArrowRight,
    title: 'Eksporti — hap pas hapi',
    summary: 'Dalja e mallit nga Kosova drejt vendeve të tjera. Procedura standarde.',
    content: [
      {
        section: 'Përgatitja para eksportit',
        list: [
          'Sigurohu që biznesi është i regjistruar në ARBK dhe ATK',
          'Njihu me kërkesat specifike të vendit të destinacionit (rregullore importi, taksa, standarde)',
          'Verifikoni nëse produkti bie brenda ndonjë marrëveshjeje tregtare preferenciale (CEFTA, MSA me BE, etj.)',
          'Përgatit kodin HS për produktin që eksporton',
          'Sigurohu që ke certifikatat e kërkuara (origjinë, cilësi, sanitare, veterinare, etj.)',
        ],
      },
      {
        section: 'Dokumentet doganore bazë',
        list: [
          'Fatura eksportuese (Commercial Invoice) — me përshkrim, sasi, çmim, Incoterms',
          'Packing List (lista e ambalazhimit)',
          'Fletë-udhëtimi (CMR për rrugor, B/L për detar, AWB për ajror)',
          'Certifikata e origjinës (EUR.1 për BE ose CEFTA)',
          'Deklarata e Eksportit (DEV) — plotësohet online në ASYCUDA',
          'Certifikata sanitare/veterinare/fitosanitare (nëse aplikohet)',
          'Autorizim shpediteri (nëse përdor shpediter)',
        ],
      },
      {
        section: 'Procedura në doganë',
        list: [
          'Plotëso Deklaratën e Eksportit (DEV) në sistemin ASYCUDA (bëhet nga shpediteri zakonisht)',
          'Sistemi jep numër MRN (Movement Reference Number)',
          'Malli paraqitet në doganë me dokumentet fizike',
          'Dogana bën kontrollin dokumentar dhe eventualisht fizik të mallit',
          'Nëse gjithçka është në rregull, lëshohet leja për eksport',
          'Malli mund të kalojë kufirin drejt destinacionit',
          'Për CEFTA/BE: certifikata EUR.1 verifikohet dhe vuloset',
        ],
      },
      {
        section: 'Pas eksportit',
        text: 'Ruaje deklaratën e eksportit dhe të gjitha dokumentet për së paku 5 vjet (kërkohet për kontrolle tatimore dhe doganore). Eksporti është i liruar nga TVSH — pra në faturë ke 0% TVSH, por duhet të deklarosh eksportin te TVSH mujore me kod 0%.',
      },
    ],
    officialLink: ASYCUDA_URL,
  },
  {
    icon: Package,
    title: 'Importi — hap pas hapi',
    summary: 'Hyrja e mallit në Kosovë. Përfshin taksa doganore + TVSH + akciza (për disa produkte).',
    content: [
      {
        section: 'Përgatitja para importit',
        list: [
          'Verifiko kodin HS të produktit dhe normën doganore që aplikohet',
          'Llogarit koston totale: çmimi + transporti + taksa doganore + TVSH 18% + akciza (nëse aplikohet)',
          'Verifiko nëse produkti kërkon licencë import (medikamente, armë, kimikate)',
          'Zgjidh Incoterms me eksportuesin (FOB, CIF, DDP, etj.)',
          'Sigurohu që malli ka certifikatat e kërkuara (CE për teknologji, EUR.1 nëse vjen nga BE/CEFTA)',
        ],
      },
      {
        section: 'Dokumentet për import',
        list: [
          'Fatura komerciale nga shitësi i huaj',
          'Packing list',
          'Fletë-udhëtimi (CMR/B/L/AWB)',
          'Certifikata e origjinës (EUR.1 nga BE/CEFTA për tarifa preferenciale)',
          'Deklarata e Importit (DIM) — plotësohet në ASYCUDA',
          'Sertifikata specifike sipas produktit (CE, ISO, sanitare)',
          'Autorizim shpediteri',
        ],
      },
      {
        section: 'Procesi doganor',
        list: [
          'Malli arrin në pikë-kalimin doganor',
          'Shpediteri plotëson DIM në ASYCUDA',
          'Llogariten taksa doganore + TVSH + akcizë',
          'Paguhen taksat online ose te banka doganore',
          'Dogana bën verifikim dokumentar + eventualisht kontroll fizik',
          'Pas pagesës dhe kontrollit, malli lirohet dhe transportohet te blerësi',
        ],
      },
      {
        section: 'Marrëveshje preferenciale',
        text: 'Kosova ka marrëveshje me BE-në (MSA — Marrëveshja e Stabilizim-Asocimit) dhe CEFTA (me vendet e Ballkanit). Nëse malli vjen me EUR.1 nga këto zona, mund të ketë 0% taksë doganore (kursim i madh). EUR.1 duhet të lëshohet nga dogana e vendit eksportues.',
      },
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Ship,
    title: 'Re-eksporti (Transit)',
    summary: 'Mall që kalon nëpër Kosovë por s\'ndalohet për konsum vendor — thjesht kalon.',
    content: [
      {
        section: 'Kur aplikohet',
        text: 'Kur importon mall nga një vend, e paketon ose thjesht e ri-transporton drejt një vendi tjetër pa e vënë në qarkullim të lirë në Kosovë. Përdoret shpesh për transport ndërkombëtar, hub logjistik.',
      },
      {
        section: 'Përfitimet',
        list: [
          'Nuk paguan taksat doganore lokale',
          'Nuk paguan TVSH',
          'Shkurton kohën e transportit ndërkufitar',
        ],
      },
      {
        section: 'Kërkesat',
        list: [
          'Deklaratë tranziti (T1 ose T2 sipas rastit)',
          'Garancion bankar ose depozit që siguron doganën në rast se malli s\'del me kohë',
          'Afati zakonisht 8 ditë për të dalur',
          'ASYCUDA-Transit sistemi',
        ],
      },
      {
        section: 'Ku përdoret më shpesh',
        text: 'Për kompani logjistike që shërbejnë Ballkanin, për shpediterë të mëdhenj, dhe për firma që trajtojnë depozita të përkohshme. Për një prodhues tipik, re-eksporti nuk ndodh shpesh.',
      },
    ],
  },
  {
    icon: FileSearch,
    title: 'HS Code — si të gjesh kodin',
    summary: 'Sistemi i Harmonizuar (HS) është nomenklatura ndërkombëtare 6-shifrore që klasifikon të gjitha mallrat.',
    content: [
      {
        section: 'Pse është i rëndësishëm',
        text: 'HS Code përcakton normën e taksës doganore, kërkesat për licenca, statusin e marrëveshjeve preferenciale, dhe klasifikimin statistikor. Kod i gabuar = tarifë e gabuar = probleme me doganën.',
      },
      {
        section: 'Struktura e HS Code',
        list: [
          '2 shifra: Kapitulli (p.sh. 94 = mobilje)',
          '4 shifra: Titulli (p.sh. 9403 = mobilje të tjera dhe pjesë)',
          '6 shifra: Nën-titulli (p.sh. 940330 = mobilje druri për zyra)',
          '8-10 shifra: Kodet kombëtare të Kosovës (për doganë specifike)',
        ],
      },
      {
        section: 'Si të gjesh kodin',
        list: [
          'Përdor HS Code Finder brenda platformës KBH',
          'Konsulto Tarifën Doganore të Kosovës te dogana.rks-gov.net',
          'Për raste komplekse, kërko Vendim Klasifikimi paraprak nga Dogana e Kosovës',
        ],
      },
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Award,
    title: 'Certifikata e Origjinës (EUR.1)',
    summary: 'Dokument që dëshmon se malli është prodhuar në Kosovë (ose në vend me marrëveshje preferenciale) për të përfituar tarifa më të ulëta.',
    content: [
      {
        section: 'Për çka nevojitet',
        text: 'Kur eksporton në BE, CEFTA ose vende tjera me marrëveshje preferenciale me Kosovën, EUR.1 lejon blerësin të paguajë 0% ose tarifë të reduktuar doganore. Pa EUR.1, blerësi paguan tarifën e plotë — çka i bën produktet tona më pak konkurruese.',
      },
      {
        section: 'Kush e lëshon',
        text: 'Dogana e Kosovës e lëshon EUR.1 me kërkesë të eksportuesit. Nuk mund ta bësh vetë.',
      },
      {
        section: 'Dokumentet për të kërkuar EUR.1',
        list: [
          'Kërkesa formale (formulari EUR.1 i plotësuar)',
          'Fatura komerciale',
          'Deklaratë e furnizuesit që dëshmon origjinën (nëse mallin e ke blerë, jo prodhuar vetë)',
          'Për prodhues: dëshmi për origjinën e lëndëve të para dhe procesin e prodhimit',
          'Për shumë raste, do të kesh nevojë për "Autorizim si Eksportues i Miratuar" nga dogana',
        ],
      },
      {
        section: 'Rregullat e origjinës',
        text: 'Malli konsiderohet me origjinë kosovare nëse: (a) është prodhuar plotësisht në Kosovë, ose (b) ka pësuar transformim të mjaftueshëm në Kosovë sipas rregullave preferenciale. Rregullat janë komplekse dhe ndryshojnë sipas marrëveshjes (BE vs CEFTA vs EFTA). Konsulto Doganën ose kontabilistin.',
      },
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Sprout,
    title: 'AUV / Fitocertifikatë / Veterinare',
    summary: 'Certifikata specifike për produkte bujqësore, blegtorale dhe ushqimore.',
    content: [
      {
        section: 'AUV — Agjencia për Ushqim dhe Veterinari',
        text: 'AUV është autoriteti kompetent për kontrollin e sigurisë ushqimore, shëndetit të kafshëve dhe fitosanitetit. Çdo eksport i produkteve me origjinë shtazore ose me përpunim ushqimor kalon përmes AUV-së.',
      },
      {
        section: 'Certifikata Fitosanitare',
        text: 'Për eksport të produkteve bimore (frutash, perimesh, drithërave, farave). Dëshmon se produkti është pa sëmundje bimore. Kërkohet nga çdo vend importues.',
        list: [
          'Kërkohet nga AUV — Departamenti Fitosanitar',
          'Inspektim fizik i produktit',
          'Certifikohet nëse produkti kalon standardet',
          'Vlefshmëri: zakonisht 14 ditë nga lëshimi',
        ],
      },
      {
        section: 'Certifikata Veterinare',
        text: 'Për eksport të produkteve me origjinë shtazore (mish, qumësht, vezë, mjaltë, peshku).',
        list: [
          'Kërkohet nga AUV — Departamenti Veterinar',
          'Kontroll në origjinë (fermë, thertore, fabrikë përpunimi)',
          'Kontroll në produktin final',
          'Nëse vendi importues kërkon kërkesa specifike (p.sh. BE-ja për mish), duhet të plotësohen para eksportit',
        ],
      },
      {
        section: 'Përjashtime dhe kufizime',
        text: 'Disa vende (BE, Zvicër, ShBA) kanë kërkesa shumë strikte për importin e produkteve ushqimore. Fabrika duhet të jetë e miratuar nga autoriteti kompetent i vendit importues. Konsulto AUV-në përpara se të organizosh eksportin.',
      },
    ],
    officialLink: 'https://auv.rks-gov.net',
  },
  {
    icon: ShieldCheck,
    title: 'Incoterms 2020 (shkurt)',
    summary: '11 termat standarde ndërkombëtare që përcaktojnë kush mban rrezikun dhe koston në cilën fazë të transportit.',
    content: [
      {
        section: 'Grupet e Incoterms',
        list: [
          'E-termat (EXW): blerësi merr përgjegjësinë që në magazinën e shitësit',
          'F-termat (FCA, FAS, FOB): shitësi dorëzon te transportuesi, kostoja e transportit është e blerësit',
          'C-termat (CFR, CIF, CPT, CIP): shitësi paguan transportin deri në destinacion, por rreziku kalon te blerësi më herët',
          'D-termat (DAP, DPU, DDP): shitësi mban rrezikun dhe koston deri në destinacion (DDP përfshin edhe taksat doganore)',
        ],
      },
      {
        section: 'Më të përdorurat në praktikë',
        list: [
          'EXW (Ex Works): më e thjeshtë për shitësin, blerësi organizon gjithçka',
          'FOB (Free On Board): pas ngarkimit në anije, rreziku i blerësit',
          'CIF (Cost, Insurance, Freight): shitësi paguan transport + sigurim deri në portin e destinacionit',
          'DAP (Delivered At Place): shitësi dorëzon deri te vendi i rëne dakord, por blerësi shlyen taksa doganore',
          'DDP (Delivered Duty Paid): shitësi shlyen çdo gjë, blerësi vetëm merr mallin',
        ],
      },
      {
        section: 'Këshillë praktike',
        text: 'Për eksporte nga Kosova, FOB, CIF ose DAP janë më të përdorurat. DDP është më i favorshëm për blerësin por rrit koston tënde. Përcakto Incoterm-in në kontratë dhe në fatura që të mos ketë keqkuptime pas transportit.',
      },
    ],
  },
  {
    icon: MapPin,
    title: 'Shpediter — si ta zgjedhësh',
    summary: 'Shpediteri organizon transportin dhe doganën për ty. Zgjedhja e duhur kursen kohë dhe para.',
    content: [
      {
        section: 'Çka bën shpediteri',
        list: [
          'Organizon transportin (rrugor, ajror, detar)',
          'Plotëson deklaratat doganore (DEV, DIM, T1)',
          'Ndërmjeton me doganën për verifikime',
          'Menaxhon dokumentacionin dhe komunikimin me palët',
          'Për shumë biznese, shërben si këshilltar për eksport/import',
        ],
      },
      {
        section: 'Si të zgjedhësh',
        list: [
          'Verifiko licencën e shpediterit te Dogana e Kosovës',
          'Kërko referenca nga biznese të tjera në sektorin tënd',
          'Krahaso çmime nga 2-3 shpediterë të ndryshëm',
          'Për destinacione specifike (p.sh. Gjermani, Zvicër), zgjidh shpediter me eksperiencë të dëshmuar në atë rrugë',
          'Sigurohu që ka mbulim sigurimi për mallin',
        ],
      },
      {
        section: 'Kosto tipike',
        text: 'Ndryshon shumë sipas rrugës, sasisë dhe kompleksitetit. Për një transport të thjeshtë Kosovë → Gjermani (kamion 20 tonëshe), përafërsisht 800-1500 EUR + dogana. Kërko oferta konkrete për rastin tënd.',
      },
    ],
  },
  {
    icon: FileText,
    title: 'Fatura eksportuese — çka duhet të përmbajë',
    summary: 'Fatura komerciale për eksport ka kërkesa më strikte se një faturë e brendshme.',
    content: [
      {
        section: 'Elementet e detyrueshme',
        list: [
          'Numër serik dhe datë',
          'Emri, adresa, numri fiskal i eksportuesit',
          'Emri, adresa e blerësit (importuesit) + numri fiskal (VAT/EORI nëse është BE)',
          'Përshkrimi i saktë i mallit (jo vetëm "produkte" — duhet specifikë)',
          'Kodi HS për secilin artikull',
          'Sasia (numër copësh, kg, m³, sipas rastit)',
          'Çmimi për njësi + total',
          'Valuta (EUR, USD, etj.)',
          'Incoterms (p.sh. "FOB Prishtinë", "CIF Hamburg")',
          'Vendi i origjinës së mallit',
          'Peshë neto + peshë bruto',
          'Numri i CMR ose fletë-udhëtimit',
          'Kushtet e pagesës',
          'Nënshkrim + vulë (shpesh e kërkuar)',
        ],
      },
      {
        section: 'Çka të mos harrosh',
        text: 'TVSH duhet të jetë 0% për eksport, por duhet të përmendet qartë "0% TVSH — eksport i liruar sipas Ligjit të TVSH-së". Kjo është e rëndësishme si dëshmi tatimore.',
      },
    ],
  },
  {
    icon: Package,
    title: 'Packing List',
    summary: 'Lista e paketimit tregon detajisht si është ambalazhuar malli. E kërkojnë të gjitha doganat.',
    content: [
      {
        section: 'Çka përmban',
        list: [
          'Numri i kutive/palletave/kolive dhe secilës i vendoset numër identifikimi',
          'Përmbajtja e secilës koli/paletë (sasi + përshkrim)',
          'Pesha neto dhe bruto për secilën njësi ambalazhi',
          'Dimensionet (L × W × H) të paletave',
          'Marka/kodi i produktit',
          'Referencë te fatura komerciale (numri i faturës)',
        ],
      },
      {
        section: 'Pse është i rëndësishëm',
        text: 'Dogana e përdor për kontroll fizik: nëse konteineri ka 20 pallet dhe packing list thotë 22, ka mospërputhje. Blerësi e përdor për të pranuar mallin dhe për kontrolle të cilësisë. Sigurimi e përdor për të llogaritur mbulesën.',
      },
    ],
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
        {p.content.map((sec, i) => (
          <div key={i}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{sec.section}</h4>
            {sec.text && <p className="text-sm text-gray-700 leading-relaxed">{sec.text}</p>}
            {sec.list && (
              <ul className="space-y-1.5 mt-2">
                {sec.list.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#1B4F72] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {p.officialLink && (
          <div className="rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/10 p-3">
            <a href={p.officialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#1B4F72] font-medium hover:text-[#2E86C1]">
              Portal zyrtar <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </details>
  )
}

export default function DoganaGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesi Doganor</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Dogana e Republikës së Kosovës. Eksporti, importi, re-eksporti, HS Code, Incoterms, certifikatat
          dhe shpediteri. Portali zyrtar: <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">dogana.rks-gov.net</a>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/dashboard/terma/hs-code" className="rounded-xl border border-[#1B4F72]/20 bg-[#1B4F72]/5 p-4 hover:bg-[#1B4F72]/10 transition-colors group">
          <div className="flex items-center gap-3">
            <FileSearch className="h-5 w-5 text-[#1B4F72]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1B4F72]">HS Code Finder</p>
              <p className="text-xs text-gray-600">Kërko kodin HS për produktin tënd</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#1B4F72] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
        <Link href="/dashboard/terma/incoterms" className="rounded-xl border border-[#1B4F72]/20 bg-[#1B4F72]/5 p-4 hover:bg-[#1B4F72]/10 transition-colors group">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#1B4F72]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1B4F72]">Incoterms Glossary</p>
              <p className="text-xs text-gray-600">11 termat me shpjegim të plotë</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#1B4F72] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko procedurat aktuale</p>
          <p>
            Ky udhëzues bazohet në procedurat deri më <strong>{LAST_VERIFIED}</strong>. Tarifat doganore,
            kërkesat për certifikata dhe procedurat mund të ndryshojnë. Verifikoji te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">dogana.rks-gov.net</a>{' '}
            ose te shpediteri yt para se të planifikosh eksport/import.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Procedurat kryesore</h2>
          <span className="text-xs text-gray-500">{PROCEDURES.length} procedura</span>
        </div>
        <div className="space-y-2">
          {PROCEDURES.map((p) => <ProcedureCard key={p.title} p={p} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Modet e transportit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Rrugor (CMR)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Më i përdoruri për destinacione në Ballkan dhe BE. Kohë 2-5 ditë. Dokumenti: CMR.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-5 w-5 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Detar (B/L)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Për destinacione përtej Evropës (SHBA, Azi). Kohë 3-6 javë. Port kryesor: Durrës ose Selanik. Dokumenti: B/L.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Ajror (AWB)</h3>
              </div>
              <p className="text-sm text-gray-600">
                Për mall me vlerë të lartë ose urgjent. Kohë 1-3 ditë. Aeroporti: Prishtinë. Dokumenti: AWB.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl">
        Ky udhëzues është për orientim të përgjithshëm. Për transportet e para, punësoni një shpediter të licencuar
        që të kryejë procedurat për ju. Baza ligjore: Kodi Doganor i Kosovës (Ligji Nr. 03/L-109) dhe rregulloret
        e AUV-së për produkte specifike. Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}
