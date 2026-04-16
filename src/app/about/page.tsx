import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Target, Lightbulb, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1B4F72] mb-4">
              Rreth Nesh
            </h1>
            <p className="text-lg text-gray-500">
              Misioni ynë është të fuqizojmë prodhuesit Kosovarë në tregjet ndërkombëtare.
            </p>
          </div>

          <div className="prose prose-lg max-w-none mb-16">
            <p className="text-gray-600 leading-relaxed">
              Business Hub Kosova është platforma e parë e inteligjencës së eksportit e ndërtuar
              posaçërisht për prodhuesit dhe eksportuesit e Kosovës. Duke përdorur inteligjencë
              artificiale, ne monitorojmë qindra burime çdo ditë për të gjetur grante, panaire
              tregtare dhe mundësi eksporti që përputhen me nevojat e biznesit tuaj.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#1B4F72]/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-[#1B4F72]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Misioni</h3>
              <p className="text-gray-500">
                Të bëjmë informacionin e eksportit të aksesueshëm për çdo biznes në Kosovë.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#2E86C1]/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-[#2E86C1]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vizioni</h3>
              <p className="text-gray-500">
                Kosova si lider rajonal në eksport, me biznese të informuara dhe konkurruese.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#27AE60]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ekipi</h3>
              <p className="text-gray-500">
                Ekspertë të teknologjisë dhe tregtisë ndërkombëtare nga Kosova.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
