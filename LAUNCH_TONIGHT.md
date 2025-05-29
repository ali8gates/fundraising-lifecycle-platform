# CHTI Business Scouting Tool Pilot – Test Against Real Data Tonight

Use this checklist to run the pilot with **real API data** (not just RSS/SEC/OpenFDA).

---

## 1. Copy environment and add API keys

```bash
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network

# Create .env from example (if you don’t have one yet)
cp .env.example .env

# Edit .env and add at least 2–3 keys for real data (free tiers are fine):
# - ALPHA_VANTAGE_API_KEY  → https://www.alphavantage.co/support/#api-key
# - NEWSAPI_API_KEY       → https://newsapi.org/
# - NEWSDATA_API_KEY      → https://newsdata.io/
# Optional: CRUNCHBASE_API_KEY, ANGELLIST_API_KEY, MARKETAUX_API_KEY
```

**Minimum for pilot:** Set **Alpha Vantage**, **NewsAPI**, and/or **NewsData** (all have free tiers). Crunchbase and AngelList need sign-up but give the richest company data.

---

## 2. Start PostgreSQL and Redis

```bash
# macOS with Homebrew:
brew services start postgresql@16   # or postgresql@14 / postgresql
brew services start redis

# Create DB if needed
createdb chti
```

---

## 3. Install and prepare app

```bash
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network

pnpm install
pnpm --filter @chti/db exec prisma generate
pnpm --filter @chti/db exec prisma db push --accept-data-loss
pnpm prisma:seed   # optional: seed RSS connectors and sample data
```

---

## 4. Run web app and worker (two terminals)

**Terminal 1 – Web (dashboard):**

```bash
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
./launch.sh
```

Then open **http://localhost:3000** (or the port shown).

**Terminal 2 – Worker (pulls real data from APIs):**

```bash
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
pnpm --filter @chti/worker dev
```

The worker will run an enrichment cycle immediately, then every 30 minutes (or whatever `INGEST_INTERVAL_MINS` is in `.env`).

---

## 5. Verify configuration

1. **Settings:** http://localhost:3000/settings  
   - Under “External Data Sources”, any key you set in `.env` should show **✓ Configured**.  
   - SEC EDGAR and OpenFDA show **✓ Free** (no keys).

2. **Worker logs (Terminal 2)**  
   - Look for lines like:  
     - `Alpha Vantage: fetched N news/sentiment items`  
     - `NewsAPI.org: fetched N headlines`  
     - `Crunchbase: fetched N companies`  
   - If a key is missing or invalid, you’ll see an error for that source; others still run.

3. **Companies:** http://localhost:3000/companies  
   - New companies/signals should appear as the worker ingests from RSS, SEC, OpenFDA, and any APIs you configured.

---

## 6. Optional: one-off run without scheduler

To trigger enrichment once (e.g. to test keys without waiting 30 minutes), run the worker as above; it runs one cycle on startup, then continues on the interval.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Database not reachable” | Start PostgreSQL, run `createdb chti`, then `prisma db push` again. |
| “Redis connection” / worker won’t start | Start Redis: `brew services start redis`. |
| API shows “○ Not set” on Settings | Ensure the variable is in **.env** at the **project root** (same folder as `launch.sh`), then restart the **web** app (Terminal 1) and the **worker** (Terminal 2). |
| No new companies | Wait for the next worker cycle (default 30 min) or restart the worker to trigger an immediate run. Check worker logs for errors. |

---

**Quick reference:**  
- **.env** = project root (`/Users/ali8gates/Documents/PythonProjects/chti-innovators-network/.env`)  
- **API key links** = in `.env.example` and `DATA_SOURCES.md`  
- **Port** = 3000 (not 3001)
