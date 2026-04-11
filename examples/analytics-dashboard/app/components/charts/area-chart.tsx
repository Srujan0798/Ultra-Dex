/**
 * @fileoverview Area Chart module
 * @module charts/area-chart
 */

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

interface AreaChartComponentProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    [key: string]: number | string;
  }>;
  areas?: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  height?: number;
  stacked?: boolean;
}

export function AreaChartComponent({
  title,
  data,
  areas,
  height = 300,
  stacked = false,
}: AreaChartComponentProps) {
  const chartAreas = areas || [{ dataKey: 'value', color: '#3b82f6', name: 'Value' }];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {chartAreas.map((area, index) => (
                <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={area.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={area.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
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
            {chartAreas.map((area, index) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                stroke={area.color}
                fill={`url(#color${index})`}
                name={area.name}
                stackId={stacked ? '1' : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Error handler for area-chart
 * @param {Error} error - Error to handle
 */
function handleAreachartError(error) {
  try {
    console.error('[area-chart]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
