# Skriptat operacionale

Kopje nën kontroll versioni e asaj që rrjedh nga `/usr/local/bin/` në CT109.
Nuk ekzekutohen nga këtu; instalohen:

```bash
sudo cp ops/<skripti>.sh /usr/local/bin/ && sudo chmod +x /usr/local/bin/<skripti>.sh
```

| Skripti | Thirret nga | Çka bën |
|---|---|---|
| `auto-push.sh` | `auto-push.timer`, çdo 30 min | commit + push automatik i të gjithë ndryshimeve |
| `kbh-scraper-run.sh` | `kbh-scraper.timer`, 03:00 | POST te `/api/scraper` për burimet e listuara |
| `kbh-grants-health.sh` | `kbh-grants-health.timer`, 04:00 | kontroll shëndeti i granteve |
| `deploy-businesshub.sh` | GitHub Actions (i papërdorur) | ndërton në direktorinë e gjallë — shih paralajmërimin te DEPLOY.md |

**`auto-push.sh` bën `git add -A`.** Kjo ka futur artefakte build-i dhe një kopje `.env` me sekrete në commit. `.gitignore` tani mbulon `.env*` dhe `.next.*/`, por skripti mbetet i pakushtëzuar: çdo file i ri pranë kodit rrezikohet të commit-ohet brenda gjysmë ore.

**`deploy-businesshub.sh` nuk duhet aktivizuar ashtu siç është**: bën `pnpm build` brenda `/var/www/businesshub`, çka ndryshon `BUILD_ID` dhe thyen procesin PM2 që po rrjedh.
