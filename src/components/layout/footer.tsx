import Link from 'next/link'
import { Globe2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#1B4F72] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Globe2 className="h-8 w-8" />
              <span className="text-xl font-bold">
                Business Hub <span className="text-[#2E86C1]">Kosova</span>
              </span>
            </div>
            <p className="text-gray-300 max-w-md">
              Platforma e inteligjencës së eksportit për prodhuesit e Kosovës.
              Zbuloni grante, panaire tregtare dhe udhëzues eksporti me AI.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Linqe</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Çmimet</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Rreth Nesh</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Hyr</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Regjistrohu</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kontakti</h3>
            <ul className="space-y-2 text-gray-300">
              <li>info@kosovabusinesses.aiaohub.com</li>
              <li>Prishtinë, Kosovë</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-gray-300 text-sm">
          © {new Date().getFullYear()} Business Hub Kosova. Të gjitha të drejtat e rezervuara.
        </div>
      </div>
    </footer>
  )
}
