'use client';

import { useLinkedInExecutives } from '@/hooks/useLinkedInExecutives';

interface LinkedInExecutivesProps {
  companyId: string;
}

export function LinkedInExecutives({ companyId }: LinkedInExecutivesProps) {
  const { executives, loading, error } = useLinkedInExecutives(companyId);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">Key Executives</div>
        <div className="card-body">
          <div className="text-sm text-slate-500 py-4">Loading executives…</div>
        </div>
      </div>
    );
  }

  if (error || executives.length === 0) {
    return (
      <div className="card">
        <div className="card-header">Key Executives</div>
        <div className="card-body">
          <div className="text-sm text-slate-500">
            Executives not available for this company yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">Key Executives</div>
      <div className="card-body space-y-3">
        {executives.map((executive, idx) => (
          <div key={idx} className="flex items-start justify-between pb-2 last:pb-0 border-b last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900">{executive.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">{executive.title}</div>
            </div>
            <a
              href={executive.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 ml-2 text-sky-700 hover:text-sky-900 text-xs font-medium"
              aria-label={`View ${executive.name}'s LinkedIn profile`}
            >
              LinkedIn
            </a>
          </div>
        ))}
        <div className="text-xs text-slate-400 pt-2 mt-2 border-t">
          Pulled from LinkedIn Sales Navigator
        </div>
      </div>
    </div>
  );
}



