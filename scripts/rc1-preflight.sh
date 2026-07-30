#!/usr/bin/env bash
# RC1 production preflight — READ-ONLY. Reveals NO secret values. Never restarts a
# process, changes env, prints secrets, applies migrations, or builds/deploys.
# Usage: rc1-preflight.sh [/path/to/.env]   (default: /var/www/businesshub/.env)
set -u
ENVFILE="${1:-/var/www/businesshub/.env}"
BLOCKERS=0
ok(){ echo "  [ OK ] $1"; }
warn(){ echo "  [WARN] $1"; }
block(){ echo "  [BLOCK] $1"; BLOCKERS=$((BLOCKERS+1)); }
getval(){ grep -E "^$1=" "$ENVFILE" 2>/dev/null | head -1 | sed -E "s/^$1=//; s/^\"//; s/\"$//"; }
present(){ grep -qE "^$1=" "$ENVFILE" 2>/dev/null; }

echo "== RC1 preflight against: $ENVFILE (values never printed) =="
[ -r "$ENVFILE" ] || { block "env file not readable"; echo "BLOCKERS=$BLOCKERS"; exit 1; }

# --- required presence ---
for v in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL STRIPE_SECRET_KEY; do
  present "$v" && ok "$v present" || block "$v missing"
done
# APP_ENV/NODE_ENV: `next start` sets NODE_ENV=production at runtime, so the Turnstile
# fail-closed gate activates even if absent from .env. Recommend setting APP_ENV=production
# explicitly (belt-and-suspenders); absence is a WARN, not a blocker.
present APP_ENV && ok "APP_ENV set in .env" || warn "APP_ENV absent from .env (recommend APP_ENV=production; next start still sets NODE_ENV=production at runtime)"
present NODE_ENV && ok "NODE_ENV set in .env" || warn "NODE_ENV absent from .env (next start sets it to production at runtime)"

# --- Turnstile ---
TS_SITE=$(getval NEXT_PUBLIC_TURNSTILE_SITE_KEY); TS_SEC=$(getval TURNSTILE_SECRET_KEY)
TEST_SITES="1x00000000000000000000AA 2x00000000000000000000AB 3x00000000000000000000FF"
TEST_SECS="1x0000000000000000000000000000000AA 2x0000000000000000000000000000000AA 3x0000000000000000000000000000000AA"
[ -n "$TS_SITE" ] && ok "site key present" || block "NEXT_PUBLIC_TURNSTILE_SITE_KEY missing"
[ -n "$TS_SEC" ] && ok "secret key present" || block "TURNSTILE_SECRET_KEY missing"
echo "$TEST_SITES" | grep -qw "$TS_SITE" && block "Turnstile SITE key is a Cloudflare TEST key (not allowed in prod)" || ok "site key not a known test key"
echo "$TEST_SECS" | grep -qw "$TS_SEC" && block "Turnstile SECRET key is a Cloudflare TEST key (not allowed in prod)" || ok "secret key not a known test key"
present TURNSTILE_EXPECTED_HOSTNAME && ok "TURNSTILE_EXPECTED_HOSTNAME set" || block "TURNSTILE_EXPECTED_HOSTNAME missing (fail-closed gate requires it)"
present TURNSTILE_EXPECTED_ACTION && ok "TURNSTILE_EXPECTED_ACTION set (optional)" || warn "TURNSTILE_EXPECTED_ACTION unset (optional)"

# --- dev impersonation must be OFF ---
DEVIMP=$(getval DEV_IMPERSONATION_ENABLED)
if [ "$DEVIMP" = "true" ]; then block "DEV_IMPERSONATION_ENABLED='true' (dev route live) — set false / remove"; else ok "dev impersonation disabled/absent"; fi
present DEV_IMPERSONATION_KEY && warn "DEV_IMPERSONATION_KEY present — remove in prod" || ok "no dev impersonation key"

# --- no QA/preview leakage ---
grep -qiE "rc1qa|gateqa|r3qa|_qa|preview\.local" "$ENVFILE" && block "QA database/preview reference in env" || ok "no QA DB reference"
grep -qi "trycloudflare" "$ENVFILE" && block "trycloudflare preview URL in env" || ok "no preview tunnel URL"

# --- runtime env ---
APPENV=$(getval APP_ENV); NODEENV=$(getval NODE_ENV)
if [ "$APPENV" = "production" ] || [ "$NODEENV" = "production" ]; then ok "production runtime set in .env"; else warn "production runtime not pinned in .env (next start sets NODE_ENV=production at runtime; gate still activates)"; fi

# --- file permissions ---
MODE=$(stat -c %a "$ENVFILE" 2>/dev/null)
[ "$MODE" = "600" ] && ok ".env mode 600" || warn ".env mode $MODE (recommend 600)"

# --- infra ---
command -v pg_isready >/dev/null && pg_isready -q && ok "PostgreSQL reachable" || warn "pg_isready not confirming (check manually)"
AVAIL=$(df -Pk / | awk 'NR==2{print int($4/1024)}'); [ "${AVAIL:-0}" -ge 1024 ] && ok "disk free ${AVAIL}MB (>=1GB)" || block "low disk ${AVAIL}MB"
[ -d /var/lib/postgresql ] && ok "backup destination /var/lib/postgresql exists" || warn "backup destination check"
pm2 pid businesshub >/dev/null 2>&1 && ok "PM2 process 'businesshub' present (not modified)" || warn "PM2 businesshub not found (read-only check)"

echo "== BLOCKERS=$BLOCKERS =="
[ "$BLOCKERS" -eq 0 ] && { echo "PREFLIGHT: PASS"; exit 0; } || { echo "PREFLIGHT: $BLOCKERS blocker(s) — NOT READY"; exit 1; }
