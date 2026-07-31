import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

/** An H2 section title. Replaces the ad-hoc, duplicated section headers found in Phase 0. */
export function SectionHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink text-balance">{title}</h2>
          {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
