# RC1 Production Deployment Runbook (proposed — NOT executed)

## Current production runtime (read-only inventory)
- PM2: `businesshub` (online, fork, `next start -p 3000`, cwd /var/www/businesshub, Node **20.20.2**, npm 10.8.2) + `scraper` (online, scraper.js). 2 online.
- Build: `next build`; start: `next start`. No `postinstall`. Prisma client generated via `prisma generate` (not in package scripts — run explicitly).
- Env: `/var/www/businesshub/.env` (23 vars, mode 644 — harden to 600).
- Logs: `/root/.pm2/logs/businesshub-{out,error}.log`.
- Health check: no `/api/health` route; use homepage `GET /` = 200.
- Deploy automation: `.github/workflows/deploy.yml` (push to `main` -> self-hosted runner -> `sudo -n /usr/local/bin/deploy-businesshub.sh`). NOTE: GitHub Actions is disabled on this account; treat deploy as **manual** via the deploy script/steps below.

## Proposed deploy sequence (do NOT execute without authorization)
1. **Maintenance/comms decision** — pick a low-traffic window; decide whether a maintenance notice is needed.
2. **Verified backup** — `pg_dump -Fc businesshub_db`; record size + sha256 + timestamp (see backup runbook).
3. **Release artifact verification** — check out `release/rc-1-production-readiness` at the approved commit; confirm HEAD matches the sign-off hash.
4. **Environment preflight** — apply the environment checklist: provision real Turnstile site+secret keys, set `TURNSTILE_EXPECTED_HOSTNAME`, set `DEV_IMPERSONATION_ENABLED=false` and remove `DEV_IMPERSONATION_KEY`, ensure `STRIPE_SECRET_KEY` present, `APP_ENV=production`. `chmod 600 .env`.
5. **Migration application** — apply the 4 migrations in order with `psql -1 -v ON_ERROR_STOP=1 -f` (reviewed SQL; NOT `migrate deploy`, NOT `db push`), then `prisma migrate resolve --applied` each.
6. **Prisma client generation** — `npx prisma generate`.
7. **Application build** — `npm run build` (requires STRIPE_SECRET_KEY; build in an isolated worktree, never in the live prod .next — see below).
8. **Controlled restart** — `pm2 restart businesshub` (only after a clean build). NEVER rebuild the live prod `.next` in place.
9. **Scraper restart** — only if scraper code changed (it did not materially in this release); otherwise leave running.
10. **Smoke tests** — homepage 200; login with a real account through the (now real-key) Turnstile; dashboard loads; `/api/dev/impersonate` returns 404; admin ingestion/statistics pages load for SUPER_ADMIN; no Market Pulse; no ASKdata on public pages.
11. **Go/No-Go checkpoint** — confirm smoke tests; else trigger rollback.
12. **Rollback trigger** — on failure, follow rc1-rollback-runbook.md (app back to ec8d5ff, keep additive DB).

## Constraints
Do not change PM2/cron/systemd/env during the RC phase. Build in an isolated worktree and `pm2 restart` (the running PM2 process breaks if the live `.next` BUILD_ID changes underneath it).
