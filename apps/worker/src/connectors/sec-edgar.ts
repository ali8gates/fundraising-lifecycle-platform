import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const DATA_SEC_BASE = 'https://data.sec.gov';
const USER_AGENT = 'CHTI Innovators Network (pilot)';

/**
 * SEC EDGAR data.sec.gov – free JSON API for public company filings.
 * Real-time as filings (10-K, 8-K, S-1, etc.) come in.
 * https://www.sec.gov/edgar/sec-api-documentation
 */
export async function fetchCompanyTickers(): Promise<Array<{ cik_str: number; ticker: string; title: string }>> {
  const res = await fetch(`${DATA_SEC_BASE}/files/company_tickers.json`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
  return Object.values(data);
}

export async function fetchRecentFilingsForCik(cik: number, formTypes: string[] = ['10-K', '8-K', 'S-1']): Promise<Signal[]> {
  const cikPadded = String(cik).padStart(10, '0');
  const res = await fetch(`${DATA_SEC_BASE}/submissions/CIK${cikPadded}.json`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    recent?: Record<string, string[]>;
    filings?: { recent?: Record<string, (string | number)[]> };
    name?: string;
  };
  const recent = data.filings?.recent ?? data.recent;
  if (!recent || !recent.form) return [];

  const form = recent.form as string[];
  const filingDate = (recent.filingDate as string[]) ?? [];
  const primaryDoc = (recent.primaryDocument as string[]) ?? [];
  const accession = (recent.accessionNumber as string[]) ?? [];

  const signals: Signal[] = [];
  for (let i = 0; i < form.length; i++) {
    if (!formTypes.includes(form[i])) continue;
    const acc = accession[i]?.replace(/-/g, '') ?? '';
    const link = acc ? `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/${primaryDoc[i] || ''}` : '';
    signals.push({
      source_name: 'SEC EDGAR (data.sec.gov)',
      source_type: 'funding',
      title: `${data.name || 'Company'} – ${form[i]} Filing`,
      url: link || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${form[i]}`,
      summary: `Filing date: ${filingDate[i] ?? 'N/A'}`,
      published_at: filingDate[i] ? new Date(filingDate[i]).toISOString() : undefined,
      raw_json: { form: form[i], filingDate: filingDate[i], accession: accession[i] },
    });
  }
  return signals.slice(0, 20);
}

/** Healthcare-related keywords to filter companies from tickers list */
const HEALTH_KEYWORDS = /health|medical|bio|pharma|care|therapy|diagnostic|clinical|life\s*sci/i;

export async function fetchSecEdgarJsonFilings(): Promise<Signal[]> {
  const tickers = await fetchCompanyTickers();
  const healthcare = tickers.filter((t) => HEALTH_KEYWORDS.test(t.title));
  const signals: Signal[] = [];
  for (const t of healthcare.slice(0, 15)) {
    try {
      const filings = await fetchRecentFilingsForCik(t.cik_str, ['10-K', '8-K', 'S-1']);
      signals.push(...filings);
    } catch {
      // skip on rate limit or error
    }
  }
  return signals.slice(0, 80);
}
