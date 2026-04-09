function clampHealthScore(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 1;
  return Math.min(1, Math.max(0, numeric));
}
function getRegistryEntries(manager) {
  const registry = manager.agentRegistry ?? manager.orchestrator?.registry ?? null;
  if (!registry) return [];
  if (registry.agents instanceof Map) {
    return Array.from(registry.agents.entries()).map(([id, agent]) => ({ id, agent }));
  }
  if (Array.isArray(registry.agents)) {
    return registry.agents.map((agent) => ({ id: agent.id || agent.name, agent }));
  }
  return [];
}
function getActiveSessions(manager) {
  const sessions = manager.orchestrator?.activeSessions;
  if (!(sessions instanceof Map)) return [];
  return Array.from(sessions.values());
}
function createAgentStatusTool({ manager }) {
  return {
    name: 'agent-status',
    description: 'Return current agent states, active tasks, and health information.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        agentId: {
          type: 'string',
          description: 'Optional agent identifier to filter the response.',
        },
      },
    },
    async handler({ agentId } = {}) {
      const sessions = getActiveSessions(manager);
      const sessionByAgent = /* @__PURE__ */ new Map();
      for (const session of sessions) {
        const id = session.agentId || session.rootAgent || session.agent || session.id;
        if (!id) continue;
        sessionByAgent.set(id, session);
      }
      const agents = getRegistryEntries(manager).map(({ id, agent }) => {
        const session = sessionByAgent.get(id);
        return {
          id,
          status: session?.status || agent.status || 'idle',
          currentTask:
            session?.task || session?.objective || agent.currentTask || agent.task || null,
          healthScore: clampHealthScore(agent.healthScore ?? agent.health ?? 1),
        };
      });
      if (agents.length === 0) {
        for (const [id, session] of sessionByAgent) {
          agents.push({
            id,
            status: session?.status || 'busy',
            currentTask: session?.task || session?.objective || null,
            healthScore: 1,
          });
        }
      }
      const filtered = agentId ? agents.filter((agent) => agent.id === agentId) : agents;
      return { agents: filtered };
    },
  };
}
var agent_status_default = createAgentStatusTool;
export { createAgentStatusTool, agent_status_default as default };
