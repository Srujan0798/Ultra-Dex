/**
 * Skill System Types for Ultra-Dex
 * Model-agnostic implementation of Claude plugin skills
 */

export interface SkillInput {
  [key: string]: unknown;
}

export interface SkillOutput {
  [key: string]: unknown;
}

export interface SkillRouting {
  providerPriority: string[];
  fallback: boolean;
  taskType: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface SkillMemory {
  storeInput: boolean;
  storeOutput: boolean;
  tags: string[];
  searchable: boolean;
}

export interface SkillGovernance {
  requiresApproval: boolean;
  auditLevel: 'none' | 'basic' | 'full';
  dataClassification: 'public' | 'internal' | 'confidential' | 'code';
}

export interface SkillConnector {
  name: string;
  required: boolean;
}

export interface SkillAgent {
  id: string;
  capabilities: string[];
}

export interface SkillConfig {
  temperature: number;
  maxTokens: number;
  responseFormat: 'json' | 'text' | 'markdown';
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category:
    | 'engineering'
    | 'data'
    | 'sales'
    | 'productivity'
    | 'marketing'
    | 'finance'
    | 'legal'
    | 'design'
    | 'operations';
  agent: SkillAgent;
  routing: SkillRouting;
  input: object; // JSON Schema
  output: object; // JSON Schema
  promptTemplate: string;
  config: SkillConfig;
  memory: SkillMemory;
  governance: SkillGovernance;
  connectors?: string[];
  examples?: SkillExample[];
}

export interface SkillExample {
  input: SkillInput;
  output: SkillOutput;
  description: string;
}

export interface SkillExecutionResult {
  skill: string;
  result: SkillOutput;
  provider: string;
  model: string;
  agent: string;
  latencyMs: number;
  costUsd: number;
  cached: boolean;
  timestamp: string;
}

export interface SkillExecutionOptions {
  userId?: string;
  provider?: string;
  strategy?: 'quality' | 'cost' | 'latency' | 'balanced';
  connectors?: Record<string, unknown>;
  timeout?: number;
}

export interface SkillRegistry {
  get(skillId: string): SkillDefinition | undefined;
  register(skill: SkillDefinition): void;
  list(): SkillDefinition[];
  findByCategory(category: SkillDefinition['category']): SkillDefinition[];
  findByAgent(agentId: string): SkillDefinition[];
}
