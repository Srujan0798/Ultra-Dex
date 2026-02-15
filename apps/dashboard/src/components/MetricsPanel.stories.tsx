import type { Meta, StoryObj } from '@storybook/react';
import { MetricsPanel } from './MetricsPanel';
import { sampleAgents, sampleCostSeries, sampleMetrics } from './__fixtures__/dashboard';

const meta: Meta<typeof MetricsPanel> = {
  title: 'Dashboard/MetricsPanel',
  component: MetricsPanel,
};

export default meta;
type Story = StoryObj<typeof MetricsPanel>;

export const Default: Story = {
  args: {
    metrics: sampleMetrics,
    agents: sampleAgents,
    costSeries: sampleCostSeries,
  },
};
