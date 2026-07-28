import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Right-aligned actions (buttons, links). */
  actions?: React.ReactNode
  className?: string
}

/**
 * The single H1 of a page, with an optional icon tile, description and actions.
 * Use once per route; nested titles use SectionHeader (H2).
 */
export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="rounded-control bg-primary-soft p-2 shrink-0">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink text-balance">{title}</h1>
          {description && (
            <p className="text-ink-muted mt-1 max-w-prose leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
