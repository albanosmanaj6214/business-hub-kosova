import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

const STYLES: Record<AlertVariant, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: { box: 'bg-info-soft border-info-line text-info-ink', icon: Info, iconColor: 'text-info' },
  success: {
    box: 'bg-success-soft border-success-line text-success-ink',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  warning: {
    box: 'bg-warning-soft border-warning-line text-warning-ink',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  danger: {
    box: 'bg-danger-soft border-danger-line text-danger-ink',
    icon: AlertCircle,
    iconColor: 'text-danger',
  },
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: React.ReactNode
  /** Override the default variant icon. */
  icon?: LucideIcon
  className?: string
}

/**
 * A titled message block. Colour is never the only signal: every variant pairs
 * a distinct icon with the text, and errors/warnings use role="alert".
 */
export function Alert({ variant = 'info', title, children, icon, className }: AlertProps) {
  const s = STYLES[variant]
  const Icon = icon ?? s.icon
  const assertive = variant === 'danger' || variant === 'warning'
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border p-3.5 text-sm', s.box, className)}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', s.iconColor)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
      </div>
    </div>
  )
}
