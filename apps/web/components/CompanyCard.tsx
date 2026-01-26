import Link from 'next/link';

interface CompanyCardProps {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export function CompanyCard({ id, name, logoUrl }: CompanyCardProps) {
  return (
    <Link href={`/companies/${id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="card-body">
          <div className="flex items-start gap-3">
            {/* Logo Section */}
            {logoUrl ? (
              <div className="flex-shrink-0">
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  className="w-12 h-12 object-contain bg-slate-100 rounded p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 truncate">{name}</h3>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

