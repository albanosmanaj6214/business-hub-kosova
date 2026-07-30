import { CanonicalRunClient } from './CanonicalRunClient'

export const dynamic = 'force-dynamic'

export default async function AdminCanonicalRunPage() {
  {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const { redirect } = await import('next/navigation')
    const session = await getServerSession(authOptions)
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') redirect('/admin')
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ingestion kanonik — Kontrolli</h1>
        <p className="text-gray-500 mt-1 text-sm">Test lidhjeje, dry-run i izoluar dhe import real për burime të governuara, një nga një. Veprimet janë të çaktivizuara kur burimi nuk është i pranueshëm.</p>
      </div>
      <CanonicalRunClient />
    </div>
  )
}
