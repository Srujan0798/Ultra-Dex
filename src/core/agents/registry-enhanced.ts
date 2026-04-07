import { EventEmitter } from "events";
class AgentRegistry extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 100,
      ...config
    };
    this.agents = /* @__PURE__ */ new Map();
    this.initialized = false;
  }
  async initialize() {
    this.initialized = true;
    this.emit("initialized");
    return true;
  }
  async register(agent) {
    if (!agent?.id) {
      throw new Error("Agent id is required");
    }
    if (this.agents.size >= this.config.maxAgents && !this.agents.has(agent.id)) {
      throw new Error("Agent registry is full");
    }
    const normalized = {
      capabilities: [],
      description: "",
      name: agent.id,
      ...agent
    };
    this.agents.set(normalized.id, normalized);
    this.emit("agent:registered", { agentId: normalized.id });
    return this._sanitizeAgent(normalized);
  }
  get(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? this._sanitizeAgent(agent) : null;
  }
  list() {
    return Array.from(this.agents.values(), (agent) => this._sanitizeAgent(agent));
  }
  discover(query) {
    if (!query) {
      return this.list();
    }
    const normalizedQuery = String(query).toLowerCase();
    return this.list().filter((agent) => {
      return agent.id.toLowerCase().includes(normalizedQuery) || agent.name.toLowerCase().includes(normalizedQuery) || agent.description.toLowerCase().includes(normalizedQuery) || agent.capabilities.some(
        (capability) => String(capability).toLowerCase().includes(normalizedQuery)
      );
    });
  }
  findAgentsByCapabilities(capabilities = []) {
    const wanted = new Set(capabilities.map((capability) => String(capability).toLowerCase()));
    return this.list().filter(
      (agent) => agent.capabilities.some((capability) => wanted.has(String(capability).toLowerCase()))
    );
  }
  async execute(agentId, input = {}, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    if (typeof agent.handler !== "function") {
      throw new Error(`Agent ${agentId} does not have a handler`);
    }
    const startedAt = Date.now();
    try {
      const result = await agent.handler(input, context);
      const payload = {
        agentId,
        duration: Date.now() - startedAt,
        result
      };
      this.emit("agent:executed", payload);
      return {
        agentId,
        result,
        executionId: this._generateExecutionId()
      };
    } catch (error) {
      this.emit("agent:failed", {
        agentId,
        duration: Date.now() - startedAt,
        error
      });
      throw error;
    }
  }
  async getAgentPrompt(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return `You are agent ${agentId}.`;
    }
    return `${agent.name}: ${agent.description || "Execute the assigned task."}`;
  }
  _sanitizeAgent(agent) {
    const { handler, ...rest } = agent;
    return rest;
  }
  _generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
var registry_enhanced_default = AgentRegistry;
export {
  AgentRegistry,
  registry_enhanced_default as default
};
