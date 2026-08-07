'use client';

interface ScoreDisplayProps {
  score: number;
  vouchCount: number;
  label?: string;
}

export function ScoreDisplay({ score, vouchCount, label }: ScoreDisplayProps) {
  const color = score >= 100 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const bg = score >= 100 ? 'bg-emerald-400/10' : score >= 50 ? 'bg-amber-400/10' : 'bg-red-400/10';

  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      {label && <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>}
      <p className={`text-4xl font-bold ${color}`}>{score}</p>
      <p className="text-sm text-zinc-400 mt-1">{vouchCount} vouch{vouchCount !== 1 ? 'es' : ''}</p>
    </div>
  );
}
