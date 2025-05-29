import { prisma } from '@chti/db';

export default async function ScoringPage() {
  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });
  const weights = (config?.weights as any) ?? { ai: 0.3, market: 0.25, funding: 0.2, team: 0.15, regulatory: 0.1 };
  const thresholds = (config?.thresholds as any) ?? { pass_to_review_threshold: 0.55, outreach_threshold: 0.7 };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="card">
        <div className="card-header">Weights</div>
        <form className="card-body space-y-3" action="/api/scoring/config" method="post">
          {Object.entries(weights).map(([k, v]) => (
            <label key={k} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700">{k}</span>
              <input className="w-24 rounded border border-slate-300 px-2 py-1 text-right" type="number" step="0.01" min="0" max="1" name={`w_${k}`} defaultValue={v as number} />
            </label>
          ))}
          <button className="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Save Weights</button>
        </form>
      </div>
      <div className="card">
        <div className="card-header">Thresholds</div>
        <form className="card-body space-y-3" action="/api/scoring/config" method="post">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700">pass_to_review_threshold</span>
            <input className="w-24 rounded border border-slate-300 px-2 py-1 text-right" type="number" step="0.01" min="0" max="1" name="t_review" defaultValue={thresholds.pass_to_review_threshold} />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700">outreach_threshold</span>
            <input className="w-24 rounded border border-slate-300 px-2 py-1 text-right" type="number" step="0.01" min="0" max="1" name="t_outreach" defaultValue={thresholds.outreach_threshold} />
          </label>
          <button className="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Save Thresholds</button>
        </form>
      </div>
    </div>
  );
}

