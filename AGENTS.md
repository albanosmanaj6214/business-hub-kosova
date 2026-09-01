# AGENTS.md - rregullat e punes per agjentet (Codex, Claude, etj.)

Ky repo eshte Kosova Business Hub (KBH). Aplikacioni live ndodhet ne kontejnerin CT109
te Proxmox, ne `/var/www/businesshub`, i menaxhuar nga PM2 (procesi `businesshub`).

## Ku lejohet te punosh

- **PO:** ne kete klon ne hub, `/root/repos/kosovabusineshub`. Vetem kod, teste, dokumente.
- **JO:** mos u lidh me CT109, mos e prek `/var/www/businesshub`, mos ekzekuto `pm2`,
  mos bej deploy. Deploy e ben njeriu ose Claude, pas rishikimit.

## Dege dhe commit

- Mos puno ne degen `platform-v5-wave-2-roles-and-profiles`. Ajo dege sinkronizohet
  automatikisht nga serveri i prodhimit cdo 30 minuta dhe do te te shkaktoje konflikte.
- Hap gjithmone dege te re: `codex/<pershkrim-i-shkurter>`.
- Commit-et duhet te jene te vetedijshem. Mos perdor `git add -A` verbal mbi tere pemen.
- Mos shto ne git: `.env*`, `.next*`, `node_modules`, dump-e te bazes, log-e.

## Te dhenat

- **Mos shkruaj kurre ne bazen e prodhimit** pa kerkese te qarte per ate veprim konkret.
  Kjo perfshin INSERT, UPDATE, DELETE dhe migrimet.
- Ndryshimet e skemes shkojne si migrim Prisma ne repo, jo si `db push` ne prodhim.
- **Zero te dhena sintetike.** Grantet, panairet, kompanite, distributoret dhe udhezuesit
  duhet te vijne nga burime reale te verifikuara. Mos shpik rreshta "shembull" ose "seed".
- Cdo shifer publike duhet te kete burim zyrtar (ASK, BQK, ATK, Dogana, AUV, Eurostat,
  KIESA, ARBK) me link dhe date. Kur nuk ka te dhena, shkruaj "ne verifikim", jo placeholder.
- **Verifiko URL-ne para se ta shkruash.** Nese nuk mund ta verifikosh, lere `null` dhe
  shenoje ne `sourceNote`.

## Gjuha dhe kopja publike

- Platforma eshte shqip si gjuhe kryesore, me en/de.
- **Mos perdor em-dash (—) askund.** Perdor pike, dy pika ose presje.
- Zeri i markes: i qete, konkret, pa mburrje. Pa gjuhe shitjeje SaaS, pa superlativa.
- Mos permend kurre ne faqet publike: AI, emra modelesh ose furnitoresh, procese te
  brendshme administrimi. Ato jane kontekst ndertimi, jo tekst faqeje.

## API me pagese

- Mos thirr asnje API me pagese ne menyre automatike. Asnje batch, asnje cron.
- Nese nevojitet Anthropic, vetem Haiku dhe vetem pas nje veprimi te qarte te adminit.

## Komandat

```
pnpm install
pnpm build          # ndertim; kurre brenda dosjes se prodhimit
pnpm test           # vitest run
pnpm lint
```

Testet me bazen e te dhenave: `vitest.pg.config.ts` (kerkon Postgres lokal, jo prodhimin).

## Dokumentet

Konventat dhe vendimet e marra ndodhen ne `docs/`. Lexo `docs/database-conventions.md`,
`docs/design-system.md` dhe `docs/known-issues.md` para se te ndryshosh strukture.

## Kur ke dyshim

Ndalo dhe pyet. Mos merr vendime per te dhenat, per burimet ose per prodhimin ne vend
te njeriut.
