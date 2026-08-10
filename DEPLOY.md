# Publikimi, backup-i dhe automatizimet

Ky dokument përshkruan **procedurën reale**, atë që përdoret në praktikë, jo atë që sugjeron `.github/workflows/deploy.yml`.

---

## Ku rrjedh prodhimi

| Element | Vlera |
|---|---|
| Host | Proxmox, container **LXC 109** |
| Direktoria | `/var/www/businesshub` |
| Branch | `platform-v5-wave-2-roles-and-profiles` |
| Procesi | PM2 `businesshub` → `next start -p 3000` |
| Konfigurimi PM2 | `ecosystem.config.js` (lexon `.env` dhe ia kalon fëmijës) |
| Databaza | PostgreSQL 16 lokale, `businesshub_db` |
| Ekspozimi publik | Cloudflare Tunnel (`cloudflared.service`, me drop-in `Restart=always`) |

---

## Rregulli kryesor

**Kurrë mos ekzekuto `next build` brenda `/var/www/businesshub`.**

`next build` rishkruan `BUILD_ID` dhe fshin chunk-et që procesi aktual po u referohet. Rezultati është faqe e bardhë me "client-side exception" derisa të bëhet rinisje. Në log-un e gabimeve gjendet dëshmia:
`Error: Could not find a production build in the '.next' directory`.

Prandaj ndërtimi bëhet **gjithmonë** në një worktree të izoluar dhe `.next` zëvendësohet i gatshëm.

---

## Procedura e publikimit

```bash
# 1. Worktree i izoluar për veçorinë
cd /var/www/businesshub
git worktree add -b feature/<emri> /var/www/bh-<emri> platform-v5-wave-2-roles-and-profiles
cd /var/www/bh-<emri>

# 2. Varësitë dhe konfigurimi. .env i prodhimit DUHET kopjuar para build-it:
#    NEXT_PUBLIC_* inline-ohet gjatë build-it (p.sh. NEXT_PUBLIC_ROLE_BASED_SIDEBAR).
#    Pa të, sidebar-i bie në atë të Biznesit Kosovar për të gjithë.
pnpm install --frozen-lockfile
cp /var/www/businesshub/.env .env
npx prisma generate

# 3. Portat: verifiko para se të ndërtosh
npx tsc --noEmit
pnpm test
pnpm build

# 4. QA në një port të përkohshëm (shih "QA me sesion" më poshtë)
PORT=3099 pnpm start

# 5. Ndal QA-në SIPAS PID-it të portit, kurrë me `pkill -f next-server`
#    (ai model i bie edhe procesit të prodhimit)
PID=$(ss -ltnp | grep ':3099' | grep -oP 'pid=\K[0-9]+' | head -1); kill "$PID"

# 6. Merge dhe zëvendësim i .next-it të gatshëm
cd /var/www/businesshub
git merge --ff-only feature/<emri>
rm -rf .next.prev && mv .next .next.prev
cp -r /var/www/bh-<emri>/.next .next
pm2 restart businesshub --update-env

# 7. Verifikim
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
curl -s -o /dev/null -w '%{http_code}\n' https://kosovabusinesses.aiaohub.com/
git push origin platform-v5-wave-2-roles-and-profiles
```

**Rikthimi:** `.next.prev` mbetet nga publikimi i mëparshëm. Rikthe me `rm -rf .next && mv .next.prev .next && pm2 restart businesshub`, pastaj `git reset --hard <commit-i i mëparshëm>`.

### Kur degët "shmangen" pa arsye

`auto-push.timer` bën `git add -A` çdo 30 minuta dhe mund të ketë krijuar një commit ndërkohë. Kontrollo `git log --oneline -3` në prodhim; nëse është snapshot automatik, rebazo degën e veçorisë mbi të: `git rebase platform-v5-wave-2-roles-and-profiles`.

---

## Migrimet e databazës

```bash
pnpm prisma migrate deploy     # aplikon migrimet e reja
```

**Testoje gjithmonë një rikrijim të plotë përpara:**

```bash
psql "$DATABASE_URL" -c "CREATE DATABASE kbh_test"
DATABASE_URL=".../kbh_test" npx prisma migrate deploy
npx prisma migrate diff --from-url ".../kbh_test" --to-url "$DATABASE_URL" --script
# Të dy drejtimet duhet të japin 0 rreshta SQL.
psql "$DATABASE_URL" -c "DROP DATABASE kbh_test"
```

**Historik:** deri më 2026-08-10 ky rikrijim **dështonte**. Dhjetë tabela (`Offering`, `OfferRequest`, `OfferResponse`, `ProductCategory`, `AuditLog`, `ContactRequest`, `ArbkTemplate`, `MediaAsset`, `EnergyNotice`, `EnergyPrice`), pesë kolona dhe pesëmbëdhjetë indekse ishin aplikuar me `prisma db push`, i cili nuk krijon file migrimi. Migrimi `20260810210000_catchup_db_push_drift` e mbyll atë hendek. **Mos përdor `db push` në prodhim** — përdor `migrate dev` që të krijohet file-i.

Kur një objekt ekziston tashmë në prodhim dhe migrimi shërben vetëm për mjediset e reja:
```bash
npx prisma migrate resolve --applied <emri_i_migrimit>
```

---

## Backup dhe restore

### Backup manual
```bash
mkdir -p /root/db-backups && chmod 700 /root/db-backups
pg_dump --no-owner --no-privileges "$DATABASE_URL" \
  | gzip -9 > /root/db-backups/businesshub_db-$(date -u +%Y%m%dT%H%M%SZ).sql.gz
chmod 600 /root/db-backups/*.sql.gz
```

### Restore (provoje gjithmonë në bazë të veçantë, jo mbi prodhimin)
```bash
psql "$DATABASE_URL" -c "CREATE DATABASE kbh_restore_test"
gunzip -c /root/db-backups/<file>.sql.gz | psql ".../kbh_restore_test"
# Krahaso numërimet me prodhimin, pastaj:
psql "$DATABASE_URL" -c "DROP DATABASE kbh_restore_test"
```

Verifikuar me sukses më 2026-08-10: dump 888 KB, të 12 tabelat e kontrolluara përputhen, Prisma Client lexon pa gabim.

> Backup-i i databazës **nuk është ende i automatizuar**. Ekziston vetëm procedura manuale më sipër.

---

## Automatizimet

### Systemd timers (CT109)

| Njësia | Orari | Çka bën |
|---|---|---|
| `kbh-scraper.timer` | 03:00 | `kbh-scraper-run.sh` → POST `/api/scraper` për KIESA, MINT, MZHR, KOSME |
| `kbh-grants-health.timer` | 04:00 | `kbh-grants-health.sh` |
| `auto-push.timer` | çdo 30 min | `auto-push.sh` → commit + push automatik |
| `cloudflared-update.timer` | — | përditësim i binarit të tunelit |

Skriptat gjenden në `ops/` në këtë repo dhe instalohen në `/usr/local/bin/`.

### Crontab (root)

| Orari | Skripti |
|---|---|
| `0 7 * * *` | `notify-cert-renewals.mjs` — kujtues skadence certifikimesh |
| `15 7 * * *` | `notify-fair-stand-calls.ts` — thirrjet e stendës shtetërore |
| `30 7 * * *` | `content-health-check.ts` — alarme freskie dhe provenance |
| `0 6 5 * *` | `refresh-kosovo-trade.mjs` — tregtia e jashtme nga ASK (mujor) |

### Kujdes me auto-push

`auto-push.sh` bën `git add -A`. Çdo file pranë kodit futet në commit brenda gjysmë ore. Ka shkaktuar dy incidente: `.next.prev/` (228 MB, GitHub e refuzoi push-in) dhe `.env.bak-*` me sekretet e prodhimit (u kap para se të arrinte në origin). `.gitignore` tani mbulon `.env*` dhe `.next.*/`. Përpara se të krijosh çdo file pranë kodit, verifiko me `touch <file> && git status --porcelain`.

---

## QA me sesion të mint-uar

Hyrja është e mbrojtur me Turnstile, prandaj për QA mint-o token direkt:

```js
import { encode } from 'next-auth/jwt'
const jwt = await encode({ token: { id, sub: id, email, role, tier }, secret: process.env.NEXTAUTH_SECRET, maxAge: 3600 })
// Cookie: __Secure-next-auth.session-token=<jwt>
```

Emri i cookie-t varet nga skema e `NEXTAUTH_URL`. Meqë në prodhim është `https://`, next-auth pret prefiksin `__Secure-` **edhe kur teston mbi `http://127.0.0.1`**; pa të merr 307. Skripti duhet ekzekutuar nga `/var/www/businesshub` që modulet të rezolvohen, dhe emërtoje `_*.mjs` që `.gitignore` ta kapë.

---

## GitHub Actions

`.github/workflows/deploy.yml` aktivizohet nga branch-i `main` dhe thërret `deploy-businesshub.sh` përmes një runner-i self-hosted. **Nuk përdoret:** prodhimi rrjedh nga `platform-v5-wave-2-roles-and-profiles`, jo `main`, dhe Actions është i çaktivizuar për këtë llogari. Skripti `ops/deploy-businesshub.sh` bën `git reset --hard origin/main` dhe `pnpm build` **brenda direktorisë së gjallë**, pra do të shkaktonte pikërisht defektin e përshkruar te "Rregulli kryesor". Mos e aktivizo pa e rishkruar që të ndërtojë në worktree.

---

## Kredencialet

- `.env` i prodhimit nuk është në git. Shabllonin e ke te `.env.example`.
- Autentikimi me GitHub bëhet me **SSH deploy key**, jo me token. Çelësi: `/root/.ssh/kbh_deploy_ed25519`, i regjistruar në repo si deploy key me të drejtë shkrimi (id `159859489`). Konfigurimi te `/root/.ssh/config`, remote-i është `git@github.com:...`.
- **Asnjë Personal Access Token nuk ndodhet më në server.** `/root/.git-credentials` u fshi dhe `credential.helper` u hoq. PAT-i i vjetër mbetet i vlefshëm në GitHub derisa pronari ta revokojë manualisht (Settings → Developer settings → Tokens); serveri nuk e përdor më.
- Kopjet e vjetra të `.env` ruhen te `/root/env-backups/` me chmod 600, jashtë repos.
