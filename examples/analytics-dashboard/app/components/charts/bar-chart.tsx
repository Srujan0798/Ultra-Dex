/**
 * @fileoverview Bar Chart module
 * @module charts/bar-chart
 */

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface BarChartComponentProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    [key: string]: number | string;
  }>;
  bars?: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  height?: number;
}

export function BarChartComponent({ title, data, bars, height = 300 }: BarChartComponentProps) {
  const chartBars = bars || [{ dataKey: 'value', color: '#3b82f6', name: 'Value' }];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />
            <YAxis tick={{ fill: 'currentColor' }} tickLine={{ stroke: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            {chartBars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.color}
                name={bar.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Error handler for bar-chart
 * @param {Error} error - Error to handle
 */
function handleBarchartError(error) {
  try {
    console.error('[bar-chart]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
