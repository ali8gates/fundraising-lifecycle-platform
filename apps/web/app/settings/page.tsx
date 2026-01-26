import { prisma } from '@chti/db';

export default async function SettingsPage() {
  const connectors = await prisma.connector.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <div className="card-header">RSS/Atom Feeds</div>
          <div className="card-body space-y-3">
            <ul className="space-y-2">
              {connectors.map(c => (
                <li key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.type} • every {c.intervalMins}m</div>
                  </div>
                  <span className={`text-xs ${c.isEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>{c.isEnabled ? '✓' : '○'}</span>
                </li>
              ))}
            </ul>
            <hr className="my-2" />
            <div className="text-xs text-slate-600 bg-sky-50 p-2 rounded">
              Add RSS feeds via API: <code className="text-xs font-mono">POST /api/connectors</code> with header <code className="text-xs font-mono">x-admin-key</code>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">External Data Sources</div>
          <div className="card-body space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Crunchbase API</span>
                <span className={process.env.CRUNCHBASE_API_KEY ? 'text-emerald-700 text-xs' : 'text-slate-500 text-xs'}>{process.env.CRUNCHBASE_API_KEY ? '✓ Configured' : '○ Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AngelList API</span>
                <span className={process.env.ANGELLIST_API_KEY ? 'text-emerald-700 text-xs' : 'text-slate-500 text-xs'}>{process.env.ANGELLIST_API_KEY ? '✓ Configured' : '○ Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>SEC EDGAR</span>
                <span className="text-emerald-700 text-xs">✓ Free</span>
              </div>
            </div>
            <hr className="my-2" />
            <div className="text-xs text-slate-600 bg-amber-50 p-2 rounded">
              <strong>Setup:</strong> Add API keys to your <code className="text-xs font-mono">.env</code>:
              <ul className="list-disc pl-4 mt-1">
                <li><code className="text-xs font-mono">CRUNCHBASE_API_KEY=...</code></li>
                <li><code className="text-xs font-mono">ANGELLIST_API_KEY=...</code></li>
              </ul>
              Then restart the worker.
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">Data Source Status</div>
        <div className="card-body text-sm text-slate-700">
          <div className="space-y-2">
            <p><strong>RSS Feeds:</strong> Ingesting from {connectors.filter(c => c.isEnabled).length} sources</p>
            <p><strong>Crunchbase:</strong> Healthcare, medtech, biotech industries (if API key configured)</p>
            <p><strong>AngelList:</strong> Healthcare startups (if API key configured)</p>
            <p><strong>SEC EDGAR:</strong> S-1 IPO filings for healthcare companies</p>
            <p className="text-xs text-slate-500 mt-3">
              ℹ️ Data enrichment runs every {process.env.INGEST_INTERVAL_MINS || '30'} minutes. Companies are auto-created from signal domains and specialties are auto-classified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

