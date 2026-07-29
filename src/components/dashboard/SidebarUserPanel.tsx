'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  name?: string | null
  companyName?: string | null
  roleLabel: string
  profilePct: number | null
  collapsed: boolean
  onNavigate?: () => void
}

function initials(name?: string | null): string {
  if (!name) return 'KB'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'KB'
}

export function SidebarUserPanel({ name, companyName, roleLabel, profilePct, collapsed, onNavigate }: Props) {
  if (collapsed) {
    return (
      <div className="border-t border-line p-3 flex justify-center">
        <span
          title={name ?? roleLabel}
          className="h-9 w-9 rounded-pill bg-primary-soft text-primary grid place-items-center text-xs font-semibold"
        >
          {initials(name)}
        </span>
      </div>
    )
  }

  return (
    <div className="border-t border-line p-3 space-y-3">
      {profilePct != null && profilePct < 100 && (
        <Link
          href="/dashboard/profili-kompanise"
          onClick={onNavigate}
          className="block rounded-control bg-surface-sunken px-3 py-2 hover:bg-line/40 transition-colors"
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-ink">Profili yt</span>
            <span className="font-semibold text-primary tabular-nums">{profilePct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-pill bg-line overflow-hidden">
            <div className="h-full rounded-pill bg-primary" style={{ width: `${profilePct}%` }} />
          </div>
          <p className="text-[11px] text-ink-subtle mt-1.5">Plotësoje për më shumë përputhje dhe dukshmëri</p>
        </Link>
      )}

      <div className="flex items-center gap-2.5">
        <span className="h-9 w-9 shrink-0 rounded-pill bg-primary-soft text-primary grid place-items-center text-xs font-semibold">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate">{name || companyName || 'Përdorues'}</p>
          <p className="text-xs text-ink-subtle truncate">{companyName || roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          aria-label="Dil nga llogaria"
          title="Dil"
          className="shrink-0 rounded-control p-2 text-ink-muted hover:bg-surface-sunken hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
