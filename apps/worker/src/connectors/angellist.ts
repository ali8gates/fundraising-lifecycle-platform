import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://api.angel.co/v2';

export async function fetchAngelListCompanies(apiKey: string, query: { keywords?: string; locations?: string[] }): Promise<Signal[]> {
  if (!apiKey) throw new Error('AngelList API key required');

  const params = new URLSearchParams({
    access_token: apiKey,
    limit: '100',
  });
  if (query.keywords) params.append('keywords', query.keywords);
  if (query.locations?.length) params.append('locations', query.locations.join(','));

  const res = await fetch(`${API_BASE}/startups?${params.toString()}`);
  if (!res.ok) throw new Error(`AngelList API error: ${res.status}`);
  
  const data = await res.json() as any;
  const startups = data.startups || [];

  return startups.map((startup: any): Signal => ({
    source_name: 'AngelList',
    source_type: 'funding',
    title: startup.name || '(unknown)',
    url: startup.company_url || `https://angel.co/company/${startup.id}` || '',
    summary: startup.tagline || undefined,
    published_at: startup.created_at || new Date().toISOString(),
    raw_json: startup,
  }));
}

export async function searchAngelListByKeyword(apiKey: string, keyword: string): Promise<Signal[]> {
  return fetchAngelListCompanies(apiKey, { keywords: keyword });
}









