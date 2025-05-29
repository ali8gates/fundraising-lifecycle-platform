import { prisma } from '@chti/db';
import { notFound } from 'next/navigation';
import { getFitLabel, getFitColor, getFittingInitiatives, isGoodFit, computeInnovatorsNetworkFit, computeAiAssessmentLabFit } from '@chti/shared';
import { LinkedInExecutives } from '@/components/LinkedInExecutives';

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { signals: { orderBy: { publishedAt: 'desc' }, take: 20 }, meetings: true, outreachEvents: true },
  });
  if (!company) return notFound();
  
  // Compute fits based on data signals (matching the companies list)
  const fits = {
    innovatorsNetworkFit: computeInnovatorsNetworkFit({
      totalScore: company.totalScore,
      signals: company.signals || [],
    }),
    aiAssessmentLabFit: computeAiAssessmentLabFit({
      stage: company.stage,
      fundingStage: company.fundingStage ?? undefined,
      meetings: company.meetings || [],
    }),
  };

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
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-slate-600">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="text-lg font-semibold">{company.name}</div>
                {company.website && <a className="text-sky-700 underline text-sm" href={company.website} target="_blank">{company.website}</a>}
              </div>
            </div>
            <div>Specialties: {company.specialties.join(', ') || '—'}</div>
            <div>Stage: {company.stage}</div>
            <div>Total Score: {company.totalScore.toFixed(2)}</div>
            <div>Funding Stage: {company.fundingStage}</div>
            <div>Updated: {new Date(company.updatedAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">Program Fit</div>
          <div className="card-body space-y-3">
            {(() => {
              const fittingInitiatives = getFittingInitiatives(fits.innovatorsNetworkFit, fits.aiAssessmentLabFit);
              
              if (fittingInitiatives.length === 0) {
                return (
                  <div>
                    <div className="text-sm text-slate-600 mb-3">This company is not currently identified as a strong fit for our initiatives.</div>
                    <div className="text-xs text-slate-500 pt-2 border-t">
                      Initiatives checked:
                    </div>
                    <div className="flex flex-col gap-2 mt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">AI Innovators Network</span>
                        <span className={`font-medium px-2 py-1 rounded ${getFitColor(fits.innovatorsNetworkFit)}`}>
                          {getFitLabel(fits.innovatorsNetworkFit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">AI Assessment Lab</span>
                        <span className={`font-medium px-2 py-1 rounded ${getFitColor(fits.aiAssessmentLabFit)}`}>
                          {getFitLabel(fits.aiAssessmentLabFit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div>
                  <div className="text-sm font-medium text-slate-900 mb-3">
                    Good fit for:
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {fittingInitiatives.map((initiative) => (
                      <span
                        key={initiative}
                        className={`text-sm font-medium px-3 py-1 rounded ${
                          initiative === 'AI Innovators Network'
                            ? isGoodFit(fits.innovatorsNetworkFit) && fits.innovatorsNetworkFit === 'strong'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                            : isGoodFit(fits.aiAssessmentLabFit) && fits.aiAssessmentLabFit === 'strong'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {initiative}
                        {initiative === 'AI Innovators Network' && fits.innovatorsNetworkFit === 'strong' && ' ✓'}
                        {initiative === 'AI Assessment Lab' && fits.aiAssessmentLabFit === 'strong' && ' ✓'}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 pt-2 border-t">
                    These fits are based on internal data signals and may evolve as we learn more.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <LinkedInExecutives companyId={company.id} />
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="card">
          <div className="card-header">Signals</div>
          <div className="card-body space-y-3">
            {company.signals.map(s => (
              <div key={s.id} className="border-b pb-2 last:border-b-0">
                <a className="font-medium hover:underline" href={s.url} target="_blank">{s.title}</a>
                <div className="text-xs text-slate-500">{s.sourceName} • {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : '—'}</div>
                {s.summary && <div className="text-sm text-slate-700">{s.summary}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">Outreach</div>
          <div className="card-body text-sm text-slate-700">
            {company.outreachEvents.length === 0 ? 'No outreach yet.' : (
              <ul className="space-y-2">
                {company.outreachEvents.map(o => (
                  <li key={o.id} className="flex justify-between"><span>{o.channel} — {o.note || '—'}</span><span className="text-slate-500">{o.outcome}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">Meetings</div>
          <div className="card-body text-sm text-slate-700">
            {company.meetings.length === 0 ? 'No meetings.' : (
              <ul className="space-y-2">
                {company.meetings.map(m => (
                  <li key={m.id} className="flex justify-between"><span>{new Date(m.startsAt).toLocaleString()} → {new Date(m.endsAt).toLocaleString()}</span><a className="text-sky-700 underline" target="_blank" href={m.inviteLink || '#'}>Invite</a></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

