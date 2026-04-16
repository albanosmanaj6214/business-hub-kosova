'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Globe2, LayoutDashboard, Search, Calendar, BookOpen,
  Bell, Settings, CreditCard, MessageSquare, Menu, X,
  LogOut, Shield, ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Grante', href: '/dashboard/grants', icon: Search },
  { name: 'Panaire', href: '/dashboard/fairs', icon: Calendar },
  { name: 'Udhezues', href: '/dashboard/guides', icon: BookOpen },
  { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
  { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Cilesimet', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center space-x-2">
            <Globe2 className="h-7 w-7 text-[#1B4F72]" />
            <span className="font-bold text-[#1B4F72]">BH Kosova</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#1B4F72] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            )
          })}

          {session?.user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              <Shield className="h-5 w-5 mr-3" />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
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
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-[#1B4F72]">Dashboard</Link>
            {pathname !== '/dashboard' && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-gray-900 font-medium">
                  {navigation.find((n) => n.href === pathname)?.name || 'Page'}
                </span>
              </>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
