import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/lib/session-provider'
import { getServerLocale } from '@/lib/i18n-server'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kosovabusinesses.aiaohub.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kosova Business Hub · Financim, panaire dhe tregje eksporti',
    template: '%s · Kosova Business Hub',
  },
  description:
    'Mundësi financimi, panaire ndërkombëtare, të dhëna tregu dhe kërkesat ligjore të eksportit për bizneset kosovare, në një platformë të vetme.',
  keywords: ['grante Kosovë', 'panaire ndërkombëtare', 'eksport Kosovë', 'financim biznesi', 'certifikime eksporti'],
  openGraph: {
    type: 'website',
    siteName: 'Kosova Business Hub',
    locale: 'sq_AL',
    url: SITE_URL,
    title: 'Kosova Business Hub · Financim, panaire dhe tregje eksporti',
    description:
      'Mundësi financimi, panaire ndërkombëtare, të dhëna tregu dhe kërkesat ligjore të eksportit për bizneset kosovare.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kosova Business Hub',
    description: 'Financim, panaire dhe tregje eksporti për bizneset kosovare.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getServerLocale()
  return (
    <html lang={locale} className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
