/** Outreach stage is deprecated; display as Qualified. */
function displayStage(stage: string) {
  return stage === 'OUTREACH' ? 'QUALIFIED' : stage;
}

export function StageBadge({ stage }: { stage: string }) {
  const display = displayStage(stage);
  const color = display.includes('ARCHIVED')
    ? 'bg-slate-200 text-slate-700'
    : display.includes('MEETING')
    ? 'bg-indigo-100 text-indigo-700'
    : display.includes('QUALIFIED')
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-sky-100 text-sky-800';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {display.replaceAll('_', ' ')}
    </span>
  );
}

