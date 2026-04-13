/**
 * Customer Support Skills for Ultra-Dex
 * 5 Claude Customer Support plugin skills
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
Execute the customer support skill: {{skillName}}

Input: {{input}}

Provide a complete response with:
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
      tags: ['customer-support'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Customer Escalation Skill
export const customerEscalationSkill = createSkill({
  id: '/customer-escalation',
  name: 'Customer Escalation',
  description: 'Package an escalation for engineering, product, or leadership with full context',
  category: 'customer-support',
  agent: {
    id: 'support-escalation',
    capabilities: ['support-triage', 'technical-escalation', 'stakeholder-communication'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'escalation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      ticketId: { type: 'string', description: 'Support ticket ID' },
      customer: { type: 'string', description: 'Customer name or account' },
      issue: { type: 'string', description: 'Issue description' },
      severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      businessImpact: { type: 'string', description: 'Business impact assessment' },
      reproductionSteps: { type: 'string', description: 'Steps to reproduce the issue' },
      customerStatus: { type: 'string', description: 'Customer sentiment/status' },
      escalationTarget: { type: 'string', enum: ['engineering', 'product', 'leadership'] },
    },
    required: ['issue', 'severity', 'escalationTarget'],
  },
  connectors: ['support-platform', 'crm', 'project-tracker'],
});

// 2. Customer Research Skill
export const customerResearchSkill = createSkill({
  id: '/customer-research',
  name: 'Customer Research',
  description: 'Multi-source research on a customer question or topic with source attribution',
  category: 'customer-support',
  agent: {
    id: 'support-researcher',
    capabilities: ['research', 'knowledge-base-search', 'customer-context'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'research',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'Customer question or topic' },
      customer: { type: 'string', description: 'Customer name or account' },
      sources: {
        type: 'array',
        items: { type: 'string', enum: ['kb', 'tickets', 'docs', 'community'] },
        description: 'Sources to search',
      },
      context: { type: 'string', description: 'Additional context' },
    },
    required: ['question'],
  },
  connectors: ['knowledge-base', 'support-platform', 'crm'],
});

// 3. Draft Response Skill
export const draftResponseSkill = createSkill({
  id: '/draft-response',
  name: 'Draft Response',
  description:
    'Draft a professional customer-facing response tailored to the situation and relationship',
  category: 'customer-support',
  agent: {
    id: 'support-writer',
    capabilities: ['communication', 'empathy', 'technical-writing'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'writing',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      ticketId: { type: 'string', description: 'Support ticket ID' },
      customer: { type: 'string', description: 'Customer name or account' },
      question: { type: 'string', description: 'Customer question' },
      tone: { type: 'string', enum: ['formal', 'friendly', 'empathetic', 'technical'] },
      relationship: { type: 'string', enum: ['new', 'existing', 'enterprise', 'at-risk'] },
      channel: { type: 'string', enum: ['email', 'chat', 'ticket', 'phone'] },
      resolution: { type: 'string', description: 'Solution or answer' },
    },
    required: ['question'],
  },
  connectors: ['support-platform', 'crm', 'knowledge-base'],
});

// 4. KB Article Skill
export const kbArticleSkill = createSkill({
  id: '/kb-article',
  name: 'KB Article',
  description: 'Draft a knowledge base article from a resolved issue or common question',
  category: 'customer-support',
  agent: {
    id: 'knowledge-writer',
    capabilities: ['technical-writing', 'documentation', 'knowledge-management'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'documentation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      issue: { type: 'string', description: 'Resolved issue or question' },
      solution: { type: 'string', description: 'Solution or workaround' },
      category: { type: 'string', description: 'Article category' },
      audience: { type: 'string', enum: ['end-user', 'admin', 'technical'] },
      frequency: { type: 'string', description: 'How often this issue occurs' },
      ticketIds: { type: 'array', items: { type: 'string' }, description: 'Related ticket IDs' },
    },
    required: ['issue', 'solution'],
  },
  connectors: ['knowledge-base', 'support-platform'],
});

// 5. Ticket Triage Skill
export const ticketTriageSkill = createSkill({
  id: '/ticket-triage',
  name: 'Ticket Triage',
  description: 'Triage and prioritize a support ticket or customer issue',
  category: 'customer-support',
  agent: {
    id: 'support-triage',
    capabilities: ['triage', 'prioritization', 'categorization'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'classification',
    complexity: 'low',
  },
  input: {
    type: 'object',
    properties: {
      ticketId: { type: 'string', description: 'Support ticket ID' },
      customer: { type: 'string', description: 'Customer name or account' },
      issue: { type: 'string', description: 'Issue description' },
      urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      impact: { type: 'string', enum: ['individual', 'team', 'organization', 'system-wide'] },
      customerTier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
    },
    required: ['issue'],
  },
  connectors: ['support-platform', 'crm'],
});

// Export all skills
export const customerSkills: SkillDefinition[] = [
  customerEscalationSkill,
  customerResearchSkill,
  draftResponseSkill,
  kbArticleSkill,
  ticketTriageSkill,
];

// Register function
export function registerCustomerSkills(registry?: any): void {
  customerSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
