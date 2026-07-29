'use client'

import type { NavSection } from '@/lib/role-navigation'
import { SidebarSection } from './SidebarSection'

interface Props {
  sections: NavSection[]
  pathname: string
  collapsed: boolean
  unreadCount: number
  onNavigate?: () => void
}

/** The scrollable navigation list, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ sections, pathname, collapsed, unreadCount, onNavigate }: Props) {
  return (
    <nav aria-label="Navigimi kryesor" className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {sections.map((section) => (
        <SidebarSection
          key={section.label}
          section={section}
          pathname={pathname}
          collapsed={collapsed}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}
