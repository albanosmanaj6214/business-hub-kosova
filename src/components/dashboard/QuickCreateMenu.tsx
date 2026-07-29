'use client'

import Link from 'next/link'
import { Plus, Handshake, Package, MessageSquare } from 'lucide-react'
import { useDropdown } from './use-dropdown'

// Only actions with a real destination and a working flow. Individuals do not
// have these business flows, so the menu is hidden for that role.
const ACTIONS = [
  { label: 'Krijo kërkesë për ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
  { label: 'Shto produkt', href: '/dashboard/profili-kompanise', icon: Package },
  { label: 'Kërko konsultim', href: '/dashboard/bookings', icon: MessageSquare },
]

export function QuickCreateMenu({ role }: { role?: string }) {
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>()
  if (role === 'INDIVIDUAL') return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Krijo diçka të re"
        className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 h-9 text-sm font-medium text-primary-fg hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Krijo</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 z-dropdown rounded-card border border-line bg-surface shadow-float p-1.5"
        >
          {ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-ink"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {a.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
