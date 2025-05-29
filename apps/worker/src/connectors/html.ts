import type { Signal } from '@chti/shared';
import { fetch } from 'undici';

export async function fetchHtmlSignal(sourceName: string, url: string): Promise<Signal | null> {
  const res = await fetch(url, { headers: { 'user-agent': 'CHTI/1.0' } });
  if (!res.ok) return null;
  const html = await res.text();
  const title = matchMeta(html, /<title>([^<]+)<\/title>/i) || matchMeta(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) || '(untitled)';
  const summary = matchMeta(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || matchMeta(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) || undefined;
  const canonical = matchMeta(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || url;
  return {
    source_name: sourceName,
    source_type: 'site',
    title,
    url: canonical,
    summary,
    raw_json: { url, fetchedAt: new Date().toISOString() },
  };
}

function matchMeta(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m ? m[1]?.trim() : undefined;
}

