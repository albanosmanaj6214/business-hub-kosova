import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Globe } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import { pickTitle, pickContent } from '../utils'

function renderMarkdownLite(md: string) {
  const lines = md.split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^###\s+/.test(line)) {
      out.push(<h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{line.replace(/^###\s+/, '')}</h3>)
    } else if (/^##\s+/.test(line)) {
      out.push(<h2 key={i} className="text-xl font-bold text-[#1B4F72] mt-8 mb-3">{line.replace(/^##\s+/, '')}</h2>)
    } else if (/^#\s+/.test(line)) {
      out.push(<h1 key={i} className="text-2xl font-bold text-[#1B4F72] mt-8 mb-3">{line.replace(/^#\s+/, '')}</h1>)
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      out.push(
        <ul key={`ul-${i}`} className="list-disc pl-6 space-y-1 my-3 text-gray-700">
          {items.map((it, idx) => <li key={idx}>{it}</li>)}
        </ul>
      )
      continue
    } else if (line.trim() === '') {
      out.push(<div key={i} className="h-2" />)
    } else {
      out.push(<p key={i} className="text-gray-700 leading-relaxed my-2">{line}</p>)
    }
    i++
  }
  return out
}

export default async function GuidePage({ params }: { params: { id: string } }) {
  const locale: Locale = getServerLocale()
  const guide = await prisma.exportGuide.findUnique({ where: { id: params.id } })
  if (!guide || !guide.isPublished) notFound()

  const title = pickTitle(guide as any, locale)
  const body = pickContent(guide as any, locale)

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/guides" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {locale === 'sq' ? 'Kthehu' : locale === 'de' ? 'Zurück' : 'Back'}
      </Link>
      <div className="flex items-center mb-4 gap-2">
        <Globe className="h-5 w-5 text-[#2E86C1]" />
        <Badge>{guide.country}</Badge>
        {guide.sectors.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <article className="prose max-w-none">{renderMarkdownLite(body)}</article>
    </div>
  )
}
