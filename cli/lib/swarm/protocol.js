/**
 * Ultra-Dex Agent Communication Protocol
 * Defines schema for agent handoffs and execution state.
 */

export const AgentProtocol = {
  // Standard message format between agents
  Message: {
    id: 'uuid',
    from: 'agent_name',
    to: 'agent_name',
    content: 'string', // The actual output/instruction
    context: {}, // Shared state
    timestamp: 'ISO8601'
  },

  // Execution state for a swarm task
  SwarmState: {
    taskId: 'uuid',
    status: 'planning|executing|reviewing|completed|failed',
    pipeline: [], // List of agents to run
    results: {}, // Map of agent -> output
    errors: [],
    startTime: 'ISO8601',
    endTime: 'ISO8601'
  },

  // Handover packet
  Handover: {
    previousAgent: 'string',
    nextAgent: 'string',
    artifacts: [], // List of file paths changed
    summary: 'string' // Brief summary of work done
  }
};

export function createMessage(from, to, content, context = {}) {
  return {
    id: crypto.randomUUID(),
    from,
    to,
    content,
    context,
    timestamp: new Date().toISOString()
  };
}

export function createHandover(previousAgent, nextAgent, summary, artifacts = []) {
  return {
    previousAgent,
    nextAgent,
    summary,
    artifacts
  };
}
