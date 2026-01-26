export function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-32 rounded bg-slate-200">
      <div className="h-2 rounded bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

