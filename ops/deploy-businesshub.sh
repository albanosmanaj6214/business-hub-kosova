#!/bin/bash
# Deploy script for business-hub-kosova — invoked by GitHub Actions self-hosted runner via sudo.
set -euo pipefail

APP_DIR=/var/www/businesshub
cd "$APP_DIR"

echo "[deploy] fetching latest main"
git fetch origin main
git reset --hard origin/main

echo "[deploy] installing deps"
pnpm install --frozen-lockfile

echo "[deploy] prisma generate"
pnpm prisma generate

echo "[deploy] building"
pnpm build

echo "[deploy] reloading pm2"
pm2 reload ecosystem.config.js --update-env

echo "[deploy] done"
