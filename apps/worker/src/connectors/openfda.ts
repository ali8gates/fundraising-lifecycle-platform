import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

const API_BASE = 'https://api.fda.gov';

/** Parse FDA date strings (YYYYMMDD, ISO, or other); return ISO string or undefined if invalid. */
function parseFdaDate(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  // YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
    const d2 = new Date(`${y}-${m}-${d}T00:00:00Z`);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

/**
 * OpenFDA – Enforcement Reports API. Weekly recall data by product and firm.
 * Regulatory/safety signals impacting healthcare companies.
 * https://open.fda.gov/apis/
 */
export async function fetchOpenFdaEnforcementReports(options?: { limit?: number; search?: string }): Promise<Signal[]> {
  const limitVal = Math.min(options?.limit ?? 30, 100);
  const params = new URLSearchParams({ limit: String(limitVal) });
  if (options?.search) params.append('search', options.search);

  const res = await fetch(`${API_BASE}/food/enforcement.json?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results = data.results ?? [];

  return results.map((r: any): Signal => ({
    source_name: 'OpenFDA (Enforcement)',
    source_type: 'news',
    title: r.recall_number ? `FDA Recall: ${r.recall_number}` : 'FDA Enforcement Report',
    url: r.recall_number
      ? `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts#${encodeURIComponent(r.recall_number)}`
      : `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts?t=${encodeURIComponent(r.recalling_firm || '')}`,
    summary: [r.product_description, r.reason_for_recall, r.recalling_firm].filter(Boolean).join(' · '),
    published_at: parseFdaDate(r.recall_initiation_date),
    raw_json: r,
  }));
}

export async function fetchOpenFdaDeviceRecalls(options?: { limit?: number }): Promise<Signal[]> {
  const limit = Math.min(options?.limit ?? 20, 100);
  const res = await fetch(`${API_BASE}/device/recall.json?limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const results = data.results ?? [];

  return results.map((r: any): Signal => ({
    source_name: 'OpenFDA (Device Recall)',
    source_type: 'news',
    title: r.recall_number ? `Device Recall: ${r.recall_number}` : 'FDA Device Recall',
    url: r.recall_number
      ? `https://www.fda.gov/medical-devices/recalls#${encodeURIComponent(r.recall_number)}`
      : `https://www.fda.gov/medical-devices/recalls?m=${encodeURIComponent(r.manufacturer || '')}`,
    summary: [r.product_description, r.reason_for_recall, r.manufacturer].filter(Boolean).join(' · '),
    published_at: parseFdaDate(r.recall_initiation_date),
    raw_json: r,
  }));
}

export async function fetchOpenFdaSignals(): Promise<Signal[]> {
  const [food, device] = await Promise.all([
    fetchOpenFdaEnforcementReports({ limit: 15 }),
    fetchOpenFdaDeviceRecalls({ limit: 15 }),
  ]);
  return [...food, ...device];
}
