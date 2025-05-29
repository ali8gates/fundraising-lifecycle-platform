import { prisma } from '@chti/db';
import { fetchRssSignals } from '../connectors/rss';
import { classifySpecialties } from '@chti/shared';

export async function runRssIngest() {
  const connectors = await prisma.connector.findMany({ where: { type: 'rss', isEnabled: true } });
  for (const c of connectors) {
    const url = (c.config as any)?.url as string | undefined;
    if (!url) continue;
    try {
      const signals = await fetchRssSignals(c.name, url);
      for (const s of signals) {
        // Upsert signal by URL
        const sig = await prisma.signal.upsert({
          where: { url: s.url },
          create: {
            sourceName: s.source_name,
            sourceType: 'news',
            title: s.title,
            url: s.url,
            summary: s.summary,
            publishedAt: s.published_at ? new Date(s.published_at) : null,
            raw: s.raw_json as any,
          },
          update: {
            title: s.title,
            summary: s.summary,
            publishedAt: s.published_at ? new Date(s.published_at) : null,
            raw: s.raw_json as any,
          },
        });

        // Derive domain and find or create company
        const domain = domainFromUrl(s.url);
        if (domain) {
          const name = domainToName(domain);
          const existing = await prisma.company.findFirst({ where: { OR: [{ website: { contains: domain } }, { name: name }] } });
          const specLabels = classifySpecialties(`${s.title} ${s.summary ?? ''}`).map(x => x.label);
          const company = existing ? existing : await prisma.company.create({ data: { name, website: `https://${domain}`, specialties: specLabels } });
          await prisma.signal.update({ where: { id: sig.id }, data: { companyId: company.id } });
        }
      }
    } catch (e) {
      console.error('RSS ingest error for', c.name, e);
    }
  }
}

function domainFromUrl(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

function domainToName(domain: string): string {
  const base = domain.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

