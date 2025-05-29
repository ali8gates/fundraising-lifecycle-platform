/**
 * Lightweight website enrichment: fetch homepage, extract text, optionally fetch 1–2
 * internal pages (/about, /product, /solutions). Rate-limited, cached, safe timeouts.
 */

import { fetch } from 'undici';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const USER_AGENT = 'CHTI-Prospecting/1.0 (compatibility; no deep crawl)';
const REQUEST_TIMEOUT_MS = 15_000;
const RATE_LIMIT_DELAY_MS = 600; // ~1.5 req/s
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_EXTRA_PAGES = 2;

let lastRequestTime = 0;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(url: string): Promise<string> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY_MS) await delay(RATE_LIMIT_DELAY_MS - elapsed);
  lastRequestTime = Date.now();
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Strip scripts/styles and tags; return readable text. */
function extractTextFromHtml(html: string): string {
  let s = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** Get internal links that look like /about, /product, /solutions (path only). */
function extractInternalPaths(html: string, baseOrigin: string): string[] {
  const origin = baseOrigin.replace(/\/$/, '');
  const paths: string[] = [];
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  const preferred = ['/about', '/product', '/solutions', '/about-us', '/products', '/solution'];
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const u = href.startsWith('http') ? new URL(href) : new URL(href, baseOrigin);
      if (u.origin !== new URL(baseOrigin).origin) continue;
      const path = u.pathname.replace(/\/$/, '') || '/';
      const lower = path.toLowerCase();
      if (preferred.some((p) => lower === p || lower.startsWith(p + '/'))) {
        if (!paths.includes(path)) paths.push(path);
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return paths.slice(0, MAX_EXTRA_PAGES);
}

function cacheDir(): string {
  const dir = join(process.cwd(), '.cache', 'website-enrichment');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function cacheKey(url: string): string {
  const u = new URL(url);
  const host = u.hostname.replace(/\./g, '_');
  const path = (u.pathname || '/').replace(/\//g, '_') || 'index';
  return `${host}${path}.json`;
}

interface CachedEntry {
  text: string;
  fetchedAt: number;
}

function readCache(key: string): CachedEntry | null {
  const file = join(cacheDir(), key);
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, 'utf-8');
    const entry = JSON.parse(raw) as CachedEntry;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CachedEntry): void {
  const file = join(cacheDir(), key);
  try {
    writeFileSync(file, JSON.stringify(entry), 'utf-8');
  } catch {
    // ignore
  }
}

/**
 * Enrich company website: fetch homepage, extract text, optionally 1–2 internal pages.
 * Returns combined text for fit engine. Rate-limited and cached.
 */
export async function enrichCompanyWebsite(websiteUrl: string | null | undefined): Promise<{ text: string }> {
  if (!websiteUrl || typeof websiteUrl !== 'string') return { text: '' };
  let url: URL;
  try {
    url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
  } catch {
    return { text: '' };
  }
  const origin = url.origin;
  const homepageKey = cacheKey(url.href);
  const cached = readCache(homepageKey);
  if (cached) return { text: cached.text };

  const parts: string[] = [];
  try {
    const homeHtml = await rateLimitedFetch(url.href);
    parts.push(extractTextFromHtml(homeHtml));
    const extraPaths = extractInternalPaths(homeHtml, origin);
    for (const p of extraPaths) {
      const extraUrl = `${origin}${p}`;
      const key = cacheKey(extraUrl);
      const c = readCache(key);
      if (c) {
        parts.push(c.text);
      } else {
        try {
          const html = await rateLimitedFetch(extraUrl);
          const text = extractTextFromHtml(html);
          parts.push(text);
          writeCache(key, { text, fetchedAt: Date.now() });
        } catch {
          // skip failed extra page
        }
      }
    }
  } catch {
    return { text: '' };
  }
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  writeCache(homepageKey, { text, fetchedAt: Date.now() });
  return { text };
}
