import { NextResponse } from 'next/server'
import { purgeOldDeleted } from '@/lib/soft-delete'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Token-protected purge endpoint. Set CRON_SECRET in env, then hit nightly with:
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/admin/trash/cron-purge
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await purgeOldDeleted(30)
  return NextResponse.json({ ok: true, purged: result, ranAt: new Date().toISOString() })
}
