import { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

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
