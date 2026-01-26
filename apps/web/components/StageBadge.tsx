export function StageBadge({ stage }: { stage: string }) {
  const color = stage.includes('ARCHIVED')
    ? 'bg-slate-200 text-slate-700'
    : stage.includes('MEETING')
    ? 'bg-indigo-100 text-indigo-700'
    : stage.includes('OUTREACH')
    ? 'bg-amber-100 text-amber-800'
    : stage.includes('QUALIFIED')
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-sky-100 text-sky-800';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {stage.replaceAll('_', ' ')}
    </span>
  );
}

