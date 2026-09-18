# Mobile rendering audit (browser-verified)

**Date:** 2026-09-18  
**Branch context:** `work/design/superdesign-v2` (audit only; no source changes)  
**Tool:** ego-browser (Chromium), CDP device metrics  
**Viewports:** 320×568, 360×800, 390×844, 430×932  
**Screenshots & raw metrics:** [`docs/mobile-audit-screenshots/`](mobile-audit-screenshots/) (`metrics.json` + PNGs)

---

## Executive summary — worst problem first

**Cause:** The live legacy HTML has **no `@media` responsive rules at all** (confirmed: zero `@media` in `legacy/*.html`). Desktop grid, padding, and navigation are applied at every width. On article pages, **`.article-layout` keeps a two-column grid (`394px` + `300px`) and `5rem` horizontal padding on a 360px-wide screen**, producing **~462px of horizontal overflow** (`scrollWidth` 822 vs `clientWidth` 360). The homepage hides overflow with `body { overflow-x: hidden }` but still lays out a **726px-wide `.cred-strip`** and **691px document `scrollWidth`**, so the fixed top bar, multi-column sections, and credential strip look clipped and “wrong” on phones.

**Viewport meta is not the bug on production** — live pages already have `width=device-width, initial-scale=1.0`. The distortion is **layout**, not missing meta.

---

## How overflow was measured

When `body { overflow-x: hidden }` is set, comparing `window.innerWidth` to `document.documentElement.scrollWidth` often **under-reports** clipping (both inflate together). This audit uses:

```text
overflowPx = document.documentElement.scrollWidth - document.documentElement.clientWidth
```

Offending nodes were found with `element.scrollWidth > clientWidth` and `getBoundingClientRect()` vs `clientWidth`.

---

## 1. Live legacy site (`https://www.drpratchaya.com/`)

**Owner:** agent updating `legacy/*.html` (or prioritise v2 cutover)

### Severity-ordered findings

| # | Severity | Surface | Viewports | Element / selector | Measured | Screenshot | Fix (CSS / markup) |
|---|----------|---------|-----------|-------------------|----------|------------|---------------------|
| L1 | **Critical** | ACL article (`/acl.html`) | 320, 360, 390, 430 | `.article-layout` | `grid-template-columns: 394px 300px`; `padding: 56px 80px`; layout box width **360px** while columns sum **694px**; **`overflowVsClient`: 462px (360vp), 502px (320vp)**; sidebar column still **300px** wide | `legacy-acl_360x800.png`, `legacy-acl_390x844.png`, `legacy-acl_360x800_v2.png` | Add breakpoint (e.g. `@media (max-width: 900px)`): ` .article-layout { grid-template-columns: 1fr; padding: 2rem 1.25rem; gap: 2rem; } ` `.article-sidebar { position: static; width: auto; } ` Reduce `.article-hero` padding from `7rem 5rem 4rem` to `5rem 1.25rem 2.5rem`. |
| L2 | **Critical** | Homepage `/` | 360, 390, 430 | `.topbar` + `.topnav` | Fixed **52px** bar; **six** desktop nav links remain `display:flex` with **28–61px** link widths, **19–38px** heights; bar content width **~691px** logic on phone; horizontal padding **`0 2.5rem` (40px)** | `legacy-home_360x800.png`, `legacy-home_390x844.png` | `@media (max-width: 768px)`: hide `.topnav` or replace with menu; reduce `.topbar` padding to `0 1rem`; stack `.topbar-r`; optional single “นัดหมาย” CTA. Ensure each control **≥ 44×44px**. |
| L3 | **High** | Homepage `/` | 360, 390 | `.cred-strip` / `.cred-item` | Strip **`scrollWidth: 726`**, viewport **`clientWidth: 390`**; flex **`justify-content: center`** places items at **negative `left`** (partially off-screen); labels **11px**, values **13px**; document **`scrollWidth: 691`** vs **`clientWidth: 360`** (**331px** overflow, clipped by `body`) | `legacy-home_360x800.png` | `@media (max-width: 768px)`: ` .cred-strip { justify-content: flex-start; overflow-x: auto; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; } ` shrink `.cred-item` padding; consider static **wrap** grid instead of marquee. Add `max-width: 100%` on strip children. |
| L4 | **High** | Homepage `/` | 360 | `.about-grid`, `.exp-grid`, `.con-cards`, `.cond-grid` | **`about-grid`**: `340px 238.945px` inside **~296px** content area; **3-column** `.exp-grid` and `.con-cards` (e.g. **194 + 95 + 77px**); **2-column** `.cond-grid` | `legacy-home_360x800.png` | Breakpoints: single column `.about-grid`, `.exp-grid`, `.con-cards`, `.cond-grid` at `max-width: 768px`; replace fixed `340px` column with `1fr`. |
| L5 | **Medium** | Homepage `/` | 360, 390 | `.hero-name`, `.hero` | **`line-height: 1.02`** on large Thai/Latin title; hero **`padding: 8rem 2rem 4rem`** + **`min-height: 100vh`** | `legacy-home_390x844.png` | Mobile hero: `padding-top: calc(52px + 2rem); min-height: auto;` on `.hero`; **`line-height: 1.15–1.2`** on `.hero-name` for Thai vowel stacks. |
| L6 | **Medium** | ACL article | all tested | `.section-block p`, `.section-block li` | Body copy **`font-size: 14px`** (below 16px phone guideline); **`line-height: 1.85`** (~26px) — ratio OK, size not | `legacy-acl_390x844.png` | `@media (max-width: 768px)`: `.section-block p, .section-block li { font-size: 16px; line-height: 1.75; }` |
| L7 | **Medium** | ACL article | all tested | `.article-hero h1`, `.section-block h2` | **`font-family: 'Playfair Display'`** — **no Thai glyphs** (legacy known issue); headings fall back inconsistently | `legacy-acl_360x800_v2.png` | Use **`Noto Serif Thai`** (or Sarabun) for Thai headings in v2; interim: stack `font-family: 'Noto Serif Thai', 'Playfair Display', serif`. |
| L8 | **Medium** | Homepage + ACL | all | `.topnav a`, `.lb`, `.btn-appt` | Tap targets **below 44×44px** (e.g. lang buttons **~36×21**, nav **~29×19**) | metrics `legacy-home` @ 390 | Increase hit padding: `min-height: 44px; min-width: 44px;` or use menu sheet. |
| L9 | **Low** | ACL article | all | `.topnav` (same as home) | Same desktop nav cramming; nav links **13px** | `legacy-acl_390x844.png` | Same topbar breakpoint as L2. |

### What is **not** broken

- **Viewport meta** on homepage and ACL: present and correct.
- **ACL** at article body level: no separate horizontal scroll bar if overflow is clipped — but **content column is unusably narrow** next to a **300px sidebar**; treat as functional breakage, not “fine because no scrollbar”.

### Homepage vs article priority

Patients landing on **`/`** see distorted hero + nav + cred strip (L2–L5). Patients opening **condition articles** hit **L1** (grid overflow) — worst single measurable defect (**462px**).

---

## 2. Superdesign canvas drafts (remote — design handoff only)

URLs: A [academic](https://p.superdesign.dev/draft/b7e1e8e4-46ae-4824-9fe9-d8d30acbfbe9), B [athlete](https://p.superdesign.dev/draft/e0b4c352-6633-4ee4-a4ab-50e0c10f8750), C [warm clinic](https://p.superdesign.dev/draft/672e4de8-4fd6-4e11-aa6b-bd12abf8962e).

At **390×844** emulation, drafts render a **390px-wide vertical stack** (mobile artboard present), but **internal content still overflows horizontally**:

| Draft | `clientWidth` | `scrollWidth` | `overflowVsClient` | Primary offender |
|-------|---------------|---------------|--------------------|------------------|
| A | 390 | **735** | **345px** | `HEADER` + `#home` (`scrollWidth` 438), `#appointment` (473) |
| B | 390 | **744** | **354px** | `HEADER`, `#home` / `.wrap` (463) |
| C | 390 | **737** | **347px** | `HEADER`, `#home` (693), `#appointment.sec` (490) |

**Note:** `window.innerWidth` reports **735–744** (layout viewport widened by overflow) while **`visualViewport.width`** is **390** — same class of bug as legacy: clipped horizontal content.

### Severity-ordered (all three drafts)

| # | Severity | Viewports | Element | Measured | Screenshot | Carry into implementation |
|---|----------|-----------|---------|----------|------------|---------------------------|
| C1 | **Critical** | 390, 360 | `header` / top nav row | **8+ links** in one row; link widths **24–56px**; header subtree **`scrollWidth` 735–744** | `canvas-a_390x844.png`, `canvas-b_390x844.png`, `canvas-c_390x844.png` | Mobile: **hamburger + sheet** or **bottom nav**; never pack 6–8 text links in **390px**. `max-width: 100%`; `overflow-x: clip` on header after fixing widths. |
| C2 | **High** | 390 | `#home` / hero blocks | Section **`scrollWidth` up to 693** (draft C) inside **390px** frame | same | Hero CTAs and credential row must **wrap** or **scroll inside** a padded container; no fixed desktop widths. |
| C3 | **Medium** | 390 | Lang `button` (TH/EN) | **~45×27px** | metrics `canvas-a` @ 390 | **Min 44×44px** touch targets. |
| C4 | **Medium** | 390 | `#nav-brand` / links | Brand **98×32px**; several nav links **&lt; 44px** wide | metrics `canvas-a` | Increase padding; consider icon + label stack on mobile. |
| C5 | **Low** | 390 | Long page stack | Total height **~10–17k px** (desktop + mobile comps stacked in viewer) | `canvas-a_390x844_fullpage.png` (if generated) | Implementation ships **one** responsive site, not stacked artboards. |

### Draft-specific notes

- **A:** First `.fade` block **390×1319** — mobile hero exists, but header overflow still drives **`scrollWidth` 735**.
- **B:** `.wrap.fade` hero **390×941** — same header issue.
- **C:** Extra **“นัดหมาย”** in header increases crowding (8 top links).

**Do not copy** draft CSS that yields **`scrollWidth` &gt; `clientWidth`** on a 390px device.

---

## 3. New Astro homepage (local dev)

**Tested:** Yes — `npm run dev` served **`http://localhost:4321/`** (later duplicate on **4322** during parallel runs). Homepage returned **200** at 320–430 widths.

**Owner:** Astro implementer (`src/`)

### Severity-ordered

| # | Severity | Viewports | Element / selector | Measured | Screenshot | Requirement |
|---|----------|-----------|-------------------|----------|------------|-------------|
| A1 | **High** | 390, 430 | `.wordmark` (`header .wordmark`) | Tap box **132×23px** (height **&lt; 44px**) | `astro-home_390x844.png`, `astro-home_390x844_full.png` | `.wordmark { min-height: 44px; justify-content: center; }` or expand padding on the `<a>`. |
| A2 | **Medium** | 390, 430 | `.lang-switch a` | **27×44** and **24×44** — width under 44px | metrics `astro-home` @ 430 | `min-width: 44px; justify-content: center;` on lang links. |
| A3 | **Medium** | 390 | `header a` at **x ≈ 346** | Several links measure **4px wide × 44–99px tall** (desktop nav leakage or panel geometry) | browser eval @ 390 | Verify **` .nav-desktop { display: none }`** below 1024px and that closed **`details.nav-mobile`** does not leave focusable 4px slivers; run the same rect audit after CSS changes. |
| A4 | **Low** | 320–430 | Meta / nav copy | **12–14px** labels (`.wordmark-role` hidden &lt;480px — OK); panel links **14px** | metrics | Keep **≥ 16px** for patient-facing body; **≥ 14px** acceptable only for tertiary meta with **1.5+ line-height**. |
| A5 | **Info (pass)** | 320–430 | Page shell | **`scrollWidth === innerWidth`** (no doc overflow); **`main` `padding-bottom: 68px`** vs **`.dock` height 57px** | metrics | Preserve **`--dock-height`** reservation (`BaseLayout.astro` / `ContactDock.astro`). |
| A6 | **Info (pass)** | 320–430 | Thai body sample | **`font-size: 16px`**, **`line-height: ~28px` (~1.75)** | metrics | Keep for Thai paragraphs. |

### Astro verdict

**Structurally sound** (viewport, dock padding, no document-level horizontal overflow). Remaining work is **header tap targets** and confirming **mobile menu vs desktop nav** geometry at 360–430px.

---

## 4. Could not check / limitations

- **Production Worker URL** (`*.workers.dev`) — not in scope; owner asked for **`www.drpratchaya.com`** only.
- **Superdesign** — drafts are read-only; fixes are spec-only.
- **Astro** — dev server was intermittent (port conflict **4321/4322**); audit used successful **200** responses; re-run `./docs/mobile-audit-screenshots/metrics.json` script if homepage changes heavily.
- **Image captioning** — PNGs stored for human review; automated vision was unavailable in this run.
- **Other legacy articles** (`rotator-cuff.html`, etc.) — not fetched; they share the same article CSS as ACL → **expect same L1/L6/L7**.

---

## 5. Project mobile rules (from this audit)

1. **Every page:** `@media` breakpoints required — legacy proved **zero breakpoints ⇒ 462px overflow** on clinical content.
2. **Measure overflow with `clientWidth` vs `scrollWidth`**, not `innerWidth` alone, when `overflow-x: hidden` is used.
3. **Viewport meta:** keep `width=device-width, initial-scale=1`; still insufficient without responsive CSS.
4. **Thai body text:** **≥ 16px**, **`line-height: 1.75`** on phones; headings using Latin-only display fonts must include **Noto Serif Thai** (or equivalent).
5. **Tap targets:** **44×44 CSS px** minimum for nav, lang switch, and primary CTAs.
6. **Navigation:** max **~4 visible primary actions** in a 390px top bar; use **menu sheet** + fixed **contact dock** pattern (Astro dock model is correct).
7. **Grids:** any column track **&gt; 50vw** must collapse to **`1fr`** by **768px** (articles: sidebar below content, not beside).
8. **Horizontal marquees / cred strips:** `justify-content: flex-start` + intentional scroll, or wrap; never **`center` + nowrap** wider than the viewport inside a clipped body.
9. **Padding:** avoid **`5rem` (80px) inline padding** on layouts below **768px**; use **`1.25rem`** sides.
10. **Acceptance test before merge:** at **360×800** and **390×844**, assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` on `/`, one condition page, and Astro home.

---

## Report contract (short)

| Surface | Worst cause | Status |
|---------|-------------|--------|
| **Live legacy** | No responsive CSS; article **2-col grid + 80px padding** | **Broken** — fix L1–L2 urgently |
| **Canvas drafts** | **735px-class header** inside 390 frame | **Broken** — do not implement literally |
| **Astro home** | No doc overflow; **small header tap targets** | **Mostly OK** — polish A1–A3 |

**First fix for patients today:** `legacy/acl.html` (and siblings) **`.article-layout` single column** + **`legacy/index.html` mobile topbar** + **`.cred-strip`**.
