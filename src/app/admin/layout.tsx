'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Shield, Users, Search, Calendar, BookOpen, Bot, Bell,
  LayoutDashboard, Menu, X, ArrowLeft,
} from 'lucide-react'

const adminNav = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Perdoruesit', href: '/admin/users', icon: Users },
  { name: 'Grantet', href: '/admin/grants', icon: Search },
  { name: 'Panairet', href: '/admin/fairs', icon: Calendar },
  { name: 'Udhezuesit', href: '/admin/guides', icon: BookOpen },
  { name: 'AI Scraper', href: '/admin/scraper', icon: Bot },
  { name: 'Njoftimet', href: '/admin/notifications', icon: Bell },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
          {adminNav.map((item) => (
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
      </div>
    </div>
  )
}
