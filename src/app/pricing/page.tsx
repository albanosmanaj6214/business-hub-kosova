import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle2, X, Sparkles, ShieldCheck, Headphones } from 'lucide-react'

type Feature = { text: string; included: boolean; highlight?: boolean }

interface Plan {
  name: string
  price: number | null
  description: string
  audience: string
  features: Feature[]
  cta: string
  popular: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Regjistrohu, njihu me platformën dhe përdor udhëzuesit bazë. Pa kartelë, pa afat.',
    audience: 'Fillimi pa kosto',
    features: [
      { text: 'Udhëzuesit ARBK, Tatimor dhe Doganor', included: true },
      { text: 'Profil bazik i kompanisë', included: true },
      { text: 'Lajme dhe burime financimi publike', included: true },
      { text: 'Kompani Kosovare: shikim bazik', included: true },
      { text: 'Njoftime brenda platformës', included: true },
      { text: 'Përmbajtje e personalizuar sipas sektorit', included: false },
      { text: 'Kërkesë kontakti në Directory', included: false },
      { text: 'Kërko Ofertë dhe Matchmaking', included: false },
      { text: 'Njoftime me email', included: false },
    ],
    cta: 'Regjistrohu falas',
    popular: false,
  },
  {
    name: 'Professional',
    price: 99,
    description: 'Për biznesin që kërkon rezultate: gjithçka e përzgjedhur për sektorin tënd, profil i plotë dhe lidhje të kontrolluara me blerës e partnerë.',
    audience: 'Për biznese aktive',
    features: [
      { text: 'Gjithçka nga Free', included: true, highlight: true },
      { text: 'Grante, panaire dhe lajme sipas sektorit tënd', included: true },
      { text: 'Profil i plotë: logo, foto, katalog', included: true },
      { text: 'Kërkesë kontakti në Kompani Kosovare', included: true },
      { text: 'Kërko Ofertë + përgjigje në oferta', included: true },
      { text: 'Matchmaking me partnerë e blerës', included: true },
      { text: 'Udhëzues dhe checklista eksporti të plota për çdo treg', included: true },
      { text: 'Konsultime me ekspert (sipas pakos)', included: true },
    ],
    cta: 'Fillo me Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Për kompani me nevoja të zgjeruara: më shumë sektorë, dukshmëri me prioritet dhe mbështetje të dedikuar. Kushtet caktohen me marrëveshje.',
    audience: 'Me marrëveshje',
    features: [
      { text: 'Gjithçka nga Professional', included: true, highlight: true },
      { text: 'Profil Featured me prioritet në Directory', included: true },
      { text: 'Shenja Verified pas verifikimit', included: true },
      { text: 'Matchmaking me prioritet + mbështetje nga ekipi', included: true },
      { text: 'Më shumë sektorë dhe produkte', included: true },
      { text: 'Raporte periodike sipas nevojës', included: true },
      { text: 'Mbështetje me prioritet', included: true },
    ],
    cta: 'Kontakto për ofertë',
    popular: false,
  },
]

const guarantees = [
  {
    icon: Sparkles,
    title: 'Të dhëna reale',
    text: 'Çdo grant vjen direkt nga faqja zyrtare e KIESA, MZHR ose MINT. Asnjë listë e improvizuar.',
  },
  {
    icon: ShieldCheck,
    title: 'Pa angazhim',
    text: 'Paguan për muajin që e përdor. Anulim me një klikim, pa kontratë e pa pyetje.',
  },
  {
    icon: Headphones,
    title: 'Mbështetje në shqip',
    text: 'Pyet në shqip, përgjigjemi në shqip. Brenda 24 orëve, nga ekip që e njeh tregun kosovar.',
  },
]

const faqs = [
  {
    q: 'A mund ta provoj platformën pa pagesë?',
    a: 'Po. Regjistrimi është falas dhe të jep akses të kufizuar në grantet aktive. Për akses të plotë, zgjidh një plan me pagesë.',
  },
  {
    q: 'A mund ta ndryshoj planin më vonë?',
    a: 'Po, mund të kalosh nga Free në Professional në çdo moment, dhe anasjelltas. Për Enterprise, kushtet caktohen me marrëveshje.',
  },
  {
    q: 'A janë të dhënat e granteve gjithmonë të përditësuara?',
    a: 'Po. Scraper-i ynë kontrollon KIESA, MZHR, MINT dhe burime të tjera çdo natë në orën 03:00 (CET). Çdo grant ka të shënuar burimin dhe datën e fundit kur është konfirmuar.',
  },
  {
    q: 'Si funksionon faturimi?',
    a: 'Aktivizimi bëhet pas kontaktit me ekipin: pagesa me faturë dhe transfertë bankare, me aktivizim të shpejtë pas konfirmimit. Faturimi vjetor e thjeshton procesin për të dy palët.',
  },
  {
    q: 'A ofroni zbritje për pagesë vjetore?',
    a: 'Po. Me pagesë vjetore përfitoni 2 muaj falas (zbritje 16%). Na kontakto për ofertë të personalizuar.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-16 md:py-20 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded-full mb-4">
              Çmimet
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1B4F72] mb-4">
              Zgjidh planin që të çon në eksport
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fillo falas. Kalo në Professional kur të duash personalizim të plotë dhe lidhje me blerës. Enterprise ndërtohet sipas nevojës.
            </p>
          </div>

          <div className="max-w-3xl mx-auto mb-12 rounded-xl border border-[#1B4F72]/15 bg-[#1B4F72]/5 p-5 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              Platforma është duke u zhvilluar me qëllim që të jetë sa më e qasshme për bizneset kosovare. Për fazën fillestare, parashihet edhe mundësia e pilotimit me biznese të përzgjedhura, partnerë zhvillimorë, oda ekonomike dhe organizata që mbështesin sektorin privat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 bg-white flex flex-col ${
                  plan.popular
                    ? 'border-[#2E86C1] shadow-xl md:scale-105'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2E86C1] text-white text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide">
                    Më e zgjedhura
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#1B4F72]">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{plan.audience}</p>

                  <div className="mt-5 flex items-baseline justify-center">
                    {plan.price === null ? (
                      <span className="text-3xl font-extrabold text-gray-900">Me marrëveshje</span>
                    ) : (
                      <>
                        <span className="text-5xl font-extrabold text-gray-900">€{plan.price}</span>
                        <span className="text-gray-500 ml-2">/muaj</span>
                      </>
                    )}
                  </div>
                  {plan.price !== null && plan.price > 0 && (
                    <p className="text-xs text-gray-400 mt-1">+ TVSH (nëse aplikohet)</p>
                  )}

                  <p className="text-sm text-gray-600 mt-4">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start">
                      {feature.included ? (
                        <CheckCircle2 className="h-5 w-5 text-[#27AE60] mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? feature.highlight
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === 'Enterprise' ? '/about#contact' : '/register'}>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Çmimet në EUR. Aktivizimi bëhet me faturë dhe transfertë bankare, pas kontaktit me ekipin.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guarantees.map((g) => (
              <div key={g.title} className="text-center">
                <div className="w-12 h-12 bg-[#1B4F72]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <g.icon className="h-6 w-6 text-[#1B4F72]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{g.title}</h3>
                <p className="text-sm text-gray-600">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#1B4F72] text-center mb-10">
            Pyetje të shpeshta
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center bg-[#1B4F72] text-white rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Ke pyetje tjetër?</h3>
            <p className="text-white/80 text-sm mb-5">
              Ekipi ynë të përgjigjet brenda 24 orëve.
            </p>
            <Link href="/about#contact">
              <Button className="bg-white text-[#1B4F72] hover:bg-gray-100">
                Na kontakto
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
