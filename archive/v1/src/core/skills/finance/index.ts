/**
 * Finance Skills for Ultra-Dex
 * 8 Claude Finance plugin skills
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
Execute the finance skill: {{skillName}}

Input: {{input}}

Provide a complete financial analysis with:
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
      tags: ['finance'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'full' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Audit Support Skill
export const auditSupportSkill = createSkill({
  id: '/audit-support',
  name: 'Audit Support',
  description:
    'Support SOX 404 compliance with control testing methodology, sample selection, and documentation standards',
  category: 'finance',
  agent: {
    id: 'finance-auditor',
    capabilities: ['audit', 'compliance', 'sox-testing'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'compliance',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      controlId: { type: 'string', description: 'Control ID' },
      controlType: { type: 'string', enum: ['itgc', 'key-control', 'process-control'] },
      sampleSize: { type: 'number', description: 'Sample size required' },
      period: { type: 'string', description: 'Audit period' },
      documentation: { type: 'string', description: 'Existing documentation' },
    },
    required: ['controlId', 'controlType'],
  },
  connectors: ['snowflake', 'databricks', 'bigquery'],
});

// 2. Close Management Skill
export const closeManagementSkill = createSkill({
  id: '/close-management',
  name: 'Close Management',
  description:
    'Manage the month-end close process with task sequencing, dependencies, and status tracking',
  category: 'finance',
  agent: {
    id: 'finance-manager',
    capabilities: ['close-process', 'task-management', 'reporting'],
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
      period: { type: 'string', description: 'Close period (e.g., "2024-Q1")' },
      tasks: { type: 'array', items: { type: 'string' }, description: 'List of close tasks' },
      dependencies: { type: 'object', description: 'Task dependencies' },
      deadlines: { type: 'object', description: 'Task deadlines' },
    },
    required: ['period'],
  },
  connectors: ['ms365', 'google-calendar', 'slack'],
});

// 3. Financial Statements Skill
export const financialStatementsSkill = createSkill({
  id: '/financial-statements',
  name: 'Financial Statements',
  description:
    'Generate financial statements (income statement, balance sheet, cash flow) with period-over-period comparison and variance analysis',
  category: 'finance',
  agent: {
    id: 'finance-analyst',
    capabilities: ['financial-analysis', 'reporting', 'gaap'],
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
      period: { type: 'string', description: 'Reporting period' },
      comparisonPeriod: { type: 'string', description: 'Comparison period' },
      data: { type: 'object', description: 'Financial data' },
      statementType: { type: 'string', enum: ['income', 'balance', 'cash-flow', 'all'] },
      varianceThreshold: { type: 'number', description: 'Variance threshold percentage' },
    },
    required: ['period', 'statementType'],
  },
  connectors: ['snowflake', 'databricks', 'bigquery'],
});

// 4. Journal Entry Prep Skill
export const journalEntryPrepSkill = createSkill({
  id: '/journal-entry-prep',
  name: 'Journal Entry Prep',
  description:
    'Prepare journal entries with proper debits, credits, and supporting documentation for month-end close',
  category: 'finance',
  agent: {
    id: 'finance-accountant',
    capabilities: ['accounting', 'journal-entries', 'gaap'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'accounting',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      entryType: {
        type: 'string',
        enum: ['accrual', 'depreciation', 'amortization', 'revenue', 'payroll'],
      },
      amount: { type: 'number', description: 'Entry amount' },
      accounts: { type: 'object', description: 'Debit/credit accounts' },
      description: { type: 'string', description: 'Entry description' },
      supportingDocs: { type: 'string', description: 'Supporting documentation' },
    },
    required: ['entryType', 'amount', 'accounts'],
  },
  connectors: ['ms365', 'gmail'],
});

// 5. Journal Entry Skill
export const journalEntrySkill = createSkill({
  id: '/journal-entry',
  name: 'Journal Entry',
  description: 'Prepare journal entries with proper debits, credits, and supporting detail',
  category: 'finance',
  agent: {
    id: 'finance-accountant',
    capabilities: ['accounting', 'journal-entries', 'gaap'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'accounting',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      entryType: {
        type: 'string',
        enum: ['accrual', 'depreciation', 'amortization', 'revenue', 'payroll'],
      },
      amount: { type: 'number', description: 'Entry amount' },
      accounts: { type: 'object', description: 'Debit/credit accounts' },
      description: { type: 'string', description: 'Entry description' },
      supportingDocs: { type: 'string', description: 'Supporting documentation' },
    },
    required: ['entryType', 'amount', 'accounts'],
  },
  connectors: ['ms365', 'gmail'],
});

// 6. Reconciliation Skill
export const reconciliationSkill = createSkill({
  id: '/reconciliation',
  name: 'Reconciliation',
  description:
    'Reconcile accounts by comparing GL balances to subledgers, bank statements, or third-party data',
  category: 'finance',
  agent: {
    id: 'finance-reconciler',
    capabilities: ['reconciliation', 'accounting', 'analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'reconciliation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      account: { type: 'string', description: 'Account to reconcile' },
      glBalance: { type: 'number', description: 'GL balance' },
      sourceBalance: { type: 'number', description: 'Source balance (bank, subledger, etc.)' },
      sourceType: { type: 'string', enum: ['bank', 'subledger', 'third-party'] },
      period: { type: 'string', description: 'Reconciliation period' },
    },
    required: ['account', 'glBalance', 'sourceBalance'],
  },
  connectors: ['snowflake', 'databricks', 'bigquery'],
});

// 7. SOX Testing Skill
export const soxTestingSkill = createSkill({
  id: '/sox-testing',
  name: 'SOX Testing',
  description: 'Generate SOX sample selections, testing workpapers, and control assessments',
  category: 'finance',
  agent: {
    id: 'finance-auditor',
    capabilities: ['sox-testing', 'compliance', 'audit'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'compliance',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      controlId: { type: 'string', description: 'Control ID' },
      populationSize: { type: 'number', description: 'Population size' },
      sampleMethod: { type: 'string', enum: ['random', 'judgmental', 'systematic'] },
      confidenceLevel: { type: 'number', description: 'Confidence level (e.g., 0.95)' },
      period: { type: 'string', description: 'Testing period' },
    },
    required: ['controlId', 'populationSize'],
  },
  connectors: ['snowflake', 'databricks', 'bigquery'],
});

// 8. Variance Analysis Skill
export const varianceAnalysisSkill = createSkill({
  id: '/variance-analysis',
  name: 'Variance Analysis',
  description:
    'Decompose financial variances into drivers with narrative explanations and waterfall analysis',
  category: 'finance',
  agent: {
    id: 'finance-analyst',
    capabilities: ['variance-analysis', 'financial-modeling', 'reporting'],
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
      metric: { type: 'string', description: 'Financial metric' },
      actual: { type: 'number', description: 'Actual value' },
      budget: { type: 'number', description: 'Budgeted value' },
      period: { type: 'string', description: 'Analysis period' },
      drivers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Potential variance drivers',
      },
    },
    required: ['metric', 'actual', 'budget'],
  },
  connectors: ['snowflake', 'databricks', 'bigquery'],
});

// Export all skills
export const financeSkills: SkillDefinition[] = [
  auditSupportSkill,
  closeManagementSkill,
  financialStatementsSkill,
  journalEntryPrepSkill,
  journalEntrySkill,
  reconciliationSkill,
  soxTestingSkill,
  varianceAnalysisSkill,
];

// Register function
export function registerFinanceSkills(registry?: any): void {
  financeSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
