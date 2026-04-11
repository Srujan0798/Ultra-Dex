/**
 * PDF Viewer Skills for Ultra-Dex
 * 5 Claude PDF Viewer plugin skills
 */

import { defineSkill } from '../framework.js';

// 1. PDF Extract Text Skill
export const pdfExtractTextSkill = defineSkill({
  id: '/pdf-extract-text',
  name: 'PDF Extract Text',
  description: 'Extract text content from PDF documents',
  category: 'productivity',
  agent: {
    id: 'pdf-agent',
    capabilities: ['pdf-processing', 'text-extraction', 'document-analysis'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'document-processing',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pdfContent: { type: 'string', description: 'PDF content or URL' },
      pages: { type: 'array', items: { type: 'number' }, description: 'Specific pages to extract' },
    },
    required: ['pdfContent'],
  },
  output: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      pages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            content: { type: 'string' },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Extract text from PDF content:

{{pdfContent}}

{{#if pages}}
Extract from pages: {{pages}}
{{/if}}

Provide extracted text in JSON format:
{
  "text": "Full extracted text",
  "pages": [
    {
      "page": 1,
      "content": "Text from page 1"
    }
  ],
  "summary": "Summary of document content"
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
    tags: ['pdf', 'text-extraction', 'document'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 2. PDF Analyze Structure Skill
export const pdfAnalyzeStructureSkill = defineSkill({
  id: '/pdf-analyze-structure',
  name: 'PDF Analyze Structure',
  description: 'Analyze PDF document structure and layout',
  category: 'productivity',
  agent: {
    id: 'pdf-agent',
    capabilities: ['pdf-analysis', 'structure-detection', 'layout-analysis'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'document-analysis',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pdfContent: { type: 'string', description: 'PDF content or URL' },
      analyzeSections: { type: 'boolean', default: true },
    },
    required: ['pdfContent'],
  },
  output: {
    type: 'object',
    properties: {
      structure: {
        type: 'object',
        properties: {
          pages: { type: 'number' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                pages: { type: 'array', items: { type: 'number' } },
                type: { type: 'string' },
              },
            },
          },
          layout: { type: 'string' },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Analyze PDF structure:

{{pdfContent}}

{{#if analyzeSections}}
Analyze document sections and layout.
{{/if}}

Provide structure analysis in JSON format:
{
  "structure": {
    "pages": 10,
    "sections": [
      {
        "title": "Introduction",
        "pages": [1, 2],
        "type": "section"
      }
    ],
    "layout": "multi-column"
  },
  "summary": "Document structure summary"
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
    tags: ['pdf', 'structure', 'analysis'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 3. PDF Search Content Skill
export const pdfSearchContentSkill = defineSkill({
  id: '/pdf-search-content',
  name: 'PDF Search Content',
  description: 'Search for specific content within PDF documents',
  category: 'productivity',
  agent: {
    id: 'pdf-agent',
    capabilities: ['pdf-search', 'content-retrieval', 'document-search'],
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
      pdfContent: { type: 'string', description: 'PDF content or URL' },
      searchQuery: { type: 'string', description: 'Search query' },
      caseSensitive: { type: 'boolean', default: false },
    },
    required: ['pdfContent', 'searchQuery'],
  },
  output: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            text: { type: 'string' },
            context: { type: 'string' },
            relevance: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Search PDF content for: {{searchQuery}}

PDF Content:
{{pdfContent}}

{{#if caseSensitive}}
Case sensitive search.
{{/if}}

Provide search results in JSON format:
{
  "matches": [
    {
      "page": 5,
      "text": "found text",
      "context": "surrounding context",
      "relevance": 0.95
    }
  ],
  "summary": "Search results summary"
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
    tags: ['pdf', 'search', 'document'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 4. PDF Convert to Markdown Skill
export const pdfConvertToMarkdownSkill = defineSkill({
  id: '/pdf-convert-markdown',
  name: 'PDF Convert to Markdown',
  description: 'Convert PDF content to markdown format',
  category: 'productivity',
  agent: {
    id: 'pdf-agent',
    capabilities: ['pdf-conversion', 'markdown-generation', 'document-processing'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'conversion',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pdfContent: { type: 'string', description: 'PDF content or URL' },
      preserveFormatting: { type: 'boolean', default: true },
    },
    required: ['pdfContent'],
  },
  output: {
    type: 'object',
    properties: {
      markdown: { type: 'string' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            heading: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
      summary: { type: 'string' },
    },
  },
  promptTemplate: `
Convert PDF content to markdown:

{{pdfContent}}

{{#if preserveFormatting}}
Preserve formatting and structure.
{{/if}}

Provide converted content in JSON format:
{
  "markdown": "# Title\n\nContent",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content"
    }
  ],
  "summary": "Conversion summary"
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
    tags: ['pdf', 'conversion', 'markdown'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// 5. PDF Summarize Skill
export const pdfSummarizeSkill = defineSkill({
  id: '/pdf-summarize',
  name: 'PDF Summarize',
  description: 'Summarize PDF document content',
  category: 'productivity',
  agent: {
    id: 'pdf-agent',
    capabilities: ['pdf-summarization', 'document-analysis', 'content-summary'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'summarization',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pdfContent: { type: 'string', description: 'PDF content or URL' },
      summaryLength: { type: 'string', enum: ['short', 'medium', 'detailed'], default: 'medium' },
    },
    required: ['pdfContent'],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      wordCount: { type: 'number' },
    },
  },
  promptTemplate: `
Summarize PDF content:

{{pdfContent}}

Summary length: {{summaryLength}}

Provide summary in JSON format:
{
  "summary": "Document summary",
  "keyPoints": ["Key point 1", "Key point 2"],
  "wordCount": 250
}
`,
  config: {
    temperature: 0,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['pdf', 'summary', 'document'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
});

// Export all PDF Viewer skills
export const pdfViewerSkills = [
  pdfExtractTextSkill,
  pdfAnalyzeStructureSkill,
  pdfSearchContentSkill,
  pdfConvertToMarkdownSkill,
  pdfSummarizeSkill,
];

// Register all skills
export function registerPDFViewerSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of pdfViewerSkills) {
    registry.register(skill);
  }
}
