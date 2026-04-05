
import { agentOrchestrator } from './src/core/orchestration/index.js';

// Mock AI Meta Layer to avoid actual calls
agentOrchestrator.ai = {
  call: async () => ({ text: 'mock response' }),
  generateObject: async () => ({ object: { paths: [], steps: [{ id: '1', task: 't1' }] } }),
  generateTextWithTools: async () => ({ text: 'mock code', toolCalls: [] })
};

// Mock Memory
agentOrchestrator.memory = {
  init: async () => {},
  search: async () => [],
  add: async () => {}
};

// Mock Registry
agentOrchestrator.registry = {
    initialize: async () => {},
    getAgentPrompt: async () => 'mock prompt',
    findAgentsByCapabilities: () => [],
    getAgentById: () => ({ name: 'mock' })
}

// Mock MCP
agentOrchestrator.mcpServer = { toolsMap: new Map() };


async function run() {
  console.log('Starting concurrent executions...');

  // Simulate two concurrent tasks
  const p1 = agentOrchestrator.executeNexus('Objective 1');
  const p2 = agentOrchestrator.executeNexus('Objective 2');

  // We expect them to interfere if they share the task graph
  // We can't easily assert the interference without mocking ralph-loop internals or seeing logs
  // But we can inspect the TaskGraph size

  try {
      await Promise.allSettled([p1, p2]);
  } catch (e) {
      // ignore errors from mocks
  }

  console.log('TaskGraph size:', agentOrchestrator.tasks.tasks.size);
  // If they were isolated, we might expect different behavior, but here they accumulate in the single graph.
}

run();
