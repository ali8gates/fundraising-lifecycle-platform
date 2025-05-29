/**
 * Central filter so the app only shows healthcare-focused companies that fit
 * Innovators Network / AI Assessment Lab criteria. Excludes news outlets and
 * generic tech media (e.g. Tech Times, TechCrunch) everywhere.
 */

export type CompanyForFilter = {
  name: string;
  website?: string | null;
  description?: string | null;
  specialties?: string[];
};

// Domains that are news/media/gov/data sources — never show as "companies"
const NON_HEALTHCARE_DOMAIN_KEYWORDS = [
  'sec.gov',
  'fda.gov',
  'nih.gov',
  'reuters.com',
  'apnews.com',
  'bloomberg.com',
  'cnbc.com',
  'techcrunch.com',
  'venturebeat.com',
  'techtimes.com',
  'theverge.com',
  'wired.com',
  'cnet.com',
  'zdnet.com',
  'engadget.com',
  'gizmodo.com',
  'arstechnica.com',
  'medcitynews.com',
  'fiercehealthcare.com',
  'fiercebiotech.com',
  'fiercepharma.com',
  'mobihealthnews.com',
  'hitconsultant.net',
  'healthcareitnews.com',
  'statnews.com',
  'beckershospitalreview.com',
  'healthtechmagazine.net',
  'rockhealth.com',
  'finsmes.com',
  'cbinsights.com',
  'crunchbase.com',
  'news.crunchbase.com',
  'openfda.gov',
  'example.com',
];

// Name keywords: news/media/source names that must not appear as companies
const NON_HEALTHCARE_NAME_KEYWORDS = [
  'sec',
  'fda',
  'nih',
  'reuters',
  'ap news',
  'bloomberg',
  'techcrunch',
  'venture beat',
  'venturebeat',
  'tech times',
  'techtimes',
  'the verge',
  'wired',
  'cnet',
  'zdnet',
  'engadget',
  'gizmodo',
  'ars technica',
  'medcity',
  'medcity news',
  'fierce healthcare',
  'fierce biotech',
  'fierce pharma',
  'mobihealthnews',
  'hit consultant',
  'healthcare it news',
  'stat news',
  'becker',
  'becker\'s',
  'beckershospital',
  'health tech magazine',
  'rock health',
  'finsmes',
  'cb insights',
  'cbinsights',
  'crunchbase',
  'open fda',
  'openfda',
];

// Company is included only if name/description/website/specialty indicates healthcare focus
const HEALTHCARE_KEYWORDS = [
  'health',
  'healthcare',
  'health tech',
  'healthtech',
  'medical',
  'medtech',
  'biotech',
  'pharma',
  'clinical',
  'patient',
  'diagnostic',
  'therapy',
  'therapeutic',
  'hospital',
  'clinic',
  'care',
  'digital health',
  'life science',
  'lifescience',
  'cardiovascular',
  'cardio',
  'rpm',
  'remote patient',
  'telehealth',
  'medication',
  'drug',
  'device',
  'fda',
  'clinical trial',
  'ehr',
  'emr',
  'interoperability',
];

const HEALTHCARE_SPECIALTIES = ['cardiovascular', 'diagnostics', 'remote patient monitoring'];

function matchesList(text: string, list: string[]): boolean {
  const lower = text.toLowerCase();
  return list.some((k) => lower.includes(k));
}

/**
 * True if this is a news/media/gov/data source we never want to show as a company.
 */
export function isExcludedNonHealthcareCompany(company: CompanyForFilter): boolean {
  const website = (company.website ?? '').toLowerCase();
  if (website && NON_HEALTHCARE_DOMAIN_KEYWORDS.some((d) => website.includes(d))) {
    return true;
  }
  const name = (company.name ?? '').toLowerCase();
  if (!name) return false;
  return NON_HEALTHCARE_NAME_KEYWORDS.some((k) => name === k || name.includes(k));
}

/**
 * True if the company appears healthcare-focused (specialty or name/description/website).
 */
export function isHealthcareFocusedCompany(
  company: CompanyForFilter & { descriptionOrSummary?: string }
): boolean {
  const specialties = company.specialties ?? [];
  const hasHealthcareSpecialty = specialties.some((s) =>
    HEALTHCARE_SPECIALTIES.includes(s.toLowerCase())
  );
  if (hasHealthcareSpecialty) return true;

  const text = [
    company.name,
    company.website ?? '',
    company.description ?? '',
    company.descriptionOrSummary ?? '',
  ].join(' ');
  return matchesList(text, HEALTHCARE_KEYWORDS);
}

/**
 * Use when listing companies: show only if not a news/media source AND healthcare-focused.
 */
export function shouldShowCompany(
  company: CompanyForFilter & { descriptionOrSummary?: string }
): boolean {
  return (
    !isExcludedNonHealthcareCompany(company) && isHealthcareFocusedCompany(company)
  );
}

/** Seed/demo placeholder companies (e.g. HealthCo 1–15) – exclude from lists so only real ingested companies show. */
export function isSeedDemoCompany(company: { name?: string | null }): boolean {
  const name = (company.name ?? '').trim();
  return /^HealthCo\s+\d+$/i.test(name);
}

/** True if overall recommendation is a good fit (Innovators Network and/or Assessment Lab). */
export function isGoodFitRecommendation(overall: string): boolean {
  return overall !== 'NEITHER';
}

// Allowed healthcare news/signal sources (source name or URL domain) for displaying "Recent News"
const HEALTHCARE_SIGNAL_SOURCE_KEYWORDS = [
  'medcity',
  'mobihealth',
  'fiercehealthcare',
  'fiercebiotech',
  'fiercepharma',
  'healthcareit',
  'hitconsultant',
  'statnews',
  'becker',
  'rockhealth',
  'healthtech',
  'nih',
  'fda',
  'digital health',
  'health tech',
  'medtech',
  'biotech',
  'clinical',
  'patient',
  'hospital',
  'health',
];

/**
 * True if this signal (news/source link) is from a healthcare source or has healthcare content.
 * Use when displaying "Recent News" / signals so only healthcare-relevant links are shown.
 */
export function isHealthcareSignal(signal: {
  sourceName?: string | null;
  url?: string | null;
  title?: string | null;
  summary?: string | null;
}): boolean {
  const name = (signal.sourceName ?? '').toLowerCase();
  const url = (signal.url ?? '').toLowerCase();
  const text = [name, url, signal.title ?? '', signal.summary ?? ''].join(' ').toLowerCase();
  return HEALTHCARE_SIGNAL_SOURCE_KEYWORDS.some((k) => text.includes(k));
}
