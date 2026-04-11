/**
 * Design Skills for Ultra-Dex
 * 7 Claude Design plugin skills
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
Execute the design skill: {{skillName}}

Input: {{input}}

Provide a complete design solution with:
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
      tags: ['design'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Accessibility Review Skill
export const accessibilityReviewSkill = createSkill({
  id: '/accessibility-review',
  name: 'Accessibility Review',
  description: 'Run a WCAG 2.1 AA accessibility audit on a design or page',
  category: 'design',
  agent: {
    id: 'accessibility-auditor',
    capabilities: ['accessibility', 'wcag-compliance', 'design-audit'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'audit',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      designUrl: { type: 'string', description: 'Design URL or screenshot' },
      designSystem: { type: 'string', description: 'Design system reference' },
      scope: { type: 'string', enum: ['quick', 'comprehensive'], description: 'Audit scope' },
      targetAudience: { type: 'string', description: 'Target user audience' },
      knownIssues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Known accessibility issues',
      },
    },
    required: ['designUrl'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion'],
});

// 2. Design Critique Skill
export const designCritiqueSkill = createSkill({
  id: '/design-critique',
  name: 'Design Critique',
  description: 'Get structured design feedback on usability, hierarchy, and consistency',
  category: 'design',
  agent: {
    id: 'design-critic',
    capabilities: ['design-review', 'usability-analysis', 'visual-hierarchy'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'review',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      designUrl: { type: 'string', description: 'Design URL or screenshot' },
      context: { type: 'string', description: 'Design context and goals' },
      focusAreas: { type: 'array', items: { type: 'string' }, description: 'Areas to focus on' },
      audience: { type: 'string', description: 'Target audience' },
    },
    required: ['designUrl'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion'],
});

// 3. Design Handoff Skill
export const designHandoffSkill = createSkill({
  id: '/design-handoff',
  name: 'Design Handoff',
  description: 'Generate developer handoff specs from a design',
  category: 'design',
  agent: {
    id: 'design-handoff',
    capabilities: ['spec-generation', 'dev-handoff', 'component-documentation'],
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
      designUrl: { type: 'string', description: 'Design URL or screenshot' },
      componentName: { type: 'string', description: 'Component name' },
      interactions: { type: 'array', items: { type: 'string' }, description: 'Interaction states' },
      responsive: { type: 'boolean', description: 'Responsive design required' },
      animations: { type: 'string', description: 'Animation requirements' },
    },
    required: ['designUrl'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion'],
});

// 4. Design System Skill
export const designSystemSkill = createSkill({
  id: '/design-system',
  name: 'Design System',
  description: 'Audit, document, or extend your design system',
  category: 'design',
  agent: {
    id: 'design-system-manager',
    capabilities: ['design-system', 'component-audit', 'documentation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'system-management',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['audit', 'document', 'extend'],
        description: 'Action to perform',
      },
      systemUrl: { type: 'string', description: 'Design system URL or reference' },
      components: {
        type: 'array',
        items: { type: 'string' },
        description: 'Components to focus on',
      },
      standards: { type: 'object', description: 'Design standards' },
    },
    required: ['action', 'systemUrl'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion'],
});

// 5. Research Synthesis Skill
export const researchSynthesisSkill = createSkill({
  id: '/research-synthesis',
  name: 'Research Synthesis',
  description: 'Synthesize user research into themes, insights, and recommendations',
  category: 'design',
  agent: {
    id: 'research-synthesizer',
    capabilities: ['research-synthesis', 'theme-identification', 'insight-generation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'synthesis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      researchData: { type: 'string', description: 'Research data or transcripts' },
      researchType: {
        type: 'string',
        enum: ['interviews', 'surveys', 'usability-tests', 'support-tickets'],
        description: 'Research type',
      },
      goals: { type: 'string', description: 'Research goals' },
      participantCount: { type: 'number', description: 'Number of participants' },
    },
    required: ['researchData'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion', 'intercom'],
});

// 6. User Research Skill
export const userResearchSkill = createSkill({
  id: '/user-research',
  name: 'User Research',
  description: 'Plan, conduct, and synthesize user research',
  category: 'design',
  agent: {
    id: 'user-researcher',
    capabilities: ['research-planning', 'interview-conduction', 'synthesis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'research',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      researchType: {
        type: 'string',
        enum: ['interviews', 'surveys', 'usability-tests', 'observational'],
        description: 'Research type',
      },
      researchGoals: { type: 'string', description: 'Research goals' },
      targetAudience: { type: 'string', description: 'Target audience' },
      timeline: { type: 'string', description: 'Research timeline' },
      budget: { type: 'number', description: 'Research budget' },
    },
    required: ['researchType', 'researchGoals'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion', 'intercom'],
});

// 7. UX Copy Skill
export const uxCopySkill = createSkill({
  id: '/ux-copy',
  name: 'UX Copy',
  description: 'Write or review UX copy — microcopy, error messages, empty states, CTAs',
  category: 'design',
  agent: {
    id: 'ux-writer',
    capabilities: ['ux-writing', 'microcopy', 'content-strategy'],
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
      context: { type: 'string', description: 'UX context and flow' },
      elementType: {
        type: 'string',
        enum: ['button', 'error', 'empty-state', 'confirmation', 'onboarding'],
        description: 'Element type',
      },
      brandVoice: { type: 'string', description: 'Brand voice guidelines' },
      targetAudience: { type: 'string', description: 'Target audience' },
      action: { type: 'string', enum: ['write', 'review'], description: 'Action to perform' },
    },
    required: ['context', 'elementType'],
  },
  connectors: ['slack', 'figma', 'linear', 'asana', 'atlassian', 'notion', 'intercom'],
});

// Export all skills
export const designSkills: SkillDefinition[] = [
  accessibilityReviewSkill,
  designCritiqueSkill,
  designHandoffSkill,
  designSystemSkill,
  researchSynthesisSkill,
  userResearchSkill,
  uxCopySkill,
];

// Register function
export function registerDesignSkills(registry?: any): void {
  designSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
