'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { navigationForRole } from '@/lib/role-navigation'
import { KonsulentiWidget } from '@/components/konsulenti/KonsulentiWidget'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { MobileNavigation } from './MobileNavigation'
import { buildFilterCtx, filterSections } from './nav-utils'

const ROLE_LABELS: Record<string, string> = {
  KOSOVO_BUSINESS: 'Biznes Kosovar',
  STARTUP: 'Start Up',
  DIASPORA: 'Diasporë',
  INDIVIDUAL: 'Individ',
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Administrator',
  USER: 'Përdorues',
}
const COLLAPSE_KEY = 'kbh.sidebar.collapsed'

interface Props {
  children: React.ReactNode
  unreadCount?: number
  profilePct?: number | null
  turnoverBand?: string | null
}

export function DashboardShell({ children, unreadCount = 0, profilePct = null, turnoverBand = null }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as
    | { role?: string; employeeCount?: string | null; entitledSectors?: string[]; name?: string | null; companyName?: string | null }
    | undefined

  const role = user?.role
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const roleLabel = (role && ROLE_LABELS[role]) || 'Përdorues'

  const ctx = buildFilterCtx(role, user?.employeeCount, user?.entitledSectors, turnoverBand)
  const sections = filterSections(navigationForRole(role), ctx)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Restore persisted desktop collapse preference.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    menuBtnRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppSidebar
        sections={sections}
        pathname={pathname}
        unreadCount={unreadCount}
        profilePct={profilePct}
        name={user?.name}
        companyName={user?.companyName}
        roleLabel={roleLabel}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <MobileNavigation
        open={mobileOpen}
        onClose={closeMobile}
        sections={sections}
        pathname={pathname}
        unreadCount={unreadCount}
        profilePct={profilePct}
        name={user?.name}
        companyName={user?.companyName}
        roleLabel={roleLabel}
      />

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <AppHeader
          ref={menuBtnRef}
          onOpenMobile={() => setMobileOpen(true)}
          unreadCount={unreadCount}
          role={role}
          name={user?.name}
          companyName={user?.companyName}
          roleLabel={roleLabel}
          isAdmin={isAdmin}
        />
        <main className="mx-auto w-full max-w-content px-4 lg:px-8 py-6">{children}</main>
      </div>

      <KonsulentiWidget userName={user?.name} />
    </div>
  )
}
