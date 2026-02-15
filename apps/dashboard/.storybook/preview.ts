import type { Preview } from '@storybook/react';
import '../src/index.css';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: 'padded',
    backgrounds: {
      default: 'slate',
      values: [
        { name: 'slate', value: '#020617' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
};

export default preview;
