'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/Wordmark'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useLocale } from '@/lib/use-locale'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Wordmark variant="primary" size="lg" asLink className="text-[22px] gap-[7px] md:text-[32px] md:gap-[10px]" />
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#features" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              {t('nav.services')}
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              {t('nav.about')}
            </Link>
            <LanguageSwitcher compact />
            {session ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">{t('nav.login')}</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher compact />
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600" aria-label="Menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link href="/#features" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              {t('nav.services')}
            </Link>
            <Link href="/pricing" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              {t('nav.pricing')}
            </Link>
            <Link href="/about" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              {t('nav.about')}
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">{t('nav.dashboard')}</Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => signOut()}>{t('nav.logout')}</Button>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">{t('nav.login')}</Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
