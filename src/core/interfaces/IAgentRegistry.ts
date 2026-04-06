export interface AgentDefinition {
  id?: string;
  name: string;
  description: string;
  capabilities: string[];
  [key: string]: unknown;
}

export interface IAgentRegistry {
  initialize(): Promise<void>;
  registerAgent(agentId: string, agentDefinition: AgentDefinition): Promise<unknown>;
  getAgentById(agentId: string): AgentDefinition | undefined;
  getAllAgents(): AgentDefinition[];
  findAgentsByCapabilities(capabilities: string[]): AgentDefinition[];
  getAgentPrompt(agentId: string): Promise<string>;
  getMetrics(): Record<string, unknown>;
  shutdown(): Promise<void>;
}
