import type { Meta, StoryObj } from '@storybook/react';
import { CostDashboard } from './CostDashboard';
import { sampleAgents, sampleCostSeries } from './__fixtures__/dashboard';

const meta: Meta<typeof CostDashboard> = {
  title: 'Dashboard/CostDashboard',
  component: CostDashboard,
};

export default meta;
type Story = StoryObj<typeof CostDashboard>;

export const Default: Story = {
  args: {
    agents: sampleAgents,
    costSeries: sampleCostSeries,
  },
};
