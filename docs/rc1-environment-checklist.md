# RC1 Environment & Secrets Checklist (redacted)

No secret values are recorded here. "present" = the variable exists in prod `.env` (23 vars); values never printed.

| Variable | Req? | Scope | Prod now | Format / rule | Failure behavior | Blocks release? |
|---|---|---|---|---|---|---|
| DATABASE_URL | required | server | present | postgres URL | app cannot start | yes |
| NEXTAUTH_SECRET | required | server | present | ≥32-char random | sessions invalid | yes |
| NEXTAUTH_URL | required | server | present | https origin | callbacks break | yes |
| NEXT_PUBLIC_APP_URL | required | **browser** | present | https origin | links break | no |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | required (prod) | **browser** | **TEST key** | real Cloudflare site key (baked at build) | widget empty -> login fail-closed | **yes** |
| TURNSTILE_SECRET_KEY | required (prod) | server | **TEST key** | real Cloudflare secret | verify refused (fail-closed) | **yes** |
| TURNSTILE_EXPECTED_HOSTNAME | required (prod) | server | **absent** | your prod hostname | config gate refuses (fail-closed) | **yes** |
| TURNSTILE_EXPECTED_ACTION | optional | server | — | action string | pinning skipped if unset | no |
| STRIPE_SECRET_KEY | build-time+runtime | server | present | sk_… | **build fails to collect /api/stripe/checkout** | yes (build) |
| STRIPE_WEBHOOK_SECRET | runtime | server | present | whsec_… | webhook route errors | no |
| ANTHROPIC_API_KEY | optional | server | present | key | AI enrich disabled (gated) | no |
| GEMINI_API_KEY / GEMINI_MODEL | optional | server | present | key/string | AI feature disabled | no |
| RESEND_API_KEY / EMAIL_FROM / NOTIFY_EMAIL | optional | server | present | key/email | email logs URL only | no |
| TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID | optional | server | present | token/id | telegram notify off | no |
| SCRAPER_SECRET | required (scraper) | server | present | secret | scraper endpoints 401 | no |
| SCRAPER_AI_ENRICH | optional | server | present | 'true'/absent | AI enrich off by default | no |
| CRON_SECRET | required (cron) | server | present | secret | cron endpoints 401 | no |
| NEXT_PUBLIC_ROLE_BASED_SIDEBAR | optional | **browser** | present | flag | sidebar default | no |
| APP_ENV / NODE_ENV | required | server | present | 'production' | Turnstile prod gate keys off it | yes |
| **DEV_IMPERSONATION_ENABLED** | must be OFF | server | **'true'** | absent or 'false' in prod | route live if 'true' | **yes (must set false)** |
| **DEV_IMPERSONATION_KEY** | must be removed | server | present | remove in prod | — | **yes (remove)** |

## Required prod-safety verifications
- [ ] **FAIL — `DEV_IMPERSONATION_ENABLED` = 'true' in prod.** The dev impersonation route is LIVE (returns 403 on wrong key, not 404). Blast radius limited (only @kbh.test/@test.local test accounts, admin roles refused, secret-key-gated) but MUST be set to false / removed before/at deployment. The RC route code itself is prod-safe (404 when the flag is off — verified in the isolated prod-mode rehearsal).
- [ ] **FAIL — prod on Cloudflare TEST Turnstile keys** (site + secret). Provision real keys.
- [ ] **FAIL — `TURNSTILE_EXPECTED_HOSTNAME` absent.** Set to the prod hostname (required by the fail-closed gate).
- [x] No QA impersonation key in RC source; no test secret accepted in prod mode (fail-closed gate).
- [x] No temporary QA credentials, preview URL, or local QA DATABASE_URL in committed RC files.
- Hardening (not a blocker): prod `.env` is mode **644** (world-readable) — recommend `chmod 600`. Prod DB password equals a dictionary word — recommend rotating to a strong secret.
