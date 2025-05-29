# Production API Configuration Guide

This guide will help you configure the GTM (Go-To-Market) services for production use.

**Pilot testing tonight?** See **[LAUNCH_TONIGHT.md](./LAUNCH_TONIGHT.md)** for a short checklist (copy `.env`, add 2 to 3 free API keys, run web + worker, verify at /settings).

## ✅ What's Already Done

- ✅ `.env` file structure updated with API key placeholders
- ✅ Secure `ADMIN_API_KEY` generated for admin routes
- ✅ `APP_BASE_URL` set to port 3000 (matches `launch.sh`)

## 🔑 Step 1: Get Your API Keys

### Crunchbase API

1. **Log in to your Crunchbase account** at [https://data.crunchbase.com](https://data.crunchbase.com)
2. Navigate to **Settings → API Keys** (or Developer Dashboard)
3. Copy your **API Key** (also called "User Key" or "X-Cb-User-Key")
4. **Note**: Make sure your plan includes access to the `/api/v4/searches/organizations` endpoint

**What it provides:**
- Healthcare, medtech, biotech, and digital health company data
- Funding rounds and stages
- Company descriptions and websites
- Runs every 30 minutes automatically

### AngelList API

1. **Log in to AngelList** at [https://angel.co](https://angel.co)
2. Go to **Settings → Developer** (or API Access)
3. Generate or copy your **Access Token**
4. **Note**: Free tier has rate limits; paid tiers offer higher limits

**What it provides:**
- Healthcare startup profiles
- Company URLs and taglines
- Funding signals
- Runs every 30 minutes automatically

## 📝 Step 2: Add API Keys to .env File

Open the `.env` file in the project root and add your keys:

```bash
# External Data Sources (Production API Keys)
CRUNCHBASE_API_KEY=your_crunchbase_key_here
ANGELLIST_API_KEY=your_angellist_token_here
```

**Example:**
```bash
CRUNCHBASE_API_KEY=abc123xyz789...
ANGELLIST_API_KEY=def456uvw012...
```

## 🔄 Step 3: Restart the Worker

After adding the API keys, you need to restart the worker to activate them:

### Option A: If using the launch script (recommended)
1. Stop the current server (Ctrl+C in the terminal)
2. Run `./launch.sh` again

### Option B: Manual restart
```bash
# Stop the worker if running
pkill -f "next dev" || pkill -f "ts-node"

# Restart everything
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
pnpm dev
```

## ✅ Step 4: Verify Configuration

1. **Open the Settings page**: http://localhost:3000/settings
2. **Check "External Data Sources" section**:
   - ✅ Crunchbase API should show "✓ Configured" (green)
   - ✅ AngelList API should show "✓ Configured" (green)
   - ✅ SEC EDGAR should show "✓ Free" (always available)

3. **Check worker logs** for successful API calls:
   - Look for: `Crunchbase: fetched X companies`
   - Look for: `AngelList: fetched Y startups`
   - These appear every 30 minutes when the enrichment pipeline runs

## 🧪 Step 5: Test the Integration

### Manual Test (Optional)

You can manually trigger the enrichment pipeline to test immediately:

```bash
# In a new terminal, navigate to the project
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform

# Run the worker directly to see logs
pnpm --filter @chti/worker dev
```

Watch for:
- ✅ No API key errors
- ✅ Successful company fetches from both APIs
- ✅ Companies appearing in the database

### Check the Dashboard

1. Go to http://localhost:3000/companies
2. New companies should appear from Crunchbase and AngelList
3. Each company will have:
   - Auto-classified specialties
   - Associated signals
   - Scores (if scoring is configured)

## 🔒 Security Notes

- **Never commit `.env` to git** (it's already in `.gitignore`)
- **Keep your API keys secure** - don't share them
- **The `ADMIN_API_KEY`** is used for admin API routes - keep it secret
- **For production**, consider using environment variable management (Vercel, Railway, etc.)

## 📊 What Happens Next

Once configured, the system will:

1. **Every 30 minutes** (configurable via `INGEST_INTERVAL_MINS`):
   - Fetch healthcare companies from Crunchbase
   - Fetch healthcare startups from AngelList
   - Ingest RSS feeds (already configured)
   - Check SEC EDGAR for IPO filings

2. **Auto-create companies** from the fetched data
3. **Auto-classify specialties** using keyword matching
4. **Calculate scores** based on your scoring configuration
5. **Move companies through stage gates** automatically

## 🐛 Troubleshooting

### API Key Not Working?

1. **Verify the key is correct** - no extra spaces or quotes
2. **Check API permissions** - ensure your plan includes the needed endpoints
3. **Check rate limits** - you may have hit daily/monthly limits
4. **Check worker logs** for specific error messages

### No Companies Appearing?

1. **Wait 30 minutes** - enrichment runs on a schedule
2. **Check worker is running**: `ps aux | grep "ts-node\|next dev"`
3. **Check database**: Companies should appear in the `Company` table
4. **Check logs** for errors during enrichment

### Worker Not Starting?

1. **Check `.env` file** is in the project root
2. **Verify environment variables** are loaded: `echo $CRUNCHBASE_API_KEY`
3. **Check PostgreSQL and Redis** are running:
   ```bash
   brew services list | grep postgresql
   brew services list | grep redis
   ```

## 📞 Support

If you encounter issues:
1. Check the worker logs for error messages
2. Verify API keys are correct in `.env`
3. Ensure services (PostgreSQL, Redis) are running
4. Check the Settings page for configuration status

---

**Next Steps After Configuration:**
- Monitor the first enrichment cycle (30 minutes)
- Review companies in the dashboard
- Adjust scoring weights if needed
- Add additional RSS feeds via Settings → API
