import { render, screen } from '@testing-library/react';
import { MetricsPanel } from '../MetricsPanel';
import { sampleAgents, sampleCostSeries, sampleMetrics } from '../__fixtures__/dashboard';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('../Chart', () => ({
  Chart: () => <div data-testid="mock-chart">chart</div>,
}));

describe('MetricsPanel', () => {
  it('renders key performance gauges and health summary', () => {
    render(
      <MetricsPanel
        agents={sampleAgents}
        costSeries={sampleCostSeries}
        metrics={sampleMetrics}
      />
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('API latency')).toBeInTheDocument();
    expect(screen.getByText('Provider health')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });
});
