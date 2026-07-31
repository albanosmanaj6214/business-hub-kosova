import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** A primary CTA (button or link). Empty states should always offer a next step. */
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/**
 * A helpful empty state: says what is missing, why, and what to do next.
 * Replaces bare "S'ka të dhëna" blocks. Keep it compact, not a giant blank card.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center rounded-card border border-line bg-surface px-6 py-10',
        className,
      )}
    >
      {Icon && (
        <div className="rounded-pill bg-surface-sunken p-3 mb-4">
          <Icon className="h-6 w-6 text-ink-subtle" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink text-balance">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted mt-1.5 max-w-md leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
