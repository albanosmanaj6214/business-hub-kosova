import { BadgeCheck, ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
  verified: boolean
  /** Custom labels; defaults are Albanian. */
  verifiedLabel?: string
  unverifiedLabel?: string
  className?: string
}

/**
 * Shows whether an entity is verified, with an icon AND a visible text label
 * (Phase 0 flagged an icon-only "Verified" badge as an a11y gap).
 */
export function VerificationBadge({
  verified,
  verifiedLabel = 'I verifikuar',
  unverifiedLabel = 'I paverifikuar',
  className,
}: VerificationBadgeProps) {
  if (verified) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-pill bg-success-soft px-2 py-0.5 text-xs font-medium text-success-ink',
          className,
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {verifiedLabel}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2 py-0.5 text-xs font-medium text-ink-muted',
        className,
      )}
    >
      <ShieldQuestion className="h-3.5 w-3.5" aria-hidden="true" />
      {unverifiedLabel}
    </span>
  )
}
