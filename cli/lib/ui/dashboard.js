import React from 'react';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';

function Dashboard({ state }) {
  return (
    React.createElement(Box, { flexDirection: 'column', padding: 1, borderStyle: 'round' },
      React.createElement(Text, { color: 'magenta' }, 'Ultra-Dex Live Dashboard'),
      React.createElement(Text, null, `Project: ${state.project || 'unknown'}`),
      React.createElement(Text, null, `Active Agents: ${state.activeAgents?.join(', ') || 'none'}`),
      React.createElement(Text, null, `Context Usage: ${state.contextUsage || 'n/a'}`),
      React.createElement(Box, { marginTop: 1 },
        React.createElement(Spinner, { type: 'dots' }),
        React.createElement(Text, null, ' Streaming logs...')
      )
    )
  );
}

export function showDashboard(state = {}) {
  render(React.createElement(Dashboard, { state }));
}

export default { showDashboard };
