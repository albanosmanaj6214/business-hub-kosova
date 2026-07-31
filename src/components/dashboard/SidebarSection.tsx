'use client'

import type { NavSection } from '@/lib/role-navigation'
import { SidebarItem } from './SidebarItem'

interface Props {
  section: NavSection
  pathname: string
  collapsed: boolean
  unreadCount: number
  onNavigate?: () => void
}

export function SidebarSection({ section, pathname, collapsed, unreadCount, onNavigate }: Props) {
  return (
    <div className="space-y-0.5">
      {collapsed ? (
        <div className="mx-2 my-2 border-t border-line" role="presentation" />
      ) : (
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
          {section.label}
        </p>
      )}
      {section.items.map((item) => (
        <SidebarItem
          key={item.href ?? item.name}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}
