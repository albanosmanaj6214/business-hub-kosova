import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import {
  Search,
  Calendar,
  BookOpen,
  Bell,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Databaza e Granteve',
    description: 'AI kërkon dhe gjen grante të përshtatshme për biznesin tuaj çdo ditë automatikisht.',
  },
  {
    icon: Calendar,
    title: 'Kalendari i Panaireve',
    description: 'Panairet tregtare ndërkombëtare të rëndësishme për eksportuesit e Kosovës.',
  },
  {
    icon: BookOpen,
    title: 'Udhëzues Eksporti',
    description: 'Udhëzues të detajuar për eksport sipas vendit, duke përfshirë rregullat dhe dokumentet.',
  },
  {
    icon: Bell,
    title: 'Njoftime Inteligjente',
    description: 'Merrni njoftime kur gjenden grante ose panaire që përputhen me interesat tuaja.',
  },
  {
    icon: Search,
    title: 'Analiza Tregu',
    description: 'Informacione mbi tregjet e eksportit dhe mundësitë e rritjes.',
  },
  {
    icon: Users,
    title: 'Konsultime',
    description: 'Rezervoni konsultime me ekspertë të eksportit dhe tregtisë ndërkombëtare.',
  },
]

const stats = [
  { value: '500+', label: 'Grante të Monitoruara' },
  { value: '200+', label: 'Panaire Tregtare' },
  { value: '50+', label: 'Vende me Udhëzues' },
  { value: '24/7', label: 'Monitoring me AI' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B4F72] via-[#1B4F72] to-[#2E86C1] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Zap className="h-4 w-4 mr-2 text-[#F39C12]" />
              Powered by Artificial Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Inteligjenca e Eksportit
              <span className="block text-[#F39C12]">për Kosovën</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              Platforma e vetme që përdor AI për të gjetur grante, panaire tregtare dhe mundësi eksporti
              për prodhuesit Kosovarë. Automatikisht, çdo ditë.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
                  Fillo Falas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1B4F72] w-full sm:w-auto">
                  Shiko Çmimet
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4F72] mb-4">
              Çfarë Ofrojmë
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Platforma jonë përdor inteligjencë artificiale për të monitoruar dhe gjetur mundësitë
              më të mira të eksportit për biznesin tuaj.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-gray-200 hover:border-[#2E86C1] hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center mb-4 group-hover:bg-[#2E86C1]/10 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#1B4F72] group-hover:text-[#2E86C1]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B4F72] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="h-12 w-12 text-[#F39C12] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Gati për të Rritur Eksportin?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Bashkohuni me qindra biznese Kosovare që përdorin platformën tonë.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold">
                Regjistrohu Tani - Falas
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-gray-300">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-[#27AE60]" />
              Pa kartë krediti
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-[#27AE60]" />
              Plani falas përgjithmonë
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
