import { prisma } from '@chti/db';
import { CompanyCard } from '../components/CompanyCard';
import { shouldShowCompany, computeCompanyFit, isGoodFitRecommendation, isSeedDemoCompany } from '@chti/shared';

// Revalidate homepage every 60s so ingested data shows up
export const revalidate = 60;

function companyForFit(c: { name: string; description?: string | null; website?: string | null; specialties: string[]; signals?: { title: string; summary?: string | null }[]; enrichedWebText?: string | null }) {
  const signalsText = (c.signals ?? []).map((s) => `${s.title} ${s.summary ?? ''}`).join(' ');
  return { name: c.name, description: c.description, website: c.website, specialties: c.specialties, signalsText: signalsText || undefined, enrichedWebText: c.enrichedWebText ?? undefined };
}

const RECOMMENDATION_ORDER = { AI_ASSESSMENT_LAB: 0, INNOVATORS_NETWORK: 1, BOTH: 2, NEITHER: 3 };

export default async function DashboardPage() {
  try {
    const [companiesWithSignals] = await Promise.all([
      prisma.company.findMany({
        include: {
          signals: { orderBy: { publishedAt: 'desc' }, take: 10 },
          meetings: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 150,
      }),
    ]);

    const filtered = companiesWithSignals.filter((c) => shouldShowCompany(c) && !isSeedDemoCompany(c));

    const withFit = filtered.map((c) => ({ company: c, fit: computeCompanyFit(companyForFit(c)) }));

    // Only display companies that are a good fit (Innovators Network and/or Assessment Lab)
    const goodFitOnly = withFit.filter((row) => isGoodFitRecommendation(row.fit.overall_recommendation));
    const countsByStage = goodFitOnly.reduce<Record<string, number>>((acc, { company }) => {
      acc[company.stage] = (acc[company.stage] ?? 0) + 1;
      return acc;
    }, {});
    const totalCompanies = goodFitOnly.length;

    const newCompanies = goodFitOnly
      .filter((row) => row.company.stage === 'NEW')
      .slice(0, 8);

    const goodFitCompanies = goodFitOnly
      .sort(
        (a, b) =>
          (RECOMMENDATION_ORDER[a.fit.overall_recommendation as keyof typeof RECOMMENDATION_ORDER] ?? 4) -
          (RECOMMENDATION_ORDER[b.fit.overall_recommendation as keyof typeof RECOMMENDATION_ORDER] ?? 4)
      )
      .slice(0, 8);

    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">Companies by Stage</div>
          <div className="card-body">
            <ul className="space-y-1">
              {Object.entries(countsByStage)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([stage, count]) => (
                  <li key={stage} className="flex justify-between">
                    <span>{stage.replaceAll('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
            </ul>
            <p className="mt-2 text-sm text-slate-500">
              {totalCompanies} companies total · data updates as ingestion runs
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">New companies</div>
          <div className="card-body">
            {newCompanies.length === 0 ? (
              <p className="text-center text-slate-500 py-6">
                No new companies yet. Run the worker to ingest from RSS and other sources.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {newCompanies.map(({ company }) => (
                  <CompanyCard
                    key={company.id}
                    id={company.id}
                    name={company.name}
                    logoUrl={company.logoUrl}
                  />
                ))}
              </div>
            )}
            {newCompanies.length > 0 && (
              <a
                href="/companies?stage=NEW"
                className="mt-3 inline-block text-sm text-slate-600 hover:underline"
              >
                View all new →
              </a>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">Good fit for programs</div>
          <div className="card-body">
            {goodFitCompanies.length === 0 ? (
              <p className="text-center text-slate-500 py-6">
                No companies marked as good fit yet. Fit is based on signals; more ingestion will surface fits.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {goodFitCompanies.map(({ company }) => (
                  <CompanyCard
                    key={company.id}
                    id={company.id}
                    name={company.name}
                    logoUrl={company.logoUrl}
                  />
                ))}
              </div>
            )}
            {goodFitCompanies.length > 0 && (
              <a
                href="/companies"
                className="mt-3 inline-block text-sm text-slate-600 hover:underline"
              >
                View all companies →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Database error:', error);
    return (
      <div className="space-y-4">
        <div className="card">
          <div className="card-header">Error</div>
          <div className="card-body">
            <p className="text-red-600">
              Failed to load data. Please ensure the database is set up and migrations are run.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Error: {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
