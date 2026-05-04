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
    title: 'Grantet aktive të Kosovës',
    description: 'Çdo thirrje aktive nga KIESA, MZHR e MINT — me afat, vlerë dhe link për aplikim. E përditësuar çdo natë.',
  },
  {
    icon: Calendar,
    title: 'Panairet ndërkombëtare',
    description: '15+ panaire të verifikuara në Evropë e Lindjen e Mesme — TUTTOFOOD, IFA, Gulfood, BAU. Me datë, qytet e organizator.',
  },
  {
    icon: BookOpen,
    title: 'Udhëzues eksporti për tregje konkrete',
    description: 'Dokumentet, taksat dhe rregullat doganore për secilin treg ku do të eksportosh — pa pasur nevojë me thirrë konsulent.',
  },
  {
    icon: Bell,
    title: 'Njoftime që përshtaten me sektorin tënd',
    description: 'Vendos sektorin dhe tregjet me interes — t\'i dërgojmë në email vetëm thirrjet e panairet që të takojnë.',
  },
  {
    icon: Search,
    title: 'Të dhëna për tregjet e eksportit',
    description: 'Çfarë blen secili treg, sa importon nga Ballkani, dhe ku ka hapësirë për produktet kosovare.',
  },
  {
    icon: Users,
    title: 'Konsultime me ekspertë eksporti',
    description: 'Sesione 1-me-1 për dokumentacion, çertifikime e kontakte me blerës — kur të hasësh problem konkret.',
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
              KIESA · MZHR · MINT — të përditësuara çdo natë
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Grantet dhe panairet e eksportit,
              <span className="block text-[#F39C12]">në një vend.</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              Mbledhim çdo thirrje publike për biznesin tënd nga burimet zyrtare të Kosovës dhe kalendarin e panaireve ndërkombëtare. Pa pasur nevojë me i ndjekë vetë.
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
              Gjithçka që të duhet me ndjekë grantet, panairet dhe rregullat e eksportit — pa hapë 20 faqe institucionesh në ditë.
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
            Gati me e ndjekë eksportin seriozisht?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Regjistrohu falas — shih grantet aktive sot, vendos për planin më vonë.
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
