import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kosovabusinesses.aiaohub.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Zona private: paneli, admini, API-t dhe rrjedhat e llogarise nuk indeksohen.
        disallow: ['/dashboard', '/admin', '/api/', '/verify-email', '/reset-password', '/brand'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
