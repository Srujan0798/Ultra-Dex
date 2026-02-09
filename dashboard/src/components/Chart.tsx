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

interface ChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: Series[];
  variant?: ChartVariant;
  height?: number;
}

export function Chart({
  data,
  xKey,
  series,
  variant = 'line',
  height = 280,
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
    <ResponsiveContainer width="100%" height={height}>
      {variant === 'bar' ? (
        <BarChart data={data}>
          {common}
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} fill={item.color} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      ) : variant === 'area' ? (
        <AreaChart data={data}>
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
        <LineChart data={data}>
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
  );
}
