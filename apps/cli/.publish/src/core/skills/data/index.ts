/**
 * Data Skills for Ultra-Dex
 * 10 Claude Data plugin skills
 */

import { defineSkill } from '../framework.js';

// 1. SQL Queries Skill
export const sqlQueriesSkill = defineSkill({
  id: '/sql-queries',
  name: 'SQL Queries',
  description: 'Write correct, performant SQL across all major data warehouse dialects',
  category: 'data',
  agent: {
    id: 'database',
    capabilities: ['sql-generation', 'query-optimization', 'schema-understanding'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic', 'deepseek'],
    fallback: true,
    taskType: 'sql-generation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Natural language query request' },
      dialect: {
        enum: ['snowflake', 'bigquery', 'databricks', 'postgres', 'mysql', 'sqlite'],
        default: 'postgres',
      },
      schema: { type: 'object', description: 'Table schemas' },
      tables: { type: 'array', items: { type: 'string' } },
      previousQueries: { type: 'array', items: { type: 'string' } },
    },
    required: ['prompt'],
  },
  output: {
    type: 'object',
    properties: {
      sql: { type: 'string' },
      explanation: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      optimization: { type: 'string' },
    },
  },
  promptTemplate: `
Generate {{dialect}} SQL for: {{prompt}}

{{#if schema}}
Schema:
{{schema}}
{{/if}}

{{#if tables}}
Tables: {{tables}}
{{/if}}

{{#if previousQueries}}
Context from previous queries:
{{#each previousQueries}}
- {{this}}
{{/each}}
{{/if}}

Provide SQL in JSON format:
{
  "sql": "SELECT ...",
  "explanation": "What this query does",
  "confidence": 0.95,
  "optimization": "Performance notes"
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
    tags: ['sql', 'query', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
  connectors: ['snowflake', 'bigquery', 'databricks', 'postgres'],
});

// 2. Explore Data Skill
export const exploreDataSkill = defineSkill({
  id: '/explore-data',
  name: 'Explore Data',
  description: 'Profile and explore a dataset to understand shape, quality, and patterns',
  category: 'data',
  agent: {
    id: 'backend',
    capabilities: ['data-profiling', 'quality-analysis', 'pattern-detection'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'data-analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      dataset: { type: 'string', description: 'Dataset name or path' },
      sample: { type: 'array', items: { type: 'object' } },
      schema: { type: 'object' },
      size: { type: 'number' },
    },
    required: ['dataset'],
  },
  output: {
    type: 'object',
    properties: {
      shape: {
        type: 'object',
        properties: { rows: { type: 'number' }, columns: { type: 'number' } },
      },
      quality: {
        type: 'object',
        properties: {
          completeness: { type: 'number' },
          duplicates: { type: 'number' },
          issues: { type: 'array', items: { type: 'string' } },
        },
      },
      statistics: { type: 'object' },
      patterns: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Analyze this dataset: {{dataset}}

{{#if sample}}
Sample data ({{sample.length}} rows):
{{sample}}
{{/if}}

{{#if schema}}
Schema: {{schema}}
{{/if}}

{{#if size}}
Total size: {{size}} rows
{{/if}}

Provide analysis in JSON format:
{
  "shape": {"rows": 10000, "columns": 15},
  "quality": {
    "completeness": 0.95,
    "duplicates": 50,
    "issues": ["Issue 1", "Issue 2"]
  },
  "statistics": {"key": "value"},
  "patterns": ["Pattern 1", "Pattern 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
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
    tags: ['data-exploration', 'profiling', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
  connectors: ['snowflake', 'bigquery'],
});

// 3. Build Dashboard Skill
export const buildDashboardSkill = defineSkill({
  id: '/build-dashboard',
  name: 'Build Dashboard',
  description: 'Build an interactive HTML dashboard with charts, filters, and tables',
  category: 'data',
  agent: {
    id: 'frontend',
    capabilities: ['dashboard-design', 'visualization', 'html-generation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'dashboard-creation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      data: { type: 'object' },
      charts: { type: 'array', items: { enum: ['line', 'bar', 'pie', 'table', 'kpi', 'map'] } },
      filters: { type: 'array', items: { type: 'string' } },
      format: { enum: ['html', 'react', 'embed'], default: 'html' },
    },
    required: ['title'],
  },
  output: {
    type: 'object',
    properties: {
      html: { type: 'string' },
      components: { type: 'array', items: { type: 'string' } },
      filePath: { type: 'string' },
      preview: { type: 'string' },
    },
  },
  promptTemplate: `
Build a dashboard: {{title}}

{{#if data}}
Data:
{{data}}
{{/if}}

{{#if charts}}
Charts needed: {{charts}}
{{/if}}

{{#if filters}}
Filters: {{filters}}
{{/if}}

Format: {{format}}

Provide in JSON format:
{
  "html": "Complete HTML/JS code",
  "components": ["Chart 1", "Chart 2"],
  "filePath": "dashboard.html",
  "preview": "Description of dashboard"
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
    tags: ['dashboard', 'visualization', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 4. Analyze Data Skill
export const analyzeDataSkill = defineSkill({
  id: '/analyze',
  name: 'Analyze Data',
  description: 'Answer data questions from quick lookups to full analyses',
  category: 'data',
  agent: {
    id: 'backend',
    capabilities: ['data-analysis', 'insight-generation', 'trend-detection'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'data-analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      data: { type: 'object' },
      context: { type: 'string' },
    },
    required: ['question'],
  },
  output: {
    type: 'object',
    properties: {
      answer: { type: 'string' },
      findings: { type: 'array', items: { type: 'string' } },
      insights: { type: 'array', items: { type: 'string' } },
      methodology: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  promptTemplate: `
Answer this data question: {{question}}

{{#if data}}
Data: {{data}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

Provide analysis in JSON format:
{
  "answer": "Direct answer",
  "findings": ["Finding 1", "Finding 2"],
  "insights": ["Insight 1", "Insight 2"],
  "methodology": "How the analysis was done",
  "confidence": 0.9
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
    tags: ['analysis', 'insights', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 5. Create Viz Skill
export const createVizSkill = defineSkill({
  id: '/create-viz',
  name: 'Create Visualization',
  description: 'Create publication-quality visualizations with Python',
  category: 'data',
  agent: {
    id: 'frontend',
    capabilities: ['data-viz', 'python', 'matplotlib', 'plotly'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'visualization',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      data: { type: 'object' },
      chartType: { enum: ['line', 'bar', 'scatter', 'heatmap', 'histogram', 'box'] },
      title: { type: 'string' },
      x: { type: 'string' },
      y: { type: 'string' },
      library: { enum: ['matplotlib', 'seaborn', 'plotly'], default: 'plotly' },
    },
    required: ['data', 'chartType'],
  },
  output: {
    type: 'object',
    properties: {
      python: { type: 'string' },
      preview: { type: 'string' },
      interactive: { type: 'boolean' },
    },
  },
  promptTemplate: `
Create a {{chartType}} visualization using {{library}}.

{{#if title}}
Title: {{title}}
{{/if}}

Data:
{{data}}

{{#if x}}
X-axis: {{x}}
{{/if}}

{{#if y}}
Y-axis: {{y}}
{{/if}}

Provide in JSON format:
{
  "python": "Complete Python code",
  "preview": "Description",
  "interactive": true
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
    tags: ['visualization', 'python', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 6. Statistical Analysis Skill
export const statisticalAnalysisSkill = defineSkill({
  id: '/statistical-analysis',
  name: 'Statistical Analysis',
  description:
    'Apply statistical methods including descriptive stats, trend analysis, hypothesis testing',
  category: 'data',
  agent: {
    id: 'backend',
    capabilities: ['statistics', 'hypothesis-testing', 'regression'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'statistical-analysis',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      data: { type: 'object' },
      analysis: { enum: ['descriptive', 'correlation', 'regression', 'hypothesis', 'anova'] },
      hypothesis: { type: 'string' },
      variables: { type: 'array', items: { type: 'string' } },
    },
    required: ['data', 'analysis'],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      statistics: { type: 'object' },
      pValue: { type: 'number' },
      confidence: {
        type: 'object',
        properties: { lower: { type: 'number' }, upper: { type: 'number' } },
      },
      interpretation: { type: 'string' },
    },
  },
  promptTemplate: `
Perform {{analysis}} analysis on this data.

{{#if hypothesis}}
Hypothesis: {{hypothesis}}
{{/if}}

{{#if variables}}
Variables: {{variables}}
{{/if}}

Data:
{{data}}

Provide in JSON format:
{
  "summary": "Summary of analysis",
  "statistics": {"mean": 10.5, "std": 2.1},
  "pValue": 0.05,
  "confidence": {"lower": 8.2, "upper": 12.8},
  "interpretation": "What this means"
}
`,
  config: {
    temperature: 0.1,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['statistics', 'analysis', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 7. Validate Data Skill
export const validateDataSkill = defineSkill({
  id: '/validate-data',
  name: 'Validate Data',
  description: 'QA an analysis before sharing - methodology, accuracy, and bias checks',
  category: 'data',
  agent: {
    id: 'reviewer',
    capabilities: ['data-qa', 'bias-detection', 'methodology-review'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'validation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      analysis: { type: 'string' },
      methodology: { type: 'string' },
      data: { type: 'object' },
      conclusions: { type: 'array', items: { type: 'string' } },
    },
    required: ['analysis'],
  },
  output: {
    type: 'object',
    properties: {
      valid: { type: 'boolean' },
      issues: { type: 'array', items: { type: 'string' } },
      bias: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
  promptTemplate: `
Validate this data analysis before sharing:

Analysis:
{{analysis}}

{{#if methodology}}
Methodology: {{methodology}}
{{/if}}

{{#if data}}
Data: {{data}}
{{/if}}

{{#if conclusions}}
Conclusions: {{conclusions}}
{{/if}}

Provide validation in JSON format:
{
  "valid": true,
  "issues": ["Issue 1", "Issue 2"],
  "bias": ["Potential bias 1"],
  "recommendations": ["Fix 1", "Fix 2"],
  "confidence": 0.85
}
`,
  config: {
    temperature: 0.1,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['validation', 'qa', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 8. Write Query Skill
export const writeQuerySkill = defineSkill({
  id: '/write-query',
  name: 'Write Query',
  description: 'Write optimized SQL for your dialect with best practices',
  category: 'data',
  agent: {
    id: 'database',
    capabilities: ['sql-generation', 'optimization'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic', 'deepseek'],
    fallback: true,
    taskType: 'sql-generation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      need: { type: 'string' },
      dialect: { type: 'string', default: 'postgres' },
      tables: { type: 'array', items: { type: 'string' } },
      optimize: { type: 'boolean', default: true },
    },
    required: ['need'],
  },
  output: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      explanation: { type: 'string' },
      indexes: { type: 'array', items: { type: 'string' } },
      performance: { type: 'string' },
    },
  },
  promptTemplate: `
Write optimized {{dialect}} SQL for: {{need}}

{{#if tables}}
Tables: {{tables}}
{{/if}}

{{#if optimize}}
Optimize for performance.
{{/if}}

Provide in JSON format:
{
  "query": "SELECT ...",
  "explanation": "What this does",
  "indexes": ["Suggested index 1"],
  "performance": "Expected performance"
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
    tags: ['sql', 'query', 'optimization', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 9. Data Context Extractor Skill
export const dataContextSkill = defineSkill({
  id: '/data-context-extractor',
  name: 'Data Context Extractor',
  description: 'Extract company-specific data knowledge for better analysis',
  category: 'data',
  agent: {
    id: 'backend',
    capabilities: ['knowledge-extraction', 'schema-understanding'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'knowledge-extraction',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      schemas: { type: 'object' },
      queries: { type: 'array', items: { type: 'string' } },
      domain: { type: 'string' },
    },
    required: ['schemas'],
  },
  output: {
    type: 'object',
    properties: {
      tables: { type: 'object' },
      metrics: { type: 'object' },
      terminology: { type: 'object' },
      commonQueries: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Extract data context from these schemas for domain: {{domain}}

Schemas:
{{schemas}}

{{#if queries}}
Sample queries:
{{#each queries}}
- {{this}}
{{/each}}
{{/if}}

Provide context in JSON format:
{
  "tables": {"table_name": "Description"},
  "metrics": {"metric_name": "Definition"},
  "terminology": {"term": "Definition"},
  "commonQueries": ["Query pattern 1"]
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
    tags: ['data-context', 'knowledge', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
});

// 10. Data Visualization Skill
export const dataVizSkill = defineSkill({
  id: '/data-visualization',
  name: 'Data Visualization',
  description: 'Create effective data visualizations with best practices',
  category: 'data',
  agent: {
    id: 'frontend',
    capabilities: ['visualization', 'design', 'accessibility'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'visualization',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      data: { type: 'object' },
      goal: { type: 'string' },
      audience: { type: 'string' },
      constraints: { type: 'array', items: { type: 'string' } },
    },
    required: ['data'],
  },
  output: {
    type: 'object',
    properties: {
      chartType: { type: 'string' },
      rationale: { type: 'string' },
      design: { type: 'object' },
      code: { type: 'string' },
      accessibility: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Design a visualization for this data.

Goal: {{goal}}

{{#if audience}}
Audience: {{audience}}
{{/if}}

Data:
{{data}}

{{#if constraints}}
Constraints: {{constraints}}
{{/if}}

Provide in JSON format:
{
  "chartType": "bar",
  "rationale": "Why this chart type",
  "design": {"color": "blue", "layout": "vertical"},
  "code": "Implementation code",
  "accessibility": ["Alt text", "Color contrast"]
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
    tags: ['visualization', 'design', 'data'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// Export all data skills
export const dataSkills = [
  sqlQueriesSkill,
  exploreDataSkill,
  buildDashboardSkill,
  analyzeDataSkill,
  createVizSkill,
  statisticalAnalysisSkill,
  validateDataSkill,
  writeQuerySkill,
  dataContextSkill,
  dataVizSkill,
];

// Register all skills
export function registerDataSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of dataSkills) {
    registry.register(skill);
  }
}
