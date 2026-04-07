export interface RouteDecision {
  agentId: string;
  confidence: number;
  alternatives: { agentId: string; confidence: number }[];
  matchedExamples?: string[];
  reasoning?: string;
}

export interface ICapabilityRouter {
  findByCapabilities(capabilities: string[]): Promise<RouteDecision[]>;
  rankByCapabilityMatch(agents: string[], capabilities: string[]): RouteDecision[];
}

export interface ISemanticRouter {
  route(task: string): Promise<RouteDecision>;
  embed(text: string): Promise<number[]>;
}

export interface IHybridRouter {
  route(task: string, requiredCapabilities: string[]): Promise<RouteDecision>;
}
