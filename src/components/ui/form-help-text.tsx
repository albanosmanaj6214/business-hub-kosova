import { cn } from '@/lib/utils'

interface FormHelpTextProps {
  children: React.ReactNode
  /** Associate with a field via aria-describedby by passing the same id. */
  id?: string
  tone?: 'muted' | 'error'
  className?: string
}

/** Helper or validation text for a form field. Pair `id` with aria-describedby. */
export function FormHelpText({ children, id, tone = 'muted', className }: FormHelpTextProps) {
  return (
    <p
      id={id}
      className={cn(
        'text-xs mt-1 leading-relaxed',
        tone === 'error' ? 'text-danger-ink' : 'text-ink-subtle',
        className,
      )}
    >
      {children}
    </p>
  )
}
