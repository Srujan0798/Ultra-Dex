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
import { salesSkills, registerSalesSkills } from './sales/index.js';
import {
  productSkills as productManagementSkills,
  registerProductSkills as registerProductManagementSkills,
} from './product-management/index.js';
import { customerSkills, registerCustomerSkills } from './customer-support/index.js';
import { financeSkills, registerFinanceSkills } from './finance/index.js';
import { productivitySkills, registerProductivitySkills } from './productivity/index.js';
import { operationsSkills, registerOperationsSkills } from './operations/index.js';
import { marketingSkills, registerMarketingSkills } from './marketing/index.js';
import { designSkills, registerDesignSkills } from './design/index.js';
import { legalSkills, registerLegalSkills } from './legal/index.js';
import { hrSkills, registerHrSkills } from './hr/index.js';
import { brandVoiceSkills, registerBrandVoiceSkills } from './brand-voice/index.js';
import {
  enterpriseSearchSkills,
  registerEnterpriseSearchSkills,
} from './enterprise-search/index.js';
import { pdfViewerSkills, registerPDFViewerSkills } from './pdf-viewer/index.js';

// Re-export types
export * from './types.js';
export { defineSkill, renderTemplate, parseJsonOutput, SkillRegistry } from './framework.js';
export { SkillExecutor } from './executor.js';

// All skills in one array
export const allSkills: SkillDefinition[] = [
  ...engineeringSkills,
  ...dataSkills,
  ...salesSkills,
  ...productManagementSkills,
  ...customerSkills,
  ...financeSkills,
  ...productivitySkills,
  ...operationsSkills,
  ...marketingSkills,
  ...designSkills,
  ...legalSkills,
  ...hrSkills,
  ...brandVoiceSkills,
  ...enterpriseSearchSkills,
  ...pdfViewerSkills,
];

/**
 * Initialize the skills system with all skills
 */
export function initializeSkills(registry: SkillRegistry = globalSkillRegistry): SkillRegistry {
  // Register engineering skills
  registerEngineeringSkills(registry);

  // Register data skills
  registerDataSkills(registry);

  // Register sales skills
  registerSalesSkills(registry);

  // Register product management skills
  registerProductManagementSkills(registry);

  // Register customer support skills
  registerCustomerSkills(registry);

  // Register finance skills
  registerFinanceSkills(registry);

  // Register productivity skills
  registerProductivitySkills(registry);

  // Register operations skills
  registerOperationsSkills(registry);

  // Register marketing skills
  registerMarketingSkills(registry);

  // Register design skills
  registerDesignSkills(registry);

  // Register legal skills
  registerLegalSkills(registry);

  // Register HR skills
  registerHrSkills(registry);

  // Register brand voice skills
  registerBrandVoiceSkills(registry);

  // Register enterprise search skills
  registerEnterpriseSearchSkills(registry);

  // Register PDF viewer skills
  registerPDFViewerSkills(registry);

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
  initializeExecutor(executor: SkillExecutor): void {
    this.executor = executor;
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
  findByCategory(
    category:
      | 'engineering'
      | 'data'
      | 'sales'
      | 'product'
      | 'productivity'
      | 'marketing'
      | 'finance'
      | 'legal'
      | 'hr'
      | 'customer-support'
      | 'design'
      | 'operations'
  ): SkillDefinition[] {
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

  /**
   * Convenience: Frontend Design
   */
  async frontendDesign(input: {
    request: string;
    purpose?: string;
    audience?: string;
    aestheticDirection?: string;
    technicalConstraints?: string;
    differentiation?: string;
    framework?: 'html-css-js' | 'react' | 'vue' | 'svelte' | 'nextjs' | 'any';
    theme?: 'light' | 'dark' | 'both' | 'auto';
    accessibilityTarget?: 'wcag-aa' | 'wcag-aaa';
  }): Promise<SkillExecutionResult> {
    return this.execute('/frontend-design', input);
  }
}

// Export singleton instance
export const skillsAPI = new SkillsAPI();

// Default export
export default SkillsAPI;
