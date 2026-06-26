# KBH: Segmentet, Taksonomia, Directory dhe Matchmaking (Action Platform)

**Data:** 2026-06-26
**Status:** Design / brainstorming i miratuar (struktura), spec program-level
**Autor:** Albanos + Claude
**Kufiri:** Ky është spec **arkitekture programi** (5-6 nën-projekte). Çdo nën-projekt merr specin e vet të detajuar para se të ndërtohet. Ky dokument fikson boshtet, modelin e të dhënave, ndërlidhjen dhe sekuencën.

---

## 1. Pse

KBH sot është platformë informimi + personalizimi për bizneset eksportuese kosovare. Motori i personalizimit (Faza A→E, qershor 2026) tashmë jep: `activityType` + `entitledSectors` + `femaleOwnership`, Qendrën e Dispeçimit (admin-në-lak), modelin e audiencës (`isGeneral` + `targetActivityTypes` + `targetSectors` + `forFemaleOwned`) dhe `TIER_ENTITLEMENTS`.

Zgjerimi e kthen KBH-në nga **platformë informimi** në **platformë veprimi + lidhjeje**, pa rishkrim. ~70% e punës është modele të dhënash + UI shtesë mbi motorin ekzistues.

Formula: `Informim + Udhëzim + Personalizim + Profil Biznesi + Matchmaking + Oferta`.

## 2. Vendime të mbyllura (locked)

- **Tre segmente biznesi**, të zgjedhura në regjistrim te shiriti "Lloji i biznesit":
  `STANDARD` (biznes ekzistues kosovar) / `STARTUP` (biznes i ri në Kosovë) / `DIASPORA` (biznes ose individ i diasporës).
- **Pa OJQ.** Asnjë formë ligjore, dokument, sektor apo segment OJQ. Hiqet kudo nga plani origjinal.
- **Haiku vetëm.** Asnjë Sonnet/Opus. Përmbajtja ligjore/procedurale vjen nga burime zyrtare; Haiku ndihmon vetëm me draftim/formatim; njeriu verifikon para publikimit. Asnjë batch API pa klikim eksplicit + vlerësim kostoje paraprak.
- **Pa të dhëna sintetike.** Directory + profilet duhet të jenë biznese reale. Cold-start zgjidhet me onboarding real, jo me rreshta fiktivë.
- **Admin-në-lak për gjithçka.** Asgjë nuk shkon te bizneset pa caktuar admini audiencën.
- **Scoping i detyrueshëm.** Pa "shiko të gjitha". Një biznes sheh vetëm profilin e vet (anti-abuzim, mbron SaaS-in).
- **Pa em-dash** në asnjë copy (sq/en/de).
- **Diaspora është modul i ndarë nga Start Up**, më i gjerë: përveç regjistrimit, përmban zonat industriale, lehtësirat për biznese të huaja, politikat për IHD, tatimin e dyfishtë (sipas shtetit), potencialin investiv, rregulloret e ligjet.

## 3. Taksonomia e ndërlidhur (boshti i personalizimit)

Katër nivele që kaskadojnë nga një deklarim i vetëm:

```
Aktiviteti        prodhues-perpunues | sherbime | bujqesi | tregti   (4, ekziston)
   └─ Sektori     18 slug-e (ushqim-dhe-pije, druri-mobilje, tik, ...) (ekziston)
        └─ Produkt/Shërbim   NIVEL I RI: karrige, lëngje, web-development, ... 
             └─ NACE kod      referencë opsionale, lidh me sektorin
```

**Rregullat e coupling-ut** (filluar tashmë në kod: commit `b799f85`):
- `prodhues-perpunues` → ka sektor prodhimi
- `sherbime` → sektor shërbimi
- `tregti` → pa sektor specifik; merr vetëm përmbajtje të përgjithshme (paga minimale, lajme, SuperPuna)
- `bujqesi` → sektor `bujqesi-blegtori`

**Modeli i ri `ProductCategory`** (nyje kanonike e taksonomisë, e mbjellur nga ne, reale):
- `slug`, `nameSq/En/De`, `sectorSlug` (lidhje me sektorin), `kind` ('product'|'service'), `naceHints[]`, `variants[]` (për fuzzy match), `isActive`.

**Pse ka rëndësi:** kur një blerës kërkon "karrige", sistemi e di që karrigia → sektori `druri-mobilje` → aktiviteti `prodhues-perpunues`. Pra një kërkesë e vetme kaskadon nëpër tërë zinxhirin për personalizim, directory dhe matchmaking. Kjo është "ndërlidhja" që kërkon platforma.

## 4. Boshtet e personalizimit (zgjerim i `audience.ts`)

Zgjerim i pastër, additiv, i motorit ekzistues. `audience.ts` mbetet funksion pa DB, plotësisht i testueshëm.

`AudienceProfile` shton:
- `businessSegment: string | null`
- `diasporaCountry: string | null`

`AudienceCriteria` shton:
- `targetSegments: string[]` (bosh = pa kufizim segmenti)
- `targetCountries: string[]` (bosh = pa kufizim; përdoret për përmbajtje të filtruar sipas shtetit të diasporës, p.sh. tatimi i dyfishtë)

`matchesAudience` shton `segmentOk` + `countryOk` në zinxhirin AND (`isGeneral` mbetet short-circuit). Rregulli "fushë bosh = pa kufizim" ruhet (= konventa `isGeneral`).

Test: çdo bosht i ri merr raste vitest para se të dalë në UI.

## 5. Shtesat në modelin e të dhënave (Prisma, të gjitha additive/nullable)

**User** (shtesa):
- `businessSegment String?` (STANDARD/STARTUP/DIASPORA)
- `diasporaCountry String?` (ISO2, vetëm DIASPORA)
- `diasporaRole String?` (investor/buyer/distributor/importer/partner/service)
- `startupStage String?` (idea/registered/early/growth, vetëm STARTUP)
- `lookingFor String[] @default([])` (buyer/distributor/investor/partner/supplier)

**Grant / TradeFair / NewsItem** (shtesa):
- `targetSegments String[] @default([])` (bosh = të gjithë segmentet)

**Modele të reja** (secili i etiketuar me fazën që e ndërton):
- `ProductCategory` — taksonomia (Faza 2)
- `CompanyProfile` — 1:1 me User, fushat e pasura të profilit: logo, cover, përshkrime, flag-e komerciale, vizibiliteti, statusi (pending/approved/verified/featured) (Faza 2). User mbetet i lehtë.
- `CompanyProduct` — produktet/shërbimet e një kompanie, referojnë `ProductCategory` + emër custom, kapacitet, MOQ, certifikime, shtetet e eksportit, foto (Faza 2)
- `IndustrialZone` — zonat industriale/ekonomike (Faza 4)
- `DoubleTaxTreaty` — marrëveshjet, të çelësuara sipas shtetit (Faza 4)
- `SectorInvestment` — potenciali investiv per sektor (Faza 4)
- `StartupGuide` / përmbajtje CMS për roadmap-in (Faza 1) — ose si seed strukturuar
- `OfferRequest` + `OfferResponse` — RFQ (Faza 6)
- `Match` — rezultate matchmaking, të ruajtura ose të llogaritura (Faza 5)

Backfill: rreshtat ekzistues të User marrin `businessSegment='STANDARD'` (default i sigurt). Grantet/panairet/lajmet ekzistuese `targetSegments=[]` (= të gjithë, pa regresion).

## 6. Organizimi i Admin Panel

Menyja e adminit:

```
ADMIN
├── Paneli
├── Bizneset                  ← E RE, e ndarë në 3 tabe
│   ├── KBH Standard    (n)
│   ├── KBH Start Up    (n)
│   └── KBH Diaspora    (n)
├── Qendra e Dispeçimit       ← shton boshtet "Segmenti" + "Shteti"
├── Grantet / Panairet / Lajmet
├── Directory / Profilet      ← radhë aprovimi (Faza 2-3)
├── Kërkesat për Oferta       ← oversight RFQ (Faza 6)
├── Qasja e bizneseve
└── Burimet (scraper)
```

Brenda secilës tab të "Bizneset":
1. **Lista e bizneseve të segmentit me interesat:**
   - Standard: sektori, aktiviteti, produktet, tier, çka kërkon
   - Start Up: faza, sektori i synuar, NACE, interesat
   - Diaspora: shteti, roli, sektorët e interesit, çka kërkon nga Kosova
2. **Butoni "Dërgo lajm/njoftim te ky segment":** hap kompozuesin e Dispeçimit të para-filtruar te segmenti; mund të ngushtohet me sektor/shtet; tregon live "do t'u shkojë te N biznese".

**Të ndara në pamje, të bashkuara në motor:** tri tabet janë vetëm pamje mbi të njëjtin motor dispeçimi. `businessSegment` + `diasporaCountry` shtohen si boshte targetimi. Pa kod të trefishuar.

## 7. Profilet

- **Profili i kompanisë kosovare** (Standard/Start Up): emër, logo, cover, përshkrime, aktiviteti, sektori, produkte/shërbime (me `ProductCategory`), NACE, lokacion, kontakt, flag-e komerciale (prodhues, eksporton, kërkon buyer/distributor/investor, MOQ, private label, certifikime, katalog). Vizibilitet: privat / members-only / publik. Status: pending → approved → verified → featured.
- **Profili i diasporës:** emër kompanie, shteti, roli (investor/buyer/distributor/partner), sektorët e interesit, produktet e interesit, çka kërkon nga Kosova, kontakt, katalog. I orientuar drejt "gjithçka rreth të bërit biznes në Kosovë".

## 8. Free vs Premium (mbi `TIER_ENTITLEMENTS` ekzistues)

- **Start Up:** falas roadmap-i, format ligjore (pa OJQ), NACE finder, checklists, dokumentet baze. Premium: template profesionale, business-plan builder, review dokumentesh, konsultim, grante të personalizuara të avancuara.
- **Diaspora:** falas info baze (regjistrim, bankë, ATK, tatime baze, tatim i dyfishtë informativ, zona informative). Premium: analizë e thellë tatimore, treaty database e plotë, due diligence, konsultim investimi, matchmaking, qasje në kompani të verifikuara.
- **Company Profile:** falas baze (emër, përshkrim, pak produkte, kontakt). Premium: më shumë produkte/foto, katalog, featured, verified badge, prioritet në RFQ, statistika, qasje në Request an Offer.

## 9. ARBK: çfarë merret dhe çfarë jo (realitet)

- **Kodet NACE** = dataset publik. Mblidhet legjitimisht, mbahet si tabelë e brendshme. ✅
- **Formularët/modelet** (statut, akt themelues, autorizim) = verifikohet çfarë publikon ARBK për shkarkim; ato që janë publike strukturohen si template.
- **Verifikimi i një biznesi në regjistër** (due diligence) = bllokohet nga Cloudflare Turnstile. Nuk automatizohet. Bëhet deep-link te ARBK (njësoj si a1-workflow).

## 10. Sekuenca (dekompozim në nën-projekte)

Çdo fazë: spec → plan → build → verifikim, para se të kalohet te tjetra.

- **Faza 0 — Themeli i segmenteve** (shared): boshti `businessSegment` + `diasporaCountry`, zgjerim `audience.ts` + teste, shiriti "Lloji i biznesit" në regjistrim, 3 tabet "Bizneset" + boshtet e reja te Dispeçimi. Additiv, pa rrezik për live.
- **Faza 1 — KBH Start Up:** roadmap dinamik sipas formës ligjore, NACE finder, checklists, dokumente/template (pa OJQ). Falas. Baza e përbashkët që e ripërdor Diaspora.
- **Faza 2 — Taksonomia Produkt/Shërbim + Profili i Kompanisë:** `ProductCategory` (seed real), `CompanyProfile`, `CompanyProduct`, zgjedhje produktesh në onboarding, upload logo/foto/katalog, radhë aprovimi te admini.
- **Faza 3 — Business Directory:** faqe kompanish kosovare, filtra sipas sektorit/produktit/verified/export-ready, profile publike ose members-only.
- **Faza 4 — KBH Diaspora:** moduli (regjistrim + shtresat diaspora-only: zonat industriale, IHD, tatimi i dyfishtë i filtruar sipas shtetit, potenciali investiv, ligjet) + profili i diasporës.
- **Faza 5 — Matchmaking:** STANDARD/STARTUP ↔ DIASPORA, mbi sektor + produkt + shtet + rol + looking-for.
- **Faza 6 — Request an Offer (RFQ):** krijim kërkese, matching me kompani relevante, notification, dërgim ofertash, dashboard buyer/supplier, oversight admin.

## 11. Detaji i Fazës 0 (themeli, ndërtohet i pari)

1. **Migrim Prisma** additiv: shtesat te User (segment, diasporaCountry, diasporaRole, startupStage, lookingFor) + `targetSegments` te Grant/TradeFair/NewsItem. Të gjitha nullable/default. Backfill `businessSegment='STANDARD'` për rreshtat ekzistues.
2. **`audience.ts`** zgjerohet me `businessSegment` + `diasporaCountry` (profil) dhe `targetSegments` + `targetCountries` (kriter); `matchesAudience` shton segmentOk + countryOk. Vitest për çdo bosht. `audience-server.ts` (currentBusinessProfile/countAudience/audienceUserIds) përditësohet.
3. **Regjistrimi:** shiriti "Lloji i biznesit" (3 opsione) si hap i parë; degëzon pyetjet pasuese (Diaspora → shteti + roli; Start Up → faza; Standard → si tani).
4. **Admin:** seksioni "Bizneset" me 3 tabe (listë + interesat + "Dërgo te segmenti"); Qendra e Dispeçimit shton selektorët Segment + Shtet te `AudienceEditor`.
5. **Verifikim:** zero regresion (çdo biznes ekzistues vazhdon të shohë gjithçka që shihte), tests jeshil, build jeshil, live i paprekur derisa të bëhet reload i qëllimshëm.

## 12. Rreziqe dhe zbutje

- **Cold-start i marketplace** (Directory/Matchmaking/RFQ duken bosh): prandaj vijnë të fundit; mbushen me onboarding real, jo seed sintetik.
- **Saktësia ligjore** (gabimi dëmton biznesin që paguan): përmbajtja nga burime zyrtare, Haiku vetëm draft, njeriu verifikon.
- **Live nga working-tree** (fragjil): migrime additive, pa switch të degës që prek working-tree-në që shërben live; reload vetëm i qëllimshëm pas verifikimit.
- **Kosto API:** asnjë batch Haiku pa klikim + vlerësim paraprak.

## 13. Jashtë qëllimit (YAGNI tani)

- OJQ (hequr me vendim).
- Verifikim i automatizuar ARBK (i bllokuar; deep-link).
- Pagesa/escrow brenda RFQ (vetëm lidhje, jo transaksion).
- Matching me AI në Fazën 5 (fillimisht rule-based mbi taksonominë; AI më vonë nëse duhet).
