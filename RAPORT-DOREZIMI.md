# RAPORT I DORËZIMIT — Kosova Business Hub

**Data e raportit:** 2026-08-10
**Repozitori:** `business-hub-kosova` (GitHub, privat)
**Branch-i i prodhimit:** `platform-v5-wave-2-roles-and-profiles`
**Commit-i i fundit i analizuar:** `a5d18fb` (snapshot automatik) / `d62351d` (ndryshimi i fundit funksional)
**Vendndodhja e prodhimit:** container LXC 109 në Proxmox, direktoria `/var/www/businesshub`
**URL publike:** https://kosovabusinesses.aiaohub.com

Ky raport bazohet vetëm në atë që gjendet në workspace-in e projektit dhe në gjendjen e verifikueshme
të serverit të prodhimit. Aty ku diçka nuk mund të verifikohej, është shënuar shprehimisht.

---

## 1. PËRMBLEDHJE E PROJEKTIT

Kosova Business Hub është një platformë SaaS që u ofron bizneseve kosovare informacion të strukturuar për:

- mundësi financimi (grante, subvencione, thirrje publike)
- panaire ndërkombëtare tregtare
- udhëzues eksporti për 66 tregje
- kërkesat ligjore dhe certifikimet e nevojshme për të hyrë në një treg
- udhëzues procedurash vendore (ARBK, ATK, Dogana, AUV, KIPA, siguria në punë, energji)

Platforma është njëgjuhëshe në bërthamë (shqip) me përkthime në anglisht dhe gjermanisht
për faqet publike. Ka rol-bazuar akses (biznes kosovar, startup, diasporë, individ, admin)
dhe një panel administrimi për menaxhimin e përmbajtjes.

### Stack teknologjik

| Shtresa | Teknologjia | Versioni (nga `package.json` / runtime) |
|---|---|---|
| Framework | Next.js (App Router) | `14.2.35` |
| Gjuha | TypeScript | `^5` (mode `strict`) |
| UI | React | `^18` |
| Stilizimi | Tailwind CSS | `^3.4.1` + `class-variance-authority ^0.7.1`, `tailwind-merge ^3.5.0` |
| Ikonat | lucide-react | `^1.8.0` |
| ORM | Prisma | `^5.22.0` (client `@prisma/client ^5.22.0`) |
| Databaza | PostgreSQL | `16.13` (në server) |
| Autentikimi | NextAuth.js | `^4.24.14` + `@next-auth/prisma-adapter ^1.0.7`, strategji JWT |
| Hashimi i fjalëkalimeve | bcryptjs | `^3.0.3` |
| Validimi | zod | `^4.3.6` |
| CAPTCHA | `@marsidev/react-turnstile` | `^1.5.3` (Cloudflare Turnstile) |
| Email | resend | `^6.14.0` |
| Pagesat | stripe / @stripe/stripe-js | `^22.0.2` / `^9.2.0` |
| Harta | leaflet + @types/leaflet | `1.9.4` / `1.9.12` (tiles OpenStreetMap) |
| Scraping | cheerio | `^1.2.0` |
| Parsim dokumentesh | pdf-parse, mammoth | `^2.4.5`, `^1.12.0` |
| AI (ekstraktim/klasifikim) | `@anthropic-ai/sdk` | `^0.90.0` — modeli i vetëm i përdorur: `claude-haiku-4-5-20251001` |
| AI (asistent chat) | `@google/genai` | `^2.8.0` — modeli `gemini-2.5-flash` |
| Cron in-process | node-cron | `^4.2.1` |
| Markdown | react-markdown | `^10.1.0` |
| Testet | vitest | `^2.1.9` |
| Menaxheri i paketave | **pnpm** `10.33.0` | (ka `pnpm-lock.yaml`; `npm` nuk përdoret) |
| Runtime | Node.js | `v20.20.2` |
| Procesi | PM2 (`ecosystem.config.js`) | app `businesshub` në portin 3000 |

**Madhësia e kodit:** 308 file `.ts`/`.tsx` në `src/`, rreth **38,269 rreshta**.
75 faqe (`page.tsx`), 58 route API (`route.ts`), 90 komponentë, 69 module në `src/lib`.

---

## 2. STRUKTURA E KODIT

```
/var/www/businesshub
├── prisma/               skema + 24 migrime
├── public/               6 asete (logo SVG + atlas-countries.json)
├── scripts/              21 skripta operacionale (seed, ingestim të dhënash, njoftime)
├── src/
│   ├── app/              Next.js App Router: faqe publike, dashboard, admin, API
│   ├── components/       komponentë React të ndarë sipas domenit
│   ├── lib/              logjika e biznesit, integrimet, scraper-at
│   ├── scripts/          një skript seed për rolet testuese
│   └── types/            deklarime tipesh
├── docs/                 36 dokumente teknike/vendimesh
├── .github/workflows/    një workflow deploy (i papërdorur — shih §9)
├── ecosystem.config.js   konfigurimi PM2
├── scraper.js            daemon cron i veçantë (i papërdorur — shih §10)
└── vitest.config.ts      + vitest.pg.config.ts (teste me DB, të ndara)
```

### `src/app` — rrugët

| Folderi | Përshkrimi |
|---|---|
| `page.tsx`, `layout.tsx` | Faqja kryesore publike dhe layout-i rrënjë (fontet, metadata, SEO). |
| `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` | Artefaktet SEO, të gjeneruara nga aplikacioni. |
| `(auth)/login`, `(auth)/register` | Hyrja dhe regjistrimi, të mbrojtura me Turnstile. |
| `about`, `pricing`, `sectors`, `sectors/[slug]` | Faqe publike marketingu dhe 18 faqe sektoresh. |
| `brand` | Faqe e brendshme e sistemit vizual (jo për publikun; e përjashtuar nga `robots.txt`). |
| `verify-email` | Konfirmimi i emailit pas regjistrimit. |
| `dashboard/` (35 nënrrugë) | Zona e kyçur: grante, panaire, udhëzues, atlasi i tregjeve, certifikime, checklist, ARBK, ATK/tatime, dogana, AUV, KIPA, siguria në punë, energji, direktori biznesesh, matchmaking, kërkesa oferte, njoftime, cilësimet, abonimi. |
| `admin/` (24 nënrrugë) | Paneli i administrimit: grante, panaire, udhëzues, burime, scraper, taksonomi, përdorues, profile, review, dispatch, audit, koshi. |
| `api/` (58 route) | REST endpoints: auth, kompani, certifikime, oferta, RFQ, scraper, Stripe, konsulent, HS-code finder, media, newsletter, admin. |

### `src/lib` — modulet kryesore

| Moduli | Roli |
|---|---|
| `prisma.ts` | Singleton i klientit Prisma. |
| `auth.ts` | Konfigurimi NextAuth (credentials + JWT + Turnstile në hyrje). |
| `turnstile.ts` | Verifikim server-side i CAPTCHA-s + kufizues shkallë (rate limit) në memorie. |
| `email.ts`, `notify.ts` | Dërgim emaili përmes Resend; njoftime operacionale (Telegram opsional). |
| `i18n.ts`, `i18n-server.ts`, `use-locale.ts` | Përkthimet sq/en/de dhe zgjidhja e gjuhës nga cookie `NEXT_LOCALE`. |
| `sectors.ts` | 18 sektorë me slug, emra dhe fjalë kyçe përputhjeje. |
| `product-groups.ts` | 44 grupe produktesh nëpër 13 sektorë mallrash + hartimi treg→grup tregu. |
| `export-certifications.ts` | Katalogu i certifikimeve të eksportit (651 rreshta, i hardkoduar me qëllim). |
| `export-checklist/data.ts` | Lista e hapave të eksportit. |
| `role-navigation.ts` | Menyja anësore sipas rolit. |
| `tier-entitlements.ts` | Çfarë lejon secili nivel abonimi. |
| `active-grants.ts` | Numërimi i granteve "aktive" — e vetmja burim i së vërtetës për këtë numër. |
| `home-sources.ts` | Burimet e faqes kryesore, të lexuara nga tabela `Source`. |
| `trade-pulse-data.ts` | Tregtia e jashtme e Kosovës, e lexuar vetëm nga DB. |
| `dashboard/` | Ndërtimi i dashboard-it sipas rolit (`dashboard-data.ts`, `role-dashboard-config.ts`, `market-pulse.ts`). |
| `scrapers/` | Scraper-a specifikë: `kiesa`, `mint`, `mzhr`, `kosme`, `oek`, `news`. |
| `scrapers/framework/` | Korniza gjenerike: `runner`, `fetcher`, `fingerprint` + adapterë `rss`, `wordpress`, `html-list`, `pdf`. |
| `extractors/claude-pdf.ts` | Ekstraktim fushash nga PDF/DOCX me Haiku. |
| `generators/country-guide.ts` | Gjenerim udhëzuesish vendi me Haiku. |
| `classifiers/deadline-classifier.ts` | Klasifikim afatesh me Haiku (i mbyllur pas flag-ut `SCRAPER_AI_ENRICH`). |
| `konsulenti/tools.ts` | Mjetet e asistentit chat (Gemini). |
| `soft-delete.ts`, `audit.ts`, `activity.ts` | Fshirje e butë, gjurmë auditimi, aktivitet përdoruesi. |
| `dispatch.ts`, `audience.ts`, `matchmaking.ts` | Targetim dhe përputhje ofertash. |
| `stripe.ts` | Klienti Stripe. |

### `src/components`

`admin/`, `atlas/` (harta Leaflet + panelet e tregut), `brand/`, `certifications/`, `contact/`,
`dashboard/`, `konsulenti/`, `layout/` (navbar, footer, shell), `marketing/`, `sectors/`, `ui/` (primitivët).

---

## 3. HISTORIKU I ZHVILLIMIT

Po, projekti është repozitor Git me remote në GitHub.

| Treguesi | Vlera |
|---|---|
| Commits në branch-in e prodhimit | **210** |
| Commits në të gjitha referencat | **283** |
| Commit-i i parë | `4979e73` — 2026-04-16 ("Initial commit from Create Next App") |
| Commit-i i fundit funksional | `d62351d` — i stampuar 2026-08-07 (shih shënimin për orën më poshtë) |
| Aktiviteti i fundit | snapshot automatik `a5d18fb`; timer-i `auto-push` ka rrjedhur për herë të fundit më 2026-08-10 |
| Periudha e mbuluar | **16 prill 2026 → 10 gusht 2026** (rreth 4 muaj) |
| Branch-e lokale | 30 |
| Worktree aktive | 20 (`/var/www/bh-*`) |
| Tags | 1 (`design-old-backup`) |

### Aktiviteti sipas muajit (branch-i i prodhimit)

| Muaji | Commits |
|---|---|
| 2026-04 | 11 |
| 2026-05 | 55 |
| 2026-06 | 67 |
| 2026-07 | 62 |
| 2026-08 | 15 |

### Autorët

| Autori | Commits |
|---|---|
| `root <root@kosovabusineshub.taila921bb.ts.net>` | 175 |
| `Alban Osmanaj <albanosmanaj@gmail.com>` | 18 |
| `albanosmanaj6214` | 5 |
| `Claude <claude@aiaohub.com>` | 5 |
| `AlbanOsmanaj` | 4 |
| `Claude (hub)` | 3 |

Praktikisht i gjithë zhvillimi është bërë nga një person i vetëm, drejtpërdrejt në server,
me ndihmë të asistuar nga AI. **42 nga 210 commits (20%) janë snapshot-e automatike**
(`auto: snapshot ...`) të gjeneruara nga një timer systemd, jo ndryshime të qëllimshme.

### Zonat më të punuara (pa snapshot-et automatike)

| File | Herë të ndryshuar |
|---|---|
| `prisma/schema.prisma` | 28 |
| `src/app/dashboard/layout.tsx` | 18 |
| `src/app/dashboard/grants/page.tsx` | 17 |
| `src/app/dashboard/guides/page.tsx` | 16 |
| `src/app/admin/layout.tsx` | 15 |
| `src/app/api/scraper/route.ts` | 13 |
| `src/app/dashboard/guides/[id]/page.tsx` | 12 |
| `src/app/(auth)/register/page.tsx` | 12 |
| `src/app/dashboard/page.tsx` | 11 |
| `src/app/dashboard/fairs/page.tsx` | 11 |

Përfundim: pesha e zhvillimit ka qenë te **skema e databazës**, te **shtresa e dashboard-it/navigimit**
dhe te **modulet e granteve dhe udhëzuesve**.

> **Shënim mbi datat:** ora e sistemit të container-it ka qenë rreth 3 ditë prapa gjatë punës së fundit
> dhe është sinkronizuar më vonë. Prandaj commit-et e datës 2026-08-07 janë bërë realisht më 2026-08-10.
> `timedatectl` raporton `NTP service: inactive` brenda container-it. Datat e commit-eve në këtë
> repozitor duhen trajtuar si **të përafërta, jo autoritative**.

---

## 4. STATUSI I FUNKSIONALITETEVE

Statusi është nxjerrë nga kodi ekzistues **dhe** nga gjendja reale e databazës së prodhimit
(numërime ekzakte `COUNT(*)`, jo vlerësime statistikore).

| Moduli | Statusi | Baza e vlerësimit |
|---|---|---|
| Autentikim + regjistrim + verifikim emaili | I përfunduar (me rezervë) | NextAuth + Turnstile + rate limit; **dërgimi i emailit dështon në heshtje** (§6) |
| Rolet dhe autorizimi | I përfunduar | `middleware.ts` mbron `/dashboard` dhe `/admin`; 6 role aktive në DB |
| Menyja sipas rolit | I përfunduar | `role-navigation.ts` + 14 teste |
| Faqe publike (home, about, pricing, sectors) | I përfunduar | 200 OK; SEO i plotë (robots, sitemap, OG) |
| Tregtia e jashtme (banda ASK) | I përfunduar | Lexohet nga DB, 24 rreshta reale ASK, rifreskim cron mujor |
| Grante | I përfunduar teknikisht / **përmbajtje e vjetruar** | 127 grante; **89 me afat të skaduar, 13 pa afat, vetëm 2 me afat në të ardhmen** |
| Panaire | I përfunduar | 46 panaire, 44 me datë në të ardhmen |
| Udhëzues eksporti | I përfunduar | 66 udhëzues, 64 të publikuar |
| Atlasi i tregjeve (hartë Leaflet) | I përfunduar | 2,559 vlera importi për 64 vende + 66 popullsi + 65 GDP/banor |
| Kërkesat e tregjeve (greenlight) | I përfunduar pjesërisht | 215 rregulla, të gjitha `VERIFIED`; **22 MANDATORY + 20 PROCEDURAL pa link akti ligjor** |
| Katalogu i certifikimeve | I përfunduar | 90 certifikime aktive |
| Certifikimet e kompanive + kujtues skadence | **Në punim / i paprovuar** | Kodi dhe cron-i ekzistojnë, por `CompanyCertification` ka **0 rreshta** — rrjedha s'është testuar kurrë me të dhëna reale |
| Checklist eksporti | I përfunduar | `export-checklist/data.ts` + faqja |
| Udhëzues procedurash (ARBK, ATK, Dogana, AUV, KIPA, siguria në punë) | I përfunduar si përmbajtje statike | Faqe të mëdha me tekst të hardkoduar; **hapat s'janë verifikuar kundrejt burimeve zyrtare** (`docs/` e pranon këtë) |
| Moduli Energji | I përfunduar (i mbyllur pas kushtit) | Kushti 50+ punëtorë; `EnergyNotice`/`EnergyPrice` **0 rreshta** |
| Direktoria e bizneseve | Në punim | 24 kompani (11 APPROVED), pjesa më e madhe llogari testuese |
| Matchmaking / Kërkesa oferte (RFQ) | **Në punim / i papërdorur** | Kodi ekziston; `OfferRequest` = 0, `OfferResponse` = 0, `Offering` = 3 |
| Asistenti "Konsulenti" (Gemini) | I përfunduar | 26 seanca, 62 mesazhe në DB |
| HS-code finder (Haiku) | I përfunduar | 6 pyetje të regjistruara |
| Newsletter | **I pafilluar praktikisht** | Route ekziston; `NewsletterSubscriber` = 0 |
| Kontakt / kërkesa konsultimi | **I papërdorur** | `ContactRequest` = 0, `ConsultationRequest` = 0, `ConsultationBooking` = 1 |
| Abonimet / Stripe | **Kod i gatshëm, kurrë i përdorur** | 28 abonime në DB, por **0 me `stripeCustomerId` dhe 0 me `stripeSubscriptionId`** — nivelet caktohen manualisht |
| Shabllonet ARBK | I pafilluar | `ArbkTemplate` = 0 rreshta |
| Ngarkim medie | I pafilluar | `MediaAsset` = 0 rreshta |
| Scraper (KIESA, MINT, MZHR, KOSME, OEK, ME, AUV, ATK) | I përfunduar pjesërisht | 8 burime aktive; **ATK s'ka pasur asnjë sukses (51 dështime radhazi), OEK 18 dështime radhazi, sukses i fundit 2026-06-15** |
| Korniza kanonike e ingestimit (Phases 1–5) | **I ndërtuar, i padeploy-uar** | Ekziston vetëm në branch-e/worktree; prodhimi nuk e ka |
| Market Pulse në dashboard | **I fikur me qëllim** | `src/lib/dashboard/market-pulse.ts` kthen `[]` sepse shtresa statistikore s'është në prodhim |
| Paneli i administrimit | I përfunduar | 24 nënrrugë, i mbrojtur, me derë në sidebar |
| Audit log | I përfunduar | 87 rreshta |

### Komentet TODO / FIXME / HACK

**Në kodin burimor (`src/`, `scripts/`, `prisma/`) nuk ekziston asnjë koment `TODO`, `FIXME`, `HACK` ose `XXX`.**
Kërkimi u krye me `grep -rniE "todo|fixme|hack|xxx|tbd"` mbi të gjitha file-t `.ts`, `.tsx`, `.mjs`, `.js`, `.prisma`.
Rezultati: **0 përputhje në kod**.

Të vetmet përputhje janë në dokumentacion:

| Lokacioni | Përmbajtja |
|---|---|
| `docs/known-issues.md:18` | "using static selectors (per-source config, **TBD** column or file)" |
| `docs/database-conventions.md:39` | "Retention policy (**TBD** in Phase 13): keep 6 months, then prune" |
| `docs/superpowers/plans/2026-06-26-kbh-phase0a-segment-foundation.md:358` | `'XXX'` — vlerë testi për kod vendi jovalid, jo shënues pune |
| `docs/superpowers/plans/2026-06-26-kbh-phase0a-segment-foundation.md:768` | "Placeholder scan: asnjë TBD/TODO" |

**Kjo nuk do të thotë se s'ka punë të papërfunduar.** Puna e shtyrë është dokumentuar me
komente përshkruese në vend të shënuesve standardë. Ato që gjenden realisht janë:

| Lokacioni | Çka thotë |
|---|---|
| `src/lib/dashboard/market-pulse.ts:1-9` | Funksioni kthen `[]` me qëllim; shtresa statistikore s'është në prodhim; udhëzim si të rikthehet pyetësori i vërtetë. |
| `src/lib/scrapers/framework/adapters/pdf.ts:11` | Nxjerrja e afatit/kritereve/shumës nga file-i është "a later enhancement". |
| `src/lib/scrapers/types.ts:3` | Abstraksionet janë shtyrë derisa të ketë të paktën dy strategji reale. |
| `src/lib/notify.ts:4` | "Email transport added later when SMTP/Resend is chosen." |
| `src/lib/export-certifications.ts:4` | Të dhënat editohen në kod; UI-ja e adminit "can come later if needed". |
| `src/app/dashboard/certifikime/page.tsx:201` | Fushat "Kush e jep" / "Në Kosovë" / "Kosto" janë `--` (placeholder i shënuar). |
| `docs/known-issues.md` (i tërë) | Strategjia `gemini_synthesize` gjeneron të dhëna nga njohuria e modelit, jo nga faqja reale — mund të halucinojë grante. Fiksimi është planifikuar për "Phase 12", i pazbatuar. |

---

## 5. DATABAZA

- **Lloji:** PostgreSQL 16.13, lokale në container-in 109, baza `businesshub_db`, porti 5432.
- **ORM:** Prisma; skema në `prisma/schema.prisma` (1,104 rreshta).
- **Përmbajtja e skemës:** **39 modele**, **23 enum-e**.
- **Migrime:** 24 direktori në `prisma/migrations/`, nga `20260416173949_init` deri te `20260803090000_greenlight_wave1`.

### Grupimi i modeleve

| Domeni | Modelet |
|---|---|
| Identiteti / auth | `User`, `Account`, `Session`, `VerificationToken`, `Subscription` |
| Profile biznesi | `Company`, `StartupProfile`, `DiasporaProfile` |
| Përmbajtje | `Grant`, `TradeFair`, `NewsItem`, `ExportGuide` |
| Ingestim | `Source`, `Opportunity`, `ScrapeAttempt`, `SourceHealth`, `ScraperLog` |
| Treg / eksport | `MarketProfile`, `MarketStat`, `MarketRequirement`, `Certification`, `CompanyCertification` |
| Katalog / tregti | `ProductCategory`, `Offering`, `OfferRequest`, `OfferResponse` |
| Ndërveprim | `Notification`, `ConsultationBooking`, `ConsultationRequest`, `ContactRequest`, `NewsletterSubscriber`, `ChatSession`, `ChatMessage`, `HsQuery` |
| Operacione | `AuditLog`, `ArbkTemplate`, `MediaAsset`, `EnergyNotice`, `EnergyPrice` |

### Lidhjet kryesore

- `User 1—1 Company`, `User 1—1 Subscription`, `User 1—* Notification`, `User 1—* AuditLog`
- `Company 1—* CompanyCertification *—1 Certification`
- `Company 1—* Offering`, `Company 1—* OfferRequest 1—* OfferResponse`
- `Source 1—* Opportunity`, `Source 1—* ScrapeAttempt`, `Source 1—1 SourceHealth`
  (fshirja kaskadë ekziston vetëm për pastrim emergjence; konvencioni në kod është `isActive=false`, jo DELETE)
- `MarketProfile` lidhet me `MarketStat` dhe `MarketRequirement` përmes `countryCode` / `marketGroup`, jo me çelës të huaj
- `ChatSession 1—* ChatMessage`

### Gjendja reale e të dhënave në prodhim (numërime ekzakte, 2026-08-10)

| Tabela | Rreshta | | Tabela | Rreshta |
|---|---:|---|---|---:|
| `MarketStat` | 2,714 | | `Company` | 24 |
| `ScrapeAttempt` | 849 | | `VerificationToken` | 7 |
| `MarketRequirement` | 215 | | `HsQuery` | 6 |
| `Grant` | 127 | | `DiasporaProfile` | 4 |
| `Notification` | 114 | | `Offering` | 3 |
| `Opportunity` | 98 | | `StartupProfile` | 2 |
| `Certification` | 90 | | `ConsultationBooking` | 1 |
| `AuditLog` | 87 | | `Account` | 0 |
| `ProductCategory` | 72 | | `ArbkTemplate` | 0 |
| `ExportGuide` | 66 | | `CompanyCertification` | 0 |
| `ChatMessage` | 62 | | `ConsultationRequest` | 0 |
| `Source` | 47 | | `ContactRequest` | 0 |
| `TradeFair` | 46 | | `EnergyNotice` | 0 |
| `SourceHealth` | 41 | | `EnergyPrice` | 0 |
| `MarketProfile` | 37 | | `MediaAsset` | 0 |
| `NewsItem` | 37 | | `NewsletterSubscriber` | 0 |
| `ScraperLog` | 31 | | `OfferRequest` | 0 |
| `Subscription` | 28 | | `OfferResponse` | 0 |
| `User` | 28 | | `Session` | 0 |
| `ChatSession` | 26 | | | |

**17 nga 28 përdoruesit janë llogari testuese** (`@kbh.test` / `@test.local`). Prodhimi ka faktikisht
rreth 11 përdorues realë.

> **Kujdes:** `pg_stat_user_tables.n_live_tup` në këtë bazë është **shumë i pasaktë** sepse `ANALYZE`
> nuk është ekzekutuar prej kohësh (p.sh. raporton 0 rreshta për `User` kur ka 28). Përdorni gjithmonë
> `COUNT(*)`, jo statistikat e planifikuesit.

### Statusi i migrimeve — **KA DRIFT**

`npx prisma migrate status` raporton "Database schema is up to date!", por kjo është mashtruese:

- `prisma/migrations/` përmban **24** migrime.
- Tabela `_prisma_migrations` në prodhim përmban **25** rekorde.
- Migrimi shtesë është **`20260626135122_add_segment_axes`**, i cili **nuk ekziston në branch-in e prodhimit**.
  Ai gjendet vetëm në branch-et e pambledhura `feature/segments-phase0a`, `feature/diaspora-phase4`,
  `feature/startup-phase1`.

Ai migrim shton kolonat:
`Grant.targetCountries`, `Grant.targetSegments`, `NewsItem.targetCountries`, `NewsItem.targetSegments`,
`TradeFair.targetCountries`, `TradeFair.targetSegments`, `User.businessSegment`, `User.diasporaCountry`,
`User.diasporaRole`, `User.lookingFor`, `User.startupStage`.

**Pasoja:** një ekipë e re që klonon branch-in e prodhimit dhe bën `prisma migrate deploy` mbi një bazë
të re **nuk do të marrë të njëjtën skemë si prodhimi**. Kjo duhet zgjidhur para çdo rikrijimi mjedisi.

Ekziston edhe një mospërputhje e dytë, e kundërt: tabela `Source` në prodhim ka kolonat
`kind`, `orgCategory`, `reliability`, `publishMode`, `frequency`, `sectorsHint`, `keywords`,
`selectors`, `lastCheckedAt` — të cilat janë në skemë, por s'ka migrim të dedikuar për to në
`prisma/migrations` përveç `20260610120000_source_registry_framework`. Kjo duhet verifikuar
para një rikrijimi nga zeroja.

---

## 6. SHËRBIMET E JASHTME DHE LLOGARITË

| Shërbimi | Për çka përdoret | Ku shfaqet në kod | Qasja e nevojshme për ekipën e re |
|---|---|---|---|
| **Proxmox VE** (host `192.168.178.56`) | Pret container-in LXC 109 ku rrjedh gjithçka | jashtë repos | Kredenciale root të hostit + qasje rrjeti |
| **PostgreSQL 16** (lokale në CT109) | Databaza e vetme e aplikacionit | `DATABASE_URL` | Kredenciale të bazës + dump i fundit |
| **Cloudflare Tunnel** (`cloudflared`) | Ekspozon aplikacionin publikisht pa IP publike | njësi systemd `cloudflared.service` | Llogari Cloudflare + qasje te tuneli |
| **Cloudflare DNS** (zona `aiaohub.com`) | Domeni `kosovabusinesses.aiaohub.com` | `NEXT_PUBLIC_APP_URL` | Qasje te zona DNS |
| **Cloudflare Turnstile** | CAPTCHA në hyrje dhe regjistrim | `src/lib/turnstile.ts` | **Çelësa realë prodhimi — aktualisht MUNGOJNË (§12)** |
| **GitHub** (`albanosmanaj6214/business-hub-kosova`, privat) | Repozitori + snapshot-e automatike | `git remote` | Qasje në repo; **token-i aktual duhet rrotulluar (§12)** |
| **GitHub Actions** (self-hosted runner) | Workflow deploy-i | `.github/workflows/deploy.yml` | Runner-i është i regjistruar por workflow-i s'përdoret (§9) |
| **Anthropic API** | Ekstraktim fushash nga PDF/DOCX, gjenerim udhëzuesish, klasifikim afatesh, HS-code finder, scraper OEK. Modeli i vetëm: `claude-haiku-4-5-20251001` | `src/lib/extractors/claude-pdf.ts`, `generators/country-guide.ts`, `classifiers/deadline-classifier.ts`, `api/hs-code-finder`, `scrapers/oek.ts` | Çelës API + faturim. **Aktualisht i aktivizuar për scraper-in e natës** (§10) |
| **Google Gemini API** (`gemini-2.5-flash`) | Asistenti chat "Konsulenti" | `src/lib/konsulenti/tools.ts`, `api/konsulenti/chat` | Çelës API + faturim |
| **Resend** | Dërgim emaili (verifikim llogarie, njoftime) | `src/lib/email.ts` | Çelës API + verifikim domeni. **Aktualisht MUNGON — emailet nuk dërgohen (§12)** |
| **Stripe** | Pagesa dhe abonime | `src/lib/stripe.ts`, `api/stripe/*` | Llogari Stripe. **Kurrë e përdorur realisht** — 0 klientë, 0 abonime Stripe në DB |
| **Telegram Bot API** | Njoftime operacionale (opsionale) | `src/lib/notify.ts` | Bot token + chat id. Aktualisht i pakonfiguruar; kodi bie në `console.log` |
| **ASK — Agjencia e Statistikave të Kosovës** (PxWeb API) | Tregtia e jashtme e Kosovës në faqen kryesore | `scripts/refresh-kosovo-trade.mjs` | Falas, pa çelës |
| **Eurostat** (dissemination + Comext `DS-045409`) | Popullsi, GDP/banor, importe sektoriale të tregjeve BE | `scripts/refresh-market-stats.mjs`, `refresh-sector-imports.mjs` | Falas, pa çelës |
| **UN Comtrade** | Importe sektoriale për tregjet jashtë BE-së | `scripts/refresh-sector-imports-comtrade.mjs` | Falas (preview publik), pa çelës |
| **IMF DataMapper** | Tregues ekonomikë për 29 tregje jo-evropiane | `scripts/refresh-market-basics-imf.mjs` | Falas, pa çelës |
| **EUR-Lex** | Aktet ligjore të cituara te kërkesat e tregjeve | `scripts/seed-market-requirements.mjs` | Falas, referencë manuale |
| **OpenStreetMap** (tiles) | Sfondi i hartës në Atlasin e tregjeve | `src/components/atlas/AtlasLeafletMap.tsx` | Falas; kujdes ndaj politikës së përdorimit të tile-ve |
| **Faqet e institucioneve kosovare** (KIESA, MINT, MZHR, KOSME, OEK, ME, AUV, ATK) | Burimet e scraper-it | `src/lib/scrapers/*` | Pa llogari; varësi nga qëndrueshmëria e faqeve |

**NUK GJENDET NË PROJEKT — duhet kërkuar nga zhvilluesit/serveri:** llogaritë faktike, faturimi dhe
kufijtë e përdorimit për Anthropic, Google, Resend dhe Stripe; kush i zotëron; sa është shpenzimi mujor aktual.

---

## 7. ENVIRONMENT VARIABLES

**Nuk ekziston `.env.example` në repozitor.** Kjo është mangësi: e vetmja burim i së vërtetës
është file-i `.env` në serverin e prodhimit (i përjashtuar nga Git me `.gitignore`, siç duhet).
Lista më poshtë është rindërtuar nga `.env` i prodhimit **dhe** nga çdo referencë `process.env.*` në kod.

### Të pranishme në `.env` të prodhimit

| Variabla | Përshkrimi | Gjendja aktuale |
|---|---|---|
| `DATABASE_URL` | Vargu i lidhjes me PostgreSQL | i vendosur |
| `NEXTAUTH_URL` | URL-ja bazë e aplikacionit për NextAuth | `https://kosovabusinesses.aiaohub.com` |
| `NEXTAUTH_SECRET` | Sekreti i nënshkrimit të JWT-ve të seancës | i vendosur |
| `NEXT_PUBLIC_APP_URL` | URL-ja publike (përdoret në metadata, sitemap, robots) | `https://kosovabusinesses.aiaohub.com` |
| `NEXT_PUBLIC_ROLE_BASED_SIDEBAR` | Aktivizon menynë anësore sipas rolit | `true` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Çelësi publik i widget-it Turnstile | **çelës testi i Cloudflare** |
| `TURNSTILE_SITE_KEY` | Dublikatë jo-publike e së njëjtës vlerë | **çelës testi i Cloudflare** |
| `TURNSTILE_SECRET_KEY` | Çelësi sekret për `siteverify` | **çelës testi i Cloudflare** |
| `ANTHROPIC_API_KEY` | Çelësi i Anthropic (Haiku) | i vendosur |
| `GEMINI_API_KEY` | Çelësi i Google Gemini | i vendosur |
| `GEMINI_MODEL` | Modeli Gemini që përdoret | `gemini-2.5-flash` |
| `STRIPE_SECRET_KEY` | Çelësi sekret Stripe | i vendosur (i papërdorur) |
| `STRIPE_PUBLISHABLE_KEY` | Çelësi publik Stripe | i vendosur (i papërdorur) |
| `STRIPE_WEBHOOK_SECRET` | Sekreti i verifikimit të webhook-ut Stripe | i vendosur (i papërdorur) |
| `SCRAPER_SECRET` | Sekreti që mbron `POST /api/scraper` | i vendosur |
| `DEV_IMPERSONATION_ENABLED` | Aktivizon rrugën e hyrjes së shpejtë për testim | **`true` në prodhim** |
| `DEV_IMPERSONATION_KEY` | Çelësi që kërkohet nga ajo rrugë | i vendosur |
| `KIESA_ENRICH` / `KIESA_ENRICH_MAX` | Aktivizon pasurimin me Haiku për KIESA + kufiri për run | `true` / kufi |
| `MINT_ENRICH` / `MINT_ENRICH_MAX` | E njëjta për MINT | `true` / kufi |
| `MZHR_ENRICH` / `MZHR_ENRICH_MAX` | E njëjta për MZHR | `true` / kufi |

### Të referuara në kod, POR që MUNGOJNË në `.env` të prodhimit

| Variabla | Përshkrimi | Pasoja e mungesës |
|---|---|---|
| `RESEND_API_KEY` | Çelësi i Resend për dërgim emaili | **Emailet nuk dërgohen.** `src/lib/email.ts` kthen `ok: true` me `provider: 'console'` — dështim i heshtur |
| `EMAIL_FROM` | Adresa dërguese | Bie në `noreply@kosovabusinesses.aiaohub.com` |
| `NOTIFY_EMAIL` | Adresa për njoftime operacionale | Bie në një adresë të hardkoduar në `src/lib/notify.ts:22` |
| `TELEGRAM_BOT_TOKEN` | Token boti për njoftime | Njoftimet Telegram të çaktivizuara |
| `TELEGRAM_CHAT_ID` | Chat-i i njoftimeve | Njoftimet Telegram të çaktivizuara |
| `CRON_SECRET` | Mbron `POST /api/admin/trash/cron-purge` | Pastrimi i koshit s'mund të thirret |
| `SCRAPER_AI_ENRICH` | Aktivizon klasifikimin e afateve me Haiku në `/api/scraper` | I fikur (sjellje e dëshiruar) |
| `SCRAPER_URL`, `SCRAPER_CRON`, `SCRAPER_TZ`, `SCRAPER_RUN_ON_START` | Konfigurimi i daemon-it `scraper.js` | Daemon-i s'përdoret (§10) |
| `NODE_ENV` | Vendoset nga PM2 (`production`) | — |
| `ONLY` | Filtër ad-hoc për rerun-e të pjesshme në `refresh-sector-imports.mjs` | Vetëm për përdorim manual |

---

## 8. SI NGRIHET PROJEKTI LOKALISHT

> **Paralajmërim:** `README.md` në repo është shablloni i pandryshuar i `create-next-app`
> dhe nuk përmban asnjë informacion për këtë projekt. Hapat më poshtë janë rindërtuar nga
> `package.json`, `ecosystem.config.js`, `prisma/` dhe gjendja e serverit.

### Parakushtet

- Node.js **v20.x** (prodhimi: v20.20.2)
- **pnpm 10.x** — projekti përdor `pnpm-lock.yaml`; `npm install` nuk mbështetet
- PostgreSQL **16.x** lokal ose të arritshëm

### Hapat

```bash
# 1. Klono repon dhe kalo në branch-in e prodhimit
git clone <URL-ja e repos> businesshub
cd businesshub
git checkout platform-v5-wave-2-roles-and-profiles

# 2. Instalo varësitë
pnpm install --frozen-lockfile

# 3. Krijo .env (NUK ekziston .env.example — përdor listën e §7)
#    Minimumi për të nisur aplikacionin:
#      DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL
#    Pa çelësat AI/email disa funksione bien në sjellje "no-op", por aplikacioni niset.

# 4. Krijo bazën dhe aplikoji migrimet
createdb businesshub_db
pnpm prisma migrate deploy
pnpm prisma generate

# 5. Mbush të dhënat bazë (opsionale, por pa to shumica e faqeve janë bosh)
node scripts/seed-certifications.mjs        # 90 certifikime
node scripts/seed-market-requirements.mjs   # 215 kërkesa tregu
node scripts/refresh-market-stats.mjs       # popullsi + GDP nga Eurostat
node scripts/refresh-market-basics-imf.mjs  # tregje jo-evropiane nga IMF
node scripts/refresh-sector-imports.mjs     # importe sektoriale (Eurostat Comext)
node scripts/refresh-sector-imports-comtrade.mjs  # importe (UN Comtrade)
node scripts/refresh-kosovo-trade.mjs       # tregtia e jashtme e Kosovës (ASK)
npx tsx src/scripts/seed-test-roles.ts      # llogari testuese për secilin rol

# 6. Nis serverin e zhvillimit
pnpm dev            # http://localhost:3000
```

### Verifikimi që punon

```bash
pnpm test           # duhet: 12 file testesh, 114 teste, të gjitha të kalueshme
npx tsc --noEmit    # duhet: pa dalje (0 gabime)
pnpm build          # duhet: build i suksesshëm
pnpm lint
```

Kontrolle manuale: hap `/` (banda e tregtisë duhet të shfaqë shifra ASK ose të mos shfaqet fare),
`/sectors`, `/register`, kyçu me një llogari testuese, hap `/dashboard/atlasi` (harta duhet të ngarkohet).

**NUK GJENDET NË PROJEKT — duhet kërkuar nga zhvilluesit/serveri:** një dump i databazës për zhvillim.
Pa të, mjedisi lokal fillon bosh dhe skriptat e seed varen nga API të jashtme.

---

## 9. DEPLOYMENT

### Çka ekziston në kod

**`.github/workflows/deploy.yml`** — një workflow që:
- aktivizohet në `push` te branch-i **`main`** ose manualisht (`workflow_dispatch`)
- rrjedh mbi një runner **self-hosted** me etiketat `[self-hosted, businesshub]`
- ekzekuton `sudo -n /usr/local/bin/deploy-businesshub.sh`

**`/usr/local/bin/deploy-businesshub.sh`** (ekziston në server, **jo në repo**):
```
git fetch origin main && git reset --hard origin/main
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm build
pm2 reload ecosystem.config.js --update-env
```

**`ecosystem.config.js`** — PM2: procesi `businesshub`, `next start -p 3000`,
cwd `/var/www/businesshub`, lexon `.env` me dorë dhe ia kalon fëmijës.

### Çka ndodh realisht

Ky rrugëtim **nuk përdoret**:

1. Workflow-i aktivizohet vetëm nga `main`, ndërsa prodhimi rrjedh nga
   **`platform-v5-wave-2-roles-and-profiles`**. Push-et në branch-in e prodhimit nuk e nisin.
2. Sipas gjurmëve, GitHub Actions është i çaktivizuar për këtë llogari.
3. Deploy-i faktik bëhet **manualisht**, me këtë model:
   - ndërto në një worktree të izoluar (`/var/www/bh-*`) me `.env`-in e prodhimit të kopjuar
   - `git merge --ff-only <branch>` në branch-in e prodhimit
   - zëvendëso direktorinë `.next` të parandërtuar
   - `pm2 restart businesshub --update-env`

   Ky model ekziston sepse `next build` brenda direktorisë së gjallë ndryshon `BUILD_ID`
   dhe thyen procesin që po rrjedh (dëshmi në `businesshub-error.log`:
   `Could not find a production build in the '.next' directory`).

4. Ekspozimi publik bëhet nga **Cloudflare Tunnel** (`cloudflared.service`), me një drop-in
   `Restart=always` të shtuar pasi tuneli kishte dalë pa u rinisur dhe faqja ra me Error 1033.

### Mangësi

- **Nuk ka Docker, Dockerfile apo docker-compose.**
- **Nuk ka procedurë deploy-i të dokumentuar në repo.** Skripti i vërtetë i deploy-it jeton
  vetëm në server dhe nuk është nën kontroll versioni.
- **Nuk ka mjedis staging.** Testimi bëhet duke nisur një build në një port të përkohshëm.
- **Nuk ka procedurë rollback të dokumentuar** përveç `.next.prev` që lihet pas çdo deploy-i.
- Workflow-i i CI-së është i pasinkronizuar me realitetin dhe do të mashtrojë një ekipë të re.

---

## 10. AUTOMATIZIMET

### Systemd timers (në CT109)

| Njësia | Orari | Çka bën |
|---|---|---|
| `kbh-scraper.timer` → `kbh-scraper.service` | çdo ditë 03:00 | `/usr/local/bin/kbh-scraper-run.sh` — nis scraper-in për KIESA/MINT/MZHR/KOSME/OEK |
| `kbh-grants-health.timer` → `kbh-grants-health.service` | çdo ditë 04:00 | `/usr/local/bin/kbh-grants-health.sh` — kontroll shëndeti i granteve |
| `auto-push.timer` → `auto-push.service` | çdo 30 min | `/usr/local/bin/auto-push.sh /var/www/businesshub` — commit + push automatik në GitHub |
| `cloudflared-update.timer` | — | Përditësim i binarit të tunelit |

> Skriptat `kbh-scraper-run.sh`, `kbh-grants-health.sh` dhe `auto-push.sh` **nuk gjenden në repozitor** —
> ekzistojnë vetëm në `/usr/local/bin/` të serverit. Duhen marrë dhe vendosur nën kontroll versioni.

### Crontab (root, në CT109)

| Orari | Komanda |
|---|---|
| `0 7 * * *` | `node scripts/notify-cert-renewals.mjs` — kujtues për certifikime që skadojnë (60/30/7 ditë) |
| `0 6 5 * *` | `node scripts/refresh-kosovo-trade.mjs` — rifreskim mujor i tregtisë së jashtme nga ASK |

### Cron brenda aplikacionit

`scraper.js` në rrënjë është një daemon i pavarur me `node-cron` (parazgjedhje `0 3 * * *`,
zona `Europe/Belgrade`) që bën `POST` te `/api/scraper` me header-in `x-scraper-secret`.
Në PM2 ekziston një proces me emrin `scraper`. **Ky duplikon `kbh-scraper.timer`** — duhet
sqaruar cili nga të dy është burimi i vërtetë (§12).

### Shpenzim AI i automatizuar

`KIESA_ENRICH=true`, `MINT_ENRICH=true`, `MZHR_ENRICH=true` janë aktive në prodhim. Kjo do të thotë
që **çdo run i natës i scraper-it bën thirrje të paguara në Anthropic** (Haiku 4.5), të kufizuara
me `*_ENRICH_MAX` (parazgjedhje 5 thirrje për burim për run). Ekipa e re duhet ta dijë këtë kosto.

Përkundrazi, `SCRAPER_AI_ENRICH` mungon nga `.env`, prandaj klasifikuesi i afateve **nuk** thirret.

### Integrime të jashtme

Nuk ka referenca në kod për n8n, Zapier apo bot të jashtëm. Njoftimet Telegram janë të koduara
por të pakonfiguruara.

---

## 11. DOKUMENTACIONI

### Çka ekziston (36 file në `docs/`)

| Grupi | File |
|---|---|
| Konventa dhe sistem | `database-conventions.md`, `design-system.md`, `product-decisions.md`, `known-issues.md` |
| Auditim ingestimi | `data-ingestion-audit.md`, `current-ingestion-migration-map.md` |
| Fazat e të dhënave 1–5 | `data-phase-1-source-governance-report.md`, `data-phase-1-migration-rollout-plan.md`, `data-phase-2-ingestion-core-report.md`, `data-phase-2-migration-rollout-plan.md`, `data-phase-3-askdata-pilot-report.md`, `data-phase-4-statistical-layer-report.md`, `data-phase-4-migration-rollout-plan.md`, `data-phase-5-report.md`, `data-phase-5-askdata-rollout-runbook.md` |
| ASKdata | `askdata-source-onboarding.md`, `askdata-tab08-data-dictionary.md`, `askdata-rollout-readiness-checklist.md` |
| Kontrata dhe propozime | `canonical-ingestion-adapter-contract.md`, `source-governance-proposal.md`, `relevance-engine-proposal.md`, `market-intelligence-methodology-proposal.md`, `statistical-data-dictionary-proposal.md`, `statistical-observation-grain.md`, `data-source-onboarding-template.md` |
| Redizajni | `redesign-phase-3-dashboard-report.md`, `redesign-phase-3-final-verification.md`, `redesign-phase-3-personalization-correction.md` |
| Plane/specifikime | 6 file në `docs/superpowers/plans/` dhe `docs/superpowers/specs/` |

Dokumentacioni ekzistues është i thellë por i njëanshëm: mbulon **shtresën e të dhënave dhe ingestimin**
me detaje të mëdha, sepse ajo pjesë u zhvillua me faza formale. Pjesa tjetër e platformës është pa dokumentim.

### Çka mungon

| Mangësia | Pse ka rëndësi |
|---|---|
| **README real** | Aktualisht shabllon `create-next-app`; nuk thotë asgjë për projektin |
| **`.env.example`** | Nuk ka listë të variablave të nevojshme nën kontroll versioni |
| **Udhëzues ngritjeje lokale** | Askund; §8 i këtij raporti është rindërtim |
| **Procedurë deploy-i e dokumentuar** | Skripti real jeton vetëm në server |
| **Diagram arkitekture** | Nuk ekziston; marrëdhënia app ↔ scraper ↔ tunel ↔ DB s'është vizatuar askund |
| **Dokumentim API** | 58 route pa asnjë përshkrim, pa OpenAPI |
| **Modeli i roleve dhe lejeve** | I shpërndarë mes `middleware.ts`, `role-navigation.ts`, `tier-entitlements.ts`, `guide-access.ts` |
| **Procedurë backup/restore** | Nuk ekziston në repo |
| **Runbook incidentesh** | Nuk ekziston (p.sh. çka bëhet kur bie tuneli) |
| **CHANGELOG** | Nuk ekziston |
| **Licencë** | Nuk ekziston |
| **Dokumentim i asetave të dizajnit** | `docs/design-system.md` ekziston, por s'ka file burimor dizajni (Figma etj.) |

---

## 12. CILËSIA DHE RREZIQET

### Ajo që është e fortë

- **TypeScript strict, pa gabime.** `npx tsc --noEmit` kalon pastër mbi 38 mijë rreshta.
- **114 teste kalojnë** në 1.75 s, të gjitha të pavarura nga databaza (`vitest.pg.config.ts` i ndan
  testet me DB nga suita e zakonshme — zgjedhje e mirë).
- **Zero shënues `TODO`/`FIXME`/`HACK`** në kod.
- **Komentimi është i pazakontë për cilësi.** Shumë module shpjegojnë *pse*, jo *çfarë*
  (p.sh. `active-grants.ts` shpjegon pse ekziston si modul i ndarë; `Source` në skemë ka
  konventën "kurrë mos fshi, çaktivizo").
- **Konvencion i qëndrueshëm i provenancës së të dhënave:** `sourceName`, `sourceUrl`, `retrievedAt`
  në `MarketStat`; `legalActName`/`legalActUrl`/`verifiedAt` në `MarketRequirement`; status `DRAFT`/`VERIFIED`.
- **Fail-closed në siguri aty ku ka rëndësi:** `turnstile.ts` refuzon kur mungon sekreti;
  `middleware.ts` refuzon token pa `id`.

### Rreziqe kritike

| # | Rreziku | Detajet |
|---|---|---|
| **K1** | **Token GitHub i ekspozuar në tekst të hapur** | `git remote -v` tregon një Personal Access Token (`ghp_...`) të futur direkt në URL-në e remote-it, i ruajtur në `.git/config`. Kushdo me qasje në file-sistem, në një backup, ose në një `git remote -v`, e merr atë. **Duhet rrotulluar menjëherë** dhe zëvendësuar me deploy key ose credential helper. |
| **K2** | **Turnstile rrjedh me çelësat e testimit të Cloudflare në prodhim** | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SITE_KEY` dhe `TURNSTILE_SECRET_KEY` janë çelësat publikë të testimit të dokumentuar nga Cloudflare, të cilët **kalojnë gjithmonë**. Praktikisht hyrja dhe regjistrimi janë pa CAPTCHA. Ekziston një branch i gatshëm `hotfix/production-turnstile` (`5742019`) që pret çelësa realë. |
| **K3** | **Rruga e imitimit të përdoruesit është aktive në prodhim** | `DEV_IMPERSONATION_ENABLED=true`. `GET /api/dev/impersonate?key=…&role=…` lëshon një cookie seance **30-ditore**. Mbrojtjet ekzistojnë (çelës sekret, vetëm email `@kbh.test`/`@test.local`, rolet admin të refuzuara) dhe janë të arsyeshme, por kjo mbetet një derë anësore autentikimi e hapur në prodhim. Duhet fikur. |
| **K4** | **Drift i skemës mes repos dhe prodhimit** | Migrimi `20260626135122_add_segment_axes` është aplikuar në bazën e prodhimit por s'gjendet në branch-in e prodhimit (§5). Një rikrijim nga zeroja jep skemë tjetër nga prodhimi. `prisma migrate status` nuk e sinjalizon. |
| **K5** | **Dërgimi i emailit dështon në heshtje** | `RESEND_API_KEY` mungon; `src/lib/email.ts` kthen `ok: true` me `provider: 'console'` dhe vetëm e shtyp URL-në në log. Regjistrimet e reja **nuk marrin email verifikimi**, por sistemi raporton sukses. Ky është dështim i heshtur, jo i dukshëm. |

### Rreziqe të larta

| # | Rreziku | Detajet |
|---|---|---|
| **L1** | **Përmbajtja e granteve është praktikisht e vdekur** | Nga 104 grante jo të fshira: **89 me afat të skaduar, 13 pa afat, vetëm 2 me afat në të ardhmen.** Faqja kryesore publike aktualisht shfaq **"1 mundësi financimi aktive"**. Vlera qendrore e propozuar e produktit nuk po realizohet. |
| **L2** | **Dy nga tetë burimet e monitoruara janë të prishura** | `ATK`: **51 dështime radhazi, asnjë sukses ndonjëherë.** `OEK`: 18 dështime radhazi, sukses i fundit **2026-06-15** (rreth 2 muaj). Megjithatë të dyja janë `isActive=true` dhe numërohen si "monitorohen çdo ditë" në faqen publike. |
| **L3** | **Halucinim i mundshëm i të dhënave nga strategjia `gemini_synthesize`** | `docs/known-issues.md` e dokumenton si problem KRITIK: kjo strategji nuk merr HTML nga burimi, por i kërkon Gemini-t të prodhojë të dhëna nga njohuria e vet — pra mund të shpikë grante që nuk ekzistojnë. Fiksimi ("Phase 12") **nuk është zbatuar**. Duhet verifikuar sa nga 127 grantet aktuale kanë ardhur prej saj. |
| **L4** | **42 kërkesa tregu detyruese pa akt ligjor të cituar** | Nga 215 kërkesa `VERIFIED`: 22 `MANDATORY` dhe 20 `PROCEDURAL` **nuk kanë `legalActUrl`**. (90 `BUYER_EXPECTED` pa link janë me qëllim — ato janë pritshmëri blerësish, jo ligj; 4 `BLOCKED` i kanë të gjitha.) Duke qenë se produkti u premton bizneseve rregulla të citueshme, kjo është boshllëk kredibiliteti. |
| **L5** | **Ora e serverit nuk është e besueshme** | Ora e container-it ishte ~3 ditë prapa gjatë punës së fundit; `timedatectl` raporton `NTP service: inactive`. Kjo ka korruptuar fushat `retrievedAt` — pikërisht fushat që mbajnë premtimin e provenancës. Të dhënat ASK u rikorrigjuan më 2026-08-10; **`retrievedAt` i dataset-eve të tjera (`tps00001`, `DS-045409`, `COMTRADE-HS`, `WEO-*`) mbetet i paverifikuar** dhe mund të jetë i pasaktë. |
| **L6** | **Stripe është kod i pafunksionalizuar** | 4 route, klient dhe webhook ekzistojnë, por **0 abonime kanë `stripeCustomerId` ose `stripeSubscriptionId`**. Nivelet caktohen me dorë. Kodi jep përshtypjen e një sistemi pagesash funksional. |
| **L7** | **Backup-i nuk verifikohet nga brenda projektit** | Nuk ka skript backup-i, procedurë restore, apo test rikthimi në repozitor. |

### Rreziqe të mesme / borxh teknik

| # | Çështja | Detajet |
|---|---|---|
| **M1** | **Higjienë e degëve: 30 branch-e, 20 worktree aktive** | Të gjitha të hapura njëkohësisht në `/var/www/bh-*`, secila me `node_modules` të vetin. Konsumon disk dhe e bën gjendjen e vërtetë të vështirë për t'u parë. |
| **M2** | **20% e commit-eve janë zhurmë automatike** | 42 commits `auto: snapshot ... (736 files)` e bëjnë `git log` dhe `git blame` shumë më pak të dobishëm. |
| **M3** | **Mbulim testesh i cekët në gjerësi** | 114 teste mbulojnë vetëm module të pastra logjike (navigim, audience, dispatch, normalizim tekstesh, entitlements). **Zero teste për 58 route API, zero për komponentë React, zero për shtresën Prisma në suitën e parazgjedhur.** |
| **M4** | **File shumë të mëdhenj** | `dashboard/arbk/page.tsx` 951 rreshta, `CompanyProfileEditor.tsx` 754, `export-certifications.ts` 651, `dashboard/tatime/page.tsx` 623, `register/page.tsx` 538. Përmbajtje dhe prezantim të përziera. |
| **M5** | **Përmbajtje e hardkoduar në komponentë** | Udhëzuesit ARBK/ATK/Dogana/AUV, certifikimet e eksportit dhe marrëveshjet tatimore jetojnë në `.tsx`/`.ts`, jo në DB. Çdo ndryshim përmbajtjeje kërkon deploy. `docs/` pranon se hapat e procedurave **nuk janë verifikuar** kundrejt burimeve zyrtare. |
| **M6** | **Dyfishim i logjikës së scraper-ave** | Ekzistojnë njëkohësisht scraper-a specifikë (`kiesa.ts`, `mint.ts`, …) **dhe** një kornizë kanonike (`framework/`). Korniza është ndërtuar përmes 5 fazash por **nuk është vënë në punë në prodhim**; të dyja bashkëjetojnë. |
| **M7** | **Dy sisteme cron paralele për scraper-in** | `kbh-scraper.timer` (systemd, 03:00) dhe `scraper.js` (node-cron në PM2, parazgjedhje 03:00). Nuk është e qartë cili është autoritar; rrezik për run të dyfishtë. |
| **M8** | **Rate limiter në memorie** | `turnstile.ts` e pranon vetë: funksionon vetëm me një proces PM2. Skalimi horizontal e prish. |
| **M9** | **`i18n` me përkthime inline** | 235 rreshta në `src/lib/i18n.ts` plus objekte `{sq,en,de}` të shpërndara nëpër komponentë (p.sh. e gjithë faqja kryesore). Nuk ka file përkthimesh të ndara; përkthyes i jashtëm s'mund të punojë pa prekur kod. |
| **M10** | **Mbetje build-i në disk që rrjedhin në Git** | Procedura e deploy-it lë pas `.next.prev/` (349 MB) dhe ekziston edhe `.next.bak/`. `.gitignore` mbulonte `.next/` dhe `.next.bak/`, por **jo** `.next.prev/`, prandaj timer-i `auto-push` e futi në commit dhe GitHub e refuzoi push-in (file 228 MB > limiti 100 MB). U rregullua më 2026-08-10: commit-i u hoq dhe u shtua rregulli `.next.*/`. Kjo është hera e dytë që ndodh e njëjta gjë (më parë me `.next.bak/`, file 115 MB) — shkaku rrënjësor është që deploy-i krijon direktori artefaktesh pranë kodit ndërsa një timer commit-on gjithçka pa mbikëqyrje. |
| **M11** | **`MarketProfile` (37) ≠ udhëzues (66)** | Dyzet e nëntë tregje kanë udhëzues por s'kanë profil tregu. Nuk është e qartë nëse kjo është me qëllim. |
| **M12** | **Skriptat operacionale jashtë kontrollit të versionit** | `deploy-businesshub.sh`, `kbh-scraper-run.sh`, `kbh-grants-health.sh`, `auto-push.sh` ekzistojnë vetëm në `/usr/local/bin/` të serverit. Nëse container-i humbet, humbin edhe ato. |
| **M13** | **`tsconfig.json` përjashton `scripts/`** | 21 skripta operacionale që shkruajnë në bazën e prodhimit **nuk kontrollohen nga TypeScript**. |

---

## 13. ÇKA DUHET KËRKUAR JASHTË KËTIJ PROJEKTI

### Infrastrukturë dhe qasje

1. **Qasje në host-in Proxmox** (`192.168.178.56`) dhe në container-in **LXC 109** — kredenciale root, qasje konsole.
2. **Qasje rrjeti** — hosti është në një tailnet privat; duhet klienti VPN dhe autorizimi përkatës.
3. **Llogaria Cloudflare** — zona DNS `aiaohub.com`, konfigurimi i Tunnel-it dhe kredencialet e tij.
4. **Qasje në repozitorin GitHub** `albanosmanaj6214/business-hub-kosova` si anëtar, jo me token të ndarë.
5. **Kredencialet e PostgreSQL** dhe, nëse ekziston, qasja në ndonjë replikë.

### Të dhëna

6. **Dump i plotë i databazës së prodhimit** + një dump i anonimizuar për zhvillim.
   NUK GJENDET NË PROJEKT — duhet kërkuar nga zhvilluesit/serveri.
7. **Historiku i backup-eve** dhe passphrase-i i tyre nëse janë të enkriptuara.
   NUK GJENDET NË PROJEKT — duhet kërkuar nga zhvilluesit/serveri.
8. **Verifikim i një rikthimi (restore) të provuar** — a është testuar ndonjëherë?

### Llogari shërbimesh

9. **Anthropic** — pronësia e llogarisë, çelësi, faturimi, shpenzimi mujor aktual.
10. **Google AI / Gemini** — e njëjta.
11. **Resend** — llogaria, verifikimi i domenit, çelësi (mungon nga prodhimi).
12. **Stripe** — llogaria, nëse është live apo test, produktet/çmimet e konfiguruara.
13. **Cloudflare Turnstile** — çelësat realë të prodhimit (site + secret) për sitin.

### Kod dhe konfigurim që s'janë në repo

14. **`.env` i prodhimit** (ose lista e plotë e vlerave për t'u rikrijuar).
15. **`/usr/local/bin/deploy-businesshub.sh`**
16. **`/usr/local/bin/kbh-scraper-run.sh`**
17. **`/usr/local/bin/kbh-grants-health.sh`**
18. **`/usr/local/bin/auto-push.sh`**
19. **Njësitë systemd** `cloudflared.service` (+ drop-in), `kbh-scraper.*`, `kbh-grants-health.*`, `auto-push.*`
20. **Migrimi `20260626135122_add_segment_axes`** — duhet marrë nga `feature/segments-phase0a` dhe futur në branch-in e prodhimit.

### Dizajn dhe produkt

21. **File burimore të dizajnit** (Figma ose ekuivalent). NUK GJENDET NË PROJEKT — duhet kërkuar nga zhvilluesit.
22. **Logot origjinale** në format vektorial të plotë (repo ka vetëm 5 SVG).
23. **Roadmap-i i produktit** dhe prioritetet aktuale.
24. **Kush janë 11 përdoruesit realë** dhe çfarë presin nga platforma.
25. **Statusi ligjor:** politika e privatësisë, kushtet e përdorimit, pajtueshmëria me GDPR —
    faqet `/privacy` dhe `/terms` **nuk ekzistojnë** në aplikacion.
26. **Marrëveshje me institucionet** (KIESA, MINT, etj.) për scraping — a ka leje, apo është vetëm teknikisht i mundur?

---

## 14. REKOMANDIME — 10 HAPAT E PARË

**1. Rrotullo menjëherë token-in e GitHub-ut dhe hiqe nga `.git/config`.** (Rreziku K1)
Zëvendësoje me SSH deploy key ose me një credential helper. Kontrollo edhe të gjitha 20 worktree-t
dhe backup-et për të njëjtin token.

**2. Vendos çelësat realë të Turnstile-it dhe fik imitimin e përdoruesit.** (K2, K3)
Branch-i `hotfix/production-turnstile` (`5742019`) është i gatshëm. Vendos `DEV_IMPERSONATION_ENABLED=false`.
Të dyja janë ndryshime konfigurimi, jo kodi.

**3. Rregullo dërgimin e emailit dhe hiq dështimin e heshtur.** (K5)
Vendos `RESEND_API_KEY` dhe verifiko domenin. Pastaj ndrysho `src/lib/email.ts` që të **mos** kthejë
`ok: true` kur transporti mungon — një sistem regjistrimi që raporton sukses pa dërguar asgjë është më keq se një gabim.

**4. Zgjidh driftin e skemës para se të prekësh gjë tjetër.** (K4)
Merr `20260626135122_add_segment_axes` nga `feature/segments-phase0a`, futeje në branch-in e prodhimit,
pastaj **provo një rikrijim të plotë nga zeroja** në një bazë boshe dhe krahaso skemën me prodhimin
(`prisma migrate diff`). Pa këtë, asnjë mjedis i ri nuk është i besueshëm.

**5. Merr një dump të prodhimit dhe provo një restore të plotë.** (L7)
Kjo është njëkohësisht plani i vazhdimësisë dhe mënyra e vetme për të pasur një mjedis zhvillimi real.
Dokumentoje procedurën në repo.

**6. Shkruaj `.env.example`, një `README` real dhe një `DEPLOY.md`.**
Fut nën kontroll versioni katër skriptat nga `/usr/local/bin/` (§13.15–18). Ky është
informacioni që humbet i pari kur largohet zhvilluesi origjinal.

**7. Adreso problemin e freskisë së përmbajtjes.** (L1, L2, L3)
Kjo është çështja më e madhe e *produktit*, jo e kodit. Konkretisht:
  - rregullo ose çaktivizo burimet `ATK` dhe `OEK` — mos i numëro si "të monitoruara" derisa të punojnë;
  - përcakto sa nga 127 grantet kanë ardhur nga `gemini_synthesize` dhe hiqi ose riverifikoji;
  - vendos një alarm kur numri i granteve aktive bie nën një prag.
Aktualisht faqja publike premton mundësi financimi dhe shfaq **1**.

**8. Sinkronizo orën dhe riverifiko të gjitha fushat `retrievedAt`.** (L5)
Sigurohu që container-i të mbajë orë të saktë. Pastaj rifresko ose riverifiko dataset-et
`tps00001`, `DS-045409`, `COMTRADE-HS`, `WEO-*` — datat e tyre të marrjes janë të pabesueshme,
dhe pikërisht ato mbajnë premtimin e kredibilitetit ndaj përdoruesve.

**9. Pastro degët dhe worktree-t.** (M1, M2)
20 worktree janë të hapura. Vendos cilat faza të të dhënave do të bëhen merge, cilat do të arkivohen
si tag dhe hiqi pjesën tjetër. Ndalo ose ripaketo `auto-push.timer` që të mos ndotë historikun.

**10. Shto teste ku janë vërtet të nevojshme, pastaj vendos një CI që rrjedh vërtet.**
Prioritet: route-t API të autentikimit dhe autorizimit, `active-grants.ts` dhe skriptat që shkruajnë
në bazë. Hiq `scripts/` nga `exclude` te `tsconfig.json` që të kontrollohen nga TypeScript.
Rregullo workflow-in e GitHub Actions që të përputhet me branch-in e vërtetë të prodhimit — ose fshije,
sepse tani mashtron.

---

## SHTOJCË — Gjendja aktuale e prodhimit (2026-08-10)

| Treguesi | Vlera |
|---|---|
| URL | https://kosovabusinesses.aiaohub.com (HTTP 200) |
| Procesi | PM2 `businesshub`, Next.js 14.2.35, porti 3000 |
| Procesi ndihmës | PM2 `scraper` |
| Disku i container-it | 26 GB të përdorura nga 49 GB (56%) |
| Përdorues realë | ~11 (nga 28 total; 17 janë testues) |
| Grante aktive të shfaqura publikisht | **1** |
| Panaire të ardhshme | 44 |
| Udhëzues të publikuar | 64 |
| Kërkesa tregu të verifikuara | 215 |
| Certifikime në katalog | 90 |
| Burime aktive | 8 (2 prej tyre të prishura) |
| Tregtia e jashtme e Kosovës | ASK, viti 2025, marrë 2026-08-10 |

---

*Raport i përgatitur për dorëzim. Të gjitha shifrat janë verifikuar drejtpërdrejt kundrejt kodit
dhe databazës së prodhimit në datën e raportit. Aty ku diçka s'u gjet, është shënuar shprehimisht.*
