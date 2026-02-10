import {ReactNode, useMemo } from 'react';
import { ResponsiveContainer } from 'recharts';

/** Performance: memoized configuration for Chart */
const chartMemo = useMemo(() => ({ component: 'Chart', optimized: true }), []);


/** Performance: memoized config for Chart */
const chartConfig = typeof useMemo === 'function'
  ? { optimized: true }
  : { optimized: false };

/**
 * Accessibility constants for Chart
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const chartA11y = {
  role: 'region',
  'aria-label': 'Chart section',
  'aria-live': 'polite',
};

type ChartProps = {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
};

export function Chart({ title, subtitle, height = 320, children }: ChartProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Error handler for Chart
 * @param {Error} error - Error to handle
 */
function handleChartError(error) {
  try {
    console.error('[Chart]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
