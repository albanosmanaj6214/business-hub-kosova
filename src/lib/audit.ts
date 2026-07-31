import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Audit Trail (§12): çdo veprim kritik i adminit regjistrohet — kush, çka, kur.
// Fire-and-forget: dështimi i logimit s'e ndal kurrë veprimin kryesor.

export type AuditAction =
  | 'CREATE' | 'EDIT' | 'ARCHIVE' | 'RESTORE'
  | 'DISPATCH' | 'WITHDRAW' | 'TEST_DISPATCH'
  | 'APPROVE_PROFILE' | 'REJECT_PROFILE' | 'SET_BADGE' | 'UNSET_BADGE'
  | 'SOURCE_CREATE' | 'SOURCE_TOGGLE'
  | 'SOURCE_GOV_CREATE' | 'SOURCE_GOV_UPDATE' | 'SOURCE_LIFECYCLE' | 'SOURCE_ENDPOINT_ADD' | 'SOURCE_ENDPOINT_UPDATE' | 'SOURCE_ENDPOINT_DELETE'
  | 'TIER_CHANGE' | 'ACCESS_CHANGE'
  | 'TEST_USERS_RESET'
  | 'LOGIN' | 'LOGIN_FAILED'

export async function logAudit(params: {
  action: AuditAction
  entityType: string
  entityId?: string | null
  summary: string
  meta?: Record<string, unknown>
  actorEmail?: string
  actorId?: string | null
}): Promise<void> {
  try {
    let actorEmail = params.actorEmail
    let actorId = params.actorId
    if (!actorEmail) {
      const session = await getServerSession(authOptions)
      actorEmail = session?.user?.email ?? 'sistemi'
      actorId = (session?.user as { id?: string })?.id ?? null
    }
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        actorEmail: actorEmail ?? 'sistemi',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        summary: params.summary.slice(0, 500),
        meta: (params.meta as any) ?? undefined,
      },
    })
  } catch (err) {
    console.error('[audit] logimi dështoi:', (err as Error).message)
  }
}
