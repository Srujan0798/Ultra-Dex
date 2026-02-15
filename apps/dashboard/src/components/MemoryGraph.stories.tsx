import type { Meta, StoryObj } from '@storybook/react';
import { MemoryGraph } from './MemoryGraph';
import { sampleMemory } from './__fixtures__/dashboard';

const meta: Meta<typeof MemoryGraph> = {
  title: 'Dashboard/MemoryGraph',
  component: MemoryGraph,
};

export default meta;
type Story = StoryObj<typeof MemoryGraph>;

export const Default: Story = {
  args: {
    memory: sampleMemory,
  },
};
