import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const EDGAR_BASE = 'https://www.sec.gov/cgi-bin/browse-edgar';

export async function fetchSecFilings(cik?: string, formType: string = '10-K'): Promise<Signal[]> {
  // Free endpoint to search EDGAR filings
  // Example: healthcare companies filing 10-K or S-1 (IPO)
  const params = new URLSearchParams({
    action: 'getcompany',
    type: formType,
    dateb: new Date().toISOString().split('T')[0],
    owner: 'exclude',
    count: '100',
    output: 'json',
  });
  if (cik) params.append('CIK', cik);

  try {
    const res = await fetch(`${EDGAR_BASE}?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json() as any;
    const filings = data.filings?.filing || [];

    return filings
      .filter((f: any) => f.company_name?.toLowerCase().includes('health') || f.company_name?.toLowerCase().includes('medical'))
      .slice(0, 50)
      .map((f: any): Signal => ({
        source_name: 'SEC EDGAR',
        source_type: 'funding',
        title: `${f.company_name} - ${f.form_type} Filing`,
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${f.cik}&type=${f.form_type}&dateb=&owner=exclude&count=100`,
        summary: `Filing date: ${f.filing_date}`,
        published_at: f.filing_date ? new Date(f.filing_date).toISOString() : undefined,
        raw_json: f,
      }));
  } catch (e) {
    console.error('SEC EDGAR fetch error:', e);
    return [];
  }
}









