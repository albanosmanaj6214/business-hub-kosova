'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { buildBreadcrumbs } from '@/lib/route-labels'

export function Breadcrumbs() {
  const pathname = usePathname()
  const crumbs = buildBreadcrumbs(pathname)
  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Rrugëtimi" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm min-w-0">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          // On narrow screens, show only the current page to avoid overflow.
          const hideOnMobile = !last
          return (
            <li
              key={i}
              className={`items-center gap-1 min-w-0 ${hideOnMobile ? 'hidden sm:flex' : 'flex'}`}
            >
              {i > 0 && <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" aria-hidden="true" />}
              {c.href && !last ? (
                <Link href={c.href} className="text-ink-muted hover:text-ink truncate">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-ink truncate">
                  {c.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
