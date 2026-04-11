/**
 * Enterprise Search Skills for Ultra-Dex
 * 5 Claude Enterprise Search plugin skills
 */

import { defineSkill } from '../framework.js';

// 1. Document Search Skill
export const documentSearchSkill = defineSkill({
  id: '/document-search',
  name: 'Document Search',
  description: 'Search across enterprise documents and repositories',
  category: 'engineering',
  agent: {
    id: 'search-agent',
    capabilities: ['search', 'document-retrieval', 'enterprise-search'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'search',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      repositories: {
        type: 'array',
        items: { type: 'string' },
        description: 'Repositories to search',
      },
    },
    required: ['query'],
  },
  output: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            snippet: { type: 'string' },
            url: { type: 'string' },
            relevance: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Search enterprise documents for: {{query}}

{{#if repositories}}
Repositories:
{{#each repositories}}
- {{this}}
{{/each}}
{{/if}}

Provide search results in JSON format:
{
  "results": [
    {
      "title": "Document Title",
      "snippet": "Relevant snippet",
      "url": "document-url",
      "relevance": 0.95
    }
  ],
  "summary": "Summary of findings"
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
    tags: ['search', 'documents', 'enterprise'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['github', 'confluence'],
});

// 2. Code Search Skill
export const codeSearchSkill = defineSkill({
  id: '/code-search',
  name: 'Code Search',
  description: 'Search for code patterns across enterprise codebases',
  category: 'engineering',
  agent: {
    id: 'search-agent',
    capabilities: ['code-search', 'pattern-matching', 'enterprise-search'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'search',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Code pattern to search for' },
      fileTypes: { type: 'array', items: { type: 'string' }, description: 'File types to search' },
    },
    required: ['pattern'],
  },
  output: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            line: { type: 'number' },
            code: { type: 'string' },
            context: { type: 'string' },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Search for code pattern: {{pattern}}

{{#if fileTypes}}
File types:
{{#each fileTypes}}
- {{this}}
{{/each}}
{{/if}}

Provide code search results in JSON format:
{
  "matches": [
    {
      "file": "filename.js",
      "line": 42,
      "code": "found code snippet",
      "context": "surrounding context"
    }
  ],
  "summary": "Summary of matches"
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
    tags: ['search', 'code', 'enterprise'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'code',
  },
  connectors: ['github'],
});

// 3. Knowledge Base Search Skill
export const knowledgeBaseSearchSkill = defineSkill({
  id: '/knowledge-base-search',
  name: 'Knowledge Base Search',
  description: 'Search internal knowledge bases and documentation',
  category: 'engineering',
  agent: {
    id: 'search-agent',
    capabilities: ['knowledge-search', 'documentation', 'enterprise-search'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'search',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      sources: { type: 'array', items: { type: 'string' }, description: 'Knowledge base sources' },
    },
    required: ['query'],
  },
  output: {
    type: 'object',
    properties: {
      articles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            source: { type: 'string' },
            relevance: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Search knowledge base for: {{query}}

{{#if sources}}
Sources:
{{#each sources}}
- {{this}}
{{/each}}
{{/if}}

Provide knowledge base results in JSON format:
{
  "articles": [
    {
      "title": "Article Title",
      "content": "Relevant content",
      "source": "knowledge-base",
      "relevance": 0.95
    }
  ],
  "summary": "Summary of findings"
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
    tags: ['search', 'knowledge', 'enterprise'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'confluence'],
});

// 4. People Search Skill
export const peopleSearchSkill = defineSkill({
  id: '/people-search',
  name: 'People Search',
  description: 'Search for people and expertise within the organization',
  category: 'engineering',
  agent: {
    id: 'search-agent',
    capabilities: ['people-search', 'expertise-finding', 'enterprise-search'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'search',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name or expertise to search for' },
      department: { type: 'string', description: 'Department filter' },
    },
    required: ['name'],
  },
  output: {
    type: 'object',
    properties: {
      people: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            department: { type: 'string' },
            expertise: { type: 'array', items: { type: 'string' } },
            contact: { type: 'string' },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Search for people/expertise: {{name}}

{{#if department}}
Department: {{department}}
{{/if}}

Provide people search results in JSON format:
{
  "people": [
    {
      "name": "Person Name",
      "title": "Job Title",
      "department": "Department",
      "expertise": ["Skill 1", "Skill 2"],
      "contact": "email@company.com"
    }
  ],
  "summary": "Summary of matches"
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
    tags: ['search', 'people', 'enterprise'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['slack', 'hr-system'],
});

// 5. Semantic Search Skill
export const semanticSearchSkill = defineSkill({
  id: '/semantic-search',
  name: 'Semantic Search',
  description: 'Semantic search across enterprise content using AI',
  category: 'engineering',
  agent: {
    id: 'search-agent',
    capabilities: ['semantic-search', 'ai-search', 'enterprise-search'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'search',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Semantic search query' },
      similarityThreshold: { type: 'number', description: 'Similarity threshold for results' },
    },
    required: ['query'],
  },
  output: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            similarity: { type: 'number', minimum: 0, maximum: 1 },
            source: { type: 'string' },
            context: { type: 'string' },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Perform semantic search for: {{query}}

{{#if similarityThreshold}}
Similarity threshold: {{similarityThreshold}}
{{/if}}

Provide semantic search results in JSON format:
{
  "results": [
    {
      "content": "Relevant content",
      "similarity": 0.95,
      "source": "document-source",
      "context": "surrounding context"
    }
  ],
  "summary": "Summary of semantic matches"
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
    tags: ['search', 'semantic', 'enterprise'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['vector-database', 'document-store'],
});

// Export all enterprise search skills
export const enterpriseSearchSkills = [
  documentSearchSkill,
  codeSearchSkill,
  knowledgeBaseSearchSkill,
  peopleSearchSkill,
  semanticSearchSkill,
];

// Register all skills
export function registerEnterpriseSearchSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of enterpriseSearchSkills) {
    registry.register(skill);
  }
}
