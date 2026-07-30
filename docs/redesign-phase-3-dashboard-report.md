# Redesign Phase 3 — Dashboard Content Report

Branch `redesign/phase-3-dashboard-content`, based on approved `6fb73c9`. Isolated
worktree. Redesigns ONLY the `/dashboard` page content. The shell, sidebar, header,
breadcrumbs, navigation IA, routes, auth, schema and ingestion are untouched.

## Audit (before)
`src/app/dashboard/page.tsx` was one 754-line file with FOUR near-duplicate role
dashboards (KosovoBusiness / Startup / Diaspora / Individual). Duplication:
greeting + NotifBanner + ProfileCard + grants/fairs cards + MatchesTeaser + a
QuickAction grid repeated per role. The label "Kompani Kosovare" appeared 5×.
No `TRADE_PULSE` on the dashboard (it lives on the public homepage, untouched).
Real, reusable signals: company + profile completion, unread notifications, grants
(`feedFor` audience-filtered), fairs/events, `matchesForCompany`, approved-company
count, news, `currentBusinessProfile` (sectors/activity/femaleOwnership),
`isEnergyEligible`. Signals NOT available (must not be invented): application
status, compliance obligations, performance metrics, verified market statistics.

## After — one modular, role-aware Dashboard
- `src/app/dashboard/page.tsx`: thin — resolves session, calls `loadDashboardData`,
  renders `<DashboardOverview>`.
- `src/lib/dashboard/dashboard-data.ts`: one selector, PARALLEL queries, typed
  `DashboardData`; `buildPriorities` derives ≤5 priorities from real signals only.
- `src/lib/dashboard/role-dashboard-config.ts`: `sectionsFor` (role order),
  `toolsFor` (≤6, AUV sector gating + Energy eligibility preserved), `greetingFor`.
- `src/lib/dashboard/market-pulse.ts`: `loadEligibleMarketPulse` — renders only
  ACTIVE+approved+cited+valued observations; defensive (returns [] on any error).
- `src/components/dashboard/overview/*`: DashboardOverview + Greeting, Priorities,
  Opportunities, Network, DiasporaProducts, StartupJourney, News, IndividualCta,
  Tools, MarketPulse, EmptyState. Server components, design-system tokens.

## Section order
greeting → Prioritetet e mia → (startup journey) → Mundësi për biznesin tënd →
(trajnime) → Tregu dhe partnerët → (diaspora products) / (news + CTA) → Mjetet
kryesore → Market Pulse (only when verified). Sections hide when empty (no giant
blank cards).

## Behavior
- Priorities: incomplete profile, unread notifications, urgent grant deadline
  (≤14d, high urgency), an upcoming fair (≤30d), matchmaking — all real; nothing
  fabricated.
- Opportunities: real grant/fair records with a "Pse po e sheh" reason from real
  matching signals (sector/openness). Compact empty state with a supported action.
- Network: matchmaking + "Rrjeti i bizneseve" (renamed from "Kompani Kosovare";
  route `/dashboard/directory` unchanged) + "Kërko ofertë". Demo companies remain
  visible + functional (directory query unchanged, no filtering added).
- Tools: role-aware, ≤6, AUV/Energy gating preserved; no company actions to a
  companyless Individual.
- Roles: KOSOVO_BUSINESS/STARTUP/DIASPORA/INDIVIDUAL explicit; ADMIN/SUPER_ADMIN
  fall back to the business Dashboard without company-specific claims.
- Market Pulse: hidden entirely (ASKdata is DRAFT/inactive/absent; gate returns []).

## Non-goals honored
No shell/sidebar/header/breadcrumb/route/auth/schema/migration/ingestion/governance
change; ASKdata lifecycle untouched; no deploy/merge.
