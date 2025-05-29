# Quick Deploy Checklist

## 🚀 Fast Track to Production

### 1. Push to GitHub (5 min)
```bash
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
git init  # if not already done
git add .
git commit -m "Ready for Vercel deployment"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fundraising-lifecycle-platform.git
git push -u origin main
```

### 2. Set Up Database (5 min)
- **Railway**: [railway.app](https://railway.app) → New Project → PostgreSQL
- Copy `DATABASE_URL` from Railway dashboard

### 3. Set Up Redis (2 min)
- **Upstash**: [upstash.com](https://upstash.com) → Create Database (Free tier)
- Copy `REDIS_URL` from dashboard

### 4. Deploy to Vercel (10 min)
1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. **Configure:**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm --filter @chti/db prisma generate && pnpm --filter @chti/web build`
   - Output Directory: `.next` (if overriding; must be `.next` when Root is `apps/web`)
4. **Add Environment Variables:**
   ```
   DATABASE_URL=your_railway_postgres_url
   REDIS_URL=your_upstash_redis_url
   APP_BASE_URL=https://your-app.vercel.app
   ADMIN_API_KEY=run: openssl rand -hex 32
   INGEST_INTERVAL_MINS=30
   ```
5. Click Deploy!

### 5. Run Migrations (2 min)
After first deploy, run locally:
```bash
export DATABASE_URL="your_production_database_url"
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
pnpm --filter @chti/db prisma migrate deploy
pnpm --filter @chti/db prisma db seed
```

### 6. Deploy Worker (10 min)
- **Railway**: New Service → GitHub Repo
- Root Directory: `apps/worker`
- Start Command: `cd ../.. && pnpm install && pnpm --filter @chti/worker start`
- Add same environment variables

**Total Time: ~35 minutes** ⚡

---

## 📋 Environment Variables Checklist

Copy these to Vercel (Settings → Environment Variables):

- [ ] `DATABASE_URL` - From Railway PostgreSQL
- [ ] `REDIS_URL` - From Upstash Redis  
- [ ] `APP_BASE_URL` - Your Vercel URL (auto-filled)
- [ ] `ADMIN_API_KEY` - Generate with `openssl rand -hex 32`
- [ ] `INGEST_INTERVAL_MINS` - Set to `30`
- [ ] `CRUNCHBASE_API_KEY` - Leave empty for now
- [ ] `ANGELLIST_API_KEY` - Add if you have it

---

## ✅ Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] Settings page shows API status
- [ ] Database migrations completed
- [ ] Worker is running (check Railway logs)
- [ ] Wait 30 min, check companies page for data

---

**Need detailed instructions?** See `VERCEL_DEPLOYMENT.md`
