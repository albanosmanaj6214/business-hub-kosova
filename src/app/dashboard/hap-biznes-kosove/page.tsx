import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Rocket, FileText, ExternalLink, AlertTriangle, ChevronRight, CheckCircle2,
  Banknote, UserCheck, MapPin, FileSignature, Globe, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-06-15'

interface Step {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  details: string[]
  note?: string
}

const STEPS: Step[] = [
  {
    icon: FileSignature,
    title: '1. Zgjidh formën ligjore',
    description: 'Për diasporën, forma më e përdorur është SH.P.K. — mbron pasurinë personale dhe është e njohur nga bankat kosovare.',
    details: [
      'SH.P.K. (Shoqëri me Përgjegjësi të Kufizuar) — më e rekomanduara për shumicën',
      'Sh.A. (Shoqëri Aksionare) — për projekte të mëdha me shumë investitorë (kapital minimal 25,000 EUR)',
      'Biznes Individual — nëse do të vish personalisht të operosh çdo ditë',
      'Degë e Kompanisë së Huaj — nëse ke tashmë biznes në vendin ku jeton dhe don ta zgjerosh në Kosovë',
    ],
    note: 'Nëse nuk do të vish shpesh në Kosovë, SH.P.K. me një drejtor rezident (mund të jetë familjar ose partner) është zgjidhja më praktike.',
  },
  {
    icon: FileText,
    title: '2. Përgatit dokumentet kryesore',
    description: 'Nga vendi ku je (Gjermani, Zvicër, Austri, etj.), do të nevojiten disa dokumente të legalizuara.',
    details: [
      'Kopje e pasaportës ose ID-së europiane',
      'Certifikatë banimi (opsionale, por ndihmon te disa procedura)',
      'Nëse ke biznes ekzistues jashtë Kosovës: certifikata e regjistrimit të tij (e apostiluar)',
      'Për SHPK me dy ose më shumë pronarë: identitetet dhe autorizimet e të gjithë pronarëve',
    ],
    note: 'Për diasporën, "apostille" është kyçe. Dokumentet e huaja duhet të kenë vulën apostille nga vendi i origjinës për të qenë të pranueshme në Kosovë.',
  },
  {
    icon: UserCheck,
    title: '3. Kur nevojitet autorizim me firmë të noterizuar',
    description: 'Nëse s\'mund të vish personalisht në Kosovë, mund të autorizosh dikë ta bëjë procesin për ty.',
    details: [
      'Autorizim i noterizuar me firmë (bëhet te noteri në vendin ku je)',
      'Duhet të përmbajë emrin e plotë të personit të autorizuar dhe veprimet konkrete (regjistrim biznesi, hapje bankë, nënshkrim statuti)',
      'Në disa raste (posaçërisht Zvicër, Austri, Gjermani), nevojitet "apostille" mbi autorizimin',
      'Autorizimi përkthehet në shqip nga përkthyes gjyqësor në Kosovë',
    ],
    note: 'Personi i autorizuar mund të jetë avokat, kontabilist, familjar ose partner biznesi që beson.',
  },
  {
    icon: MapPin,
    title: '4. Kur duhet prezencë fizike',
    description: 'Disa procedura kërkojnë praninë tënde fizike ose të drejtorit të emëruar.',
    details: [
      'Hapja e llogarisë bankare — shumica e bankave kërkojnë praninë fizike të pronarit ose drejtorit',
      'Regjistrimi i noterizuar i statutit (nëse s\'ke autorizim të noterizuar nga jashtë)',
      'Aktivizimi i qasjes në EDI/ATK — mund të bëhet online, por ndonjëherë kërkohet verifikim personal',
      'Për SH.A. me investime të mëdha, banka mund të kërkojë intervistë personale',
    ],
    note: 'Planifikoji të gjitha këto veprime për një udhëtim 3-5 ditor në Kosovë. Nëse ke drejtor rezident, ai mund të bëjë shumicën për ty.',
  },
  {
    icon: Banknote,
    title: '5. Hap llogari bankare',
    description: 'Pas certifikatës së ARBK, hapja e llogarisë bankare është hapi tjetër kritik.',
    details: [
      'Bankat kryesore: BPB, NLB Prishtina, ProCredit, Raiffeisen, TEB, BKT',
      'Dokumentet: Certifikatë ARBK, statuti i biznesit, letërnjoftim i drejtorit, vendim për emërim',
      'Për diasporë: shpesh do të nevojitet edhe konfirmim adrese në vendin ku jeton dhe dëshmi për origjinën e fondeve (compliance / anti-money laundering)',
      'Rekomandohet të krahasosh oferta nga 2-3 banka: komisione, oferta për SME, karta biznesi, e-banking',
      'Për transferta ndërkombëtare: sigurohu që banka ka rrjet SWIFT të mirë',
    ],
    note: 'BPB dhe Raiffeisen kanë përvojë të mirë me diasporën. NLB është praktike për fonde nga Slloveni/Zvicër.',
  },
  {
    icon: FileText,
    title: '6. Aktivizim EDI/ATK dhe kontabilist',
    description: 'Menjëherë pas certifikatës dhe llogarisë bankare, aktivizoje qasjen tatimore.',
    details: [
      'Aktivizim i EDI-t përmes edeklarimi.atk-ks.org',
      'Autorizim i kontabilistit të licencuar — për diasporën kjo është pothuajse e domosdoshme',
      'Kontabilisti do të bëjë të gjitha deklarimet mujore/tremujore/vjetore për ty',
      'Për diasporën, kontabilisti gjithashtu do të ndihmojë me çështje të tatimit të dyfishtë',
      'Kosto tipike: 100-300 EUR/muaj për SME të vogël, deri 500-1000 EUR/muaj për të mesme',
    ],
    note: 'Zgjidh kontabilist që ka përvojë me biznese të diasporës — do të kuptojë strukturat tatimore ndërkufitare më mirë.',
  },
]

const TAX_TREATIES = [
  { country: 'Gjermani', signed: '2010', status: 'Në fuqi', notes: 'Marrëveshje bilaterale për shmangien e tatimit të dyfishtë' },
  { country: 'Zvicër', signed: '2011', status: 'Në fuqi', notes: 'Dividendë, royalti, kapital' },
  { country: 'Austri', signed: '2018', status: 'Në fuqi', notes: 'Bashkëpunim tatimor + shkëmbim informacioni' },
  { country: 'Britani', signed: '2017', status: 'Në fuqi', notes: 'Për dividendë dhe interes' },
  { country: 'Turqi', signed: '2013', status: 'Në fuqi', notes: 'Marrëveshje e plotë' },
  { country: 'Shqipëri', signed: '2014', status: 'Në fuqi', notes: 'Bashkëpunim rajonal + tregti' },
  { country: 'Maqedonia e Veriut', signed: '2013', status: 'Në fuqi', notes: 'CEFTA + bilaterale' },
  { country: 'ShBA', signed: '—', status: 'Në negociim', notes: 'Nuk ka marrëveshje formale' },
]

function StepCard({ s }: { s: Step }) {
  const Icon = s.icon
  return (
    <details className="rounded-xl border border-gray-200 bg-white group">
      <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{s.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{s.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
        <ul className="space-y-1.5">
          {s.details.map((d, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        {s.note && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
            <strong>Këshillë:</strong> {s.note}
          </div>
        )}
      </div>
    </details>
  )
}

export default function HapBiznesKosovePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Si të hap biznes në Kosovë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Udhëzim i plotë për diasporën që dëshiron të hapë biznes në atdhe. Nga forma ligjore, dokumentet
          e nevojshme, autorizimet, deri te hapja e llogarisë bankare dhe kontabilisti.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Globe className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Pse Kosova për biznesin tuaj</p>
          <p>
            Norma tatimore korporative 10% (një nga më të ulëtat në Ballkan), kosto e ulët e punës (paga
            minimale 264 EUR/muaj), aksesueshmëri në BE përmes MSA, dhe rrjet i madh diasporë që lehtëson tregtinë.
            Këto e bëjnë Kosovën destinacion tërheqës për investime nga diaspora.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Hap pas hapi</h2>
          <span className="text-xs text-gray-500">{STEPS.length} hapa</span>
        </div>
        <div className="space-y-2">
          {STEPS.map((s) => <StepCard key={s.title} s={s} />)}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Marrëveshjet për tatim të dyfishtë</h2>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-700 mb-4">
              Kosova ka marrëveshje bilaterale për shmangien e tatimit të dyfishtë me shumë vende ku jeton
              diaspora. Kjo do të thotë që nuk paguani tatim dy herë (në Kosovë + në vendin ku jetoni) për
              të njëjtat të ardhura.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Vendi</th>
                    <th className="text-left font-medium px-3 py-2">Nënshkrim</th>
                    <th className="text-left font-medium px-3 py-2">Statusi</th>
                    <th className="text-left font-medium px-3 py-2">Shënime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TAX_TREATIES.map((t) => (
                    <tr key={t.country}>
                      <td className="px-3 py-2 font-medium text-gray-900">{t.country}</td>
                      <td className="px-3 py-2 text-gray-600">{t.signed}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === 'Në fuqi' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Verifikoje statusin aktual te{' '}
              <a href="https://atk-ks.org" target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">
                atk-ks.org
              </a>.
              Për implementim praktik, konsulto kontabilistin që kupton të dyja sistemet tatimore.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Rrjet i lidhur në KBH</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Udhëzuesi ARBK', desc: 'Të gjitha procedurat e regjistrimit dhe ndryshimet', href: '/dashboard/arbk' },
            { title: 'Udhëzuesi Tatimor', desc: 'EDI, TVSH, tatim në fitim, paga', href: '/dashboard/tatime' },
            { title: 'Udhëzuesi Doganor', desc: 'Për import/eksport pas hapjes së biznesit', href: '/dashboard/dogana' },
            { title: 'Investo në Kosovë', desc: 'Parqe industriale, zona ekonomike, sektorë me potencial', href: '/dashboard/investime' },
            { title: 'Kompani Kosovare', desc: 'Directory për të gjetur partnerë ose furnizues', href: '/dashboard/directory' },
            { title: 'Konsultime', desc: 'Bisedë me eksperte për rastin tënd', href: '/dashboard/bookings' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">{l.title}</p>
              <p className="text-xs text-gray-600 mt-1">{l.desc}</p>
              <ArrowRight className="h-4 w-4 text-[#1B4F72] mt-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl">
        Udhëzuesi është për orientim. Për rastin tënd specifik, konsulto avokat ose kontabilist në Kosovë.
        Data e verifikimit: {LAST_VERIFIED}.
      </p>
    </div>
  )
}
