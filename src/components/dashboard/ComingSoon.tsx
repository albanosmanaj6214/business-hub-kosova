import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Clock, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  description: string
  icon?: LucideIcon
  phase?: string
  relatedLinks?: { label: string; href: string }[]
}

export function ComingSoon({ title, subtitle, description, icon: Icon, phase, relatedLinks }: Props) {
  const HeaderIcon = Icon ?? Sparkles
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {phase && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B37400] bg-[#F39C12]/10 rounded-full px-2 py-0.5">
              <Clock className="h-3 w-3" /> {phase}
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[#1B4F72]/10 p-3 shrink-0">
              <HeaderIcon className="h-6 w-6 text-[#1B4F72]" />
            </div>
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Po vjen shpejt</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>

              {relatedLinks && relatedLinks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-3">Deri atëherë, mund të shohësh:</p>
                  <div className="flex flex-col gap-2">
                    {relatedLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="inline-flex items-center gap-1.5 text-sm text-[#2E86C1] hover:text-[#1B4F72] font-medium"
                      >
                        {l.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
