# drpratchaya.com v2 — design specification

| Field | Value |
|--------|--------|
| Status | Approved for implementation |
| Date | 2026-09-18 |
| Owner | Repo owner (นพ.ปรัชญา มานพ / site operator) |
| Replaces | Five-page static HTML site (`legacy/*.html`) |

This document is the single source of truth for v2. Implementers must not guess launch facts marked **`TODO(owner)`**; only the repo owner may replace those placeholders in `src/config/site.config.ts`.

---

## 1. Goal

Build a new website for **นพ.ปรัชญา มานพ (Dr. Pratchaya Manop)**, **ศัลยแพทย์ออร์โธปิดิกส์ เวชศาสตร์การกีฬา**, replacing the current five-page static site.

| Requirement | Detail |
|-------------|--------|
| Primary language | Thai (`/`, Thai routes) |
| Secondary language | English (`/en/`, English routes) |
| Scope | Public marketing site, condition library, news/blog, hybrid multi-location appointment requests with admin confirmation, admin CMS for non-clinical posts, contact, PDPA compliance, SEO and AEO |
| Out of scope for v2 launch | Patient accounts, passkeys (admin), hospital EMR integration, automated slot sync with hospital systems |

**Success criteria at launch**

1. Site served on Worker `drpratchaya` with custom domains `www.drpratchaya.com` (canonical) and `drpratchaya.com` (301 → www) resolving correctly.
2. All legacy `.html` URLs 301 to clean paths.
3. Booking flow creates **`pending`** appointments only; acknowledgement copy never implies confirmation.
4. Clinical condition content matches approved legacy text (no unauthorized clinical edits).
5. WCAG 2.2 AA on shipped templates; LCP &lt; 1.5s on 4G for representative content pages.

---

## 2. Current production reality (baseline)

These facts constrain migration and must remain accurate in agent docs:

| Item | Fact |
|------|------|
| Cloudflare Pages | **None** on account `5093b764ea33977e138b71627193ea52` |
| Runtime | Worker **`drpratchaya`**, id `b09044d0e1de4226b14f9fabef685816`, created 2026-07-07 |
| Deploy history | Manual upload; **not** repo CI today |
| Live URL | `https://drpratchaya.pratchaya-mnop.workers.dev/` |
| Domain DNS | `drpratchaya.com` registered Namecheap (expires 2029-07-07); NS on Cloudflare; **no A/CNAME** — apex and www do not resolve |
| Legacy canonical | Every legacy page uses `https://www.drpratchaya.com/...` |
| Wrangler identity | Pin **`account_id`: `5093b764ea33977e138b71627193ea52`**; CLI may auth as `sizssy@gmail.com` with access to two accounts |

**Target state:** GitHub Actions runs `astro build` and **`wrangler deploy`** on merge to **`main`**, deploying to Worker name **`drpratchaya`** (preserve workers.dev URL and existing worker id where Cloudflare allows).

---

## 3. Stack and architecture

### 3.1 Framework and build

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Astro 5** | SSG-first |
| Output | **`output: 'static'`** in `astro.config.*` | Default prerender `true` |
| Adapter | **`@astrojs/cloudflare`** | Worker serves `dist/` static assets + server routes |
| SSR routes | `export const prerender = false` | Only booking, admin, and `/api/*` |
| CSS | **Tailwind v4** via **`@tailwindcss/vite`** | Design tokens in CSS variables |
| Language | **TypeScript `strict`** | `astro check` + `tsc --noEmit` in CI |
| Validation | **Zod** (recommended) | All external input at API boundaries |

### 3.2 Why static-first

1. **SEO:** Condition and marketing pages are the entire long-tail search surface; they must be plain static HTML with no Worker compute per request.
2. **Performance:** Static assets from the edge avoid Worker CPU, cold starts, and unnecessary latency on the majority of traffic.
3. **Cost and simplicity:** Only interactive surfaces (booking, admin, APIs) pay SSR cost.

```text
Visitor
  → Cloudflare Edge
  → Worker drpratchaya
       ├─ Static asset match (/, /conditions/*, /en/*, fonts, images) → ASSETS binding, no SSR
       └─ SSR routes (/book/*, /admin/*, /api/*) → D1, KV, R2, Queues, AI bindings
```

### 3.3 Environments

| Environment | Worker name | Purpose |
|-------------|-------------|---------|
| Production | `drpratchaya` | Live site + production bindings |
| Staging | `drpratchaya-staging` (create) | Pre-merge QA; separate D1 database; hostname **`staging.drpratchaya.com`** once DNS exists |

Staging is required before launch for booking and admin testing; production deploy remains **`main`** merge only.

---

## 4. Cloudflare bindings

Pin **`account_id`: `5093b764ea33977e138b71627193ea52`** in `wrangler.jsonc` for every environment.

| Binding | Resource name | Purpose |
|---------|---------------|---------|
| **D1** | `drpratchaya-db` | Relational data: locations, schedules, slots, appointments, posts, admin users, audit, consent, contact, newsletter, testimonials |
| **KV** | `SESSIONS` | Admin session tokens; 6-digit OTP payloads; rate-limit counters — use **KV TTL** for expiry (no sweep cron for OTP) |
| **KV** | `CACHE_TAGS` | Monotonic tag versions; bump on publish to invalidate cached SSR/HTML fragments |
| **R2** | `drpratchaya-media` | Blog images, rendered OG images, rehabilitation PDFs |
| **Queue** | `notify` | Outbound email and LINE; retries; **dead-letter queue** so HTTP handlers never block on SMTP/API latency |
| **Cron Triggers** | (see §4.1) | Scheduled jobs |
| **Vectorize** | `drpratchaya-embeddings` | Article embeddings for search and `/api/ask` |
| **Workers AI** | Embedding model for Vectorize ingest; text-generation model for `/api/ask` — model IDs recorded in `wrangler.jsonc` `[ai]` binding at provision time | Generate embeddings; RAG answers grounded on retrieved chunks only |
| **Turnstile** | site + secret keys via secrets | Booking, OTP request, contact forms |
| **Email Sending** | Cloudflare Email Sending binding | OTP, acknowledgements, confirmations with `.ics` |
| **Browser Rendering** | binding | Render OG image templates once per slug; store PNG/WebP in R2 |
| **Analytics Engine** | dataset for site metrics | Cookieless pageviews and booking-funnel events |

**Email fallback:** If Email Sending is unavailable or bounces persist during rollout, document and implement **Resend** as fallback inside the `notify` consumer only (API key via `wrangler secret put`). Production primary remains Email Sending.

**Operational prerequisites (owner / infra agent, before R2 uploads work):**

1. **Enable R2** once in the Cloudflare dashboard for account `5093b764ea33977e138b71627193ea52`.
2. **Confirm Workers Paid ($5)** is billed on **`5093b764ea33977e138b71627193ea52`**, not the other account reachable from `sizssy@gmail.com`.

Secrets (non-exhaustive): `TURNSTILE_SECRET_KEY`, admin session signing key, magic-link signing key, LINE channel token, optional `RESEND_API_KEY`, TOTP encryption key if stored. **Never commit.**

### 4.1 Cron triggers

| Schedule (UTC) | Job | Action |
|----------------|-----|--------|
| Daily | Appointment reminders | Email/LINE patients with **`confirmed`** appointments in next 24 hours |
| Daily | No-show | Mark **`confirmed`** appointments past slot end + grace as **`no_show`** per admin-configured rule |
| Daily | Slot materialisation | Ensure slots exist **8 weeks** ahead per active templates minus exceptions |
| Daily | Data retention | Delete guest contact fields **12 months** after appointment **`completed`**, **`cancelled`**, or **`no_show`** (see PDPA) |
| Hourly or daily | Sitemap | Regenerate sitemap payload (SSR route or R2 snapshot — implementer chooses; must include D1 posts) |
| Weekly | Digest | Email doctor summary: pending requests, upcoming week, funnel stats |

Cron handlers enqueue work to **`notify`** where email/LINE is required; do not send mail inside cron CPU beyond enqueue.

### 4.2 Explicitly rejected: Durable Object for double booking

**Do not** implement a Durable Object for appointment uniqueness in v2.

**Reason:** SQLite on D1 supports a partial unique index; simpler, cheaper, adequate for human-confirmed hybrid booking.

```sql
CREATE UNIQUE INDEX uq_slot_active ON appointments(slot_id)
  WHERE status IN ('pending','confirmed');
```

**Future option:** A Durable Object may be added later **only** for a soft **5-minute hold** on a slot while the patient completes the form (not for long-term uniqueness).

---

## 5. Data model (D1)

Migrations live in `migrations/*.sql`, applied with `wrangler d1 migrations apply`.

### 5.1 Core entities

**locations**

- `id`, `slug`, `name_th`, `name_en`, `address_th`, `address_en`, `map_url`, `phone`, `booking_mode` **`slots` | `external`**, `external_booking_label_th/en`, `external_booking_url`, `sort_order`, `is_active`, timestamps

**schedule_templates**

- Per location: day of week, start time, end time, slot duration minutes, effective date range

**schedule_exceptions**

- Location-level closures (leave, conference travel): date or range, reason (admin-only note)

**slots**

- `id`, `location_id`, `starts_at`, `ends_at`, `is_bookable` (generated; may flip false when taken)

**appointments**

- `id`, `slot_id` (nullable for external-mode inquiries if ever added — v2 booking with slots requires slot), `location_id`, patient name, phone, email, problem summary (text), `status` **`pending` | `confirmed` | `declined` | `cancelled` | `completed` | `no_show`**, `magic_token_hash`, consent reference, locale, timestamps

**posts** (non-clinical CMS)

- `id`, `slug`, `title_th`, `title_en`, `body_th`, `body_en`, `excerpt`, `status` draft/scheduled/published, `published_at`, SEO fields, `embedding_version`

**post_media**, **admin_users**, **audit_log**, **consent_log**, **newsletter_subs**, **testimonials**, **contact_messages** — as needed for admin panel and contact queue (schema detail left to migrations; all PII fields documented in PDPA section).

### 5.2 Appointment status semantics

| Status | Meaning | Patient-facing copy |
|--------|---------|---------------------|
| `pending` | Request submitted; awaits admin | **Must** say request received, **not** confirmed |
| `confirmed` | Admin approved | Include hospital-specific next steps + `.ics` |
| `declined` | Admin rejected | Polite decline + alternate CTA |
| `cancelled` | Patient or admin cancelled | Confirmation of cancellation |
| `completed` | Visit occurred | Starts retention clock |
| `no_show` | Did not attend | Admin-only notes optional |

---

## 6. Booking (hybrid, multi-location)

### 6.1 Problem statement

The doctor practises at **multiple hospitals**. **No hospital exposes a booking API.** The site owns its schedule; **every appointment requires human confirmation** by admin.

### 6.2 Location modes

| Mode | UI behaviour |
|------|----------------|
| **`slots`** | Show generated slots; patient can submit a **request** for a slot |
| **`external`** | **No slots.** Show card with hospital’s official booking channel (phone, URL, LINE as configured). Do not accept slot selection |

### 6.3 Admin setup flow

1. Create **Location** records (name, address, map link, phone, booking mode).
2. Define **Schedule templates** per location (recurring hours + slot length).
3. Define **Exceptions** for leave and conference travel.
4. Cron materialises **slots** **8 weeks** ahead into D1.

### 6.4 Patient flow (slots locations)

Steps are **four UI steps** minimum:

1. **Choose location** (only `slots` locations proceed; others stop at external card).
2. **Choose date/time** from available slots.
3. **Details:** name, phone, email, brief problem description, **consent checkbox** (links to privacy policy version).
4. **Verify:** Turnstile → request **6-digit OTP** → enter OTP (KV TTL **10 minutes**).

On successful OTP:

- Insert appointment with status **`pending`**.
- Enqueue **`notify`**: email + LINE to doctor; **acknowledgement email to patient**.

**Acknowledgement copy (mandatory):**

- MUST state the request was **received** and is **awaiting staff confirmation**.
- MUST NOT use phrases implying the appointment is fixed (e.g. avoid “นัดหมายสำเร็จ”, “confirmed”, “see you then” before admin confirms).
- This requirement is **non-negotiable**; it is the most common failure mode in clinic booking products.

### 6.5 Admin actions

- **Confirm:** set `confirmed`; send email with **`.ics`** attachment and **location-specific next steps** (which hospital, where to register, documents — content from config, `TODO(owner)` where unknown).
- **Reschedule:** move slot; notify patient.
- **Decline:** set `declined`; notify patient.

### 6.6 Patient self-service (no account)

- After booking, patient receives **signed magic link** (HMAC or similar, secret in Wrangler) to **view / cancel / request reschedule** without password.
- Magic links expire per policy (implementer: default **30 days** after appointment date unless superseded by owner).

### 6.7 Rate limiting

- OTP issuance: limit per **IP** and per **phone/email** using KV counters with TTL.
- Booking POST: Turnstile required.

---

## 7. Authentication and sessions

### 7.1 Admin

| Requirement | Implementation |
|-------------|------------------|
| Credentials | Email + password |
| Password storage | **PBKDF2-HMAC-SHA256**, **600,000** iterations, via **Web Crypto** |
| Second factor | **TOTP mandatory** before session issued |
| Session | Random token in **KV `SESSIONS`**, TTL sliding |
| Cookie | `HttpOnly; Secure; SameSite=Lax` |
| Audit | Append-only **`audit_log`** row for every mutating admin action |
| Login abuse | Rate limit login route via KV |
| Passkeys | **Later phase** — not v2 launch |

### 7.2 Patients

- **No accounts.**
- **OTP:** 6 digits, **10-minute** KV TTL.
- After OTP verification for booking, issue **magic link** token for management.

---

## 8. Content sources (two boundaries)

| Source | Location | Change process | Content type |
|--------|----------|----------------|--------------|
| **Clinical conditions** | `src/content/conditions/*.md` | **Git PR only**, owner review | Four existing condition articles (~legacy HTML); agents may not alter clinical claims |
| **News / general** | D1 **`posts`** | Admin publish instantly | No deploy required |

**Rationale:** Admin can update news freely; **clinical claims stay behind PR review**.

Migration: convert legacy HTML (`legacy/acl.html`, `rotator-cuff.html`, `shoulder-dislocation.html`, `patellofemoral.html`) to Markdown preserving Thai/English medical text verbatim.

---

## 9. SEO

### 9.1 Domains and redirects

- Attach **`www.drpratchaya.com`** and **`drpratchaya.com`** to Worker `drpratchaya`.
- **301** apex → **www** (canonical host remains **www**, matching legacy canonical).
- **301** map:

| Legacy | New |
|--------|-----|
| `/index.html`, `/` | `/` |
| `/acl.html` | `/conditions/acl` (exact slug implementer aligns with content collection) |
| `/rotator-cuff.html` | `/conditions/rotator-cuff` |
| `/shoulder-dislocation.html` | `/conditions/shoulder-dislocation` |
| `/patellofemoral.html` | `/conditions/patellofemoral` |

### 9.2 Internationalisation

- **Real routes:** `/` (Thai) and `/en/` (English) — separate documents.
- **`hreflang`** links on every paired page.
- **Remove** legacy pattern: both languages in one DOM toggled via CSS (`.th` / `.en` + `body.is-en`).

### 9.3 Fonts

- **Self-host** subset **woff2**: **Noto Serif Thai** (headings), **IBM Plex Sans Thai** (body), **IBM Plex Mono** (numerals, times, codes).
- **Do not** load Google Fonts on production pages.

### 9.4 Crawling and feeds

- Dynamic **`sitemap.xml`** including static routes + published D1 posts.
- **`robots.txt`** allowing public routes; disallow `/admin`.
- **RSS** for published posts.

### 9.5 Social and structured data

- **Open Graph** and **Twitter** cards on all public pages.
- **`og:image`:** generated per URL via Browser Rendering → cache R2 (legacy site has **no** `og:image`).
- **`og:locale`** / **`og:locale:alternate`** on **all** pages (legacy only had this on `acl.html`).
- **JSON-LD** types as applicable: **Physician**, **MedicalBusiness** (per location), **MedicalWebPage**, **MedicalCondition**, **MedicalProcedure**, **FAQPage**, **BreadcrumbList**, **Article**.

### 9.6 Performance

- **LCP target:** &lt; **1.5s** on **4G** for representative condition pages (hero text or primary image — measure in Lighthouse CI).

---

## 10. AEO (answer engines)

### 10.1 On-page patterns

- **Short-answer block** at top of every article: **40–60 words**, Thai on Thai pages, English on English pages; plain language summary answer engines can quote.
- **FAQPage** JSON-LD on every page with an FAQ section (legacy FAQs exist without schema).

### 10.2 Machine-readable corpora

| Asset | Path |
|-------|------|
| LLM index | `/llms.txt` |
| Full corpus index | `/llms-full.txt` |
| Article mirror | `/{slug}.md` for each public article/post slug |

### 10.3 Speakable

- **`speakable`** schema on key headings/short-answer blocks where Google guidelines apply.

### 10.4 Crawler policy

- Cloudflare **AI Crawl Control:** allow **GPTBot**, **ClaudeBot**, **PerplexityBot** to index public content.

### 10.5 `/api/ask`

- **POST** (or GET with strict limits — prefer POST) JSON API.
- Pipeline: embed query → **Vectorize** nearest chunks from **approved corpus only** (condition Markdown + published posts).
- **Workers AI** composes answer **strictly from retrieved chunks**.
- If similarity below threshold or no chunks: respond that the site **does not have grounded information**, and direct user to **book** or **contact** — **never invent medical claims**.

---

## 11. Design system

### 11.1 Direction (locked)

**Academic / journal** — columnar layout, generous whitespace, hairline rules, serif Thai headings; imagery restrained and precise. (Superdesign explorations may exist, but **this direction ships**.)

### 11.2 Tokens (locked)

| Token | Value | Use |
|-------|-------|-----|
| `--ink` | `#0f2833` | Structure, footer |
| `--surface` | `#faf8f4` | Page background |
| `--teal` | `#1f93b0` | Primary accent |
| `--teal-deep` | `#146a80` | Links, primary buttons |
| `--teal-wash` | `#eef6f7` | Cards |
| `--gold` | `#ab8a3d` | **IOC / FIFA / SEA Games credentials only** — not general emphasis |
| `--text` | `#16262f` | Body |
| `--text-2` | `#5b6b73` | Secondary |
| `--border` | `#e3ddd2` | Hairline dividers |

**Typography**

| Role | Family | Weights |
|------|--------|---------|
| Headings | Noto Serif Thai | 600, 700 |
| Body | IBM Plex Sans Thai | 400, 500, 600 |
| Numerals / mono | IBM Plex Mono | 400 |

**Thai body `line-height`:** default **1.75** minimum (stacked vowel marks).

**Decoration:** **1px hairline rules**; avoid drop shadows for structure.

### 11.3 Bug fix from legacy

Legacy article pages set headings in **Playfair Display**, which **has no Thai glyphs**; Thai headings silently fell back to system UI fonts. v2 **must not** use Playfair for Thai headings.

---

## 12. PDPA (Thailand)

| Rule | Detail |
|------|--------|
| Collect | Name, contact details, brief problem description only for booking/contact |
| Do not collect | Test results, medical imaging, diagnosis codes from hospitals |
| Consent | Log **`consent_log`**: who, when, policy **version string**, purpose |
| Retention | Cron deletes guest contact details **12 months** after appointment reaches a terminal state (`completed`, `cancelled`, `no_show`, `declined`) |
| Data subject rights | Public route (e.g. `/privacy/request-deletion`) submitting email + request; admin verifies out of band |
| Policy | Published **`/privacy`** (Thai + English) before booking goes live |

No patient-identifying data in git, Analytics Engine payloads, or logs beyond what PDPA allows for operational need.

---

## 13. Accessibility

- **WCAG 2.2 Level AA** for all templates.
- Verify **contrast** for every **token pair actually used** in UI (including `--gold` on `--surface` — if fail, gold is decorative border only, not text).
- Visible **focus** indicators on all interactive controls.
- Honour **`prefers-reduced-motion`** (disable non-essential animation).
- Thai typography: tuned line-height and spacing, not copied from English defaults.

---

## 14. CI/CD

On **pull request:** install, `astro check`, `tsc --noEmit`, `astro build`, deploy preview Worker (optional comment URL).

On **merge to `main`:** `wrangler deploy` to **`drpratchaya`** with production bindings.

D1 migrations run as a documented manual or CI step **before** deploy when schema changes.

---

## 15. Unknown facts (launch blockers)

The repo owner must supply the following. Until then, use **`TODO(owner)`** in **`src/config/site.config.ts`** only (single config source).

| # | Unknown | Owner action |
|---|---------|--------------|
| 1 | Hospitals/clinics where the doctor practises | Names, addresses, map links |
| 2 | Which locations use **`slots`** vs **`external`** | Per-location `booking_mode` |
| 3 | Consultation days and hours per location | Schedule templates |
| 4 | Appointment phone number | Public CTAs |
| 5 | LINE Official Account (ID / URL) | CTAs and doctor notifications |
| 6 | High-resolution doctor photo | Hero/about; legacy uses `src/assets/dr-pratchaya.jpg` at low prominence |
| 7 | **Hospital name** for role described as “staff orthopaedic surgeon and clinical instructor from 2022” | Legacy copy references “Orthopedic Resident Training Program” **without naming the hospital** — owner must provide official name for credentials/NAP |

**Do not fabricate** placeholders that look like real hospital names.

---

## 16. Acceptance checklist (implementers)

- [ ] Worker deploy pinned to account `5093b764ea33977e138b71627193ea52`
- [ ] Static condition pages prerender; booking/admin SSR only
- [ ] Partial unique index `uq_slot_active` applied
- [ ] Pending acknowledgement copy reviewed for no false confirmation
- [ ] `/` and `/en/` with hreflang; no CSS language toggle
- [ ] Self-hosted fonts; no Google Fonts
- [ ] sitemap, robots, RSS, OG images, JSON-LD types listed in §9
- [ ] `llms.txt`, `llms-full.txt`, `/{slug}.md`, `/api/ask` grounded behaviour
- [ ] PDPA privacy page, consent logging, retention cron
- [ ] WCAG 2.2 AA spot-check + LCP budget on 4G
- [ ] All `TODO(owner)` items documented for owner fill-in

---

## Appendix A — Legacy content inventory

| File | Topic |
|------|-------|
| `legacy/index.html` | Home (CSS bilingual toggle) |
| `legacy/acl.html` | ACL |
| `legacy/rotator-cuff.html` | Rotator cuff |
| `legacy/shoulder-dislocation.html` | Shoulder dislocation |
| `legacy/patellofemoral.html` | Patellofemoral |

Canonical URLs in legacy all point to **`https://www.drpratchaya.com/`** (non-resolving at time of spec).

---

## Appendix B — Notify queue message types

| Event | Patient | Doctor |
|-------|---------|--------|
| Request created (`pending`) | Acknowledgement (**not confirmed**) | Email + LINE alert |
| Confirmed | Email + `.ics` + next steps | Optional copy |
| Declined | Email | — |
| Rescheduled | Email | LINE optional |
| Cancelled | Email | LINE optional |
| Reminder 24h | Email + LINE | — |
| Weekly digest | — | Email |

All sends go through **`notify`** consumer with retry + DLQ.
