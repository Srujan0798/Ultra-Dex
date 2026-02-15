import type { Meta, StoryObj } from '@storybook/react';
import { AgentCard } from './AgentCard';
import { sampleAgent } from './__fixtures__/dashboard';

const meta: Meta<typeof AgentCard> = {
  title: 'Dashboard/AgentCard',
  component: AgentCard,
};

export default meta;
type Story = StoryObj<typeof AgentCard>;

export const Running: Story = {
  args: {
    agent: sampleAgent,
  },
};

export const Error: Story = {
  args: {
    agent: { ...sampleAgent, state: 'error', name: 'Security Auditor' },
  },
};
