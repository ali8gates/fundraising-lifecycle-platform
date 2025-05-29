import { prisma } from '@chti/db';
import { notFound } from 'next/navigation';
import { shouldShowCompany, computeCompanyFit, fitResultForUI, isGoodFitRecommendation, isHealthcareSignal, isSeedDemoCompany } from '@chti/shared';

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

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { signals: { orderBy: { publishedAt: 'desc' }, take: 20 }, meetings: true },
  });
  if (!company) return notFound();
  if (!shouldShowCompany(company) || isSeedDemoCompany(company)) return notFound();

  type CompanyWithFit = typeof company & {
    innovatorsNetworkTier?: string | null;
    innovatorsNetworkReasons?: unknown;
    assessmentLabReasons?: unknown;
    assessmentLabEligible?: boolean | null;
    assessmentLabCriteria?: { therapeuticAreas?: string[]; modalities?: string[]; groundTruthSources?: string[] } | null;
    overallRecommendation?: string | null;
  };
  const row = company as CompanyWithFit;
  const useStored =
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
          extracted_criteria: (row.assessmentLabCriteria as { therapeuticAreas?: string[]; modalities?: string[]; groundTruthSources?: string[] }) ?? { therapeuticAreas: [], modalities: [], groundTruthSources: [] },
        },
        overall_recommendation: row.overallRecommendation!,
      }
    : computeCompanyFit(companyForFit(company));
  if (!isGoodFitRecommendation(fit.overall_recommendation)) return notFound();

  const labFit = fitResultForUI(fit.assessment_lab_fit);

  // Both badges when applicable: AI Assessment Lab + Innovators Network · tier
  const fitBadges: { label: string; className: string }[] = [];
  if (fit.assessment_lab_fit.eligible) fitBadges.push({ label: 'AI Assessment Lab', className: 'bg-violet-100 text-violet-700' });
  if (fit.innovators_network_fit.recommended_tier === 'INTEGRATOR') fitBadges.push({ label: 'Innovators Network · Integrator', className: 'bg-sky-100 text-sky-700' });
  else if (fit.innovators_network_fit.recommended_tier === 'INNOVATOR') fitBadges.push({ label: 'Innovators Network · Innovator', className: 'bg-emerald-100 text-emerald-700' });
  if (fitBadges.length === 0) fitBadges.push({ label: 'Neither', className: 'bg-slate-100 text-slate-600' });
  const topReasons = fit.assessment_lab_fit.eligible
    ? [...(fit.assessment_lab_fit.reasons ?? []), ...(fit.innovators_network_fit.reasons ?? [])].slice(0, 3)
    : (fit.innovators_network_fit.reasons ?? []).slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1 space-y-4">
        <div className="card">
          <div className="card-header">Overview</div>
          <div className="card-body space-y-3">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  className="w-16 h-16 object-contain bg-slate-100 rounded p-1 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-slate-600">{company.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="text-lg font-semibold">{company.name}</div>
                {company.website && (
                  <a className="text-sky-700 underline text-sm" href={company.website} target="_blank">{company.website}</a>
                )}
              </div>
            </div>
            <div>Specialties: {company.specialties.join(', ') || '—'}</div>
            <div>Stage: {company.stage}</div>
            <div>Funding Stage: {company.fundingStage}</div>
            <div>Updated: {new Date(company.updatedAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">Program fit</div>
          <div className="card-body space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Offerings</div>
              <div className="flex flex-wrap gap-2">
                {fitBadges.map((b) => (
                  <span key={b.label} className={`inline-block text-sm font-medium px-3 py-1 rounded ${b.className}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Why (top 3)</div>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {(topReasons.length ? topReasons : ['No reasons identified.']).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {fit.assessment_lab_fit.eligible && labFit.extracted_criteria && (labFit.extracted_criteria.therapeuticAreas?.length > 0 || labFit.extracted_criteria.modalities?.length > 0) && (
                <div className="mt-2 text-xs text-slate-500">
                  Extracted: {[
                    labFit.extracted_criteria.therapeuticAreas?.join(', '),
                    labFit.extracted_criteria.modalities?.join(', '),
                  ].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="card">
          <div className="card-header">Signals</div>
          <div className="card-body space-y-3">
            {company.signals.filter((s) => isHealthcareSignal(s)).map((s) => (
              <div key={s.id} className="border-b pb-2 last:border-b-0">
                <a className="font-medium hover:underline" href={s.url} target="_blank">{s.title}</a>
                <div className="text-xs text-slate-500">{s.sourceName} · {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : '—'}</div>
                {s.summary && <div className="text-sm text-slate-700">{s.summary}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">Meetings</div>
          <div className="card-body text-sm text-slate-700">
            {company.meetings.length === 0 ? 'No meetings.' : (
              <ul className="space-y-2">
                {company.meetings.map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{new Date(m.startsAt).toLocaleString()} → {new Date(m.endsAt).toLocaleString()}</span>
                    <a className="text-sky-700 underline" target="_blank" href={m.inviteLink || '#'}>Invite</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
