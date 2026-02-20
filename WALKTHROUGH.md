# CHTI Business Scouting Tool Pilot – Step-by-Step Walkthrough

Do these in order. After each step, check the "✓ Done?" before moving on.

---

## Step 1: Environment file and API keys

**What we're doing:** Making sure the app has a `.env` file and at least a couple of API keys so the worker can pull real data.

1. Go to the project folder:
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   ```

2. If you don't have a `.env` file yet:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` in your editor and add **at least 2–3** of these (free sign-up):
   - **ALPHA_VANTAGE_API_KEY** → https://www.alphavantage.co/support/#api-key  
   - **NEWSAPI_API_KEY** → https://newsapi.org/ (register, copy API key)  
   - **NEWSDATA_API_KEY** → https://newsdata.io/ (register, copy API key)  
   - **MARKETAUX_API_KEY** → https://www.marketaux.com/  

   Format in `.env` (no spaces around `=`):
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   NEWSAPI_API_KEY=your_key_here
   ```

4. Save `.env`.  
   ✓ Done? You have a `.env` with at least 2 API keys set.

---

## Step 2: PostgreSQL and Redis

**What we're doing:** Starting the database and queue the app needs.

1. Start PostgreSQL (pick the version you have):
   ```bash
   brew services start postgresql@16
   ```
   Or: `brew services start postgresql@14` or `brew services start postgresql` if you're not sure.

2. Start Redis:
   ```bash
   brew services start redis
   ```

3. Create the database (only once):
   ```bash
   createdb chti
   ```
   If you see "database already exists," that's fine.

4. Check they're running:
   ```bash
   brew services list | grep -E "postgres|redis"
   ```
   ✓ Done? Both postgresql and redis show "started" (green).

---

## Step 3: Install dependencies and prepare the database

**What we're doing:** Installing packages and applying the database schema.

1. From the project folder:
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   pnpm install
   ```

2. Generate Prisma client and push schema:
   ```bash
   pnpm --filter @chti/db exec prisma generate
   pnpm --filter @chti/db exec prisma db push --accept-data-loss
   ```

3. (Optional) Seed RSS feeds and sample data:
   ```bash
   pnpm prisma:seed
   ```

   ✓ Done? No errors; you see "Prisma schema loaded" or similar.

---

## Step 4: Run the web app (Terminal 1)

**What we're doing:** Starting the dashboard you'll open in the browser.

1. Open a terminal and run:
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   ./launch.sh
   ```

2. Wait until you see something like: `Ready on http://localhost:3000`

3. In your browser, open: **http://localhost:3000**

   ✓ Done? The site loads (home or companies page).

---

## Step 5: Run the worker (Terminal 2)

**What we're doing:** Starting the background job that fetches real data from the APIs.

1. Open a **second** terminal (leave the first one running).

2. Run:
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   pnpm --filter @chti/worker dev
   ```

3. Wait for: `Worker started: enrichment pipeline scheduled`  
   Then you should see log lines like:
   - `RSS: ...`
   - `SEC EDGAR: fetched N filings`
   - `Alpha Vantage: fetched N news/sentiment items` (if you set that key)
   - etc.

   ✓ Done? Worker started with no crash; you see at least some "fetched" lines.

---

## Step 6: Verify in the app

**What we're doing:** Confirming APIs are configured and data is flowing.

1. **Settings page**  
   Open: http://localhost:3000/settings  
   - Under "External Data Sources," each API key you added should show **✓ Configured**.  
   - SEC EDGAR and OpenFDA should show **✓ Free**.

2. **Companies page**  
   Open: http://localhost:3000/companies  
   - After the worker has run once, you should see companies/signals from RSS, SEC, OpenFDA, and any APIs you configured.

   ✓ Done? Settings show your APIs as configured; companies page shows data (or will after a minute or two).

---

## If something breaks

- **"Database not reachable"** → Step 2: start PostgreSQL, run `createdb chti`, then run Step 3 again.
- **Worker won't start / Redis error** → Step 2: start Redis with `brew services start redis`.
- **API shows "○ Not set"** → Step 1: add that key to `.env` in the **project root**, save, then restart both the web app (Terminal 1) and the worker (Terminal 2).
- **No companies yet** → Worker runs a cycle on startup, then every 30 minutes. Check worker logs (Terminal 2) for errors; if there are none, wait a couple of minutes and refresh the companies page.

---

You're done when: both terminals are running, Settings shows your APIs as configured, and Companies shows data.
