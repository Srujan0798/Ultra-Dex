/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { CostDashboard } from '../CostDashboard';
import { sampleAgents, sampleCostSeries } from '../__fixtures__/dashboard';
import '@testing-library/jest-dom';

describe('CostDashboard', () => {
  it('renders spend summary and table rows', () => {
    render(<CostDashboard agents={sampleAgents} costSeries={sampleCostSeries} />);

    expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    expect(screen.getByText('daily spend')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('shows budget alert when usage is high', () => {
    const expensiveSeries = sampleCostSeries.map((point) => ({ ...point, amount: 45 }));
    render(<CostDashboard agents={sampleAgents} costSeries={expensiveSeries} />);

    expect(screen.getByText(/Budget alert/i)).toBeInTheDocument();
  });
});
