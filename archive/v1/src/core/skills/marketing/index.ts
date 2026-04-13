/**
 * Marketing Skills for Ultra-Dex
 * 8 Claude Marketing plugin skills
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
Execute the marketing skill: {{skillName}}

Input: {{input}}

Provide a complete marketing solution with:
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
      tags: ['marketing'],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'basic' as const,
      dataClassification: 'internal' as const,
    },
  });
}

// 1. Brand Review Skill
export const brandReviewSkill = createSkill({
  id: '/brand-review',
  name: 'Brand Review',
  description: 'Review content against your brand voice, style guide, and messaging pillars',
  category: 'marketing',
  agent: {
    id: 'brand-reviewer',
    capabilities: ['brand-voice', 'style-guide', 'messaging-consistency'],
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
      content: { type: 'string', description: 'Content to review' },
      brandGuidelines: { type: 'string', description: 'Brand guidelines' },
      targetAudience: { type: 'string', description: 'Target audience' },
      channel: { type: 'string', enum: ['blog', 'social', 'email', 'website'] },
    },
    required: ['content'],
  },
  connectors: ['slack', 'canva', 'figma', 'hubspot', 'notion'],
});

// 2. Campaign Plan Skill
export const campaignPlanSkill = createSkill({
  id: '/campaign-plan',
  name: 'Campaign Plan',
  description:
    'Generate a full campaign brief with objectives, audience, messaging, channel strategy, content calendar, and success metrics',
  category: 'marketing',
  agent: {
    id: 'campaign-planner',
    capabilities: ['campaign-planning', 'channel-strategy', 'content-calendar'],
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
      goal: { type: 'string', description: 'Campaign goal' },
      audience: { type: 'string', description: 'Target audience' },
      budget: { type: 'number', description: 'Campaign budget' },
      timeframe: { type: 'string', description: 'Campaign timeframe' },
      channels: { type: 'array', items: { type: 'string' }, description: 'Marketing channels' },
    },
    required: ['goal', 'audience'],
  },
  connectors: ['slack', 'canva', 'figma', 'hubspot', 'amplitude', 'notion'],
});

// 3. Content Gap Analysis Skill
export const contentGapAnalysisSkill = createSkill({
  id: '/content-gap-analysis',
  name: 'Content Gap Analysis',
  description: 'Analyze content gaps and opportunities compared to competitors',
  category: 'marketing',
  agent: {
    id: 'content-analyst',
    capabilities: ['content-analysis', 'gap-identification', 'opportunity-mapping'],
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
      competitors: { type: 'array', items: { type: 'string' }, description: 'Competitor names' },
      contentAreas: {
        type: 'array',
        items: { type: 'string' },
        description: 'Content areas to analyze',
      },
      keywords: { type: 'array', items: { type: 'string' }, description: 'Focus keywords' },
    },
    required: ['competitors', 'contentAreas'],
  },
  connectors: ['slack', 'canva', 'figma', 'hubspot', 'ahrefs', 'similarweb'],
});

// 4. Content Creation Skill
export const contentCreationSkill = createSkill({
  id: '/content-creation',
  name: 'Content Creation',
  description:
    'Draft marketing content across channels — blog posts, social media, email newsletters, landing pages, press releases, and case studies',
  category: 'marketing',
  agent: {
    id: 'content-creator',
    capabilities: ['content-creation', 'multi-channel', 'seo-optimization'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'content-creation',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Content topic' },
      channel: {
        type: 'string',
        enum: ['blog', 'social', 'email', 'landing-page', 'press-release', 'case-study'],
      },
      audience: { type: 'string', description: 'Target audience' },
      tone: { type: 'string', enum: ['formal', 'casual', 'professional', 'conversational'] },
    },
    required: ['topic', 'channel'],
  },
  connectors: ['slack', 'canva', 'figma', 'hubspot', 'klaviyo'],
});

// 5. Draft Content Skill
export const draftContentSkill = createSkill({
  id: '/draft-content',
  name: 'Draft Content',
  description:
    'Draft blog posts, social media, email newsletters, landing pages, press releases, and case studies with channel-specific formatting and SEO recommendations',
  category: 'marketing',
  agent: {
    id: 'content-drafter',
    capabilities: ['content-drafting', 'seo-optimization', 'channel-formatting'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'content-drafting',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Content topic' },
      channel: {
        type: 'string',
        enum: ['blog', 'social', 'email', 'landing-page', 'press-release', 'case-study'],
      },
      audience: { type: 'string', description: 'Target audience' },
      tone: { type: 'string', enum: ['formal', 'casual', 'professional', 'conversational'] },
    },
    required: ['topic', 'channel'],
  },
  connectors: ['slack', 'canva', 'figma', 'hubspot', 'klaviyo'],
});

// 6. Email Sequence Skill
export const emailSequenceSkill = createSkill({
  id: '/email-sequence',
  name: 'Email Sequence',
  description:
    'Design and draft multi-email sequences with full copy, timing, branching logic, exit conditions, and performance benchmarks',
  category: 'marketing',
  agent: {
    id: 'email-planner',
    capabilities: ['email-sequence', 'drip-campaigns', 'performance-benchmarking'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'email-planning',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      purpose: { type: 'string', description: 'Sequence purpose (onboarding, nurture, etc.)' },
      audience: { type: 'string', description: 'Target audience' },
      goal: { type: 'string', description: 'Sequence goal' },
      emails: { type: 'number', description: 'Number of emails in sequence' },
    },
    required: ['purpose', 'audience'],
  },
  connectors: ['slack', 'hubspot', 'klaviyo', 'google-calendar', 'gmail'],
});

// 7. Performance Report Skill
export const performanceReportSkill = createSkill({
  id: '/performance-report',
  name: 'Performance Report',
  description:
    'Build a marketing performance report with key metrics, trend analysis, wins and misses, and prioritized optimization recommendations',
  category: 'marketing',
  agent: {
    id: 'performance-analyst',
    capabilities: ['performance-analysis', 'reporting', 'optimization-recommendations'],
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
      period: { type: 'string', description: 'Reporting period (weekly, monthly, quarterly)' },
      channels: { type: 'array', items: { type: 'string' }, description: 'Channels to report on' },
      metrics: { type: 'object', description: 'Key performance metrics' },
      goals: { type: 'object', description: 'Campaign goals' },
    },
    required: ['period'],
  },
  connectors: ['slack', 'amplitude', 'supermetrics', 'google-calendar', 'gmail'],
});

// 8. SEO Audit Skill
export const seoAuditSkill = createSkill({
  id: '/seo-audit',
  name: 'SEO Audit',
  description:
    'Run a comprehensive SEO audit — keyword research, on-page analysis, content gaps, technical checks, and competitor comparison',
  category: 'marketing',
  agent: {
    id: 'seo-auditor',
    capabilities: ['seo-audit', 'keyword-research', 'technical-seo'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'seo-analysis',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      website: { type: 'string', description: 'Website URL' },
      competitors: { type: 'array', items: { type: 'string' }, description: 'Competitor websites' },
      focusKeywords: { type: 'array', items: { type: 'string' }, description: 'Focus keywords' },
      auditScope: { type: 'string', enum: ['quick', 'comprehensive'] },
    },
    required: ['website'],
  },
  connectors: ['slack', 'ahrefs', 'similarweb', 'google-calendar', 'gmail'],
});

// Export all skills
export const marketingSkills: SkillDefinition[] = [
  brandReviewSkill,
  campaignPlanSkill,
  contentGapAnalysisSkill,
  contentCreationSkill,
  draftContentSkill,
  emailSequenceSkill,
  performanceReportSkill,
  seoAuditSkill,
];

// Register function
export function registerMarketingSkills(registry?: any): void {
  marketingSkills.forEach((skill) => {
    if (registry && registry.register) {
      registry.register(skill);
    }
  });
}
