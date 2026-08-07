import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { TradePulse } from '@/components/marketing/TradePulse'
import { Button } from '@/components/ui/button'
import { getServerT, getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import { prisma } from '@/lib/prisma'
import { countActiveGrants } from '@/lib/active-grants'
import { SECTORS } from '@/lib/sectors'
import { getHomeSources, DATA_SOURCES } from '@/lib/home-sources'
import {
  Search, Calendar, BookOpen, ArrowRight,
  UserPlus, ListChecks, Sparkles, FileText, Globe2,
  Factory, Ship, Rocket, Wheat, Briefcase, Building2, HeartHandshake,
  ShieldCheck, TrendingUp, Map, Scale, BellRing, CheckCircle2,
} from 'lucide-react'

export const revalidate = 600

interface Tri { sq: string; en: string; de: string }

// Perjashto llogarite testuese nga statistikat publike — vetem te dhena reale.
const NOT_TEST_OWNER = {
  owner: {
    AND: [
      { email: { not: { endsWith: '@kbh.test' } } },
      { email: { not: { endsWith: '@test.local' } } },
    ],
  },
}

async function getStats() {
  const [grants, fairs, guides, companies, diaspora, offerings, categories, markets, rules, certs] = await Promise.all([
    countActiveGrants(),
    prisma.tradeFair.count({ where: { isActive: true, deletedAt: null, startDate: { gte: new Date() } } }),
    prisma.exportGuide.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.company.count({ where: { profileStatus: 'APPROVED', ...NOT_TEST_OWNER } }),
    prisma.company.count({ where: { profileStatus: 'APPROVED', roleType: 'DIASPORA', ...NOT_TEST_OWNER } }),
    prisma.offering.count({ where: { status: 'APPROVED', company: NOT_TEST_OWNER } }),
    prisma.productCategory.count({ where: { status: 'APPROVED' } }),
    prisma.marketStat.findMany({ where: { kind: 'SECTOR_IMPORTS' }, select: { countryCode: true }, distinct: ['countryCode'] }).then((r) => r.length).catch(() => 0),
    prisma.marketRequirement.count({ where: { status: 'VERIFIED' } }).catch(() => 0),
    prisma.certification.count({ where: { isActive: true } }).catch(() => 0),
  ])
  return { grants, fairs, guides, companies, diaspora, offerings, categories, markets, rules, certs }
}

export default async function HomePage() {
  const t = getServerT()
  const locale: Locale = getServerLocale()
  const [counts, src] = await Promise.all([getStats(), getHomeSources()])
  const tx = (o: Tri) => o[locale] ?? o.sq

  // §13.2: statistika dinamike nga DB. Numrat e bizneseve dalin vetem kur kalojne
  // pragun 5 — pa fryrje artificiale, vetem realiteti.
  const MIN_SHOW = 5
  const stats = [
    { value: String(counts.grants), label: t('stats.grants') },
    { value: String(counts.fairs), label: t('stats.fairs') },
    { value: String(counts.guides), label: t('stats.countries') },
    { value: String(counts.rules), label: tx({ sq: 'Kërkesa tregu të verifikuara', en: 'Verified market requirements', de: 'Geprüfte Marktanforderungen' }) },
    { value: String(counts.certs), label: tx({ sq: 'Certifikime në katalog', en: 'Certifications catalogued', de: 'Katalogisierte Zertifizierungen' }) },
    ...(counts.companies >= MIN_SHOW
      ? [{ value: String(counts.companies), label: tx({ sq: 'Biznese të regjistruara', en: 'Registered businesses', de: 'Registrierte Unternehmen' }) }]
      : [{ value: String(SECTORS.length), label: tx({ sq: 'Sektorë të mbuluar', en: 'Sectors covered', de: 'Abgedeckte Sektoren' }) }]),
  ]

  // ---- Hero ----
  const hero = {
    title1: { sq: 'Burime financimi, panairet dhe udhëzuesit e eksportit', en: 'Funding sources, trade fairs, and export guides', de: 'Finanzierungsquellen, Messen und Export-Leitfäden' },
    title2: { sq: 'në një platformë të vetme.', en: 'in one single platform.', de: 'auf einer einzigen Plattform.' },
    sub: {
      sq: 'Kosova Business Hub i ndihmon bizneset kosovare të gjejnë më shpejt mundësi financimi, panaire ndërkombëtare, rregulla eksporti dhe informata praktike për rritje në tregjet vendore dhe të jashtme.',
      en: 'Kosova Business Hub helps Kosovo businesses find financing opportunities, international trade fairs, export rules, and practical information for growth in local and foreign markets, faster.',
      de: 'Kosova Business Hub hilft Unternehmen im Kosovo, Finanzierungsmöglichkeiten, internationale Messen, Exportregeln und praktische Informationen für Wachstum auf lokalen und ausländischen Märkten schneller zu finden.',
    },
    cta: { sq: 'Regjistrohu falas', en: 'Sign up free', de: 'Kostenlos registrieren' },
    cta2: { sq: 'Shiko çfarë ofron', en: 'See what it offers', de: 'Was wird geboten' },
  }
  const heroProof = {
    sq: `${counts.grants} mundësi financimi aktive · ${counts.fairs} panaire · ${counts.guides} tregje me udhëzues`,
    en: `${counts.grants} active funding opportunities · ${counts.fairs} fairs · ${counts.guides} markets with guides`,
    de: `${counts.grants} aktive Finanzierungen · ${counts.fairs} Messen · ${counts.guides} Märkte mit Leitfäden`,
  }

  // ---- Why it matters ----
  const why = {
    title: { sq: 'Pse është e nevojshme?', en: 'Why it matters', de: 'Warum es wichtig ist' },
    body: {
      sq: 'Shumë biznese në Kosovë nuk aplikojnë në grante, nuk marrin pjesë në panaire dhe nuk eksplorojnë tregje të reja, jo sepse nuk kanë potencial, por sepse informata është e shpërndarë, e vonuar dhe e vështirë për t’u kuptuar. Ne e mbledhim atë informatë në një vend, të strukturuar dhe të përdorshme.',
      en: 'Many businesses in Kosovo do not apply for grants, do not attend fairs, and do not explore new markets, not because they lack potential, but because the information is scattered, delayed, and hard to understand. We gather that information in one place, structured and usable.',
      de: 'Viele Unternehmen im Kosovo bewerben sich nicht um Förderungen, nehmen nicht an Messen teil und erschließen keine neuen Märkte, nicht weil ihnen das Potenzial fehlt, sondern weil die Informationen verstreut, verspätet und schwer verständlich sind. Wir bündeln diese Informationen an einem Ort, strukturiert und nutzbar.',
    },
  }

  // ---- What you can find ----
  const findTitle = { sq: 'Çfarë mund të gjesh në platformë?', en: 'What you can find on the platform', de: 'Was Sie auf der Plattform finden' }
  const findCards = [
    { icon: Search, tag: { sq: 'Mundësi financimi', en: 'Funding opportunities', de: 'Finanzierungsmöglichkeiten' }, d: { sq: 'Grante e subvencione për biznese prodhuese, agro-përpunim, teknologji, turizëm dhe sektorë me potencial rritjeje, me afatin dhe dokumentet e kërkuara.', en: 'Grants and subsidies for manufacturers, agro-processing, technology, tourism, and sectors with growth potential, with deadlines and required documents.', de: 'Förderungen und Subventionen für Hersteller, Agrarverarbeitung, Technologie, Tourismus und wachstumsstarke Branchen, mit Fristen und erforderlichen Unterlagen.' } },
    { icon: Calendar, tag: { sq: 'Panaire ndërkombëtare', en: 'International fairs', de: 'Internationale Messen' }, d: { sq: 'Panaire në Gjermani, Zvicër, Itali, Austri, Turqi dhe tregje të tjera relevante për eksportuesit kosovarë, me datat dhe sektorët përkatës.', en: 'Fairs in Germany, Switzerland, Italy, Austria, Turkey, and other markets relevant to Kosovo exporters, with dates and sectors.', de: 'Messen in Deutschland, der Schweiz, Italien, Österreich, der Türkei und weiteren Märkten, mit Terminen und Branchen.' } },
    { icon: BookOpen, tag: { sq: 'Udhëzues praktikë', en: 'Practical guides', de: 'Praktische Leitfäden' }, d: { sq: 'Regjistrimi i biznesit, tatimet, dogana, siguria e ushqimit, prona industriale dhe siguria në punë, hap pas hapi.', en: 'Business registration, taxes, customs, food safety, industrial property, and workplace safety, step by step.', de: 'Unternehmensregistrierung, Steuern, Zoll, Lebensmittelsicherheit, gewerblicher Rechtsschutz und Arbeitssicherheit, Schritt für Schritt.' } },
  ]

  // ---- Export intelligence (produkti i sotem) ----
  const xiTitle = { sq: 'Inteligjencë eksporti, jo vetëm lista', en: 'Export intelligence, not just listings', de: 'Export-Intelligenz, nicht nur Listen' }
  const xiSub = {
    sq: 'Pjesa që e dallon platformën: të dhëna tregu dhe kërkesa ligjore të lidhura me profilin e biznesit tënd.',
    en: 'What sets the platform apart: market data and legal requirements tied to your business profile.',
    de: 'Was die Plattform auszeichnet: Marktdaten und rechtliche Anforderungen, verknüpft mit Ihrem Unternehmensprofil.',
  }
  const xiCards = [
    {
      icon: Map,
      t: { sq: 'Atlasi i tregjeve', en: 'Market Atlas', de: 'Markt-Atlas' },
      d: {
        sq: `Hartë e ${counts.guides} tregjeve: sa importon secili treg nga sektori yt, popullsia, fuqia blerëse dhe panairet. Çdo shifër me burimin, vitin dhe datën e kontrollit.`,
        en: `A map of ${counts.guides} markets: how much each imports from your sector, population, purchasing power, and fairs. Every figure carries its source, year, and check date.`,
        de: `Eine Karte mit ${counts.guides} Märkten: Importe aus Ihrer Branche, Bevölkerung, Kaufkraft und Messen. Jede Zahl mit Quelle, Jahr und Prüfdatum.`,
      },
    },
    {
      icon: Scale,
      t: { sq: 'Kërkesat e tregut, me ligjin përkatës', en: 'Market requirements, with the law', de: 'Marktanforderungen mit Rechtsgrundlage' },
      d: {
        sq: `${counts.rules} kërkesa të verifikuara: çfarë duhet për produktin tënd në secilin treg, çka është detyrim ligjor dhe çka pritet nga blerësit. Kur një treg është i mbyllur me ligj, e themi hapur dhe e citojmë aktin.`,
        en: `${counts.rules} verified requirements: what your product needs in each market, what is a legal obligation, and what buyers expect. When a market is closed by law, we say so and cite the act.`,
        de: `${counts.rules} geprüfte Anforderungen je Markt: gesetzliche Pflichten und Käufererwartungen. Ist ein Markt gesetzlich geschlossen, sagen wir es und nennen den Rechtsakt.`,
      },
    },
    {
      icon: BellRing,
      t: { sq: 'Certifikimet dhe afatet', en: 'Certifications and deadlines', de: 'Zertifizierungen und Fristen' },
      d: {
        sq: `Katalog me ${counts.certs} certifikime sipas sektorit. Shëno ato që i ke me datën e skadimit dhe merr kujtues para se të skadojnë.`,
        en: `A catalogue of ${counts.certs} certifications by sector. Record the ones you hold with their expiry and get reminders before they lapse.`,
        de: `Ein Katalog mit ${counts.certs} Zertifizierungen nach Branche. Erfassen Sie Ihre mit Ablaufdatum und erhalten Sie Erinnerungen.`,
      },
    },
  ]

  // ---- How it works ----
  const howTitle = { sq: 'Si funksionon platforma?', en: 'How the platform works', de: 'So funktioniert die Plattform' }
  const steps = [
    { icon: UserPlus, t: { sq: 'Regjistro biznesin', en: 'Register your business', de: 'Unternehmen registrieren' }, d: { sq: 'Regjistron kompaninë, sektorin dhe produktet kryesore.', en: 'You register your company, sector, and main products.', de: 'Sie registrieren Unternehmen, Branche und Hauptprodukte.' } },
    { icon: ListChecks, t: { sq: 'Zgjedh fushat që të interesojnë', en: 'Choose what interests you', de: 'Wählen Sie Ihre Themen' }, d: { sq: 'Zgjedh nëse kërkon financim, panaire, eksport, udhëzues praktikë apo konsultime.', en: 'You choose whether you want financing, fairs, export help, practical guides, or consultations.', de: 'Sie wählen zwischen Finanzierung, Messen, Exporthilfe, Leitfäden oder Beratung.' } },
    { icon: Sparkles, t: { sq: 'Sheh çka vlen për ty', en: 'See what matters for you', de: 'Sehen Sie, was für Sie zählt' }, d: { sq: 'Mundësitë, tregjet dhe kërkesat filtrohen sipas sektorit dhe produkteve që prodhon.', en: 'Opportunities, markets, and requirements are filtered by your sector and the products you make.', de: 'Chancen, Märkte und Anforderungen werden nach Branche und Produkten gefiltert.' } },
  ]

  // ---- Who it is for ----
  const audienceTitle = { sq: 'Për kë është platforma?', en: 'Who the platform is for', de: 'Für wen die Plattform ist' }
  const audienceSub = { sq: 'Ndërtuar për biznese kosovare që kërkojnë rritje, financim, ekspansion dhe qasje në tregje të reja.', en: 'Built for Kosovo businesses seeking growth, financing, expansion, and access to new markets.', de: 'Entwickelt für kosovarische Unternehmen, die Wachstum, Finanzierung, Expansion und Zugang zu neuen Märkten suchen.' }
  const audiences = [
    { icon: Factory, l: { sq: 'Biznese prodhuese', en: 'Manufacturers', de: 'Hersteller' } },
    { icon: Ship, l: { sq: 'Eksportues aktualë', en: 'Active exporters', de: 'Aktive Exporteure' } },
    { icon: TrendingUp, l: { sq: 'Biznese që duan të eksportojnë', en: 'Businesses aiming to export', de: 'Unternehmen mit Exportziel' } },
    { icon: Rocket, l: { sq: 'Startupe dhe kompani inovative', en: 'Startups and innovators', de: 'Start-ups und Innovatoren' } },
    { icon: Wheat, l: { sq: 'Agro-përpunues', en: 'Agro-processors', de: 'Agrarverarbeiter' } },
    { icon: Briefcase, l: { sq: 'Kompani të shërbimeve', en: 'Service companies', de: 'Dienstleistungsunternehmen' } },
    { icon: Building2, l: { sq: 'Shoqata biznesi dhe oda ekonomike', en: 'Business associations and chambers', de: 'Wirtschaftsverbände und Kammern' } },
    { icon: HeartHandshake, l: { sq: 'Organizata dhe programe zhvillimore', en: 'Development organizations and programs', de: 'Entwicklungsorganisationen und -programme' } },
  ]

  // ---- Sources ----
  const sourcesTitle = { sq: 'Prej nga vijnë informatat', en: 'Where the information comes from', de: 'Woher die Informationen stammen' }
  const sourcesSub = {
    sq: 'Mbledhim thirrjet dhe njoftimet nga institucione zyrtare dhe i përditësojmë rregullisht. Të dhënat e tregjeve vijnë nga baza statistikore zyrtare, të cituara me vitin dhe datën e kontrollit.',
    en: 'We gather calls and notices from official institutions and update them regularly. Market data comes from official statistical sources, cited with the year and check date.',
    de: 'Wir sammeln Aufrufe von offiziellen Institutionen und aktualisieren sie regelmäßig. Marktdaten stammen aus offiziellen Statistikquellen, zitiert mit Jahr und Prüfdatum.',
  }
  const lblMonitored = { sq: 'Monitorohen çdo ditë', en: 'Monitored daily', de: 'Täglich überwacht' }
  const lblData = { sq: 'Të dhëna zyrtare që përdorim', en: 'Official data we use', de: 'Offizielle Daten, die wir nutzen' }
  const lblPlanned = { sq: 'Në proces shtimi', en: 'Being added', de: 'In Vorbereitung' }
  const lblUpdated = { sq: 'Përditësuar së fundi', en: 'Last updated', de: 'Zuletzt aktualisiert' }

  // ---- Development partners ----
  const partnerTitle = { sq: 'Për partnerë zhvillimorë dhe institucione', en: 'For development partners and institutions', de: 'Für Entwicklungspartner und Institutionen' }
  const partnerBody = { sq: 'Kosova Business Hub mund të shërbejë si mjet digjital për programe që synojnë zhvillimin e sektorit privat, rritjen e eksportit dhe përmirësimin e qasjes në financim. Përmes platformës, partnerët arrijnë më lehtë tek bizneset relevante dhe shpërndajnë mundësi në mënyrë të strukturuar.', en: 'Kosova Business Hub can serve as a digital tool for programs that develop the private sector, grow exports, and improve access to finance. Through the platform, partners reach relevant businesses more easily and distribute opportunities in a structured way.', de: 'Kosova Business Hub kann als digitales Instrument für Programme dienen, die den Privatsektor entwickeln, Exporte steigern und den Finanzierungszugang verbessern. Partner erreichen relevante Unternehmen leichter und verteilen Chancen strukturiert.' }
  const partnerPoints = [
    { sq: 'Shpërndarje më e mirë e mundësive tek bizneset relevante', en: 'Better distribution of opportunities to relevant businesses', de: 'Bessere Verteilung von Chancen an relevante Unternehmen' },
    { sq: 'Të dhëna më të qarta mbi interesimin e sektorëve', en: 'Clearer data on sector interest', de: 'Klarere Daten zum Brancheninteresse' },
    { sq: 'Mbështetje për eksport, financim dhe zhvillim të ndërmarrjeve', en: 'Support for export, financing, and enterprise development', de: 'Unterstützung für Export, Finanzierung und Unternehmensentwicklung' },
  ]
  const partnerCta = { sq: 'Diskuto bashkëpunimin', en: 'Discuss a partnership', de: 'Partnerschaft besprechen' }

  // ---- Final CTA ----
  const finalTitle = { sq: 'Gati për ta rritur qasjen e biznesit tuaj në mundësi të reja?', en: 'Ready to grow your business access to new opportunities?', de: 'Bereit, den Zugang Ihres Unternehmens zu neuen Chancen zu erweitern?' }
  const finalBody = { sq: 'Regjistrohu dhe fillo të marrësh informata të strukturuara për financim, panaire, tregje dhe kërkesat e tyre.', en: 'Sign up and start receiving structured information on financing, fairs, markets, and their requirements.', de: 'Registrieren Sie sich und erhalten Sie strukturierte Informationen zu Finanzierung, Messen, Märkten und deren Anforderungen.' }
  const pilotNote = { sq: 'Platforma është në fazë pilot dhe zhvillohet vazhdimisht së bashku me bizneset dhe partnerët.', en: 'The platform is in a pilot phase and is developed continuously together with businesses and partners.', de: 'Die Plattform befindet sich in einer Pilotphase und wird gemeinsam mit Unternehmen und Partnern laufend weiterentwickelt.' }

  const partnerMail = 'mailto:info@kosovabusinesses.aiaohub.com?subject=Bashkëpunim%20me%20Kosova%20Business%20Hub'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B4F72] via-[#1B4F72] to-[#2E86C1] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {tx(hero.title1)}
              <span className="block text-[#F39C12] mt-1">{tx(hero.title2)}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl leading-relaxed">
              {tx(hero.sub)}
            </p>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-white/90 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
              <CheckCircle2 className="h-4 w-4 text-[#F39C12]" aria-hidden="true" />
              {tx(heroProof)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
                  {tx(hero.cta)}
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#cka-ofron">
                <Button size="xl" variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-[#1B4F72] w-full sm:w-auto">
                  {tx(hero.cta2)}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TradePulse />

      {/* Why it matters */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-4">{tx(why.title)}</h2>
          <p className="text-lg text-gray-600 leading-relaxed">{tx(why.body)}</p>
        </div>
      </section>

      {/* What you can find */}
      <section id="cka-ofron" className="py-16 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] text-center mb-12">{tx(findTitle)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {findCards.map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#2E86C1] transition-all">
                <div className="bg-[#1B4F72]/5 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                    <c.icon className="h-5 w-5 text-[#1B4F72]" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-[#1B4F72]">{tx(c.tag)}</span>
                </div>
                <p className="px-6 py-5 text-sm text-gray-600 leading-relaxed">{tx(c.d)}</p>
              </div>
            ))}
          </div>

          {/* Live counters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-12 pt-10 border-t border-gray-200">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1B4F72] tabular-nums">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export intelligence */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-3">{tx(xiTitle)}</h2>
            <p className="text-lg text-gray-600">{tx(xiSub)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {xiCards.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-6 hover:border-[#2E86C1] transition-colors">
                <div className="w-11 h-11 rounded-lg bg-[#2E86C1]/10 flex items-center justify-center mb-4">
                  <c.icon className="h-5 w-5 text-[#2E86C1]" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{tx(c.t)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{tx(c.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="si-funksionon" className="py-16 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] text-center mb-12">{tx(howTitle)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-[#1B4F72] text-white flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                  <s.icon className="h-5 w-5 text-[#2E86C1]" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{tx(s.t)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{tx(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-3">{tx(audienceTitle)}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{tx(audienceSub)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {audiences.map((a, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2E86C1]/10 flex items-center justify-center shrink-0">
                  <a.icon className="h-5 w-5 text-[#2E86C1]" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-gray-800 leading-snug">{tx(a.l)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources — nga baza, e ndare ndershem */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-3">{tx(sourcesTitle)}</h2>
            <p className="text-gray-600 leading-relaxed">{tx(sourcesSub)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-[#27AE60]" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{tx(lblMonitored)} · {src.monitoredCount}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {src.monitored.map((m) => <li key={m.name}>{m.name}</li>)}
              </ul>
              {src.freshestDate && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">{tx(lblUpdated)}: {src.freshestDate}</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-[#2E86C1]" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{tx(lblData)}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {DATA_SOURCES.map((d) => (
                  <li key={d.name}><span className="font-medium">{d.name}</span> <span className="text-gray-500">— {d.what}</span></li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{tx(lblPlanned)} · {src.plannedCount}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{src.planned.join(', ')}.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Development partners */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#1B4F72]/5 to-white p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                <Globe2 className="h-6 w-6 text-[#1B4F72]" aria-hidden="true" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72]">{tx(partnerTitle)}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">{tx(partnerBody)}</p>
            <ul className="space-y-2.5 mb-8">
              {partnerPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-[#2E86C1] mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{tx(p)}</span>
                </li>
              ))}
            </ul>
            <a href={partnerMail}>
              <Button size="lg" className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
                {tx(partnerCta)}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-[#1B4F72] mb-4">{tx(finalTitle)}</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">{tx(finalBody)}</p>
          <Link href="/register">
            <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
              {tx(hero.cta)}
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <p className="text-xs text-gray-400 mt-8">{tx(pilotNote)}</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
