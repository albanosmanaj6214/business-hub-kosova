import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { CheckCircle2, X } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 39,
    description: 'Per biznese te vogla qe duan te eksplorojne mundesite e eksportit.',
    features: [
      { text: 'Databaza e granteve', included: true },
      { text: 'Kalendari i panaireve', included: true },
      { text: '5 udhezues eksporti/muaj', included: true },
      { text: 'Njoftime me email', included: true },
      { text: 'Njoftime inteligjente', included: false },
      { text: 'Konsultime eksperti', included: false },
      { text: 'API akses', included: false },
    ],
    cta: 'Fillo me Starter',
    popular: false,
  },
  {
    name: 'Professional',
    price: 99,
    description: 'Per biznese aktive qe eksportojne rregullisht.',
    features: [
      { text: 'Databaza e granteve', included: true },
      { text: 'Kalendari i panaireve', included: true },
      { text: 'Udhezues eksporti pa limit', included: true },
      { text: 'Njoftime me email', included: true },
      { text: 'Njoftime inteligjente AI', included: true },
      { text: '2 konsultime/muaj', included: true },
      { text: 'API akses', included: false },
    ],
    cta: 'Fillo me Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 249,
    description: 'Per kompani te medha me nevoja te avancuara.',
    features: [
      { text: 'Databaza e granteve', included: true },
      { text: 'Kalendari i panaireve', included: true },
      { text: 'Udhezues eksporti pa limit', included: true },
      { text: 'Njoftime me email', included: true },
      { text: 'Njoftime inteligjente AI', included: true },
      { text: 'Konsultime pa limit', included: true },
      { text: 'API akses i plote', included: true },
    ],
    cta: 'Fillo me Enterprise',
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1B4F72] mb-4">Cmimet</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Zgjidhni planin qe i pershtatet nevojave te biznesit tuaj.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-8 ${plan.popular ? 'border-[#2E86C1] shadow-xl scale-105' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2E86C1] text-white text-sm font-medium px-4 py-1 rounded-full">
                    Me Popullorja
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#1B4F72] mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">EUR{plan.price}</span>
                    <span className="text-gray-500 ml-1">/muaj</span>
                  </div>
                  <p className="text-gray-500 mt-2 text-sm">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center">
                      {feature.included ? (
                        <CheckCircle2 className="h-5 w-5 text-[#27AE60] mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} size="lg">{plan.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
