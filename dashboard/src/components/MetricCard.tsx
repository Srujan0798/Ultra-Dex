import type { LucideIcon } from 'lucide-react';

const toneStyles: Record<string, { icon: string; ring: string }> = {
  emerald: { icon: 'text-emerald-400', ring: 'bg-emerald-500/10' },
  cyan: { icon: 'text-cyan-400', ring: 'bg-cyan-500/10' },
  amber: { icon: 'text-amber-400', ring: 'bg-amber-500/10' },
  rose: { icon: 'text-rose-400', ring: 'bg-rose-500/10' },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'emerald',
}: MetricCardProps) {
  const toneClass = toneStyles[tone] || toneStyles.emerald;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass.ring}`}>
          <Icon className={`h-5 w-5 ${toneClass.icon}`} />
        </div>
      </div>
      {delta ? (
        <p className="mt-3 text-sm text-slate-400">
          <span className={delta.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
            {delta}
          </span>{' '}
          vs last week
        </p>
      ) : null}
    </div>
  );
}
