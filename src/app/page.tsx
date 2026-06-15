import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { TradePulse } from '@/components/marketing/TradePulse'
import { Button } from '@/components/ui/button'
import { getServerT, getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import { prisma } from "@/lib/prisma"
import { countActiveGrants } from "@/lib/active-grants"
import { SECTORS } from '@/lib/sectors'
import {
  Search, Calendar, BookOpen, ArrowRight,
  UserPlus, ListChecks, Sparkles, FileText, Globe2,
  Factory, Ship, Rocket, Wheat, Briefcase, Building2, HeartHandshake,
  ShieldCheck, TrendingUp, Landmark, Mail,
} from 'lucide-react'

export const revalidate = 600

interface Tri { sq: string; en: string; de: string }

async function getStats() {
  const [grants, fairs, guides, users, sources] = await Promise.all([
    countActiveGrants(),
    prisma.tradeFair.count({ where: { isActive: true, deletedAt: null, startDate: { gte: new Date() } } }),
    prisma.exportGuide.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.user.count(),
    prisma.source.count({ where: { isActive: true } }),
  ])
  return { grants, fairs, guides, users, sources }
}

export default async function HomePage() {
  const t = getServerT()
  const locale: Locale = getServerLocale()
  const counts = await getStats()
  const tx = (o: Tri) => o[locale] ?? o.sq

  const stats = [
    { value: String(counts.grants), label: t('stats.grants') },
    { value: String(counts.fairs), label: t('stats.fairs') },
    { value: String(counts.guides), label: t('stats.countries') },
    { value: '24/7', label: t('stats.ai') },
  ]

  // ---- Hero ----
  const hero = {
    title1: { sq: 'Grantet, panairet dhe udhëzuesit e eksportit', en: 'Grants, trade fairs, and export guides', de: 'Förderaufrufe, Messen und Export-Leitfäden' },
    title2: { sq: 'në një platformë të vetme.', en: 'in one single platform.', de: 'auf einer einzigen Plattform.' },
    sub: {
      sq: 'Kosova Business Hub i ndihmon bizneset kosovare të gjejnë më shpejt mundësi financimi, panaire ndërkombëtare, rregulla eksporti dhe informata praktike për rritje në tregjet vendore dhe të jashtme.',
      en: 'Kosova Business Hub helps Kosovo businesses find financing opportunities, international trade fairs, export rules, and practical information for growth in local and foreign markets, faster.',
      de: 'Kosova Business Hub hilft Unternehmen im Kosovo, Finanzierungsmöglichkeiten, internationale Messen, Exportregeln und praktische Informationen für Wachstum auf lokalen und ausländischen Märkten schneller zu finden.',
    },
    cta: { sq: 'Regjistrohu falas', en: 'Sign up free', de: 'Kostenlos registrieren' },
    cta2: { sq: 'Shiko si funksionon', en: 'See how it works', de: 'So funktioniert es' },
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

  // ---- How it works ----
  const howTitle = { sq: 'Si funksionon platforma?', en: 'How the platform works', de: 'So funktioniert die Plattform' }
  const steps = [
    { icon: UserPlus, t: { sq: 'Regjistro biznesin', en: 'Register your business', de: 'Unternehmen registrieren' }, d: { sq: 'Përdoruesi regjistron kompaninë, sektorin dhe interesat kryesore.', en: 'You register your company, your sector, and your main interests.', de: 'Sie registrieren Ihr Unternehmen, Ihre Branche und Ihre Hauptinteressen.' } },
    { icon: ListChecks, t: { sq: 'Zgjedh fushat që të interesojnë', en: 'Choose what interests you', de: 'Wählen Sie Ihre Themen' }, d: { sq: 'Biznesi zgjedh nëse kërkon grante, panaire, eksport, udhëzues praktikë apo konsultime.', en: 'You choose whether you want grants, fairs, export help, practical guides, or consultations.', de: 'Sie wählen, ob Sie Förderungen, Messen, Exporthilfe, praktische Leitfäden oder Beratung möchten.' } },
    { icon: Sparkles, t: { sq: 'Merr mundësi relevante', en: 'Get relevant opportunities', de: 'Relevante Chancen erhalten' }, d: { sq: 'Platforma shfaq mundësi të përshtatura sipas sektorit, interesit dhe fazës së zhvillimit të biznesit.', en: 'The platform shows opportunities matched to your sector, interest, and stage of growth.', de: 'Die Plattform zeigt Chancen, die zu Ihrer Branche, Ihrem Interesse und Ihrer Wachstumsphase passen.' } },
  ]

  // ---- What you can find (3 example cards) ----
  const findTitle = { sq: 'Çfarë mund të gjesh në platformë?', en: 'What you can find on the platform', de: 'Was Sie auf der Plattform finden' }
  const findCards = [
    { icon: Search, tag: { sq: 'Grant aktiv', en: 'Active grant', de: 'Aktiver Förderaufruf' }, d: { sq: 'Mundësi financimi për biznese prodhuese, agro-përpunim, teknologji, turizëm dhe sektorë me potencial rritjeje.', en: 'Financing for manufacturers, agro-processing, technology, tourism, and sectors with growth potential.', de: 'Finanzierung für Hersteller, Agrarverarbeitung, Technologie, Tourismus und Branchen mit Wachstumspotenzial.' } },
    { icon: Calendar, tag: { sq: 'Panair ndërkombëtar', en: 'International fair', de: 'Internationale Messe' }, d: { sq: 'Informata për panaire në Gjermani, Zvicër, Itali, Austri, Turqi dhe tregje të tjera relevante për eksportuesit kosovarë.', en: 'Fairs in Germany, Switzerland, Italy, Austria, Turkey, and other markets relevant to Kosovo exporters.', de: 'Messen in Deutschland, der Schweiz, Italien, Österreich, der Türkei und weiteren Märkten für kosovarische Exporteure.' } },
    { icon: BookOpen, tag: { sq: 'Udhëzues eksporti', en: 'Export guide', de: 'Export-Leitfaden' }, d: { sq: 'Informata praktike për dokumentacion, standarde, certifikime, doganë dhe kërkesa të tregjeve të jashtme.', en: 'Practical information on documents, standards, certifications, customs, and foreign market requirements.', de: 'Praktische Informationen zu Dokumenten, Standards, Zertifizierungen, Zoll und Anforderungen ausländischer Märkte.' } },
  ]

  // ---- Who it is for ----
  const audienceTitle = { sq: 'Për kë është platforma?', en: 'Who the platform is for', de: 'Für wen die Plattform ist' }
  const audienceSub = { sq: 'Ndërtuar për biznese kosovare që kërkojnë rritje, financim, ekspansion dhe qasje në tregje të reja.', en: 'Built  seeking growth, financing, expansion, and access to new markets.', de: 'Entwickelt für kosovarische Unternehmen, die Wachstum, Finanzierung, Expansion und Zugang zu neuen Märkten suchen.' }
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

  // ---- Sources monitored ----
  const sourcesTitle = { sq: 'Burimet që monitorohen', en: 'Sources we monitor', de: 'Überwachte Quellen' }
  const sourcesSub = { sq: 'Mbledhim thirrjet dhe njoftimet nga institucione zyrtare dhe organizatorë panairesh të verifikuar, dhe i përditësojmë rregullisht.', en: 'We gather calls and notices from official institutions and verified fair organizers, and update them regularly.', de: 'Wir sammeln Aufrufe und Mitteilungen von offiziellen Institutionen und verifizierten Messeveranstaltern und aktualisieren sie regelmäßig.' }
  const sourceItems = [
    'KIESA', 'MZHR', 'MINT', 'KOSME', 'Oda Ekonomike e Kosovës',
    'EU4Business', 'Organizatorë panairesh ndërkombëtarë',
  ]

  // ---- Impact / KPIs ----
  const impactTitle = { sq: 'Impakti që synojmë', en: 'The impact we aim for', de: 'Die angestrebte Wirkung' }
  const impactBody = { sq: 'Kosova Business Hub synon të krijojë ndikim praktik dhe të matshëm te bizneset kosovare duke përmirësuar qasjen në informata, duke rritur pjesëmarrjen në mundësi financimi dhe duke i ndihmuar kompanitë të përgatiten më mirë për eksport.', en: 'Kosova Business Hub aims to create practical, measurable impact  by improving access to information, increasing participation in financing opportunities, and helping companies prepare better for export.', de: 'Kosova Business Hub will mit besserem Informationszugang, höherer Beteiligung an Finanzierungsmöglichkeiten und besserer Exportvorbereitung eine praktische, messbare Wirkung für kosovarische Unternehmen erzielen.' }
  const kpis = [
    { v: String(counts.users), l: { sq: 'Biznese të regjistruara', en: 'Registered businesses', de: 'Registrierte Unternehmen' } },
    { v: String(counts.grants), l: { sq: 'Grante e mundësi të publikuara', en: 'Grants and opportunities published', de: 'Veröffentlichte Förderungen und Chancen' } },
    { v: String(counts.fairs), l: { sq: 'Panaire ndërkombëtare', en: 'International fairs', de: 'Internationale Messen' } },
    { v: String(counts.guides), l: { sq: 'Udhëzues praktikë të eksportit', en: 'Practical export guides', de: 'Praktische Export-Leitfäden' } },
    { v: String(SECTORS.length), l: { sq: 'Sektorë ekonomikë të mbuluar', en: 'Economic sectors covered', de: 'Abgedeckte Wirtschaftssektoren' } },
    { v: String(counts.sources), l: { sq: 'Burime zyrtare të monitoruara', en: 'Official sources monitored', de: 'Überwachte offizielle Quellen' } },
  ]

  // ---- Development partners ----
  const partnerTitle = { sq: 'Për partnerë zhvillimorë dhe institucione', en: 'For development partners and institutions', de: 'Für Entwicklungspartner und Institutionen' }
  const partnerBody = { sq: 'Kosova Business Hub mund të shërbejë si mjet digjital për programe që synojnë zhvillimin e sektorit privat, rritjen e eksportit, përmirësimin e qasjes në financim dhe informimin më të mirë të ndërmarrjeve kosovare. Përmes platformës, partnerët mund të arrijnë më lehtë tek bizneset relevante, të shpërndajnë mundësi në mënyrë të strukturuar dhe të masin interesimin e sektorëve të ndryshëm ndaj granteve, panaireve dhe programeve mbështetëse.', en: 'Kosova Business Hub can serve as a digital tool for programs that aim to develop the private sector, grow exports, improve access to finance, and better inform Kosovo enterprises. Through the platform, partners can reach relevant businesses more easily, distribute opportunities in a structured way, and measure how different sectors respond to grants, fairs, and support programs.', de: 'Kosova Business Hub kann als digitales Instrument für Programme dienen, die den Privatsektor entwickeln, Exporte steigern, den Finanzierungszugang verbessern und kosovarische Unternehmen besser informieren. Über die Plattform erreichen Partner relevante Unternehmen leichter, verteilen Chancen strukturiert und messen, wie verschiedene Branchen auf Förderungen, Messen und Programme reagieren.' }
  const partnerPoints = [
    { sq: 'Shpërndarje më e mirë e mundësive tek bizneset relevante', en: 'Better distribution of opportunities to relevant businesses', de: 'Bessere Verteilung von Chancen an relevante Unternehmen' },
    { sq: 'Të dhëna më të qarta mbi interesimin e sektorëve', en: 'Clearer data on sector interest', de: 'Klarere Daten zum Brancheninteresse' },
    { sq: 'Mbështetje për eksport, financim dhe zhvillim të ndërmarrjeve', en: 'Support for export, financing, and enterprise development', de: 'Unterstützung für Export, Finanzierung und Unternehmensentwicklung' },
  ]
  const partnerCta = { sq: 'Diskuto bashkëpunimin', en: 'Discuss a partnership', de: 'Partnerschaft besprechen' }

  // ---- Final CTA ----
  const finalTitle = { sq: 'Gati për ta rritur qasjen e biznesit tuaj në mundësi të reja?', en: 'Ready to grow your business access to new opportunities?', de: 'Bereit, den Zugang Ihres Unternehmens zu neuen Chancen zu erweitern?' }
  const finalBody = { sq: 'Regjistrohu në Kosova Business Hub dhe fillo të marrësh informata më të strukturuara për grante, panaire, eksport dhe zhvillim biznesi.', en: 'Sign up to Kosova Business Hub and start receiving more structured information on grants, fairs, export, and business growth.', de: 'Registrieren Sie sich bei Kosova Business Hub und erhalten Sie strukturiertere Informationen zu Förderungen, Messen, Export und Unternehmenswachstum.' }
  const finalCta2 = { sq: 'Na kontakto për bashkëpunim', en: 'Contact us about a partnership', de: 'Kontakt für Partnerschaft' }
  const pilotNote = { sq: 'Platforma është në fazë pilot dhe zhvillohet vazhdimisht së bashku me bizneset dhe partnerët.', en: 'The platform is in a pilot phase and is developed continuously together with businesses and partners.', de: 'Die Plattform befindet sich in einer Pilotphase und wird gemeinsam mit Unternehmen und Partnern laufend weiterentwickelt.' }

  const partnerMail = 'mailto:info@kosovabusinesses.aiaohub.com?subject=Bashkëpunim%20me%20Kosova%20Business%20Hub'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B4F72] via-[#1B4F72] to-[#2E86C1] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {tx(hero.title1)}
              <span className="block text-[#F39C12] mt-1">{tx(hero.title2)}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
              {tx(hero.sub)}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
                  {tx(hero.cta)}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#si-funksionon">
                <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1B4F72] w-full sm:w-auto">
                  {tx(hero.cta2)}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TradePulse />

      {/* Live counters */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1B4F72]">{stat.value}</div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-4">{tx(why.title)}</h2>
          <p className="text-lg text-gray-600 leading-relaxed">{tx(why.body)}</p>
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
                  <s.icon className="h-5 w-5 text-[#2E86C1]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{tx(s.t)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{tx(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can find */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] text-center mb-12">{tx(findTitle)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {findCards.map((c, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#2E86C1] transition-all">
                <div className="bg-[#1B4F72]/5 px-6 py-4 flex items-center gap-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                    <c.icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <span className="font-semibold text-[#1B4F72]">{tx(c.tag)}</span>
                </div>
                <p className="px-6 py-5 text-sm text-gray-600 leading-relaxed">{tx(c.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72] mb-3">{tx(audienceTitle)}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{tx(audienceSub)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {audiences.map((a, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2E86C1]/10 flex items-center justify-center shrink-0">
                  <a.icon className="h-5 w-5 text-[#2E86C1]" />
                </div>
                <span className="text-sm font-medium text-gray-800 leading-snug">{tx(a.l)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources monitored */}
      <section className="py-8 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">{tx(sourcesTitle)}</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            <ShieldCheck className="inline h-4 w-4 text-[#2E86C1] mr-1.5 -mt-0.5" />
            {sourceItems.slice(0, -1).join(', ')} {locale === 'de' ? 'und' : locale === 'en' ? 'and' : 'dhe'} {sourceItems[sourceItems.length - 1]}.
          </p>
        </div>
      </section>

      {/* Impact / KPIs */}
      <section className="py-16 bg-[#1B4F72] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{tx(impactTitle)}</h2>
            <p className="text-gray-200 leading-relaxed">{tx(impactBody)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden">
            {kpis.map((k, i) => (
              <div key={i} className="bg-[#1B4F72] p-6 text-center">
                <div className="text-3xl font-bold text-[#F39C12]">{k.v}</div>
                <div className="text-sm text-gray-200 mt-1 leading-snug">{tx(k.l)}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-300 mt-6">{tx(pilotNote)}</p>
        </div>
      </section>

      {/* Development partners */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#1B4F72]/5 to-white p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                <Globe2 className="h-6 w-6 text-[#1B4F72]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1B4F72]">{tx(partnerTitle)}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">{tx(partnerBody)}</p>
            <ul className="space-y-2.5 mb-8">
              {partnerPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-gray-700">
                  <FileText className="h-5 w-5 text-[#2E86C1] mt-0.5 shrink-0" />
                  <span>{tx(p)}</span>
                </li>
              ))}
            </ul>
            <a href={partnerMail}>
              <Button size="lg" className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
                {tx(partnerCta)}
                <ArrowRight className="ml-2 h-4 w-4" />
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
                {tx(hero.cta)}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href={partnerMail} className="w-full sm:w-auto">
              <Button size="xl" variant="outline" className="border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white w-full sm:w-auto">
                <Mail className="mr-2 h-5 w-5" />
                {tx(finalCta2)}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
