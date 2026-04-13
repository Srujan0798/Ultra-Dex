/**
 * Sales Skills for Ultra-Dex
 * 9 Claude Sales plugin skills
 */

import { defineSkill } from '../framework.js';

// 1. Account Research Skill
export const accountResearchSkill = defineSkill({
  id: '/account-research',
  name: 'Account Research',
  description: 'Research a company or person and get actionable sales intel',
  category: 'sales',
  agent: {
    id: 'sales-researcher',
    capabilities: ['research', 'prospecting', 'company-analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'research',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      company: { type: 'string', description: 'Company name' },
      person: { type: 'string', description: 'Person name' },
      industry: { type: 'string' },
      size: { type: 'string', enum: ['startup', 'mid-market', 'enterprise'] },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      companyOverview: { type: 'string' },
      keyContacts: { type: 'array', items: { type: 'object' } },
      recentNews: { type: 'array', items: { type: 'string' } },
      techStack: { type: 'array', items: { type: 'string' } },
      painPoints: { type: 'array', items: { type: 'string' } },
      opportunities: { type: 'array', items: { type: 'string' } },
      recommendedApproach: { type: 'string' },
    },
  },
  promptTemplate: `
Research this prospect and provide actionable sales intel.

{{#if company}}
Company: {{company}}
{{/if}}

{{#if person}}
Person: {{person}}
{{/if}}

{{#if industry}}
Industry: {{industry}}
{{/if}}

{{#if size}}
Company Size: {{size}}
{{/if}}

Provide sales intel in JSON format:
{
  "companyOverview": "Company description and business model",
  "keyContacts": [{"name": "", "title": "", "role": ""}],
  "recentNews": ["News item 1", "News item 2"],
  "techStack": ["Technology 1", "Technology 2"],
  "painPoints": ["Pain point 1", "Pain point 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendedApproach": "How to approach this prospect"
}

Focus on actionable insights that help close deals.
`,
  config: {
    temperature: 0.2,
    maxTokens: 3000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['sales', 'research', 'prospecting'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['hubspot', 'clay', 'apollo', 'similarweb'],
});

// 2. Call Prep Skill
export const callPrepSkill = defineSkill({
  id: '/call-prep',
  name: 'Call Prep',
  description: 'Prepare for a sales call with account context and suggested agenda',
  category: 'sales',
  agent: {
    id: 'sales-strategist',
    capabilities: ['call-planning', 'discovery', 'agenda-creation'],
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
      company: { type: 'string' },
      attendees: { type: 'array', items: { type: 'string' } },
      meetingType: { type: 'string', enum: ['discovery', 'demo', 'negotiation', 'follow-up'] },
      previousInteractions: { type: 'string' },
      objectives: { type: 'array', items: { type: 'string' } },
    },
    required: ['company'],
  },
  output: {
    type: 'object',
    properties: {
      accountContext: { type: 'string' },
      attendeeProfiles: { type: 'array', items: { type: 'object' } },
      suggestedAgenda: { type: 'array', items: { type: 'string' } },
      discoveryQuestions: { type: 'array', items: { type: 'string' } },
      talkingPoints: { type: 'array', items: { type: 'string' } },
      objectionsToAddress: { type: 'array', items: { type: 'string' } },
      nextSteps: { type: 'string' },
    },
  },
  promptTemplate: `
Prepare me for a sales call with {{company}}.

Meeting Type: {{meetingType}}

{{#if attendees}}
Attendees:
{{#each attendees}}
- {{this}}
{{/each}}
{{/if}}

{{#if previousInteractions}}
Previous Interactions: {{previousInteractions}}
{{/if}}

{{#if objectives}}
Objectives:
{{#each objectives}}
- {{this}}
{{/each}}
{{/if}}

Provide call prep in JSON format:
{
  "accountContext": "Key account information",
  "attendeeProfiles": [{"name": "", "title": "", "background": ""}],
  "suggestedAgenda": ["Agenda item 1", "Agenda item 2"],
  "discoveryQuestions": ["Question 1", "Question 2"],
  "talkingPoints": ["Point 1", "Point 2"],
  "objectionsToAddress": ["Objection 1", "Objection 2"],
  "nextSteps": "Recommended next steps"
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
    tags: ['sales', 'call-prep', 'meeting'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['hubspot', 'clay', 'fireflies', 'zoom'],
});

// 3. Call Summary Skill
export const callSummarySkill = defineSkill({
  id: '/call-summary',
  name: 'Call Summary',
  description: 'Process call notes or transcript — extract action items, draft follow-up',
  category: 'sales',
  agent: {
    id: 'sales-operations',
    capabilities: ['summarization', 'action-extraction', 'follow-up'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'summarization',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      transcript: { type: 'string' },
      notes: { type: 'string' },
      meetingType: { type: 'string', enum: ['discovery', 'demo', 'negotiation'] },
      attendees: { type: 'array', items: { type: 'string' } },
      company: { type: 'string' },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      actionItems: { type: 'array', items: { type: 'object' } },
      followUpEmail: { type: 'string' },
      internalSummary: { type: 'string' },
      objectionsRaised: { type: 'array', items: { type: 'string' } },
      nextSteps: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Process this call {{#if transcript}}transcript{{else}}notes{{/if}} and extract key information.

{{#if transcript}}
Transcript:
{{transcript}}
{{/if}}

{{#if notes}}
Notes:
{{notes}}
{{/if}}

{{#if meetingType}}
Meeting Type: {{meetingType}}
{{/if}}

{{#if company}}
Company: {{company}}
{{/if}}

{{#if attendees}}
Attendees: {{attendees}}
{{/if}}

Provide summary in JSON format:
{
  "summary": "Executive summary",
  "keyPoints": ["Point 1", "Point 2"],
  "actionItems": [{"task": "", "owner": "", "due": ""}],
  "followUpEmail": "Draft follow-up email",
  "internalSummary": "Internal team summary",
  "objectionsRaised": ["Objection 1", "Objection 2"],
  "nextSteps": ["Step 1", "Step 2"]
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
    tags: ['sales', 'call-summary', 'follow-up'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'full',
    dataClassification: 'internal',
  },
  connectors: ['fireflies', 'zoom', 'hubspot', 'gmail'],
});

// 4. Competitive Intelligence Skill
export const competitiveIntelligenceSkill = defineSkill({
  id: '/competitive-intelligence',
  name: 'Competitive Intelligence',
  description: 'Research competitors and build an interactive battlecard',
  category: 'sales',
  agent: {
    id: 'market-researcher',
    capabilities: ['competitive-analysis', 'battlecard-creation'],
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
      competitor: { type: 'string' },
      industry: { type: 'string' },
      ourProduct: { type: 'string' },
    },
    required: ['competitor'],
  },
  output: {
    type: 'object',
    properties: {
      competitorOverview: { type: 'string' },
      strengths: { type: 'array', items: { type: 'string' } },
      weaknesses: { type: 'array', items: { type: 'string' } },
      ourAdvantages: { type: 'array', items: { type: 'string' } },
      talkTracks: { type: 'array', items: { type: 'object' } },
      recentNews: { type: 'array', items: { type: 'string' } },
      pricingIntel: { type: 'string' },
      htmlBattlecard: { type: 'string' },
    },
  },
  promptTemplate: `
Create a competitive battlecard for {{competitor}}.

{{#if industry}}
Industry: {{industry}}
{{/if}}

{{#if ourProduct}}
Our Product: {{ourProduct}}
{{/if}}

Provide battlecard in JSON format:
{
  "competitorOverview": "Competitor description",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "ourAdvantages": ["Advantage 1", "Advantage 2"],
  "talkTracks": [{"situation": "", "response": ""}],
  "recentNews": ["News 1", "News 2"],
  "pricingIntel": "Pricing information",
  "htmlBattlecard": "HTML artifact"
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
    tags: ['sales', 'competitive', 'battlecard'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['similarweb', 'clay', 'notion'],
});

// 5. Create Asset Skill
export const createAssetSkill = defineSkill({
  id: '/create-an-asset',
  name: 'Create Sales Asset',
  description: 'Generate tailored sales assets (landing pages, decks, one-pagers)',
  category: 'sales',
  agent: {
    id: 'content-creator',
    capabilities: ['asset-design', 'content-generation'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'content-creation',
    complexity: 'high',
  },
  input: {
    type: 'object',
    properties: {
      assetType: { type: 'string', enum: ['landing-page', 'deck', 'one-pager', 'demo', 'email'] },
      prospect: { type: 'string' },
      audience: { type: 'string' },
      goal: { type: 'string' },
      keyMessages: { type: 'array', items: { type: 'string' } },
    },
    required: ['assetType'],
  },
  output: {
    type: 'object',
    properties: {
      assetType: { type: 'string' },
      content: { type: 'string' },
      headline: { type: 'string' },
      keyPoints: { type: 'array', items: { type: 'string' } },
      callToAction: { type: 'string' },
      filePath: { type: 'string' },
    },
  },
  promptTemplate: `
Create a {{assetType}} for this deal context.

{{#if prospect}}
Prospect: {{prospect}}
{{/if}}

{{#if audience}}
Target Audience: {{audience}}
{{/if}}

{{#if goal}}
Goal: {{goal}}
{{/if}}

{{#if keyMessages}}
Key Messages:
{{#each keyMessages}}
- {{this}}
{{/each}}
{{/if}}

Provide asset in JSON format:
{
  "assetType": "{{assetType}}",
  "headline": "Compelling headline",
  "content": "Full content",
  "keyPoints": ["Point 1", "Point 2"],
  "callToAction": "Clear CTA",
  "filePath": "asset.html"
}
`,
  config: {
    temperature: 0.3,
    maxTokens: 4000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['sales', 'assets', 'content'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['notion', 'google-calendar'],
});

// 6. Daily Briefing Skill
export const dailyBriefingSkill = defineSkill({
  id: '/daily-briefing',
  name: 'Daily Briefing',
  description: 'Start your day with a prioritized sales briefing',
  category: 'sales',
  agent: {
    id: 'sales-operations',
    capabilities: ['prioritization', 'briefing', 'alerting'],
  },
  routing: {
    providerPriority: ['openai', 'anthropic'],
    fallback: true,
    taskType: 'briefing',
    complexity: 'low',
  },
  input: {
    type: 'object',
    properties: {
      meetings: { type: 'array', items: { type: 'string' } },
      priorities: { type: 'array', items: { type: 'string' } },
      date: { type: 'string' },
    },
  },
  output: {
    type: 'object',
    properties: {
      todayMeetings: { type: 'array', items: { type: 'object' } },
      topPriorities: { type: 'array', items: { type: 'string' } },
      urgentDeals: { type: 'array', items: { type: 'object' } },
      followUps: { type: 'array', items: { type: 'string' } },
      pipelineAlerts: { type: 'array', items: { type: 'string' } },
      suggestedActions: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Generate a daily sales briefing.

{{#if date}}
Date: {{date}}
{{/if}}

{{#if meetings}}
Today's Meetings:
{{#each meetings}}
- {{this}}
{{/each}}
{{/if}}

{{#if priorities}}
Priorities:
{{#each priorities}}
- {{this}}
{{/each}}
{{/if}}

Provide briefing in JSON format:
{
  "todayMeetings": [{"time": "", "company": "", "prep": ""}],
  "topPriorities": ["Priority 1", "Priority 2"],
  "urgentDeals": [{"deal": "", "action": ""}],
  "followUps": ["Follow-up 1", "Follow-up 2"],
  "pipelineAlerts": ["Alert 1", "Alert 2"],
  "suggestedActions": ["Action 1", "Action 2"]
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
    tags: ['sales', 'briefing', 'daily'],
    searchable: true,
  },
  governance: {
    requiresApproval: false,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['hubspot', 'google-calendar', 'gmail', 'slack'],
});

// 7. Draft Outreach Skill
export const draftOutreachSkill = defineSkill({
  id: '/draft-outreach',
  name: 'Draft Outreach',
  description: 'Research a prospect then draft personalized outreach',
  category: 'sales',
  agent: {
    id: 'sales-writer',
    capabilities: ['outreach', 'personalization', 'copywriting'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'outreach',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      prospectName: { type: 'string' },
      company: { type: 'string' },
      title: { type: 'string' },
      outreachType: { type: 'string', enum: ['email', 'linkedin', 'phone'] },
      trigger: { type: 'string' },
      valueProp: { type: 'string' },
    },
    required: ['prospectName'],
  },
  output: {
    type: 'object',
    properties: {
      research: { type: 'string' },
      subjectLine: { type: 'string' },
      body: { type: 'string' },
      hook: { type: 'string' },
      cta: { type: 'string' },
      personalization: { type: 'string' },
      alternatives: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Draft personalized outreach to {{prospectName}} at {{company}}.

{{#if title}}
Title: {{title}}
{{/if}}

Outreach Type: {{outreachType}}

{{#if trigger}}
Trigger Event: {{trigger}}
{{/if}}

{{#if valueProp}}
Value Proposition: {{valueProp}}
{{/if}}

Provide outreach in JSON format:
{
  "research": "Key prospect insights",
  "subjectLine": "Compelling subject",
  "body": "Full message",
  "hook": "Opening hook",
  "cta": "Call to action",
  "personalization": "Personalization notes",
  "alternatives": ["Alt subject 1", "Alt subject 2"]
}

Keep it concise, personalized, and focused on value.
`,
  config: {
    temperature: 0.4,
    maxTokens: 2000,
    responseFormat: 'json',
  },
  memory: {
    storeInput: true,
    storeOutput: true,
    tags: ['sales', 'outreach', 'email'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'basic',
    dataClassification: 'internal',
  },
  connectors: ['clay', 'apollo', 'outreach', 'gmail'],
});

// 8. Forecast Skill
export const forecastSkill = defineSkill({
  id: '/forecast',
  name: 'Forecast',
  description: 'Generate weighted sales forecast with scenarios and gap analysis',
  category: 'sales',
  agent: {
    id: 'sales-analyst',
    capabilities: ['forecasting', 'analytics', 'pipeline-analysis'],
  },
  routing: {
    providerPriority: ['anthropic', 'openai'],
    fallback: true,
    taskType: 'forecasting',
    complexity: 'medium',
  },
  input: {
    type: 'object',
    properties: {
      pipeline: { type: 'array', items: { type: 'object' } },
      quota: { type: 'number' },
      period: { type: 'string' },
      historicalData: { type: 'object' },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      bestCase: { type: 'number' },
      likely: { type: 'number' },
      worstCase: { type: 'number' },
      commit: { type: 'number' },
      upside: { type: 'number' },
      gapToQuota: { type: 'number' },
      coverage: { type: 'number' },
      risks: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Generate a sales forecast.

{{#if quota}}
Quota: ${{ quota }}
{{/if}}

{{#if period}}
Period: {{period}}
{{/if}}

{{#if pipeline}}
Pipeline Data:
{{pipeline}}
{{/if}}

{{#if historicalData}}
Historical Data:
{{historicalData}}
{{/if}}

Provide forecast in JSON format:
{
  "bestCase": 150000,
  "likely": 120000,
  "worstCase": 90000,
  "commit": 100000,
  "upside": 50000,
  "gapToQuota": -20000,
  "coverage": 3.5,
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Rec 1", "Rec 2"]
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
    tags: ['sales', 'forecast', 'analytics'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['hubspot', 'close'],
});

// 9. Pipeline Review Skill
export const pipelineReviewSkill = defineSkill({
  id: '/pipeline-review',
  name: 'Pipeline Review',
  description: 'Analyze pipeline health — prioritize deals, flag risks, get action plan',
  category: 'sales',
  agent: {
    id: 'pipeline-manager',
    capabilities: ['pipeline-analysis', 'risk-detection', 'prioritization'],
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
      deals: { type: 'array', items: { type: 'object' } },
      stages: { type: 'array', items: { type: 'string' } },
      reviewPeriod: { type: 'string' },
      focus: { type: 'string', enum: ['stale', 'single-threaded', 'hygiene', 'coverage'] },
    },
    required: [],
  },
  output: {
    type: 'object',
    properties: {
      pipelineHealth: { type: 'string' },
      priorityDeals: { type: 'array', items: { type: 'object' } },
      flaggedRisks: { type: 'array', items: { type: 'object' } },
      staleDeals: { type: 'array', items: { type: 'object' } },
      hygieneIssues: { type: 'array', items: { type: 'object' } },
      weeklyActionPlan: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  },
  promptTemplate: `
Analyze this sales pipeline.

{{#if deals}}
Deals:
{{deals}}
{{/if}}

{{#if stages}}
Stages: {{stages}}
{{/if}}

{{#if reviewPeriod}}
Review Period: {{reviewPeriod}}
{{/if}}

{{#if focus}}
Focus: {{focus}}
{{/if}}

Provide analysis in JSON format:
{
  "pipelineHealth": "Healthy|At Risk|Critical",
  "priorityDeals": [{"name": "", "value": 0, "action": ""}],
  "flaggedRisks": [{"deal": "", "risk": "", "mitigation": ""}],
  "staleDeals": [{"deal": "", "days": 0}],
  "hygieneIssues": [{"issue": "", "deal": ""}],
  "weeklyActionPlan": ["Action 1", "Action 2"],
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
    tags: ['sales', 'pipeline', 'review'],
    searchable: true,
  },
  governance: {
    requiresApproval: true,
    auditLevel: 'full',
    dataClassification: 'confidential',
  },
  connectors: ['hubspot', 'close', 'clay', 'notion'],
});

// Export all sales skills
export const salesSkills = [
  accountResearchSkill,
  callPrepSkill,
  callSummarySkill,
  competitiveIntelligenceSkill,
  createAssetSkill,
  dailyBriefingSkill,
  draftOutreachSkill,
  forecastSkill,
  pipelineReviewSkill,
];

// Register all skills
export function registerSalesSkills(registry: { register: (skill: any) => void }): void {
  for (const skill of salesSkills) {
    registry.register(skill);
  }
}

// Sales connectors list for reference
export const salesConnectors = [
  'hubspot',
  'close',
  'clay',
  'zoom',
  'info',
  'notion',
  'atlassian',
  'fireflies',
  'ms365',
  'apollo',
  'outreach',
  'google-calendar',
  'gmail',
  'similarweb',
];
