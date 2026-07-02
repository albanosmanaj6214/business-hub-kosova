import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Truck, FileText, Ship, Plane, Package, MapPin, ExternalLink, AlertTriangle,
  ChevronRight, CheckCircle2, FileSearch, Award, Sprout, ShieldCheck, ArrowRight,
  Info, Monitor, Building, FileCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-07-01'
const OFFICIAL_URL = 'https://dogana.rks-gov.net'
const ASYCUDA_URL = 'https://portali.dogana-rks.org/portal/'

interface Procedure {
  icon: React.ComponentType<{ className?: string }>
  title: string
  intro: string
  content: {
    section: string
    text?: string
    list?: string[]
  }[]
  goodToKnow?: string[]
  officialLink?: string
}

const PROCEDURES: Procedure[] = [
  {
    icon: FileCheck,
    title: 'Aktivizimi në sistemin ASYCUDA World',
    intro: 'ASYCUDA World është sistemi elektronik i Doganës së Kosovës ku bëhen të gjitha deklarimet e importit dhe eksportit. Para se të fillosh të tregtosh ndërkombëtarisht, biznesi yt duhet të jetë i aktivizuar në këtë sistem. Nëse s\'je i aktivizuar, nuk mund të kalojë asnjë mall nëpër kufi në emrin tënd.',
    content: [
      {
        section: 'Kur duhet ta bësh',
        text: 'Menjëherë pas certifikatës ARBK dhe regjistrimit te ATK (nëse je i regjistruar për TVSH). Kryesisht bëhet para eksportit/importit të parë. Në praktikë, shpediteri që zgjedh e bën këtë aktivizim për ty ose të ndihmon ta bësh.',
      },
      {
        section: 'Dokumentet',
        list: [
          'Certifikata ARBK me numër fiskal',
          'Certifikata e TVSH-së (nëse je i regjistruar)',
          'Letërnjoftim i drejtorit ose përfaqësuesit ligjor',
          'Kërkesa formale për aktivizim',
        ],
      },
      {
        section: 'Hap pas hapi',
        list: [
          'Përgatit dokumentet e mësipërme',
          'Dorëzoji te zyra qendrore e Doganës ose përmes shpediterit',
          'Dogana verifikon dhe krijon llogarinë tënde në ASYCUDA World',
          'Merr kredencialet dhe udhëzimet për përdorim',
          'Nëse do të përdorësh shpediter, autorizoje atë të veprojë në sistemin tënd',
        ],
      },
    ],
    goodToKnow: [
      'Shumica e bizneseve nuk përdorin ASYCUDA-n direkt — shpediterët e licencuar e bëjnë punën për ta. Por biznesi duhet të jetë i regjistruar aty në emrin e vet.',
      'Aktualisht Dogana ka sistemin ASYCUDA World me interfejs të përditësuar dhe procedura më të shpejta.',
    ],
    officialLink: ASYCUDA_URL,
  },
  {
    icon: ArrowRight,
    title: 'Eksporti — hap pas hapi',
    intro: 'Kur mall del nga Kosova drejt një vendi tjetër, procedura e eksportit është e obligueshme. Ky proces mbron interesat tuaja tregtare, siguron që malli të mos ndalohet në kufi, dhe të lejon të përfitosh nga marrëveshjet tregtare (0% doganë në BE dhe CEFTA).',
    content: [
      {
        section: 'Përgatitja para eksportit',
        list: [
          'Sigurohu që biznesi është i aktivizuar në ASYCUDA World',
          'Njihu me kërkesat e vendit të destinacionit — çdo shtet ka rregulla të vetat për import',
          'Verifiko a bie malli nën ndonjë marrëveshje preferenciale (CEFTA për Ballkanin, MSA për BE-në, marrëveshjet EFTA)',
          'Përgatit kodin HS për produktin që eksporton — kjo është klasifikimi ndërkombëtar 6-shifror',
          'Sigurohu që ke të gjitha certifikatat e nevojshme sipas produktit (origjinë, cilësi, sanitare, veterinare, fitosanitare)',
        ],
      },
      {
        section: 'Dokumentet doganore',
        list: [
          'Fatura komerciale (Commercial Invoice) me përshkrim, sasi, çmim, Incoterms',
          'Packing List (lista e ambalazhimit)',
          'Fletë-udhëtimi — CMR për transport rrugor, B/L (Bill of Lading) për detar, AWB (Air Waybill) për ajror',
          'Dëshmi e origjinës (EUR.1 për BE/CEFTA, ose deklaratë origjine në fatura kur vlera është nën 6000 EUR)',
          'Deklarata e Eksportit (DEV) — plotësohet në ASYCUDA World nga shpediteri',
          'Certifikata sanitare/veterinare/fitosanitare kur aplikohet',
          'Autorizim shpediteri nëse përdor shpediter',
        ],
      },
      {
        section: 'Procesi doganor',
        list: [
          'Shpediteri plotëson Deklaratën e Eksportit në ASYCUDA World',
          'Sistemi jep numër MRN (Movement Reference Number) — identifikuesi unik për këtë ngarkesë',
          'Malli paraqitet fizikisht në doganë me dokumentet',
          'Dogana bën kontrollin dokumentar dhe eventualisht kontroll fizik të mallit',
          'Nëse gjithçka është në rregull, lëshohet leja për eksport',
          'Malli kalon kufirin drejt destinacionit',
        ],
      },
      {
        section: 'Pas eksportit',
        text: 'Ruaj deklaratën e eksportit dhe të gjitha dokumentet për së paku 6 vjet — nevojiten për kontrollet tatimore dhe doganore. Në TVSH mujore, eksporti deklarohet me 0% dhe pas dorëzimit të DEV-it, mund të kërkosh rimbursimin e TVSH-së në blerjet e mallit që eksportove.',
      },
    ],
    goodToKnow: [
      'Nga 1 janar 2026, Dogana ka thjeshtuar disa procedura për SME — kohë më e shkurtër e zhdoganimit.',
      'Për shipmentet nën 6,000 EUR në BE ose CEFTA, s\'të duhet EUR.1 e veçantë — mjafton "deklaratë origjine" e shtypur në faturë me tekstin standard.',
      'Për eksporte të para, shpediteri të kushton më shumë por të kursen kohën dhe gabimet. Mëso nga eksporti i parë dhe pastaj mund të bësh vetë.',
    ],
    officialLink: ASYCUDA_URL,
  },
  {
    icon: Package,
    title: 'Importi — hap pas hapi',
    intro: 'Importi është kur mall hyn në Kosovë nga jashtë. Këtu paguan tarifat doganore (varet nga kodi HS + origjina), TVSH-në 18%, dhe akcizat (për disa produkte specifike si duhan, alkool, karburant, vetura).',
    content: [
      {
        section: 'Përgatitja para importit',
        list: [
          'Verifiko kodin HS të produktit dhe normën doganore që aplikohet',
          'Llogarit koston totale: çmimi + transporti + taksa doganore + TVSH 18% + akciza (nëse aplikohet)',
          'Verifiko nëse produkti kërkon licencë import (medikamente, armë, kimikate, ushqime specifike)',
          'Zgjidh Incoterms me shitësin e huaj (EXW, FOB, CIF, DAP, DDP)',
          'Sigurohu që malli ka certifikatat e kërkuara nga vendi importues (CE për teknologji, EUR.1 nga BE/CEFTA)',
        ],
      },
      {
        section: 'Dokumentet',
        list: [
          'Fatura komerciale nga shitësi i huaj',
          'Packing list',
          'Fletë-udhëtimi (CMR/B/L/AWB)',
          'Certifikata e origjinës (EUR.1 ose deklaratë e origjinës për tarifa preferenciale)',
          'Deklarata e Importit (DIM) — plotësohet në ASYCUDA World',
          'Certifikata specifike sipas produktit',
          'Autorizim shpediteri',
        ],
      },
      {
        section: 'Procesi',
        list: [
          'Malli arrin në pikë-kalimin doganor',
          'Shpediteri plotëson DIM në ASYCUDA World',
          'Llogariten taksa doganore + TVSH + akciza',
          'Paguan taksat online ose te banka doganore',
          'Dogana bën verifikimin dokumentar dhe eventualisht kontroll fizik',
          'Pas pagesës dhe kontrollit, malli lirohet dhe transportohet te ty',
        ],
      },
      {
        section: 'Marrëveshjet preferenciale',
        text: 'Kosova ka marrëveshje me BE-në (MSA), CEFTA (vendet e Ballkanit) dhe EFTA (Zvicër, Norvegji, Islandë). Nëse malli vjen me EUR.1 nga këto zona, taksa doganore mund të jetë 0%. Kjo është kursim i madh — verifikoje gjithmonë origjinën para se ta blesh.',
      },
    ],
    goodToKnow: [
      'TVSH-në 18% e paguan në doganë kur importoni, por nëse je i regjistruar për TVSH, mund ta kthesh mbrapa përmes deklarimit mujor.',
      'Për vetura, akciza është e vecantë dhe llogaritet sipas fuqisë së motorit + emisioneve.',
      'Ke të drejtë të kërkosh "vendim klasifikimi paraprak" nga Dogana nëse s\'je i sigurt për kodin HS të produktit tënd — kjo të mbron nga surprizat në kufi.',
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Ship,
    title: 'Re-eksporti (Transit)',
    intro: 'Re-eksporti është kur mall kalon nëpër Kosovë por s\'ndalohet për konsum vendor — thjesht kalon. Përdoret shpesh nga kompanitë logjistike që shërbejnë Ballkanin. Nuk paguhen taksa doganore vendore dhe TVSH sepse malli s\'hyn në qarkullim të lirë.',
    content: [
      {
        section: 'Kur aplikohet',
        text: 'Kur importon mall nga një vend dhe e ri-transporton drejt një vendi tjetër pa e vënë në qarkullim të lirë në Kosovë. P.sh. mall nga Turqia që kalon Kosovën për në Gjermani.',
      },
      {
        section: 'Kërkesat',
        list: [
          'Deklaratë tranziti (T1 ose T2 sipas rastit)',
          'Garancion bankar ose depozit që siguron doganën në rast se malli s\'del me kohë',
          'Afati zakonisht 8 ditë për të dalur nga territori i Kosovës',
          'ASYCUDA-Transit sistemi',
        ],
      },
    ],
    goodToKnow: [
      'Për prodhuesin tipik, re-eksporti nuk ndodh shpesh. Përdoret më shumë nga kompanitë logjistike, shpediterë të mëdhenj, dhe hubs.',
      'Nëse malli s\'del brenda afatit, garancioni humbet dhe konsiderohet import — me të gjitha taksat.',
    ],
  },
  {
    icon: Award,
    title: 'Dëshmia e origjinës (EUR.1 dhe deklarata në faturë)',
    intro: 'Dëshmia e origjinës është dokument që tregon se malli është prodhuar në Kosovë ose në një vend me marrëveshje preferenciale. Pa këtë, blerësi paguan tarifën doganore të plotë — çka i bën produktet tona më pak konkurruese.',
    content: [
      {
        section: 'Dy mënyra për të dëshmuar origjinën',
        list: [
          'EUR.1 (certifikatë zyrtare) — për shipmentet me vlerë mbi 6,000 EUR ose sipas kërkesës së blerësit',
          'Deklarata e origjinës në faturë — për shipmentet nën 6,000 EUR, mjafton të shtosh një tekst standard në faturën komerciale',
        ],
      },
      {
        section: 'EUR.1 — kush dhe si',
        text: 'EUR.1 lëshohet nga Dogana e Kosovës me kërkesë të eksportuesit. Nuk mund ta bësh vetë.',
        list: [
          'Kërkesa formale (formulari EUR.1 i plotësuar)',
          'Fatura komerciale',
          'Deklaratë e furnizuesit që dëshmon origjinën (nëse mallin e ke blerë, jo prodhuar vetë)',
          'Për prodhues: dëshmi për origjinën e lëndëve të para dhe procesin e prodhimit',
        ],
      },
      {
        section: 'Deklarata e origjinës në faturë',
        text: 'Për ngarkesa nën 6,000 EUR, s\'të duhet EUR.1. Mjafton të shtosh në faturë tekstin: "Eksportuesi i produkteve të mbuluara nga ky dokument deklaron se, përveç nëse tregohet ndryshe qartë, këto produkte janë me origjinë preferenciale të Kosovës". Kjo pranohet në BE dhe CEFTA.',
      },
      {
        section: 'Rregullat e origjinës',
        text: 'Malli konsiderohet me origjinë kosovare nëse: (a) është prodhuar plotësisht në Kosovë, ose (b) ka pësuar transformim të mjaftueshëm në Kosovë sipas rregullave preferenciale (rregulla specifike sipas kodit HS). Konsulto Doganën për raste konkrete.',
      },
    ],
    goodToKnow: [
      'Për bizneset që eksportojnë shpesh me vlera të mëdha, kërko statusin "Eksportues i Miratuar" nga Dogana. Kjo të lejon të vetë-lëshosh dëshminë e origjinës pa kaluar çdo herë përmes Doganës.',
      'Rregullat e origjinës ndryshojnë sipas marrëveshjes (BE vs CEFTA vs EFTA). Konsulto shpediterin.',
    ],
    officialLink: OFFICIAL_URL,
  },
  {
    icon: Sprout,
    title: 'Certifikata sanitare, veterinare, fitosanitare (AUV)',
    intro: 'Për eksport të produkteve ushqimore, bujqësore ose me origjinë shtazore, nevojiten certifikata të veçanta nga Agjencia e Ushqimit dhe Veterinarisë (AUV). Këto dëshmojnë se produkti është i sigurt dhe përmbush standardet e vendit importues.',
    content: [
      {
        section: 'AUV — çka bën',
        text: 'AUV është autoriteti kompetent për sigurinë ushqimore, shëndetin e kafshëve dhe fitosanitetit në Kosovë. Çdo eksport i produkteve me origjinë shtazore ose ushqimore kalon përmes tyre.',
      },
      {
        section: 'Certifikata Fitosanitare (bimë, fruta, perime, drithëra)',
        list: [
          'Kërkohet nga AUV — Departamenti Fitosanitar',
          'Inspektim fizik i produktit para eksportit',
          'Certifikohet nëse produkti është pa sëmundje bimore',
          'Vlefshmëri: zakonisht 14 ditë nga lëshimi',
        ],
      },
      {
        section: 'Certifikata Veterinare (mish, qumësht, vezë, mjaltë, peshku)',
        list: [
          'Kërkohet nga AUV — Departamenti Veterinar',
          'Kontroll në origjinë (fermë, thertore, fabrikë përpunimi)',
          'Kontroll në produktin final',
          'Për BE-në: fabrika duhet të jetë e miratuar nga autoriteti kompetent i vendit importues',
        ],
      },
    ],
    goodToKnow: [
      'BE, Zvicër, dhe ShBA kanë kërkesa strikte. Për eksport në këto tregje, konsulto AUV-në herët — procesi i aprovimit mund të marrë muaj.',
      'Certifikatat kanë vlefshmëri të kufizuar. Planifiko marrjen afër datës së eksportit.',
    ],
    officialLink: 'https://auv.rks-gov.net',
  },
  {
    icon: MapPin,
    title: 'Shpediter — si ta zgjedhësh',
    intro: 'Shpediteri organizon transportin dhe procedurat doganore për ty. Për eksporte të para, është pothuajse i domosdoshëm — kursen kohë dhe të mëson procesin. Ki kujdes ta zgjedhësh të mirë.',
    content: [
      {
        section: 'Çka bën shpediteri',
        list: [
          'Organizon transportin (rrugor, ajror, detar)',
          'Plotëson deklaratat doganore në ASYCUDA (DEV, DIM, T1)',
          'Ndërmjeton me doganën për verifikime dhe kontrolle',
          'Menaxhon dokumentacionin dhe komunikimin me palët',
          'Shpesh shërben si këshilltar për eksport/import për SME',
        ],
      },
      {
        section: 'Kritere për zgjedhjen',
        list: [
          'Verifiko licencën e shpediterit te dogana.rks-gov.net',
          'Kërko referenca nga biznese të tjera në sektorin tënd',
          'Krahaso çmime nga 2-3 shpediterë të ndryshëm',
          'Për destinacione specifike (Gjermani, Zvicër), zgjidh shpediter me eksperiencë të dëshmuar në atë rrugë',
          'Sigurohu që ka mbulim sigurimi për mallin',
        ],
      },
    ],
    goodToKnow: [
      'Kosto tipike varion sipas rrugës. Për transport Kosovë-Gjermani rrugor (kamion 20 ton), përafërsisht 800-1500 EUR + tarifat doganore. Kërko oferta për rastin tënd konkret.',
      'Shpediteri i mirë ka network në Ballkan dhe BE — nuk mbetesh me mall të bllokuar në kufi.',
    ],
    officialLink: OFFICIAL_URL,
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
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{p.intro}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">{p.intro}</p>
        </div>

        {p.content.map((sec, i) => (
          <div key={i}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{sec.section}</h4>
            {sec.text && <p className="text-sm text-gray-700 leading-relaxed mb-2">{sec.text}</p>}
            {sec.list && (
              <ul className="space-y-1.5">
                {sec.list.map((item, j) => (
                  <li key={j} className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed">
                    <span className="text-[#1B4F72] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

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

        {p.officialLink && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
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
        <p className="text-gray-500 mt-2 max-w-3xl leading-relaxed">
          Dogana e Republikës së Kosovës është nën Ministrinë e Financave. Këtu do të gjesh të gjitha
          procedurat e importit dhe eksportit — nga aktivizimi në ASYCUDA World, HS Code, EUR.1, Incoterms,
          deri te zgjedhja e shpediterit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
              <Monitor className="h-5 w-5 text-[#1B4F72]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">ASYCUDA World</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Sistemi elektronik ku bëhen të gjitha deklarimet doganore. Biznesi juaj duhet të aktivizohet
              këtu pas certifikatës ARBK.
            </p>
            <a href={ASYCUDA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline font-medium">
              portali.dogana-rks.org <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>

        <Link href="/dashboard/terma/hs-code" className="rounded-xl border border-[#1B4F72]/20 bg-[#1B4F72]/5 p-5 hover:bg-[#1B4F72]/10 transition-colors group">
          <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
            <FileSearch className="h-5 w-5 text-[#1B4F72]" />
          </div>
          <h3 className="font-semibold text-[#1B4F72] mb-2">HS Code Finder</h3>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            Kërko kodin HS për produktin tënd — nevojitet për çdo deklarim doganor.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm text-[#1B4F72] font-medium">
            Hape mjetin <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        <Link href="/dashboard/terma/incoterms" className="rounded-xl border border-[#1B4F72]/20 bg-[#1B4F72]/5 p-5 hover:bg-[#1B4F72]/10 transition-colors group">
          <div className="rounded-lg bg-[#1B4F72]/10 p-2 w-fit mb-3">
            <ShieldCheck className="h-5 w-5 text-[#1B4F72]" />
          </div>
          <h3 className="font-semibold text-[#1B4F72] mb-2">Incoterms Glossary</h3>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            11 termat e Odës Ndërkombëtare të Tregtisë — kush mban çka.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm text-[#1B4F72] font-medium">
            Hape glossary <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko procedurat aktuale</p>
          <p className="leading-relaxed">
            Të dhënat janë verifikuar me faqet zyrtare deri më <strong>{LAST_VERIFIED}</strong>. Tarifat doganore,
            kërkesat për certifikata dhe procedurat mund të ndryshojnë. Verifikoji te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">dogana.rks-gov.net</a>{' '}
            ose me shpediterin tënd.
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
              <p className="text-sm text-gray-600 leading-relaxed">
                Më i përdoruri për destinacione në Ballkan dhe BE. Kohë 2-7 ditë. Dokumenti: CMR.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ship className="h-5 w-5 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Detar (B/L)</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Për destinacione përtej Evropës (ShBA, Azi). Kohë 3-6 javë. Port kryesor: Durrës ose Selanik.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Ajror (AWB)</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Për mall me vlerë të lartë ose urgjent. Kohë 1-3 ditë. Aeroporti: Prishtinë.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
        Ky udhëzues është për orientim. Për transportet e para, punëso shpediter të licencuar. Baza ligjore: Kodi
        Doganor i Kosovës (Ligji Nr. 03/L-109) + rregulloret e AUV-së. Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}
