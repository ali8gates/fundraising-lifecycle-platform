import { prisma } from '@chti/db';
import { shouldShowCompany, computeCompanyFit, isGoodFitRecommendation, isHealthcareSignal, isSeedDemoCompany } from '@chti/shared';

/** Build CompanyForFit from DB company + signals + scraped web text for fit engine */
function companyForFit(c: { name: string; description?: string | null; website?: string | null; specialties: string[]; signals?: { title: string; summary?: string | null }[]; enrichedWebText?: string | null }) {
  const signalsText = (c.signals ?? []).map((s) => `${s.title} ${s.summary ?? ''}`).join(' ');
  return {
    name: c.name,
    description: c.description,
    website: c.website,
    specialties: c.specialties,
    signalsText: signalsText || undefined,
    enrichedWebText: c.enrichedWebText ?? undefined,
  };
}

/** Placeholder/example domains – do not link (read-only); real article URLs get a link. */
const PLACEHOLDER_HOSTS = ['example.com', 'news.example.com', 'example.org'];

function normalizeNewsUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== 'string') return null;
  let u = url.trim();
  if (!u) return null;
  if (/^https?:\s+https?:\/\//i.test(u)) u = u.replace(/^https?:\s+/i, '').trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
  try {
    const host = new URL(u).hostname.toLowerCase();
    if (PLACEHOLDER_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return null;
    return u;
  } catch {
    if (/news\.example\.com|\.example\.(com|org)(\/|$)/i.test(u)) return null;
    return u;
  }
}

/** Both badges when applicable: AI Assessment Lab (if eligible) + Innovators Network · tier (if INNOVATOR/INTEGRATOR). */
function getFitBadges(eligible: boolean, tier: string): { label: string; className: string }[] {
  const badges: { label: string; className: string }[] = [];
  if (eligible) badges.push({ label: 'AI Assessment Lab', className: 'bg-violet-100 text-violet-700' });
  if (tier === 'INTEGRATOR') badges.push({ label: 'Innovators Network · Integrator', className: 'bg-sky-100 text-sky-700' });
  else if (tier === 'INNOVATOR') badges.push({ label: 'Innovators Network · Innovator', className: 'bg-emerald-100 text-emerald-700' });
  if (badges.length === 0) badges.push({ label: 'Neither', className: 'bg-slate-100 text-slate-600' });
  return badges;
}

/** Top 3 reasons: Lab reasons first (if eligible), then Innovators, combined. */
function getTopReasons(eligible: boolean, inReasons: string[], labReasons: string[]): string[] {
  const combined = eligible ? [...labReasons, ...inReasons] : inReasons;
  return combined.slice(0, 3);
}

export default async function CompaniesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = (searchParams.q as string) || '';
  const recommendation = (searchParams.recommendation as string) || '';
  const tier = (searchParams.tier as string) || '';
  const labEligible = (searchParams.labEligible as string) || '';
  const specialty = (searchParams.specialty as string) || '';
  const showAll = (searchParams.show as string) === 'all';

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { website: { contains: q, mode: 'insensitive' } }] } : {},
        specialty ? { specialties: { has: specialty } } : {},
      ],
    },
    include: { signals: { orderBy: { publishedAt: 'desc' }, take: 10 } },
    orderBy: [{ updatedAt: 'desc' }],
    take: 150,
  });

  const filteredByHealthcare = companies.filter((c) => shouldShowCompany(c) && !isSeedDemoCompany(c));

  type CompanyWithFit = typeof companies[0] & {
    innovatorsNetworkTier?: string | null;
    innovatorsNetworkReasons?: unknown;
    assessmentLabReasons?: unknown;
    assessmentLabEligible?: boolean | null;
    assessmentLabCriteria?: { therapeuticAreas?: string[]; modalities?: string[] } | null;
    overallRecommendation?: string | null;
  };
  const withFit = filteredByHealthcare.map((c) => {
    const row = c as CompanyWithFit;
    const useStored =
      row.overallRecommendation != null &&
      row.innovatorsNetworkTier != null &&
      row.assessmentLabReasons != null &&
      Array.isArray(row.innovatorsNetworkReasons) &&
      Array.isArray(row.assessmentLabReasons);
    const fit = useStored
      ? {
          innovators_network_fit: { recommended_tier: row.innovatorsNetworkTier!, reasons: (row.innovatorsNetworkReasons as string[]) ?? [] },
          assessment_lab_fit: {
            eligible: row.assessmentLabEligible ?? false,
            reasons: (row.assessmentLabReasons as string[]) ?? [],
            extracted_criteria: (row.assessmentLabCriteria as { therapeuticAreas?: string[]; modalities?: string[] }) ?? { therapeuticAreas: [], modalities: [] },
          },
          overall_recommendation: row.overallRecommendation!,
        }
      : computeCompanyFit(companyForFit(c));
    return { company: c, fit };
  });

  const goodFitOnly = withFit.filter((row) => isGoodFitRecommendation(row.fit.overall_recommendation));
  const listPool = showAll ? withFit : goodFitOnly;

  const filtered = listPool.filter((row) => {
    if (recommendation && recommendation !== '') {
      if (recommendation === 'AI_ASSESSMENT_LAB' && row.fit.overall_recommendation !== 'AI_ASSESSMENT_LAB' && row.fit.overall_recommendation !== 'BOTH') return false;
      if (recommendation !== 'AI_ASSESSMENT_LAB' && row.fit.overall_recommendation !== recommendation) return false;
    }
    if (tier && row.fit.innovators_network_fit.recommended_tier !== tier) return false;
    if (labEligible === 'yes' && !row.fit.assessment_lab_fit.eligible) return false;
    if (labEligible === 'no' && row.fit.assessment_lab_fit.eligible) return false;
    return true;
  });

  const labEligibleCount = withFit.filter((r) => r.fit.assessment_lab_fit.eligible).length;
  const goodFitCount = goodFitOnly.length;

  return (
    <div>
      {goodFitCount === 0 && !showAll && (
        <div className="mb-3 rounded bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>To see AI Assessment Lab and Innovators Network badges:</strong> run the backfill to scrape company websites and classify fit. From the repo root: <code className="bg-amber-100 px-1 rounded">pnpm --filter @chti/worker exec tsx src/scripts/backfillFit.ts</code>
        </div>
      )}
      {labEligibleCount === 0 && goodFitCount > 0 && (
        <div className="mb-3 rounded bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
          No companies are classified as AI Assessment Lab eligible yet. Run the backfill (see command above) to scrape websites and recompute fit.
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form className="flex flex-wrap items-center gap-2">
          <select name="show" defaultValue={showAll ? 'all' : 'goodfit'} className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="goodfit">Show: Good fit only</option>
            <option value="all">Show: All companies</option>
          </select>
          <input name="q" defaultValue={q} placeholder="Search companies" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="recommendation" defaultValue={recommendation} className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">Recommendation: all</option>
            <option value="INNOVATORS_NETWORK">Innovators Network</option>
            <option value="AI_ASSESSMENT_LAB">AI Assessment Lab</option>
          </select>
          <select name="tier" defaultValue={tier} className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tier: all</option>
            <option value="INNOVATOR">Innovator</option>
            <option value="INTEGRATOR">Integrator</option>
          </select>
          <select name="labEligible" defaultValue={labEligible} className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">AI Assessment Lab: any</option>
            <option value="yes">AI Assessment Lab: eligible</option>
            <option value="no">AI Assessment Lab: not eligible</option>
          </select>
          <button type="submit" className="rounded bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">Apply</button>
        </form>
      </div>
      <div className="card">
        <div className="card-body overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Specialties</th>
                <th className="p-2">Offerings</th>
                <th className="p-2">Why (top 3)</th>
                <th className="p-2">Recent News</th>
                <th className="p-2">Funding / Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 text-sm">
                    {listPool.length === 0
                      ? 'No companies yet. Run the worker to ingest signals, or switch to "Show: All companies" to see any that exist.'
                      : 'No companies match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(({ company: c, fit }) => {
                  const signals = (c.signals ?? []).filter((s: { sourceName?: string | null; url?: string | null; title?: string | null; summary?: string | null }) => isHealthcareSignal(s));
                  const newsSignals = signals.filter((s: { sourceType: string }) => s.sourceType === 'news');
                  const latestSignal = newsSignals[0] ?? signals[0];
                  const financialText = c.fundingStage === 'GROWTH' || c.fundingStage === 'OTHER'
                    ? c.revenueAmount != null ? `$${c.revenueAmount}M Revenue` : (c.fundingStage ? `${c.fundingStage}` : '—')
                    : c.fundingAmount != null ? `$${c.fundingAmount}M Funding` : (c.fundingStage ? `${c.fundingStage}` : '—');

                  const fitBadges = getFitBadges(fit.assessment_lab_fit.eligible, fit.innovators_network_fit.recommended_tier);
                  const topReasons = getTopReasons(
                    fit.assessment_lab_fit.eligible,
                    fit.innovators_network_fit.reasons,
                    fit.assessment_lab_fit.reasons
                  );

                  return (
                    <tr key={c.id} className="border-t hover:bg-slate-50">
                      <td className="p-2">
                        <a className="text-blue-600 hover:underline font-medium" href={`/companies/${c.id}`}>
                          {c.name}
                        </a>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1 flex-wrap">
                          {c.specialties.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1 items-center">
                          {fitBadges.map((b) => (
                            <span key={b.label} className={`text-xs font-medium px-2 py-1 rounded ${b.className}`}>
                              {b.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 max-w-xs">
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                          {topReasons.length ? topReasons.map((r, i) => <li key={i}>{r}</li>) : <span className="text-slate-400">—</span>}
                        </ul>
                      </td>
                      <td className="p-2">
                        {latestSignal ? (
                          (() => {
                            let linkUrl = normalizeNewsUrl(latestSignal.url);
                            if (!linkUrl && latestSignal.url && String(latestSignal.url).trim().match(/^https?:\/\//)) {
                              linkUrl = String(latestSignal.url).trim().replace(/^https?:\s+/, '');
                            }
                            return linkUrl ? (
                              <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs line-clamp-2" title={latestSignal.title}>
                                {latestSignal.title}
                              </a>
                            ) : (
                              <span className="text-xs text-slate-600 line-clamp-2" title={latestSignal.title}>{latestSignal.title}</span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-400 text-xs">No news yet</span>
                        )}
                        {latestSignal && (
                          <div className="text-xs text-slate-500 mt-1">
                            {latestSignal.sourceName}{' · '}
                            {latestSignal.publishedAt ? new Date(latestSignal.publishedAt).toLocaleDateString() : ''}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="text-sm font-medium text-slate-700">{financialText}</span>
                        <div className="text-xs text-slate-500">{c.fundingStage}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
