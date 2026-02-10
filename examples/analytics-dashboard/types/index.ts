/**
 * @fileoverview Index module
 * @module types/index
 */

import type { UserRole, MetricType, WidgetType } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Metric {
  id: string;
  userId: string;
  type: MetricType;
  value: number;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
  createdAt: Date;
}

export interface MetricInput {
  type: MetricType;
  value: number;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  layout: DashboardLayout;
  filters: DashboardFilters | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  widgets: Widget[];
}

export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  metricTypes?: MetricType[];
  search?: string;
}

export interface Widget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  metricType?: MetricType;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  color?: string;
  showLegend?: boolean;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: Date;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface MetricSummary {
  total: number;
  average: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  columns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
