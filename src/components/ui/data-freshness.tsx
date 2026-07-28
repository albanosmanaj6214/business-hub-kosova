import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface DataFreshnessProps {
  /** When the data was last checked against its source. */
  checkedAt?: Date | string | null
  /** The statistical period the figures belong to (e.g. a year). */
  periodYear?: number | string | null
  label?: string
  className?: string
}

/**
 * A small recency line for official data. Reinforces the platform rule that
 * every figure shows when it was last verified and which period it covers.
 */
export function DataFreshness({ checkedAt, periodYear, label, className }: DataFreshnessProps) {
  if (!checkedAt && periodYear == null) return null
  return (
    <p className={cn('inline-flex items-center gap-1.5 text-xs text-ink-subtle', className)}>
      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>
        {label ?? 'Kontrolluar'}
        {checkedAt ? ` më ${formatDate(checkedAt)}` : ''}
        {periodYear != null ? ` · periudha ${periodYear}` : ''}
      </span>
    </p>
  )
}
