# CHTI Business Scouting Tool - Go-To-Market & Launch Plan

## Go-To-Market Checklist

### Pre-Launch (Week 1-2)
- [ ] **Infrastructure Setup**
  - [ ] Deploy to production hosting (Vercel/Railway/Render)
  - [ ] Set up production PostgreSQL database
  - [ ] Configure Redis for production
  - [ ] Set up CI/CD pipeline
  - [ ] Configure domain and SSL certificate
  - [ ] Set up monitoring and error tracking (Sentry)

- [ ] **Database & Data**
  - [ ] Run Prisma migrations in production
  - [ ] Seed initial RSS feeds
  - [ ] Test data ingestion pipeline
  - [ ] Verify SEC EDGAR connector
  - [ ] Set up optional API keys (Crunchbase, AngelList)

- [ ] **Security & Access**
  - [ ] Generate strong ADMIN_API_KEY
  - [ ] Set up environment variables securely
  - [ ] Configure role-based access controls
  - [ ] Set up backup strategy for database

- [ ] **Testing & QA**
  - [ ] End-to-end testing of all features
  - [ ] Load testing for worker pipeline
  - [ ] Test scoring and gating logic
  - [ ] Verify meeting booking and ICS generation
  - [ ] Test search and filtering

### Launch (Week 3)
- [ ] **User Onboarding**
  - [ ] Create user documentation
  - [ ] Prepare demo/training materials
  - [ ] Set up initial user accounts
  - [ ] Schedule launch meeting with stakeholders

- [ ] **Monitoring**
  - [ ] Set up uptime monitoring
  - [ ] Configure alerting for critical errors
  - [ ] Set up analytics (optional)
  - [ ] Monitor data ingestion rates

- [ ] **Communication**
  - [ ] Announce launch to AHA Innovators Network team
  - [ ] Share access credentials securely
  - [ ] Provide support contact information

### Post-Launch (Week 4+)
- [ ] **Optimization**
  - [ ] Monitor user feedback
  - [ ] Optimize data ingestion intervals
  - [ ] Fine-tune scoring weights based on usage
  - [ ] Add additional RSS feeds based on needs

- [ ] **Enhancements**
  - [ ] Consider LLM integration for better classification
  - [ ] Add full-text search capabilities
  - [ ] Implement duplicate detection
  - [ ] Add email verification for companies

---

## Monthly Cost Breakdown

| Category | Service/Resource | Tier/Plan | Monthly Cost | Notes |
|----------|------------------|-----------|---------------|-------|
| **Hosting & Infrastructure** |
| Web App Hosting | Vercel Pro | Pro Plan | $20 | Next.js optimized, includes CDN, SSL |
| Database | Railway PostgreSQL | Starter | $5 | 1GB storage, automated backups |
| Redis Cache | Upstash Redis | Free Tier | $0 | 10K commands/day (sufficient for MVP) |
| **Alternative: All-in-One** |
| Full Stack Hosting | Railway | Hobby Plan | $5 | Includes PostgreSQL + Redis + App hosting |
| **Data Sources** |
| Crunchbase API | Crunchbase | Basic | $49 | Optional - healthcare company data |
| AngelList API | AngelList | Free | $0 | Free tier with rate limits |
| SEC EDGAR | SEC.gov | Free | $0 | Public API, no cost |
| RSS Feeds | Various | Free | $0 | Public feeds, no cost |
| **Monitoring & Tools** |
| Error Tracking | Sentry | Developer | $0 | Free tier: 5K events/month |
| Uptime Monitoring | UptimeRobot | Free | $0 | 50 monitors, 5-min checks |
| Analytics | Vercel Analytics | Included | $0 | Included with Vercel Pro |
| **Domain & SSL** |
| Domain | Namecheap/Google Domains | .com | ~$12/year | ~$1/month amortized |
| SSL Certificate | Vercel/Railway | Included | $0 | Free with hosting |
| **Development Tools** |
| CI/CD | GitHub Actions | Free | $0 | Free for public repos |
| Code Repository | GitHub | Free | $0 | Public or private |
| **Total (Minimal)** | | | **$25-30/month** | Without Crunchbase API |
| **Total (With Premium Data)** | | | **$74-79/month** | With Crunchbase API |

### Cost Optimization Options

**Minimal Setup ($25/month):**
- Vercel Pro for web app: $20
- Railway PostgreSQL: $5
- Upstash Redis Free: $0
- No paid APIs (use free RSS + SEC only)

**Recommended Setup ($30/month):**
- Railway Hobby (all-in-one): $5
- Vercel Pro: $20
- Domain: ~$1/month
- Monitoring tools: Free tiers

**Full-Featured Setup ($79/month):**
- All of above + Crunchbase API: $49

### Scaling Considerations

| User Growth | Estimated Monthly Cost |
|-------------|------------------------|
| < 10 users | $25-30 |
| 10-50 users | $30-50 |
| 50-200 users | $50-100 |
| 200+ users | $100-200+ |

*Note: Costs scale primarily with database size and API usage. Consider upgrading database tier and adding caching as usage grows.*

---

## Launch Timeline

**Week 1:** Infrastructure setup, database migration, testing  
**Week 2:** Security hardening, monitoring setup, user documentation  
**Week 3:** Soft launch with internal team, gather feedback  
**Week 4:** Full launch to AHA Innovators Network

---

## Risk Mitigation

1. **Data Source Failures**: Multiple free sources (RSS, SEC) ensure redundancy
2. **API Rate Limits**: Configurable ingestion intervals prevent quota exhaustion
3. **Database Costs**: Start with minimal tier, scale as needed
4. **Downtime**: Use managed services with SLA guarantees (Vercel 99.99% uptime)




