# RC1 Condition-Closure Report

Branch `release/rc-1-condition-closure` @ (see HEAD) based on `b0c9e05`. Worktree `/var/www/bh-rc1-gate`. This phase closed the technical prerequisites and documented the human/environment prerequisites. No deployment, merge, production migration, production restart, or production environment change was performed.

## Technical gate — all criteria MET → READY FOR PRODUCTION AUTHORIZATION
- Migration method selected and rehearsed: **`prisma migrate deploy`** (idempotent; applies exactly the 4 additive pending migrations; records history once). See rc1-migration-control-decision.md.
- Migration-history handling proven (records once; second run "No pending"; add_segment_axes divergence tolerated).
- Exact rehearsal on a fresh production clone: counts unchanged, 44 sources intact, 10 demo companies preserved, new tables empty, ASKdata absent/inactive, rollback-compatible.
- Preflight script PASSES against a correctly-configured production-like env (exit 0) and correctly BLOCKS the current prod config (4 blockers, exit 1). See rc1-production-preflight.md.
- Visual RC smoke PASSES: 7 screenshots visually inspected across all roles + login, no defects. See rc1-final-visual-qa.md.
- No committed secret (secret scan clean).
- No unresolved RC defect.

## Deployment status — CONDITIONAL GO (unchanged) until the operator confirms
1. Real Cloudflare Turnstile production keys provisioned + `TURNSTILE_EXPECTED_HOSTNAME` set.
2. `DEV_IMPERSONATION_ENABLED=false` (or absent) + `DEV_IMPERSONATION_KEY` removed in production.
3. `STRIPE_SECRET_KEY` available (present).
4. Deployment owner assigned.
5. Rollback owner assigned.
6. Deployment window approved.
7. Fresh production backup authorized.
8. Authorization to disable dev impersonation and to restart the production application during deployment.

Production must NOT be modified to satisfy these conditions during this phase. See rc1-production-secret-provisioning.md and rc1-human-inputs (below) for placeholders.

## Human & operational inputs (placeholders — operator to provide; not invented)
| Input | Value |
|---|---|
| Deployment owner | `<TBD — operator>` |
| Rollback owner | `<TBD — operator>` |
| Approved deployment date/time window | `<TBD — operator>` |
| Maintenance / communication decision | `<TBD — operator>` |
| Production backup authorization | `<TBD — operator>` |
| Backup verifier | `<TBD — operator>` |
| Post-deployment smoke tester | `<TBD — operator>` |
| Production Turnstile hostname | `<TBD — operator>` |
| Real Turnstile keys provisioned? | `<TBD — operator confirmation>` |
| Production Stripe secret available? | `<TBD — operator confirmation>` (preflight: present) |
| Authorize disabling dev impersonation? | `<TBD — operator confirmation>` |
| Authorize production app restart during deploy? | `<TBD — operator confirmation>` |

## Incident correction
One unintended production application-process restart occurred during RC1 cleanup (broad `pkill`); production recovered automatically on ec8d5ff; no code/DB/schema/source/schedule/env/deployment changed. Prevention controls now documented. See rc1-incident-report.md.

## Environment-file hardening (read-only assessment)
Prod `.env`: owner root, group root, mode **644** (world-readable). PM2 runs businesshub as root, so `chmod 600` does not affect PM2. Recommended: `chmod 600 /var/www/businesshub/.env` (authorized command; rollback `chmod 644`). NOT changed in this phase. DB-password rotation is a separate controlled operation, not performed here.
