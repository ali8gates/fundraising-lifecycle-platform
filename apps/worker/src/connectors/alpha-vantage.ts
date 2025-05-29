import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://www.alphavantage.co/query';

/**
 * Alpha Vantage – free stock/market data API (with key).
 * Free tier: ~25 requests/day, 5/min. Daily quotes, fundamentals, AI news sentiment.
 * https://www.alphavantage.co/documentation/
 */
export async function fetchAlphaVantageNewsSentiment(apiKey: string, options?: { tickers?: string; limit?: number }): Promise<Signal[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    function: 'NEWS_SENTIMENT',
    limit: String(options?.limit ?? 50),
    sort: 'LATEST',
  });
  if (options?.tickers) params.append('tickers', options.tickers);

  const res = await fetch(`${API_BASE}?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { feed?: Array<Record<string, unknown>> };
  const feed = data.feed ?? [];

  return feed.map((item: any): Signal => ({
    source_name: 'Alpha Vantage',
    source_type: 'news',
    title: item.title || '(untitled)',
    url: item.url || '',
    summary: item.summary || undefined,
    published_at: item.time_published ? String(item.time_published).slice(0, 10) + 'T' + String(item.time_published).slice(10, 16) + ':00Z' : undefined,
    raw_json: item,
  }));
}

export async function fetchAlphaVantageCompanyOverview(apiKey: string, symbol: string): Promise<Signal | null> {
  const params = new URLSearchParams({ apikey: apiKey, function: 'OVERVIEW', symbol });
  const res = await fetch(`${API_BASE}?${params.toString()}`);
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  if (data.Note || data['Error Message']) return null;

  return {
    source_name: 'Alpha Vantage',
    source_type: 'funding',
    title: (data.Name as string) || symbol,
    url: `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}`,
    summary: (data.Description as string)?.slice(0, 500) || undefined,
    published_at: undefined,
    raw_json: data,
  };
}

export async function fetchHealthcareMarketNewsAlphaVantage(apiKey: string): Promise<Signal[]> {
  return fetchAlphaVantageNewsSentiment(apiKey, { tickers: 'IBB,XBI,HTEC', limit: 30 });
}
