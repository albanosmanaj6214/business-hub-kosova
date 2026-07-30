# CanonicalRunLock Review (introduced Source Phase 3, retained Phase 4)

- **Model:** `CanonicalRunLock` (prisma/schema.prisma). PK `key` = `"<sourceId>:<endpointId|_>"`; columns sourceId, endpointId?, holder, acquiredAt (default now), expiresAt.
- **Migration:** `prisma/migrations/20260731000000_canonical_run_lock/migration.sql` — CREATE TABLE + 2 indexes (sourceId, expiresAt). **Fully additive** (no existing table touched); applies cleanly via `prisma migrate deploy` after the approved chain (verified on a fresh production clone).
- **Uniqueness & lease expiry:** atomic claim via the unique PK (`create` → P2002 ⇒ held). Before claiming, an EXPIRED lease (`expiresAt < now`) is deleted (reclaim). Default lease 10 min (well above a normal run).
- **Cleanup / crash recovery:** explicit `releaseRunLock` (holder-matched delete) in `finally` on success AND failure; a crashed holder's lease is reclaimed by the next acquirer once expired.
- **Indexes:** `@@index([sourceId])`, `@@index([expiresAt])`.
- **Compatibility with the approved production migration chain:** additive; ordered after phase1→phase2core→patch→phase4; `prisma migrate deploy` applies exactly this one new migration on the clone.
- **Why a lease table, not pg advisory locks:** advisory locks are session-scoped; Prisma's pool can route acquire/unlock to different pooled connections (leaking the lock), and the `pg` client is unavailable for a dedicated connection. Documented in `src/lib/ingestion/lock.ts`.
- **Tests (isolated pgtest):** active-lease protection (2nd acquire blocked), expired-lease reclamation, release-after-success, release-after-failure (no leak), unrelated-source concurrency. All pass on the migrated clone.
- Not applied to production.
