// Cross-process, database-backed lease lock for canonical runs. Scoped by source +
// endpoint. Chosen over PostgreSQL advisory locks because advisory locks are
// session-scoped and Prisma's connection pool can route the acquire and release to
// different pooled connections (leaking the lock); the `pg` client is unavailable
// for a dedicated connection. A lease row with a TTL is atomic (unique PK) and safely
// reclaims a crashed holder's lease. The in-memory guard remains a fast local hint.
import { prisma } from '@/lib/prisma'

export const DEFAULT_LEASE_MS = 10 * 60 * 1000 // 10 minutes; well above a normal run

export function lockKey(sourceId: string, endpointId?: string | null): string {
  return `${sourceId}:${endpointId ?? '_'}`
}

export interface LockHandle {
  key: string
  holder: string
}

/** Atomically claim the lease. Returns a handle, or null if another live holder owns it. */
export async function acquireRunLock(sourceId: string, endpointId: string | null, holder: string, leaseMs = DEFAULT_LEASE_MS, now = new Date()): Promise<LockHandle | null> {
  const key = lockKey(sourceId, endpointId)
  const expiresAt = new Date(now.getTime() + leaseMs)
  // Reclaim an expired lease first (crash recovery); safe: only deletes a stale row.
  await prisma.canonicalRunLock.deleteMany({ where: { key, expiresAt: { lt: now } } })
  try {
    await prisma.canonicalRunLock.create({ data: { key, sourceId, endpointId, holder, acquiredAt: now, expiresAt } })
    return { key, holder }
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return null // held by a live holder
    throw e
  }
}

/** Release only if we still hold it (holder match). Safe to call on success or failure. */
export async function releaseRunLock(handle: LockHandle | null): Promise<void> {
  if (!handle) return
  await prisma.canonicalRunLock.deleteMany({ where: { key: handle.key, holder: handle.holder } }).catch(() => {})
}

/** Run `fn` while holding the lease; returns { ran:false } if another holder owns it. */
export async function withRunLock<T>(sourceId: string, endpointId: string | null, holder: string, fn: () => Promise<T>): Promise<{ ran: true; result: T } | { ran: false }> {
  const handle = await acquireRunLock(sourceId, endpointId, holder)
  if (!handle) return { ran: false }
  try {
    return { ran: true, result: await fn() }
  } finally {
    await releaseRunLock(handle)
  }
}
