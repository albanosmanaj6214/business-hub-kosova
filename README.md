# Kosova Business Hub

Platformë SaaS që u jep bizneseve kosovare informacion të strukturuar për financim, panaire ndërkombëtare, tregje eksporti dhe kërkesat ligjore të tyre.

**Prodhimi:** https://kosovabusinesses.aiaohub.com
**Branch-i i prodhimit:** `platform-v5-wave-2-roles-and-profiles` (jo `main`)

---

## Çka bën

| Moduli | Përshkrimi |
|---|---|
| Mundësi financimi | Grante e subvencione nga institucione kosovare, të mbledhura automatikisht nga burime zyrtare |
| Panaire dhe ngjarje | Panaire ndërkombëtare e vendore, trajnime, matchmaking; përfshirë thirrjet e KIESA-s për stendën shtetërore |
| Atlasi i tregjeve | Hartë e 66 tregjeve me popullsi, GDP/banor dhe importe sektoriale nga burime statistikore zyrtare |
| Kërkesat e tregjeve | 215 kërkesa të verifikuara për hyrje në treg, me aktin ligjor të cituar |
| Certifikimet | Katalog me 90 certifikime sipas sektorit, me kujtues skadence |
| Udhëzues procedurash | ARBK, ATK, Dogana, AUV, KIPA, siguria në punë, energji |
| Paneli i administrimit | Menaxhim i përmbajtjes, burimeve, përdoruesve, dispeçimit |

Gjithçka personalizohet sipas sektorit dhe profilit të biznesit.

---

## Stack

Next.js 14.2 (App Router) · TypeScript strict · React 18 · Tailwind 3.4 · Prisma 5.22 · PostgreSQL 16 · NextAuth v4 (JWT) · Vitest · PM2

**Menaxheri i paketave: `pnpm`.** Ka `pnpm-lock.yaml`; `npm install` nuk mbështetet.

---

## Ngritja lokale

### Parakushtet
- Node.js 20.x
- pnpm 10.x
- PostgreSQL 16

### Hapat

```bash
pnpm install --frozen-lockfile

cp .env.example .env
# Plotëso së paku: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL
# Gjenero sekretin:  openssl rand -base64 32

createdb businesshub_db
pnpm prisma migrate deploy
pnpm prisma generate

pnpm dev        # http://localhost:3000
```

### Mbushja me të dhëna

Pa këto, shumica e faqeve janë bosh. Të gjitha përdorin API publike falas, pa çelësa.

```bash
node scripts/seed-certifications.mjs              # 90 certifikime
node scripts/seed-market-requirements.mjs         # 215 kërkesa tregu (me akte ligjore)
node scripts/refresh-market-stats.mjs             # popullsi + GDP (Eurostat)
node scripts/refresh-market-basics-imf.mjs        # tregjet jo-evropiane (IMF)
node scripts/refresh-sector-imports.mjs           # importe sektoriale (Eurostat Comext)
node scripts/refresh-sector-imports-comtrade.mjs  # importe sektoriale (UN Comtrade)
node scripts/refresh-kosovo-trade.mjs             # tregtia e jashtme e Kosovës (ASK)
npx tsx src/scripts/seed-test-roles.ts            # llogari testuese për çdo rol
```

### Verifikimi

```bash
pnpm test           # 13 file, 134 teste
npx tsc --noEmit    # duhet pa dalje
pnpm build
pnpm lint
```

---

## Konventat që duhen ditur

**Vetëm burime zyrtare.** Çdo shifër tregu ruhet me `sourceName`, `sourceUrl` dhe `retrievedAt`, dhe shfaqet me vitin e datën e kontrollit. Tregjet pa të dhëna të verifikuara shfaqin "të dhënat në verifikim", kurrë placeholder.

**Çdo rregull detyrues citon ligjin.** `MarketRequirement` shfaqet publikisht vetëm me `status=VERIFIED` dhe me `legalActName` + `legalActUrl`. Rregullat e paverifikuara rrinë `DRAFT` dhe janë të padukshme.

**Asnjë të dhënë sintetike.** Grantet e gjeneruara dikur me AI mbajnë etiketën `legacy_synthetic` dhe janë të fshehura nga publiku. Strategjia `gemini_synthesize` u hoq nga të gjitha burimet, sepse prodhonte të dhëna nga njohuria e modelit, jo nga faqja reale.

**Vetëm Haiku.** I vetmi model Anthropic i lejuar është `claude-haiku-4-5-20251001`. Pasurimi me AI gjatë scraping-ut është i fikur si parazgjedhje (`SCRAPER_AI_ENRICH`, `*_ENRICH`) dhe ndizet vetëm me leje shprehimore, sepse shkakton shpenzim në çdo run.

**Burimet: çaktivizo, mos fshi.** `Source` nuk fshihet kurrë; vendoset `isActive=false`. Vetëm burimet që sjellin realisht të dhëna guxojnë të jenë aktive, sepse numri i tyre shfaqet publikisht si "monitorohen çdo ditë".

**Fusha bosh = pa kufizim.** Në `matchesAudience`, `targetSectors` bosh do të thotë "e sheh kushdo". Por biznesi me `entitledSectors` bosh nuk sheh asgjë të targetuar sipas sektorit.

**Kurrë `next build` në direktorinë e gjallë.** Ndryshon `BUILD_ID` dhe thyen procesin PM2 që po rrjedh. Shih [DEPLOY.md](DEPLOY.md).

---

## Struktura

```
prisma/            skema (39 modele, 23 enum) + 26 migrime
scripts/           23 skripta operacionale (seed, ingestim, njoftime, shëndet)
src/app/           App Router: faqe publike, dashboard (35), admin (24), API (58)
src/components/    komponentë sipas domenit
src/lib/           logjika e biznesit, integrimet, scraper-at
docs/              36 dokumente teknike dhe vendimesh
```

Module qendrore në `src/lib`: `auth.ts`, `audience.ts` (rregulli i vetëm i dukshmërisë), `sectors.ts` (18 sektorë), `product-groups.ts`, `active-grants.ts`, `fair-stand-calls.ts`, `role-navigation.ts`, `tier-entitlements.ts`, `scrapers/`.

---

## Dokumentacion tjetër

- [DEPLOY.md](DEPLOY.md) — publikimi, backup, restore, automatizimet
- [RAPORT-DOREZIMI.md](RAPORT-DOREZIMI.md) — gjendja e plotë e projektit, rreziqet, borxhi teknik
- [docs/known-issues.md](docs/known-issues.md) — probleme të njohura
- [docs/database-conventions.md](docs/database-conventions.md) — konventat e databazës
- [docs/product-decisions.md](docs/product-decisions.md) — vendime produkti
