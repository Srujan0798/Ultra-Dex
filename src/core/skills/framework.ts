/**
 * Skill Framework for Ultra-Dex
 * Provides the core functionality for defining and executing skills
 */

import {
  SkillDefinition,
  SkillInput,
  SkillOutput,
  SkillExecutionOptions,
  SkillExecutionResult,
  SkillRegistry as ISkillRegistry,
} from './types.js';

/**
 * Define a new skill
 */
export function defineSkill(definition: SkillDefinition): SkillDefinition {
  // Validate the definition
  if (!definition.id || !definition.name) {
    throw new Error('Skill must have id and name');
  }

  if (!definition.id.startsWith('/')) {
    throw new Error('Skill id must start with / (e.g., /code-review)');
  }

  // Set defaults if not provided
  const defaults = {
    config: { temperature: 0, maxTokens: 4000, responseFormat: 'json' as const },
    memory: {
      storeInput: true,
      storeOutput: true,
      tags: [definition.id.replace('/', '')],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'full' as const,
      dataClassification: 'internal' as const,
    },
  };

  return {
    ...definition,
    config: { ...defaults.config, ...definition.config },
    memory: { ...defaults.memory, ...definition.memory },
    governance: { ...defaults.governance, ...definition.governance },
  };
}

/**
 * Simple template engine for prompt rendering
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Replace {{variable}} with value
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });

  // Replace {{#if variable}}...{{/if}} conditionals
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = data[key];
    return value ? content : '';
  });

  return result.trim();
}

/**
 * Parse JSON output from model response
 */
export function parseJsonOutput(content: string): unknown {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }

  // Try to find JSON in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Return as-is if it's already JSON-like
  try {
    return JSON.parse(content);
  } catch {
    return { text: content };
  }
}

/**
 * In-memory skill registry
 */
export class SkillRegistry implements ISkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  get(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  list(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  findByCategory(category: 'engineering' | 'data'): SkillDefinition[] {
    return this.list().filter((s) => s.category === category);
  }

  findByAgent(agentId: string): SkillDefinition[] {
    return this.list().filter((s) => s.agent.id === agentId);
  }

  has(skillId: string): boolean {
    return this.skills.has(skillId);
  }
}

/**
 * Global skill registry instance
 */
export const globalSkillRegistry = new SkillRegistry();

/**
 * Register a skill globally
 */
export function registerSkill(skill: SkillDefinition): void {
  globalSkillRegistry.register(skill);
}

/**
 * Get a skill by ID
 */
export function getSkill(skillId: string): SkillDefinition | undefined {
  return globalSkillRegistry.get(skillId);
}

/**
 * List all registered skills
 */
export function listSkills(): SkillDefinition[] {
  return globalSkillRegistry.list();
}
