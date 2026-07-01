import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seedTestRoles, resetTestRoles } from '@/scripts/seed-test-roles'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const url = new URL(req.url)
  const isReset = url.pathname.endsWith('/reset')

  try {
    if (isReset) {
      const res = await resetTestRoles()
      return NextResponse.json({ ok: true, ...res })
    } else {
      const res = await seedTestRoles()
      return NextResponse.json({ ok: true, ...res })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
