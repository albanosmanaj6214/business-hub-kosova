import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Target, Lightbulb, Mail, Phone, MapPin } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'

interface Tri { sq: string; en: string; de: string }

export default function AboutPage() {
  const locale: Locale = getServerLocale()
  const tx = (o: Tri) => o[locale] ?? o.sq

  const c = {
    title: { sq: 'Rreth Nesh', en: 'About Us', de: 'Über uns' },
    sub: {
      sq: 'Mbledhim mundësitë për financim, panaire dhe eksport në një vend, që informata të mos jetë pengesë për rritjen e biznesit.',
      en: 'We gather financing, fair, and export opportunities in one place, so information is not a barrier to business growth.',
      de: 'Wir bündeln Finanzierungs-, Messe- und Exportchancen an einem Ort, damit Informationen kein Hindernis für das Unternehmenswachstum sind.',
    },
    body1: {
      sq: 'Kosova Business Hub është krijuar për t’i ndihmuar bizneset kosovare të kenë qasje më të lehtë në informata që ndikojnë drejtpërdrejt në rritjen e tyre. Shumë ndërmarrje në Kosovë nuk arrijnë të aplikojnë në grante, të marrin pjesë në panaire apo të eksplorojnë tregje të reja, jo sepse nuk kanë potencial, por sepse informata është e shpërndarë, e vonuar ose e vështirë për t’u kuptuar.',
      en: 'Kosova Business Hub was created to help Kosovo businesses access the information that directly affects their growth. Many enterprises in Kosovo never apply for grants, attend fairs, or explore new markets, not because they lack potential, but because the information is scattered, delayed, or hard to understand.',
      de: 'Kosova Business Hub wurde geschaffen, um Unternehmen im Kosovo den Zugang zu Informationen zu erleichtern, die ihr Wachstum direkt beeinflussen. Viele Unternehmen im Kosovo bewerben sich nie um Förderungen, besuchen keine Messen und erschließen keine neuen Märkte, nicht weil ihnen das Potenzial fehlt, sondern weil die Informationen verstreut, verspätet oder schwer verständlich sind.',
    },
    body2: {
      sq: 'Platforma jonë synon ta zvogëlojë këtë hendek duke mbledhur në një vend mundësi financimi, njoftime për panaire, udhëzues eksporti dhe informata praktike për zhvillim biznesi.',
      en: 'Our platform aims to close this gap by gathering financing opportunities, fair announcements, export guides, and practical business information in one place.',
      de: 'Unsere Plattform will diese Lücke schließen, indem sie Finanzierungsmöglichkeiten, Messeankündigungen, Export-Leitfäden und praktische Unternehmensinformationen an einem Ort bündelt.',
    },
    body3: {
      sq: 'Ne besojmë se një biznes i informuar ka më shumë gjasa të rritet, të aplikojë me kohë, të përgatitet për tregje të reja dhe të krijojë vende pune.',
      en: 'We believe an informed business is more likely to grow, apply on time, prepare for new markets, and create jobs.',
      de: 'Wir glauben, dass ein gut informiertes Unternehmen eher wächst, rechtzeitig Anträge stellt, sich auf neue Märkte vorbereitet und Arbeitsplätze schafft.',
    },
    mission: { sq: 'Misioni ynë', en: 'Our mission', de: 'Unsere Mission' },
    missionD: {
      sq: 'Të krijojmë një platformë të besueshme digjitale që lidh bizneset kosovare me mundësi konkrete për financim, eksport, partneritet dhe zhvillim.',
      en: 'To build a trustworthy digital platform that connects Kosovo businesses with concrete opportunities for financing, export, partnership, and growth.',
      de: 'Eine vertrauenswürdige digitale Plattform zu schaffen, die Unternehmen im Kosovo mit konkreten Chancen für Finanzierung, Export, Partnerschaft und Wachstum verbindet.',
    },
    vision: { sq: 'Vizioni ynë', en: 'Our vision', de: 'Unsere Vision' },
    visionD: {
      sq: 'Të bëhemi pika kryesore informuese për bizneset e Kosovës që synojnë rritje dhe qasje në tregje të reja.',
      en: 'To become the main information point for Kosovo businesses that seek growth and access to new markets.',
      de: 'Zur zentralen Informationsstelle für kosovarische Unternehmen zu werden, die Wachstum und Zugang zu neuen Märkten anstreben.',
    },
    contactTitle: { sq: 'Kontakt dhe bashkëpunim', en: 'Contact and partnership', de: 'Kontakt und Partnerschaft' },
    contactBody: {
      sq: 'Kosova Business Hub është në fazë pilot dhe zhvillohet vazhdimisht së bashku me bizneset dhe partnerët. Për bashkëpunime, pilotim ose pyetje, na kontakto drejtpërdrejt.',
      en: 'Kosova Business Hub is in a pilot phase and is developed continuously together with businesses and partners. For partnerships, piloting, or questions, contact us directly.',
      de: 'Kosova Business Hub befindet sich in einer Pilotphase und wird gemeinsam mit Unternehmen und Partnern laufend weiterentwickelt. Für Partnerschaften, Pilotprojekte oder Fragen kontaktieren Sie uns direkt.',
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1B4F72] mb-4">{tx(c.title)}</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">{tx(c.sub)}</p>
          </div>

          <div className="max-w-none mb-16 space-y-5">
            <p className="text-gray-600 leading-relaxed text-lg">{tx(c.body1)}</p>
            <p className="text-gray-600 leading-relaxed text-lg">{tx(c.body2)}</p>
            <p className="text-gray-600 leading-relaxed text-lg">{tx(c.body3)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-[#1B4F72]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tx(c.mission)}</h3>
              <p className="text-gray-600 leading-relaxed">{tx(c.missionD)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-[#2E86C1]/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-[#2E86C1]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tx(c.vision)}</h3>
              <p className="text-gray-600 leading-relaxed">{tx(c.visionD)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1B4F72] text-white p-8 md:p-10">
            <h2 className="text-2xl font-bold mb-3">{tx(c.contactTitle)}</h2>
            <p className="text-gray-200 leading-relaxed mb-6 max-w-2xl">{tx(c.contactBody)}</p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <a href="mailto:info@kosovabusinesses.aiaohub.com" className="inline-flex items-center gap-2 hover:text-[#F39C12] transition-colors">
                <Mail className="h-4 w-4" /> info@kosovabusinesses.aiaohub.com
              </a>
              <a href="tel:+38349814069" className="inline-flex items-center gap-2 hover:text-[#F39C12] transition-colors">
                <Phone className="h-4 w-4" /> +383 49 814 069
              </a>
              <span className="inline-flex items-center gap-2 text-gray-200">
                <MapPin className="h-4 w-4" /> Prishtinë, Kosovë
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
