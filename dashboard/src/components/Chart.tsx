import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type ChartVariant = 'line' | 'area' | 'bar';

interface Series {
  key: string;
  color: string;
}

/**
 * Chart - Reusable chart component with multiple variants
 * @param data - Array of data points
 * @param xKey - Key for X-axis values
 * @param series - Array of series configurations
 * @param variant - Chart type: 'line', 'area', or 'bar'
 * @param height - Chart height in pixels
 */
interface ChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: Series[];
  variant?: ChartVariant;
  height?: number;
  title?: string;
}

export const Chart = memo(function Chart({
  data,
  xKey,
  series,
  variant = 'line',
  height = 280,
  title = 'Data Chart',
}: ChartProps) {
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
      <XAxis dataKey={xKey} stroke="#94a3b8" tickLine={false} axisLine={false} />
      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937' }} />
    </>
  );

  return (
    <figure
      role="img"
      aria-label={`${title}: ${variant} chart showing ${series.map(s => s.key).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height={height}>
        {variant === 'bar' ? (
          <BarChart data={data} aria-label={`Bar chart: ${title}`}>
            {common}
            {series.map((item) => (
              <Bar key={item.key} dataKey={item.key} fill={item.color} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        ) : variant === 'area' ? (
          <AreaChart data={data} aria-label={`Area chart: ${title}`}>
            {common}
            {series.map((item) => (
              <Area
                key={item.key}
                dataKey={item.key}
                stroke={item.color}
                fill={`${item.color}33`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} aria-label={`Line chart: ${title}`}>
            {common}
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
});

/**
 * Error handler for Chart component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleChartError(error, errorInfo) {
  try {
    console.error(`[Chart] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
