'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Globe2, LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Globe2 className="h-8 w-8 text-[#1B4F72]" />
              <span className="text-xl font-bold text-[#1B4F72]">
                Business Hub <span className="text-[#2E86C1]">Kosova</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#features" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              Shërbimet
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              \u00c7mimet
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-[#1B4F72] transition-colors">
              Rreth Nesh
            </Link>
            {session ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Dil
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Hyr</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Regjistrohu</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link href="/#features" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              Shërbimet
            </Link>
            <Link href="/pricing" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              \u00c7mimet
            </Link>
            <Link href="/about" className="block py-2 text-gray-600" onClick={() => setIsOpen(false)}>
              Rreth Nesh
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => signOut()}>Dil</Button>
              </>
            ) : (
              <>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">Hyr</Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full">Regjistrohu</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
