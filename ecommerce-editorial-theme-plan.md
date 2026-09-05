# Eshop Editorial Theme Plan

**Source theme:** `dipankardas-portfolio-main/` (Astro + Tailwind v4)
**Target:** `ecommerce/org/` — `apps/user-ui`, `apps/seller-ui`, `apps/admin-ui`, `packages/components` (Next.js 16 + Tailwind 3.4)
**Scope:** UI only. No API, data-fetching, routing, store, or business-logic changes. Every step below touches class names, CSS, fonts, tokens, and presentational component markup.

---

## Table of contents

1. [Theme analysis — what makes the portfolio look the way it does](#1-theme-analysis)
2. [Current state of the ecommerce UIs](#2-current-state-of-the-ecommerce-uis)
3. [Mapping strategy — cream storefront, ink consoles](#3-mapping-strategy)
4. [Token dictionary (old → new)](#4-token-dictionary)
5. [Phase 0 — Foundations (fonts, Tailwind config, global CSS)](#5-phase-0--foundations)
6. [Phase 1 — Shared primitives in `shared/components/ui`](#6-phase-1--shared-primitives)
7. [Phase 2 — User UI (storefront) chrome and pages](#7-phase-2--user-ui-storefront)
8. [Phase 3 — Seller UI (ink console)](#8-phase-3--seller-ui-ink-console)
9. [Phase 4 — Admin UI (ink console)](#9-phase-4--admin-ui-ink-console)
10. [Phase 5 — Shared `packages/components`](#10-phase-5--shared-packagescomponents)
11. [Phase 6 — Motion system](#11-phase-6--motion-system)
12. [Phase 7 — Sweep, QA, and accessibility](#12-phase-7--sweep-qa-and-accessibility)
13. [Component recipes (copy-paste reference)](#13-component-recipes)
14. [Things deliberately NOT carried over](#14-things-deliberately-not-carried-over)
15. [File-by-file checklist](#15-file-by-file-checklist)

---

## 1. Theme analysis

The portfolio calls itself **"Editorial Engineer (Light)"** in `src/styles/global.css`. It reads like a printed engineering journal: cream paper, hard black rules, one terracotta accent, monospace metadata everywhere, and a serif italic used sparingly for the one word in each heading that carries emotion.

### 1.1 Colour palette

| Token (portfolio) | Value | Role |
|---|---|---|
| `--color-app-body` / `--color-app-bg` | `#FAF7F0` | Warm cream page background |
| `--color-app-surface` | `#F2EDE0` | Slightly darker paper for panels, card headers, inputs |
| `--color-app-surface-alt` | `#EFE8D8` | Alternate paper (rarely used) |
| `--color-app-text` | `#1A1A1A` | Near-black ink for text |
| `--color-app-ink-line` | `#1A1A1A` | **Hard rule** — section dividers, framed images, hover borders |
| `--color-app-border` | `#D8D2C2` | Soft warm-gray hairline for cards, chips, inputs |
| `--color-app-gray-100..600` | `#ECE7DA` `#D8D2C2` `#9A9285` `#6E665A` `#4D4639` `#2A241B` | Warm-tinted grayscale. 400 = muted labels, 500 = body copy |
| `--color-app-accent` | `#FF6B35` | Terracotta. Kickers, serif-italic words, hover fills, ping dots |
| `--color-app-accent-2` | `#C24A1B` | Deep terracotta. Index numerals, punctuation dots, underlines, link hover |
| `--color-app-ink` | `#1A1A1A` | Full-bleed dark surface (footer, spotlight, code) |
| `--color-app-ink-soft` | `#262220` | Raised panel on ink |
| `--color-app-ink-border` | `#3A3530` | Hairline on ink |
| `--color-app-on-ink` | `#FAF7F0` | Cream text on ink |
| `--color-app-on-ink-muted` | `#A89E8F` | Warm-gray text on ink |
| `--color-blur-yellow` | `#FFBF4B` | Secondary blur glow only |

**Key rule:** the palette is deliberately tiny. There is *one* hue (terracotta) and it has exactly two steps. Everything else is cream, warm gray, or ink. The portfolio never uses blue, green, or purple as UI colour (only inside markdown callouts).

### 1.2 Typography — four faces, four jobs

| Role | Face | Where |
|---|---|---|
| `--font-display` | **Helvetica Neue** (self-hosted woff2, weights 300–900) | All headings `h1`–`h3`, card titles, marquee titles, ghost numerals |
| `--font-serif` | **Instrument Serif** italic (Google) | One emphasised word per heading, pull-quotes, ledes, figcaptions, sign-offs |
| `--font-sans` | **Inter** (Google) | Body copy, descriptions |
| `--font-mono` | **JetBrains Mono** (Google) | Kickers, nav labels, sys-strips, tag chips, dates, index numerals, button labels, captions |

Mono is doing a *lot* of work: roughly half of all visible text is mono uppercase with wide tracking. This is the single strongest signature of the theme.

Type-scale conventions:
- `html { font-size: clamp(15px, 12px + 0.2vw, 20px) }` — fluid root size.
- Display headings: `font-display font-medium tracking-tight leading-[0.94–1.05]`, sizes `text-3xl md:text-4xl lg:text-5xl` (section) up to `text-[clamp(2.8rem,5.4vw,5.6rem)]` (hero).
- Mono micro-labels: `font-mono text-[10px]/[11px] uppercase tracking-[0.14em]–[0.18em]`.
- Body: `text-base lg:text-lg leading-[1.55] text-app-gray-500`.
- Global `--tracking-tight: -0.41px`.

### 1.3 Shape language

- **Zero border-radius on cards, images, inputs, chips, panels.** Everything is a hard rectangle.
- **Pill (`rounded-full`) exclusively for buttons** (`btn-primary`, `btn-ghost`, footer CTAs) and the sponsor badge.
- **Hairline borders, not shadows.** Cards are `border border-app-border`; shadows only appear on hover.
- **Corner crosshairs**: four absolutely-positioned `w-3.5 h-3.5` L-shaped `border-l border-t border-app-accent-2` spans on framed images.
- **Hard rules** (`border-t border-app-ink-line`, 1px near-black) separate every major section.
- **`gap-px` grids on a border-coloured background** create table-like tiles (footer socials, 404 sitemap).

### 1.4 Signature components

| Component | What it is | Portfolio file |
|---|---|---|
| **Kicker** | `.kicker` — mono, uppercase, `tracking-[0.18em]`, accent colour, with a 24px accent line before it via `::before` | `global.css` |
| **Sys-strip** | `.sys-strip` — mono metadata bar with hard rules top and bottom; `sys-key` (bold ink), `sys-dot` (● in accent-2), `sys-value` (gray-500) | `global.css`, used in every page |
| **Section header** | Optional `index` (`01`, `02`…) in accent-2 mono, kicker, display h2, subtitle, and a **ghost index** (`.ghost-index` — huge transparent numeral with `-webkit-text-stroke: 1px gray-200`) behind | `SectionHeader.astro` |
| **Tag chip** | `.tag-chip` — square, `border-app-border`, mono `0.66rem` uppercase | `global.css` |
| **Card hover** | `.card-hover` — `translateY(-4px)` + **offset hard shadow** `4px 4px 0 0 ink-line` + soft drop shadow + border turns to ink-line | `global.css` |
| **Top-edge wipe** | `<span class="absolute top-0 left-0 h-[2px] bg-app-accent w-0 group-hover:w-full transition-[width] duration-500">` | `ServiceCard.astro`, `DirectBooking.astro` |
| **Icon tile** | `w-12 h-12 border border-app-ink-line bg-app-body` with a tiny `w-2.5 h-2.5 border-r border-b border-app-accent-2` corner mark | `ServiceCard.astro` |
| **Figure caption strip** | `mt-3 pt-2 border-t border-app-border flex justify-between font-mono text-[10px] uppercase` — e.g. `fig.01 / portrait` … `live` | `Hero.astro`, `about.astro` |
| **Serif highlight** | `<span class="font-serif italic font-normal text-app-accent">word</span>` inside a display heading | Every page |
| **Serif signature** | `.serif-sig` with an SVG underline stroke that draws itself on load (`stroke-dashoffset` animation) | `Hero.astro` |
| **Hero highlight** | `.hero-highlight::after` — 0.13em terracotta underline at 28% opacity behind text | `Hero.astro` |
| **Ink section** | `.ink-section` — full-bleed `#1A1A1A` band with paper-grain overlay; kickers stay terracotta, text goes cream | `global.css`, `index.astro` spotlight, `Footer.astro` |
| **Marquee title** | `.marquee-title` — page title at `text-[15–22vw]`, lowercase, bold, `tracking-[-0.04em]`, ending in an accent-2 `.` | `AnimatedTitle.astro` |
| **Pull-quote** | `.pullquote` with a 5.5rem serif `"` in accent, serif-italic body | `Testimonials.astro` |
| **Timeline / ledger row** | `grid-cols-[auto_1fr_auto]` rows with mono index, hover `bg-app-surface`, separated by `border-b border-app-border` | `about.astro` achievements |
| **Split header** | `grid lg:grid-cols-12` → 7/8 cols display heading + 4/5 cols aside with `lg:pl-8 lg:border-l border-app-border` | Every index page |
| **Btn primary** | `.btn-primary` — pill, ink fill, cream text; hover → terracotta fill, white text, `translateY(-1px)` | `global.css` |
| **Btn ghost** | `.btn-ghost` — pill, transparent, `border-app-border`, gray-500 text; hover → ink border/text, surface fill | `global.css` |
| **Link underline** | `.link-underline::after` — 2px accent-2 bar that grows from 0 to 100% on hover | `global.css` |
| **Paper grain** | `body::before` — fixed layer with two radial terracotta/yellow glows + SVG `feTurbulence` noise at 4.5% alpha | `global.css` |
| **Blur decoration** | `BlurDecoration.astro` — 180–300px `blur-[70–100px]` circle at 25% opacity, terracotta or yellow | Hero portrait |
| **Header nav** | Numbered mono links `01 Home`, `02 Blog`…, active one gets a 1px accent-2 underline; `border-b border-app-ink-line` under the whole bar; wordmark preceded by a `w-2 h-2 rounded-full bg-app-accent-2` dot | `Header.astro` |
| **Footer** | Ink section: kicker, huge display CTA with serif-italic word, pill CTAs, `gap-px` social tile grid, serif sign-off, mono bottom row | `Footer.astro` |

### 1.5 Motion

- **Hero stagger**: `.hero-reveal` — `opacity 0 → 1`, `translateY(18px) → 0`, `0.7s cubic-bezier(0.16,1,0.3,1)`, delay `calc(var(--reveal-d) * 0.1s + 0.15s)`.
- **Scroll reveal**: `[data-reveal]` + IntersectionObserver adds `.is-revealed`; `0.7s cubic-bezier(0.22,1,0.36,1)`, `translateY(22px)`, delay `var(--reveal-delay) * 90ms`. Gated behind `html.js` and `prefers-reduced-motion: no-preference`.
- **Card hover**: `0.3s cubic-bezier(0.22,1,0.36,1)`.
- **Image zoom**: `group-hover:scale-[1.04] duration-700`.
- **Arrow nudge**: `group-hover:translate-x-1` on `→`, `group-hover:translate(2px,-3px)` on `↗`.
- **Heartbeat** on the sponsor icon; **ping** on the "available now" dot.
- **`.animate-fade-in`** (0.55s) on page sections; **`.animate-stagger > *`** with nth-child delays.
- All animations disabled under `prefers-reduced-motion: reduce`.

### 1.6 Copy voice (affects UI text only)

Mono labels use a **filesystem/terminal voice**: `~/blog`, `/contact · open to work`, `fig.02 / kubmin`, `status: shipping`, `[06 entries]`. Arrows: `→` for internal, `↗` for external, `↘` for "down the page", `←` for back. Index numerals are zero-padded (`01`, `.02`).

---

## 2. Current state of the ecommerce UIs

All three apps were recently refactored onto a coherent but *different* design system ("coral marketplace"). That refactor is an asset: colours already live in Tailwind tokens, primitives already live in one `ui/index.tsx` per app, and fonts already load through `next/font`. Migration is a **token swap plus a primitive re-skin**, not a rewrite.

### 2.1 user-ui (storefront) — `apps/user-ui`

| Aspect | Current |
|---|---|
| Canvas | `#f5f5f5` cool gray, white cards, `rounded-card` (0.875rem) everywhere (212 `rounded*` uses) |
| Accent | Coral `#ff6f61` / `coral-dim` / `coral-ink #a83828`; primary buttons are coral fill + `text-[#2b0f0a]` (31 occurrences) |
| Fonts | IBM Plex Sans (body), IBM Plex Mono (`.figure`), Jost (display, 15 files) via `next/font` |
| Shadows | `shadow-card`, `shadow-lift`, `shadow-pop` on cards |
| Hero | Dark `bg-[#0f131a]` panel with coral blur orbs, Jost h1, product fan |
| Header | White bar, coral-bordered search, "All departments" coral button, sticky bottom nav |
| Primitives | `Container`, `Crumbs`, `SectionTitle` (coral `.marker` bar), `PageHeading`, `Card`, `CardHead`, `Button` (primary/ghost/danger/quiet), `ButtonLink`, `Label`, `Field`, `Select`, `StatusPill` (pos/warn/neg/coral/neutral), `Price`, `Figure`, `Rating`, `EmptyState`, `Bar`, `CardSkeleton`, `Modal` |
| Auth | `AuthShell` split layout with a rotated paper "Slip" receipt on a coral-washed panel |
| Stragglers | `bg-slate-*` (17), `text-red-700`/`bg-red-50` (5), `text-amber-400`, `divide-slate-100`, `w-[90%] lg:w-[80%]` wrappers on `shops` and `profile` pages instead of `Container` |
| Hex literals | 68 across 26 files (mostly `#2b0f0a` and colour swatches) |

### 2.2 seller-ui (dashboard) — `apps/seller-ui`

| Aspect | Current |
|---|---|
| Canvas | Dark: `ink #08090c`, `panel #141922`, `raised #1c2230`, `rule #1e293b` |
| Accent | Coral with `coral-glow` box-shadow; `.marker` has neon glow |
| Fonts | IBM Plex Sans/Mono, Bricolage Grotesque (display), Pacifico (neon sign on login) |
| Shell | 260px sticky sidebar (`bg-panel`), grouped nav with `text-label` headings, coral marker on active item, identity block + logout at foot |
| Primitives | `PageShell`, `Crumbs`, `PageTitle`, `Panel`, `PanelHead`, `Label`, `Button`, `SearchField`, `Field`, `TextArea`, `SelectField`, `Select`, `StatusPill`, `Figure`, `StatTile`, `EmptyState`, `Bar`, `Pagination`, `Modal`, `DataTable`/`TableSkeleton` |
| Charts | ApexCharts + Recharts, single data hue `#3987e5`, `foreColor #94a3b8` |
| Login | Split layout, `#171310` warm-dark panel with neon `Open.` sign |
| Hex literals | 146 across 18 files (chart configs, login gradients) |

### 2.3 admin-ui (ops console) — `apps/admin-ui`

Same system as seller-ui with slightly different surface values (`panel #12161f`, `raised #1a1f2b`, `rule #232a38`). 248px sidebar. Login is a centred panel over "ruled ledger paper" (repeating-linear-gradient lines). 23 hex literals in 7 files.

### 2.4 `packages/components`

`input`, `color-selector`, `custom-properties`, `custom-specifications`, `size-selector`, `rich-text-editor`. All hard-code the *old* dark palette (`border-slate-700`, `text-gray-300`, `#ff6f61`, `#141922`, `#0f172a`). Used only by seller-ui forms. Must be migrated to consume CSS variables so they follow whichever app mounts them.

---

## 3. Mapping strategy

The portfolio ships **two surfaces from one token set**: cream paper (default) and ink (`.ink-section`). That gives a natural split:

| App | Surface | Rationale |
|---|---|---|
| **user-ui** | **Cream paper** (default portfolio look) | The storefront is the public, editorial face. Product photography reads beautifully on warm cream; hard rules and mono captions turn product grids into a printed catalogue. |
| **seller-ui** | **Ink** (portfolio `.ink-section` tokens as the *base*) | Back-office consoles are already dark; keep them dark but swap the cool blue-black for the portfolio's warm near-black (`#1A1A1A` / `#262220` / `#3A3530`) with cream text and terracotta accent. |
| **admin-ui** | **Ink** | Same as seller so the two consoles still read as one product. |

Both surfaces share: Helvetica display, Instrument Serif italic accents, Inter body, JetBrains Mono metadata, zero-radius rectangles, pill buttons, kickers, sys-strips, index numerals, corner crosshairs, hard rules, and the same motion curves.

**Assumption stated up front:** this plan restyles all three apps. If only the storefront is wanted, execute Phases 0–2 and 6–7 and skip 3–5 (Phase 0 still needs to be done per-app).

---

## 4. Token dictionary

### 4.1 Colour — user-ui (cream)

| Old Tailwind token / literal | New token | Value |
|---|---|---|
| `canvas` `#f5f5f5` | `paper` | `#FAF7F0` |
| `surface` `#ffffff` | `paper-2` (card body stays paper; `surface` becomes the *darker* paper) | `#FAF7F0` for card bodies, `#F2EDE0` for `surface` |
| `sunken` `#fafafa` | `surface` | `#F2EDE0` |
| `rule` `#e4e7eb` | `line` (soft hairline) | `#D8D2C2` |
| *(none)* | `ink-line` (hard rule) | `#1A1A1A` |
| `ink` `#10151c` | `ink` | `#1A1A1A` |
| `ink-muted` `#5b6673` | `ink-500` | `#4D4639` |
| `ink-faint` `#8b95a3` | `ink-400` | `#6E665A` |
| *(none)* | `ink-300` | `#9A9285` |
| *(none)* | `ink-200` | `#D8D2C2` |
| *(none)* | `ink-100` | `#ECE7DA` |
| `coral` `#ff6f61` | `terra` | `#FF6B35` |
| `coral-dim` `#e05a4d` | *(drop — hover goes to `terra-2`)* | — |
| `coral-ink` `#a83828` | `terra-2` | `#C24A1B` |
| `coral-soft` | `terra-soft` | `rgba(255,107,53,0.08)` |
| `text-[#2b0f0a]` on coral fills | **Buttons no longer use coral fill.** Primary = ink fill + paper text; hover = terra fill + white text | — |
| `pos` `#15803d` | `pos` | `#2E7D5B` (portfolio callout-success green, warm) |
| `warn` `#eda100` / `warn-ink` `#92400e` | `warn` / `warn-ink` | `#C57E1A` / `#7A4B0E` |
| `neg` `#c0243c` | `neg` | `#A6321E` (keep distinct from terra-2) |
| `data` `#256abf` | `data` | keep `#256abf` (charts are seller/admin only; storefront rarely charts) |
| `bg-slate-*`, `bg-gray-300`, `divide-slate-100` | `bg-surface` / `bg-ink-100` / `divide-line` | — |
| `text-red-700 bg-red-50 ring-red-200` | `text-neg bg-neg/10 ring-neg/20` | — |
| `text-amber-400 fill-amber-400` (stars) | `text-terra fill-terra` | — |

### 4.2 Colour — seller-ui and admin-ui (ink)

| Old | New token | Value |
|---|---|---|
| `ink` `#08090c` | `ink` (page) | `#1A1A1A` |
| `panel` `#141922` / `#12161f` | `ink-soft` | `#262220` |
| `raised` `#1c2230` / `#1a1f2b` | `ink-raised` | `#302B27` |
| `rule` `#1e293b` / `#232a38` | `ink-border` | `#3A3530` |
| `--text` `#e8eaed` | `on-ink` | `#FAF7F0` |
| `--muted` `#94a3b8` / `#8b95a7` | `on-ink-muted` | `#A89E8F` |
| `--faint` `#64748b` / `#5c6675` | `on-ink-faint` | `#6E665A` |
| `coral` / `coral-bright` / `coral-dim` | `terra` / `terra` / `terra-2` | `#FF6B35` / `#FF6B35` / `#C24A1B` |
| `coral-soft` | `terra-soft` | `rgba(255,107,53,0.12)` |
| `pos` `#4ade80` | `pos` | `#6FBF9A` |
| `warn` `#fbbf24` | `warn` | `#E8A44B` |
| `neg` `#f87171` | `neg` | `#E8735A` |
| `data` `#3987e5` (+high/low) | `data` | keep as is |
| `coral-glow` shadow | **remove** — no glows in the editorial system | — |

### 4.3 Typography tokens (all apps)

| Old | New |
|---|---|
| `font-sans` → IBM Plex Sans | `font-sans` → **Inter** |
| `font-mono` → IBM Plex Mono | `font-mono` → **JetBrains Mono** |
| `font-jost` / `font-display` → Jost / Bricolage | `font-display` → **Helvetica Neue** (self-hosted) |
| *(none)* | `font-serif` → **Instrument Serif** italic |
| `font-sign` → Pacifico | **remove** (neon sign leaves with it) |
| `text-label` `0.6875rem / 0.12em` | keep name, retune: `0.6875rem`, `letterSpacing: 0.16em`, always paired with `font-mono uppercase` |
| *(none)* | `text-micro`: `0.625rem / 0.18em` for captions and index numerals |

### 4.4 Shape tokens

| Old | New |
|---|---|
| `rounded-card` / `rounded-panel` = `0.875rem` | **`0`** — redefine the token to `0` so the 212+ call sites flip at once, then delete the token in the sweep |
| `rounded-lg` on buttons/inputs | inputs → `rounded-none`; buttons → `rounded-full` |
| `rounded-xl` toasts | `rounded-none` with `border-ink-line` |
| `shadow-card` `0 1px 2px` | **`none`** — set token to `none` |
| `shadow-lift` | `4px 4px 0 0 #1A1A1A, 0 16px 30px -14px rgba(26,26,26,0.22)` (the portfolio offset shadow) |
| `shadow-pop` | `0 0 0 1px #1A1A1A, 0 10px 30px rgba(0,0,0,0.15)` |
| `shadow-panel` (ink) | `none` |

---

## 5. Phase 0 — Foundations

Do this once per app (three times). Each step is presentational only.

### 0.1 Fonts

**Helvetica Neue is not on Google Fonts.** The portfolio self-hosts it from `public/fonts/`. Two options:

- **Option A (faithful):** copy the 16 files from `dipankardas-portfolio-main/public/fonts/` into `apps/user-ui/public/fonts/`, `apps/seller-ui/public/fonts/`, `apps/admin-ui/public/fonts/`, and use `next/font/local`:

  ```ts
  // apps/user-ui/src/app/layout.tsx
  import localFont from 'next/font/local';
  import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

  const display = localFont({
    src: [
      { path: '../../public/fonts/HelveticaNeue-Light.woff2', weight: '300' },
      { path: '../../public/fonts/Helvetica.woff2',           weight: '400' },
      { path: '../../public/fonts/HelveticaNeue-Medium.woff2', weight: '500' },
      { path: '../../public/fonts/HelveticaNeue-Bold.woff2',   weight: '600' },
      { path: '../../public/fonts/HelveticaNeue-Bold.woff2',   weight: '700' },
      { path: '../../public/fonts/HelveticaNeue-Heavy.woff2',  weight: '900' },
    ],
    variable: '--font-display',
    display: 'swap',
  });
  const sans  = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'], variable: '--font-sans', display: 'swap' });
  const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal','italic'], variable: '--font-serif', display: 'swap' });
  const mono  = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-mono', display: 'swap' });
  ```
  Body class becomes `${display.variable} ${sans.variable} ${serif.variable} ${mono.variable}`.

- **Option B (licence-safe fallback):** if redistributing Helvetica Neue is a concern, substitute **Inter Tight** or **Manrope** for `--font-display`. The theme survives; the headings just lose a little of the Swiss flavour. Decide before starting; everything downstream references `--font-display`.

Remove `Jost`, `IBM_Plex_Sans`, `IBM_Plex_Mono`, `Bricolage_Grotesque`, `Pacifico` imports.

### 0.2 `tailwind.config.js` — user-ui

Replace `theme.extend` wholesale:

```js
theme: {
  extend: {
    colors: {
      paper:   '#FAF7F0',
      surface: '#F2EDE0',
      'surface-alt': '#EFE8D8',
      line:    '#D8D2C2',        // soft hairline
      'ink-line': '#1A1A1A',     // hard rule
      ink: {
        DEFAULT: '#1A1A1A',
        100: '#ECE7DA', 200: '#D8D2C2', 300: '#9A9285',
        400: '#6E665A', 500: '#4D4639', 600: '#2A241B',
      },
      terra: { DEFAULT: '#FF6B35', 2: '#C24A1B', soft: 'rgba(255,107,53,0.08)' },
      // dark surfaces for footer / spotlight bands
      'ink-soft': '#262220', 'ink-raised': '#302B27', 'ink-border': '#3A3530',
      'on-ink': '#FAF7F0', 'on-ink-muted': '#A89E8F',
      pos: '#2E7D5B',
      warn: { DEFAULT: '#C57E1A', ink: '#7A4B0E' },
      neg: '#A6321E',
      data: '#256abf',
      glow: { terra: '#FF6B35', yellow: '#FFBF4B' },
    },
    fontFamily: {
      sans:    ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      display: ['var(--font-display)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      serif:   ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
      mono:    ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.16em' }],
      micro: ['0.625rem',  { lineHeight: '1rem', letterSpacing: '0.18em' }],
    },
    letterSpacing: { tight: '-0.41px', kicker: '0.18em', label: '0.14em' },
    borderRadius: { card: '0', panel: '0' },   // transitional — deleted in Phase 7
    boxShadow: {
      card: 'none',
      lift: '4px 4px 0 0 #1A1A1A, 0 16px 30px -14px rgba(26,26,26,0.22)',
      pop:  '0 0 0 1px #1A1A1A, 0 10px 30px rgba(0,0,0,0.15)',
      ink:  '0 10px 24px -12px rgba(26,26,26,0.35)',
    },
    transitionTimingFunction: {
      editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      hero:      'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    keyframes: {
      'reveal-up':  { from: { opacity: '0', transform: 'translateY(22px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      'hero-up':    { from: { opacity: '0', transform: 'translateY(18px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      'fade-in':    { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      shimmer:      { '100%': { transform: 'translateX(100%)' } },
      heartbeat:    { '0%,100%': { transform: 'scale(1)' }, '25%,75%': { transform: 'scale(1.3)' }, '50%': { transform: 'scale(1)' } },
      'sig-draw':   { to: { strokeDashoffset: '0' } },
    },
    animation: {
      'reveal-up': 'reveal-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
      'hero-up':   'hero-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
      'fade-in':   'fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both',
      shimmer:     'shimmer 1.6s infinite',
      heartbeat:   'heartbeat 0.8s ease-in-out',
      // keep the existing names so nothing breaks mid-migration:
      'rise-in':    'fade-in 0.55s cubic-bezier(0.22,1,0.36,1) both',
      fadeSlideUp:  'reveal-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
    },
  },
},
plugins: [],
```

Add `'./{src,pages,components,app}/**/*.{ts,tsx}'` content globs already present — no change.

### 0.3 `tailwind.config.js` — seller-ui and admin-ui (ink)

Same structure; colours become:

```js
colors: {
  ink:         '#1A1A1A',      // page
  'ink-soft':  '#262220',      // panel
  'ink-raised':'#302B27',      // inputs, hover rows
  'ink-border':'#3A3530',      // hairline
  'on-ink':    '#FAF7F0',
  'on-ink-muted': '#A89E8F',
  'on-ink-faint': '#6E665A',
  paper: '#FAF7F0',            // for the rare inverted element (primary button fill)
  terra: { DEFAULT: '#FF6B35', 2: '#C24A1B', soft: 'rgba(255,107,53,0.12)' },
  pos: '#6FBF9A', warn: '#E8A44B', neg: '#E8735A',
  data: { DEFAULT: '#3987e5', high: '#6da7ec', low: '#256abf' },
},
// keep the old names as aliases during migration, delete in Phase 7:
// panel → ink-soft, raised → ink-raised, rule → ink-border
```

Remove `coral-glow` from `boxShadow`. `shadow-panel: 'none'`, `shadow-pop: '0 0 0 1px #3A3530, 0 16px 40px -12px rgba(0,0,0,0.6)'`.

### 0.4 `global.css` — user-ui

Replace the `:root` block and add the editorial utilities. Keep `@tailwind base/components/utilities`, `.figure`, `.scroll-slim`, `.scroll-none`, `.clamp-*`, and the reduced-motion block.

```css
:root {
  color-scheme: light;
  --paper: #FAF7F0; --surface: #F2EDE0; --line: #D8D2C2; --ink-line: #1A1A1A;
  --ink: #1A1A1A; --ink-500: #4D4639; --ink-400: #6E665A; --ink-300: #9A9285; --ink-200: #D8D2C2;
  --terra: #FF6B35; --terra-2: #C24A1B;
  --ink-soft: #262220; --ink-border: #3A3530; --on-ink: #FAF7F0; --on-ink-muted: #A89E8F;
}

@layer base {
  html { font-size: clamp(15px, 12px + 0.2vw, 18px); overflow-x: clip; }
  body { background: var(--paper); color: var(--ink); font-family: var(--font-sans); letter-spacing: -0.41px; overscroll-behavior-y: none; }

  /* Paper grain + two warm glows, fixed so it never repaints on scroll */
  body::before {
    content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background-color: var(--paper);
    background-image:
      radial-gradient(900px 500px at 8% 0%, rgba(255,107,53,0.07), transparent 55%),
      radial-gradient(800px 460px at 100% 100%, rgba(255,191,75,0.06), transparent 60%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.10 0 0 0 0 0.09 0 0 0 0 0.07 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  :focus-visible { outline: 2px solid var(--terra-2); outline-offset: 2px; border-radius: 0; }
  ::selection { background: rgba(194,74,27,0.30); color: var(--ink); }
  .font-serif { font-style: italic; }   /* Instrument Serif is only ever used italic */
}

@layer components {
  /* ---- kicker ---- */
  .kicker { @apply inline-flex items-center gap-2 font-mono text-[0.7rem] font-semibold uppercase tracking-kicker text-terra; }
  .kicker::before { content: ""; @apply inline-block h-px w-6 bg-terra; }

  /* ---- sys-strip ---- */
  .sys-strip { @apply flex flex-wrap items-center gap-[0.6rem] border-y border-ink-line py-[0.55rem] font-mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-400; }
  .sys-strip .sys-key { @apply font-semibold text-ink; }
  .sys-strip .sys-dot { @apply text-terra-2; }
  .sys-strip .sys-value { @apply text-ink-500; }

  /* ---- ghost index ---- */
  .ghost-index {
    @apply pointer-events-none absolute right-0 top-[-0.18em] z-0 select-none font-display font-bold leading-none text-transparent;
    font-size: clamp(5rem, 14vw, 11rem); letter-spacing: -0.04em;
    -webkit-text-stroke: 1px var(--ink-200);
  }
  @media (max-width: 640px) { .ghost-index { font-size: 4.5rem; top: -0.1em; } }

  /* ---- chips ---- */
  .tag-chip { @apply inline-flex items-center whitespace-nowrap border border-line px-[0.55rem] py-[0.2rem] font-mono text-[0.66rem] uppercase tracking-[0.12em] text-ink-500 transition-colors; }
  .group:hover .tag-chip { border-color: var(--ink-300); }

  /* ---- card hover ---- */
  .card-hover { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1), border-color .3s ease; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 4px 4px 0 0 var(--ink-line), 0 16px 30px -14px rgba(26,26,26,.22); border-color: var(--ink-line); }

  /* ---- buttons ---- */
  .btn-primary { @apply inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-6 py-3 text-sm font-medium text-paper tracking-tight transition-all duration-200 hover:-translate-y-px hover:border-terra hover:bg-terra hover:text-white disabled:pointer-events-none disabled:opacity-45; }
  .btn-ghost   { @apply inline-flex items-center gap-2 rounded-full border border-line bg-transparent px-[1.4rem] py-[0.65rem] text-sm font-medium text-ink-500 tracking-tight transition-colors duration-200 hover:border-ink hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-45; }
  .btn-mono    { @apply font-mono text-[11px] uppercase tracking-[0.12em] font-semibold; }  /* add alongside btn-* for label-style buttons */

  /* ---- link underline ---- */
  .link-underline { @apply relative no-underline; }
  .link-underline::after { content: ""; @apply absolute -bottom-0.5 left-0 h-0.5 w-0 bg-terra-2 transition-[width] duration-[250ms]; }
  .link-underline:hover::after { @apply w-full; }

  /* ---- rules ---- */
  .rule { @apply h-px border-0 bg-ink-line; }
  .rule-soft { @apply h-px border-0 bg-line; }

  /* ---- ink section ---- */
  .ink-section { @apply relative bg-ink text-on-ink; }
  .ink-section::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.98 0 0 0 0 0.97 0 0 0 0 0.94 0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .ink-section > * { position: relative; }
  .ink-section .sys-strip { @apply border-ink-border text-on-ink-muted; }
  .ink-section .sys-strip .sys-key { @apply text-on-ink; }
  .ink-section .ghost-index { -webkit-text-stroke: 1px var(--ink-border); }

  /* ---- serif highlight & signature ---- */
  .serif-hl { @apply font-serif italic font-normal text-terra; }
  .hero-highlight { @apply relative inline-block; z-index: 0; }
  .hero-highlight::after { content: ""; position: absolute; z-index: -1; left: -0.03em; right: -0.03em; bottom: 0.02em; height: 0.13em; background: rgba(194,74,27,0.28); }

  /* ---- corner crosshairs (apply to a `relative` frame) ---- */
  .crosshairs::before, .crosshairs::after,
  .crosshairs > .xh-b::before, .crosshairs > .xh-b::after { content: ""; position: absolute; width: .875rem; height: .875rem; border-color: var(--terra-2); border-style: solid; border-width: 0; }
  .crosshairs::before { top: .625rem; left: .625rem; border-left-width: 1px; border-top-width: 1px; }
  .crosshairs::after  { top: .625rem; right: .625rem; border-right-width: 1px; border-top-width: 1px; }
  .crosshairs > .xh-b::before { bottom: .625rem; left: .625rem; border-left-width: 1px; border-bottom-width: 1px; }
  .crosshairs > .xh-b::after  { bottom: .625rem; right: .625rem; border-right-width: 1px; border-bottom-width: 1px; }

  /* ---- scroll reveal (JS adds .is-revealed) ---- */
  @media (prefers-reduced-motion: no-preference) {
    html.js [data-reveal] { opacity: 0; transform: translateY(22px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); transition-delay: calc(var(--reveal-delay, 0) * 90ms); }
    html.js [data-reveal].is-revealed { opacity: 1; transform: none; }
  }

  /* ---- marquee page title ---- */
  .marquee-title { @apply whitespace-nowrap font-display font-bold leading-[0.9] text-ink; letter-spacing: -0.04em; }

  /* ---- scrollbar ---- */
  .scrollbar-thin { scrollbar-width: thin; scrollbar-color: var(--ink-200) transparent; }
  .scrollbar-thin::-webkit-scrollbar { width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--ink-200); border-radius: 3px; }
}
```

Keep the existing `.marker` class **but redefine it** as a 1px terra-2 hairline (`width: 1px; background: var(--terra-2)`) so the nine call sites don't break; it will be replaced by kickers in Phase 2 and removed in Phase 7.

### 0.5 `global.css` — seller-ui / admin-ui (ink)

Same utilities, colour vars inverted:

```css
:root {
  color-scheme: dark;
  --ink: #1A1A1A; --ink-soft: #262220; --ink-raised: #302B27; --ink-border: #3A3530;
  --on-ink: #FAF7F0; --on-ink-muted: #A89E8F; --on-ink-faint: #6E665A;
  --terra: #FF6B35; --terra-2: #C24A1B; --paper: #FAF7F0;
}
body { background: var(--ink); color: var(--on-ink); }
body::before { /* grain only, cream-tinted noise at 3.5% alpha, no colour glows */ }
.kicker { color: var(--terra); }            /* same as cream */
.sys-strip { border-color: var(--ink-border); color: var(--on-ink-muted); }
.sys-strip .sys-key { color: var(--on-ink); }
.ghost-index { -webkit-text-stroke: 1px var(--ink-border); }
.tag-chip { border-color: var(--ink-border); color: var(--on-ink-muted); }
.card-hover:hover { box-shadow: 4px 4px 0 0 var(--terra-2), 0 16px 30px -14px rgba(0,0,0,.5); border-color: var(--on-ink); }
.btn-primary { background: var(--paper); color: var(--ink); border-color: var(--paper); }
.btn-primary:hover { background: var(--terra); border-color: var(--terra); color: var(--ink); }
.btn-ghost { border-color: var(--ink-border); color: var(--on-ink); }
.btn-ghost:hover { border-color: var(--paper); background: var(--ink-soft); }
:focus-visible { outline-color: var(--terra); }
.marker { width: 1px; background: var(--terra); box-shadow: none; }  /* transitional */
```

Delete `.neon-text`, `.neon-flicker`, `@keyframes neon-flicker`.

### 0.6 Root layout body classes

- user-ui: `min-h-screen bg-paper font-sans text-ink antialiased selection:bg-terra-2/30 flex flex-col`
- seller/admin: `min-h-screen bg-ink font-sans text-on-ink antialiased`

Add the `html.js` class hook (inline `<script>document.documentElement.classList.add('js')</script>` in `<head>` via a tiny client component, or set `className="js"` on `<html>` — it only gates the reveal CSS).

### 0.7 Toaster restyle (all apps)

```tsx
toastOptions={{
  className: '!rounded-none !border !border-ink-line !bg-paper !text-ink !font-mono !text-[11px] !uppercase !tracking-[0.12em] !shadow-lift',
  success: { iconTheme: { primary: '#2E7D5B', secondary: '#FAF7F0' } },
  error:   { iconTheme: { primary: '#A6321E', secondary: '#FAF7F0' } },
  loading: { iconTheme: { primary: '#C24A1B', secondary: '#FAF7F0' } },
}}
```
(ink apps: `!bg-ink-soft !text-on-ink !border-ink-border`).

---

## 6. Phase 1 — Shared primitives

File: `apps/user-ui/src/shared/components/ui/index.tsx` (and the sibling files in seller-ui / admin-ui). These are the highest-leverage edits: every page inherits them.

### 1.1 New primitives to add

| Component | Props | Renders |
|---|---|---|
| `Kicker` | `children` | `<span className="kicker">` |
| `SysStrip` | `items: { key?: string; value: string; hideOnMobile?: boolean }[]`, `trailing?` | `.sys-strip` with `sys-key` / `sys-dot` / `sys-value` spans; trailing item gets `ml-auto` |
| `SectionHeader` | `title`, `kicker?`, `index?: number`, `subtitle?`, `ghost?: boolean`, `action?` | Port of `SectionHeader.astro`: relative wrapper, `.ghost-index`, index+kicker row, `font-display text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05]` h2, subtitle in `text-ink-400`, optional right-aligned action slot |
| `Serif` | `children` | `<span className="font-serif italic font-normal text-terra">` — for the highlighted word in any heading |
| `Frame` | `children`, `caption?: { left: string; right?: string }`, `className?` | `relative border border-ink-line bg-surface overflow-hidden` + four crosshair spans + optional caption strip below (`fig.01 / product` … `live`) |
| `IconTile` | `icon`, `size?: 'sm' \| 'md'` | `w-12 h-12 border border-ink-line bg-paper grid place-items-center relative` + `w-2.5 h-2.5 border-r border-b border-terra-2` corner mark; icon `text-terra-2` |
| `Chip` | `children` | `.tag-chip` |
| `Ledger` / `LedgerRow` | `rows: { index?, label, value, href? }[]` | `border-t border-ink-line` list; each row `grid grid-cols-[auto_1fr_auto] gap-4 py-4 border-b border-line hover:bg-surface` with mono zero-padded index |
| `TileGrid` / `Tile` | `items`, `cols` | `grid gap-px bg-line border border-line`; tile = `bg-paper hover:bg-ink hover:text-paper px-5 py-5 min-h-[88px] flex flex-col justify-between` with mono arrow top and display label bottom |
| `SplitHeader` | `left`, `aside` | `grid lg:grid-cols-12 gap-8`; left `lg:col-span-8`, aside `lg:col-span-4 lg:pl-8 lg:border-l border-line flex flex-col justify-end` |
| `Reveal` | `delay?: number`, `as?` | Wrapper that sets `data-reveal` and `style={{ '--reveal-delay': delay }}` |
| `InkSection` | `children`, `className?` | `<section className="ink-section border-t border-ink-line">` |

### 1.2 Existing primitives to re-skin

| Primitive | Change |
|---|---|
| `Container` | keep `max-w-[1320px]`; padding to `px-4 sm:px-6 lg:px-8` (already). No change except confirm. |
| `Crumbs` | → `font-mono text-[11px] uppercase tracking-[0.14em]`; separator becomes `/` text in `text-terra-2` instead of a chevron icon; current crumb `text-ink`, others `text-ink-400 hover:text-ink` |
| `SectionTitle` | **Replace body with `SectionHeader`** (keep the export name and props as an alias so call sites survive). Drop the `.marker` span. |
| `PageHeading` | Kicker (derived from the route or passed) + `font-display text-3xl md:text-4xl lg:text-5xl tracking-tight` h1 + `meta` rendered as a `SysStrip`-style mono line under it. Drop `.marker`. Actions slot unchanged. |
| `Card` | `border border-line bg-paper` (no radius, no shadow). Add optional `hover` prop → `.card-hover group`. |
| `CardHead` | `border-b border-line bg-surface px-5 py-4`; title → `font-display text-base lg:text-lg tracking-tight`; note → `font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400` |
| `Button` | `BTN_BASE` → `inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none`. Variants: `primary` → `.btn-primary` classes; `ghost` → `.btn-ghost`; `danger` → `border border-neg text-neg hover:bg-neg hover:text-paper`; `quiet` → `text-ink-400 hover:text-ink link-underline`. Add `mono?: boolean` prop appending `.btn-mono` and a trailing `→`/`↗` glyph slot (`arrow?: '→' \| '↗' \| '↘' \| '←'`). |
| `ButtonLink` | same as `Button` |
| `Label` | `font-mono text-[10px] uppercase tracking-[0.16em] font-semibold text-ink-500 mb-1.5`; required star `text-terra` |
| `Field` / `CONTROL` | `w-full border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-400 outline-none transition-colors focus:border-terra` (no radius); error → `border-neg` + `font-mono text-[10px] uppercase tracking-[0.12em] text-neg` message |
| `Select` | same control skin + `appearance-none` with a custom chevron `svg` absolutely positioned right (as in `DirectBooking.astro`) |
| `StatusPill` | Square (no `rounded-full`): `inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]`. Tones: `pos` → `border-pos/40 text-pos bg-pos/5`; `warn` → `border-warn/50 text-warn-ink bg-warn/8`; `neg` → `border-neg/40 text-neg bg-neg/5`; `coral` → rename `terra` → `border-terra-2/40 text-terra-2 bg-terra-soft`; `neutral` → `border-line text-ink-500` |
| `Price` | main figure `font-mono font-semibold text-ink tabular-nums`; compare-at `font-mono text-xs text-ink-300 line-through` |
| `Figure` | unchanged (mono tabular) |
| `Rating` | stars `fill-terra text-terra` / empty `fill-ink-100 text-ink-200`; numeral `font-mono text-xs text-ink-400` |
| `EmptyState` | icon `text-ink-300`; title `font-display text-lg tracking-tight`; hint `text-sm text-ink-400`; wrap in `border border-line` at call sites as today |
| `Bar` (skeleton) | `bg-surface ring-1 ring-inset ring-line` (no radius); shimmer `via-ink/[0.04]` |
| `CardSkeleton` | `border border-line bg-paper p-3` |
| `Modal` | overlay `bg-ink/70 backdrop-blur-sm`; panel `border border-ink-line bg-paper shadow-pop` (no radius); add a **header strip** above the title: `flex justify-between px-6 py-3 border-b border-ink-line bg-surface` with `font-mono text-[10px] uppercase tracking-[0.18em] text-terra-2` label and an `esc ×` close control (port of the `DirectBooking` dialog) |

Seller/admin `ui/index.tsx` additionally:

| Primitive | Change |
|---|---|
| `PageShell` | `px-6 py-8 lg:px-10`, inner `max-w-[1400px] animate-fade-in`. Insert a `SysStrip` slot above children (`~/dashboard ● orders ● 128 records`). |
| `PageTitle` | same as `PageHeading` above, on ink colours (`text-on-ink`) |
| `Panel` / `PanelHead` | `border border-ink-border bg-ink-soft` (no radius, no shadow); head `bg-ink-raised border-b border-ink-border`, title `font-display`, note mono |
| `StatTile` | `border border-ink-border bg-ink-soft px-5 py-4`; label → `.kicker` style but `text-on-ink-muted` with the line in `terra`; value `font-display text-3xl font-medium tracking-tight text-on-ink` (**display, not mono** — the portfolio uses mono for labels and display for big numbers); note `font-mono text-[10px] uppercase tracking-[0.14em] text-on-ink-faint`; add optional `index` prop → zero-padded numeral top-right in `text-terra-2` |
| `DataTable` | wrapper `border border-ink-border bg-ink-soft`; `thead tr` → `border-b-2 border-b-on-ink bg-ink-raised` (hard rule, not coral); `th` → `font-mono text-[0.78em] uppercase tracking-[0.06em] font-semibold text-on-ink`; `tbody tr` → `border-b border-ink-border hover:bg-ink-raised`; `td` numeric cells keep `.figure` |
| `SearchField` | square, `border border-ink-border bg-ink-soft`, mono placeholder |
| `Pagination` | `Button` ghost + `font-mono text-[11px] uppercase tracking-[0.12em]` page readout |

---

## 7. Phase 2 — User UI (storefront)

### 2.1 Header — `shared/widgets/header/header.tsx`, `header-bottom.tsx`, `account-actions.tsx`

Port `Header.astro` structure:

```
┌ container ─────────────────────────────────────────────────────────────┐
│ ● Eshop  /marketplace          01 HOME  02 PRODUCTS  03 SHOPS  04 OFFERS │ [♡ 2] [🛍 3] [Sign in] │
├─ border-b border-ink-line ─────────────────────────────────────────────┤
│ ~/search  ● [ search products, brands and shops…            ] [→]     │  ← mono sys-strip style search row
├─ border-b border-line ─────────────────────────────────────────────────┤
│ [≡ departments ▾]   (sticky when scrolled: same row + compact actions) │
└────────────────────────────────────────────────────────────────────────┘
```

- **Wordmark**: `w-2 h-2 rounded-full bg-terra-2 group-hover:scale-125` dot + `font-display font-medium text-lg tracking-tight` "Eshop" + hidden-until-lg `font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400` suffix `/marketplace`.
- **Nav links** (`navItems` from constants): `font-mono text-[11px] uppercase tracking-[0.16em] font-medium`; leading zero-padded index `text-terra-2 text-[9px]`; active → `text-ink` + `absolute -bottom-1 h-px bg-terra-2` underline; inactive → `text-ink-400 hover:text-ink`. `aria-current` stays.
- **Search form**: remove the coral border. New: `flex items-stretch border border-ink-line` with a mono `~/search` prefix cell (`px-3 bg-surface border-r border-ink-line text-[10px] uppercase tracking-[0.16em] text-ink-400 hidden sm:flex`), the input `bg-paper px-4 py-3 text-sm placeholder:text-ink-400 placeholder:font-mono placeholder:text-[11px] placeholder:uppercase placeholder:tracking-[0.1em]`, and a submit cell `w-12 bg-ink text-paper hover:bg-terra transition-colors grid place-items-center` showing `→` (mono) instead of the lucide `Search` icon.
- **Account actions**: avatar circle → `w-9 h-9 border border-ink-line grid place-items-center hover:bg-ink hover:text-paper transition-colors` (square). Wishlist/cart icons keep lucide glyphs but `text-ink-500 hover:text-terra-2`. Count badge → square `min-w-[18px] h-[18px] bg-terra-2 text-paper font-mono text-[10px] px-1 ring-2 ring-paper` (no rounding).
- **Departments button**: ghost pill `btn-ghost btn-mono` with `≡ departments ▾`. Dropdown panel → `border border-ink-line bg-paper shadow-pop` (no radius); items `font-mono text-[11px] uppercase tracking-[0.12em] px-4 py-2.5 text-ink-500 hover:bg-surface hover:text-terra-2`, each prefixed with zero-padded index.
- **Sticky bar**: `bg-paper/95 backdrop-blur border-b border-ink-line` (drop `shadow-card`).
- **Mobile menu**: port the portfolio's full-screen ink takeover — backdrop `fixed inset-0 bg-ink`, links `font-display text-2xl tracking-tight text-paper/70 hover:text-paper` with `font-mono text-xs text-terra-2` indices, `gap-6 pt-12`. Hamburger becomes two 16px lines (portfolio svg), close is an ×.

### 2.2 Hero — `shared/modules/hero/index.tsx`

Replace the dark panel with the portfolio hero grid on cream. Keep the props (`products`, `hasOffers`) and the showcase logic untouched.

```
sys-strip: ~/eshop ● marketplace ● status: {hasOffers ? 'offers live' : 'open'} ● {today}
grid lg:grid-cols-12
  ├ col-span-8
  │   kicker: "Independent sellers · Curated stock"
  │   h1 font-display font-medium text-[clamp(2.8rem,5.4vw,5.6rem)] leading-[0.94] tracking-[-0.035em]
  │     line 1: "Shop the things you"
  │     line 2: "love, from the <Serif>people</Serif>"     ← serif-sig with drawn underline
  │     line 3: "who <span.hero-highlight>make them.</span>"
  │   principles row (mono): "why —  independent + hand-picked + direct"
  │   lede: text-base lg:text-lg leading-[1.55] text-ink-500 max-w-xl
  │   CTAs: btn-primary "Start shopping →"  ·  btn-ghost "Browse shops ↘"  ·  btn-ghost "Offers ↗" (only if hasOffers)
  │   mono shortcut row: "products ↗ · shops ↗ · offers ↗ · become a seller ↗"
  └ col-span-4 lg:pt-16
      two BlurDecoration divs (terra top-right, yellow bottom-left)
      Frame (aspect-[3/4], crosshairs) containing the showcase:
        first product fills the frame (object-cover, grayscale → colour on hover via .portrait-duotone rules)
        two small products as a 2-col strip inside the frame bottom, each `border-t border-ink-line`
      caption strip: "fig.01 / new arrivals"  …  "live"
```

Each block gets `className="hero-reveal"` and `style={{ '--reveal-d': n }}` (0–6) using the `animate-hero-up` keyframe with `animationDelay: calc(var(--reveal-d) * 0.1s + 0.15s)`.

`hasOffers` pill → `inline-flex items-center gap-2 border border-terra-2/40 bg-terra-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-terra-2` with the portfolio's ping dot (`animate-ping` inner span).

### 2.3 Home page shelves — `app/(routes)/page.tsx`

- Each `Shelf` becomes a `<section className="py-16 lg:py-24 border-t border-ink-line">` with `SectionHeader` (`index={1..4}`, `kicker`, `title`, `subtitle`, `ghost`) in a `SplitHeader` (header left, subtitle paragraph right `lg:pt-12`, exactly as `index.astro` services block).
- Shelf kickers: `picked · for you`, `new · arrivals`, `shops · to know`, `offers · while they last`.
- "See all offers" action → `btn-ghost btn-mono` with `→`.
- Grid: keep `GRID` breakpoints; change `gap-4 md:gap-5` → `gap-6 lg:gap-8`.
- Wrap each card in `<Reveal delay={i % 5}>`.
- **Add an ink spotlight band** between shelf 2 and 3 (port of the `#spotlight` section): `InkSection` with sys-strip `~/spotlight ● top shop this month ● fig.02`, ghost `02`, kicker `featured shop · verified`, huge display title = top shop name with terra `.`, serif-italic tagline = shop category, description = shop bio, `Chip`s for category/address, pill CTAs (`Visit shop ↗` terra fill on ink, `All shops` ink-border ghost), right column = shop banner in a `Frame` on `bg-ink-soft` with terra crosshairs and caption `fig.02 / {shop.name}`. Uses `shops[0]` already fetched — no new data.
- Empty states: wrap in `border border-line bg-paper` (already), title `font-display`.

### 2.4 Product card — `shared/components/cards/product-card.tsx`

Port `ProjectCard.astro`:

- Root: `group h-full flex flex-col bg-paper border border-line overflow-hidden card-hover` (drop `rounded-card shadow-card hover:shadow-lift`).
- Image wrapper: `aspect-square bg-surface overflow-hidden border-b border-line relative`; `<img>` `transition-transform duration-700 group-hover:scale-[1.04]`.
- Top-left label (replaces `StatusPill tone="coral"` "Offer"): `absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-1 bg-paper/85 backdrop-blur-sm border border-line text-ink-500` → text `offer` when `isEvent`, else `proj`-style category slug (first word of `product.category`, lowercase) — this mirrors the portfolio's `proj` tag.
- Low-stock: `absolute top-3 right-3` → `StatusPill tone="warn"` (now square mono).
- Shop-name link (bottom-left overlay) → `font-mono text-[10px] uppercase tracking-[0.14em] bg-paper/90 border border-line px-2 py-1 text-ink-500 hover:text-terra-2`.
- Action buttons (`IconButton`): square `w-9 h-9 bg-paper border border-line text-ink-500 hover:border-ink-line hover:text-terra-2` (drop `rounded-full shadow-card ring-*`); active → `text-terra-2 border-terra-2`.
- Body: `p-5` → title `font-display text-base lg:text-lg tracking-tight text-ink mb-2 group-hover:text-terra transition-colors clamp-2`; rating row; price row `mt-auto pt-4 border-t border-line flex items-baseline justify-between`; discount → `Chip` `−23%` in `text-terra-2 border-terra-2/40`; `totalSales` → `font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400` `128 sold`; countdown → same mono style in `text-terra-2`.

### 2.5 Shop card — `shared/components/cards/shop.card.tsx`

- Root `Link`: `group flex h-full flex-col bg-paper border border-line card-hover` (no radius/shadow).
- Banner `h-[120px] bg-surface border-b border-line`; fallback → `bg-surface` with a `Store` icon in `text-ink-300` and a mono `no banner` caption; **no gradient**.
- Avatar: square `w-16 h-16 border border-ink-line bg-paper` overlapping the banner (`-bottom-8`), initial in `font-display text-xl text-ink-500`.
- Body: name `font-display text-base lg:text-lg tracking-tight group-hover:text-terra`; followers `font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400` `{n} followers`; address row keeps `MapPin` in `text-terra-2`; category → `Chip`; "Visit shop" → `link-underline font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-terra-2` `visit shop ↗` with the arrow nudge.

### 2.6 Stat card and quick-action card (profile)

- `StatCard` → port of `StatTile`: `border border-line bg-paper p-6 card-hover`; label `.kicker` (mono, terra line); count `font-display text-3xl font-medium tracking-tight`; icon in `IconTile`.
- `QuickActionCard` → `ServiceCard.astro` treatment: top-edge terra wipe span, `IconTile`, `font-display text-base tracking-tight` title, `text-sm text-ink-500 leading-[1.55]` description, footer `font-mono text-[10px] uppercase tracking-[0.18em] text-terra` `open →` with arrow nudge.

### 2.7 Products page — `app/(routes)/products/page.tsx`

- Top: `Crumbs` (mono) → `PageHeading` with kicker `/products · {filterCount} filters` and `meta` rendered as a `SysStrip` (`~/products ● {visible.length} results ● page {page}/{totalPages}`).
- Filter aside: `border border-line bg-paper p-5` (no radius/shadow); `FilterGroup` title → `.kicker`-style mono heading (`text-ink-400`, no terra line) with `border-t border-line pt-5` dividers; `CheckRow` → `font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500 hover:bg-surface hover:text-ink px-2 py-1.5`; native checkbox → `appearance-none w-3.5 h-3.5 border border-ink-line checked:bg-terra-2 checked:border-terra-2` square; colour swatch stays a circle but with `ring-line`.
- Price range (`react-range`): track `bg-line`, fill `bg-terra-2`, thumb `w-4 h-4 bg-paper border border-ink-line` (square); readout `font-mono text-sm text-ink-500`; Apply → `Button variant="primary" mono`.
- Grid gaps `gap-6 lg:gap-8`.
- `Pager`: page buttons `min-w-[40px] border px-3 py-2 font-mono text-[11px]` — active `border-ink bg-ink text-paper`, inactive `border-line text-ink-500 hover:border-ink hover:text-ink`; ellipsis `text-ink-300`; Prev/Next → `btn-ghost btn-mono` with `←` / `→`.
- Empty states unchanged structurally.

Apply identically to `offers/page.tsx` and `shops/page.tsx` (both still use the raw `w-[90%] lg:w-[80%]` wrapper and the `.marker` bar — swap for `Container` + `PageHeading`).

### 2.8 Product details — `shared/modules/product/product-details.tsx`

- Gallery: main image inside `Frame` with crosshairs and caption `fig.01 / {slug}` … `{currentIndex+1} / {images.length}`; thumbnails `border border-line` → active `border-ink-line`; prev/next arrows become square ghost buttons showing `←` `→` mono.
- Right column: kicker `{category} · {shop.name}`; title `font-display text-3xl lg:text-4xl tracking-tight leading-[1.05]`; rating; price block `font-mono text-2xl font-semibold` with compare-at and `Chip −n%`; sys-strip `stock: {n} ● ships from {address} ● {sales} sold`.
- Colour swatches: circles with `ring-1 ring-line`, selected `ring-2 ring-ink-line ring-offset-2 ring-offset-paper`.
- Sizes: square chips `border border-line font-mono text-[11px] uppercase px-3 py-2`, selected `border-ink-line bg-ink text-paper`.
- Quantity stepper: `border border-line` group with `−` / `+` mono cells, count in `.figure`.
- Add to cart → `btn-primary btn-mono` `Add to cart →`; wishlist → `btn-ghost` square icon; chat → `btn-ghost btn-mono` `message seller ↗`.
- Description: apply portfolio `.prose` rules (already in the theme spec: display headings, terra links with sliding underline, terra bullet dots, hard-rule tables). Add a trimmed `.prose` block to `global.css` for `sanitizeRichText` output.
- Recommended products shelf → `SectionHeader index={2} kicker="also · from this shop"`.

### 2.9 Cart, checkout, wishlist, order pages

- All use `Card` / `CardHead` / `Button` / `StatusPill` / `Price` → inherit Phase 1 skins.
- Cart line items: `grid grid-cols-[96px_1fr_auto] gap-4 py-5 border-b border-line` rows; thumbnail in a small `Frame` (no caption); title `font-display text-base tracking-tight`; qty stepper as above; remove → `link-underline font-mono text-[10px] uppercase text-ink-400 hover:text-neg` `remove ×`.
- Summary panel → `Card` with `CardHead title="Order summary" note="~/cart · {n} items"`; rows use `LedgerRow` (label / dotted leader / value) — reuse the `SlipLine` dotted-leader idea from the auth slip, restyled mono.
- Coupon field → `Field` + `Button ghost mono` `apply →`.
- Checkout button → `btn-primary btn-mono w-full justify-between` `Continue to payment` … `→`.
- Order detail (`order/[orderId]`): timeline of delivery states → port `Timeline.astro` markers: vertical `w-px bg-ink-line` with `w-3 h-3 border border-ink bg-paper` squares that fill `bg-terra-2` when reached.
- Payment success: `marquee-title`-style big `paid.` heading with terra `.`, sys-strip `~/order ● #{shortId} ● status: paid`, then a `TileGrid` of next steps (`View order`, `Keep shopping`, `Your profile`).

### 2.10 Profile — `app/(routes)/profile/page.tsx`

- Wrapper → `Container`. Header → `PageHeading` kicker `/profile · {user.name}`.
- Tab rail → mono tabs: `font-mono text-[11px] uppercase tracking-[0.16em] px-4 py-3 border-b-2` — active `border-terra-2 text-ink`, inactive `border-transparent text-ink-400 hover:text-ink`. Keep the `?active=` param logic.
- Stat row → three `StatCard`s (2.6). Quick actions grid → `QuickActionCard`s.
- Orders table (`tables/orders-table.tsx`): `thead` `border-b-2 border-ink`, `th` mono uppercase; rows `border-b border-line hover:bg-surface`; `divide-slate-100` / `hover:bg-slate-50` removed; `deliveryTone` map → import `StatusPill` + `deliveryTone()` from `ui` instead of the local `bg-red-50 text-red-700` literals; "View" → `link-underline` mono `view →`.
- Address cards (`shippingAddress`), change-password form → `Card` + `Field` skins; the "default" badge → `Chip`.
- Log out → `Button variant="danger" mono`.

### 2.11 Auth screens — `shared/components/auth/index.tsx`, `(auth)/*/page.tsx`

Keep the `AuthShell` two-column layout and the `Slip` concept (it is already a paper artefact and fits perfectly), but restyle:

- Left panel background → `bg-surface` with the paper grain and **one** terra blur decoration top-right (drop the coral linear gradient).
- Wordmark → dot + `font-display` (same as header).
- `Slip`: `bg-paper border border-ink-line` (drop `rounded-t-[3px] shadow-pop`), `font-mono text-[11px] uppercase tracking-[0.07em] leading-[2.1] text-ink-500`; heading `font-display text-lg`; dashed dividers → `border-dashed border-ink-200`; keep the `-rotate-[1.5deg]` and torn edge (torn edge colour → `#FAF7F0`).
- Headline → `font-display text-[34px] tracking-[-0.02em]` with a `<Serif>` word; blurb `text-ink-500`.
- Form column: `AuthHeading` h1 → `font-display text-3xl tracking-tight`; sub-line link → `link-underline text-terra-2`.
- `PasswordField`, `OtpInput`, `FormError`, `ResendLine` → square controls, mono error text; OTP boxes `w-14 h-14 border border-line bg-surface font-mono text-xl focus:border-terra` (square).
- Submit → `btn-primary btn-mono w-full justify-between` with `→`.

### 2.12 Footer — new `shared/widgets/footer/index.tsx`, mounted in `(routes)/layout.tsx`

Direct port of `Footer.astro` as an `InkSection`:

```
mt-20 lg:mt-28 border-t border-ink-line · container py-16 lg:py-20
├ CTA grid lg:grid-cols-12, pb-12 border-b border-ink-border
│   col-7: kicker "/sell · open to new shops"
│          h2 font-display text-4xl md:text-5xl lg:text-6xl text-on-ink leading-[0.95]
│             "Sell the things you<br/><Serif>make</Serif> to people who care."
│   col-5: pill "Become a seller →" (bg-paper text-ink hover:bg-terra)  ·  pill ghost "Browse shops ↗"
├ TileGrid (gap-px bg-ink-border): Products · Shops · Offers · Wishlist · Cart · Profile  (tile bg-ink hover:bg-paper hover:text-ink)
├ sign-off: font-serif italic text-[clamp(2rem,5vw,3.75rem)] "— <span.text-terra>Eshop</span>"  …  mono "fin."
└ bottom row border-t border-ink-border: "© {year} · Eshop" · "independent sellers · shipped with care" · "help ↗"
```

Uses `navItems` and static links only — no new data.

### 2.13 404 / not-found — new `app/not-found.tsx`

Port `404.astro`: sys-strip `~/404 ● status: not_found ● code: 0x194`, `marquee-title` `4<terra>0</terra>4<terra-2>.</terra-2>`, display h2 with `<Serif>not in the catalogue</Serif>`, `btn-primary` back home, `TileGrid` sitemap.

---

## 8. Phase 3 — Seller UI (ink console)

### 3.1 Shell — `shared/components/sidebar/shell.tsx`, `sidebar.tsx`, `sidebar.item.tsx`, `sidebar.menu.tsx`

- Rail: `w-[260px] border-r border-ink-border bg-ink-soft px-4 py-5` → keep width; background stays `bg-ink` (page) with **only** the border separating it — the portfolio never uses a lighter panel for chrome. Add the paper-grain via `.ink-section` class on the `<aside>`.
- Shop identity block: dot `w-2 h-2 bg-terra-2` + `font-display text-base tracking-tight text-on-ink` shop name + `font-mono text-[10px] uppercase tracking-[0.16em] text-on-ink-faint` `/seller` suffix; address line mono.
- `SidebarMenu` group title → `.kicker` variant without the line: `font-mono text-[10px] uppercase tracking-[0.18em] text-on-ink-faint px-3`.
- `SidebarItem`: replace the glowing `.marker` with the portfolio nav treatment — `font-mono text-[11px] uppercase tracking-[0.14em] px-3 py-2.5 flex items-baseline gap-2`; leading zero-padded index (`01`…) in `text-terra-2 text-[9px]` (index computed from position in the flattened NAV array); active → `text-on-ink` + `border-l border-terra-2 -ml-px` hairline (1px, no glow, no tint fill); inactive → `text-on-ink-muted hover:text-on-ink`. Icons: keep lucide at 16px, `text-on-ink-faint`, active `text-terra`.
- Foot identity: square avatar `w-8 h-8 border border-ink-border`; name `text-sm text-on-ink`; email mono faint. Log out → `font-mono text-[11px] uppercase tracking-[0.14em] text-on-ink-muted hover:text-neg` with `↗`.
- Mobile top bar: `border-b border-ink-border bg-ink/90 backdrop-blur`; brand `font-display`; menu button → two-line hamburger svg.
- Drawer: `bg-ink border-r border-ink-border`; overlay `bg-ink/80`.

### 3.2 Dashboard — `app/(routes)/dashboard/page.tsx`

- `PageShell` gets a sys-strip: `~/dashboard ● {shop.name} ● {orderList.length} orders ● {today}`.
- `PageTitle` → kicker `/overview` + `font-display text-3xl lg:text-4xl` "What's happening in your shop." with `<Serif>right now</Serif>`.
- Stat row → four `StatTile`s with `index={1..4}` (see 1.2) in a `grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-border border border-ink-border` (tile-grid, not gapped cards) — tiles `bg-ink`.
- Charts (`sales-chart.tsx`, `device-usage-pie.tsx`, `geo-map.tsx`, `recent-orders.tsx`): wrap each in `Panel` + `PanelHead` (already); Apex options → `foreColor: '#A89E8F'`, `grid.borderColor: 'rgba(250,247,240,0.06)'`, `fontFamily: 'var(--font-mono)'`, label `fontSize: '11px'`, tooltip theme dark with `background: '#262220'`. Data hue stays `#3987e5`. Recharts equivalents: `stroke="#A89E8F"`, `tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}`. Geo-map fills → `#302B27` land, `#3A3530` borders, data hue for highlights.
- Add a `Frame`-style caption under each chart: `fig.0n / orders, last 6 months`.

### 3.3 List pages (orders, all-products, all-events, discount-codes, payments, notifications)

- All go through `DataTable` → inherit 1.2.
- Toolbars: `SearchField` (square) + `Select` + `Button ghost mono` (`export csv ↓`).
- Row action buttons → `Button quiet` with `link-underline`; destructive → `danger`.
- Status columns already use `StatusPill` → square mono automatically.
- Empty states → `EmptyState` inside `border border-ink-border`.

### 3.4 Create/edit product & event forms — `create-product`, `create-event`, `edit-profile`

- Form sections → `Panel` with `PanelHead` (`title` display, `note` mono like `01 / basics`).
- `Field`, `TextArea`, `SelectField` inherit square skins.
- Image placeholders (`image-placeholder/index.tsx`): `border border-ink-border bg-ink-soft` (no radius); drop-zone glyph `text-on-ink-faint`; action buttons square `bg-ink/85 border border-ink-border`; add crosshairs when an image is present; caption strip `fig.0n / {index}`.
- Rich text editor (shared package) — see Phase 5.
- Submit row → `btn-primary btn-mono` (`Publish product →`) + `btn-ghost btn-mono` (`Save draft`).

### 3.5 Settings tabs — `modules/settings/*`

Tab rail → mono tabs with `border-b-2 border-terra-2` active (same as user profile). Each tab body → `Panel`.

### 3.6 Inbox / chat — `dashboard/inbox`, `chats/chat-input.tsx`

- Conversation list: `divide-y divide-ink-border`; row `hover:bg-ink-raised`; unread dot `w-1.5 h-1.5 bg-terra-2` (square); timestamps mono.
- Message bubbles: mine → `bg-paper text-ink border border-paper`; theirs → `bg-ink-soft text-on-ink border border-ink-border`; **no radius**; timestamps `font-mono text-[10px] uppercase text-on-ink-faint`.
- Chat input: `border-t border-ink-border`; textarea `bg-ink-soft border border-ink-border`; send → `btn-primary` square-ish (`rounded-full` is fine) with `→`.

### 3.7 Login / signup — `(routes)/login/page.tsx`, `signup/page.tsx`

Replace the neon-sign panel with the portfolio hero grammar on ink:

- Left `aside` → `ink-section` with `BlurDecoration` terra top-left and yellow bottom-right; sys-strip `~/seller ● sign-in ● status: open`; kicker `/seller portal`; h1 `font-display text-4xl lg:text-5xl leading-[0.98] text-on-ink` `Flip the sign.<br/><Serif>Start selling.</Serif>`; a `Frame` on `bg-ink-soft` with terra crosshairs showing the three feature rows (Orders / Inventory / Payouts) as `LedgerRow`s; caption `fig.01 / what you get`.
- Right column form → same as user auth (3.11) but on ink tokens.
- Delete Pacifico font, `.neon-*` classes.

Signup keeps its step indicator; restyle steps as mono `01 account → 02 shop → 03 payouts` with `text-terra-2` for the current step and hard-rule connectors.

### 3.8 Modals — `modals/*.tsx`

All four already delegate to `Modal` → inherit the header-strip variant from 1.2. Danger tone title → `text-neg`.

---

## 9. Phase 4 — Admin UI (ink console)

Structurally identical to Phase 3. Specific notes:

- `sidebar/index.tsx`, `sidebar.items.tsx`, `sidebar.menu.tsx` → same as 3.1; wordmark suffix `/ops`.
- `app/page.tsx` (login): keep the **ruled ledger paper** idea — it is on-brand — but retune: rule colour `rgba(58,53,48,0.55)` (`ink-border`), spacing 32px, and add the `sys-strip` `~/ops ● sign-in ● audit: on` above the panel; panel → `border border-ink-border bg-ink-soft` (no radius); `Field` → square; submit → `btn-primary btn-mono`.
- `dashboard/page.tsx` → stat tile-grid + charts as 3.2.
- `loggers/page.tsx` (live log console): the log stream is already mono — style the container as an ink `Frame` with crosshairs, `font-mono text-[12px] leading-[1.6]`, level tags as square `StatusPill`s (`info` neutral, `warn` warn, `error` neg), timestamps `text-on-ink-faint`. Header sys-strip: `~/logs ● ws: {connected ? 'connected' : 'retrying'} ● {count} lines`.
- `customization/page.tsx`, `management/page.tsx` → `Panel` forms.
- `users`, `sellers`, `products`, `events`, `orders`, `payments`, `notifications` → `DataTable`.

---

## 10. Phase 5 — Shared `packages/components`

These are mounted only inside seller-ui forms, but they hard-code the old dark palette. Make them **token-driven via CSS variables** so they inherit from whichever app's `:root`:

| File | Change |
|---|---|
| `input/index.tsx` | label → `font-mono text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--on-ink-muted)] mb-1.5`; control → `w-full border border-[var(--ink-border)] bg-[var(--ink-soft)] px-4 py-3 text-sm text-[var(--on-ink)] placeholder:text-[var(--on-ink-faint)] outline-none focus:border-[var(--terra)]` (drop `rounded-md`, `border-gray-700`, `text-gray-300`, `#ff6f61`) |
| `custom-properties/index.tsx`, `custom-specifications/index.tsx` | same control class; "add row" → `btn-ghost btn-mono` `+ add`; remove → mono `×` in `text-[var(--on-ink-faint)] hover:text-[var(--neg)]`; error text → mono `text-[var(--neg)]` (drop `text-red-500`) |
| `size-selector/index.tsx` | chips → square `border border-[var(--ink-border)] font-mono text-[11px] uppercase px-3 h-10 min-w-[2.75rem]`; selected → `border-[var(--on-ink)] bg-[var(--paper)] text-[var(--ink)]`; **remove** the coral glow shadow |
| `color-selector/index.tsx` | swatches stay circular (they represent physical colours); selected ring → `ring-2 ring-[var(--on-ink)] ring-offset-2 ring-offset-[var(--ink)]`; custom-colour input square |
| `rich-text-editor/index.tsx` | Quill toolbar/container CSS → `background: var(--ink-soft)`, `border-color: var(--ink-border)`, `border-radius: 0`, text `var(--on-ink)`, placeholder `var(--on-ink-faint)`, icon strokes/fills `var(--on-ink-muted)`, active button `var(--terra)`; loading skeleton → `border border-[var(--ink-border)] bg-[var(--ink-soft)]` no radius |

Add the corresponding `--on-ink*`, `--ink-*`, `--terra`, `--neg`, `--paper` variables to **user-ui's** `:root` too (it never mounts these, but harmless and future-proof).

---

## 11. Phase 6 — Motion system

### 6.1 Scroll reveal hook — new `shared/hooks/useReveal.ts` (each app)

```ts
'use client';
import { useEffect } from 'react';
export function useReveal(root?: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const scope = root?.current ?? document;
    const els = scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-revealed')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}
```

Call it once in `(routes)/layout.tsx` via a tiny `<RevealObserver />` client component that re-runs on `usePathname()` change. Data-driven grids (shelves) re-run it after their query resolves (pass `[items]` as deps in a local `useEffect` that calls the same observer) — this is presentational; no data logic changes.

### 6.2 Hero stagger

`.hero-reveal { opacity:0; animation: hero-up .7s cubic-bezier(.16,1,.3,1) forwards; animation-delay: calc(var(--reveal-d,0)*.1s + .15s); }` in `global.css`, gated by `prefers-reduced-motion: no-preference`.

### 6.3 Serif signature draw

`.serif-sig .sig-stroke path { stroke-dasharray:120; stroke-dashoffset:120; animation: sig-draw .9s cubic-bezier(.65,0,.35,1) .9s forwards; }` — used once on the storefront hero and once on each auth headline.

### 6.4 Micro-interactions (class recipes)

| Interaction | Classes |
|---|---|
| Arrow nudge → | `transition-transform duration-300 group-hover:translate-x-1` |
| Arrow nudge ↗ | `transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5` |
| Top-edge wipe | `absolute top-0 left-0 h-[2px] bg-terra w-0 group-hover:w-full transition-[width] duration-500` |
| Image zoom | `transition-transform duration-700 group-hover:scale-[1.04]` |
| Portrait duotone | `.portrait-duotone img { filter: grayscale(1) }` → hover `grayscale(1) sepia(.35) saturate(1.6) hue-rotate(-18deg)` + `scale(1.025)` — use on the hero showcase and shop banners only |
| Wordmark dot | `group-hover:scale-125 transition-transform` |
| Live dot | `relative flex h-2 w-2` + `animate-ping absolute bg-terra opacity-75` + `relative bg-terra` |
| Card lift | `.card-hover` |
| Page enter | `animate-fade-in` on `<main>` children |

### 6.5 Reduced motion

Keep the existing global `prefers-reduced-motion: reduce` override (0.01ms durations). Additionally set `.hero-reveal`, `[data-reveal]`, `.card-hover` to `opacity:1; transform:none; animation:none` under reduce (already in the CSS above).

---

## 12. Phase 7 — Sweep, QA, and accessibility

### 7.1 Automated sweeps (run per app)

```bash
# 1. Any leftover old tokens
grep -rnE '\b(coral|canvas|sunken|rule|panel|raised|ink-muted|ink-faint|font-jost|shadow-card|shadow-panel|coral-glow|neon)\b' apps/*/src --include=*.tsx
# 2. Hex literals (allow only colour swatches in products/offers COLORS arrays and chart data hue)
grep -rnE '#[0-9a-fA-F]{6}\b' apps/*/src --include=*.tsx | grep -vE 'COLORS|colors = \[|#3987e5|#256abf|#6da7ec'
# 3. Stray Tailwind palette colours
grep -rnE '\b(bg|text|border|ring|fill|divide)-(slate|gray|zinc|neutral|stone|amber|red|green|blue|yellow|orange|emerald)-[0-9]+' apps/*/src --include=*.tsx
# 4. Radius that should be zero (allow rounded-full on buttons/avatars/swatches/dots only)
grep -rnE '\brounded(-(sm|md|lg|xl|2xl|3xl|card|panel|\[.*\]))?\b' apps/*/src --include=*.tsx
# 5. Old wrappers
grep -rn 'w-\[90%\]\|w-\[80%\]' apps/user-ui/src
```

Then delete the transitional aliases from each `tailwind.config.js` (`rounded-card/panel`, `shadow-card/panel`, `coral`, `canvas`, `sunken`, `rule`, `panel`, `raised`) and the `.marker` class from each `global.css`.

### 7.2 Contrast checklist (WCAG AA)

| Pair | Ratio | Use |
|---|---|---|
| `#1A1A1A` on `#FAF7F0` | 16.3:1 | body text ✅ |
| `#4D4639` (ink-500) on `#FAF7F0` | 9.0:1 | secondary text ✅ |
| `#6E665A` (ink-400) on `#FAF7F0` | 5.6:1 | labels ✅ |
| `#9A9285` (ink-300) on `#FAF7F0` | 3.2:1 | **decorative only** — never for text under 18px |
| `#C24A1B` (terra-2) on `#FAF7F0` | 5.1:1 | text links, indices ✅ |
| `#FF6B35` (terra) on `#FAF7F0` | 2.7:1 | **fills, kickers ≥ 11px bold only**; never body-size text. Kickers pass as "large/bold incidental" but pair them with an index or heading. |
| `#FAF7F0` on `#1A1A1A` | 16.3:1 | ink surfaces ✅ |
| `#A89E8F` on `#1A1A1A` | 7.6:1 | muted on ink ✅ |
| `#FF6B35` on `#1A1A1A` | 6.1:1 | terra text on ink ✅ (this is why kickers work on ink) |
| white on `#FF6B35` (primary hover) | 2.7:1 | **hover state only**, resting state is paper-on-ink 16:1 — acceptable, matches portfolio |

### 7.3 Manual QA matrix

Run `npm run user-ui`, `seller-ui`, `admin-ui` and check at 375px, 768px, 1024px, 1440px:

- [ ] Header: nav indices, active underline, sticky bar, mobile ink takeover, search row
- [ ] Hero: stagger plays once; reduced-motion shows content immediately; showcase frame crosshairs align
- [ ] Shelves: ghost numerals don't overflow on mobile (`.ghost-index` mobile rule); reveal fires after data loads
- [ ] Product card: hover lift shows offset shadow; action buttons visible on touch; low-stock pill square
- [ ] Filters: checkbox squares render in Safari (`appearance-none` + custom check); range thumb square
- [ ] Forms: focus ring is terra-2, 2px, offset 2; error text mono; selects show custom chevron
- [ ] Modals: header strip, `esc` closes, no radius
- [ ] Footer ink band: grain visible, tiles invert on hover, sign-off serif renders italic
- [ ] Seller/admin rail: index numerals line up; active hairline sits on the left edge; drawer works
- [ ] Data tables: hard rule under `thead`; numeric columns right-aligned tabular
- [ ] Charts: axis labels mono, grid lines faint cream
- [ ] Toasts: square, mono, ink border
- [ ] No horizontal scroll anywhere (`overflow-x: clip` on `html`)
- [ ] Lighthouse a11y ≥ 95 on home, products, product detail, login, seller dashboard, admin orders

---

## 13. Component recipes

Copy-paste JSX for the most-used patterns (user-ui tokens; swap to `on-ink`/`ink-border` for consoles).

### Kicker
```tsx
<span className="kicker">/products · 128 results</span>
```

### Sys-strip
```tsx
<div className="sys-strip mb-10">
  <span className="sys-key">~/products</span>
  <span className="sys-dot">●</span>
  <span className="sys-value">128 results</span>
  <span className="sys-dot hidden sm:inline">●</span>
  <span className="sys-value hidden sm:inline">4 filters</span>
  <span className="sys-value ml-auto">page 02 / 11</span>
</div>
```

### Section header with ghost index
```tsx
<div className="relative mb-12">
  <span className="ghost-index" aria-hidden>02</span>
  <div className="relative z-10 flex items-center gap-3 mb-3">
    <span className="font-mono text-[11px] tracking-[0.18em] font-semibold text-terra-2">02</span>
    <span className="kicker">new · arrivals</span>
  </div>
  <h2 className="relative z-10 font-display text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05] max-w-3xl">
    Fresh from the <span className="font-serif italic font-normal text-terra">workshop</span>.
  </h2>
  <p className="relative z-10 mt-4 text-base lg:text-lg text-ink-400 leading-[1.5] max-w-2xl">The most recent listings across every shop.</p>
</div>
```

### Framed image with crosshairs and caption
```tsx
<div>
  <div className="relative aspect-[3/4] overflow-hidden border border-ink-line bg-surface">
    <img src={url} alt={alt} className="h-full w-full object-cover" />
    <span className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-l border-t border-terra-2" />
    <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-r border-t border-terra-2" />
    <span className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-l border-b border-terra-2" />
    <span className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-r border-b border-terra-2" />
  </div>
  <div className="mt-3 pt-2 border-t border-line flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
    <span>fig.01 / {slug}</span>
    <span className="text-terra">in stock</span>
  </div>
</div>
```

### Editorial card (product / service)
```tsx
<article className="group relative h-full flex flex-col bg-paper border border-line p-6 card-hover overflow-hidden">
  <span className="absolute top-0 left-0 right-0 h-px bg-ink-line" />
  <span className="absolute top-0 left-0 h-[2px] bg-terra w-0 group-hover:w-full transition-[width] duration-500" />
  <div className="flex items-start justify-between mb-6">
    <div className="relative w-12 h-12 grid place-items-center border border-ink-line bg-paper">
      <Icon className="w-6 h-6 text-terra-2" />
      <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-r border-b border-terra-2" />
    </div>
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra-2 font-semibold">01</span>
  </div>
  <h3 className="font-display text-xl tracking-tight leading-[1.15] mb-3">{title}</h3>
  <p className="text-sm text-ink-500 leading-[1.55] mb-6">{description}</p>
  <div className="mt-auto pt-5 border-t border-line flex flex-wrap gap-1.5">
    {tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
  </div>
</article>
```

### Tile grid (footer / sitemap / stat row)
```tsx
<ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-line border border-line">
  {items.map((it, i) => (
    <li key={it.href}>
      <Link href={it.href} className="group bg-paper hover:bg-ink hover:text-paper transition-colors duration-300 px-5 py-5 flex flex-col justify-between min-h-[88px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-terra group-hover:text-terra-2">/{String(i+1).padStart(2,'0')} ↗</span>
        <span className="font-display text-base font-medium tracking-tight">{it.label}</span>
      </Link>
    </li>
  ))}
</ul>
```

### Pill buttons
```tsx
<Link href="/products" className="btn-primary"><span>Start shopping</span><span className="font-mono text-xs">→</span></Link>
<Link href="/shops" className="btn-ghost"><span className="btn-mono">Browse shops</span><span>↘</span></Link>
```

### Ledger rows (order summary, achievements)
```tsx
<ul className="border-t border-ink-line">
  {rows.map((r, i) => (
    <li key={r.label} className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4 border-b border-line hover:bg-surface transition-colors">
      <span className="font-mono text-xs text-terra-2 tracking-[0.14em] font-semibold w-10">{String(i+1).padStart(2,'0')}</span>
      <span className="text-base text-ink-500 group-hover:text-ink transition-colors">{r.label}</span>
      <span className="figure text-sm text-ink">{r.value}</span>
    </li>
  ))}
</ul>
```

### Mono tabs
```tsx
<nav className="flex gap-1 border-b border-ink-line">
  {TABS.map(t => (
    <button key={t.id} aria-current={active===t.id ? 'page' : undefined}
      className={`-mb-px px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] border-b-2 transition-colors ${active===t.id ? 'border-terra-2 text-ink' : 'border-transparent text-ink-400 hover:text-ink'}`}>
      {t.label}
    </button>
  ))}
</nav>
```

---

## 14. Things deliberately NOT carried over

| Portfolio element | Why it stays behind |
|---|---|
| `VimMotions.astro` (j/k keyboard nav) | Interaction feature, not theme; would conflict with form inputs in a storefront |
| Mermaid zoom overlay, KaTeX, reading-progress bar, ToC sidebar | Blog-specific |
| Google Analytics / Twitter widgets | Not UI |
| `.prose` first-letter drop cap | Too literary for product descriptions; the rest of `.prose` is kept |
| Sponsor heart button | Replaced by "Become a seller" CTA slot in the same position |
| Callout colours (blue/green/amber/red) | Storefront uses the status vocabulary (`pos/warn/neg`) instead |
| `Helvetica.woff` (400 regular) if licence is a concern | Option B substitutes Inter Tight |
| Coral marker bar `.marker` | Replaced by kickers and hairline nav indicators; deleted in Phase 7 |
| Neon sign, Pacifico, coral glows | Contradict the print aesthetic |
| Coral primary buttons with `#2b0f0a` text | Primary is now ink-fill pill; terracotta is reserved for hover and accents |

---

## 15. File-by-file checklist

### user-ui
- [ ] `public/fonts/*` (copy 16 files) — Phase 0
- [ ] `src/app/layout.tsx` — fonts, body classes, toaster — Phase 0
- [ ] `tailwind.config.js` — Phase 0
- [ ] `src/app/global.css` — Phase 0
- [ ] `src/shared/components/ui/index.tsx` — Phase 1 (add Kicker, SysStrip, SectionHeader, Serif, Frame, IconTile, Chip, Ledger, TileGrid, SplitHeader, Reveal, InkSection; re-skin all existing)
- [ ] `src/shared/hooks/useReveal.ts` (new) + `RevealObserver` client component — Phase 6
- [ ] `src/app/(routes)/layout.tsx` — mount Footer + RevealObserver — Phase 2
- [ ] `src/shared/widgets/header/header.tsx` — Phase 2
- [ ] `src/shared/widgets/header/header-bottom.tsx` — Phase 2
- [ ] `src/shared/widgets/header/account-actions.tsx` — Phase 2
- [ ] `src/shared/widgets/footer/index.tsx` (new) — Phase 2
- [ ] `src/shared/modules/hero/index.tsx` — Phase 2
- [ ] `src/app/(routes)/page.tsx` — shelves + ink spotlight — Phase 2
- [ ] `src/shared/components/cards/product-card.tsx` — Phase 2
- [ ] `src/shared/components/cards/product-details.card.tsx` (quick view) — Phase 2 (inherits Modal + card skins)
- [ ] `src/shared/components/cards/shop.card.tsx` — Phase 2
- [ ] `src/shared/components/cards/stat.card.tsx` — Phase 2
- [ ] `src/shared/components/cards/quick-action.card.tsx` — Phase 2
- [ ] `src/app/(routes)/products/page.tsx` — Phase 2
- [ ] `src/app/(routes)/offers/page.tsx` — Phase 2 (+ `Container`)
- [ ] `src/app/(routes)/shops/page.tsx` — Phase 2 (+ `Container`)
- [ ] `src/shared/modules/product/product-details.tsx` — Phase 2
- [ ] `src/shared/components/image-magnifier/index.tsx` — square lens, `border-ink-line` — Phase 2
- [ ] `src/shared/components/ratings/index.tsx` — terra stars — Phase 2
- [ ] `src/app/(routes)/cart/page.tsx` — Phase 2
- [ ] `src/app/(routes)/checkout/page.tsx` + `checkout/CheckoutForm.tsx` — Stripe Elements `appearance` → `theme: 'flat'`, `variables: { colorPrimary: '#C24A1B', colorBackground: '#F2EDE0', colorText: '#1A1A1A', borderRadius: '0px', fontFamily: 'Inter' }` — Phase 2
- [ ] `src/app/(routes)/wishlist/page.tsx` — Phase 2
- [ ] `src/app/(routes)/order/[orderId]/page.tsx` — timeline markers — Phase 2
- [ ] `src/app/(routes)/payment-success/page.tsx` — marquee `paid.` — Phase 2
- [ ] `src/app/(routes)/profile/page.tsx` — Phase 2 (+ `Container`)
- [ ] `src/shared/components/tables/orders-table.tsx` — Phase 2
- [ ] `src/shared/components/shippingAddress/index.tsx` — Phase 2
- [ ] `src/shared/components/changePassword/index.tsx` — Phase 2
- [ ] `src/app/(routes)/inbox/page.tsx` + `chats/chat-input.tsx` — Phase 2 (same bubble rules as 3.6 on paper tokens)
- [ ] `src/shared/modules/seller/seller-profile.tsx` — banner `Frame`, mono tabs, `SectionHeader` — Phase 2
- [ ] `src/app/(routes)/shop/[id]/page.tsx` — Phase 2
- [ ] `src/shared/components/auth/index.tsx` — Phase 2
- [ ] `src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx` — Phase 2
- [ ] `src/shared/components/Loader/index.tsx` — default colour `text-terra-2` — Phase 2
- [ ] `src/app/not-found.tsx` (new) — Phase 2
- [ ] Sweep — Phase 7

### seller-ui
- [ ] `public/fonts/*`, `src/app/layout.tsx`, `tailwind.config.js`, `src/app/global.css` — Phase 0
- [ ] `src/shared/components/ui/index.tsx`, `ui/data-table.tsx` — Phase 1
- [ ] `src/shared/components/sidebar/{shell,sidebar,sidebar.item,sidebar.menu}.tsx` — Phase 3
- [ ] `src/app/(routes)/dashboard/page.tsx` — Phase 3
- [ ] `src/shared/components/charts/{sales-chart,device-usage-pie,geo-map,recent-orders}.tsx` — Phase 3
- [ ] `src/app/(routes)/dashboard/{orders,all-products,all-events,discount-codes,payments,notifications}/page.tsx` — Phase 3
- [ ] `src/app/(routes)/dashboard/{create-product,create-event}/page.tsx`, `edit-profile/page.tsx` — Phase 3
- [ ] `src/shared/components/image-placeholder/index.tsx` — Phase 3
- [ ] `src/shared/modules/settings/{GeneralTab,DomainsTab,WithdrawTab}.tsx`, `dashboard/settings/page.tsx` — Phase 3
- [ ] `src/app/(routes)/dashboard/inbox/page.tsx`, `chats/chat-input.tsx` — Phase 3
- [ ] `src/app/(routes)/login/page.tsx`, `signup/page.tsx`, `shared/components/auth/index.tsx` — Phase 3
- [ ] `src/shared/components/modals/*.tsx` — Phase 3
- [ ] `src/app/(routes)/order/[id]/page.tsx` — Phase 3
- [ ] `src/assests/logo.tsx` — recolour to `currentColor` — Phase 3
- [ ] Sweep — Phase 7

### admin-ui
- [ ] `public/fonts/*`, `src/app/layout.tsx`, `tailwind.config.js`, `src/app/global.css` — Phase 0
- [ ] `src/shared/components/ui/index.tsx`, `ui/data-table.tsx` — Phase 1
- [ ] `src/shared/components/sidebar/{shell,index,sidebar.items,sidebar.menu}.tsx` — Phase 4
- [ ] `src/app/page.tsx` (login) — Phase 4
- [ ] `src/app/dashboard/page.tsx` + `charts/*` — Phase 4
- [ ] `src/app/dashboard/{orders,payments,products,events,users,sellers,notifications}/page.tsx` — Phase 4
- [ ] `src/app/dashboard/loggers/page.tsx` — Phase 4
- [ ] `src/app/dashboard/{customization,management}/page.tsx` — Phase 4
- [ ] `src/app/order/[id]/page.tsx` — Phase 4
- [ ] Sweep — Phase 7

### packages/components
- [ ] `input`, `custom-properties`, `custom-specifications`, `size-selector`, `color-selector`, `rich-text-editor` — Phase 5

---

## Suggested execution order and effort

| Phase | Apps | Rough effort | Unblocks |
|---|---|---|---|
| 0 Foundations | all 3 | ½ day | everything |
| 1 Primitives | all 3 | 1 day | every page inherits ~60% of the look |
| 2 Storefront | user-ui | 2–3 days | the public face |
| 6 Motion | all 3 | ½ day | can run in parallel with 2 |
| 3 Seller | seller-ui | 1–1½ days | |
| 4 Admin | admin-ui | 1 day | |
| 5 Shared pkg | packages | ½ day | seller forms |
| 7 Sweep + QA | all 3 | 1 day | ship |

Commit after each phase per app (e.g. `ui(user-ui): phase 0 editorial foundations`). Phases 0 and 1 are safe to merge on their own because the transitional token aliases keep the old class names rendering.
