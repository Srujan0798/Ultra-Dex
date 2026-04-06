export interface AgentCapabilityProfile {
  agentId: string;
  capabilities: string[];
  examples: string[];
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface RouteAlternative {
  agentId: string;
  confidence: number;
  similarity?: number;
}

export interface RouteDecision {
  agentId: string;
  confidence: number;
  similarity?: number;
  method: string;
  alternatives: RouteAlternative[];
  semanticConfidence?: number;
  capabilityScore?: number;
}

export declare const AGENT_PROFILES: AgentCapabilityProfile[];
export declare function buildProfileText(profile: AgentCapabilityProfile): string;
export declare function getAgentProfile(agentId: string): AgentCapabilityProfile | null;
