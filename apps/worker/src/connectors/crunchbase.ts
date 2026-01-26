import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://api.crunchbase.com/api/v4';

export async function fetchCrunchbaseCompanies(apiKey: string, query: { industries?: string[]; fundingStage?: string; lastRaisedMin?: number }): Promise<Signal[]> {
  if (!apiKey) throw new Error('Crunchbase API key required');
  
  const filters = [];
  if (query.industries?.length) {
    filters.push({
      field_ids: ['industries'],
      operator_id: 'includes',
      values: query.industries,
    });
  }
  if (query.fundingStage) {
    filters.push({
      field_ids: ['funding_stage'],
      operator_id: 'eq',
      values: [query.fundingStage],
    });
  }

  const body = {
    field_ids: ['identifier', 'fundingStatus', 'fundingStage', 'lastFundingType', 'lastFundingAt', 'description', 'website'],
    filters,
    limit: 100,
  };

  const res = await fetch(`${API_BASE}/searches/organizations`, {
    method: 'POST',
    headers: { 'X-Cb-User-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Crunchbase API error: ${res.status}`);
  const data = await res.json() as any;
  const entities = data.entities || [];

  return entities.map((org: any): Signal => ({
    source_name: 'Crunchbase',
    source_type: 'funding',
    title: org.identifier?.name || '(unknown)',
    url: org.identifier?.website || `https://crunchbase.com/organization/${org.identifier?.uuid}` || '',
    summary: org.description || undefined,
    published_at: org.lastFundingAt || new Date().toISOString(),
    raw_json: org,
  }));
}

export async function searchCrunchbaseByIndustry(apiKey: string, industry: string): Promise<Signal[]> {
  return fetchCrunchbaseCompanies(apiKey, { industries: [industry] });
}









