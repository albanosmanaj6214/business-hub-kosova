# RC1 Turnstile Hotfix Compatibility & Port Assessment

**Paused hotfix:** branch `hotfix/production-turnstile` @ `5742019` (based on prod `ec8d5ff`).
**Ported into RC as dedicated compatibility commit:** `8e05b19` (NO branch-history merge, NO blind cherry-pick).

## Compatibility audit
Hotfix touches 7 files: `src/lib/turnstile.ts` (M), `src/lib/turnstile-client.ts` (A), `src/lib/turnstile.test.ts` (A), `src/lib/auth.ts` (M), `src/app/(auth)/login/page.tsx` (M), `src/app/(auth)/register/page.tsx` (M), `docs/security/turnstile-hotfix.md` (A).

**Conflict analysis:** all 7 files are **byte-identical between prod `ec8d5ff` and RC base `3927f3f`** (the redesign/data phases never touched auth/login/register/turnstile). Therefore the hotfix applies to the RC with **zero conflicts** — the port checks out the hotfix versions directly, reproducing the hotfix diff exactly. Verified: `git diff 8e05b19_files vs 5742019` is empty.

## Behavior preserved (verified)
- **Server-side siteverify** (`verifyTurnstile` -> challenges.cloudflare.com).
- **Fail-closed in production** (`turnstileConfigStatus`): refuses missing secret, missing site key, Cloudflare TEST secret, TEST site key, and missing expected hostname when `isProductionRuntime()`. Verified live via an APP_ENV=production unit check (reasons: test_secret_in_production / test_site_key_in_production / missing_expected_hostname / missing_secret).
- **Hostname pinning** (`data.hostname !== TURNSTILE_EXPECTED_HOSTNAME`) — verified live: the running RC app logged `[turnstile] hostname mismatch` and refused login when the test-key hostname did not match the pinned value (fail-closed working).
- **Action pinning** (`data.action !== TURNSTILE_EXPECTED_ACTION` when set).
- **Token validation** (rejects missing/non-string token).
- **Login rate limit** (10 / 15 min per IP) + **registration rate limit** (3 / hr), keyed on client IP BEFORE bcrypt/DB; generic response, no account-existence disclosure — verified live (repeated attempts from one IP tripped the limit).
- **Generic user-facing errors**; logs **reason codes only**, never keys/tokens.
- **Client exposes only the public site key with NO test-key fallback** (`turnstile-client.ts` = `NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''`) — fail-closed when absent in prod.

## Must-not (verified)
Does NOT: enable test keys in production, embed any real/test secret in source (test keys appear only as a documented denylist constant in turnstile.ts + its test), expose the secret to the browser, weaken auth, silently pass on a missing prod secret, enable the dev impersonation route, or change roles/permissions.

## Validation
tsc clean; `turnstile.test.ts` **17/17** pass; full suite **236** pass; build OK. Live login for all 6 account roles succeeded through the ported path (test keys, dev config).

## PORT DECISION: SAFE — ported as `8e05b19`. No blocker introduced.

## Deployment note (carried to GO/NO-GO)
Production currently runs Cloudflare **TEST** Turnstile keys (confirmed: 2 test-key lines in prod .env) and has **no** `TURNSTILE_EXPECTED_HOSTNAME`. Real production keys + hostname are a hard prerequisite before public deployment; with the fail-closed gate, deploying without them makes login **fail closed** (safe but unusable), so they must be provisioned as part of the deploy.
