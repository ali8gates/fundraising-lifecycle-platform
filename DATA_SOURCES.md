# Data Sources Guide

This guide explains how to set up and use the various data connectors in CHTI.

## Free Data Sources (Always Available)

### 1. RSS/Atom Feeds
**Status**: ✅ Enabled by default  
**Interval**: 30 minutes (configurable)  
**Countries**: Global

10 healthcare news feeds are pre-seeded:
- MedCity News
- MobiHealthNews
- FierceHealthcare
- Rock Health
- CB Insights Health
- FDA Press Releases
- NIH News Releases
- HealthTech Magazine
- HIT Consultant
- Crunchbase News

**Add a custom feed**:
```bash
curl -X POST http://localhost:3001/api/connectors \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-admin-key" \
  -d '{
    "name": "Custom Healthcare Feed",
    "type": "rss",
    "config": { "url": "https://example.com/feed.xml" },
    "intervalMins": 60
  }'
```

### 2. SEC EDGAR (IPO Filings)
**Status**: ✅ Enabled by default  
**Type**: S-1 IPO filings for healthcare companies  
**Interval**: 30 minutes

Automatically searches SEC EDGAR for S-1 filings from healthcare and medical device companies. Links to actual SEC filings.

**No setup required** – runs as part of enrichment pipeline.

## Optional Paid APIs

### 1. Crunchbase API
**Cost**: Paid tier required  
**Data**: ~100M companies, funding rounds, news, founders  
**Industries Covered**: healthcare, medtech, digital-health, biotech  
**Rate Limit**: Varies by tier

**Setup**:
1. Sign up at [https://about.crunchbase.com/products/crunchbase-api/](https://about.crunchbase.com/products/crunchbase-api/)
2. Get your API key from dashboard
3. Add to `.env`:
   ```bash
   CRUNCHBASE_API_KEY=your_key_here
   ```
4. Restart worker:
   ```bash
   pkill -f "ts-node src/index.ts"
   pnpm --filter @chti/worker dev
   ```

**What it fetches**:
- Company profiles, descriptions, websites
- Funding stage and last funding date
- Relevant healthcare/biotech industries

**Interval**: 30 minutes

---

### 2. AngelList API
**Cost**: Free with rate limits; paid for higher volume  
**Data**: Startups, investors, deals  
**Industries Covered**: All sectors (we filter for healthcare keywords)  

**Setup**:
1. Sign up at [https://angel.co](https://angel.co)
2. Register for API access (settings → developer)
3. Add to `.env`:
   ```bash
   ANGELLIST_API_KEY=your_token_here
   ```
4. Restart worker

**What it fetches**:
- Startup profiles, taglines, founding dates
- Company URLs and AngelList profiles
- Funding signals and investor activity

**Interval**: 30 minutes

---

## How Data Flows Through the System

```
RSS/Crunchbase/AngelList/SEC
         ↓
   Worker Pipeline (every 30 mins)
         ↓
   Parse & Normalize to Signal
         ↓
   Extract domain → find or create Company
         ↓
   Auto-classify specialties (keywords + TF-IDF)
         ↓
   Store in DB
         ↓
   Dashboard shows new signals & companies
```

## Specialty Auto-Classification

When a signal is ingested, CHTI automatically classifies the company into one of these specialties:

- **cardiovascular** – Keywords: cardio, heart, arrhythmia, hypertension, CVD, ECG, etc.
- **diagnostics** – Keywords: diagnostic, imaging, assay, biomarker, lab, radiology, CT, MRI, etc.
- **remote patient monitoring** – Keywords: RPM, remote monitoring, telemetry, wearable, telehealth, etc.
- **other** – Default if no keywords match

Specialties are stored as multi-label (up to 2 per signal).

## Monitoring & Troubleshooting

### Check enrichment logs
```bash
# If running worker in foreground
pnpm --filter @chti/worker dev

# Check logs for successful/failed enrichments
# Look for: "Crunchbase: fetched X companies", "AngelList: fetched Y startups", etc.
```

### View ingested signals in UI
1. Open http://localhost:3001/companies
2. Check the "updated at" column – newest signals show recent ingestion time
3. Click a company to see associated signals

### Add/remove RSS feeds
1. Go to http://localhost:3001/settings
2. See "RSS/Atom Feeds" section
3. Use API (shown above) to add custom feeds

### Debug API key issues
- **Crunchbase**: Ensure key has permission to access `/api/v4/searches/organizations`
- **AngelList**: Check that token has access to `/v2/startups` endpoint
- **Worker won't start?** Check `.env` is exported: `export $(grep -E '^[A-Z]' .env | xargs)`

## Rate Limits & Best Practices

| Source | Requests/Min | Recommended Interval |
|--------|-------------|----------------------|
| RSS    | Unlimited   | 30–120 mins          |
| Crunchbase | 60/min | 30–60 mins           |
| AngelList | 60/min  | 30–60 mins           |
| SEC    | Unlimited   | 30–60 mins           |

**Tip**: Set `INGEST_INTERVAL_MINS=60` for production to reduce API quota usage.

## Future Enhancements

- [ ] PitchBook API integration
- [ ] Y Combinator startup feed
- [ ] LinkedIn company pages scraping (with proper ToS compliance)
- [ ] Email verification for companies
- [ ] Duplicate detection & deduplication
- [ ] Machine learning re-ranker for signal relevance









