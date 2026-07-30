# RC1 Final Visual QA (isolated, no public tunnel)

Final code `b0c9e05` built and run in an isolated worktree (`/var/www/bh-rc1-gate`) against the **migrate-deployed** production clone `businesshub_gateqa`, on an isolated port (3077) under a `timeout` wrapper. Reached only via a private SSH port-forward (no public tunnel). APP_ENV=development + Cloudflare test Turnstile keys (isolated QA); DEV_IMPERSONATION absent. 6 QA login accounts seeded (password not stored here). Production health verified 200 before and 200 after; no production process action taken (prod restarts stayed at 1).

## Login verification (real login form + ported Turnstile)
All 6 account roles logged in through the real `/login` form (test Turnstile widget shows "Success!"). Logout exercised via `/api/auth/signout`. `/api/dev/impersonate` returns **404** (dev impersonation unavailable in this production-mode-for-impersonation configuration).

## Screenshots VISUALLY INSPECTED (7) — genuine on-screen review, not DOM-only
1. **gate_login_1440.png** — "Business Hub Kosova" login card, email/password, **Cloudflare Turnstile test widget "Success! For testing only"** (real prod keys would remove this banner), Hyr button, Regjistrohu link. No overflow.
2. **gate_KOSOVO_BUSINESS_1440.png** (producer, food, LARGE) — greeting "prodhimin dhe eksportin… Sektori: Ushqim dhe pije"; priorities (profile 50%, matches); food opportunities (POLAGRA/SIAL Paris/Cibus Tec/INDAGRA with "Sipas sektorit: Ushqim dhe pije"); network shows real clone companies (Bellaqa GmbH, Test Distributor Wien); chat bottom-right not covering CTAs; no Market Pulse; no ASKdata.
3. **gate_KOSOVO_BUSINESS_390.png** (mobile) — same personalization; tools include **Siguria e ushqimit (AUV)** and **Tregu i Energjisë (50+)** — AUV gating (food) and Energy gating (LARGE) BOTH correct; logical section order; no horizontal overflow.
4. **gate_SUPER_ADMIN_1440.png** — generic business greeting, **NO profile-completion prompt, NO sector claim** (no company-specific claims); AUV shown (admin ungated); business tools; no Market Pulse.
5. **gate_DIASPORA_1440.png** (investor) — greeting "Ura jote nga Gjermani… Mundësi investimi…"; tools lead with **Investo në Kosovë**; network-before-opportunities diaspora order.
6. **gate_INDIVIDUAL_390.png** (mobile) — greeting "Informata publike…"; real news list (ATK/MINTI); "Ke biznes ose ide biznesi?" CTA with 3 register buttons; 3 tools; no opportunity/network grid; no overflow.
7. **gate_STARTUP_1440.png** — greeting sector-oriented "TIK, software dhe BPO" (correctly NOT the producer export/customs hint); **RRUGA E THEMELIMIT** stage journey (6 steps); ICT-sector fair (IFA Berlin).

## Screenshots generated but NOT visually inspected (recorded honestly)
gate_USER_1440.png, gate_USER_390.png, gate_STARTUP_390.png, gate_SUPER_ADMIN_390.png, gate_DIASPORA_390.png, gate_INDIVIDUAL_1440.png, gate_KOSOVO_BUSINESS (both inspected). USER login succeeded and was verified programmatically (business fallback greeting, overflow 0, no Market Pulse) — its layout matches SUPER_ADMIN (business fallback), which WAS visually inspected. No visual claim is made for images not opened.

## Verifications (visual + programmatic)
Shell/sidebar intact; greeting + personalization correct per resolved profile; priorities from real signals; opportunities sector-relevant; tools role-appropriate; AUV gating correct (food shows, non-food/services hidden, admin ungated); Energy gating correct (LARGE shows, small hidden); **no unverified Market Pulse anywhere**; **no ASKdata data anywhere**; **no horizontal overflow at 1440 or 390** (all 6 roles); no clipped content; chat does not block left/centre CTAs; login + logout work; dev impersonation unavailable (404).

## Defects found and corrected
None. No visual defect was found in the final RC code.
