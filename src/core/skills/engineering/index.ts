/**
 * Engineering Skills for Ultra-Dex
 * 10 Claude Engineering plugin skills
 */

import { defineSkill } from '../framework.js';

// 1. Code Review Skill
export const codeReviewSkill = defineSkill({
  id: '/code-review',
  name: 'Code Review',
  description: 'Review code changes for security, performance, and correctness',
  category: 'engineering',
  agent: {
    id: 'reviewer',
    capabilities: ['code-review', 'quality-check', 'security-audit'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai', 'deepseek'],
    fallback: true,
    taskType: 'code-analysis',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to review' },
      language: { type: 'string', description: 'Programming language' },
      focus: {
        type: 'array',
        items: { enum: ['security', 'performance', 'correctness', 'style'] },
        default: ['security', 'performance', 'correctness'],
      },
      prUrl: { type: 'string', description: 'Optional PR URL for context' },
      filePath: { type: 'string', description: 'File path for context' },
    },
    required: ['code'],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { enum: ['critical', 'high', 'medium', 'low'] },
            category: { enum: ['security', 'performance', 'correctness', 'style'] },
            file: { type: 'string' },
            line: { type: 'number' },
            message: { type: 'string' },
            suggestion: { type: 'string' },
          },
        },
      },
      actionItems: { type: 'array', items: { type: 'string' } },
      approval: { type: 'boolean' },
    },
  },
  promptTemplate: `
You are an expert code reviewer. Review the following {{language}} code:

{{#if filePath}}
File: {{filePath}}
{{/if}}

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Focus areas: {{focus}}

{{#if prUrl}}
PR Context: {{prUrl}}
{{/if}}

Provide a thorough review in JSON format:
{
  "summary": "Executive summary of the review",
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "security|performance|correctness|style",
      "file": "filename",
      "line": 42,
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "actionItems": ["Specific action 1", "Specific action 2"],
  "approval": false
}

Be thorough but constructive. Focus on significant issues first.
`,
  config: {
    temperature: 0,
    maxTokens: 4000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['code-review', 'quality', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'code',
  },
  connectors: ['github', 'gitlab'],
});

// 2. Architecture Skill
export const architectureSkill = defineSkill({
  id: '/architecture',
  name: 'Architecture Decision',
  description: 'Create or evaluate architecture decision records (ADRs)',
  category: 'engineering',
  agent: {
    id: 'cto',
    capabilities: ['architecture', 'adr-generation', 'decision-analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'architecture',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Architecture question or decision to evaluate' },
      context: { type: 'object', description: 'Current system context' },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Constraints to consider',
      },
      options: { type: 'array', items: { type: 'string' }, description: 'Options to evaluate' },
    },
    required: ['prompt'],
  },
  output: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      status: { enum: ['proposed', 'accepted', 'deprecated', 'superseded'] },
      context: { type: 'string' },
      decision: { type: 'string' },
      consequences: {
        type: 'object',
        properties: {
          positive: { type: 'array', items: { type: 'string' } },
          negative: { type: 'array', items: { type: 'string' } },
        },
      },
      alternatives: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
You are a senior architect. Create/evaluate an architecture decision for:

{{prompt}}

{{#if constraints}}
Constraints:
{{#each constraints}}
- {{this}}
{{/each}}
{{/if}}

{{#if options}}
Options to evaluate:
{{#each options}}
- {{this}}
{{/each}}
{{/if}}

{{#if context}}
Current Context: {{context}}
{{/if}}

Provide an Architecture Decision Record in JSON format:
{
  "title": "ADR Title",
  "status": "proposed",
  "context": "The problem we're solving",
  "decision": "The decision we made",
  "consequences": {
    "positive": ["Benefit 1", "Benefit 2"],
    "negative": ["Trade-off 1", "Trade-off 2"]
  },
  "alternatives": ["Option A", "Option B"]
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
    tags: ['adr', 'architecture', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'github'],
});

// 3. Debug Skill
export const debugSkill = defineSkill({
  id: '/debug',
  name: 'Debug',
  description: 'Structured debugging session - reproduce, isolate, diagnose, and fix',
  category: 'engineering',
  agent: {
    id: 'debugger',
    capabilities: ['debugging', 'root-cause-analysis', 'troubleshooting'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai', 'deepseek'],
    fallback: true,
    taskType: 'debugging',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Error message or stack trace' },
      context: { type: 'string', description: 'System context' },
      code: { type: 'string', description: 'Relevant code' },
      environment: { type: 'object', description: 'Environment details' },
    },
    required: ['error'],
  },
  output: {
    type: 'object',
    properties: {
      rootCause: { type: 'string' },
      hypothesis: { type: 'array', items: { type: 'string' } },
      reproduction: { type: 'string' },
      fix: { type: 'string' },
      prevention: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  promptTemplate: `
You are an expert debugger. Help diagnose this issue:

Error:
{{error}}

{{#if context}}
Context:
{{context}}
{{/if}}

{{#if code}}
Code:
\`\`\`
{{code}}
\`\`\`
{{/if}}

{{#if environment}}
Environment: {{environment}}
{{/if}}

Provide a structured analysis in JSON format:
{
  "rootCause": "The actual root cause",
  "hypothesis": ["Possible cause 1", "Possible cause 2"],
  "reproduction": "Steps to reproduce",
  "fix": "The fix to implement",
  "prevention": "How to prevent this in the future",
  "confidence": 0.85
}
`,
  config: {
    temperature: 0,
    maxTokens: 4000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['debugging', 'incident', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
  connectors: ['datadog', 'pagerduty'],
});

// 4. Deploy Checklist Skill
export const deployChecklistSkill = defineSkill({
  id: '/deploy-checklist',
  name: 'Deploy Checklist',
  description: 'Pre-deployment verification checklist',
  category: 'engineering',
  agent: {
    id: 'devops',
    capabilities: ['deployment', 'verification', 'checklist'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'deployment',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      service: { type: 'string', description: 'Service name' },
      changes: { type: 'array', items: { type: 'string' }, description: 'List of changes' },
      hasDatabaseMigration: { type: 'boolean', default: false },
      hasFeatureFlag: { type: 'boolean', default: false },
      environment: { type: 'string', enum: ['staging', 'production'], default: 'production' },
    },
    required: ['service', 'changes'],
  },
  output: {
    type: 'object',
    properties: {
      ready: { type: 'boolean' },
      checklist: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string' },
            status: { enum: ['required', 'recommended', 'optional'] },
            done: { type: 'boolean' },
          },
        },
      },
      blockers: { type: 'array', items: { type: 'string' } },
      rollback: { type: 'string' },
    },
  },
  promptTemplate: `
Create a pre-deployment checklist for {{service}} deployment to {{environment}}.

Changes:
{{#each changes}}
- {{this}}
{{/each}}

{{#if hasDatabaseMigration}}
Includes database migrations.
{{/if}}

{{#if hasFeatureFlag}}
Uses feature flags.
{{/if}}

Provide a deployment checklist in JSON format:
{
  "ready": false,
  "checklist": [
    {"item": "CI passes", "status": "required", "done": false},
    {"item": "Code review approved", "status": "required", "done": false}
  ],
  "blockers": ["List of blockers"],
  "rollback": "Rollback procedure"
}
`,
  config: {
    temperature: 0,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['deployment', 'checklist', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 5. Documentation Skill
export const documentationSkill = defineSkill({
  id: '/documentation',
  name: 'Documentation',
  description: 'Write and maintain technical documentation',
  category: 'engineering',
  agent: {
    id: 'cto',
    capabilities: ['documentation', 'technical-writing', 'knowledge-management'],
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
      topic: { type: 'string', description: 'What to document' },
      type: { enum: ['readme', 'api', 'runbook', 'adr', 'guide'], default: 'readme' },
      code: { type: 'string', description: 'Code to document' },
      audience: { enum: ['developer', 'end-user', 'ops'], default: 'developer' },
    },
    required: ['topic'],
  },
  output: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      content: { type: 'string' },
      sections: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Write {{type}} documentation for: {{topic}}

{{#if code}}
Code to document:
\`\`\`
{{code}}
\`\`\`
{{/if}}

Target audience: {{audience}}

Provide documentation in JSON format:
{
  "title": "Document Title",
  "content": "Full markdown content",
  "sections": ["Section 1", "Section 2"]
}
`,
  config: {
    temperature: 0.3,
    maxTokens: 5000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['documentation', 'technical-writing', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'github'],
});

// 6. Incident Response Skill
export const incidentResponseSkill = defineSkill({
  id: '/incident-response',
  name: 'Incident Response',
  description: 'Run an incident response workflow - triage, communicate, post-mortem',
  category: 'engineering',
  agent: {
    id: 'operator',
    capabilities: ['incident-response', 'crisis-management', 'communication'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'incident',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      alert: { type: 'string', description: 'Alert message' },
      severity: { enum: ['critical', 'high', 'medium', 'low'] },
      service: { type: 'string' },
      symptoms: { type: 'array', items: { type: 'string' } },
      metrics: { type: 'object' },
    },
    required: ['alert', 'service'],
  },
  output: {
    type: 'object',
    properties: {
      severity: { enum: ['critical', 'high', 'medium', 'low'] },
      triage: { type: 'string' },
      actions: { type: 'array', items: { type: 'string' } },
      communication: { type: 'string' },
      runbook: { type: 'string' },
      postMortem: { type: 'string' },
    },
  },
  promptTemplate: `
You are an incident commander. Respond to this incident:

Alert: {{alert}}
Service: {{service}}
Severity: {{severity}}

{{#if symptoms}}
Symptoms:
{{#each symptoms}}
- {{this}}
{{/each}}
{{/if}}

{{#if metrics}}
Metrics: {{metrics}}
{{/if}}

Provide incident response in JSON format:
{
  "severity": "critical|high|medium|low",
  "triage": "Triage summary",
  "actions": ["Immediate action 1", "Immediate action 2"],
  "communication": "Status update message",
  "runbook": "Link or steps to follow",
  "postMortem": "Post-mortem template"
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
    tags: ['incident', 'response', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['pagerduty', 'slack'],
});

// 7. Standup Skill
export const standupSkill = defineSkill({
  id: '/standup',
  name: 'Standup',
  description: 'Generate standup updates from recent activity',
  category: 'engineering',
  agent: {
    id: 'cto',
    capabilities: ['summarization', 'activity-tracking'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'summarization',
    complexity: 'low',
  },
  input: {
    type: 'object',
    properties: {
      commits: { type: 'array', items: { type: 'string' } },
      prs: { type: 'array', items: { type: 'string' } },
      tickets: { type: 'array', items: { type: 'string' } },
      notes: { type: 'string' },
    },
  },
  output: {
    type: 'object',
    properties: {
      yesterday: { type: 'string' },
      today: { type: 'string' },
      blockers: { type: 'array', items: { type: 'string' } },
      formatted: { type: 'string' },
    },
  },
  promptTemplate: `
Generate a standup update from this activity:

{{#if commits}}
Commits:
{{#each commits}}
- {{this}}
{{/each}}
{{/if}}

{{#if prs}}
PRs:
{{#each prs}}
- {{this}}
{{/each}}
{{/if}}

{{#if tickets}}
Tickets:
{{#each tickets}}
- {{this}}
{{/each}}
{{/if}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

Provide in JSON format:
{
  "yesterday": "What was done yesterday",
  "today": "What will be done today",
  "blockers": ["Blocker 1", "Blocker 2"],
  "formatted": "Yesterday: ...\\nToday: ...\\nBlockers: ..."
}
`,
  config: {
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: false,
    storeOutput: true,
    tags: ['standup', 'summary'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['github', 'linear'],
});

// 8. System Design Skill
export const systemDesignSkill = defineSkill({
  id: '/system-design',
  name: 'System Design',
  description: 'Design systems, services, and architectures',
  category: 'engineering',
  agent: {
    id: 'cto',
    capabilities: ['system-design', 'api-design', 'data-modeling'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'system-design',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      requirements: { type: 'string' },
      constraints: { type: 'array', items: { type: 'string' } },
      scale: { enum: ['small', 'medium', 'large', 'massive'] },
      requirementsList: { type: 'array', items: { type: 'string' } },
    },
    required: ['requirements'],
  },
  output: {
    type: 'object',
    properties: {
      overview: { type: 'string' },
      components: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            tech: { type: 'string' },
          },
        },
      },
      dataModel: { type: 'string' },
      api: { type: 'string' },
      tradeoffs: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Design a system for: {{requirements}}

{{#if scale}}
Scale: {{scale}}
{{/if}}

{{#if constraints}}
Constraints:
{{#each constraints}}
- {{this}}
{{/each}}
{{/if}}

{{#if requirementsList}}
Requirements:
{{#each requirementsList}}
- {{this}}
{{/each}}
{{/if}}

Provide system design in JSON format:
{
  "overview": "High-level design description",
  "components": [
    {"name": "Component", "description": "What it does", "tech": "Technology"}
  ],
  "dataModel": "Data model description",
  "api": "API design",
  "tradeoffs": ["Trade-off 1", "Trade-off 2"]
}
`,
  config: {
    temperature: 0.2,
    maxTokens: 5000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['system-design', 'architecture', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 9. Tech Debt Skill
export const techDebtSkill = defineSkill({
  id: '/tech-debt',
  name: 'Tech Debt',
  description: 'Identify, categorize, and prioritize technical debt',
  category: 'engineering',
  agent: {
    id: 'reviewer',
    capabilities: ['code-analysis', 'debt-identification'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'code-analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      codebase: { type: 'string' },
      files: { type: 'array', items: { type: 'string' } },
      metrics: { type: 'object' },
    },
  },
  output: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { enum: ['code', 'architecture', 'infra', 'process'] },
            severity: { enum: ['critical', 'high', 'medium', 'low'] },
            description: { type: 'string' },
            effort: { enum: ['small', 'medium', 'large'] },
            impact: { enum: ['low', 'medium', 'high'] },
          },
        },
      },
      prioritized: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Analyze this codebase for technical debt:

{{#if codebase}}
Codebase:
{{codebase}}
{{/if}}

{{#if files}}
Files:
{{#each files}}
- {{this}}
{{/each}}
{{/if}}

{{#if metrics}}
Metrics: {{metrics}}
{{/if}}

Provide analysis in JSON format:
{
  "items": [
    {
      "category": "code|architecture|infra|process",
      "severity": "critical|high|medium|low",
      "description": "Description of debt",
      "effort": "small|medium|large",
      "impact": "low|medium|high"
    }
  ],
  "prioritized": ["Item 1", "Item 2"]
}
`,
  config: {
    temperature: 0,
    maxTokens: 4000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['tech-debt', 'code-health', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'code',
  },
  connectors: ['github'],
});

// 10. Testing Strategy Skill
export const testingStrategySkill = defineSkill({
  id: '/testing-strategy',
  name: 'Testing Strategy',
  description: 'Design test strategies and test plans',
  category: 'engineering',
  agent: {
    id: 'debugger',
    capabilities: ['testing', 'qa', 'test-design'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'testing',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      feature: { type: 'string' },
      type: { enum: ['unit', 'integration', 'e2e', 'performance', 'security'] },
      tech: { type: 'string' },
      criticalPaths: { type: 'array', items: { type: 'string' } },
    },
    required: ['feature'],
  },
  output: {
    type: 'object',
    properties: {
      strategy: { type: 'string' },
      testTypes: { type: 'array', items: { type: 'string' } },
      coverage: { type: 'object' },
      scenarios: { type: 'array', items: { type: 'string' } },
      tools: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Design a testing strategy for: {{feature}}

{{#if type}}
Focus: {{type}} testing
{{/if}}

{{#if tech}}
Technology: {{tech}}
{{/if}}

{{#if criticalPaths}}
Critical paths:
{{#each criticalPaths}}
- {{this}}
{{/each}}
{{/if}}

Provide strategy in JSON format:
{
  "strategy": "Overall approach",
  "testTypes": ["Unit", "Integration", "E2E"],
  "coverage": {"target": 80, "critical": 95},
  "scenarios": ["Scenario 1", "Scenario 2"],
  "tools": ["Jest", "Cypress", "k6"]
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
    tags: ['testing', 'qa', 'engineering'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// Export all engineering skills
export const engineeringSkills = [
  codeReviewSkill,
  architectureSkill,
  debugSkill,
  deployChecklistSkill,
  documentationSkill,
  incidentResponseSkill,
  standupSkill,
  systemDesignSkill,
  techDebtSkill,
  testingStrategySkill,
];

// Register all skills
export function registerEngineeringSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of engineeringSkills) {
    registry.register(skill);
  }
}
