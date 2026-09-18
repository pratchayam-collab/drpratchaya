# Cloudflare infrastructure bindings (provisioned 2026-09-18)

**Account (pin in `wrangler.jsonc`):** `5093b764ea33977e138b71627193ea52` (`Pratchaya.mnop@gmail.com`)

All resources below were created with `CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52` and verified via Wrangler / Cloudflare MCP against this account.

**Zone:** `drpratchaya.com` — `zone_id` `1f8927867b53110d7ce680a7ef7e83a4`

---

## Custom domains & DNS (Task 1)

| Hostname | Status | Details |
|----------|--------|---------|
| `www.drpratchaya.com` | **Live** | Worker custom domain attached to script `drpratchaya` (production). |
| `drpratchaya.com` (apex) | **Deliberately deferred** | Does not resolve today; will be attached with v2 deploy + Astro apex→www 301 (see blockers). |

### Worker custom domain (`www`)

| Field | Value |
|-------|-------|
| Resource type | Workers Custom Domain |
| Hostname | `www.drpratchaya.com` |
| Domain record id | `faac218d0e9a792e53d4784d8e20b03e7cd94ffb` |
| Worker service | `drpratchaya` |
| Worker id | `b09044d0e1de4226b14f9fabef685816` |
| Environment | `production` |
| Edge certificate id | `69095fcd-f0b1-445d-addf-541b28f02039` |
| `wrangler.jsonc` | Route/custom domain entry: `www.drpratchaya.com` → `drpratchaya` with `custom_domain: true` (in top-level `routes[]`) |

**Config sync (2026-09-18):** All production bindings below are transcribed in **`wrangler.jsonc`** only (no duplicate `wrangler.astro.jsonc`). Astro adapter 14 reads the same file; `main` is `@astrojs/cloudflare/entrypoints/server`, static assets `./dist/client/`.

**`SESSION` vs `SESSIONS`:** Application and Astro KV sessions share binding **`SESSIONS`** (namespace `3a5594ff…`). `astro.config.mjs` sets `sessionKVBindingName: 'SESSIONS'` so the adapter does not auto-provision a separate **`SESSION`** namespace. Use distinct key prefixes for Astro session keys vs admin/OTP/rate-limit keys.

### Verified HTTP headers (2026-09-18, after attach)

**`curl -sI https://www.drpratchaya.com/`**

```http
HTTP/2 200
date: Fri, 18 Sep 2026 14:49:57 GMT
content-type: text/html
cf-cache-status: HIT
cache-control: public, max-age=0, must-revalidate
server: cloudflare
cf-ray: a3d12906fed76522-BKK
alt-svc: h3=":443"; ma=86400
```

**`curl -sI https://drpratchaya.com/`**

Apex does not resolve yet (`curl` exit code 6 — could not resolve host). **Do not** attach apex to the legacy Worker now; see § Blocked.

---

## D1

| Name | UUID (`database_id`) | Binding name | Environment | Purpose |
|------|----------------------|--------------|-------------|---------|
| `drpratchaya-db` | `d0b58331-4b71-4d25-8255-2c779a7a753d` | `DB` | production | App relational data (appointments, posts, admin, consent, etc.) per design spec §4 |
| `drpratchaya-db-staging` | `8916efda-6509-4206-a690-93a1b5e2a178` | `DB` | staging (`env.staging`) | Isolated staging database; no migrations applied yet |

```jsonc
// production
{ "binding": "DB", "database_name": "drpratchaya-db", "database_id": "d0b58331-4b71-4d25-8255-2c779a7a753d" }

// staging
{ "binding": "DB", "database_name": "drpratchaya-db-staging", "database_id": "8916efda-6509-4206-a690-93a1b5e2a178" }
```

---

## KV

| Title | Namespace id | Binding | `preview_id` (local dev) | Environment | Purpose |
|-------|--------------|---------|--------------------------|-------------|---------|
| `SESSIONS` | `3a5594ff17c54fb09b2eb0a318be17c6` | `SESSIONS` | `55a59e309b124ea8bb3444d18d52aaf5` | production (+ preview for `wrangler dev`) | Admin sessions, OTP payloads, rate limits (KV TTL) |
| `CACHE_TAGS` | `fcd1538406864744a3091cd705ef7624` | `CACHE_TAGS` | `65af1ac07d89421b83cdaa11977c483e` | production (+ preview for `wrangler dev`) | Cache tag versions for publish invalidation |

```jsonc
{
  "binding": "SESSIONS",
  "id": "3a5594ff17c54fb09b2eb0a318be17c6",
  "preview_id": "55a59e309b124ea8bb3444d18d52aaf5"
}
{
  "binding": "CACHE_TAGS",
  "id": "fcd1538406864744a3091cd705ef7624",
  "preview_id": "65af1ac07d89421b83cdaa11977c483e"
}
```

---

## Queues

| Queue name | Queue id | Binding / role | Environment | Purpose |
|------------|----------|----------------|-------------|---------|
| `notify` | `07f03d86eb414a0c89731179e8c0ad9e` | Producer binding `NOTIFY` (recommended) | production | Async email/LINE delivery from HTTP handlers |
| `notify-dlq` | `5ab76138a001462abbd4a65cea4e75be` | Referenced as `dead_letter_queue` on the **consumer** | production | Failed notify jobs after max retries |

Both queues exist; **DLQ wiring is not on the queue object itself** — set `dead_letter_queue: "notify-dlq"` on the `notify` **consumer** in `wrangler.jsonc` when the consumer Worker is configured (see design spec §4).

```jsonc
"queues": {
  "producers": [{ "queue": "notify", "binding": "NOTIFY" }],
  "consumers": [{
    "queue": "notify",
    "dead_letter_queue": "notify-dlq",
    "max_retries": 3
  }]
}
```

---

## Vectorize

| Index name | Dimensions | Metric | Binding | Environment | Purpose |
|------------|------------|--------|---------|-------------|---------|
| `drpratchaya-embeddings` | **1024** | **cosine** | `VECTORIZE` | production | Semantic search + `/api/ask` RAG over condition Markdown and published posts |

**Workers AI embedding model (must match index):** `@cf/baai/bge-m3`

| Choice | Rationale |
|--------|-----------|
| Model | **bge-m3** is multi-lingual (Thai + English clinical copy) and runs on Workers AI; English-only `@cf/baai/bge-base-en-v1.5` (768-d) would poorly represent Thai text. |
| 1024 dimensions | Verified live: `AI.run("@cf/baai/bge-m3", { text: ["ทดสอบ"] })` returns **1024**-length vectors on account `5093b764ea33977e138b71627193ea52`. |
| Cosine | Standard for normalized embedding similarity; matches Vectorize best practice for semantic retrieval. |

```jsonc
{
  "binding": "VECTORIZE",
  "index_name": "drpratchaya-embeddings"
}
```

Record `embedding_version` in D1 when re-embedding after any model or dimension change.

---

## Turnstile

| Field | Value |
|-------|-------|
| Widget name | `drpratchaya booking` |
| Sitekey (public) | `0x4AAAAAAE7-FZyXpCG5QrGe` |
| Mode | `managed` |
| Domains | `drpratchaya.com`, `www.drpratchaya.com`, `staging.drpratchaya.com`, `localhost` |

Expose sitekey via `wrangler.jsonc` `vars` (e.g. `PUBLIC_TURNSTILE_SITE_KEY`) or Astro public env — **not** the secret.

---

## R2

R2 has no separate UUID per bucket — the **bucket name** is the identifier in `wrangler.jsonc` and bindings. Both buckets are in account `5093b764ea33977e138b71627193ea52` (created 2026-09-18 after owner enabled R2 in the dashboard).

| Bucket name | Binding | Environment | Purpose |
|-------------|---------|-------------|---------|
| `drpratchaya-media` | `MEDIA` | production | Admin-uploaded blog images, OG images cached after first Browser Rendering pass, rehab protocol PDFs |
| `drpratchaya-media-staging` | `MEDIA` | staging (`env.staging`) | Same object types as production; isolated staging uploads |

```jsonc
// production (top-level or env.production)
{ "binding": "MEDIA", "bucket_name": "drpratchaya-media" }

// staging
{ "binding": "MEDIA", "bucket_name": "drpratchaya-media-staging" }
```

**Verified list (2026-09-18):**

```text
$ CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52 wrangler r2 bucket list

name:           drpratchaya-media
creation_date:  2026-09-18T14:55:27.877Z

name:           drpratchaya-media-staging
creation_date:  2026-09-18T14:55:30.020Z
```

---

## Secrets the owner must set (`wrangler secret put`)

Never commit values. Run from repo root with production Worker name and pinned account:

```bash
export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52

# Turnstile — secret shown once at widget creation in dashboard or via:
# Cloudflare dashboard → Turnstile → "drpratchaya booking" → Settings → Secret key
wrangler secret put TURNSTILE_SECRET_KEY --name drpratchaya
```

Other secrets from design spec §4 (add when values exist): admin session signing, magic-link signing, `LINE_CHANNEL_TOKEN`, optional `RESEND_API_KEY`, TOTP encryption key.

---

## Blocked / owner follow-up

### 1. Apex `drpratchaya.com` (deferred)

**Intentionally not attached on the legacy Worker.** `https://drpratchaya.com` does not resolve (no apex DNS). That is preferable to attaching apex as a Worker custom domain on the current static site: both hostnames would return **200** with the same HTML and **no** redirect between them — duplicate content and worse for search than the apex simply being unreachable.

**Planned (v2 ship):** Attach apex as a **Worker custom domain** in the **same change** that deploys Astro v2, with **Astro middleware** issuing a **301** from apex to `https://www.drpratchaya.com` (canonical host) on the first request. No duplicate-content window.

**Why not done from this machine:** Wrangler OAuth here has `zone (read)` only — no zone write — so DNS records and zone Redirect Rules cannot be created via API (`10000` / `9109`). Retrying would not help.

**Owner alternative (no code):** Create a zone-level **Redirect Rule** in the Cloudflare dashboard (plus proxied originless apex DNS per [Workers custom domain redirect guidance](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#redirect-between-www-and-root-domain)) if you want apex→www **before** v2 ships.

### 2. Workers Paid ($5)

Confirm subscription is on **`5093b764ea33977e138b71627193ea52`**, not `a8c0ecf24df21ae24180b52d317115de`. Provisioning on this run succeeded (D1, KV, Queues, Vectorize, Turnstile, custom domain) — implies paid features are available on the target account, but billing was not independently audited here.

### 3. D1 migrations

Not applied — migration author owns `wrangler d1 migrations apply`.

### 4. Staging Worker / hostname

Design spec expects Worker `drpratchaya-staging` and `staging.drpratchaya.com` — not created in this pass (out of scope except Turnstile domain allowlist).

---

## Quick verification commands

```bash
export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52

wrangler d1 list
wrangler kv namespace list
wrangler queues list
wrangler vectorize list
wrangler turnstile widget list
wrangler r2 bucket list

curl -sI https://www.drpratchaya.com/
curl -sI https://drpratchaya.com/   # NXDOMAIN / no resolve until v2 apex attach + middleware 301 (or owner dashboard redirect)
```
