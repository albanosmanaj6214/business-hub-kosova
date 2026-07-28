import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  /** A retry or recovery action (e.g. a button that calls reset()). */
  action?: React.ReactNode
  className?: string
}

/**
 * A recoverable error surface for use inside error.tsx boundaries or partial
 * failures. Presentational only (no hooks), so it works in both server and
 * client contexts. Never shows raw technical errors to end users.
 */
export function ErrorState({
  title = 'Diçka shkoi keq',
  description = 'Nuk arritëm ta ngarkojmë këtë përmbajtje. Provo përsëri për një moment.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center text-center rounded-card border border-danger-line bg-danger-soft px-6 py-10',
        className,
      )}
    >
      <div className="rounded-pill bg-surface p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-danger-ink text-balance">{title}</h3>
      <p className="text-sm text-ink-muted mt-1.5 max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
