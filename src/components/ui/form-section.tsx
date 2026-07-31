import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Groups related form fields under a legend, with an optional description.
 * Uses a real fieldset/legend for correct form semantics.
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn('border-0 p-0 m-0 min-w-0', className)}>
      <legend className="p-0 mb-1">
        <span className="block text-base font-semibold text-ink">{title}</span>
        {description && <span className="block text-sm text-ink-muted mt-0.5">{description}</span>}
      </legend>
      <div className="mt-3 space-y-4">{children}</div>
    </fieldset>
  )
}
