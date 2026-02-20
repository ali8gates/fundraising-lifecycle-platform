import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://newsapi.org/v2';

/**
 * NewsAPI.org – general news search. Dev tier: 100 requests/day, headlines up to 1 month.
 * ~150,000 sources. Free for development only (no production).
 * https://newsapi.org/docs
 */
export async function fetchNewsApiHeadlines(
  apiKey: string,
  options?: { q?: string; category?: string; pageSize?: number; country?: string }
): Promise<Signal[]> {
  const params = new URLSearchParams({
    apiKey,
    pageSize: String(options?.pageSize ?? 20),
  });
  if (options?.q) params.append('q', options.q);
  if (options?.category) params.append('category', options.category);
  if (options?.country) params.append('country', options.country);
  const endpoint = options?.q ? 'everything' : 'top-headlines';
  if (endpoint === 'everything') {
    params.set('sortBy', 'publishedAt');
    params.set('language', 'en');
  }

  const res = await fetch(`${API_BASE}/${endpoint}?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { articles?: Array<Record<string, unknown>>; status?: string };
  if (data.status === 'error') return [];
  const articles = data.articles ?? [];

  return articles.map((a: any): Signal => ({
    source_name: 'NewsAPI.org',
    source_type: 'news',
    title: a.title || '(untitled)',
    url: a.url || '',
    summary: a.description || a.content || undefined,
    published_at: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
    raw_json: a,
  }));
}

export async function fetchHealthtechNewsNewsApi(apiKey: string): Promise<Signal[]> {
  const signals: Signal[] = [];
  const terms = ['healthtech', 'digital health', 'biotech', 'healthcare startup'];
  for (const q of terms) {
    const batch = await fetchNewsApiHeadlines(apiKey, { q, pageSize: 10 });
    signals.push(...batch);
  }
  return signals.slice(0, 40);
}
