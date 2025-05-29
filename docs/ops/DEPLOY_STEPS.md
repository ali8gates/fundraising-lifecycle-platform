# Vercel Deployment Steps

*Save for later, quick reference for deploying fundraising-lifecycle-platform to Vercel.*

---

## 1. Push Code to GitHub

```bash
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform

git add .
git commit -m "Vercel deployment setup"
git push origin main
```

*(If the repo is new: create it on GitHub first, then `git remote add origin https://github.com/ali8gates/fundraising-lifecycle-platform.git` and push.)*

---

## 2. Set Up PostgreSQL and Redis

| Service | Action | What to Copy |
|--------|--------|--------------|
| **PostgreSQL** | [Railway](https://railway.app) → New Project → Provision PostgreSQL, or [Supabase](https://supabase.com) / [Neon](https://neon.tech) | `DATABASE_URL` |
| **Redis** | [Upstash](https://upstash.com) → Create Database (free tier) or Railway → Redis | `REDIS_URL` |

---

## 3. Create the Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. **Import** your `fundraising-lifecycle-platform` (or `ali8gates/fundraising-lifecycle-platform`) repo

---

## 4. Configure Root Directory **(required)**

1. Before deploying, click **Edit** next to **Root Directory**
2. Select **`apps/web`** and confirm

> The repo's `vercel.json` will supply the Build Command, Install Command, and Output Directory. You **must** set Root Directory to `apps/web` in the Vercel UI.

---

## 5. Add Environment Variables

In the project setup (or later: **Settings → Environment Variables**), add:

| Variable | Source | Example |
|----------|--------|---------|
| `DATABASE_URL` | Your PostgreSQL (Railway/Supabase/Neon) | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Upstash or Railway Redis | `redis://default:pass@host:6379` |
| `APP_BASE_URL` | Your Vercel app URL (update after first deploy) | `https://your-app.vercel.app` |
| `ADMIN_API_KEY` | Generate: `openssl rand -hex 32` | *(long random string)* |
| `INGEST_INTERVAL_MINS` | Use `30` | `30` |
| `CRUNCHBASE_API_KEY` | Optional | *(leave empty for now)* |
| `ANGELLIST_API_KEY` | Optional | *(add if you have it)* |

---

## 6. Deploy

1. Click **Deploy**
2. Wait for the build to finish

---

## 7. Run Database Migrations (after first deploy)

From your machine (use your **production** `DATABASE_URL`):

```bash
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform

export DATABASE_URL="your_production_postgres_url"
pnpm --filter @chti/db prisma migrate deploy
pnpm --filter @chti/db prisma db seed   # optional
```

---

## 8. (Optional) Deploy the Worker

For background jobs, deploy the worker (e.g. on **Railway**):

1. Railway → **New** → **GitHub Repo** → select `fundraising-lifecycle-platform`
2. **Root Directory**: `apps/worker`
3. **Start Command**: `cd ../.. && pnpm install && pnpm --filter @chti/worker start`
4. Add the **same** env vars: `DATABASE_URL`, `REDIS_URL`, `INGEST_INTERVAL_MINS`, etc.

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL + Redis created; URLs saved
- [ ] Vercel project created from repo
- [ ] **Root Directory** = `apps/web`
- [ ] Env vars added (`DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`, `ADMIN_API_KEY`, `INGEST_INTERVAL_MINS`)
- [ ] First deploy completed
- [ ] `prisma migrate deploy` (and optional seed) run with production `DATABASE_URL`
- [ ] (Optional) Worker deployed on Railway with same env vars

---

## If the Build Fails

1. **Root Directory** must be **`apps/web`** (Project Settings → General)
2. In **Build & Development**, if overriding, use:
   - **Install Command**: `cd ../.. && pnpm install`
   - **Build Command**: `cd ../.. && pnpm --filter @chti/db prisma generate && pnpm --filter @chti/web build`
   - **Output Directory**: `.next`
3. Ensure `DATABASE_URL` is set (placeholder is fine for build; use real DB for runtime)
4. Check the **full** build log and share the exact error line if it still fails

---

**More detail:** `VERCEL_DEPLOYMENT.md`  
**Short version:** `QUICK_DEPLOY.md`
