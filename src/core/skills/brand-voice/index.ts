/**
 * Brand Voice Skills
 * Brand identity, tone analysis, content alignment, and brand guidelines
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

export const brandVoiceSkills: SkillDefinition[] = [
  defineSkill({
    id: '/brand-analysis',
    name: 'Brand Analysis',
    description: 'Analyze brand voice and tone across different content types',
    category: 'marketing',
    agent: { id: 'brand-analyst', capabilities: ['brand-analysis', 'tone-analysis'] },
    config: {
      temperature: 0.1,
      maxTokens: 2800,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic', 'openai'],
      taskType: 'analysis',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a brand analyst analyzing brand voice and tone.

Brand: {{brand}}
Content Samples: {{samples}}
Target Audience: {{audience}}
Industry: {{industry}}

Analyze the brand voice across:
- Tone consistency
- Language style
- Emotional resonance
- Audience alignment
- Industry appropriateness

Return JSON with:
- toneProfile: Detailed tone analysis
- consistencyScore: Consistency rating (1-10)
- alignment: Audience alignment assessment
- recommendations: Array of improvement suggestions
- strengths: Array of brand voice strengths`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['brand', 'voice', 'analysis'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/tone-adjustment',
    name: 'Tone Adjustment',
    description: 'Adjust content tone to match brand voice guidelines',
    category: 'marketing',
    agent: { id: 'tone-editor', capabilities: ['editing', 'tone-adjustment'] },
    config: {
      temperature: 0.1,
      maxTokens: 2500,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['openai', 'anthropic'],
      taskType: 'editing',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a tone editor adjusting content to match brand voice.

Content: {{content}}
Brand Guidelines: {{guidelines}}
Desired Tone: {{tone}}
Target Audience: {{audience}}

Adjust the content tone to match brand guidelines:
- Language style
- Emotional tone
- Formality level
- Audience appropriateness
- Brand consistency

Return JSON with:
- adjustedContent: Tone-adjusted content
- changesMade: Array of specific changes
- toneAlignment: Alignment score (1-10)
- recommendations: Array of additional suggestions`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['brand', 'tone', 'editing'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/brand-guidelines',
    name: 'Brand Guidelines',
    description: 'Create comprehensive brand voice and tone guidelines',
    category: 'marketing',
    agent: { id: 'brand-strategist', capabilities: ['brand-strategy', 'guidelines'] },
    config: {
      temperature: 0.1,
      maxTokens: 4000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic'],
      taskType: 'strategy',
      complexity: 'high',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are creating comprehensive brand voice and tone guidelines.

Brand: {{brand}}
Mission: {{mission}}
Values: {{values}}
Target Audience: {{audience}}
Industry: {{industry}}

Create brand voice guidelines including:
- Core brand personality
- Tone variations by context
- Language dos and don'ts
- Examples and counter-examples
- Implementation guidelines

Return JSON with:
- personality: Core brand personality traits
- toneMatrix: Tone variations by context
- guidelines: Array of specific guidelines
- examples: Array of good/bad examples
- implementation: Implementation recommendations`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['brand', 'guidelines', 'strategy'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/content-alignment',
    name: 'Content Alignment',
    description: 'Check content alignment with brand voice guidelines',
    category: 'marketing',
    agent: { id: 'content-auditor', capabilities: ['content-audit', 'alignment'] },
    config: {
      temperature: 0.1,
      maxTokens: 3000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic', 'openai'],
      taskType: 'audit',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are auditing content for brand voice alignment.

Content: {{content}}
Brand Guidelines: {{guidelines}}
Content Type: {{type}}
Target Audience: {{audience}}

Audit the content for:
- Brand voice consistency
- Tone appropriateness
- Language alignment
- Audience resonance
- Guideline compliance

Return JSON with:
- alignmentScore: Overall alignment score (1-10)
- issues: Array of alignment issues
- strengths: Array of well-aligned elements
- recommendations: Array of improvement suggestions
- compliance: Guideline compliance assessment`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['brand', 'alignment', 'audit'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/voice-training',
    name: 'Voice Training',
    description: 'Train content creators on brand voice and tone',
    category: 'marketing',
    agent: { id: 'voice-trainer', capabilities: ['training', 'education'] },
    config: {
      temperature: 0.1,
      maxTokens: 3500,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['openai', 'anthropic'],
      taskType: 'education',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are creating brand voice training materials.

Brand Guidelines: {{guidelines}}
Team Experience: {{experience}}
Training Goals: {{goals}}
Format: {{format}}

Create training materials including:
- Brand voice fundamentals
- Practical examples
- Common mistakes
- Practice exercises
- Assessment criteria

Return JSON with:
- curriculum: Training curriculum outline
- examples: Array of practical examples
- exercises: Array of practice exercises
- assessment: Assessment criteria
- resources: Additional resources`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['brand', 'training', 'education'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),
];

export function registerBrandVoiceSkills(registry: any): void {
  brandVoiceSkills.forEach((skill) => registry.register(skill));
}

export default brandVoiceSkills;
