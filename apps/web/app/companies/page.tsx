import { prisma } from '@chti/db';
import { StageBadge } from '../../components/StageBadge';
import { getFittingInitiatives, isGoodFit, computeInnovatorsNetworkFit, computeAiAssessmentLabFit } from '@chti/shared';

// Helper to compute sample program fits based on company data
function computeSampleFits(company: any) {
  return {
    innovatorsNetworkFit: computeInnovatorsNetworkFit({
      totalScore: company.totalScore,
      signals: company.signals || [],
    }),
    aiAssessmentLabFit: computeAiAssessmentLabFit({
      stage: company.stage,
      fundingStage: company.fundingStage,
      meetings: company.meetings || [],
    }),
  };
}

export default async function CompaniesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = (searchParams.q as string) || '';
  const minScore = Number(searchParams.minScore ?? '0');
  const maxScore = Number(searchParams.maxScore ?? '1');
  const specialty = (searchParams.specialty as string) || '';
  const stage = (searchParams.stage as string) || '';

  const companies = await prisma.company.findMany({
    where: {
      AND: [
        q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { website: { contains: q, mode: 'insensitive' } }] } : {},
        specialty ? { specialties: { has: specialty } } : {},
        stage ? { stage: stage as any } : {},
        { totalScore: { gte: isNaN(minScore) ? 0 : minScore, lte: isNaN(maxScore) ? 1 : maxScore } },
      ],
    },
    include: { signals: { orderBy: { publishedAt: 'desc' }, take: 1 } },
    orderBy: [{ updatedAt: 'desc' }],
    take: 100,
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form>
          <input name="q" defaultValue={q} placeholder="Search companies" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </form>
      </div>
      <div className="card">
        <div className="card-body overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Specialties</th>
                <th className="p-2">Program Fit</th>
                <th className="p-2">Recent News</th>
                <th className="p-2">Funding / Revenue</th>
                <th className="p-2">Stage</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const latestSignal = c.signals?.[0];
                const financialText = c.fundingStage === 'GROWTH' || c.fundingStage === 'OTHER'
                  ? c.revenueAmount ? `$${c.revenueAmount}M Revenue` : '—'
                  : c.fundingAmount ? `$${c.fundingAmount}M Funding` : '—';

                const fits = computeSampleFits(c);
                
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
                          <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      {(() => {
                        const fittingInitiatives = getFittingInitiatives(fits.innovatorsNetworkFit, fits.aiAssessmentLabFit);
                        
                        if (fittingInitiatives.length === 0) {
                          return <span className="text-xs text-slate-500">No fit identified</span>;
                        }
                        
                        return (
                          <div className="flex flex-wrap gap-1">
                            {fittingInitiatives.map((initiative) => (
                              <span
                                key={initiative}
                                className={`text-xs font-medium px-2 py-1 rounded ${
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
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-2">
                      {latestSignal ? (
                        <a
                          href={latestSignal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs line-clamp-2"
                          title={latestSignal.title}
                        >
                          {latestSignal.title}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">No news yet</span>
                      )}
                      {latestSignal && (
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(latestSignal.publishedAt!).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="text-sm font-medium text-slate-700">{financialText}</span>
                      <div className="text-xs text-slate-500">{c.fundingStage}</div>
                    </td>
                    <td className="p-2">
                      <StageBadge stage={c.stage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

