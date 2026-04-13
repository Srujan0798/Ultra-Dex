/**
 * Design Skills for Ultra-Dex
 * 8 Claude Design plugin skills
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

const FRONTEND_AESTHETIC_DIRECTIONS = [
  'brutalist',
  'minimalist',
  'maximalist',
  'retro-futuristic',
  'luxury-refined',
  'organic-natural',
  'playful-toy-like',
  'editorial-magazine',
  'art-deco-geometric',
  'soft-pastel',
  'industrial-utilitarian',
] as const;

// Helper function to create complete skill definitions
function createSkill(base: any): SkillDefinition {
  return defineSkill({
    ...base,
    output: base.output || {
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
    promptTemplate: base.promptTemplate || `
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
      ...(base.config || {}),
    },
    memory: {
      storeInput: true,
      storeOutput: true,
      tags: ['design'],
      searchable: true,
      ...(base.memory || {}),
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
      ...(base.governance || {}),
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

// 8. Frontend Design Skill
export const frontendDesignSkill = createSkill({
  id: '/frontend-design',
  name: 'Frontend Design',
  description:
    'Create distinctive, production-grade frontend interfaces with bold aesthetic direction',
  category: 'design',
  agent: {
    id: 'frontend-designer',
    capabilities: [
      'ui-design',
      'frontend-development',
      'interaction-design',
      'accessibility',
      'design-systems',
    ],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'frontend-design',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      request: {
        type: 'string',
        description:
          'What to build (component/page/dashboard/app), including key features and scope',
      },
      purpose: {
        type: 'string',
        description: 'Problem being solved and intended user outcome',
      },
      audience: {
        type: 'string',
        description: 'Primary users and context of use',
      },
      aestheticDirection: {
        type: 'string',
        enum: [...FRONTEND_AESTHETIC_DIRECTIONS],
        description: 'Choose one strong visual direction and commit to it',
      },
      technicalConstraints: {
        type: 'string',
        description:
          'Framework, performance, accessibility, browser support, and integration constraints',
      },
      differentiation: {
        type: 'string',
        description: 'One memorable element that makes the UI unforgettable',
      },
      framework: {
        type: 'string',
        enum: ['html-css-js', 'react', 'vue', 'svelte', 'nextjs', 'any'],
        default: 'any',
      },
      theme: {
        type: 'string',
        enum: ['light', 'dark', 'both', 'auto'],
        default: 'auto',
      },
      accessibilityTarget: {
        type: 'string',
        enum: ['wcag-aa', 'wcag-aaa'],
        default: 'wcag-aa',
      },
    },
    required: ['request'],
  },
  output: {
    type: 'object',
    properties: {
      concept: { type: 'string', description: 'Creative concept and direction summary' },
      designDirection: { type: 'string', description: 'Chosen aesthetic and execution rationale' },
      implementationSummary: { type: 'string', description: 'What was implemented and why' },
      code: {
        type: 'object',
        properties: {
          html: { type: 'string' },
          css: { type: 'string' },
          javascript: { type: 'string' },
          react: { type: 'string' },
          vue: { type: 'string' },
          svelte: { type: 'string' },
        },
      },
      accessibilityChecklist: {
        type: 'array',
        items: { type: 'string' },
        description: 'Accessibility guarantees delivered with the implementation',
      },
      polishChecklist: {
        type: 'array',
        items: { type: 'string' },
        description: 'Typography, color, motion, composition, and detail choices applied',
      },
      nextSteps: {
        type: 'array',
        items: { type: 'string' },
      },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  promptTemplate: `
You are executing the /frontend-design skill.

Build this frontend artifact:
{{request}}

{{#if purpose}}
Purpose:
{{purpose}}
{{/if}}

{{#if audience}}
Audience:
{{audience}}
{{/if}}

{{#if aestheticDirection}}
Aesthetic direction (commit fully):
{{aestheticDirection}}
{{/if}}

{{#if technicalConstraints}}
Technical constraints:
{{technicalConstraints}}
{{/if}}

{{#if differentiation}}
Differentiation target:
{{differentiation}}
{{/if}}

Framework: {{framework}}
Theme: {{theme}}
Accessibility target: {{accessibilityTarget}}

Design thinking requirements before coding:
1) Clarify purpose and audience context.
2) Commit to one bold aesthetic direction (do not blend generic styles).
3) Define one memorable differentiator.
4) Match implementation complexity to the aesthetic direction.

Aesthetic execution requirements:
- Typography: use distinctive, characterful font pairings. Avoid generic defaults (Arial, Inter, Roboto, system-only styling).
- Color: use cohesive CSS variables, dominant tones plus sharp accents. Avoid timid palettes and overused purple-on-white gradients.
- Motion: prioritize intentional motion moments (entry choreography, hover/scroll interaction), not random animation noise.
- Spatial composition: use deliberate asymmetry/overlap/diagonal flow or refined minimal precision.
- Visual atmosphere: add depth (textures, mesh/gradient layering, shadows, borders, grain, transparency) consistent with the chosen direction.

Quality requirements:
- Production-grade, working code (HTML/CSS/JS, React, Vue, or Svelte as requested)
- Accessible (semantic HTML, keyboard support, visible focus, adequate contrast, ARIA where needed)
- Responsive and performant
- Cohesive, memorable, and non-generic design

Return strict JSON with:
{
  "concept": "Creative direction summary",
  "designDirection": "Chosen aesthetic and rationale",
  "implementationSummary": "What was built and how decisions support the brief",
  "code": {
    "html": "Optional",
    "css": "Optional",
    "javascript": "Optional",
    "react": "Optional",
    "vue": "Optional",
    "svelte": "Optional"
  },
  "accessibilityChecklist": ["..."],
  "polishChecklist": ["..."],
  "nextSteps": ["..."],
  "confidence": 0.0
}
`,
  config: {
    temperature: 0.35,
    maxTokens: 5000,
    responseFormat: 'json' as const,
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['design', 'frontend-design', 'ui', 'ux'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic' as const,
    dataClassification: 'internal' as const,
  },
  connectors: ['figma', 'github', 'linear', 'notion', 'slack'],
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
  frontendDesignSkill,
];

// Register function
export function registerDesignSkills(registry?: any): void {
  designSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
