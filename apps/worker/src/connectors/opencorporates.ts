import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://api.opencorporates.com/v0.4';

/**
 * OpenCorporates API – ~200M companies worldwide, open data.
 * Company registry info (names, addresses, hierarchy). Share-alike licensing.
 * https://api.opencorporates.com/documentation/API-Reference
 */
export async function searchOpenCorporates(
  apiKey: string | undefined,
  query: { q: string; jurisdiction?: string; perPage?: number }
): Promise<Signal[]> {
  const perPage = Math.min(query.perPage ?? 30, 30);
  const params = new URLSearchParams({
    q: query.q,
    per_page: String(perPage),
  });
  if (query.jurisdiction) params.append('jurisdiction_code', query.jurisdiction);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const res = await fetch(`${API_BASE}/companies/search?${params.toString()}`, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: { companies?: Array<{ company?: any }> } };
  const companies = data.results?.companies ?? [];

  return companies
    .map((item: { company?: any }) => item.company)
    .filter(Boolean)
    .map((c: any): Signal => ({
      source_name: 'OpenCorporates',
      source_type: 'site',
      title: c.name || '(unknown)',
      url: c.opencorporates_url || c.registry_url || `https://opencorporates.com/companies/${c.jurisdiction_code}/${c.company_number}`,
      summary: [c.jurisdiction_code, c.company_number, c.current_status].filter(Boolean).join(' · ') || undefined,
      published_at: c.incorporation_date ? new Date(c.incorporation_date).toISOString() : undefined,
      raw_json: c,
    }));
}

export async function fetchHealthcareCompaniesOpenCorporates(apiKey?: string): Promise<Signal[]> {
  const signals: Signal[] = [];
  const terms = ['healthcare', 'health tech', 'biotech', 'digital health', 'medtech'];
  for (const term of terms) {
    const batch = await searchOpenCorporates(apiKey, { q: term, perPage: 20 });
    signals.push(...batch);
  }
  return signals.slice(0, 100);
}
