import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building2, MapPin, TrendingUp, Zap, Cpu, Utensils, Sprout, Wrench,
  ExternalLink, ChevronRight, Landmark, Receipt, Truck, Rocket, ArrowRight,
  Percent, Handshake, Scale,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-07-01'

// Treguesit fiskalë — të gjithë të ankoruar në ligje të Republikës së Kosovës,
// jo në vlerësime. Statistikat makro (paga, IHD, remitanca) publikohen nga
// ASK/BQK dhe lidhen te burimet zyrtare më poshtë.
const FISCAL_FACTS = [
  {
    value: '10%',
    label: 'Tatimi në fitim',
    note: 'Ndër më të ulëtit në Evropë. Gjermani ~30%, Austri 23%.',
    source: 'Ligji Nr. 05/L-029',
  },
  {
    value: '0–10%',
    label: 'Tatimi në paga',
    note: 'Shkallë progresive; deri 80 €/muaj nuk tatohet fare.',
    source: 'Ligji Nr. 05/L-028',
  },
  {
    value: '18% / 8%',
    label: 'TVSH',
    note: 'Norma e reduktuar 8% për ushqime bazike, turizëm, ilaçe.',
    source: 'Ligji Nr. 05/L-037',
  },
  {
    value: '0%',
    label: 'TVSH për eksport',
    note: 'Eksporti lirohet plotësisht nga TVSH.',
    source: 'Ligji Nr. 05/L-037',
  },
  {
    value: '0%',
    label: 'Doganë drejt BE dhe CEFTA',
    note: 'Me dëshmi origjine (EUR.1) malli kosovar hyn pa taksa doganore.',
    source: 'MSA me BE + CEFTA',
  },
  {
    value: '5% + 5%',
    label: 'Kontributet pensionale',
    note: 'Punëdhënësi 5%, punëtori 5%. Pa kontribute tjera të detyrueshme.',
    source: 'Ligji Nr. 04/L-101',
  },
]

const ZONES = [
  {
    name: 'Parku Industrial Drenas',
    location: 'Drenas',
    focus: 'Prodhim, përpunim metali, montim, logjistikë',
    detail: 'Parcelat me infrastrukturë të gatshme dhe qira të ulët, pranë autostradës R7.',
  },
  {
    name: 'Zona Ekonomike Suharekë',
    location: 'Suharekë',
    focus: 'Prodhim, tekstil, agropërpunim',
    detail: 'Pranë korridorit drejt Shqipërisë; fuqi punëtore e disponueshme.',
  },
  {
    name: 'Parku Industrial Prizren',
    location: 'Prizren',
    focus: 'Përpunim ushqimor, tekstil, prodhim i lehtë',
    detail: 'Qasje e mirë drejt portit të Durrësit; traditë prodhimi.',
  },
  {
    name: 'Zona Industriale Rahovec',
    location: 'Rahovec',
    focus: 'Verëtari dhe agropërpunim',
    detail: 'Rajoni kryesor i vreshtarisë; tokë pjellore.',
  },
  {
    name: 'Innovation Centre Kosovo (ICK)',
    location: 'Prishtinë',
    focus: 'TIK, startup, biznes dixhital',
    detail: 'Hapësira pune, mentorim dhe lidhje me investitorë për teknologji.',
  },
]

const SECTORS = [
  {
    icon: Utensils,
    name: 'Agropërpunim',
    pitch: 'Lëndë e parë vendore cilësore, kosto konkurruese, dalje pa doganë drejt BE-së.',
    examples: ['Konservim frutash e perimesh', 'Përpunim mishi dhe qumështi', 'Lëngje dhe pije', 'Verë dhe pije artizanale'],
  },
  {
    icon: Sprout,
    name: 'Bujqësi organike',
    pitch: 'Frutat pyjore dhe bimët medicinale kosovare kanë kërkesë të lartë në Gjermani.',
    examples: ['Mjedra, boronica, aronia', 'Bimë medicinale dhe aromatike', 'Mjaltë'],
  },
  {
    icon: Zap,
    name: 'Energji e rinovueshme',
    pitch: 'Mbi 2000 orë diell në vit dhe kërkesë në rritje për kapacitete të reja.',
    examples: ['Parqe solare', 'Instalime për biznese', 'Ngrohje me biomasë'],
  },
  {
    icon: Cpu,
    name: 'TIK dhe software',
    pitch: 'Popullsia më e re në Evropë, kosto zhvillimi konkurruese, gjuhë të huaja të forta.',
    examples: ['Outsourcing zhvillimi', 'Produkte SaaS', 'Qendra shërbimesh'],
  },
  {
    icon: Building2,
    name: 'Turizëm dhe mikpritje',
    pitch: 'Male, trashëgimi kulturore dhe gastronomia; sektor ende i pashfrytëzuar.',
    examples: ['Agro-turizëm (Sharr, Rugovë)', 'Hotele boutique në qytete historike', 'Turizëm dimëror'],
  },
  {
    icon: Wrench,
    name: 'Prodhim dhe metalpunim',
    pitch: 'Fuqi punëtore e kualifikuar dhe afërsi logjistike me tregjet e BE-së.',
    examples: ['Mobilje druri për eksport', 'Konstruksione metalike', 'Pjesë dhe komponentë'],
  },
]

const OFFICIAL_SOURCES = [
  { name: 'ASK — Agjencia e Statistikave të Kosovës', url: 'https://ask.rks-gov.net', what: 'Paga mesatare, punësimi, tregtia e jashtme, demografia' },
  { name: 'BQK — Banka Qendrore e Kosovës', url: 'https://bqk-kos.org', what: 'Investimet e huaja direkte, remitancat, sektori financiar' },
  { name: 'ATK — Administrata Tatimore', url: 'https://www.atk-ks.org', what: 'Normat tatimore dhe procedurat' },
  { name: 'Dogana e Kosovës', url: 'https://dogana.rks-gov.net', what: 'Tarifat doganore, procedurat e import-eksportit' },
  { name: 'KIESA — Agjencia për Investime', url: 'https://kiesa.rks-gov.net', what: 'Mbështetje për investitorë, zonat ekonomike' },
  { name: 'Ministria e Financave', url: 'https://mf.rks-gov.net', what: 'Buxheti, politikat fiskale, ligjet' },
  { name: 'Gazeta Zyrtare', url: 'https://gzk.rks-gov.net', what: 'Tekstet e plota të ligjeve të cituara këtu' },
]

export default function InvestimePage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Investo në Kosovë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Kushtet fiskale, zonat ekonomike dhe sektorët me potencial — me burime zyrtare për çdo shifër.
        </p>
      </div>

      {/* Treguesit fiskalë — të ankoruar në ligje */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Percent className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Kushtet fiskale</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {FISCAL_FACTS.map((f) => (
            <Card key={f.label}>
              <CardContent className="p-4">
                <p className="text-2xl font-extrabold text-[#1B4F72]">{f.value}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{f.label}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{f.note}</p>
                <p className="text-[11px] text-gray-400 mt-2">Burimi: {f.source}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Verifikuar me legjislacionin në fuqi më {LAST_VERIFIED}. Tekstet e plota te Gazeta Zyrtare (lidhja më poshtë).
        </p>
      </section>

      {/* Zonat ekonomike */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Zonat ekonomike dhe parqet industriale</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ZONES.map((z) => (
            <Card key={z.name}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#1B4F72] shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{z.name}</h3>
                    <p className="text-xs text-gray-500">{z.location} · {z.focus}</p>
                    <p className="text-sm text-gray-700 mt-1.5">{z.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Për kushtet aktuale të qirasë dhe parcelat e lira, kontakto{' '}
          <a href="https://kiesa.rks-gov.net" target="_blank" rel="noreferrer" className="text-[#2E86C1] hover:underline">KIESA-n</a>{' '}
          ose rezervo një <Link href="/dashboard/bookings" className="text-[#2E86C1] hover:underline">konsultim në KBH</Link>.
        </p>
      </section>

      {/* Sektorët me potencial */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Ku po investohet</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {SECTORS.map((s) => (
            <details key={s.name} className="rounded-xl border border-gray-200 bg-white group">
              <summary className="cursor-pointer p-4 flex items-center gap-3 hover:bg-gray-50 rounded-xl">
                <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                  <s.icon className="h-5 w-5 text-[#1B4F72]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-1">{s.pitch}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                <p className="text-sm text-gray-700 mb-2">{s.pitch}</p>
                <ul className="space-y-1">
                  {s.examples.map((e) => (
                    <li key={e} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-[#1B4F72] mt-0.5">•</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Hapat konkretë — butonat drejt udhëzuesve */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Handshake className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Gati për hapin tjetër?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/dashboard/hap-biznes-kosove', icon: Rocket, title: 'Si të hap biznes në Kosovë', sub: 'Dokumentet nga jashtë, autorizimi, banka, hap pas hapi' },
            { href: '/dashboard/arbk', icon: Landmark, title: 'Udhëzuesi ARBK', sub: 'Regjistrimi i biznesit dhe të gjitha ndryshimet' },
            { href: '/dashboard/tatime', icon: Receipt, title: 'Sistemi tatimor në Kosovë', sub: 'EDI, TVSH, paga, marrëveshjet e tatimit të dyfishtë' },
            { href: '/dashboard/dogana', icon: Truck, title: 'Si të importoj / eksportoj', sub: 'Procedurat doganore, EUR.1, transporti' },
          ].map((b) => (
            <Link key={b.href} href={b.href} className="rounded-xl border-2 border-[#1B4F72]/15 bg-white p-5 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
                  <b.icon className="h-5 w-5 text-[#1B4F72]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">{b.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{b.sub}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1B4F72] group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Burimet zyrtare */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Burimet zyrtare</h2>
        </div>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-700 mb-4">
              Statistikat makroekonomike (paga mesatare, investimet e huaja, remitancat) publikohen periodikisht
              nga institucionet më poshtë. Në KBH citojmë vetëm burime zyrtare.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OFFICIAL_SOURCES.map((src) => (
                <a key={src.url} href={src.url} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 group">
                  <ExternalLink className="h-3.5 w-3.5 text-[#2E86C1] shrink-0 mt-1" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#1B4F72]">{src.name}</p>
                    <p className="text-xs text-gray-500">{src.what}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-gray-400 max-w-3xl">
        KBH është platformë informimi dhe lidhjeje biznesore. Nuk mban fonde dhe nuk ndërmjetëson transaksione
        financiare. Vendimet e investimit merren me këshilltarë ligjorë e financiarë të pavarur.
      </p>
    </div>
  )
}
