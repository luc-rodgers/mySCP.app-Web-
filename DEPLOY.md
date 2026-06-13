# Deploy & database guide — MySCP

## Environments

| | Supabase project ref | Deploys from | URL |
|---|---|---|---|
| **Staging** | `jkfavziqsbhczpzedpms` | `staging` branch | `my-scp-app-web-git-staging-…vercel.app` |
| **Production** | `lmxscijvkwtckoifterr` | `main` branch | the live site |

`myscp-app/.env.local` holds the **staging** keys. There are no production keys in the
repo. The Supabase CLI in this repo is **linked to production** — do not run
`supabase db push` blind, it targets prod.

## Shipping code

1. Work on a branch, commit, and push to **`staging`** → deploys to the staging site.
   ```bash
   git checkout staging
   git add -A && git commit -m "…"
   git push origin staging
   ```
2. Verify on staging.
3. Promote to **production** (fast-forward only — keeps history linear):
   ```bash
   git checkout main
   git merge --ff-only staging
   git push origin main          # deploys to production
   ```

> If the local `staging` branch is ever behind, reset it: `git checkout -B staging origin/staging`.

## Database migrations

Migrations live in `supabase/migrations/`. They are **applied by hand** in each
project's Supabase **SQL Editor** — the CLI is not used to push. So a migration must
be run **twice**: once on staging, once on production.

When a bug reproduces on production but not staging, **suspect a missing migration on
prod first** — that has bitten us before (the `(employee_id, date)` unique constraint
and the `assign_ts_reference` SECURITY DEFINER fix were both missing on prod).

### Drift check (do this after every DB change)

Paste `supabase/check_prod_schema.sql` into the **production** SQL Editor and run it.
Every row should be `present = true`. Any `false` row is a migration whose artifact is
missing on prod — apply that migration's SQL, then re-run until all green.

When you add a new migration, add a matching check to `check_prod_schema.sql`.

## Optional: switch to `supabase db push` later

To automate prod migrations instead of hand-pasting, baseline the migration ledger once
(records the already-applied migrations so `db push` only runs new ones), then push.
Requires the CLI in a terminal + the prod DB password:

```bash
# one-time baseline — only valid because check_prod_schema.sql confirms all are applied
supabase migration repair --status applied \
  20260317000000 20260317000001 20260317000002 20260317000003 20260317000004 \
  20260317000005 20260317000006 20260317000007 20260317000008 20260317000009
supabase migration list --linked   # local & remote columns should match

# thereafter, per change:
supabase db push                   # applies + records only new migrations
```

⚠️ Never `supabase db push` before baselining — with an empty ledger it replays all
migrations and errors on constraints/policies that lack `if not exists`.
