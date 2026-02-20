import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://api.marketaux.com/v1';

/**
 * Marketaux – free financial news API. 100 requests/day, 3 articles per query.
 * Global stock market and financial news.
 * https://www.marketaux.com/documentation
 */
export async function fetchMarketauxNews(
  apiKey: string,
  options?: { query?: string; limit?: number; language?: string }
): Promise<Signal[]> {
  const params = new URLSearchParams({
    api_token: apiKey,
    limit: String(options?.limit ?? 10),
  });
  if (options?.query) params.append('q', options.query);
  if (options?.language) params.append('language', options.language);

  const res = await fetch(`${API_BASE}/news/all?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const articles = data.data ?? [];

  return articles.map((a: any): Signal => ({
    source_name: 'Marketaux',
    source_type: 'news',
    title: a.title || '(untitled)',
    url: a.url || '',
    summary: a.description || a.snippet || undefined,
    published_at: a.published_at ? new Date(a.published_at).toISOString() : undefined,
    raw_json: a,
  }));
}

export async function fetchHealthcareNewsMarketaux(apiKey: string): Promise<Signal[]> {
  const signals: Signal[] = [];
  const queries = ['healthcare', 'biotech', 'health tech', 'digital health'];
  for (const q of queries) {
    const batch = await fetchMarketauxNews(apiKey, { query: q, limit: 5 });
    signals.push(...batch);
  }
  return signals.slice(0, 20);
}
