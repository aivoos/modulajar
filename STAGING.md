# Staging Setup Guide

## 1. Create Staging Supabase Project

1. Go to https://supabase.com/dashboard → **New Project** → name: `modulajar-staging`
2. Save credentials:
   - **Project ID** → `SUPABASE_STAGING_PROJECT_ID`
   - **Database Password** → `SUPABASE_STAGING_DB_PASSWORD`
   - **API URL** → `STAGING_API_URL` (e.g. `https://xxxx.supabase.co`)
3. Get `service_role` key → Settings → API → `SUPABASE_STAGING_SERVICE_KEY`

## 2. Link & Push Migrations

```bash
supabase login
supabase link --project-ref <STAGING_PROJECT_ID>
supabase db push
```

## 3. GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Value |
|--------|-------|
| `SUPABASE_STAGING_PROJECT_ID` | Project ID dari dashboard |
| `SUPABASE_STAGING_DB_PASSWORD` | Database password |
| `SUPABASE_STAGING_SERVICE_KEY` | `service_role` key (Settings → API) |
| `STAGING_API_URL` | `https://<project>.supabase.co` |

## 4. GitHub Variables (non-secret)

| Variable | Value |
|----------|-------|
| `SUPABASE_STAGING_PROJECT_ID` | Same as secret |

## 5. Run Tests

```bash
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_SERVICE_KEY=<key> \
API_URL=http://localhost:3000/api \
pnpm --filter @modulajar/db test:staging
```

## Flow

```
push to main
  → deploy-api (Railway) + deploy-web (Vercel)
  → regression-tests on staging
      → supabase db push to staging
      → bun regression.test.ts
  → all green = ✅ production ready
```