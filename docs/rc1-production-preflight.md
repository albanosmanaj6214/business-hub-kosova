# RC1 Production Preflight (read-only)

Script: `scripts/rc1-preflight.sh [/path/to/.env]` (default `/var/www/businesshub/.env`).

## Guarantees
Reveals NO secret values (checks presence/format, prints status only). Does NOT restart a process, change an environment variable, print secrets, apply migrations, or build/deploy. Exits **non-zero** if any blocker is present.

## Checks
Required-present: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, STRIPE_SECRET_KEY. Turnstile: site + secret present and NOT Cloudflare test keys, expected hostname set (action optional). Dev impersonation disabled/absent + no impersonation key. No QA DB / preview / trycloudflare reference. Production runtime (APP_ENV/NODE_ENV — WARN if only set by `next start` at runtime). File mode (recommend 600). Infra: PostgreSQL reachable, ≥1GB disk, backup destination present, PM2 `businesshub` present (read-only, not modified).

## Result against CURRENT production .env — 4 BLOCKERS (exit 1)
1. Turnstile SITE key is a Cloudflare TEST key.
2. Turnstile SECRET key is a Cloudflare TEST key.
3. TURNSTILE_EXPECTED_HOSTNAME missing.
4. DEV_IMPERSONATION_ENABLED='true'.
Warnings: APP_ENV/NODE_ENV not pinned in .env (next start sets NODE_ENV=production at runtime; the fail-closed gate still activates); TURNSTILE_EXPECTED_ACTION unset (optional); DEV_IMPERSONATION_KEY present (remove); .env mode 644 (recommend 600).
OK: DATABASE_URL / NEXTAUTH_SECRET / NEXTAUTH_URL / STRIPE_SECRET_KEY present; no QA DB / preview reference; PostgreSQL reachable; disk ~32GB; backup dir present; PM2 businesshub present.

## Result against a CORRECTLY-configured production-like .env — PASS (exit 0)
With non-test keys + hostname + action + impersonation disabled + APP_ENV=production + mode 600: **BLOCKERS=0, PREFLIGHT: PASS**. This proves the RC is technically ready and the preflight validates a correct configuration. The current-prod failure reflects the outstanding operator prerequisites, not an RC defect.
