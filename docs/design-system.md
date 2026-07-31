# KBH Design System (Phase 1)

The semantic token layer for Kosova Business Hub. Tokens are CSS variables in
`src/app/globals.css`, exposed as Tailwind utilities in `tailwind.config.ts`.
Brand stays navy / cobalt; the primitives and new components consume tokens so
future changes (including a dark theme) happen in one place.

Rule of thumb: in new or refactored code, use a token utility (`bg-surface`,
`text-ink-muted`, `border-line`, `bg-primary`) instead of a raw hex
(`bg-[#1B4F72]`). Existing pages are migrated gradually, not all at once.

## Color tokens

| Token utility | CSS var | Value | Use |
| --- | --- | --- | --- |
| `bg-surface` | `--color-surface` | `#ffffff` | Card / panel background |
| `bg-surface-sunken` | `--color-surface-sunken` | `#eef2f6` | Insets, skeletons, ghost hover |
| `border-line` / `border-line-strong` | `--color-border` / `-strong` | `#dde5ec` / `#c6d2dc` | Dividers, card borders |
| `text-ink` | `--color-text` | `#14212b` | Primary text |
| `text-ink-muted` | `--color-text-muted` | `#55636f` | Secondary text |
| `text-ink-subtle` | `--color-text-subtle` | `#7c8b97` | Metadata, captions |
| `bg-primary` / `hover:bg-primary-hover` | `--color-primary` | navy `#1b4f72` | Primary actions, identity |
| `text-primary-fg` | `--color-primary-fg` | `#ffffff` | Text on primary |
| `bg-primary-soft` | `--color-primary-soft` | `#e8eef3` | Soft navy chips |
| `text-link` / `hover:text-link-hover` | `--color-link` | cobalt `#2e86c1` | Links |
| `ring-focusring` | `--color-focus` | cobalt | Focus ring |

### Status colors

Each status has a solid (`bg-*`), a hover (`bg-*-hover`), a soft background
(`bg-*-soft`), an ink text (`text-*-ink`), and a border (`border-*-line`).

| Status | Meaning | Solid | Soft + ink |
| --- | --- | --- | --- |
| `success` | verification, progress, done | `#1c8a56` | `bg-success-soft text-success-ink` |
| `warning` | opportunities, deadlines, emphasis | `#b4740e` (amber/gold) | `bg-warning-soft text-warning-ink` |
| `danger` | blocking issues, critical deadlines | `#c43d2e` | `bg-danger-soft text-danger-ink` |
| `info` | guidance, information | `#2e86c1` | `bg-info-soft text-info-ink` |

Status is never signalled by color alone: badges and alerts pair color with an
icon or a text label (see `StatusBadge`, `VerificationBadge`, `Alert`).

## Typography

Fonts: Inter (`font-sans`) for UI and body; Source Serif (`font-serif`)
reserved for long-form guide titles. Scale:

| Role | Size | Tailwind |
| --- | --- | --- |
| Page title (H1) | 28-30px | `text-2xl font-semibold` (via `PageHeader`) |
| Section title (H2) | 18-20px | `text-lg font-semibold` (via `SectionHeader`) |
| Card title (H3) | 16px | `text-base font-semibold` |
| Body | 14-16px | `text-sm` / `text-base` |
| Metadata | 12-13px | `text-xs text-ink-subtle` |

One H1 per page. Headings follow H1 -> H2 -> H3 order.

## Radius, shadow, spacing, layout

- Radius: `rounded-control` (8px, inputs/buttons), `rounded-card` (12px, cards), `rounded-pill` (badges). Tailwind defaults are untouched.
- Shadow: `shadow-card` (resting), `shadow-raised` (hover/menus), `shadow-float` (overlays).
- Spacing: Tailwind scale; stack sibling groups with `space-y-*` / `gap-*`.
- Content widths: `max-w-content` (1200), `max-w-prose` (760, long text), `max-w-form` (640).
- Z-index: `z-sticky` 30, `z-dropdown` 40, `z-overlay` 45, `z-drawer` 50, `z-modal` 60, `z-toast` 70.

## Component variants

- **Button** (`ui/button`): `default` (navy), `secondary` (cobalt), `outline`, `ghost`, `danger`, `success`. Sizes `sm|default|lg|xl|icon`.
- **Badge** (`ui/badge`): `default|secondary|success|warning|danger|neutral`.
- **StatusBadge** (`ui/status-badge`): pill with dot/icon + label for `success|warning|danger|info|neutral`.
- **VerificationBadge** (`ui/verification-badge`): verified / unverified with icon + visible text.
- **Alert** (`ui/alert`): `info|success|warning|danger`, icon + optional title; `role="alert"` for warning/danger.
- **Card** (`ui/card`): `Card`, `CardHeader`, `CardContent`, `CardFooter`.
- **PageHeader / SectionHeader**: standard H1 / H2 with optional icon, description, actions.
- **EmptyState**: icon, title, description, and a next-step action. Replaces bare "S'ka të dhëna".
- **Skeleton / SkeletonCard**: loading placeholders; pulse disabled under reduced motion.
- **ErrorState**: recoverable error surface for `error.tsx` boundaries.
- **DataFreshness / OfficialSourceLabel**: recency ("Kontrolluar më ...") and official-source labels for verified data.
- **FormSection / FormHelpText**: fieldset grouping and helper/validation text with `aria-describedby`.

## Data-verification states

Official data must always show its provenance. Use `OfficialSourceLabel` for the
source (with link) and `DataFreshness` for the last-checked date and statistical
period. `VerificationBadge` marks whether an entity is verified. Never present an
AI-generated or unverified value as a confirmed fact.

## Responsive

Mobile-first: single column by default, `md:` / `lg:` to expand. Wide content
(tables, code) scrolls inside its own container; the page body never scrolls
sideways. Targets: 360, 390, 768, 1024, 1440.

## Accessibility

- Visible keyboard focus everywhere via a base `:focus-visible` outline (globals.css).
- Color is never the only status signal (icon or text always present).
- Inputs associate errors with `aria-invalid` + `aria-describedby`.
- Semantic HTML: one H1, ordered headings, `fieldset`/`legend` for form groups, `role="alert"` for errors.
- Motion respects `prefers-reduced-motion`.
- Target WCAG 2.1 AA contrast for text and controls.
