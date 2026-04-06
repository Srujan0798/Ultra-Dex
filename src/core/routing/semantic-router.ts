import type { AgentCapabilityProfile, RouteDecision } from './agent-profiles.ts';

export interface SemanticRouterOptions {
  backend?: 'hashed' | 'transformers';
  dimensions?: number;
  modelName?: string;
}

export interface HybridRouterOptions extends SemanticRouterOptions {
  semanticWeight?: number;
  capabilityWeight?: number;
  minimumSemanticConfidence?: number;
}

export declare class HashEmbeddingModel {
  dimensions: number;
  supportsSync: boolean;
  embedSync(text: string): number[];
  embed(text: string): Promise<number[]>;
}

export declare class TransformersEmbeddingModel {
  dimensions: number;
  supportsSync: boolean;
  embed(text: string): Promise<number[]>;
}

export declare class SemanticRouter {
  constructor(options?: SemanticRouterOptions);
  retrain(profiles?: AgentCapabilityProfile[]): Promise<AgentCapabilityProfile[]>;
  retrainSync(profiles?: AgentCapabilityProfile[]): AgentCapabilityProfile[];
  embed(text: string): Promise<number[]>;
  embedSync(text: string): number[];
  route(task: string): Promise<RouteDecision>;
  routeSync(task: string): RouteDecision;
}

export declare class HybridRouter {
  constructor(options?: HybridRouterOptions);
  retrain(profiles?: AgentCapabilityProfile[]): Promise<AgentCapabilityProfile[]>;
  retrainSync(profiles?: AgentCapabilityProfile[]): AgentCapabilityProfile[];
  route(task: string, requiredCapabilities?: string[]): Promise<RouteDecision>;
  routeSync(task: string, requiredCapabilities?: string[]): RouteDecision;
}

export declare function cosineSimilarity(a: number[], b: number[]): number;
