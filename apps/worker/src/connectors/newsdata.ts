import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://newsdata.io/api/1';

/**
 * NewsData.io – global news API. Free: 200 requests/day, 10 articles per call.
 * Sentiment and multilingual support.
 * https://newsdata.io/documentation
 */
export async function fetchNewsDataNews(
  apiKey: string,
  options?: { q?: string; language?: string; size?: number }
): Promise<Signal[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    size: String(options?.size ?? 10),
  });
  if (options?.q) params.append('q', options.q);
  if (options?.language) params.append('language', options.language);

  const res = await fetch(`${API_BASE}/news?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Array<Record<string, unknown>>; status?: string };
  if (data.status === 'error') return [];
  const results = data.results ?? [];

  return results.map((r: any): Signal => ({
    source_name: 'NewsData.io',
    source_type: 'news',
    title: r.title || '(untitled)',
    url: r.link || r.url || '',
    summary: r.description || r.content || undefined,
    published_at: r.pubDate ? new Date(r.pubDate).toISOString() : undefined,
    raw_json: r,
  }));
}

export async function fetchHealthcareNewsNewsData(apiKey: string): Promise<Signal[]> {
  const signals: Signal[] = [];
  const terms = ['healthcare', 'biotech', 'digital health', 'medtech', 'health tech'];
  for (const q of terms) {
    const batch = await fetchNewsDataNews(apiKey, { q, size: 8 });
    signals.push(...batch);
  }
  return signals.slice(0, 40);
}
