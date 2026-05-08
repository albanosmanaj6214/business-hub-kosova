import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Target, Lightbulb, Users } from 'lucide-react'
import { getServerT } from '@/lib/i18n-server'

export default function AboutPage() {
  const t = getServerT()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1B4F72] mb-4">
              {t('about.title')}
            </h1>
            <p className="text-lg text-gray-500">
              {t('about.sub')}
            </p>
          </div>

          <div className="prose prose-lg max-w-none mb-16 space-y-5">
            <p className="text-gray-600 leading-relaxed">{t('about.body.1')}</p>
            <p className="text-gray-600 leading-relaxed">{t('about.body.2')}</p>
            <p className="text-gray-600 leading-relaxed">{t('about.body.3')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#1B4F72]/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-[#1B4F72]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.mission')}</h3>
              <p className="text-gray-500">{t('about.mission.d')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#2E86C1]/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-[#2E86C1]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.vision')}</h3>
              <p className="text-gray-500">{t('about.vision.d')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#27AE60]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#27AE60]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.team')}</h3>
              <p className="text-gray-500">{t('about.team.d')}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
