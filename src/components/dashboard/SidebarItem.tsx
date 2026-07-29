'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/lib/role-navigation'
import { isActive, hasActiveChild } from './nav-utils'

interface Props {
  item: NavItem
  pathname: string
  collapsed: boolean
  unreadCount: number
  onNavigate?: () => void
  depth?: number
}

export function SidebarItem({ item, pathname, collapsed, unreadCount, onNavigate, depth = 0 }: Props) {
  const active = isActive(pathname, item.href)
  const childActive = hasActiveChild(item, pathname)
  const [open, setOpen] = useState(childActive)
  // Auto-expand the parent whenever a child route becomes active (e.g. after a
  // client-side navigation into an Export destination), without collapsing a
  // group the user opened manually.
  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])
  const badgeCount = item.badge === 'unread' ? unreadCount : 0

  // Parent group (e.g. Eksporti)
  if (item.children) {
    // Icon-only mode: render children flattened as icons so every destination
    // stays reachable, each with its own accessible tooltip.
    if (collapsed) {
      return (
        <>
          {item.children.map((c) => (
            <SidebarItem
              key={c.href ?? c.name}
              item={c}
              pathname={pathname}
              collapsed
              unreadCount={unreadCount}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )
    }
    const Icon = item.icon
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            'w-full flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
            childActive ? 'text-primary font-medium bg-primary-soft/60' : 'text-ink-muted hover:bg-surface-sunken',
          )}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left">{item.name}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5 border-l border-line ml-4 pl-2">
            {item.children.map((c) => (
              <SidebarItem
                key={c.href ?? c.name}
                item={c}
                pathname={pathname}
                collapsed={false}
                unreadCount={unreadCount}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Leaf link
  const Icon = item.icon
  const twoLine = !collapsed && !!item.subtitle
  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.name : undefined}
      aria-label={collapsed ? item.name : item.name}
      className={cn(
        'relative flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
        collapsed && 'justify-center',
        active
          ? 'bg-primary text-primary-fg font-medium'
          : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {twoLine ? (
        // Two-line: task label (primary) + institution abbreviation (secondary).
        // No truncation — long procedure labels stay fully readable.
        <span className="flex-1 min-w-0 leading-tight">
          <span className="block">{item.title ?? item.name}</span>
          <span className={cn('block text-[11px]', active ? 'text-primary-fg/75' : 'text-ink-subtle')}>
            {item.subtitle}
          </span>
        </span>
      ) : (
        !collapsed && <span className="flex-1 truncate">{item.name}</span>
      )}
      {!collapsed && badgeCount > 0 && (
        <span
          className={cn(
            'ml-auto inline-flex min-w-[1.25rem] justify-center rounded-pill px-1.5 py-0.5 text-[11px] font-semibold',
            active ? 'bg-white/20 text-primary-fg' : 'bg-danger text-white',
          )}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
      {collapsed && badgeCount > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-pill bg-danger" aria-hidden="true" />
      )}
    </Link>
  )
}
