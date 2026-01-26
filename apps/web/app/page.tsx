import { prisma } from '@chti/db';
import { CompanyCard } from '../components/CompanyCard';

export default async function DashboardPage() {
  try {
    const [countsByStage, topCompanies] = await Promise.all([
      prisma.company.groupBy({ by: ['stage'], _count: { stage: true } }),
      prisma.company.findMany({
        take: 6,
        orderBy: { totalScore: 'desc' },
      }),
    ]);

    const totalCompanies = await prisma.company.count();

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">Companies by Stage</div>
        <div className="card-body">
          <ul className="space-y-1">
            {countsByStage.map((c) => (
              <li key={c.stage} className="flex justify-between">
                <span>{c.stage.replaceAll('_', ' ')}</span>
                <span className="font-medium">{c._count.stage}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Top Companies</div>
        <div className="card-body">
          {topCompanies.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No companies yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  logoUrl={company.logoUrl}
                />
              ))}
            </div>
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

