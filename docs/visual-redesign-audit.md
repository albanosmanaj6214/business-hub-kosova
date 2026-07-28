# Kosova Business Hub: Visual Redesign Audit (Phase 0)

Date: 2026-07-28. Scope: read-only audit of the real repository on CT109. No application file was modified. This document is the deliverable of Phase 0 and the input for the phased redesign. Evidence gathered by four parallel code audits; file:line references are from the current tree on branch `platform-v5-wave-2-roles-and-profiles`.

Non-negotiable constraints carried through every phase: primary UI language stays Albanian; keep the existing brand identity (navy `#1B4F72` / cobalt `#2E86C1`, Inter + Source Serif); no invented data, statistics, buyers, grants, HS codes, or sources; official-source labels and verification dates stay visible; no backend, schema, route-URL, auth, or authorization changes for purely visual reasons; test data hidden from normal users.

---

## 1. Route inventory

71 `page.tsx` total.

**Public / marketing:** `/`, `/about`, `/pricing`, `/sectors`, `/sectors/[slug]`, `/brand`, `/verify-email`, `(auth)/login`, `(auth)/register`.

**Dashboard (`src/app/dashboard/`):** `page` (main), `profili-kompanise`, `eksporti` (+`/transporti`), `guides` (+`/[id]`), `checklist`, `terma` (+`/[category]`, `/hs-code`, `/incoterms`), `certifikime`, `panaire-evente` (+`/materiale`), `fairs`, `burime-financimi` (+`/banka`, `/subvencione`), `grants`, `matchmaking`, `kerko-oferte` (+`/[id]`), `directory` (+`/[id]`), `lajme`, `notifications`, `konsultime`/consultations, `arbk`, `tatime`, `dogana`, `auv`, `energji`, `investime`, `hap-biznes-kosove`, `bookings`, `settings`, `subscription`.

**Admin:** 28 pages under `src/app/admin/*`.

All key dashboard pages are Server Components that delegate interactivity to child Client Components (`RfqCreateForm`, `DirectoryFilters`, `CompanyProfileEditor`, `PaginatedGrid`). This is healthy and must be preserved: the redesign keeps Server Components as the default and only adds Client Components where interaction requires them.

---

## 2. Component inventory

**Shared UI primitives (`src/components/ui/`), only 4 exist:**
- `button.tsx` (cva, 6 variants, 5 sizes) but hard-codes hex.
- `card.tsx` (Card/Header/Content/Footer).
- `badge.tsx` (5 variants), no dedicated StatusBadge.
- `input.tsx` (label + error), no Select / Textarea / Checkbox / form wrapper.

**Missing primitives (built inline, repeated across the app):** Alert, EmptyState, Skeleton, ErrorState, Tabs, Modal/Dialog, Select, Textarea, Checkbox, StatusBadge, VerificationBadge, DataFreshness, OfficialSourceLabel, PageHeader, SectionHeader.

**Application shell:** `src/components/dashboard/DashboardShell.tsx` (single 164-line file: sidebar + near-empty header + main). Nav config: `src/lib/role-navigation.ts`.

---

## 3. Visual problems

- **Tokens exist but are ignored.** `tailwind.config.ts` defines `brand.navy/cobalt/success/warn/danger`, yet ~104 of 123 files (about 85%) hard-code the same hex through `bg-[#1B4F72]` etc. Even the primitives do it: `ui/button.tsx:12`, `ui/badge.tsx:10`, `ui/input.tsx` focus ring. Off-palette shades appear too (`#154360`, `#2874A6`, `#229954`, `#CB4335`).
- **No semantic CSS layer.** `src/app/globals.css` defines only `--background` / `--foreground`. No tokens for surfaces, raised surfaces, borders, muted text, focus ring, radius, shadow, content-width, z-index. `dark:` is used in zero files.
- **No typography scale.** About 1,400 ad-hoc `text-*` utilities (`text-sm` x741, `text-xs` x432, up to `text-6xl`). Page titles range `text-xl` to `text-4xl` with no rule. Source Serif is loaded but used in only 3 files.
- **No layout width system.** `<main>` in the shell has no `max-width` / `mx-auto`. Each page invents its own width: `directory` full-width, `guides/[id]` mixes `max-w-2xl/3xl/4xl` within one file, others span `2xl` to `6xl`.
- **Card sprawl.** `rounded-(lg|xl) border` appears in 43 files / 121 spots despite `Card` existing and being imported in 55 files. Plus 3 hand-rolled `fixed inset-0` modals and 16 hand-rolled gradients.

## 4. UX problems

- **Header is nearly empty.** Only a mobile hamburger + a 2-level breadcrumb (`DashboardShell.tsx:139-154`). No global search, notifications bell, user menu (it lives in the sidebar footer), or quick-create. The breadcrumb prints the literal string `'Page'` for any route not present in the nav config (detail and sub-pages).
- **Dashboard is a 754-line role mega-page** with 4 near-duplicate variants (exporter/startup/diaspora/individual, returns at lines 289/416/536/638). The landing experience is a wall of same-looking cards under a plain "Mirë se erdhe" greeting: no single focal point, no "what to do today".
- **Dead-end empty states.** `matchmaking/page.tsx:44` shows the jargon message "roli yt aktual s'ka profil biznesi" inside a card with no CTA. (The separate no-matches state at L76-88 is good and should be the template.)
- **Generic CTA vocabulary.** "Hape" appears on 9 pages as the sole action label (`eksporti:40`, `panaire-evente:42`, `notifications:104`, ...); "Shiko" x14; slash-labels that fuse two actions ("Apliko / Detajet" `grants:438`, "Detaje & regjistrim" `fairs:367`). Actions do not say what will happen.
- **Thin hub pages in whitespace.** `eksporti` is 3 cards (one "coming soon") on a wide empty canvas; `panaire-evente` is 6 router cards; `energji` (ineligible) and `guides` (no-access tier) collapse to a single centered card in a large empty column.
- **Long documents without navigation.** `arbk` (906 lines), `tatime`, `dogana`, and `guides/[id]` (486 lines) are long single-column reference pages with no sticky table of contents. Pure scroll.
- **Competing actions.** `directory` cards carry two equal CTAs ("Shiko profilin" + "Kërko kontakt") across up to 100 cards; no primary action.
- **Layout bug to fix in the redesign:** `guides/page.tsx:105-110` has a mis-indented "Checklist eksporti sipas tregut" link floating between the upsell banner and the grid.

## 5. Responsive problems

- Only about 50% of components (62 of 124) use `sm:/md:/lg:` prefixes. Key pages are thin: dashboard 7, `guides/[id]` 3, `directory` 1 (just the card grid).
- 16 fixed pixel widths. Data tables in `terma/incoterms` and `auv` use `min-w-[180px]` / `min-w-[200px]` that force horizontal overflow on mobile.
- Single breakpoint (`lg`, 1024px) drives the whole shell. No tablet-specific handling, no sticky bottom action bar on mobile.
- `next/image` is used zero times; 12 raw `<img>` (company logos included) load unoptimized with no responsive `srcset`.

## 6. Accessibility problems

- `focus-visible` appears once in the entire codebase; keyboard focus relies on generic `focus:` utilities (65 uses).
- The "Verified" badge in the directory is an icon plus a `title` tooltip with no visible text label. Color/icon is close to the only signal in a couple of spots.
- `aria-*` moderate (23), `role=` 7, `sr-only` 15. Heading hierarchy is defined ad hoc per file (the dashboard's four H1 are conditional role branches, low real risk, but there is no enforced pattern).
- No route-level `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere.

## 7. Copy and content problems

- **News encoding is broken and shown raw.** Scrapers decode only `&amp;` and `&nbsp;` (`src/lib/scrapers/*.ts`), so `&euml;`, `&#160;`, etc. pass through. In the DB, 13/37 `NewsItem` titles/summaries (35%) and 23/37 bodies (62%) contain HTML entities; `lajme/page.tsx:73` prints `{n.summary}` verbatim. Also present: a mojibake replacement char and a title beginning with a zero-width space. This is the single most visible quality defect.
- **Minor English leaks in Albanian UI:** "Directory i bizneseve", "Featured", "Verified", "Start Up".
- Two `NewsItem` rows where the summary repeats the title (low prevalence).

## 8. Data-integrity / test-data exposure

- **6 clearly-named test companies are live in the member directory:** `Test Investor Zurich`, `Test Distributor Wien`, `Test Multi-Role Diaspora Group`, `Ferma Test`, `Test Software Studio`, `Test Tregti SHPK`. `directory/page.tsx` filters only `profileStatus='APPROVED'` + visibility, with no test filter. Grants, fairs, news, and guides have no test-y rows. Exposure is confined to the directory.

## 9. Duplicated UI

- `SectionHeader` defined twice as divergent private copies: `guides/[id]/page.tsx:70` and `sectors/[slug]/page.tsx:265`.
- Copy-pasted page-header pattern (icon tile + `<h1>`) across pages with clashing sizes.
- 43 files hand-roll cards; 3 hand-roll modals; 16 hand-roll gradients; 40 bespoke empty-state strings; ad-hoc `Loader2` spinners.

## 10. Reusable components already present (keep and extend)

Button, Card, Badge, Input (refactor to tokens); the role-nav config model; the sticky region nav on `guides` (good pattern to generalize into a table of contents); the no-matches empty state on `matchmaking` (good template); Server Component + Client child boundary.

## 11. Components that should be replaced or introduced

Introduce and standardize: PageHeader, SectionHeader, MetricCard, OpportunityCard, TaskCard, MarketCard, CompanyCard, GrantCard, FairCard, CertificationCard, GuideCard, SourceCard, StatusBadge, VerificationBadge, MatchScore, ProgressCard, ChecklistItem, Timeline, EmptyState, Alert, DataFreshness, OfficialSourceLabel, FilterBar, SearchBar, SegmentedTabs, StickyContextPanel / PageTableOfContents, SkeletonCard, ErrorState, FormSection, FormHelpText, SourceCitationList. Refactor `ui/button`, `ui/badge`, `ui/input` to consume tokens.

---

## 12. Proposed design architecture

Direction: this is a systematize-and-operationalize redesign, not a new visual identity. We keep navy/cobalt and Inter/Source Serif (a prior editorial redesign was rejected). We add structure, hierarchy, and semantic color, and we make the existing brand consistent.

**Token layer (Phase 1).** Promote the brand hex into CSS variables plus Tailwind semantic tokens: `--surface`, `--surface-raised`, `--border`, `--text`, `--text-muted`, `--primary` (navy), `--link` (cobalt), `--success` (green, for verification/progress), `--warning` (amber/gold, for opportunities/deadlines/emphasis), `--danger` (red, for blocking issues/critical deadlines), `--info` (light blue), plus `--focus`, a radius scale, a shadow scale, content-width tokens, and z-index layers. Neutral greys carry a slight navy bias so they read as chosen. Dark mode is prepared at the token level but is not required for Phase 1 (deferred, explicitly, to avoid scope creep).

**Typography (Phase 1).** A fixed scale: page title 28-32, section title 20-22, card title 16-18, body 14-16, metadata 12-13, with controlled weights and one H1 per page. Inter for UI and body; Source Serif reserved for long-form guide titles to add character while staying on brand.

**Component library (Phase 1).** Build the missing primitives and status components listed in section 11, and refactor the four existing primitives to tokens. Add reusable empty / loading / error states plus route-level `loading.tsx` / `error.tsx`.

**Layout system (Phase 2).** A content-width container on `<main>` and per-page-type layouts (Dashboard, Listing, Detail, Guide, Form, Workflow, Admin), so listing and detail pages stop disagreeing.

## 13. Proposed sidebar

Regroup under the objective-based structure below. Route URLs do not change; only grouping and labels do. The nav model gains nested groups and badge slots (both absent today). Items that have no real destination yet are omitted, not shown as dead links.

- **KRYESORE:** Përmbledhja (`/dashboard`). "Mundësitë e mia" and "Detyrat e mia" are saved-opportunity and task views that do not exist yet; they arrive with Phase 3, not Phase 2.
- **RRITJA E BIZNESIT:** Gjej financim (`burime-financimi`), Kompani Kosovare (`directory`, the base for find-buyer / find-supplier via role filters), Kërko ofertë (`kerko-oferte`), Matchmaking.
- **EKSPORTI:** Eksporti (`eksporti`), Tregjet (`guides`), HS Code (`terma/hs-code`, already exists), Certifikimet, Panairet (`panaire-evente`), Transporti (`eksporti/transporti`, promote from sub-route).
- **BIZNESI IM:** Profili i kompanisë, Produktet (a profile tab), Abonimi, Cilësimet.
- **NJOHURI DHE MBËSHTETJE:** Udhëzuesit (nested parent with ARBK, ATK, Dogana, AUV children), Lajme, Njoftime, Konsultime.

Also: turn on the role-based sidebar deliberately (`NEXT_PUBLIC_ROLE_BASED_SIDEBAR`), and add a profile-completion indicator and an unread-notification badge to the shell.

## 14. Proposed header

A functional header replacing the near-empty one: global search UI (placeholder "Kërko grante, tregje, kompani, panaire ose HS Code..."), breadcrumb (fixed so it no longer prints 'Page'), quick-create limited to supported actions (Kërkesë për ofertë, Produkt, Kërkesë kontakti, Konsultim), notifications bell with unread count (data already exists via `Notification.isRead`), help, and a user menu moved out of the sidebar footer. Search wiring to a results page over existing entities is a separately scoped step; the header ships the UI first without faking a backend.

## 15. Proposed dashboard

One dashboard with role-aware sections, replacing the four near-duplicate variants. Structure: a personal hero ("Mirë se erdhe, {Emri}" plus "Ja çka kërkon vëmendjen tënde sot."), then "Prioritetet e mia" (task cards from real signals only: complete profile, add products, respond to an RFQ, a grant deadline approaching, prepare for a fair, a pending contact request), then "Mundësi për biznesin tënd" (grants, fairs, matches, RFQs, critical news, each with why-shown, deadline, source, and a specific CTA), then "Market Pulse" (only real data, with recency and status shown). No invented metrics: profile completion exists and is used; export-readiness does not exist and will not be simulated.

---

## 16. Proposed implementation order

- **Phase 0 (this document).** Audit. No code change. Awaiting approval.
- **Phase 1: Foundations.** Tokens, typography, refactor of the 4 primitives, new primitives, empty/loading/error states, `docs/design-system.md`. Recommended to fold in two safe, high-value fixes here: decode HTML entities in news rendering, and hide the 6 test companies from the directory.
- **Phase 2: Application shell.** Sidebar (nesting, badges, profile-completion, role flag on), header (search UI, notifications, user menu, quick-create, breadcrumb fix), layout width system and per-type layouts.
- **Phase 3: Dashboard.** Consolidate to one role-aware dashboard with tasks and opportunities.
- **Phase 4: Company profile and products.** Tabbed/stepped layout, completion guidance, public/private explanations, product cards prepared for future fields (no schema change).
- **Phase 5: Export hub.** `eksporti` hub, market list (search/filters/regions), single market page (sticky ToC, section summaries, source labels).
- **Phase 6: Matchmaking and RFQ.** Matchmaking, directory, RFQ, company cards, contact requests, empty states, test-data filter.
- **Phase 7: Content modules.** Grants, fairs, certifications, ARBK/ATK/Dogana/AUV (task-based with accordions and sticky ToC), energy, news (encoding fix), notifications, consultations.
- **Phase 8: Public landing page.**
- **Phase 9: QA.** Responsive, accessibility, encoding, test-data visibility, roles, performance, production build.

Each phase runs on its own branch (`redesign/phase-N-*`), stops with a report, and waits for the exact word `VAZHDO` before the next.

## 17. Files expected to be affected

- **Phase 1 (new):** `tailwind.config.ts` (extend tokens), `src/app/globals.css` (semantic vars), `docs/design-system.md`, and new files under `src/components/ui/` (alert, empty-state, skeleton, error-state, tabs, dialog, select, textarea, checkbox, status-badge, verification-badge, data-freshness, official-source-label, page-header, section-header, metric-card, opportunity-card, task-card, match-score, checklist-item, filter-bar). **Modified:** `src/components/ui/{button,badge,input}.tsx`.
- **Phase 1 optional fixes:** `src/lib/scrapers/*` decode helper (or a shared `decodeEntities` util) plus `dashboard/lajme` render; `dashboard/directory/page.tsx` test filter.
- **Phase 2:** `src/components/dashboard/DashboardShell.tsx`, `src/lib/role-navigation.ts`, `src/app/dashboard/layout.tsx`, new header/sidebar subcomponents.
- **Phase 3+:** the corresponding `src/app/dashboard/*/page.tsx` files, one module per phase.

## 18. Risks

- **Tokenization touches 100+ files.** Do it additively: introduce tokens, migrate primitives and shared components first, then pages incrementally. No global find-and-replace of hex, which would risk silent regressions.
- **Role-based sidebar flag.** Turning `NEXT_PUBLIC_ROLE_BASED_SIDEBAR` on changes navigation for every role at once. Test each role (KOSOVO_BUSINESS, STARTUP, DIASPORA, INDIVIDUAL, ADMIN) before shipping Phase 2.
- **No route-URL changes.** Regrouping the sidebar must keep every `href`. Nesting is a visual layer over existing routes.
- **Server/Client boundaries.** Keep pages as Server Components; add interactivity only in child Client Components, so caching and bundle size do not regress.
- **News decoding is a display fix, not a content change.** Decoding entities restores the intended text and does not alter facts; still, verify a sample before and after.
- **Test-data hiding must not hide real companies.** Filter by the known test accounts or a marker, not by a naive name match on "test", which could catch a legitimate business name.
- **Long-guide restructuring must not drop factual content or source/verification labels.** Improve hierarchy and add a ToC only.

## 19. Testing plan

After each phase: `pnpm typecheck`, `pnpm lint`, `pnpm build`. No visual-regression infrastructure exists, so visual checks are manual and documented per phase. Test matrix per phase: logged-out, normal user, business user, admin; incomplete vs complete profile; no-data and partial-data states; error state; mobile at 390 and 360, tablet 768, desktop 1024/1280/1440. A phase is not reported complete without typecheck, lint, and build results plus screenshots of the changed states.

---

## 20. Immediate recommendation

Approve Phase 1 (Foundations) next, and let me fold in the two low-risk, high-visibility fixes with it: the news encoding decode and hiding the 6 test companies from the directory. Everything else stays gated: I will not begin any phase without the word `VAZHDO`.
