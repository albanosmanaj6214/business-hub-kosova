'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { User as UserIcon, Settings, CreditCard, LogOut, ChevronDown, ShieldCheck } from 'lucide-react'
import { useDropdown } from './use-dropdown'

interface Props {
  name?: string | null
  companyName?: string | null
  roleLabel: string
  isAdmin?: boolean
}

function initials(name?: string | null): string {
  if (!name) return 'KB'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'KB'
}

export function UserMenu({ name, companyName, roleLabel, isAdmin }: Props) {
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menyja e llogarisë"
        className="flex items-center gap-2 rounded-control p-1 pr-2 hover:bg-surface-sunken"
      >
        <span className="h-8 w-8 rounded-pill bg-primary-soft text-primary grid place-items-center text-xs font-semibold">
          {initials(name)}
        </span>
        <ChevronDown className="h-4 w-4 text-ink-subtle hidden sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 z-dropdown rounded-card border border-line bg-surface shadow-float p-1.5"
        >
          <div className="px-3 py-2 border-b border-line mb-1.5">
            <p className="text-sm font-medium text-ink truncate">{name || 'Përdorues'}</p>
            <p className="text-xs text-ink-subtle truncate">{companyName || roleLabel}</p>
          </div>
          <Link href="/dashboard/profili-kompanise" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-ink">
            <UserIcon className="h-4 w-4 shrink-0" aria-hidden="true" /> Profili
          </Link>
          <Link href="/dashboard/subscription" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-ink">
            <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" /> Abonimi
          </Link>
          <Link href="/dashboard/settings" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-ink">
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" /> Cilësimet
          </Link>
          {isAdmin && (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-primary hover:bg-surface-sunken">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> Paneli i Adminit
            </Link>
          )}
          <div className="my-1.5 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-danger-ink hover:bg-danger-soft text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" /> Dil
          </button>
        </div>
      )}
    </div>
  )
}
