import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

// Compact empty state: says what is missing + one supported action.
export function DashboardEmptyState({ icon: Icon, message, cta }: { icon: LucideIcon; message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-control bg-surface-sunken px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
      <p className="text-sm text-ink-muted flex-1">{message}</p>
      {cta && <Link href={cta.href} className="shrink-0 text-sm font-medium text-link hover:underline">{cta.label}</Link>}
    </div>
  )
}
