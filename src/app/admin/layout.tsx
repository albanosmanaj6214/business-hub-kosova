'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Shield, Users, Search, Calendar, BookOpen, Bot, Bell, Inbox,
  LayoutDashboard, Menu, X, ArrowLeft, Trash2, Database, ClipboardCheck, Send, Newspaper, KeyRound, Building2, Beaker, FolderOpen,
} from 'lucide-react'
import { Toaster } from '@/components/admin/Toaster'

const adminNav = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Qendra e Përmbajtjes', href: '/admin/permbajtja', icon: FolderOpen },
  { name: 'Qendra e Dispeçimit', href: '/admin/dispatch', icon: Send },
  { name: 'Profilet e Bizneseve', href: '/admin/profiles', icon: Building2 },
  { name: 'Lajme', href: '/admin/news', icon: Newspaper },
  { name: 'Perdoruesit', href: '/admin/users', icon: Users },
  { name: 'Qasja e bizneseve', href: '/admin/access', icon: KeyRound },
  { name: 'Grantet', href: '/admin/grants', icon: Search },
  { name: 'Panairet', href: '/admin/fairs', icon: Calendar },
  { name: 'Udhëzuesit', href: '/admin/guides', icon: BookOpen },
  { name: 'AI Scraper', href: '/admin/scraper', icon: Bot, superOnly: true },
  { name: 'Burimet', href: '/admin/sources', icon: Database, superOnly: true },
  { name: 'Review Queue', href: '/admin/review', icon: ClipboardCheck },
  { name: 'Njoftimet', href: '/admin/notifications', icon: Bell },
  { name: 'Leads', href: '/admin/leads', icon: Inbox },
  { name: 'Llogari Testuese', href: '/admin/test-users', icon: Beaker, superOnly: true },
  { name: 'Trash', href: '/admin/trash', icon: Trash2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const isSuper = (session?.user as { role?: string })?.role === 'SUPER_ADMIN'
  const visibleNav = adminNav.filter((item: any) => !item.superOnly || isSuper)

  return (
    <div className="min-h-screen bg-gray-50">
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-orange-400" />
            <span className="font-bold">Admin Panel</span>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link href="/dashboard" className="flex items-center text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu ne Dashboard
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="bg-white border-b h-16 flex items-center px-4 lg:px-8">
          <button className="lg:hidden mr-4" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Admin - {adminNav.find((n) => n.href === pathname)?.name || 'Panel'}
          </h1>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
        <Toaster />
      </div>
    </div>
  )
}
