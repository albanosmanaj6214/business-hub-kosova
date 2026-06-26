# KBH Faza 4: KBH Diaspora (slice i parë: modul informativ i personalizuar) Design

> Pjesë e "Action Platform" (spec mëmë: `2026-06-26-kbh-segments-and-action-platform-design.md`, §10 Faza 4). Ndërtohet mbi themelin e segmenteve (Faza 0, live) dhe ripërdor bazën e Start Up (Faza 1, live). Arkitektura: **A1 — motor statik i kuruar** (vetëm përmbajtje zyrtare, pa DB, pa API, pa AI, pa të dhëna sintetike).

## 1. Pse

Diaspora kosovare (investitorë, blerës, partnerë) kërkon udhëzim konkret "si të bëj biznes ose të investoj në Kosovë": si të hapë një degë/biznes, statusi i tatimit të dyfishtë me shtetin ku jeton, zonat ekonomike, bazat e investimit. KBH Diaspora jep një modul informativ falas, të personalizuar sipas shtetit të diasporës (që kapet tashmë në profil), të bazuar vetëm në burime zyrtare. Ky slice ripërdor bazën e Start Up (forma `dega` + roadmap) dhe shton shtresat diaspora-only.

## 2. Vendime të mbyllura (locked)

- **Arkitektura A1**: përmbajtja statike, e versionuar, nën `src/lib/diaspora/`, e renderuar nga server components. Pa DB/migrime, pa API me pagesë, pa AI gjenerues. (Kjo mbivendos sugjerimin e mother-spec §5 për modele Prisma `DoubleTaxTreaty`/`IndustrialZone`/`SectorInvestment`: për përmbajtje reference me churn të ulët, statike është më e thjeshtë dhe pa rrezik DB-je boshe.)
- **Vetëm burime zyrtare, pa sintetik.** Lista e marrëveshjeve të tatimit të dyfishtë dhe zonave ekonomike vjen nga **skedari/lista zyrtare që e jep përdoruesi** (Ministria e Financave/ATK për treaty-t; KIESA/MINT për zonat). Derisa lista zyrtare të jetë në vend, seksionet përkatëse tregojnë gjendje "po përgatitet" (pa të dhëna placeholder sintetike). Referencë [[feedback_kbh_official_data_only]], [[feedback_seed_after_placeholder_swap]].
- **Slice i parë = modul informativ i personalizuar.** Profili i pasur i diasporës (sektorë interesi, çka kërkon nga Kosova, katalog — §7 i mother-spec) varet nga modeli `CompanyProfile` (Faza 2) dhe SHTYHET. Premium (analizë e thellë tatimore, treaty DB e plotë, due diligence, konsultim investimi, matchmaking) SHTYHET (§8).
- **Personalizim sipas shtetit:** faqja lexon `User.diasporaCountry` (kapur në Fazën 0). Motori i audiencës ka tashmë `targetCountries` (Faza 0) për përmbajtje të filtruar sipas shtetit.
- **Ripërdor Start Up:** forma `dega` (degë e shoqërisë së huaj) + `roadmapFor('dega')` nga `src/lib/startup/*`. Pa duplikim.
- **Modul në dashboard, falas për të gjithë të kyçurit**, i spikatur për segmentin DIASPORA.
- **Pa em-dash** ([[feedback_no_em_dash]]); zëri brand i qetë ([[feedback_kbh_brand_voice]]); disclaimer "informacion udhëzues, jo këshillë ligjore/tatimore" në çdo faqe.

## 3. Të dhënat (`src/lib/diaspora/`)

### `treaties.ts`
```ts
export interface DoubleTaxTreaty {
  country: string        // ISO2 uppercase (DE, CH, ...)
  countrySq: string      // emri i shtetit në shqip
  hasTreaty: boolean     // a ka marrëveshje në fuqi
  status: 'in_force' | 'signed' | 'negotiating' | 'none'
  signed?: string        // viti/data nëse dihet
  inForce?: string       // viti/data e hyrjes në fuqi
  url: string            // lidhje zyrtare (Ministria e Financave/ATK)
  note?: { sq: string }
}
export const DOUBLE_TAX_TREATIES: DoubleTaxTreaty[]   // fillimisht [], mbushet nga lista zyrtare
export function treatyForCountry(iso2: string): DoubleTaxTreaty | undefined
```

### `zones.ts`
```ts
export interface EconomicZone {
  id: string
  name: string
  municipality: string   // komuna
  type: 'industrial' | 'economic' | 'technology' | 'business'
  url?: string           // lidhje zyrtare (KIESA/MINT)
  note?: { sq: string }
}
export const ECONOMIC_ZONES: EconomicZone[]   // fillimisht [], mbushet nga lista zyrtare
export function zonesByMunicipality(): { municipality: string; zones: EconomicZone[] }[]
```

Header në çdo skedar: `// Burim zyrtar: <URL/skedari nga përdoruesi>, verifikuar më <data>. Jo këshillë ligjore/tatimore. Pa të dhëna sintetike.`

## 4. UI — `/dashboard/diaspora`

Server component (auth nga middleware), sidebar nav "KBH Diaspora" (ikona p.sh. `Globe`/`Plane`), e dukshme për të kyçurit, e spikatur për segmentin DIASPORA.

Personalizim: lexon `diasporaCountry` të përdoruesit (nga sesioni/DB). Seksionet:
1. **Përshëndetje** me shtetin e diasporanit (ose ftesë për ta caktuar te Cilësimet nëse mungon).
2. **Si të bësh biznes ose degë në Kosovë** — ripërdor `roadmapFor('dega')` + `legalFormBySlug('dega')` nga Start Up, me lidhje te `/dashboard/startup`. (Përmbajtje reale tani.)
3. **Tatimi i dyfishtë për <shteti yt>** — `treatyForCountry(diasporaCountry)`: tregon statusin + lidhjen zyrtare. Empty-state "po përgatitet nga lista zyrtare" derisa dataseti të mbushet.
4. **Zonat ekonomike** — `ECONOMIC_ZONES` grupuar sipas komunës. Empty-state derisa të mbushet.
5. **Bazat e investimit / FDI** — hapat baze (banka, ATK, repatrijim fitimi informativ) + lidhje zyrtare. Përmbajtje e shkurtër e kuruar.
6. **Disclaimer** kudo.

## 5. Free vs Premium

- **Falas (ky slice):** moduli informativ, tatimi i dyfishtë informativ, zonat, bazat e investimit, ngritja e biznesit/degës.
- **Premium (shtyrë):** analizë e thellë tatimore, treaty DB e plotë e kërkueshme, due diligence, konsultim investimi, matchmaking, qasje te kompanitë e verifikuara. Config te `TIER_ENTITLEMENTS`, gating më vonë.

## 6. Dekompozimi në nën-faza

- **4a — Të dhëna + motor:** `treaties.ts` (+ `treatyForCountry`) + `zones.ts` (+ `zonesByMunicipality`) me dataset fillimisht bosh (mbushet nga lista zyrtare) + vitest për funksionet (sjellje, jo përmbajtje). Additive, pa rrezik.
- **4b — UI:** `/dashboard/diaspora` personalizuar sipas shtetit + ripërdorim i `roadmapFor('dega')` + sidebar nav + empty-states. tsc+build+smoke + deploy i qëllimshëm.
- **Popullim:** kur përdoruesi jep listën zyrtare, mbushen `DOUBLE_TAX_TREATIES` + `ECONOMIC_ZONES` (commit i veçantë), pa kode/të dhëna të sajuara.

## 7. Testimi

- Funksionet e pastra (`treatyForCountry`, `zonesByMunicipality`) → vitest (sjellje me dataset bosh + me një hyrje shembull provë në test, jo në prod).
- UI → `npx tsc --noEmit` + `pnpm build` + smoke. Pa ndryshime DB. Additive; zero ndikim te veçoritë ekzistuese.

## 8. Rreziqe dhe zbutje

- **Saktësi tatimore/ligjore** (gabimi dëmton investitorin): vetëm burime zyrtare nga përdoruesi, disclaimer kudo, pa gjenerim AI. Empty-state derisa të vijë lista zyrtare (pa placeholder sintetik).
- **Varësia e të dhënave:** moduli ka vlerë menjëherë (pjesa "si të bësh biznes/degë" + bazat e investimit), kurse treaty/zonat presin skedarin zyrtar.

## 9. Jashtë qëllimit (ky slice)

- Profili i pasur i diasporës (sektorë interesi, katalog) — varet nga `CompanyProfile` (Faza 2).
- Premium: analizë tatimore e thellë, treaty DB e kërkueshme, due diligence, konsultim, matchmaking.
- Modele Prisma për treaty/zona (qasja statike i zëvendëson tani).
- Matchmaking diasporë ↔ biznese kosovare (Faza 5).
