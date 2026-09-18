# Deployment runbook — drpratchaya.com (Astro 5 → Cloudflare Worker)

**Last updated:** 2026-09-18  
**Production runtime:** Cloudflare Worker **`drpratchaya`** (id `b09044d0e1de4226b14f9fabef685816`), account **`5093b764ea33977e138b71627193ea52`** (`Pratchaya.mnop@gmail.com`).  
**Public URL today:** `https://www.drpratchaya.com/` (Worker custom domain).  
**There is no Cloudflare Pages project** for this repository. Deploys are `wrangler deploy` only.

---

## How a change reaches production

```mermaid
flowchart LR
  A[Feature branch] --> B[Open PR to main]
  B --> C[GitHub Actions CI]
  C -->|pass| D[Owner review & merge]
  D --> E[Deploy production workflow]
  E --> F[D1 migrations apply]
  F --> G[wrangler deploy]
  G --> H[www.drpratchaya.com]
```

1. Work on a branch (`work/<name>/<topic>`). **Do not push directly to `main`.**
2. Open a pull request targeting `main`.
3. **CI** (`.github/workflows/ci.yml`) runs on the PR:
   - `npm ci` → `npm run typecheck` → `npm run build`
   - `npx wrangler deploy --dry-run` (validates Worker config; no upload)
   - Lighthouse on built static output (`/` and `/en/`) for accessibility and performance signals
4. After review, the **repo owner** merges the PR.
5. **Deploy production** (`.github/workflows/deploy-production.yml`) runs on push to `main`:
   - Same install, typecheck, and build
   - `npx wrangler d1 migrations apply drpratchaya-db --remote`
   - `npx wrangler deploy` to Worker `drpratchaya`

Merging to `main` **is** the production deploy trigger.

---

## GitHub Actions secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| `CLOUDFLARE_API_TOKEN` | CI (dry-run), Deploy production | Authenticate Wrangler to account `5093b764ea33977e138b71627193ea52` |

`CLOUDFLARE_ACCOUNT_ID` is **not** a secret; workflows set it explicitly to `5093b764ea33977e138b71627193ea52` so deploys never land on the other account reachable from some local Wrangler logins.

### Create the API token (minimum permissions)

In [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → **Create Custom Token**.

**Account resources:** Include → **Specific account** → select the account for `Pratchaya.mnop@gmail.com` (`5093b764ea33977e138b71627193ea52`).

**Permissions (Account scope):**

| Permission | Access | Why |
|------------|--------|-----|
| Workers Scripts | **Edit** | `wrangler deploy`, `--dry-run` upload validation |
| Workers KV Storage | **Edit** | Deploy Worker with `SESSIONS` / `CACHE_TAGS` bindings (when present in `wrangler.jsonc`) |
| Workers R2 Storage | **Edit** | Deploy with `MEDIA` R2 binding |
| D1 | **Edit** | `wrangler d1 migrations apply --remote` |
| Queues | **Edit** | Deploy with `notify` producer/consumer bindings |
| Vectorize | **Edit** | Deploy with `VECTORIZE` binding |
| Account Settings | **Read** | Wrangler account resolution |

Do **not** grant Account-wide Administrator, Zone Edit, or User API Tokens permission unless you have a separate operational reason.

**Zone permissions:** Not required for Worker deploy or D1 migrations. DNS / custom-domain changes are done in the dashboard or by an operator with Zone Edit—not by these workflows.

Add the token value in GitHub: **Repository → Settings → Secrets and variables → Actions → New repository secret** → name `CLOUDFLARE_API_TOKEN`.

---

## D1 migrations — order, risks, failure handling

### Order in production CI

**Build → apply migrations (`--remote`) → `wrangler deploy`.**

**Reasoning:** All current migrations under `migrations/` are **additive** (CREATE TABLE / indexes; no `DROP` or narrowing `ALTER`). Applying them **before** upload means:

- The **currently live** Worker (previous version) keeps running during migration. Extra tables/columns are unused by old code → **safe**.
- The **new** Worker starts only after the schema it expects is already in place → avoids boot-time or first-request SQL errors.

### Unsafe migration types under this single-step order

| Migration style | Risk with migrate → deploy |
|-----------------|----------------------------|
| `DROP TABLE` / `DROP COLUMN` | **High** — old Worker still live until deploy finishes may read removed objects → errors |
| `NOT NULL` on existing rows without default | **High** — can fail apply or break old writes |
| `RENAME` column/table | **High** — old code uses old names until deploy |
| Narrowing types, removing enum values | **Medium–High** |

**Expand–contract pattern for breaking changes:**

1. Deploy code that supports **both** old and new schema (or stops using the column to be dropped).
2. Apply migration that removes or renames.
3. Deploy code that only uses the new schema.

Alternatively for pure removals: **deploy first** (code no longer touches removed objects), **then migrate**—document that choice in the PR.

### Prerequisites (wrangler config)

`wrangler d1 migrations apply` requires `d1_databases` in `wrangler.jsonc` with `database_name: "drpratchaya-db"`, `database_id: "d0b58331-4b71-4d25-8255-2c779a7a753d"`, and `migrations_dir: "migrations"`. Until that lands from the wrangler/config owner, the deploy workflow’s migration step will fail with “Couldn't find a D1 DB … in wrangler.jsonc”.

**Remote state:** As of 2026-09-18, **no** migrations have been applied to production D1 yet. The first successful production run will apply `0001`–`0008`.

### When a migration fails midway

1. Read the workflow log for the failing SQL file name.
2. Check applied state:
   ```bash
   export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52
   npx wrangler d1 migrations list drpratchaya-db --remote
   ```
3. **Do not** edit an already-applied migration file in git; add a **new** forward migration to fix schema drift.
4. If a migration partially applied (rare on D1), use D1 console / `wrangler d1 execute` with owner care—coordinate before manual DDL.
5. Fix forward, merge to `main`, let CI re-run apply (Wrangler skips completed migrations).

---

## Manual deploy (CI down)

From a trusted machine with Node 22+ and repo checkout:

```bash
export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52
# export CLOUDFLARE_API_TOKEN=...   # or wrangler login on the OWNER account only

npm ci
npm run typecheck
npm run build

npx wrangler d1 migrations apply drpratchaya-db --remote
npx wrangler deploy
```

### Account pinning trap

Local Wrangler may be OAuth’d as an identity that can see **two** accounts (`5093b764ea33977e138b71627193ea52` and `a8c0ecf24df21ae24180b52d317115de`). **Always** export `CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52` and keep `account_id` pinned in `wrangler.jsonc`. Verify before deploy:

```bash
npx wrangler whoami
```

---

## Roll back a bad Worker deploy

Cloudflare retains prior Worker versions.

**Dashboard:** Workers & Pages → `drpratchaya` → Deployments → select a healthy version → **Rollback**.

**CLI:**

```bash
export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52
npx wrangler deployments list
npx wrangler rollback [DEPLOYMENT_ID]
```

Rolling back the **Worker does not roll back D1**. If a migration was incompatible, rollback the Worker **and** ship a forward migration or restore from D1 backup (owner operation).

---

## Staging (`drpratchaya-staging` / `staging.drpratchaya.com`)

**Decision: not automated yet.**

Planned resources (separate D1 `drpratchaya-db-staging`, R2 staging bucket, Turnstile allowlist entry) are documented in `docs/infra-bindings.md`, but the **staging Worker**, `env.staging` in `wrangler.jsonc`, and DNS for `staging.drpratchaya.com` are **not** provisioned. Adding a branch-based or `workflow_dispatch` staging deploy now would fail at infrastructure and invite drift.

**When to add:** After `wrangler.jsonc` defines `env.staging`, Worker `drpratchaya-staging` exists, and DNS is attached—prefer **`workflow_dispatch`** (manual “Deploy staging”) on a chosen ref, or deploy from `main` only to staging before production. Document the chosen promotion path in this file when implemented.

---

## Quality gate (CI)

On every PR, Lighthouse runs against static `dist/` served locally for:

- `http://127.0.0.1:4321/` (Thai home)
- `http://127.0.0.1:4321/en/` (English home)

| Check | Threshold | Blocks merge? | Why |
|-------|-----------|---------------|-----|
| Lighthouse **accessibility** score | ≥ 0.95 per URL | **Yes** | Design targets WCAG 2.2 AA; colour/contrast regressions should not reach review |
| Lighthouse **performance** score | &lt; 0.85 logs **WARN** | **No** | GitHub-hosted runners are not 4G; LCP &lt; 1.5s is validated in real-device testing, not CI |

Failed accessibility runs upload `lighthouse-*.json` artifacts on the PR for debugging.

---

## Custom domains & apex

| Host | Status |
|------|--------|
| `www.drpratchaya.com` | **Live** on Worker `drpratchaya` |
| `drpratchaya.com` (apex) | **Deliberately not attached** — does not resolve; avoids duplicate 200 responses with `www` before v2 |

**Remaining for apex (v2 ship):** Attach apex as Worker custom domain in the **same release** that deploys Astro middleware **301** apex → `https://www.drpratchaya.com`. Do not attach apex alone without redirect. See `docs/infra-bindings.md` § Blocked.

---

## Owner actions (outstanding)

1. **Turnstile secret** (production Worker):
   ```bash
   export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52
   npx wrangler secret put TURNSTILE_SECRET_KEY --name drpratchaya
   ```
2. **Workers Paid ($5/mo):** Confirm billing is on account **`5093b764ea33977e138b71627193ea52`**, not `a8c0ecf24df21ae24180b52d317115de`. Queues and Vectorize require Paid on the account where the Worker runs.
3. **GitHub secret:** Add `CLOUDFLARE_API_TOKEN` per table above before the first CI run that calls the Cloudflare API.
4. **`wrangler.jsonc`:** Ensure D1 binding + `migrations_dir`, KV, R2, Queues, Vectorize, routes/custom domains, and vars are complete before first production workflow (owned by config agent).
5. **First production migration:** Monitor the first `migrations apply` on empty production D1.

---

## Local validation (developers)

```bash
export CLOUDFLARE_ACCOUNT_ID=5093b764ea33977e138b71627193ea52
npm ci
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

Do **not** run `wrangler deploy` to production from a laptop unless CI is down and you are the owner following **Manual deploy** above.

---

## Workflow files

| File | Trigger | Effect |
|------|---------|--------|
| `.github/workflows/ci.yml` | `pull_request` → `main` | Validate; no deploy |
| `.github/workflows/deploy-production.yml` | `push` → `main` | Migrate + deploy |

---

## Related docs

- Infrastructure IDs and bindings: `docs/infra-bindings.md`
- Product / architecture spec: `docs/superpowers/specs/2026-09-18-drpratchaya-v2-design.md`
