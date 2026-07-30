# Security Hotfix — Production Turnstile Configuration

Branch: `hotfix/production-turnstile` (based on production `platform-v5-wave-2-roles-and-profiles` @ `ec8d5ff`).
Status: **NOT deployed, NOT merged.** Requires the owner to provision a real Cloudflare Turnstile widget.

## The defect

Production `.env` configured Cloudflare's public **test** keys:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY = 1x00000000000000000000AA` (visible test key, always passes)
- `TURNSTILE_SECRET_KEY = <Cloudflare test secret, always passes>`

With always-pass test keys, the Turnstile gate on `/login` and `/register` accepts **any** token, i.e. it provides no bot/abuse protection. The client also hard-coded the same test key as a fallback (`|| '1x00000000000000000000AA'`), and login had **no independent rate limiting** (only registration did). Verification did not pin the response **hostname** or **action**.

## What the hotfix changes (code)

- `src/lib/turnstile.ts`
  - `turnstileConfigStatus()` + `isProductionRuntime()`: production **fails closed** when the secret is missing, when a **known Cloudflare test key** (site or secret) is configured, when the site key is missing, or when `TURNSTILE_EXPECTED_HOSTNAME` is missing.
  - `verifyTurnstile()` now: refuses on bad config, rejects missing/invalid tokens, **pins hostname** (required in prod) and **pins action** when configured, and fails closed on any siteverify error. Never logs or returns the secret or token.
  - Added `checkLoginRateLimit()` (10 attempts / IP / 15 min), independent of Turnstile.
- `src/lib/turnstile-client.ts` (new): client-safe PUBLIC site key only; **no test-key fallback** (fail closed if unset).
- `src/lib/auth.ts`: login `authorize()` now rate-limits per IP **before** Turnstile verification and any bcrypt/DB work; generic error; does not disclose whether an account exists.
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`: use the client-safe site key; removed the hard-coded test-key fallback.

Development and automated tests may still use the official Cloudflare test keys (guard only triggers in production runtime).

## Required production environment variables

| Variable | Scope | Required in prod | Dev/test |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (browser) | Yes — real production **site** key | test key allowed |
| `TURNSTILE_SECRET_KEY` | Server only | Yes — real production **secret** key | test key allowed |
| `TURNSTILE_EXPECTED_HOSTNAME` | Server only | Yes — `kosovabusinesses.aiaohub.com` | optional |
| `TURNSTILE_EXPECTED_ACTION` | Server only | Optional (only if widget sets `action`) | optional |

The **secret** must remain server-only and must never use a `NEXT_PUBLIC_` name. Never commit real keys to Git, source, docs, fixtures, or logs.

## Rebuild vs restart

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is **inlined at build time** by Next.js → changing it requires a **rebuild** (`next build`) **and** a process restart. Build in an isolated worktree, then deploy the artifact and `pm2 restart` (never rebuild in-place in the live directory).
- `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME`, `TURNSTILE_EXPECTED_ACTION` are read at **runtime** → changing them requires only a **`pm2 restart businesshub`** (no rebuild).

## Cloudflare configuration the owner must do (no real keys in this repo)

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name e.g. `KBH production login`. **Hostname**: `kosovabusinesses.aiaohub.com`. Mode: **Managed** (recommended).
3. Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Copy the **Secret Key** → `TURNSTILE_SECRET_KEY`.
4. Set `TURNSTILE_EXPECTED_HOSTNAME=kosovabusinesses.aiaohub.com`.
5. (Optional) If you set a widget `action`, also set `TURNSTILE_EXPECTED_ACTION` to the same value.

## Controlled deployment procedure (for later, explicit approval only)

1. Owner creates the Turnstile widget above and obtains the real site + secret keys.
2. Review + merge `hotfix/production-turnstile` into the production branch (or cherry-pick the single hotfix commit). Do NOT include any data/redesign commits.
3. On CT109, update `/var/www/businesshub/.env`: set the real `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_EXPECTED_HOSTNAME`; remove the test keys.
4. Because the site key is public/baked: build in an **isolated worktree** (not in-place), then deploy the built `.next` and `pm2 restart businesshub`.
5. Verify: the login page shows a real challenge; submitting without a valid token is rejected; server logs show no `verification refused: misconfiguration` lines; a normal login succeeds.
6. Rollback: restore the previous `.env` and previous build, `pm2 restart businesshub`.

## Verification done in isolation (this hotfix)

- Full unit suite (mocked siteverify, no Cloudflare dependency): production refuses missing/test config; missing/invalid tokens rejected; hostname/action mismatch rejected; valid token accepted; fail-closed on service error; secret/token never leaked; login + registration rate limits enforced.
- `tsc`, `lint`, full test suite, and `next build` all run in the isolated worktree; production untouched.
