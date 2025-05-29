# Data Sources Guide

This guide explains all data connectors integrated into the Fundraising Lifecycle Platform pilot. Each source is wired into the enrichment pipeline and runs on the configured interval (default 30 minutes).

---

## Free Data Sources (Always Available)

### 1. RSS/Atom Feeds
**Status**: ✅ Enabled by default  
**Interval**: Configurable per feed (default 120 mins in seed)  
**No API key required**

Pre-seeded feeds include:
- **Healthcare**: MedCity News, MobiHealthNews, FierceHealthcare, FierceBiotech, Rock Health, CB Insights Health, FDA Press Releases, NIH News Releases, HealthTech Magazine, HIT Consultant
- **Startups / funding**: Crunchbase News, TechCrunch, VentureBeat, FinSMEs

**Add a custom feed** (admin API):
```bash
curl -X POST http://localhost:3000/api/connectors \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "name": "Custom Feed",
    "type": "rss",
    "config": { "url": "https://example.com/feed.xml" },
    "intervalMins": 60
  }'
```

### 2. SEC EDGAR (Legacy + data.sec.gov JSON)
**Status**: ✅ Enabled by default  
**No API key required**

- **Legacy**: S-1 IPO filings for healthcare companies via browse-edgar.
- **data.sec.gov**: Real-time JSON API for 10-K, 8-K, S-1 filings; company tickers filtered for healthcare/biotech. Same-day filings as submitted.

**No setup required**, both run in the enrichment pipeline.

### 3. OpenFDA (Enforcement & Device Recalls)
**Status**: ✅ Enabled by default  
**No API key required**

- **Enforcement Reports API**: Weekly recall data by product and firm (food/drug).
- **Device Recalls**: Medical device recalls.

Useful for regulatory/safety signals impacting healthcare companies.

---

## Optional APIs (Set in `.env` to Enable)

### 4. Crunchbase API (Basic)
**Env**: `CRUNCHBASE_API_KEY`  
**Cost**: Basic (free) tier with limited monthly requests  
**Data**: Funding rounds, company info, investor tracking; healthcare startup funding signals (Series A, etc.)

**Setup**:
1. Sign up at [Crunchbase API](https://about.crunchbase.com/products/crunchbase-api/)
2. Add to `.env`: `CRUNCHBASE_API_KEY=your_key_here`
3. Restart worker

### 5. OpenCorporates API
**Env**: `OPENCORPORATES_API_KEY` (optional, works without key at lower limits)  
**Cost**: Free tier; API key increases rate limits  
**Data**: ~200M companies worldwide; company registry (names, addresses, hierarchy). Open data, share-alike licensing. Good for company lookups and verifying entities.

**Setup**: Add `OPENCORPORATES_API_KEY=...` to `.env` for higher limits. Pipeline runs with or without key.

### 6. Alpha Vantage (Free Tier)
**Env**: `ALPHA_VANTAGE_API_KEY`  
**Cost**: Free tier ~25 requests/day, 5/min  
**Data**: Stock/market data, fundamentals, AI-powered market news sentiment. Used for public healthcare company tickers (e.g. IBB, XBI, HTEC) and related news.

**Setup**:
1. Get key at [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key`

### 7. Marketaux (News API)
**Env**: `MARKETAUX_API_KEY`  
**Cost**: Free 100 requests/day, 3 articles per query  
**Data**: Global stock market and financial news; press releases and news about healthcare companies and markets.

**Setup**: Get key at [Marketaux](https://www.marketaux.com/), add `MARKETAUX_API_KEY=...` to `.env`.

### 8. NewsAPI.org (Dev Tier)
**Env**: `NEWSAPI_API_KEY`  
**Cost**: Free 100 requests/day (development only; no production)  
**Data**: General news search across ~150,000 sources; headlines up to 1 month. Keywords: healthtech, digital health, biotech, company names.

**Setup**: Get key at [NewsAPI.org](https://newsapi.org/), add `NEWSAPI_API_KEY=...` to `.env`.

### 9. NewsData.io (Free Tier)
**Env**: `NEWSDATA_API_KEY`  
**Cost**: Free 200 requests/day, 10 articles per call  
**Data**: Global news with sentiment and multilingual support. Backup/supplement to NewsAPI for startups and biotech news.

**Setup**: Get key at [NewsData.io](https://newsdata.io/), add `NEWSDATA_API_KEY=...` to `.env`.

### 10. AngelList API
**Env**: `ANGELLIST_API_KEY`  
**Cost**: Free with rate limits  
**Data**: Startups, investors, deals; we filter for healthcare keywords.

**Setup**: Register at [AngelList](https://angel.co) (settings → developer), add `ANGELLIST_API_KEY=...` to `.env`.

---

## How Data Flows

```
RSS / Crunchbase / AngelList / OpenCorporates / Alpha Vantage /
Marketaux / NewsAPI / NewsData / SEC EDGAR / OpenFDA
         ↓
   Worker pipeline (every INGEST_INTERVAL_MINS)
         ↓
   Parse & normalize to Signal
         ↓
   Extract domain → find or create Company
         ↓
   Auto-classify specialties (keywords)
         ↓
   Store in DB → Dashboard
```

## Env Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRUNCHBASE_API_KEY` | No | Crunchbase company/funding data |
| `ANGELLIST_API_KEY` | No | AngelList startups |
| `OPENCORPORATES_API_KEY` | No | OpenCorporates (optional for higher limits) |
| `ALPHA_VANTAGE_API_KEY` | No | Alpha Vantage news/sentiment |
| `MARKETAUX_API_KEY` | No | Marketaux financial news |
| `NEWSAPI_API_KEY` | No | NewsAPI.org headlines |
| `NEWSDATA_API_KEY` | No | NewsData.io news |

All other sources (RSS, SEC EDGAR, OpenFDA) run without keys.

## Rate Limits & Tips

| Source | Free Tier | Tip |
|--------|-----------|-----|
| RSS | Unlimited | Add only feeds you need |
| SEC / OpenFDA | No key | Safe to run every 30 min |
| Crunchbase | By tier | Use for funding signals |
| OpenCorporates | Optional key | Works without key |
| Alpha Vantage | 25/day, 5/min | Use for sector news only |
| Marketaux | 100/day | 3 articles per query |
| NewsAPI | 100/day | Dev only |
| NewsData | 200/day | 10 per call |

**Recommendation**: Set `INGEST_INTERVAL_MINS=60` in production to stay within free tiers.

## Monitoring

- **Settings page**: http://localhost:3000/settings, shows which API keys are configured and data source status.
- **Worker logs**: Run `pnpm --filter @chti/worker dev` and look for lines like `Crunchbase: fetched N companies`, `SEC EDGAR (data.sec.gov): fetched N filings`, etc.
- **Companies/signals**: http://localhost:3000/companies, new signals appear as they are ingested.

## Specialty Auto-Classification

Signals are auto-tagged with specialties: **cardiovascular**, **diagnostics**, **remote patient monitoring**, **other** (keyword-based).
