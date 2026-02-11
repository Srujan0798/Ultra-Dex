import type { LucideIcon } from 'lucide-react';
import { memo } from 'react';

const toneStyles: Record<string, { icon: string; ring: string }> = {
  emerald: { icon: 'text-emerald-400', ring: 'bg-emerald-500/10' },
  cyan: { icon: 'text-cyan-400', ring: 'bg-cyan-500/10' },
  amber: { icon: 'text-amber-400', ring: 'bg-amber-500/10' },
  rose: { icon: 'text-rose-400', ring: 'bg-rose-500/10' },
};

/**
 * MetricCard - Displays a key metric with icon and optional delta
 * @param label - The metric label
 * @param value - The metric value
 * @param delta - Optional change indicator (e.g., "+5%")
 * @param icon - Lucide icon component
 * @param tone - Color tone (emerald, cyan, amber, rose)
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'emerald',
}: MetricCardProps) {
  const toneClass = toneStyles[tone] || toneStyles.emerald;
  const isPositive = delta?.startsWith('+');

  return (
    <article
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
      role="region"
      aria-label={`${label} metric: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] text-slate-500"
            id={`metric-label-${label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-semibold text-slate-100"
            aria-labelledby={`metric-label-${label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass.ring}`}>
          <Icon className={`h-5 w-5 ${toneClass.icon}`} aria-hidden="true" />
        </div>
      </div>
      {delta ? (
        <p className="mt-3 text-sm text-slate-400" role="status" aria-live="polite">
          <span
            className={isPositive ? 'text-emerald-400' : 'text-rose-400'}
            aria-label={`Change: ${delta}`}
          >
            {delta}
          </span>{' '}
          vs last week
        </p>
      ) : null}
    </article>
  );
});

/**
 * Error handler for MetricCard component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleMetricCardError(error, errorInfo) {
  try {
    console.error(`[MetricCard] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
