/**
 * Metrics Panel Component
 * 
 * Displays key dashboard metrics in cards
 */

import { DashboardMetrics } from '../App';
import './MetricsPanel.css';

interface MetricsPanelProps {
  metrics: DashboardMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="metrics-panel">
      <div className="metric-card">
        <div className="metric-icon">📊</div>
        <div className="metric-content">
          <span className="metric-value">{formatNumber(metrics.totalWorkflows)}</span>
          <span className="metric-label">Total Workflows</span>
        </div>
      </div>

      <div className="metric-card active">
        <div className="metric-icon">⚡</div>
        <div className="metric-content">
          <span className="metric-value">{metrics.activeWorkflows}</span>
          <span className="metric-label">Active Now</span>
        </div>
      </div>

      <div className="metric-card success">
        <div className="metric-icon">✓</div>
        <div className="metric-content">
          <span className="metric-value">{metrics.successRate.toFixed(1)}%</span>
          <span className="metric-label">Success Rate</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">💰</div>
        <div className="metric-content">
          <span className="metric-value">${metrics.totalCost.estimatedUSD.toFixed(2)}</span>
          <span className="metric-label">Total Cost</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">⏱</div>
        <div className="metric-content">
          <span className="metric-value">{formatDuration(metrics.avgDuration)}</span>
          <span className="metric-label">Avg Duration</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">🤖</div>
        <div className="metric-content">
          <span className="metric-value">{formatNumber(metrics.totalCost.tokens)}</span>
          <span className="metric-label">Tokens Used</span>
        </div>
      </div>
    </div>
  );
}
