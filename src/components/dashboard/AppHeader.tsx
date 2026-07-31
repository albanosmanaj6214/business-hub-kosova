'use client'

import { forwardRef } from 'react'
import { Menu } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { HeaderSearch } from './HeaderSearch'
import { HeaderNotifications } from './HeaderNotifications'
import { QuickCreateMenu } from './QuickCreateMenu'
import { UserMenu } from './UserMenu'

interface Props {
  onOpenMobile: () => void
  unreadCount: number
  role?: string
  name?: string | null
  companyName?: string | null
  roleLabel: string
  isAdmin?: boolean
}

export const AppHeader = forwardRef<HTMLButtonElement, Props>(function AppHeader(
  { onOpenMobile, unreadCount, role, name, companyName, roleLabel, isAdmin },
  menuBtnRef,
) {
  return (
    <header className="sticky top-0 z-sticky h-16 bg-surface border-b border-line flex items-center gap-2 sm:gap-3 px-4 lg:px-8">
      <button
        ref={menuBtnRef}
        type="button"
        onClick={onOpenMobile}
        aria-label="Hap menynë"
        aria-haspopup="dialog"
        className="lg:hidden rounded-control p-2 text-ink-muted hover:bg-surface-sunken"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="w-auto md:w-64 lg:w-80 shrink-0">
        <HeaderSearch />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <HeaderNotifications unreadCount={unreadCount} />
        <QuickCreateMenu role={role} />
        <UserMenu name={name} companyName={companyName} roleLabel={roleLabel} isAdmin={isAdmin} />
      </div>
    </header>
  )
})
