# RC1 GO / CONDITIONAL GO / NO-GO Report

## Decision: **CONDITIONAL GO**

No technical release defect remains: code, unit tests, DB-backed tests, the additive migration chain, backup, restore, forward-migration, and application rollback all pass, and no secret is committed. Remaining items before deployment are **environment/human prerequisites**, which is exactly the CONDITIONAL GO case.

## Technical verification (all PASS)
- prisma validate: valid. tsc: clean. lint: clean (2 pre-existing brand `<img>` warnings). Default tests: **236 pass / 33 files**. DB-backed pgtests: **14 pass** (persistence + readiness 9, live ASKdata 5). Production build: **OK** (with STRIPE_SECRET_KEY present).
- Turnstile hotfix: safely ported (`8e05b19`), fail-closed verified live (hostname mismatch refused login; config gate refuses test/missing keys under APP_ENV=production; login rate limit tripped as designed). 17/17 turnstile tests.
- Migration rehearsal on a production clone: 4 additive migrations apply cleanly, recorded once, "schema is up to date"; 44 sources unchanged; 10 demo companies preserved; new tables empty; citation stat columns present; ASKdata absent; no source activated; 0 invalid FKs; no data mutation.
- Backup (sha256 recorded) + restore + isolated clone: PASS.
- Rollback: old ec8d5ff client reads the migrated DB; old app builds + boots against it. PASS.
- RC app rehearsal: all 6 account roles log in via the ported Turnstile against the migrated clone; correct resolved-profile personalization; **Market Pulse hidden; ASKdata absent**; `/api/dev/impersonate` returns **404** in prod-mode; no horizontal overflow at 1440/390.
- ASKdata safety: DRAFT in code, autoPublishAllowed never true, no startup fetch, no schedule registered, absent from the DB and public presentation.
- Secret scan: no secrets committed; test Turnstile keys appear only as a documented denylist constant; no committed .env.

## Conditions required before deployment (must all be satisfied)
1. **Provision real Cloudflare Turnstile production keys** (site + secret) and set **`TURNSTILE_EXPECTED_HOSTNAME`** to the prod hostname. (Prod is currently on TEST keys with no hostname; the fail-closed gate makes login unusable until real keys are set.)
2. **Set `DEV_IMPERSONATION_ENABLED=false` and remove `DEV_IMPERSONATION_KEY`** in production. It is currently `'true'` in prod (route live, key-gated, limited to test accounts) and must be closed.
3. **Ensure `STRIPE_SECRET_KEY` is present at build time** (build otherwise fails collecting /api/stripe/checkout) and the remaining required env vars per the environment checklist.
4. **Assign a deployment owner and a rollback owner; approve a maintenance window.**
5. **Authorize and take a fresh production `pg_dump` immediately before deploy.**
6. Hardening (recommended, not blocking): `chmod 600` the prod `.env`; rotate the production DB password (currently a dictionary word).

## NOT blockers
- Inactive ASKdata governance items (terms/licence/attribution/owner/reviewer/schedule) are NOT a blocker for the rest of the platform, because ASKdata remains DRAFT, inactive, unscheduled, and hidden, and is unreachable from any automatic production workflow.

## Known limitations
- Browser smoke QA captured 12 screenshots (6 roles × 1440/390) with full programmatic verification (login OK, overflow 0, no Market Pulse, no ASKdata, correct greetings); on-screen visual re-inspection of the RC screenshots was blocked by a temporary image-tool outage — the same dashboard rendering was visually inspected during the approved Redesign Phase 3 verification (identical code).
- The migration chain is applied via reviewed `psql -f` (not `migrate deploy`) because production evolved partly via `db push`; this is intentional and matches prior approved data-phase runbooks.

---

# Condition-Closure Addendum (release/rc-1-condition-closure)

**RC1 remains CONDITIONAL GO.** The technical gate is now **READY FOR PRODUCTION AUTHORIZATION** (migration method selected + rehearsed via `prisma migrate deploy`; migration-history handling proven; preflight passes against a correct production-like env and blocks the current prod env; visual RC smoke inspected across all roles with no defects; no committed secret; no unresolved RC defect). Actual deployment status stays CONDITIONAL GO until the operator confirms the 8 prerequisites (real Turnstile keys + hostname, disable dev impersonation, Stripe present, deploy owner, rollback owner, deploy window, fresh backup authorization, authorization to restart prod during deploy).

**Production impact correction (accurate):** during RC1 cleanup a broad `pkill -9 -f "next-server"` also matched the production Next.js process; PM2 restarted the production application **once**. No production code, database data or schema, source, schedule, environment value, or deployment changed; production recovered automatically on `ec8d5ff`; homepage returned HTTP 200. Do not state production services were completely untouched — one process restart occurred. Prevention controls are documented in `docs/rc1-incident-report.md` and were applied throughout the condition-closure phase (timeout-wrapped isolated processes; prod health checked 200 before and after every QA action; no process-termination command issued; prod `restarts` stayed at 1).

**Selected production migration method:** `prisma migrate deploy` (see `docs/rc1-migration-control-decision.md`). **Preflight:** `scripts/rc1-preflight.sh` (see `docs/rc1-production-preflight.md`). **Secrets:** `docs/rc1-production-secret-provisioning.md`. **Visual QA:** `docs/rc1-final-visual-qa.md`. **Summary:** `docs/rc1-condition-closure-report.md`.
