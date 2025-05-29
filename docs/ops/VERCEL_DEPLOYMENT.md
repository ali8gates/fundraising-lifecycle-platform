# Vercel Deployment Guide

This guide will help you deploy the Fundraising Lifecycle Platform to Vercel for production.

## 🏗️ Architecture Overview

When deploying to Vercel, you'll need to set up:

1. **Vercel** - Hosts the Next.js frontend (apps/web)
2. **PostgreSQL Database** - Railway, Supabase, or Neon (recommended)
3. **Redis** - Upstash (recommended, free tier available) or Railway
4. **Worker** - Railway or Render (for background jobs)

## 📋 Prerequisites

- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] GitHub repository (push your code to GitHub first)
- [ ] PostgreSQL database (Railway, Supabase, or Neon)
- [ ] Redis instance (Upstash or Railway)

## 🚀 Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform

# Initialize git if needed
git init
git add .
git commit -m "Initial commit - Fundraising Lifecycle Platform"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fundraising-lifecycle-platform.git
git branch -M main
git push -u origin main
```

## 🗄️ Step 2: Set Up PostgreSQL Database

### Option A: Railway (Recommended - Easy Setup)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Provision PostgreSQL"
3. Once created, click on the PostgreSQL service
4. Go to "Variables" tab
5. Copy the `DATABASE_URL` connection string

**Example format:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### Option B: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)

### Option C: Neon (Serverless PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string from the dashboard

## 🔴 Step 3: Set Up Redis

### Option A: Upstash (Recommended - Free Tier)

1. Go to [upstash.com](https://upstash.com) and sign up
2. Click "Create Database"
3. Choose "Global" or "Regional"
4. Copy the `REDIS_URL` from the dashboard

**Example format:**
```
redis://default:password@usw1-xxx.upstash.io:6379
```

### Option B: Railway

1. In your Railway project, click "New" → "Database" → "Redis"
2. Copy the `REDIS_URL` from the service variables

## 🚢 Step 4: Deploy to Vercel

### Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. Click **"Add New"** → **"Project"**
3. **Import your GitHub repository** (fundraising-lifecycle-platform)
4. **Configure the project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/web` **(required, build will fail otherwise)**
   - **Build Command**: `cd ../.. && pnpm --filter @chti/db prisma generate && pnpm --filter @chti/web build`
   - **Output Directory**: `.next` (must be `.next` when Root is `apps/web`, not `apps/web/.next`)
   - **Install Command**: `cd ../.. && pnpm install`

5. **Add Environment Variables** (click "Environment Variables"):
   ```
   DATABASE_URL=your_postgresql_connection_string
   REDIS_URL=your_redis_connection_string
   APP_BASE_URL=https://your-app.vercel.app
   ADMIN_API_KEY=your_secure_admin_key_here
   INGEST_INTERVAL_MINS=30
   CRUNCHBASE_API_KEY= (leave empty for now)
   ANGELLIST_API_KEY= (add if you have it)
   ```

6. Click **"Deploy"**

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
vercel

# Follow prompts:
# - Set root directory: apps/web
# - Override build command: cd ../.. && pnpm install && pnpm --filter @chti/web build
```

## 🔧 Step 5: Run Database Migrations

After deployment, you need to run Prisma migrations:

### Option A: Via Vercel Build Command (Recommended)

Update your Vercel project settings to include migration in build:

**Build Command:**
```bash
cd ../.. && pnpm install && pnpm --filter @chti/db prisma generate && pnpm --filter @chti/db prisma migrate deploy && pnpm --filter @chti/web build
```

### Option B: Run Locally (One-time)

```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run migrations
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
pnpm --filter @chti/db prisma migrate deploy

# Seed initial data (optional)
pnpm --filter @chti/db prisma db seed
```

## 👷 Step 6: Deploy the Worker (Background Jobs)

The worker needs to run separately. Options:

### Option A: Railway (Recommended)

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository
3. **Configure:**
   - **Root Directory**: `apps/worker`
   - **Start Command**: `cd ../.. && pnpm install && pnpm --filter @chti/worker start`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @chti/worker build`

4. **Add Environment Variables:**
   ```
   DATABASE_URL=your_postgresql_connection_string
   REDIS_URL=your_redis_connection_string
   INGEST_INTERVAL_MINS=30
   CRUNCHBASE_API_KEY= (if you have it)
   ANGELLIST_API_KEY= (if you have it)
   ```

### Option B: Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New"** → **"Background Worker"**
3. Connect your GitHub repo
4. **Configure:**
   - **Root Directory**: `apps/worker`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @chti/worker build`
   - **Start Command**: `cd ../.. && pnpm --filter @chti/worker start`

5. Add the same environment variables as above

### Option C: Vercel Cron Jobs (Future)

Vercel supports cron jobs, but the worker needs to be adapted. For now, use Railway or Render.

## ✅ Step 7: Verify Deployment

1. **Check Vercel deployment:**
   - Visit your Vercel URL: `https://your-app.vercel.app`
   - Should see the dashboard

2. **Check Settings page:**
   - Go to `https://your-app.vercel.app/settings`
   - Verify API keys show correct status

3. **Check worker logs:**
   - In Railway/Render, check worker logs
   - Should see: "Enrichment pipeline completed"

4. **Test data ingestion:**
   - Wait 30 minutes for first enrichment cycle
   - Check companies page for new data

## 🔐 Step 8: Generate Production Admin Key

Generate a secure admin key for production:

```bash
openssl rand -hex 32
```

Add this to Vercel environment variables as `ADMIN_API_KEY`.

## 📊 Environment Variables Summary

Add these to **Vercel** (Project Settings → Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://default:pass@host:6379` |
| `APP_BASE_URL` | Your Vercel app URL | `https://your-app.vercel.app` |
| `ADMIN_API_KEY` | Secure key for admin routes | `(generated with openssl)` |
| `INGEST_INTERVAL_MINS` | Worker interval | `30` |
| `CRUNCHBASE_API_KEY` | Crunchbase API key (optional) | `(leave empty for now)` |
| `ANGELLIST_API_KEY` | AngelList API key (optional) | `(if you have it)` |

## 🎯 Quick Start Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created (Railway/Supabase/Neon)
- [ ] Redis instance created (Upstash/Railway)
- [ ] Vercel project created and configured
- [ ] Environment variables added to Vercel
- [ ] Database migrations run
- [ ] Worker deployed (Railway/Render)
- [ ] Worker environment variables configured
- [ ] Production admin key generated and added
- [ ] App URL tested and working
- [ ] Settings page shows correct API status

## 🐛 Troubleshooting

### Build Fails on Vercel

**Issue**: "Cannot find module" or build errors
**Solution**: 
- Ensure `Root Directory` is set to `apps/web`
- Check build command includes `cd ../.. && pnpm install`
- Verify `vercel.json` is at the repository root (it defines install/build/output for the `apps/web` app when Root Directory is `apps/web`)

**Issue**: Build fails right after "Vercel CLI" or "Output directory not found" / "No Output Directory"
**Solution**:
- **Root Directory** must be `apps/web` in Project Settings → General → Root Directory
- **Output Directory** must be `.next` (not `apps/web/.next`) when Root is `apps/web`
- The repo includes `vercel.json` at the repository root; if you override in the Dashboard, use the same Install Command, Build Command, and Output Directory (`.next`) as in `vercel.json`

**Issue**: `prisma generate` or Prisma errors during build
**Solution**:
- `prisma generate` does not need a real database; ensure `DATABASE_URL` is set in Vercel (a placeholder like `postgresql://user:pass@localhost:5432/db` is fine for build if the real DB is not reachable)
- Build order must include: `pnpm --filter @chti/db prisma generate` before `pnpm --filter @chti/web build`

**Issue**: `pnpm` not found or wrong package manager
**Solution**:
- The repo uses pnpm (`pnpm-lock.yaml`, `packageManager` in root `package.json`). Ensure no Dashboard override forces npm or yarn.
- If needed, set **Install Command** to `cd ../.. && pnpm install` when Root is `apps/web`

### Database Connection Errors

**Issue**: "Can't reach database server"
**Solution**:
- Verify `DATABASE_URL` is correct in Vercel
- Check database allows connections from Vercel IPs
- For Railway/Supabase, ensure connection string includes SSL: `?sslmode=require`

### Worker Not Running

**Issue**: No data appearing after 30 minutes
**Solution**:
- Check worker is deployed and running (Railway/Render dashboard)
- Verify worker has correct environment variables
- Check worker logs for errors
- Ensure Redis is accessible from worker

### Prisma Client Errors

**Issue**: "Prisma Client not generated"
**Solution**:
- Add to build command: `pnpm --filter @chti/db prisma generate`
- Ensure `@chti/db` package is built before web app

## 💰 Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro | $20 |
| Railway PostgreSQL | Starter | $5 |
| Upstash Redis | Free | $0 |
| Railway Worker | Hobby | $5 |
| **Total** | | **$30/month** |

## 🚀 Next Steps

1. **Add Custom Domain** (production URL: **chti-scout.com**):
   - In Vercel, go to Project Settings → Domains
   - Add **chti-scout.com** (and optionally **www.chti-scout.com**)
   - Follow Vercel’s DNS instructions at your registrar (add the A/CNAME records they show)
   - Set **chti-scout.com** as the primary domain if desired
   - After DNS propagates, the app will be live at **https://chti-scout.com**

2. **Set Up Monitoring**:
   - Vercel Analytics (included)
   - Sentry for error tracking (optional)

3. **Configure Crunchbase API** (when ready):
   - Add `CRUNCHBASE_API_KEY` to Vercel environment variables
   - Redeploy or wait for next build

4. **Optimize**:
   - Review Vercel Analytics for performance
   - Adjust `INGEST_INTERVAL_MINS` based on usage
   - Monitor database and Redis usage

---

**Need Help?** Check the logs in:
- Vercel: Project → Deployments → View Function Logs
- Railway: Worker service → Logs
- Database: Check connection and query logs
