'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { cn, formatNumber, calculateChange, getTrend } from '@/app/lib/utils';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  description?: string;
  className?: string;
  sparkline?: number[];
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  prefix = '',
  suffix = '',
  decimals = 0,
  description,
  className,
  sparkline,
}: MetricCardProps) {
  const change = previousValue !== undefined ? calculateChange(value, previousValue) : 0;
  const trend = getTrend(change);

  const formattedValue =
    format === 'currency'
      ? `${prefix}${formatNumber(value, decimals)}${suffix}`
      : format === 'percentage'
        ? `${formatNumber(value, decimals)}%`
        : `${prefix}${formatNumber(value, decimals)}${suffix}`;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{formattedValue}</div>
          {previousValue !== undefined && (
            <div className={cn('flex items-center text-sm', trendColor)}>
              <TrendIcon className="mr-1 h-4 w-4" />
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-4 h-10">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <path
                d={`M ${sparkline
                  .map((v, i) => {
                    const x = (i / (sparkline.length - 1)) * 100;
                    const y =
                      30 -
                      ((v - Math.min(...sparkline)) /
                        (Math.max(...sparkline) - Math.min(...sparkline))) *
                        30;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={trendColor}
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
