/**
 * Productivity Skills for Ultra-Dex
 * 4 Claude Productivity plugin skills
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

// Helper function to create complete skill definitions
function createSkill(base: any): SkillDefinition {
  return defineSkill({
    ...base,
    output: {
      type: 'object',
      properties: {
        result: { type: 'string', description: 'Skill execution result' },
        summary: { type: 'string', description: 'Summary of the action taken' },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommended next steps',
        },
        confidence: { type: 'number', description: 'Confidence level (0-1)' },
      },
    },
    promptTemplate: `
Execute the productivity skill: {{skillName}}

Input: {{input}}

Provide a complete productivity solution with:
- Result of the action
- Summary of what was done
- Recommended next steps
- Confidence level (0-1)
`,
    config: {
      temperature: 0.2,
      maxTokens: 3000,
      responseFormat: 'json' as const,
    },
    memory: {
      storeInput: true,
      storeOutput: true,
      tags: ['productivity'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Memory Management Skill
export const memoryManagementSkill = createSkill({
  id: '/memory-management',
  name: 'Memory Management',
  description: 'Two-tier memory system that makes Claude a true workplace collaborator',
  category: 'productivity',
  agent: {
    id: 'productivity-manager',
    capabilities: ['memory-management', 'context-understanding', 'workflow-optimization'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'memory',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      context: { type: 'string', description: 'Work context or situation' },
      people: { type: 'array', items: { type: 'string' }, description: 'People involved' },
      projects: { type: 'array', items: { type: 'string' }, description: 'Projects or tasks' },
      terminology: { type: 'object', description: 'Custom terminology or shorthand' },
      action: { type: 'string', enum: ['encode', 'retrieve', 'update', 'sync'] },
    },
    required: ['context', 'action'],
  },
  connectors: ['slack', 'notion', 'asana', 'linear', 'ms365', 'google-calendar', 'gmail'],
});

// 2. Start Skill
export const startSkill = createSkill({
  id: '/start',
  name: 'Start',
  description: 'Initialize the productivity system and open the dashboard',
  category: 'productivity',
  agent: {
    id: 'productivity-initializer',
    capabilities: ['system-setup', 'dashboard', 'memory-bootstrapping'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'setup',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      existingTasks: { type: 'string', description: 'Existing task list' },
      shorthand: { type: 'object', description: 'Custom shorthand or nicknames' },
      dashboardType: { type: 'string', enum: ['basic', 'comprehensive', 'custom'] },
      integrations: { type: 'array', items: { type: 'string' }, description: 'Tools to integrate' },
    },
    required: [],
  },
  connectors: ['slack', 'notion', 'asana', 'linear', 'ms365', 'google-calendar', 'gmail'],
});

// 3. Task Management Skill
export const taskManagementSkill = createSkill({
  id: '/task-management',
  name: 'Task Management',
  description: 'Simple task management using a shared TASKS.md file',
  category: 'productivity',
  agent: {
    id: 'task-manager',
    capabilities: ['task-tracking', 'prioritization', 'workflow-management'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'task-management',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'complete', 'list', 'update', 'prioritize'] },
      task: { type: 'string', description: 'Task description' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      dueDate: { type: 'string', description: 'Due date' },
      status: { type: 'string', enum: ['todo', 'in-progress', 'completed', 'blocked'] },
    },
    required: ['action'],
  },
  connectors: ['slack', 'notion', 'asana', 'linear', 'ms365', 'google-calendar', 'gmail'],
});

// 4. Update Skill
export const updateSkill = createSkill({
  id: '/update',
  name: 'Update',
  description: 'Sync tasks and refresh memory from your current activity',
  category: 'productivity',
  agent: {
    id: 'productivity-sync',
    capabilities: ['task-sync', 'memory-refresh', 'gap-analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'sync',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      scope: { type: 'string', enum: ['quick', 'comprehensive'] },
      sources: { type: 'array', items: { type: 'string' }, description: 'Sources to scan' },
      staleThreshold: { type: 'number', description: 'Days threshold for stale tasks' },
      memoryGaps: { type: 'array', items: { type: 'string' }, description: 'Known memory gaps' },
    },
    required: ['scope'],
  },
  connectors: ['slack', 'notion', 'asana', 'linear', 'ms365', 'google-calendar', 'gmail'],
});

// Export all skills
export const productivitySkills: SkillDefinition[] = [
  memoryManagementSkill,
  startSkill,
  taskManagementSkill,
  updateSkill,
];

// Register function
export function registerProductivitySkills(registry?: any): void {
  productivitySkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
