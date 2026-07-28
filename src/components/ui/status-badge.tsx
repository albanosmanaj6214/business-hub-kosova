import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const STYLES: Record<Status, { box: string; dot: string }> = {
  success: { box: 'bg-success-soft text-success-ink', dot: 'bg-success' },
  warning: { box: 'bg-warning-soft text-warning-ink', dot: 'bg-warning' },
  danger: { box: 'bg-danger-soft text-danger-ink', dot: 'bg-danger' },
  info: { box: 'bg-info-soft text-info-ink', dot: 'bg-info' },
  neutral: { box: 'bg-surface-sunken text-ink-muted', dot: 'bg-ink-subtle' },
}

interface StatusBadgeProps {
  status: Status
  label: string
  /** Optional icon; otherwise a coloured dot is shown. Text label is always present. */
  icon?: LucideIcon
  className?: string
}

/**
 * A status pill. Never colour-only: it always carries a text label plus a dot
 * or icon, so meaning survives for colour-blind and screen-reader users.
 */
export function StatusBadge({ status, label, icon: Icon, className }: StatusBadgeProps) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium',
        s.box,
        className,
      )}
    >
      {Icon ? (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-pill', s.dot)} aria-hidden="true" />
      )}
      {label}
    </span>
  )
}
