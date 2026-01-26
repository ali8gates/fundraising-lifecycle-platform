import { prisma } from '@chti/db';
import { classifySpecialties } from '@chti/shared';
import { fetchRssSignals } from '../connectors/rss';
import { fetchCrunchbaseCompanies } from '../connectors/crunchbase';
import { fetchAngelListCompanies } from '../connectors/angellist';
import { fetchSecFilings } from '../connectors/sec';

export async function runEnrichmentPipeline() {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const startTime = Date.now();

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

  // 4. SEC EDGAR (free)
  await runSecEnrichment();

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

async function runSecEnrichment() {
  try {
    const filings = await fetchSecFilings(undefined, 'S-1');
    await upsertSignalsAndCompanies(filings);
    console.log(`SEC: fetched ${filings.length} healthcare filings`);
  } catch (e) {
    console.error('SEC enrichment error:', e);
  }
}

async function upsertSignalsAndCompanies(signals: any[]) {
  for (const s of signals) {
    try {
      // Upsert signal by URL
      const sig = await prisma.signal.upsert({
        where: { url: s.url },
        create: {
          sourceName: s.source_name,
          sourceType: s.source_type,
          title: s.title,
          url: s.url,
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

      // Derive company from domain
      const domain = domainFromUrl(s.url);
      if (domain) {
        const name = domainToName(domain);
        const specialties = classifySpecialties(`${s.title} ${s.summary ?? ''}`).map(x => x.label);

        const existing = await prisma.company.findFirst({
          where: {
            OR: [
              { website: { contains: domain } },
              { name },
            ],
          },
        });

        const company = existing
          ? existing
          : await prisma.company.create({
              data: {
                name,
                website: `https://${domain}`,
                specialties,
              },
            });

        // Link signal to company
        await prisma.signal.update({
          where: { id: sig.id },
          data: { companyId: company.id },
        });
      }
    } catch (e) {
      console.error('Error upserting signal:', e);
    }
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
