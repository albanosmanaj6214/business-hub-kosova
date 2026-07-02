import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { purgeOldDeleted } from '@/lib/soft-delete'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(String(session.user.role ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await purgeOldDeleted(30)
  return NextResponse.json({ ok: true, purged: result })
}
