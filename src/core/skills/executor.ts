/**
 * Skill Executor - Executes skills with model-agnostic routing
 * Integrates with Ultra-Dex's AI Router, Memory, and Governance systems
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import {
  SkillDefinition,
  SkillInput,
  SkillOutput,
  SkillExecutionOptions,
  SkillExecutionResult,
} from './types.js';
import { renderTemplate, parseJsonOutput } from './framework.js';

// Import Ultra-Dex core systems (will be resolved at runtime)
interface AIProviderRouter {
  routeRequest(messages: any[], strategy: string, options: any): Promise<any>;
  getProviderStatus(): Record<string, any>;
}

interface UnifiedMemory {
  store(data: any, options: any): Promise<void>;
  retrieve(query: string, options: any): Promise<any>;
}

interface GovernanceManager {
  gate(request: any): Promise<boolean>;
  audit(entry: any): Promise<void>;
}

interface AgentRegistry {
  get(agentId: string): any;
  execute(agentId: string, input: any, context: any): Promise<any>;
}

export interface SkillExecutorConfig {
  aiRouter: AIProviderRouter;
  memory: UnifiedMemory;
  governance: GovernanceManager;
  agentRegistry: AgentRegistry;
  enableCache?: boolean;
  defaultTimeout?: number;
}

export class SkillExecutor extends EventEmitter {
  private config: SkillExecutorConfig;
  private cache = new Map<string, any>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: SkillExecutorConfig) {
    super();
    this.config = config;
  }

  /**
   * Execute a skill with the given input
   */
  async execute(
    skill: SkillDefinition,
    input: SkillInput,
    options: SkillExecutionOptions = {}
  ): Promise<SkillExecutionResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      // 1. Governance check
      await this.checkGovernance(skill, input, options);

      // 2. Check cache
      if (this.config.enableCache) {
        const cached = this.getCached(skill.id, input);
        if (cached) {
          return {
            ...cached,
            cached: true,
          };
        }
      }

      // 3. Build prompt
      const prompt = this.buildPrompt(skill, input);

      // 4. Route to AI provider
      const aiResult = await this.routeToProvider(skill, prompt, options);

      // 5. Parse output
      const parsedOutput = this.parseOutput(skill, aiResult.content);

      // 6. Store in memory
      await this.storeInMemory(skill, input, parsedOutput, aiResult);

      // 7. Audit
      await this.audit(skill, input, parsedOutput, aiResult, options);

      const result: SkillExecutionResult = {
        skill: skill.id,
        result: parsedOutput as SkillOutput,
        provider: aiResult.provider,
        model: aiResult.model,
        agent: skill.agent.id,
        latencyMs: Math.round(performance.now() - startTime),
        costUsd: aiResult.cost || 0,
        cached: false,
        timestamp,
      };

      // Cache result
      if (this.config.enableCache) {
        this.cacheResult(skill.id, input, result);
      }

      this.emit('skill:executed', result);
      return result;
    } catch (error) {
      this.emit('skill:error', { skill: skill.id, error, input });
      throw error;
    }
  }

  /**
   * Check governance policies
   */
  private async checkGovernance(
    skill: SkillDefinition,
    input: SkillInput,
    options: SkillExecutionOptions
  ): Promise<void> {
    if (!this.config.governance) return;

    const allowed = await this.config.governance.gate({
      action: 'skill:execute',
      skill: skill.id,
      user: options.userId,
      input,
      dataClassification: skill.governance.dataClassification,
    });

    if (!allowed) {
      throw new Error(`Governance denied execution of skill ${skill.id}`);
    }
  }

  /**
   * Build the prompt from template
   */
  private buildPrompt(skill: SkillDefinition, input: SkillInput): string {
    return renderTemplate(skill.promptTemplate, input);
  }

  /**
   * Route to the best AI provider
   */
  private async routeToProvider(
    skill: SkillDefinition,
    prompt: string,
    options: SkillExecutionOptions
  ): Promise<any> {
    const messages = [{ role: 'user', content: prompt }];

    // Determine strategy
    const strategy = options.provider || skill.routing.providerPriority[0];

    // Route request
    const result = await this.config.aiRouter.routeRequest(messages, strategy, {
      ...options,
      model: options.provider, // Specific provider if requested
      metadata: {
        taskType: skill.routing.taskType,
        complexity: skill.routing.complexity,
      },
      fallback: skill.routing.fallback,
      timeout: options.timeout || this.config.defaultTimeout || 60000,
    });

    return result;
  }

  /**
   * Parse and validate output
   */
  private parseOutput(skill: SkillDefinition, content: string): unknown {
    if (skill.config.responseFormat === 'json') {
      return parseJsonOutput(content);
    }
    return { text: content };
  }

  /**
   * Store execution in memory
   */
  private async storeInMemory(
    skill: SkillDefinition,
    input: SkillInput,
    output: unknown,
    aiResult: any
  ): Promise<void> {
    if (!this.config.memory || !skill.memory.storeOutput) return;

    await this.config.memory.store(
      {
        type: 'skill-execution',
        skill: skill.id,
        input: skill.memory.storeInput ? input : undefined,
        output,
        provider: aiResult.provider,
        model: aiResult.model,
        agent: skill.agent.id,
        timestamp: new Date().toISOString(),
      },
      {
        tags: skill.memory.tags,
        searchable: skill.memory.searchable,
        priority: 'normal',
      }
    );
  }

  /**
   * Audit the execution
   */
  private async audit(
    skill: SkillDefinition,
    input: SkillInput,
    output: unknown,
    aiResult: any,
    options: SkillExecutionOptions
  ): Promise<void> {
    if (!this.config.governance || skill.governance.auditLevel === 'none') return;

    await this.config.governance.audit({
      action: 'skill:executed',
      skill: skill.id,
      user: options.userId,
      provider: aiResult.provider,
      model: aiResult.model,
      agent: skill.agent.id,
      success: true,
      timestamp: new Date().toISOString(),
      // Only log input/output if audit level is full
      ...(skill.governance.auditLevel === 'full' && {
        input: JSON.stringify(input).slice(0, 1000), // Truncate
        output: JSON.stringify(output).slice(0, 1000),
      }),
    });
  }

  /**
   * Get cached result
   */
  private getCached(skillId: string, input: SkillInput): SkillExecutionResult | null {
    const key = this.cacheKey(skillId, input);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Cache a result
   */
  private cacheResult(skillId: string, input: SkillInput, result: SkillExecutionResult): void {
    const key = this.cacheKey(skillId, input);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate cache key
   */
  private cacheKey(skillId: string, input: SkillInput): string {
    return `${skillId}:${JSON.stringify(input)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default SkillExecutor;
