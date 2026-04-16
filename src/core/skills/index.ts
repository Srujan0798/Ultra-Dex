/**
 * Ultra-Dex Skills System
 * Model-agnostic implementation of Claude plugin skills
 */

import {
  SkillRegistry,
  globalSkillRegistry,
  registerSkill,
  getSkill,
  listSkills,
} from './framework.js';
import { SkillExecutor } from './executor.js';
import { SkillDefinition, SkillExecutionOptions, SkillExecutionResult } from './types.js';
import { engineeringSkills, registerEngineeringSkills } from './engineering/index.js';
import { dataSkills, registerDataSkills } from './data/index.js';
import { loadSkillsFromDocs, registerDocsSkills } from './docs-loader.js';

// Re-export types
export * from './types.js';
export { defineSkill, renderTemplate, parseJsonOutput, SkillRegistry } from './framework.js';
export { SkillExecutor } from './executor.js';
export { loadSkillsFromDocs, registerDocsSkills } from './docs-loader.js';

// All code-defined skills
export const allSkills: SkillDefinition[] = [...engineeringSkills, ...dataSkills];

/**
 * Initialize the skills system — code-defined skills first, then docs-based.
 * Code-defined skills (with schemas and templates) take priority.
 * Docs-based skills fill in the remaining 66+ skills from the Cowrk registry.
 */
export function initializeSkills(registry: SkillRegistry = globalSkillRegistry): SkillRegistry {
  // Register code-defined skills (engineering + data)
  registerEngineeringSkills(registry);
  registerDataSkills(registry);

  // Register docs-based skills (all 11 plugins — skips already-registered)
  registerDocsSkills(registry);

  return registry;
}

/**
 * Skills API - Main interface for your startup users
 */
export class SkillsAPI {
  private registry: SkillRegistry;
  private executor: SkillExecutor | null = null;

  constructor(registry: SkillRegistry = globalSkillRegistry) {
    this.registry = registry;
  }

  /**
   * Initialize the executor with Ultra-Dex core systems
   */
  initializeExecutor(config: ConstructorParameters<typeof SkillExecutor>[0]): void {
    this.executor = new SkillExecutor(config);
  }

  /**
   * Execute a skill by ID
   */
  async execute(
    skillId: string,
    input: Record<string, unknown>,
    options: SkillExecutionOptions = {}
  ): Promise<SkillExecutionResult> {
    if (!this.executor) {
      throw new Error('SkillsAPI not initialized. Call initializeExecutor() first.');
    }

    const skill = this.registry.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    return await this.executor.execute(skill, input, options);
  }

  /**
   * Check if a skill exists
   */
  has(skillId: string): boolean {
    return this.registry.has(skillId);
  }

  /**
   * Get a skill definition
   */
  get(skillId: string): SkillDefinition | undefined {
    return this.registry.get(skillId);
  }

  /**
   * List all available skills
   */
  list(): SkillDefinition[] {
    return this.registry.list();
  }

  /**
   * Find skills by category
   */
  findByCategory(category: SkillDefinition['category']): SkillDefinition[] {
    return this.registry.findByCategory(category);
  }

  /**
   * Find skills by agent
   */
  findByAgent(agentId: string): SkillDefinition[] {
    return this.registry.findByAgent(agentId);
  }

  /**
   * Convenience: Code Review
   */
  async codeReview(input: {
    code: string;
    language?: string;
    focus?: string[];
    prUrl?: string;
    filePath?: string;
  }): Promise<SkillExecutionResult> {
    return this.execute('/code-review', input);
  }

  /**
   * Convenience: Architecture Decision
   */
  async architecture(input: {
    prompt: string;
    context?: Record<string, unknown>;
    constraints?: string[];
    options?: string[];
  }): Promise<SkillExecutionResult> {
    return this.execute('/architecture', input);
  }

  /**
   * Convenience: SQL Query
   */
  async sqlQuery(input: {
    prompt: string;
    dialect?: string;
    schema?: Record<string, unknown>;
    tables?: string[];
  }): Promise<SkillExecutionResult> {
    return this.execute('/sql-queries', input);
  }

  /**
   * Convenience: Debug
   */
  async debug(input: {
    error: string;
    context?: string;
    code?: string;
    environment?: Record<string, unknown>;
  }): Promise<SkillExecutionResult> {
    return this.execute('/debug', input);
  }

  /**
   * Convenience: Data Analysis
   */
  async analyze(input: {
    question: string;
    data?: Record<string, unknown>;
    context?: string;
  }): Promise<SkillExecutionResult> {
    return this.execute('/analyze', input);
  }

  /**
   * Convenience: Build Dashboard
   */
  async buildDashboard(input: {
    title: string;
    data?: Record<string, unknown>;
    charts?: string[];
    filters?: string[];
  }): Promise<SkillExecutionResult> {
    return this.execute('/build-dashboard', input);
  }
}

// Export singleton instance
export const skillsAPI = new SkillsAPI();

// Default export
export default SkillsAPI;
