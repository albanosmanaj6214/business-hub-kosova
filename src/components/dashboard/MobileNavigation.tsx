'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'
import type { NavSection } from '@/lib/role-navigation'
import { SidebarNav } from './SidebarNav'
import { SidebarUserPanel } from './SidebarUserPanel'

interface Props {
  open: boolean
  onClose: () => void
  sections: NavSection[]
  pathname: string
  unreadCount: number
  profilePct: number | null
  name?: string | null
  companyName?: string | null
  roleLabel: string
}

/**
 * Accessible overlay drawer for screens below the desktop breakpoint.
 * Replaces the defective always-visible narrow sidebar: it is mounted only
 * when open, locks body scroll, traps focus, closes on Escape / backdrop /
 * navigation, and constrains width to ~88vw (max 320px).
 */
export function MobileNavigation({
  open, onClose, sections, pathname, unreadCount, profilePct, name, companyName, roleLabel,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-overlay bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menyja e navigimit"
        className="fixed top-0 left-0 z-drawer h-full w-[88vw] max-w-[320px] bg-surface shadow-float flex flex-col"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-line shrink-0">
          <Wordmark variant="primary" size="sm" asLink />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Mbyll menynë"
            className="rounded-control p-2 text-ink-muted hover:bg-surface-sunken"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav
          sections={sections}
          pathname={pathname}
          collapsed={false}
          unreadCount={unreadCount}
          onNavigate={onClose}
        />

        <SidebarUserPanel
          name={name}
          companyName={companyName}
          roleLabel={roleLabel}
          profilePct={profilePct}
          collapsed={false}
          onNavigate={onClose}
        />
      </div>
    </div>
  )
}
