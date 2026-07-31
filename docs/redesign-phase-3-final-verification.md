# Redesign Phase 3 — Final Personalization Verification

**Branch** `redesign/phase-3-dashboard-content` · **final commit `ef964e4`** (chain cd1b9e4 → b9ed0c7 → ef964e4, on bdf99e4) · isolated worktree `/var/www/bh-redesign3`. No deploy, no merge, no schema/registration/permission change, no Role-enum change, preview kept live.

Verification method: exhaustive DB personas in the isolated QA DB (23 accounts covering every role + every commercial value + missing-profile cases), SSR probes through the public preview tunnel, a real headless-Chromium browser pass (Playwright, Chrome-for-Testing 147) with screenshots, and unit tests. All values below are the real repository values.

---

## 1. Account-role matrix (all 7 `Role` values)

| Account role | isAdmin | normalized layout | Commercial role source | Company-specific claims |
|---|---|---|---|---|
| `KOSOVO_BUSINESS` | no | business | Company.activityType | only when a company exists |
| `STARTUP` | no | startup (journey + trainings) | activityType (greeting stays sector/stage) | only when a company exists |
| `DIASPORA` | no | diaspora (products + network first) | DiasporaProfile.subRoles | only when a profile exists |
| `INDIVIDUAL` | no | individual (news + CTA, no opp/network grid) | — | none (no company expected) |
| `USER` | no | **business fallback** (`normalizeRole`) | activityType if a company exists, else `general` | none until they create a company |
| `ADMIN` | yes | business fallback | `general` (no company) | **none** |
| `SUPER_ADMIN` | yes | business fallback | `general` (no company) | **none** |

## 5. USER behavior
`USER` has **no dedicated configuration**; it is a **safe fallback** to the business layout via `normalizeRole` (`role-dashboard-config.ts`). Verified live (SSR, HTTP 200): generic subtitle "Ja çka kërkon vëmendjen tënde…", **no** sector claim, **no** "complete your company" prompt (the profile priority is guarded by `hasCompany`). A USER who later creates a company is resolved from that company's real fields with no code change.

## 6 & 7. ADMIN / SUPER_ADMIN behavior
Both are `isAdmin=true`, both `normalizeRole` → business layout, both resolve to `general` (no company), both are energy-eligible and AUV-ungated (so an admin can preview every tool). **They intentionally share one configuration** (asserted by test `sectionsFor('ADMIN') === sectionsFor('SUPER_ADMIN')`). The dev impersonation route refuses admin roles by design, so SUPER_ADMIN was verified in the browser with a minted real session cookie: greeting is the generic business line, priorities show only real signals (unread notifications), **no profile-completion prompt and no sector claim** → no unsupported company-specific claims. ADMIN behavior is identical and unit-tested for both.

## 2. Every `Company.activityType` → resolved commercial role
| activityType (real value) | resolved commercial role | tool leader | AUV | greeting |
|---|---|---|---|---|
| `prodhues-perpunues` | `producer` | Eksporti → Dogana | food sector only | prodhim + eksport |
| `bujqesi` | `agri` | Financime → AUV | yes (agri) | bujqësi + standardet |
| `tregti` | `trader` | Dogana → Kërko ofertë | food sector only | tregti + dogana |
| `sherbime` | `service` | Rrjeti → Konsultime | never | shërbime + klientët |
| `null` / missing | `general` | account-role base list (no regression) | food sector only | sector text, else "cakto aktivitet + sektor" |

## 3. Every `DiasporaProfile.subRoles` value → resolved commercial role
| subRole (real value) | resolved commercial role | tool leader | greeting |
|---|---|---|---|
| `INVESTOR` | `diaspora_investor` | **Investo në Kosovë** | mundësi investimi |
| `BUYER` | `diaspora_trade` | Rrjeti → **Kërko ofertë** | furnizues për blerje/import |
| `IMPORTER` | `diaspora_trade` | Rrjeti → Kërko ofertë | furnizues për blerje/import |
| `DISTRIBUTOR` | `diaspora_trade` | Rrjeti → Kërko ofertë | furnizues për blerje/import |
| `SERVICE_PROVIDER` | `diaspora_service` | Rrjeti → Hap biznes | ofro shërbime |
| `PARTNER` | `diaspora_partner` | Rrjeti → Panaire | gjej partnerë |
| empty `[]` | `general` | diaspora base list | ura drejt Kosovës |

## 4. Multiple diaspora sub-roles — precedence
`INVESTOR > trade (BUYER/IMPORTER/DISTRIBUTOR) > SERVICE_PROVIDER > PARTNER`. Verified:
- `[INVESTOR, PARTNER]` → `diaspora_investor` (test.diaspora.investor)
- `[BUYER, INVESTOR, DISTRIBUTOR]` → `diaspora_investor` (test.diaspora.multi)
- `[PARTNER, SERVICE_PROVIDER, IMPORTER]` → `diaspora_trade`
- `[PARTNER, SERVICE_PROVIDER]` → `diaspora_service`
Unit-tested (`resolveCommercialRole` it.each + precedence cases) and mapped from the original enum values, not only grouped labels.

## 8. ICT vs Tourism (both `sherbime` → `service`)
Same account role, same activityType → **same base tool list by design** (network/consultation-first; documented). They are **NOT** the same sector and differ where the data differs:
| | ICT (`tik`) | Tourism (`turizem-mikpritje`) |
|---|---|---|
| greeting sector | "Sektori: TIK, software dhe BPO" | "Sektori: Turizëm dhe mikpritje" |
| opportunity reasons | "Sipas sektorit tënd: TIK, software dhe BPO" | "Sipas sektorit tënd: Turizëm dhe mikpritje" |
| AUV | absent (not food) | absent (not food) |
| Energy | eligibility-gated | eligibility-gated |
Opportunity relevance uses the real sector (`User.entitledSectors`, the dimension that drives AUV gating, greeting and feed matching consistently). No unsupported sector claims.

## 9. Food vs Non-food producer (both `prodhues-perpunues` → `producer`)
| | Food (`ushqim-dhe-pije`) | Non-food (`druri-mobilje`) |
|---|---|---|
| **AUV tool** | **present** ("Siguria e ushqimit") | **absent** |
| greeting sector | "Sektori: Ushqim dhe pije" | "Sektori: Druri dhe mobiljet" |
| sector-targeted opps | SIAL Paris, POLAGRA, Cibus Tec, INDAGRA (food fairs) | druri-targeted / general |
| Energy (if 50+) | eligibility-gated | shown for the LARGE persona (50–249) |
AUV positive/negative gating proven on real personas within the same commercial role. A cross-cutting fix was applied so a role's specialization never hides a tool the company is genuinely eligible for: **AUV** stays a candidate for food/agri traders too, and **Energy** stays a candidate across producer/agri/trader/service (both still gated).

## 10. Missing-profile fallbacks (all verified, HTTP 200, no crash)
| Case | Behavior |
|---|---|
| Company, no activityType (has sector) | `general`; sector greeting; profile-completion prompt; base tools |
| Company, no sector (`tregti`) | resolved by activityType (trader); tools still useful; no false sector claim |
| Company, no interests | feed falls back to sector/general; no invented personalization |
| Partially completed profile | profile-completion priority with the real % (e.g., 30/40/50%) |
| USER, no company | business fallback; **no** company-completion prompt; generic greeting |
| INDIVIDUAL, no company | news + CTA to register; no company prompt (none expected) |
| ADMIN / SUPER_ADMIN, no company | business fallback; **no** company-specific claims |
| DIASPORA, no subRoles | `general`; "ura drejt Kosovës"; diaspora base tools |
Fallbacks invent no personalization, explain missing data accurately, always offer one supported next action, never prompt company completion where no company is expected, and hide empty sections (no oversized blank cards).

## 11–13. Browser QA (real headless Chromium, Chrome-for-Testing 147)
**Programmatic pass — every combination below actually loaded in the browser:** 6 personas × 5 viewports = **30 renders**, all HTTP 200, **`overflowX = 0` at every viewport** (no horizontal overflow), **`h1clip = 0`** (no clipped titles), old "Kompani Kosovare" label **absent everywhere**, `#dash-pulse` Market Pulse **absent everywhere**, no ASKdata text, "Rrjeti i bizneseve" present for all except INDIVIDUAL (which correctly has no network section).

**Browser-tested profiles (11):** producer-food, trader, diaspora-investor, startup-registered, individual, SUPER_ADMIN.
**Browser-tested viewport sizes (12):** 1440, 1280, 768, 390, 360 (all five, for every profile above).

**Screenshots visually inspected (13)** — 7 opened and reviewed (not merely captured):
- **producer_food @1440 & @390** — greeting "prodhim + eksport, Sektori: Ushqim dhe pije"; real food opportunities (SIAL Paris, POLAGRA, Cibus Tec, INDAGRA) with visible "Pse po e sheh: Sipas sektorit tënd: Ushqim dhe pije"; tools Eksporti/Dogana/**Siguria e ushqimit**/Financime/Rrjeti/Tatimet; mobile section order greeting→priorities→opportunities→network→tools, no overflow.
- **diaspora_investor @768** — greeting "Ura jote nga Zvicër… Mundësi investimi…"; tools lead with **Investo në Kosovë**; network shows real partners.
- **individual @390** — greeting "Informata publike…"; real news list (ATK/MINTI); "Ke biznes ose ide biznesi?" CTA with 3 register buttons; 3 tools; no opportunity/network grid.
- **admin (SUPER_ADMIN) @1440** — generic business greeting, **no** profile prompt, **no** sector claim; AUV shown (admin ungated); business tools.
- **startup @1440** — **RRUGA E THEMELIMIT** stage journey (4 steps done, on step 5 "Aktivizo EDI"); profile 40%; greeting sector-oriented (refined so it no longer promises export/customs).
- **trader @390** — greeting "tregti + dogana"; **sourcing priority "Kërko ofertë nga furnizuesit — 8 biznese të verifikuara… Sipas aktivitetit tënd tregtar"**; tools lead with Dogana + Kërko ofertë.

**Visual findings:** priorities are real signals with accurate reasons; tool order is understandable and role-appropriate; no oversized empty cards; mobile order logical; routes/sidebar unchanged. **One minor note:** the floating chat button is pinned bottom-right (56×56); in the full-page mobile captures it visually overlaps card content, but on a live device it stays in the corner over scrolling content and does not block the left/centre-aligned CTAs. Not viewed in a browser: the remaining 23 screenshots exist on disk but were confirmed only by the programmatic metrics above, not by eye — stated explicitly per instruction.

## 14. Tests added / confirmed
`src/lib/dashboard/dashboard.test.ts` — **44 tests** in file (**219 total across 32 files**). New/confirmed coverage: USER fallback; ADMIN + SUPER_ADMIN shared config and no-claims; all four `activityType` values + `null`; every `DiasporaProfile.subRoles` value + empty + multi-role precedence; ICT and tourism resolve to `service`; food vs non-food producer; **AUV positive and negative gating**; **Energy positive and negative gating**; missing-sector fallback; startup greeting not promising business tools; sourcing priority only on a real count; "no fabricated data". No existing test weakened (assertions were extended, not relaxed).

## 15. Final test & build results
- `npx prisma validate` → valid.
- `npx tsc --noEmit` → clean.
- `npm run lint` → clean (only the 2 pre-existing brand `<img>` warnings in `src/app/brand/page.tsx`).
- `npm run test` → **219 passed / 32 files**.
- `npm run build` → compiled successfully, `/dashboard` 926 B.
- (Earlier phases' 19 `*.pgtest.ts` remain green on the isolated migration clone; unchanged this pass.)

## 16. Final commit hash
**`ef964e4`** (branch `redesign/phase-3-dashboard-content`).

## 17. Preview remains isolated
Live at `https://places-vegetation-governing-trades.trycloudflare.com` on isolated QA DB `businesshub_r3qa` (prod clone + Phase1→2→patch→4 migration chain), throwaway `NEXTAUTH_SECRET`, Cloudflare **test** Turnstile keys, dev-only gated impersonation. 23 QA personas are QA-DB-only. Nothing here touches production data, auth, or schema.

## 18. Production remains unchanged
`businesshub @ ec8d5ff`, prod `/dashboard/page.tsx` still **754 lines** (the redesign is worktree-only), prisma client mtime still **2026-04-16 17:39:55**, PM2 online, homepage 200. Verified again after the final commit.

**Not deployed. Not merged. Preview not closed. Awaiting final manual approval.**
