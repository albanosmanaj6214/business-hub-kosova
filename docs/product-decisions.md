# Product decisions

Temporary, intentional decisions that override a default behavior. Each entry
stays until the platform owner explicitly changes it.

## Demo/test companies stay visible (KIESA evaluation period)

Decided 2026-07-28 by the platform owner.

> Demo companies remain active and visible for the KIESA evaluation period. They
> may be hidden or migrated only after explicit approval from the platform owner.

Details:

- Do not hide, block, delete, archive, or restrict the seeded demo/test companies.
- Keep them visible in the company directory, at their direct profile URLs, and in
  contact requests, matchmaking, RFQ and other relevant flows.
- Do not change their `profileStatus` or `visibilityLevel`; do not rename or delete them.
- No global `isTest` filter, no 404 / access-denied rule, no Prisma schema change for this purpose.
- The Phase 1 directory-hiding behavior (`excludeTestCompanies`) has been reverted; the
  directory shows every approved, visible company to all users, exactly as in production.

This decision is revisited only on a direct instruction from the owner.
