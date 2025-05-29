import { prisma } from '@chti/db';
import { classifySpecialties, shouldShowCompany, computeCompanyFit, isGoodFitRecommendation } from '@chti/shared';
import { enrichCompanyWebsite } from '../services/websiteEnrichment.js';
import { fetchRssSignals } from '../connectors/rss.js';
import { fetchCrunchbaseCompanies } from '../connectors/crunchbase.js';
import { fetchAngelListCompanies } from '../connectors/angellist.js';
import { fetchSecEdgarJsonFilings } from '../connectors/sec-edgar.js';
import { fetchOpenFdaSignals } from '../connectors/openfda.js';
import { fetchHealthcareCompaniesOpenCorporates } from '../connectors/opencorporates.js';
import { fetchHealthcareMarketNewsAlphaVantage } from '../connectors/alpha-vantage.js';
import { fetchHealthcareNewsMarketaux } from '../connectors/marketaux.js';
import { fetchHealthtechNewsNewsApi } from '../connectors/newsapi.js';
import { fetchHealthcareNewsNewsData } from '../connectors/newsdata.js';

/** One-time backfill: recompute and persist fit for all companies (optional). */
export async function runBackfillCompanyFits(): Promise<{ updated: number; errors: number }> {
  const companies = await prisma.company.findMany({ select: { id: true } });
  let updated = 0;
  let errors = 0;
  for (const { id } of companies) {
    try {
      await persistCompanyFit(id);
      updated++;
    } catch (e) {
      console.error(`Backfill fit error for company ${id}:`, e);
      errors++;
    }
  }
  return { updated, errors };
}

export async function runEnrichmentPipeline() {
  const startTime = Date.now();
  console.log('Enrichment pipeline run starting...');

  // 1. RSS feeds (free, always enabled)
  await runRssEnrichment();

  // 2. Crunchbase (if API key available)
  const crunchbaseKey = process.env.CRUNCHBASE_API_KEY;
  if (crunchbaseKey) {
    await runCrunchbaseEnrichment(crunchbaseKey);
  }

  // 3. AngelList (if API key available)
  const angellistKey = process.env.ANGELLIST_API_KEY;
  if (angellistKey) {
    await runAngelListEnrichment(angellistKey);
  }

  // 4. SEC EDGAR data.sec.gov JSON (free; legacy cgi-bin endpoint returns HTML not JSON)
  await runSecEdgarJsonEnrichment();

  // 6. OpenFDA (free)
  await runOpenFdaEnrichment();

  // 7. OpenCorporates (optional API key for higher limits)
  const openCorporatesKey = process.env.OPENCORPORATES_API_KEY;
  await runOpenCorporatesEnrichment(openCorporatesKey);

  // 8. Alpha Vantage (if API key)
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (alphaVantageKey) {
    await runAlphaVantageEnrichment(alphaVantageKey);
  }

  // 9. Marketaux (if API key)
  const marketauxKey = process.env.MARKETAUX_API_KEY;
  if (marketauxKey) {
    await runMarketauxEnrichment(marketauxKey);
  }

  // 10. NewsAPI.org (if API key)
  const newsApiKey = process.env.NEWSAPI_API_KEY;
  if (newsApiKey) {
    await runNewsApiEnrichment(newsApiKey);
  }

  // 11. NewsData.io (if API key)
  const newsDataKey = process.env.NEWSDATA_API_KEY;
  if (newsDataKey) {
    await runNewsDataEnrichment(newsDataKey);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Enrichment pipeline completed in ${duration}s`);
}

async function runRssEnrichment() {
  const connectors = await prisma.connector.findMany({
    where: { type: 'rss', isEnabled: true },
  });
  for (const c of connectors) {
    const url = (c.config as any)?.url as string | undefined;
    if (!url) continue;
    try {
      const signals = await fetchRssSignals(c.name, url);
      await upsertSignalsAndCompanies(signals);
    } catch (e) {
      console.error(`RSS feed error for ${c.name}:`, e);
    }
  }
}

async function runCrunchbaseEnrichment(apiKey: string) {
  try {
    const healthcare = await fetchCrunchbaseCompanies(apiKey, {
      industries: ['health', 'medtech', 'digital-health', 'healthtech', 'biotech'],
    });
    await upsertSignalsAndCompanies(healthcare);
    console.log(`Crunchbase: fetched ${healthcare.length} companies`);
  } catch (e) {
    console.error('Crunchbase enrichment error:', e);
  }
}

async function runAngelListEnrichment(apiKey: string) {
  try {
    const startups = await fetchAngelListCompanies(apiKey, {
      keywords: 'healthcare digital health medtech biotech',
    });
    await upsertSignalsAndCompanies(startups);
    console.log(`AngelList: fetched ${startups.length} startups`);
  } catch (e) {
    console.error('AngelList enrichment error:', e);
  }
}

async function runSecEdgarJsonEnrichment() {
  try {
    const filings = await fetchSecEdgarJsonFilings();
    await upsertSignalsAndCompanies(filings);
    console.log(`SEC EDGAR (data.sec.gov): fetched ${filings.length} filings`);
  } catch (e) {
    console.error('SEC EDGAR JSON enrichment error:', e);
  }
}

async function runOpenFdaEnrichment() {
  try {
    const signals = await fetchOpenFdaSignals();
    await upsertSignalsAndCompanies(signals);
    console.log(`OpenFDA: fetched ${signals.length} enforcement/recall signals`);
  } catch (e) {
    console.error('OpenFDA enrichment error:', e);
  }
}

async function runOpenCorporatesEnrichment(apiKey: string | undefined) {
  try {
    const signals = await fetchHealthcareCompaniesOpenCorporates(apiKey);
    await upsertSignalsAndCompanies(signals);
    console.log(`OpenCorporates: fetched ${signals.length} company records`);
  } catch (e) {
    console.error('OpenCorporates enrichment error:', e);
  }
}

async function runAlphaVantageEnrichment(apiKey: string) {
  try {
    const signals = await fetchHealthcareMarketNewsAlphaVantage(apiKey);
    await upsertSignalsAndCompanies(signals);
    console.log(`Alpha Vantage: fetched ${signals.length} news/sentiment items`);
  } catch (e) {
    console.error('Alpha Vantage enrichment error:', e);
  }
}

async function runMarketauxEnrichment(apiKey: string) {
  try {
    const signals = await fetchHealthcareNewsMarketaux(apiKey);
    await upsertSignalsAndCompanies(signals);
    console.log(`Marketaux: fetched ${signals.length} news items`);
  } catch (e) {
    console.error('Marketaux enrichment error:', e);
  }
}

async function runNewsApiEnrichment(apiKey: string) {
  try {
    const signals = await fetchHealthtechNewsNewsApi(apiKey);
    await upsertSignalsAndCompanies(signals);
    console.log(`NewsAPI.org: fetched ${signals.length} headlines`);
  } catch (e) {
    console.error('NewsAPI enrichment error:', e);
  }
}

async function runNewsDataEnrichment(apiKey: string) {
  try {
    const signals = await fetchHealthcareNewsNewsData(apiKey);
    await upsertSignalsAndCompanies(signals);
    console.log(`NewsData.io: fetched ${signals.length} news items`);
  } catch (e) {
    console.error('NewsData enrichment error:', e);
  }
}

const PLACEHOLDER_HOSTS = ['example.com', 'news.example.com', 'example.org'];

/** Normalize URL (fix "http: https://..." malformation) and reject placeholders. */
function normalizeSignalUrl(u: unknown): string | null {
  if (u == null || typeof u !== 'string') return null;
  let s = (u as string).trim();
  if (/^https?:\s+https?:\/\//i.test(s)) {
    s = s.replace(/^https?:\s+/i, '').trim();
  }
  if (!s.startsWith('http://') && !s.startsWith('https://')) return null;
  try {
    const host = new URL(s).hostname.toLowerCase();
    if (PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return null;
    return s;
  } catch {
    return null;
  }
}

async function upsertSignalsAndCompanies(signals: any[]) {
  for (const s of signals) {
    const url = normalizeSignalUrl(s?.url);
    if (!url) continue; // skip broken, placeholder, or malformed URLs
    try {
      // Upsert signal by URL (store normalized URL)
      const sig = await prisma.signal.upsert({
        where: { url },
        create: {
          sourceName: s.source_name,
          sourceType: s.source_type,
          title: s.title,
          url,
          summary: s.summary,
          publishedAt: s.published_at ? new Date(s.published_at) : null,
          raw: s.raw_json,
        },
        update: {
          title: s.title,
          summary: s.summary,
          publishedAt: s.published_at ? new Date(s.published_at) : null,
        },
      });

      // Derive company from domain (only create/link healthcare-focused companies)
      const domain = domainFromUrl(url);
      if (domain) {
        const name = domainToName(domain);
        const specialties = classifySpecialties(`${s.title} ${s.summary ?? ''}`).map(x => x.label);
        const website = `https://${domain}`;

        const existing = await prisma.company.findFirst({
          where: {
            OR: [
              { website: { contains: domain } },
              { name },
            ],
          },
        });

        let company = existing;
        if (!existing) {
          // Only create companies that are healthcare-focused and a good fit (Innovators Network and/or Assessment Lab)
          const companyForFit = {
            name,
            website,
            specialties,
            signalsText: `${s.title ?? ''} ${s.summary ?? ''}`.trim() || undefined,
          };
          if (!shouldShowCompany({ ...companyForFit, descriptionOrSummary: companyForFit.signalsText })) {
            continue; // skip: not healthcare
          }
          const fit = computeCompanyFit(companyForFit);
          if (!isGoodFitRecommendation(fit.overall_recommendation)) {
            continue; // skip: not a good fit for Innovators Network or Assessment Lab
          }
          company = await prisma.company.create({
            data: { name, website, specialties },
          });
        }

        // Link signal to company
        await prisma.signal.update({
          where: { id: sig.id },
          data: { companyId: company.id },
        });

        // Enrich from website + recompute and persist fit
        await persistCompanyFit(company.id);
      }
    } catch (e) {
      console.error('Error upserting signal:', e);
    }
  }
}

async function persistCompanyFit(companyId: string): Promise<void> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { signals: true },
    });
    if (!company) return;
    const signalsText = (company.signals ?? [])
      .map((x) => `${x.title ?? ''} ${x.summary ?? ''}`.trim())
      .filter(Boolean)
      .join(' ');
    let enrichedWebText = '';
    if (company.website) {
      const enriched = await enrichCompanyWebsite(company.website);
      enrichedWebText = enriched.text ?? '';
    }
    const companyForFit = {
      name: company.name,
      description: company.description ?? undefined,
      website: company.website ?? undefined,
      specialties: company.specialties,
      signalsText: signalsText || undefined,
      enrichedWebText: enrichedWebText || undefined,
    };
    const fit = computeCompanyFit(companyForFit);
    await prisma.company.update({
      where: { id: companyId },
      data: {
        enrichedWebText: enrichedWebText || null,
        innovatorsNetworkTier: fit.innovators_network_fit.recommended_tier,
        innovatorsNetworkReasons: fit.innovators_network_fit.reasons,
        assessmentLabEligible: fit.assessment_lab_fit.eligible,
        assessmentLabReasons: fit.assessment_lab_fit.reasons,
        assessmentLabCriteria: fit.assessment_lab_fit.extracted_criteria as object,
        overallRecommendation: fit.overall_recommendation,
      },
    });
  } catch (e) {
    console.error('Error persisting company fit:', e);
  }
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function domainToName(domain: string): string {
  const base = domain.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}
