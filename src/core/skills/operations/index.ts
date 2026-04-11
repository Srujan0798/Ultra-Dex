/**
 * Operations Skills for Ultra-Dex
 * 9 Claude Operations plugin skills
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
Execute the operations skill: {{skillName}}

Input: {{input}}

Provide a complete operations solution with:
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
      tags: ['operations'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Capacity Plan Skill
export const capacityPlanSkill = createSkill({
  id: '/capacity-plan',
  name: 'Capacity Plan',
  description: 'Plan resource capacity — workload analysis and utilization forecasting',
  category: 'operations',
  agent: {
    id: 'operations-planner',
    capabilities: ['capacity-planning', 'resource-management', 'forecasting'],
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
      teamSize: { type: 'number', description: 'Current team size' },
      workload: { type: 'object', description: 'Current workload data' },
      projects: { type: 'array', items: { type: 'string' }, description: 'Upcoming projects' },
      timeframe: { type: 'string', description: 'Planning timeframe (e.g., Q3)' },
      utilizationTarget: { type: 'number', description: 'Target utilization percentage' },
    },
    required: ['teamSize', 'timeframe'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'asana'],
});

// 2. Change Request Skill
export const changeRequestSkill = createSkill({
  id: '/change-request',
  name: 'Change Request',
  description: 'Create a change management request with impact analysis and rollback plan',
  category: 'operations',
  agent: {
    id: 'change-manager',
    capabilities: ['change-management', 'impact-analysis', 'risk-assessment'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'change-management',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      changeType: { type: 'string', enum: ['system', 'process', 'policy', 'infrastructure'] },
      description: { type: 'string', description: 'Change description' },
      impact: { type: 'string', description: 'Expected impact' },
      stakeholders: {
        type: 'array',
        items: { type: 'string' },
        description: 'Affected stakeholders',
      },
      rollbackPlan: { type: 'string', description: 'Rollback plan description' },
    },
    required: ['changeType', 'description'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'servicenow', 'ms365'],
});

// 3. Compliance Tracking Skill
export const complianceTrackingSkill = createSkill({
  id: '/compliance-tracking',
  name: 'Compliance Tracking',
  description: 'Track compliance requirements and audit readiness',
  category: 'operations',
  agent: {
    id: 'compliance-tracker',
    capabilities: ['compliance', 'audit-readiness', 'regulatory-tracking'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'compliance',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      framework: { type: 'string', enum: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'] },
      status: { type: 'string', enum: ['planning', 'implementation', 'audit', 'maintenance'] },
      requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Compliance requirements',
      },
      evidence: { type: 'string', description: 'Existing evidence' },
      auditDate: { type: 'string', description: 'Next audit date' },
    },
    required: ['framework'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'servicenow'],
});

// 4. Process Documentation Skill
export const processDocSkill = createSkill({
  id: '/process-doc',
  name: 'Process Documentation',
  description: 'Document a business process — flowcharts, RACI, and SOPs',
  category: 'operations',
  agent: {
    id: 'process-documenter',
    capabilities: ['process-documentation', 'sop-writing', 'raci-charting'],
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
      processName: { type: 'string', description: 'Process name' },
      steps: { type: 'array', items: { type: 'string' }, description: 'Process steps' },
      stakeholders: {
        type: 'array',
        items: { type: 'string' },
        description: 'Process stakeholders',
      },
      outputType: { type: 'string', enum: ['flowchart', 'raci', 'sop', 'all'] },
    },
    required: ['processName'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'asana'],
});

// 5. Process Optimization Skill
export const processOptimizationSkill = createSkill({
  id: '/process-optimization',
  name: 'Process Optimization',
  description: 'Analyze and improve business processes',
  category: 'operations',
  agent: {
    id: 'process-optimizer',
    capabilities: ['process-analysis', 'optimization', 'workflow-improvement'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'optimization',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      process: { type: 'string', description: 'Process description' },
      painPoints: { type: 'array', items: { type: 'string' }, description: 'Current pain points' },
      metrics: { type: 'object', description: 'Current performance metrics' },
      goals: { type: 'array', items: { type: 'string' }, description: 'Optimization goals' },
    },
    required: ['process'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'asana'],
});

// 6. Risk Assessment Skill
export const riskAssessmentSkill = createSkill({
  id: '/risk-assessment',
  name: 'Risk Assessment',
  description: 'Identify, assess, and mitigate operational risks',
  category: 'operations',
  agent: {
    id: 'risk-analyst',
    capabilities: ['risk-assessment', 'mitigation-planning', 'risk-registry'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'risk-analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      context: { type: 'string', description: 'Risk context (project, vendor, process)' },
      knownRisks: { type: 'array', items: { type: 'string' }, description: 'Known risks' },
      impactScale: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      likelihood: { type: 'string', enum: ['low', 'medium', 'high', 'certain'] },
    },
    required: ['context'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'servicenow'],
});

// 7. Runbook Skill
export const runbookSkill = createSkill({
  id: '/runbook',
  name: 'Runbook',
  description: 'Create or update an operational runbook for a recurring task or procedure',
  category: 'operations',
  agent: {
    id: 'runbook-creator',
    capabilities: ['procedure-documentation', 'troubleshooting', 'escalation-planning'],
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
      task: { type: 'string', description: 'Task or procedure name' },
      steps: { type: 'array', items: { type: 'string' }, description: 'Procedure steps' },
      troubleshooting: { type: 'string', description: 'Troubleshooting guidance' },
      escalation: { type: 'string', description: 'Escalation paths' },
    },
    required: ['task'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'servicenow'],
});

// 8. Status Report Skill
export const statusReportSkill = createSkill({
  id: '/status-report',
  name: 'Status Report',
  description: 'Generate a status report with KPIs, risks, and action items',
  category: 'operations',
  agent: {
    id: 'status-reporter',
    capabilities: ['reporting', 'kpi-tracking', 'risk-reporting'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'reporting',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      period: { type: 'string', description: 'Reporting period (weekly, monthly)' },
      kpis: { type: 'object', description: 'Key performance indicators' },
      risks: { type: 'array', items: { type: 'string' }, description: 'Current risks' },
      actionItems: { type: 'array', items: { type: 'string' }, description: 'Action items' },
    },
    required: ['period'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'asana'],
});

// 9. Vendor Review Skill
export const vendorReviewSkill = createSkill({
  id: '/vendor-review',
  name: 'Vendor Review',
  description: 'Evaluate a vendor — cost analysis, risk assessment, and recommendation',
  category: 'operations',
  agent: {
    id: 'vendor-analyst',
    capabilities: ['vendor-evaluation', 'cost-analysis', 'risk-assessment'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'evaluation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      vendor: { type: 'string', description: 'Vendor name' },
      proposal: { type: 'string', description: 'Vendor proposal details' },
      requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Business requirements',
      },
      budget: { type: 'number', description: 'Budget constraints' },
    },
    required: ['vendor'],
  },
  connectors: ['slack', 'google-calendar', 'gmail', 'notion', 'atlassian', 'servicenow'],
});

// Export all skills
export const operationsSkills: SkillDefinition[] = [
  capacityPlanSkill,
  changeRequestSkill,
  complianceTrackingSkill,
  processDocSkill,
  processOptimizationSkill,
  riskAssessmentSkill,
  runbookSkill,
  statusReportSkill,
  vendorReviewSkill,
];

// Register function
export function registerOperationsSkills(registry?: any): void {
  operationsSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
