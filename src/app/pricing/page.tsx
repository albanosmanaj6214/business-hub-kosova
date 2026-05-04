import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle2, X, Sparkles, ShieldCheck, Headphones } from 'lucide-react'

type Feature = { text: string; included: boolean; highlight?: boolean }

interface Plan {
  name: string
  price: number
  description: string
  audience: string
  features: Feature[]
  cta: string
  popular: boolean
}

const plans: Plan[] = [
  {
    name: 'Starter',
    price: 39,
    description: 'Për biznese të vogla që duan me e fillu eksportin pa investim të madh — qasje në grantet aktive dhe kalendarin e panaireve.',
    audience: 'Deri në 5 punonjës · 1 përdorues',
    features: [
      { text: 'Databaza e granteve aktive (KIESA, MZHR, MINT)', included: true },
      { text: 'Kalendari i panaireve ndërkombëtare', included: true },
      { text: '5 udhëzues eksporti / muaj', included: true },
      { text: 'Njoftime me email për thirrje të reja', included: true },
      { text: 'Filtrim sipas sektorit', included: true },
      { text: 'Njoftime inteligjente AI sipas profilit', included: false },
      { text: 'Konsultime me ekspert', included: false },
      { text: 'Eksport CSV / Excel', included: false },
      { text: 'API akses', included: false },
    ],
    cta: 'Fillo me Starter',
    popular: false,
  },
  {
    name: 'Professional',
    price: 99,
    description: 'Për biznese që tashmë eksportojnë dhe kanë nevojë me ndjekë disa tregje paralelisht — me njoftime të personalizuara dhe konsultime mujore.',
    audience: '5–50 punonjës · 3 përdorues',
    features: [
      { text: 'Gjithçka nga Starter', included: true, highlight: true },
      { text: 'Udhëzues eksporti pa limit', included: true },
      { text: 'Njoftime inteligjente AI sipas profilit', included: true },
      { text: '2 konsultime / muaj me ekspert eksporti', included: true },
      { text: 'Eksport CSV / Excel i të dhënave', included: true },
      { text: 'Filtra të avancuara (vend, sektor, afat, vlerë)', included: true },
      { text: 'Mbështetje me prioritet (24h)', included: true },
      { text: 'API akses', included: false },
    ],
    cta: 'Fillo me Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 249,
    description: 'Për kompani me ekip të dedikuar për eksport — qasje API për integrim me sistemet tuaja, raport mujor dhe menaxher kontaktit.',
    audience: '50+ punonjës · përdorues të pakufizuar',
    features: [
      { text: 'Gjithçka nga Professional', included: true, highlight: true },
      { text: 'Konsultime pa limit me ekspert', included: true },
      { text: 'API i plotë (REST + webhooks)', included: true },
      { text: 'Raport mujor i personalizuar', included: true },
      { text: 'Onboarding 1-me-1 me menaxher të dedikuar', included: true },
      { text: 'SLA 99.9% + mbështetje në kohë reale', included: true },
      { text: 'Akses për ekipin (përdorues të pakufizuar)', included: true },
    ],
    cta: 'Kontakto për Enterprise',
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
    text: 'Pyet në shqip, përgjigjemi në shqip — brenda 24 orëve, nga ekip që e njeh tregun kosovar.',
  },
]

const faqs = [
  {
    q: 'A mund ta provoj platformën pa pagesë?',
    a: 'Po — regjistrimi është falas dhe të jep akses të kufizuar në grantet aktive. Për akses të plotë, zgjidh një plan me pagesë.',
  },
  {
    q: 'A mund ta ndryshoj planin më vonë?',
    a: 'Po, mund të kalosh nga Starter në Professional ose Enterprise në çdo moment. Faturimi rregullohet automatikisht (pro-rata).',
  },
  {
    q: 'A janë të dhënat e granteve gjithmonë të përditësuara?',
    a: 'Po. Scraper-i ynë kontrollon KIESA, MZHR, MINT dhe burime të tjera çdo natë në orën 03:00 (CET). Çdo grant ka të shënuar burimin dhe datën e fundit kur është konfirmuar.',
  },
  {
    q: 'Si funksionon faturimi?',
    a: 'Pagesa bëhet me kartë krediti përmes Stripe (siguri PCI-DSS). Fatura në PDF dërgohet automatikisht me email çdo muaj.',
  },
  {
    q: 'A ofroni zbritje për pagesë vjetore?',
    a: 'Po — me pagesë vjetore përfitoni 2 muaj falas (zbritje 16%). Na kontakto për ofertë të personalizuar.',
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
              Tre plane për tre faza të eksportit — nga biznesi që sapo po fillon, te kompania që ka nevojë për integrim API.
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
                    <span className="text-5xl font-extrabold text-gray-900">€{plan.price}</span>
                    <span className="text-gray-500 ml-2">/muaj</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">+ TVSH (nëse aplikohet)</p>

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
            Të gjitha planet faturohen mujore në EUR. Pagesë me kartë përmes Stripe.
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
