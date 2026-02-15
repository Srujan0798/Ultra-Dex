import type { Meta, StoryObj } from '@storybook/react';
import { LogViewer } from './LogViewer';
import { sampleLogs } from './__fixtures__/dashboard';

const meta: Meta<typeof LogViewer> = {
  title: 'Dashboard/LogViewer',
  component: LogViewer,
};

export default meta;
type Story = StoryObj<typeof LogViewer>;

export const Default: Story = {
  args: {
    logs: sampleLogs,
  },
};
