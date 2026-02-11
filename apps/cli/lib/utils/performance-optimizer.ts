// Copyright (c) 2026 Ultra-Dex
/**
 * Performance Optimization Suite
 * Monitoring and optimization utilities for enterprise scale
 *
 * @module utils/performance-optimizer
 */

import { performance } from 'perf_hooks';
import { auditLogger } from '../services/audit/audit-logger.js';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsed: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThresholds {
  warning: number; // milliseconds
  critical: number; // milliseconds
}

/**
 * Default thresholds
 */
export const DefaultThresholds: Record<string, PerformanceThresholds> = {
  'api-request': { warning: 500, critical: 2000 },
  'ai-generation': { warning: 5000, critical: 15000 },
  'database-query': { warning: 100, critical: 500 },
  'file-operation': { warning: 1000, critical: 5000 },
  'agent-execution': { warning: 3000, critical: 10000 },
};

/**
 * Performance optimizer class
 */
export class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsSize: number = 10000;
  private thresholds: Map<string, PerformanceThresholds> = new Map();

  constructor() {
    // Initialize with default thresholds
    for (const [key, value] of Object.entries(DefaultThresholds)) {
      this.thresholds.set(key, value);
    }
  }

  /**
   * Measure function execution time
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await fn();

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      const metric: PerformanceMetrics = {
        operation,
        duration: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        timestamp: new Date(),
        metadata,
      };

      this.recordMetric(metric);
      this.checkThresholds(metric);

      return result;
    } catch (error) {
      const endTime = performance.now();

      const metric: PerformanceMetrics = {
        operation,
        duration: endTime - startTime,
        memoryUsed: 0,
        timestamp: new Date(),
        metadata: { ...metadata, error: true },
      };

      this.recordMetric(metric);
      throw error;
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Check if metric exceeds thresholds
   */
  private async checkThresholds(metric: PerformanceMetrics): Promise<void> {
    const threshold = this.thresholds.get(metric.operation);
    if (!threshold) return;

    if (metric.duration > threshold.critical) {
      console.error(
        `🚨 CRITICAL: Operation "${metric.operation}" took ${metric.duration.toFixed(2)}ms`
      );

      await auditLogger.log({
        type: 'security.alert',
        severity: 'warning',
        action: 'PERFORMANCE_CRITICAL',
        resource: 'performance',
        resourceId: metric.operation,
        details: {
          duration: metric.duration,
          threshold: threshold.critical,
          metadata: metric.metadata,
        },
      });
    } else if (metric.duration > threshold.warning) {
      console.warn(
        `⚠️ WARNING: Operation "${metric.operation}" took ${metric.duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get performance statistics
   */
  getStats(
    operation?: string,
    timeWindowMs: number = 3600000
  ): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95: number;
    p99: number;
  } {
    const cutoff = Date.now() - timeWindowMs;

    let relevantMetrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);

    if (operation) {
      relevantMetrics = relevantMetrics.filter((m) => m.operation === operation);
    }

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95: 0,
        p99: 0,
      };
    }

    const durations = relevantMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: durations.length,
      avgDuration: sum / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Set custom threshold for operation
   */
  setThreshold(operation: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(operation, thresholds);
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold: number = 1000, limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter((m) => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const operations = new Set(this.metrics.map((m) => m.operation));

    let report = '# Performance Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const operation of operations) {
      const stats = this.getStats(operation);

      report += `## ${operation}\n`;
      report += `- Count: ${stats.count}\n`;
      report += `- Average: ${stats.avgDuration.toFixed(2)}ms\n`;
      report += `- Min: ${stats.minDuration.toFixed(2)}ms\n`;
      report += `- Max: ${stats.maxDuration.toFixed(2)}ms\n`;
      report += `- P95: ${stats.p95.toFixed(2)}ms\n`;
      report += `- P99: ${stats.p99.toFixed(2)}ms\n\n`;
    }

    return report;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;

/**
 * Decorator for measuring method performance
 */
export function MeasurePerformance(operation?: string, metadata?: Record<string, any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceOptimizer.measure(opName, () => originalMethod.apply(this, args), metadata);
    };

    return descriptor;
  };
}
