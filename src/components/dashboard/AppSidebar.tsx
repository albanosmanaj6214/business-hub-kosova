'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/brand/Wordmark'
import type { NavSection } from '@/lib/role-navigation'
import { SidebarNav } from './SidebarNav'
import { SidebarUserPanel } from './SidebarUserPanel'

interface Props {
  sections: NavSection[]
  pathname: string
  unreadCount: number
  profilePct: number | null
  name?: string | null
  companyName?: string | null
  roleLabel: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AppSidebar({
  sections, pathname, unreadCount, profilePct, name, companyName, roleLabel, collapsed, onToggleCollapse,
}: Props) {
  return (
    <aside
      className={cn(
        'hidden lg:flex fixed top-0 left-0 z-sticky h-full flex-col bg-surface border-r border-line transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('h-16 flex items-center border-b border-line', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed && <Wordmark variant="primary" size="sm" asLink />}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Zgjero menynë' : 'Ngushto menynë'}
          title={collapsed ? 'Zgjero' : 'Ngushto'}
          className="rounded-control p-2 text-ink-muted hover:bg-surface-sunken"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <SidebarNav sections={sections} pathname={pathname} collapsed={collapsed} unreadCount={unreadCount} />

      <SidebarUserPanel
        name={name}
        companyName={companyName}
        roleLabel={roleLabel}
        profilePct={profilePct}
        collapsed={collapsed}
      />
    </aside>
  )
}
