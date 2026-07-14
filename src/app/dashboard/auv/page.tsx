import Link from 'next/link'
import NextLink from 'next/link'
import { Lock as LockIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldCheck, FileText, Leaf, Fish, Wheat, Truck, Globe, ExternalLink,
  AlertTriangle, ChevronRight, Info, Phone, ClipboardCheck, Stethoscope, Beef,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Gating i pakos (§11): FREE sheh 2 procedurat e para; pjesa tjeter kerkon Professional.
async function fullAccessForSession(): Promise<boolean> {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('@/lib/auth')
  const session = await getServerSession(authOptions)
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')
  const role = String((session?.user as { role?: string })?.role ?? '')
  return ['PROFESSIONAL', 'ENTERPRISE'].includes(tier) || ['ADMIN', 'SUPER_ADMIN'].includes(role)
}

const LAST_VERIFIED = '2026-07-08'
const OFFICIAL_URL = 'https://auvk.rks-gov.net'

interface Procedure {
  icon: React.ComponentType<{ className?: string }>
  title: string
  intro: string
  whoFor: string
  documents: { name: string; note?: string }[]
  steps: string[]
  timeframe: string
  goodToKnow?: string[]
  officialLawRef?: string
}

const OFFICES = [
  { region: 'Prishtinë (Qendra)', address: 'Rr. "Nënë Tereza", zona industriale', phone: '044 217 923' },
  { region: 'Prizren', address: 'Rr. "Sali Saramati" (Lagjja Petrov)', phone: '044 619 876' },
  { region: 'Pejë', address: 'Rr. "Gani Daci"', phone: '044 247 747' },
  { region: 'Mitrovicë', address: 'Rr. "Ramadan Kelmendi" Nr. 32', phone: '044 296 525' },
  { region: 'Gjilan', address: 'Rr. "Fehmi Agani"', phone: '044 144 848' },
  { region: 'Ferizaj', address: 'Rr. "Vëllezërit Gërvalla", kati VI', phone: '044 731 050' },
]

const SEKTORET = [
  { icon: Beef, label: 'Mish dhe përpunim mishi' },
  { icon: Stethoscope, label: 'Qumësht dhe bulmet' },
  { icon: Fish, label: 'Peshk dhe prodhime deti' },
  { icon: Leaf, label: 'Fruta, perime, produkte bimore' },
  { icon: Wheat, label: 'Drithëra, miell, prodhime buke' },
  { icon: ShieldCheck, label: 'Mjaltë, vezë, prodhime tjera' },
]

// ---------------------------------------------------------------------------
// REGJISTRIMI DHE APROVIMI I OPERATORIT
// ---------------------------------------------------------------------------
const REGJISTRIMI: Procedure[] = [
  {
    icon: ClipboardCheck,
    title: 'Regjistrimi i operatorit të biznesit ushqimor',
    intro: 'Çdo biznes që prodhon, përpunon, paketon, ruan, transporton ose shet ushqim duhet të jetë i regjistruar te AUV para se të fillojë aktivitetin. Regjistrimi është hapi bazë, kryesisht për ushqimet me rrezik më të ulët (produkte me origjinë joshtazore, tregti, gastronomi).',
    whoFor: 'Dyqane ushqimore, restorante dhe gastronomi, furra, përpunues të produkteve bimore, magazina ushqimi, distributorë. Kush merret me ushqim por jo me origjinë shtazore, zakonisht regjistrohet (jo aprovohet).',
    documents: [
      { name: 'Certifikata e biznesit (ARBK)', note: 'Biznesi duhet të jetë i regjistruar më parë te ARBK.' },
      { name: 'Letërnjoftimi i pronarit/përgjegjësit' },
      { name: 'Adresa dhe skica e objektit', note: 'Ku zhvillohet aktiviteti ushqimor.' },
      { name: 'Lista e produkteve dhe e aktivitetit' },
      { name: 'Dëshmi për ujë të pijshëm dhe plani bazë i higjienës', note: 'Sipas kërkesave të objektit.' },
    ],
    steps: [
      'Regjistro biznesin te ARBK nëse s\'e ke bërë (shih Udhëzuesin ARBK).',
      'Plotëso kërkesën për regjistrim te AUV — te zyra qendrore ose ajo rajonale më e afërt.',
      'Inspektori i AUV vlerëson objektin: higjienën, rrjedhën e punës, kushtet e ruajtjes.',
      'Merr vendimin/numrin e regjistrimit.',
      'Fillon aktivitetin ligjërisht dhe mban regjistra të gjurmueshmërisë (nga vjen malli, ku shkon).',
    ],
    timeframe: 'Zakonisht disa javë (varet nga inspektimi)',
    goodToKnow: [
      'Regjistrim nuk është e njëjta gjë me Aprovim. Për ushqime me origjinë shtazore (mish, qumësht, peshk, vezë) të duhet APROVIM, jo vetëm regjistrim.',
      'Edhe në regjistrim kërkohen praktikat bazë të higjienës dhe elemente të HACCP-it.',
    ],
    officialLawRef: 'Rregullorja (QRK) Nr. 18/2016 për regjistrimin dhe aprovimin e operatorëve; Ligji Nr. 03/L-016 për Ushqimin.',
  },
  {
    icon: ShieldCheck,
    title: 'Aprovimi i objektit për ushqime me origjinë shtazore',
    intro: 'Objektet që prodhojnë ose përpunojnë ushqime me origjinë shtazore (mish, qumësht, peshk, vezë, mjaltë) duhet të marrin APROVIM të veçantë të AUV, jo vetëm regjistrim. Aprovimi është parakusht për ta vendosur produktin në treg dhe, mbi të gjitha, për eksport.',
    whoFor: 'Therëtore, njësi për përpunim mishi, baxho dhe përpunim qumështi, përpunim peshku, paketim vezësh, prodhues mjalti për treg.',
    documents: [
      { name: 'Certifikata e biznesit (ARBK)' },
      { name: 'Plani teknologjik i objektit', note: 'Rrjedha e prodhimit, ndarja e zonave të pastra/të papastra.' },
      { name: 'Plani HACCP', note: 'Sistemi i analizës së rreziqeve dhe pikave kritike të kontrollit.' },
      { name: 'Dëshmi për ujë të pijshëm + plani i kontrollit të dëmtuesve' },
      { name: 'Dokumentacioni i gjurmueshmërisë' },
      { name: 'Veterineri/personi përgjegjës dhe kualifikimet e stafit' },
    ],
    steps: [
      'Përgatit objektin sipas standardeve të higjienës (Rregullorja Nr. 11/2011).',
      'Zbato sistemin HACCP në prodhim.',
      'Apliko për aprovim te AUV.',
      'Inspektim i detajuar i objektit + marrje mostrash për analiza laboratorike.',
      'Merr numrin e aprovimit (approval number) — ky shënohet në etiketën/identifikimin shëndetësor të produktit.',
      'Për eksport në BE: objekti duhet të figurojë në listën e AUV të objekteve të aprovuara për eksport.',
    ],
    timeframe: 'Nga disa javë deri disa muaj (varet nga gatishmëria e objektit)',
    goodToKnow: [
      'Pa aprovim nuk mund të vendosësh në treg as të eksportosh produkte me origjinë shtazore.',
      'Numri i aprovimit shfaqet në etiketë si vulë identifikimi shëndetësor.',
      'AUV publikon listën e objekteve të aprovuara (përfshirë ato të aprovuara për eksport në BE).',
    ],
    officialLawRef: 'Rregullorja (QRK) Nr. 18/2016; Rregullorja Nr. 13/2011 për kontrollet e ushqimeve me origjinë shtazore; Ligji Nr. 2004/21 për Veterinarinë.',
  },
]

// ---------------------------------------------------------------------------
// CERTIFIKATAT PËR EKSPORT DHE RI-EKSPORT
// ---------------------------------------------------------------------------
const EKSPORTI: Procedure[] = [
  {
    icon: Stethoscope,
    title: 'Certifikata veterinare (shëndetësore) për eksport — origjinë shtazore',
    intro: 'Për të eksportuar ushqime me origjinë shtazore, çdo ngarkesë shoqërohet me një certifikatë veterinare/shëndetësore të lëshuar nga AUV. Ajo dëshmon se produkti është i sigurt dhe përmbush kërkesat e vendit ku po e dërgon.',
    whoFor: 'Eksportues të mishit, qumështit dhe bulmetit, peshkut, vezëve, mjaltit dhe produkteve të përpunuara me origjinë shtazore.',
    documents: [
      { name: 'Numri i aprovimit të objektit', note: 'Objekti duhet të jetë i aprovuar (dhe në listën për eksport nëse destinacioni është BE).' },
      { name: 'Fatura tregtare dhe lista e paketimit' },
      { name: 'Rezultatet e analizave laboratorike' },
      { name: 'Certifikata e origjinës' },
      { name: 'Modeli i certifikatës shëndetësore sipas vendit destinacion', note: 'Forma ndryshon nga vendi në vend.' },
    ],
    steps: [
      'Sigurohu që objekti yt është i aprovuar (dhe në listën për eksport në BE nëse dërgon atje).',
      'Kontrollo kërkesat e vendit destinacion — modeli i certifikatës dhe analizat ndryshojnë sipas vendit.',
      'Dorëzo kërkesën për certifikatë eksporti te AUV.',
      'Inspektim dhe marrje mostrash nëse kërkohet.',
      'AUV lëshon certifikatën veterinare/shëndetësore për ngarkesën.',
      'Paraqite certifikatën në pikën kufitare gjatë eksportit.',
    ],
    timeframe: 'Nga disa ditë deri disa javë (varet nga analizat)',
    goodToKnow: [
      'Modeli i certifikatës varet nga vendi destinacion. BE ka kërkesa specifike; disa vende kërkojnë protokolle dypalëshe.',
      'Verifikoji kërkesat para se të lidhësh kontratë eksporti — mund të duhet kohë përgatitjeje.',
    ],
    officialLawRef: 'Ligji Nr. 2004/21 për Veterinarinë; Rregullorja Nr. 13/2011.',
  },
  {
    icon: Leaf,
    title: 'Certifikata fitosanitare për eksport — produkte bimore',
    intro: 'Për eksportin e produkteve bimore dhe bujqësore (perime, fruta, drithëra, fara, bimë), kërkohet certifikatë fitosanitare e lëshuar nga Shërbimi Fitosanitar i AUV. Ajo dëshmon se produkti është pa dëmtues karantinorë.',
    whoFor: 'Eksportues të frutave dhe perimeve, drithërave, farave, bimëve dekorative dhe produkteve bimore të përpunuara.',
    documents: [
      { name: 'Kërkesa për certifikatë fitosanitare' },
      { name: 'Fatura tregtare dhe lista e paketimit' },
      { name: 'Origjina e produktit dhe kodi TARIK' },
      { name: 'Rezultatet e inspektimit/analizës laboratorike nëse kërkohet' },
    ],
    steps: [
      'Kontrollo nëse produkti bie nën kontroll fitosanitar (Vendimi Nr. 01-932/2015 + kodet TARIK).',
      'Dorëzo kërkesën te inspektori fitosanitar — te zyra qendrore ose pika kufitare.',
      'Inspektim vizual + marrje mostrash për analizë laboratorike nëse kërkohet.',
      'AUV lëshon certifikatën fitosanitare për ngarkesën.',
      'Shoqëro ngarkesën me certifikatën në pikën kufitare.',
    ],
    timeframe: '1-5 ditë pune (varet nga analiza)',
    goodToKnow: [
      'Inspektorët fitosanitarë punojnë e hënë deri të shtunë, 08:30-16:30.',
      'Certifikata lëshohet për ngarkesën specifike — jo një herë për të gjitha.',
      'Disa vende destinacion kanë kërkesa shtesë; verifikoji paraprakisht.',
    ],
    officialLawRef: 'Vendimi Nr. 01-932/2015; legjislacioni fitosanitar që zbaton AUV.',
  },
  {
    icon: Truck,
    title: 'Ri-eksporti (fitosanitar dhe veterinar)',
    intro: 'Ri-eksport është kur një produkt i importuar më parë del sërish nga Kosova pa u prodhuar këtu. Për produkte bimore lëshohet certifikatë fitosanitare ri-eksporti; për produkte me origjinë shtazore aplikohen procedurat e tranzitit/ruajtjes nën mbikëqyrje veterinare.',
    whoFor: 'Tregtarë dhe distributorë që importojnë ushqim (bimor ose shtazor) dhe pastaj e eksportojnë sërish pa përpunim thelbësor.',
    documents: [
      { name: 'Certifikata origjinale fitosanitare/veterinare e importit', note: 'Është dokumenti kyç për ri-eksport — ruaje.' },
      { name: 'Dokumentet doganore të importit' },
      { name: 'Fatura tregtare' },
      { name: 'Dëshmi për kushtet e ruajtjes', note: 'Që produkti ka ruajtur statusin sanitar.' },
      { name: 'Kërkesa për ri-eksport' },
    ],
    steps: [
      'Ruaj certifikatën origjinale të importit dhe dokumentet doganore që nga hyrja.',
      'Për produkte bimore: apliko për certifikatë fitosanitare ri-eksporti te AUV, duke bashkangjitur origjinalen.',
      'Për produkte shtazore: koordino me shërbimin veterinar për tranzit/ruajtje nën mbikëqyrje.',
      'Inspektim nëse kërkohet.',
      'AUV lëshon certifikatën e ri-eksportit.',
      'Kalon në pikën kufitare me dokumentacionin e plotë.',
    ],
    timeframe: 'Varion sipas produktit dhe destinacionit',
    goodToKnow: [
      'Pa certifikatën origjinale të importit, ri-eksporti komplikohet ndjeshëm.',
      'Kushtet e ruajtjes duhet të mbahen — përndryshe humbet statusi sanitar dhe s\'lëshohet certifikata.',
    ],
    officialLawRef: 'Legjislacioni fitosanitar dhe veterinar që zbaton AUV.',
  },
]

function ProcedureCard({ p }: { p: Procedure }) {
  const Icon = p.icon
  return (
    <details className="rounded-xl border border-gray-200 border-l-4 border-l-[#1B4F72] bg-white group">
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
        <p className="text-sm text-gray-700 leading-relaxed">{p.intro}</p>

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

        <div className="rounded-lg border border-gray-200 p-3 w-fit min-w-[200px]">
          <div className="text-xs text-gray-500 mb-0.5">Sa zgjat</div>
          <div className="text-sm text-gray-900 font-medium">{p.timeframe}</div>
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

export default async function AUVGuidePage() {
  const fullAccess = await fullAccessForSession()
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Udhëzuesi AUV</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Çka është AUV</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Agjencia e Ushqimit dhe Veterinarisë. Mbikëqyr sigurinë e ushqimit, shëndetin e kafshëve dhe
              të bimëve: higjienën, gjurmueshmërinë, etiketimin dhe kontrollin kufitar për ushqimet që dalin
              në treg ose eksportohen.
            </p>
          </div>
          <div className="md:border-l md:border-gray-100 md:pl-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Çka gjen në këtë faqe</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Si të regjistrohesh apo aprovohesh si operator ushqimor, dhe çfarë të duhet për të eksportuar
              e ri-eksportuar ushqim, hap pas hapi, me dokumentet dhe kohën për secilën.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Kush ka nevojë për AUV</h2>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          Nëse prodhon, përpunon ose tregton ushqim, kalon nëpër AUV. Kërkesat janë më të rrepta për ushqimet
          me origjinë shtazore dhe për eksportin. Ja sektorët kryesorë:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SEKTORET.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
                <div className="rounded-lg bg-[#1B4F72]/10 p-1.5 shrink-0">
                  <Icon className="h-4 w-4 text-[#1B4F72]" />
                </div>
                <span className="text-sm text-gray-800">{s.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Regjistrimi dhe aprovimi si operator</h2>
          <span className="text-xs text-gray-500">{REGJISTRIMI.length} procedura</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Dallimi kryesor: <strong>regjistrim</strong> për ushqimet me rrezik më të ulët, <strong>aprovim</strong> për
          ushqimet me origjinë shtazore. Aprovimi është ai që të hap derën për eksport.
        </p>
        <div className="space-y-2">
          {REGJISTRIMI.map((p, i) => fullAccess || i < 2 ? <ProcedureCard key={p.title} p={p} /> : <LockedCard key={p.title} title={p.title} summary={p.intro} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Certifikatat për eksport dhe ri-eksport</h2>
          <span className="text-xs text-gray-500">{EKSPORTI.length} procedura</span>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Çdo ngarkesë ushqimore që del jashtë Kosovës shoqërohet me certifikatë — veterinare për produktet
          shtazore, fitosanitare për produktet bimore. Ri-eksporti ka rregullat e veta.
        </p>
        <div className="space-y-2">
          {EKSPORTI.map((p, i) => fullAccess || i < 2 ? <ProcedureCard key={p.title} p={p} /> : <LockedCard key={p.title} title={p.title} summary={p.intro} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">HACCP dhe higjiena</h2>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              HACCP është një sistem që identifikon rreziqet në prodhimin e ushqimit (biologjike, kimike, fizike)
              dhe vendos pika kritike ku ato kontrollohen. Për objektet që përpunojnë ushqim, sidomos me origjinë
              shtazore, HACCP-i është kërkesë për aprovim dhe për eksport.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                Në praktikë do të thotë: procedura të shkruara higjiene, kontroll temperaturash, gjurmueshmëri
                (nga vjen lënda, ku shkon produkti), pastrim/dezinfektim të planifikuar, dhe regjistra që i mban të gatshëm
                për inspektorin. AUV ka udhëzues kombëtarë për praktikat e mira të higjienës që mund t\'i ndjekësh.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Baza ligjore:</strong> Rregullorja Nr. 11/2011 për higjienën e ushqimit; Rregullorja Nr. 27/2012
                për kriteret mikrobiologjike; Rregullorja Nr. 43/2013 për nivelet maksimale të kontaminuesve.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Sipas destinacionit: BE apo rajon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Eksport në BE</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Kërkesat janë më të rrepta. Objekti duhet të jetë i aprovuar dhe të figurojë në listën e AUV
                të objekteve të aprovuara për eksport në BE. Certifikata shëndetësore ndjek modelin e BE-së,
                dhe shpesh kërkohen analiza laboratorike specifike.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-[#1B4F72]" />
                <h3 className="font-semibold text-gray-900">Eksport në rajon (CEFTA)</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Për vendet e rajonit procedurat janë zakonisht më të thjeshta, por përsëri kërkohet certifikata
                përkatëse (veterinare ose fitosanitare). Disa vende mund të kenë kërkesa ose kufizime specifike,
                prandaj verifikoji para dërgesës.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Verifiko procedurat dhe format aktuale</p>
          <p className="leading-relaxed">
            Ky udhëzues bazohet në informacionin zyrtar të AUV deri më <strong>{LAST_VERIFIED}</strong>. Format e
            certifikatave, kërkesat sipas vendit destinacion dhe tarifat mund të ndryshojnë. Për një ngarkesë
            konkrete, verifikoje te{' '}
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="underline font-medium">auvk.rks-gov.net</a>{' '}
            ose te zyra rajonale para se ta fillon.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#1B4F72]" />
          Kontakti dhe zyrat rajonale të AUV
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/15 p-3 mb-3">
              <p className="text-sm text-gray-800">
                <strong>Zyra qendrore:</strong> Rr. e Pejës Nr. 237 / zona industriale, Fushë Kosovë ·{' '}
                <a href="mailto:infoauv@rks-gov.net" className="text-[#2E86C1] hover:underline">infoauv@rks-gov.net</a>{' '}
                · Linja pa pagesë <strong>080 050 095</strong>
              </p>
            </div>
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
              Numrat mund të ndryshojnë — verifikoji te{' '}
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">portali zyrtar</a>{' '}
              para se të shkosh.
            </p>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
        Ky udhëzues është për orientim praktik dhe nuk zëvendëson këshillën profesionale. Për procedura specifike
        eksporti dhe kërkesa sipas vendit destinacion, konsulto AUV-në ose një konsulent të licencuar. Baza ligjore
        kryesore: Ligji Nr. 03/L-016 për Ushqimin, Ligji Nr. 2004/21 për Veterinarinë, Rregullorja (QRK) Nr. 18/2016.
        Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}

function LockedCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-xl border border-gray-200 border-l-4 border-l-gray-300 bg-gray-50/60 p-4 flex items-start gap-3">
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
