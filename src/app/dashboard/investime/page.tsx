import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building2, MapPin, TrendingUp, Zap, Cpu, Utensils, Sprout, Wrench,
  ExternalLink, AlertTriangle, ArrowRight, ChevronRight, Users,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const LAST_VERIFIED = '2026-06-15'

interface Zone {
  name: string
  location: string
  focus: string
  benefits: string[]
  contact?: string
  website?: string
}

const ZONES: Zone[] = [
  {
    name: 'Parku Industrial Mitrovicë (Drenas)',
    location: 'Drenas, Kosovë Qendrore',
    focus: 'Prodhim, përpunim metalik, montim, logjistik',
    benefits: [
      'Toka të parapërgatitura me infrastrukturë',
      'Kosto e ulët e qirasë',
      'Afër autostradës R7',
      'Përfaqësim i fortë i kompanive turke dhe kosovare',
    ],
    website: 'https://mzhe-ks.net',
  },
  {
    name: 'Zona Ekonomike Suharekë',
    location: 'Suharekë',
    focus: 'Prodhim, tekstil, agropërpunim',
    benefits: [
      'Statusi i Zonës Ekonomike (përfitime tatimore)',
      'Afër kufirit shqiptar dhe Ballkanit Perëndimor',
      'Fuqi punëtore e disponueshme dhe kosto e ulët',
    ],
  },
  {
    name: 'Parku Industrial Prizren',
    location: 'Prizren',
    focus: 'Përpunim ushqimor, tekstil, prodhim i lehtë',
    benefits: [
      'Traditë e fortë e prodhimit',
      'Aksesueshmëri e mirë kah Shqipëria (Porti i Durrësit)',
      'Kosto konkurruese e punës',
    ],
  },
  {
    name: 'Zona Industriale Rahovec',
    location: 'Rahovec',
    focus: 'Vera dhe agropërpunim',
    benefits: [
      'Klima ideale për vreshtari (Kosova jugore)',
      'Tokë pjellore për agrikulturë',
      'Traditë 100+ vjeçare në verë',
    ],
  },
  {
    name: 'Parku Teknologjik Prishtinë (Innovation Centre)',
    location: 'Prishtinë',
    focus: 'IT, softuer, start-up, biznes dixhital',
    benefits: [
      'Zyra bashkëpuntore për start-up',
      'Programe mentorimi + akselerator',
      'Rrjet me investitorë të huaj',
      'Afër universiteteve',
    ],
    website: 'https://ickosovo.com',
  },
]

interface Sector {
  icon: React.ComponentType<{ className?: string }>
  name: string
  why: string
  opportunities: string[]
  challenges?: string
}

const SECTORS: Sector[] = [
  {
    icon: Utensils,
    name: 'Agropërpunim',
    why: 'Kosova prodhon frutash, perimesh, mishi dhe qumështi cilësor, por shumica shitet e freskët. Përpunimi lokal ka margjina të mira.',
    opportunities: [
      'Konservim frutash dhe perimesh (produkte tradicionale + moderne)',
      'Fabrika e mishit dhe djathit (rritje e kërkesës për produkte lokale)',
      'Lëngje frutash dhe smoothies (eksport në BE)',
      'Bulmet organik dhe biologjik',
      'Prodhim vere dhe rakie premium',
    ],
    challenges: 'Standardet e BE-së për ushqim; certifikimi HACCP është i domosdoshëm për eksport.',
  },
  {
    icon: Sprout,
    name: 'Bujqësi organike',
    why: 'Tokë pjellore, moti i përshtatshëm, dhe kërkesa në rritje për produkte organike në BE.',
    opportunities: [
      'Frutash pyjore (mjedra, boronica, aronia) — eksport i mirë në Gjermani',
      'Bimë medicinale dhe aromatike',
      'Mjaltë organik (Kosova ka traditë të fortë)',
      'Vaj ulliri (në rritje në Kosovën jugore)',
    ],
    challenges: 'Certifikimi organik EU merr 2-3 vjet. Rekomandohet të fillosh me hektarë të vegjël dhe të zgjerohesh.',
  },
  {
    icon: Zap,
    name: 'Energji e rinovueshme',
    why: 'Kosova ka potencial të madh diellor (2000+ orë diell/vit) dhe erë në disa zona. Qeveria mbështet me tarifa preferenciale.',
    opportunities: [
      'Panele diellore për shtëpi dhe biznese (feed-in tariff aktiv)',
      'Parqe të mëdha solare',
      'Ngrohje me biomasë (pyllërirë e madhe)',
      'Konsulencë dhe instalim (kërkesa në rritje)',
    ],
    challenges: 'Rrjeti elektrik ka kufizime në disa zona; procesi për leje mund të jetë i gjatë.',
  },
  {
    icon: Cpu,
    name: 'TIK dhe Software',
    why: 'Kosova ka popullatë të re (mesatarja 30 vjeç), talent teknik në rritje, dhe kosto shumë konkurruese për zhvillim softueri.',
    opportunities: [
      'Zhvillim softuerësh për klientë të huaj (outsourcing)',
      'SaaS produkte për tregjet e BE-së',
      'Shërbime IT dhe AI për diaporën (klientët e kanë familjaritetin gjuhësor)',
      'E-commerce dhe platforma dixhitale',
      'Fintech dhe pagesat',
    ],
  },
  {
    icon: Building2,
    name: 'Turizëm dhe mikpritje',
    why: 'Male, kultura e pasur, gastronomia, dhe rritje e diasporës si vizitorë. Sektor akoma i pashfrytëzuar.',
    opportunities: [
      'Bujtina rurale (agro-turizëm) në Sharr, Rugova, Anamorava',
      'Hotelet boutique në qytete historike (Prizren, Gjakovë, Pejë)',
      'Turizëm alpin (skijim, ecje, mountain bike)',
      'Ushqimi tradicional dhe restorantet me përvojë',
    ],
    challenges: 'Infrastruktura turistike ende në zhvillim. Për projekte të mëdha, planifiko investim mbi 500,000 EUR.',
  },
  {
    icon: Wrench,
    name: 'Prodhim dhe metaltrajtim',
    why: 'Fuqia punëtore e specializuar, kosto e ulët, dhe afërsia me tregjet e BE-së e bëjnë prodhimin tërheqës.',
    opportunities: [
      'Mobilje druri (eksport në Gjermani, Zvicër)',
      'Struktura metalike dhe konstruksion',
      'Pjesë auto (për tregun e BE-së dhe Turqisë)',
      'Ambalazhe dhe letër',
    ],
  },
]

interface Incentive {
  title: string
  description: string
  eligibility: string
}

const INCENTIVES: Incentive[] = [
  {
    title: 'Norma e ulët tatimore korporative (10%)',
    description: 'Një nga më të ulëtat në Ballkan dhe në BE. Për krahasim: Gjermani ~30%, Zvicër ~15-20% (varet nga kantoni), Austri 25%.',
    eligibility: 'Të gjitha shoqëritë tregtare të regjistruara në Kosovë.',
  },
  {
    title: 'TVSH 0% për eksport',
    description: 'Malli i eksportuar është plotësisht i liruar nga TVSH. Kjo është avantazh i madh krahasuar me tregtinë e brendshme.',
    eligibility: 'Për çdo eksport të dokumentuar.',
  },
  {
    title: 'Preferenca doganore CEFTA + BE (MSA)',
    description: 'Malli i prodhuar në Kosovë hyn me 0% doganë në BE (me EUR.1) dhe në vendet CEFTA. Kjo është zgjerim tregu prej 500+ milion konsumatorësh.',
    eligibility: 'Malli i origjinës kosovare me certifikatë EUR.1.',
  },
  {
    title: 'Fondi Kosovar për Garantimin e Kredive (FKGK)',
    description: 'FKGK garanton deri 50-80% të kredisë për SME-të, çka ul shumë kërkesat e kolateralit dhe interesin.',
    eligibility: 'SME-të kosovare me projekte të vlerësuara pozitivisht nga bankat partnere.',
  },
  {
    title: 'Grantet nga EU4Business, KIESA, MZHR',
    description: 'Programe të vazhdueshme që financojnë investime deri 200,000 EUR për fabrika, teknologji, ndërkombëtarizim.',
    eligibility: 'Zakonisht SME me qarkullim dhe punonjës minimale të përcaktuara në secilën thirrje.',
  },
  {
    title: 'Marrëveshjet e tatimit të dyfishtë',
    description: 'Me Gjermani, Zvicër, Austri, Britani dhe shumë vende të tjera. Fitimet nga Kosova nuk tatohen dy herë.',
    eligibility: 'Për rezidentë tatimorë të vendeve me marrëveshje aktive.',
  },
]

export default function InvestimePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Investo në Kosovë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Zona ekonomike, parqe industriale, sektorë me potencial të lartë investimi, dhe incentivat
          kryesore për diasporën që dëshiron të investojë në atdhe.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Konteksti makro (2026)</p>
          <p>
            Rritja ekonomike Kosovës parashikohet mbi 4% për vitin e ardhshëm. Popullatë e re
            (mesatare 30 vjeç), aksesueshmëri në BE me 0% tarifë doganore, tatim korporativ 10%,
            dhe rrjet i madh diaspore që lehtëson tregtinë. Sektorët me potencial më të madh: agropërpunim,
            energji e rinovueshme, TIK, prodhim dhe turizëm.
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Sektorët me potencial</h2>
          <span className="text-xs text-gray-500">{SECTORS.length} sektorë</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {SECTORS.map((s) => (
            <details key={s.name} className="rounded-xl border border-gray-200 bg-white group">
              <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
                <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                  <s.icon className="h-5 w-5 text-[#1B4F72]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{s.why}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform shrink-0 mt-1" />
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mundësi konkrete</h4>
                  <ul className="space-y-1.5">
                    {s.opportunities.map((o, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#1B4F72] mt-1">•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {s.challenges && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <strong>Sfidë kryesore:</strong> {s.challenges}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Zonat ekonomike dhe parqet industriale</h2>
          <span className="text-xs text-gray-500">{ZONES.length} zona</span>
        </div>
        <div className="space-y-3">
          {ZONES.map((z) => (
            <Card key={z.name}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#1B4F72] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{z.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{z.location} · {z.focus}</p>
                    <ul className="mt-3 space-y-1">
                      {z.benefits.map((b, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    {z.website && (
                      <a href={z.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:underline">
                        Mëso më shumë <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Incentivat kryesore për investitorë</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {INCENTIVES.map((inc) => (
            <Card key={inc.title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{inc.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{inc.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Për kë:</strong> {inc.eligibility}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Institucionet mbështetëse</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'KIESA', desc: 'Agjencia për Investime dhe Mbështetje të Ndërmarrjeve', url: 'https://kiesa.rks-gov.net' },
            { name: 'MZHR', desc: 'Ministria e Zhvillimit Rajonal (grante dhe subvencione)', url: 'https://mzhr.rks-gov.net' },
            { name: 'FKGK', desc: 'Fondi Kosovar për Garantimin e Kredive', url: 'https://fondikgk.org' },
            { name: 'Odat Ekonomike', desc: 'OEK (Odat Ekonomike e Kosovës) + AAK (Aleanca)', url: 'https://oek-kcc.org' },
          ].map((i) => (
            <a key={i.name} href={i.url} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#1B4F72]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{i.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{i.desc}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-[#2E86C1] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Shënim ligjor</p>
          <p>
            KBH është platformë informimi dhe matchmaking-u. Nuk mban fonde, nuk fasiliton transaksione
            financiare dhe nuk jep këshillë investimi. Vendimet finale merren mes palëve me këshilltarë juridikë,
            tatimor dhe financiarë profesionalë. Data e verifikimit: {LAST_VERIFIED}.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Hapat e ardhshëm</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Si të hap biznes', desc: 'Udhëzimi i plotë për diasporën', href: '/dashboard/hap-biznes-kosove' },
            { title: 'Kompani Kosovare', desc: 'Directory për të gjetur partnerë', href: '/dashboard/directory' },
            { title: 'Matchmaking', desc: 'Rekomandime automatike partnerësh', href: '/dashboard/matchmaking' },
            { title: 'Grantet aktive', desc: 'Financim publik', href: '/dashboard/grants' },
            { title: 'Panairet', desc: 'Ngjarje për diasporën', href: '/dashboard/panaire-evente' },
            { title: 'Konsultime', desc: 'Bisedë me eksperte', href: '/dashboard/bookings' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">{l.title}</p>
              <p className="text-xs text-gray-600 mt-1">{l.desc}</p>
              <ArrowRight className="h-4 w-4 text-[#1B4F72] mt-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
