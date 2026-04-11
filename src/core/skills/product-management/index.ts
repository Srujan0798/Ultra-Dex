/**
 * Product Management Skills for Ultra-Dex
 * Implements all 9 product management skills from Claude's Product Management plugin
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

// 1. Competitive Brief Skill
export const competitiveBriefSkill = defineSkill({
  id: '/competitive-brief',
  name: 'Competitive Brief',
  description: 'Create a competitive analysis brief for competitors or feature areas',
  category: 'product',
  agent: {
    id: 'product-analyst',
    capabilities: ['market-research', 'competitive-analysis', 'strategy'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      competitors: { type: 'array', items: { type: 'string' } },
      featureArea: { type: 'string' },
      context: { type: 'string' },
      objectives: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      strengths: { type: 'array', items: { type: 'string' } },
      weaknesses: { type: 'array', items: { type: 'string' } },
      opportunities: { type: 'array', items: { type: 'string' } },
      threats: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
      differentiation: { type: 'string' },
    },
  },
  promptTemplate: `
Create a competitive analysis brief.

{{#if competitors}}
Competitors: {{competitors}}
{{/if}}

{{#if featureArea}}
Feature Area: {{featureArea}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

{{#if objectives}}
Objectives: {{objectives}}
{{/if}}

Provide analysis in JSON format:
{
  "summary": "Brief overview",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "threats": ["Threat 1", "Threat 2"],
  "recommendations": ["Rec 1", "Rec 2"],
  "differentiation": "How to differentiate"
}
`,
  config: {
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'competitive', 'analysis'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['similarweb', 'notion', 'linear'],
});

// 2. Metrics Review Skill
export const metricsReviewSkill = defineSkill({
  id: '/metrics-review',
  name: 'Metrics Review',
  description: 'Review and analyze product metrics with trend analysis',
  category: 'product',
  agent: {
    id: 'data-analyst',
    capabilities: ['metrics-analysis', 'trend-analysis', 'kpi-tracking'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      metrics: { type: 'object' },
      period: { type: 'string' },
      targets: { type: 'object' },
      context: { type: 'string' },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      trends: { type: 'array', items: { type: 'object' } },
      insights: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
      actions: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Review product metrics and provide analysis.

{{#if metrics}}
Metrics: {{metrics}}
{{/if}}

{{#if period}}
Period: {{period}}
{{/if}}

{{#if targets}}
Targets: {{targets}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

Provide analysis in JSON format:
{
  "summary": "Brief overview",
  "trends": [{"metric": "", "value": 0, "change": 0, "direction": "up|down|stable"}],
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Rec 1", "Rec 2"],
  "actions": ["Action 1", "Action 2"]
}
`,
  config: {
    temperature: 0.1,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'metrics', 'kpi'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['amplitude', 'amplitude-eu', 'pendo', 'intercom'],
});

// 3. Product Brainstorming Skill
export const productBrainstormingSkill = defineSkill({
  id: '/product-brainstorming',
  name: 'Product Brainstorming',
  description: 'Brainstorm product ideas and explore problem spaces',
  category: 'product',
  agent: {
    id: 'product-strategist',
    capabilities: ['ideation', 'problem-analysis', 'innovation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'ideation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      problem: { type: 'string' },
      context: { type: 'string' },
      constraints: { type: 'array', items: { type: 'string' } },
      goals: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      ideas: { type: 'array', items: { type: 'object' } },
      analysis: { type: 'string' },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Brainstorm product ideas and solutions.

{{#if problem}}
Problem: {{problem}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

{{#if constraints}}
Constraints: {{constraints}}
{{/if}}

{{#if goals}}
Goals: {{goals}}
{{/if}}

Provide ideas in JSON format:
{
  "ideas": [
    {
      "title": "Idea title",
      "description": "Detailed description",
      "feasibility": "High|Medium|Low",
      "impact": "High|Medium|Low",
      "effort": "High|Medium|Low"
    }
  ],
  "analysis": "Analysis of ideas",
  "recommendations": ["Rec 1", "Rec 2"]
}
`,
  config: {
    temperature: 0.7,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'brainstorming', 'ideation'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'figma', 'linear'],
});

// 4. Roadmap Update Skill
export const roadmapUpdateSkill = defineSkill({
  id: '/roadmap-update',
  name: 'Roadmap Update',
  description: 'Update, create, or reprioritize your product roadmap',
  category: 'product',
  agent: {
    id: 'product-manager',
    capabilities: ['roadmap-planning', 'prioritization', 'timeline-management'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'planning',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      initiatives: { type: 'array', items: { type: 'object' } },
      timeline: { type: 'string' },
      priorities: { type: 'array', items: { type: 'string' } },
      constraints: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      roadmap: { type: 'array', items: { type: 'object' } },
      rationale: { type: 'string' },
      risks: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Update or create a product roadmap.

{{#if initiatives}}
Initiatives: {{initiatives}}
{{/if}}

{{#if timeline}}
Timeline: {{timeline}}
{{/if}}

{{#if priorities}}
Priorities: {{priorities}}
{{/if}}

{{#if constraints}}
Constraints: {{constraints}}
{{/if}}

Provide roadmap in JSON format:
{
  "roadmap": [
    {
      "initiative": "Initiative name",
      "quarter": "Q1|Q2|Q3|Q4",
      "status": "Now|Next|Later|Deprioritized",
      "theme": "Theme name",
      "dependencies": ["Dep 1", "Dep 2"]
    }
  ],
  "rationale": "Prioritization rationale",
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Rec 1", "Rec 2"]
}
`,
  config: {
    temperature: 0.2,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'roadmap', 'planning'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['linear', 'asana', 'monday', 'clickup', 'atlassian'],
});

// 5. Sprint Planning Skill
export const sprintPlanningSkill = defineSkill({
  id: '/sprint-planning',
  name: 'Sprint Planning',
  description: 'Plan a sprint with scope, capacity, and goals',
  category: 'product',
  agent: {
    id: 'scrum-master',
    capabilities: ['sprint-planning', 'capacity-planning', 'task-breakdown'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'planning',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      backlog: { type: 'array', items: { type: 'object' } },
      teamCapacity: { type: 'number' },
      sprintGoal: { type: 'string' },
      constraints: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      sprintPlan: { type: 'array', items: { type: 'object' } },
      capacity: { type: 'object' },
      risks: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Plan a sprint with scope and capacity.

{{#if backlog}}
Backlog: {{backlog}}
{{/if}}

{{#if teamCapacity}}
Team Capacity: {{teamCapacity}} points
{{/if}}

{{#if sprintGoal}}
Sprint Goal: {{sprintGoal}}
{{/if}}

{{#if constraints}}
Constraints: {{constraints}}
{{/if}}

Provide sprint plan in JSON format:
{
  "sprintPlan": [
    {
      "task": "Task description",
      "points": 0,
      "priority": "P0|P1|P2",
      "assignee": "Team member",
      "status": "Planned|In Progress|Done"
    }
  ],
  "capacity": {
    "total": 0,
    "allocated": 0,
    "remaining": 0
  },
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Rec 1", "Rec 2"]
}
`,
  config: {
    temperature: 0.2,
    maxTokens: 2500,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'sprint', 'planning'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['linear', 'asana', 'monday', 'clickup', 'atlassian'],
});

// 6. Stakeholder Update Skill
export const stakeholderUpdateSkill = defineSkill({
  id: '/stakeholder-update',
  name: 'Stakeholder Update',
  description: 'Generate stakeholder update tailored to audience and cadence',
  category: 'product',
  agent: {
    id: 'communications-specialist',
    capabilities: ['communications', 'status-reporting', 'executive-summary'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'communications',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      audience: { type: 'string', enum: ['executive', 'engineering', 'customer', 'investor'] },
      projectName: { type: 'string' },
      timePeriod: { type: 'string' },
      accomplishments: { type: 'array', items: { type: 'string' } },
      metrics: { type: 'object' },
      nextSteps: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      update: { type: 'string' },
      summary: { type: 'string' },
      keyMetrics: { type: 'object' },
      nextSteps: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Generate a stakeholder update.

{{#if audience}}
Audience: {{audience}}
{{/if}}

{{#if projectName}}
Project: {{projectName}}
{{/if}}

{{#if timePeriod}}
Time Period: {{timePeriod}}
{{/if}}

{{#if accomplishments}}
Accomplishments: {{accomplishments}}
{{/if}}

{{#if metrics}}
Metrics: {{metrics}}
{{/if}}

{{#if nextSteps}}
Next Steps: {{nextSteps}}
{{/if}}

{{#if risks}}
Risks: {{risks}}
{{/if}}

Provide update in JSON format:
{
  "update": "Detailed update message",
  "summary": "Brief summary",
  "keyMetrics": {"metric": "value"},
  "nextSteps": ["Step 1", "Step 2"],
  "risks": ["Risk 1", "Risk 2"]
}
`,
  config: {
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'communications', 'stakeholder'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['slack', 'notion', 'google-calendar', 'gmail'],
});

// 7. Synthesize Research Skill
export const synthesizeResearchSkill = defineSkill({
  id: '/synthesize-research',
  name: 'Synthesize Research',
  description: 'Synthesize user research into structured insights',
  category: 'product',
  agent: {
    id: 'user-researcher',
    capabilities: ['user-research', 'insight-synthesis', 'pattern-analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'analysis',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      researchData: { type: 'array', items: { type: 'object' } },
      researchType: {
        type: 'string',
        enum: ['interviews', 'surveys', 'feedback', 'support-tickets'],
      },
      objectives: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      insights: { type: 'array', items: { type: 'object' } },
      themes: { type: 'array', items: { type: 'object' } },
      recommendations: { type: 'array', items: { type: 'string' } },
      priority: { type: 'array', items: { type: 'object' } },
    },
  },
  promptTemplate: `
Synthesize user research into insights.

{{#if researchData}}
Research Data: {{researchData}}
{{/if}}

{{#if researchType}}
Research Type: {{researchType}}
{{/if}}

{{#if objectives}}
Objectives: {{objectives}}
{{/if}}

Provide insights in JSON format:
{
  "insights": [
    {
      "finding": "Key finding",
      "evidence": "Supporting evidence",
      "impact": "High|Medium|Low",
      "frequency": "High|Medium|Low"
    }
  ],
  "themes": [
    {
      "name": "Theme name",
      "description": "Theme description",
      "relatedFindings": ["Finding 1", "Finding 2"]
    }
  ],
  "recommendations": ["Rec 1", "Rec 2"],
  "priority": [
    {
      "finding": "Finding description",
      "priority": "High|Medium|Low",
      "rationale": "Priority rationale"
    }
  ]
}
`,
  config: {
    temperature: 0.2,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'research', 'insights'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['intercom', 'notion', 'figma', 'google-calendar', 'gmail'],
});

// 8. Write Spec Skill
export const writeSpecSkill = defineSkill({
  id: '/write-spec',
  name: 'Write Spec',
  description: 'Write a feature spec or PRD from a problem statement',
  category: 'product',
  agent: {
    id: 'technical-writer',
    capabilities: ['spec-writing', 'requirements-analysis', 'documentation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'documentation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      featureName: { type: 'string' },
      description: { type: 'string' },
      problem: { type: 'string' },
      stakeholders: { type: 'array', items: { type: 'string' } },
      requirements: { type: 'array', items: { type: 'string' } },
      goals: { type: 'array', items: { type: 'string' } },
      nonGoals: { type: 'array', items: { type: 'string' } },
      successMetrics: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      spec: { type: 'object' },
      userStories: { type: 'array', items: { type: 'object' } },
      requirements: { type: 'array', items: { type: 'object' } },
      acceptanceCriteria: { type: 'array', items: { type: 'string' } },
      successMetrics: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Write a feature specification or PRD.

{{#if featureName}}
Feature: {{featureName}}
{{/if}}

{{#if description}}
Description: {{description}}
{{/if}}

{{#if problem}}
Problem: {{problem}}
{{/if}}

{{#if stakeholders}}
Stakeholders: {{stakeholders}}
{{/if}}

{{#if requirements}}
Requirements: {{requirements}}
{{/if}}

{{#if goals}}
Goals: {{goals}}
{{/if}}

{{#if nonGoals}}
Non-Goals: {{nonGoals}}
{{/if}}

{{#if successMetrics}}
Success Metrics: {{successMetrics}}
{{/if}}

Provide spec in JSON format:
{
  "spec": {
    "title": "Feature Name",
    "description": "Detailed description",
    "problem": "Problem statement",
    "solution": "Solution overview"
  },
  "userStories": [
    {
      "title": "Story title",
      "asA": "User role",
      "iWant": "Functionality",
      "soThat": "Business value",
      "priority": "High|Medium|Low"
    }
  ],
  "requirements": [
    {
      "id": "REQ-001",
      "description": "Requirement description",
      "type": "Functional|Non-functional",
      "priority": "High|Medium|Low"
    }
  ],
  "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
  "successMetrics": ["Metric 1", "Metric 2"]
}
`,
  config: {
    temperature: 0.2,
    maxTokens: 4000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'spec', 'documentation'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['notion', 'figma', 'linear', 'atlassian'],
});

// 9. Brainstorm Skill (Additional)
export const brainstormSkill = defineSkill({
  id: '/brainstorm',
  name: 'Brainstorm',
  description: 'Brainstorm a product idea with a sharp thinking partner',
  category: 'product',
  agent: {
    id: 'innovation-consultant',
    capabilities: ['ideation', 'problem-solving', 'strategic-thinking'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'ideation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      context: { type: 'string' },
      constraints: { type: 'array', items: { type: 'string' } },
      goals: { type: 'array', items: { type: 'string' } },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      ideas: { type: 'array', items: { type: 'object' } },
      analysis: { type: 'string' },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Brainstorm ideas and solutions.

{{#if topic}}
Topic: {{topic}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

{{#if constraints}}
Constraints: {{constraints}}
{{/if}}

{{#if goals}}
Goals: {{goals}}
{{/if}}

Provide ideas in JSON format:
{
  "ideas": [
    {
      "title": "Idea title",
      "description": "Detailed description",
      "feasibility": "High|Medium|Low",
      "impact": "High|Medium|Low",
      "effort": "High|Medium|Low"
    }
  ],
  "analysis": "Analysis of ideas",
  "recommendations": ["Rec 1", "Rec 2"]
}
`,
  config: {
    temperature: 0.8,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['product', 'brainstorming', 'innovation'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'figma'],
});

// Export all product skills
export const productSkills = [
  competitiveBriefSkill,
  metricsReviewSkill,
  productBrainstormingSkill,
  roadmapUpdateSkill,
  sprintPlanningSkill,
  stakeholderUpdateSkill,
  synthesizeResearchSkill,
  writeSpecSkill,
  brainstormSkill,
];

// Register all skills
export function registerProductSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of productSkills) {
    registry.register(skill);
  }
}

// Product connectors list for reference
export const productConnectors = [
  'slack',
  'linear',
  'asana',
  'monday',
  'clickup',
  'atlassian',
  'notion',
  'figma',
  'amplitude',
  'amplitude-eu',
  'pendo',
  'intercom',
  'fireflies',
  'google-calendar',
  'gmail',
  'similarweb',
];
