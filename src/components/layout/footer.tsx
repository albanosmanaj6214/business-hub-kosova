import Link from 'next/link'
import { Wordmark } from '@/components/brand/Wordmark'
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup'
import { getServerT } from '@/lib/i18n-server'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const t = getServerT()

  return (
    <footer className="bg-[#1B4F72] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Wordmark variant="inverse" size="md" />
            </div>
            <p className="text-gray-300 max-w-md leading-relaxed mb-6">
              {t('footer.tagline')}
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-w-md">
              <div className="text-sm font-semibold mb-2 text-white">Newsletter javor falas</div>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                Çdo të hënë: grantet e reja, panairet me afat këtë muaj, ndryshimet doganore. Pa spam.
              </p>
              <NewsletterSignup source="footer" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.links')}</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">{t('nav.login')}</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">{t('nav.register')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <a href={`mailto:${t('footer.email')}`} className="flex items-start gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t('footer.email')}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${t('footer.phone').replace(/\s/g, '')}`} className="flex items-start gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{t('footer.phone')}</span>
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('footer.city')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-gray-300 text-sm">
          © {new Date().getFullYear()} Kosova Business Hub. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
