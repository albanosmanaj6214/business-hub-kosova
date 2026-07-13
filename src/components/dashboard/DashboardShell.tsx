'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/brand/Wordmark'
import { KonsulentiWidget, openKonsulenti } from '@/components/konsulenti/KonsulentiWidget'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'
import { isEnergyEligible } from '@/lib/energy'
import {
  MessagesSquare, Menu, X,
  LogOut, Shield, ChevronRight, ChevronDown,
} from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const role = (session?.user as { role?: string })?.role
  const employeeCount = (session?.user as { employeeCount?: string | null })?.employeeCount
  // Gating i sektorit ndjek entitledSectors (qasja e dhene nga admini/faturimi), jo vetedeklarimin.
  const userSectors = (session?.user as { entitledSectors?: string[] })?.entitledSectors ?? []
  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const energyOk = isEnergyEligible(employeeCount) || isAdminRole
  const sectorOk = (it: { forSectors?: string[] }) =>
    !it.forSectors || isAdminRole || it.forSectors.some((s) => userSectors.includes(s))
  const sections = navigationForRole(role)
    .map((s) => ({ ...s, items: s.items.filter((it) => (!it.energyOnly || energyOk) && sectorOk(it)) }))
    .filter((s) => s.items.length > 0)
  const activeName = flattenNav(sections).find((n) => n.href === pathname)?.name

  function toggleSection(label: string) {
    setCollapsed((c) => ({ ...c, [label]: !c[label] }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <Wordmark variant="primary" size="sm" asLink />
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Mbyll menynë">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-4 flex-1 overflow-y-auto">
          {sections.map((section) => {
            const isCollapsed = collapsed[section.label]
            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span>{section.label}</span>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-[#1B4F72] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px] mr-3 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div className="pt-2 space-y-1">
            <button
              type="button"
              onClick={() => { setSidebarOpen(false); openKonsulenti() }}
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] text-white shadow-sm hover:shadow-md hover:from-[#143a55] hover:to-[#1B6FA5] transition-all"
            >
              <MessagesSquare className="h-5 w-5 mr-3" />
              Asistenti KBH
              <span className="ml-auto text-[10px] font-bold tracking-wider bg-amber-400 text-[#1B4F72] px-2 py-0.5 rounded-full shadow-sm animate-pulse">E RE</span>
            </button>

            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin"
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                <Shield className="h-5 w-5 mr-3" />
                Admin Panel
              </Link>
            )}
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-[#1B4F72]">Dashboard</Link>
            {pathname !== '/dashboard' && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-gray-900 font-medium">
                  {activeName || 'Page'}
                </span>
              </>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      <KonsulentiWidget userName={session?.user?.name} />
    </div>
  )
}
