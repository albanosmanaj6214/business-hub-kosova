# RC1 Production Secret Provisioning (no secret values)

Secrets must be provisioned by the operator directly in the protected production environment. Never paste real secret values into chat, source, docs, or command history. Validation checks presence/format only and reveal no values (`scripts/rc1-preflight.sh`).

## A. Development impersonation (BLOCKER)
Production currently reports `DEV_IMPERSONATION_ENABLED='true'` (dev route live; returns 403 on wrong key, i.e. enabled). Required final state:
- Set `DEV_IMPERSONATION_ENABLED=false` **or remove** it.
- Remove `DEV_IMPERSONATION_KEY`.
Validation (no restart in this phase; performed at deploy):
- `DEV_IMPERSONATION_ENABLED` is false or absent; `DEV_IMPERSONATION_KEY` absent (preflight checks this).
- After deploy: `GET /api/dev/impersonate?...` returns **404** (verified in the RC app rehearsal: 404 when the flag is off).
- No QA-only account or credential remains; no fallback re-enables the route (the route hard-returns 404 unless the flag is exactly `'true'`).

## B. Turnstile production keys (BLOCKER)
Production currently uses Cloudflare **test** keys and has no expected hostname. Required variables (values provisioned by operator, never shown):
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — real production site key (browser-exposed, baked at build).
- `TURNSTILE_SECRET_KEY` — real production secret (server-only).
- `TURNSTILE_EXPECTED_HOSTNAME` — the production hostname.
- `TURNSTILE_EXPECTED_ACTION` — the expected action (optional but recommended).
Format validation (no values printed): site/secret keys must NOT be in the Cloudflare test-key set; hostname must be set. The preflight enforces all of this.
Fail-closed guarantee: with the ported hotfix, if any of these is missing/test in production runtime, login **fails closed** (no bypass). Secret is never exposed to the browser (client module reads only the public site key) and is never logged (reason codes only).
Rotation: update `TURNSTILE_SECRET_KEY` in the protected env, restart the app; the previous key is invalidated at Cloudflare. Rollback: restore the previous key value from the secret manager and restart. Validation after provisioning: run the app in production mode and exercise valid / invalid / missing / wrong-action / wrong-hostname tokens (all but valid must fail closed) — covered by `turnstile.test.ts` (17) + the APP_ENV=production config-gate check.

## C. STRIPE_SECRET_KEY
Required at BUILD time because `src/lib/stripe.ts` instantiates `new Stripe(process.env.STRIPE_SECRET_KEY!)` at module load; the `/api/stripe/*` routes import it, so Next's build-time route collection evaluates it. Production already contains `STRIPE_SECRET_KEY` (preflight: present). Payments are deferred (not functionally used this release), but the key must remain present for the build to succeed and for the deferred payment routes not to throw at import. The app otherwise runs normally. Optional future improvement (NOT a defect, not done here): lazy-instantiate the Stripe client inside request handlers to drop the build-time dependency. No Stripe behavior was refactored (no verified release defect).

## Never
Do not request real secret values in chat/source/docs/history; do not embed any secret in Git; do not expose a server secret to browser code or logs.
