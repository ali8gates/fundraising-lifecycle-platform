import Parser from 'rss-parser';
import type { Signal } from '@chti/shared';

const parser = new Parser({ timeout: 15000 });

export async function fetchRssSignals(sourceName: string, url: string): Promise<Signal[]> {
  const feed = await parser.parseURL(url);
  const items = feed.items ?? [];
  return items.map((it) => mapRssItemToSignal(sourceName, it)).filter(s => s.url);
}

export function mapRssItemToSignal(sourceName: string, it: any): Signal {
  return {
    source_name: sourceName,
    source_type: 'news',
    title: it.title || '(untitled)',
    url: it.link || '',
    summary: it.contentSnippet || it.content || undefined,
    published_at: it.isoDate || (it.pubDate ? new Date(it.pubDate).toISOString() : undefined),
    raw_json: it,
  };
}

