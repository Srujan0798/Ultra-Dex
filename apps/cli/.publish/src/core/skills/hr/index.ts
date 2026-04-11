/**
 * HR Skills
 * Employee management, recruitment, performance reviews, and HR compliance
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

export const hrSkills: SkillDefinition[] = [
  defineSkill({
    id: '/recruitment-plan',
    name: 'Recruitment Plan',
    description: 'Create comprehensive recruitment plans for open positions',
    category: 'hr',
    agent: { id: 'recruitment-specialist', capabilities: ['recruitment', 'hiring'] },
    config: {
      temperature: 0.1,
      maxTokens: 3000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['openai', 'anthropic'],
      taskType: 'planning',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are an HR recruitment specialist creating a recruitment plan.

Position: {{position}}
Department: {{department}}
Experience Level: {{level}}
Budget: {{budget}}

Create a comprehensive recruitment plan including:
- Job description
- Sourcing strategy
- Interview process
- Timeline
- Budget allocation
- Success metrics

Return JSON with:
- jobDescription: Detailed job description
- sourcing: Array of sourcing channels
- interviewProcess: Array of interview stages
- timeline: Recruitment timeline
- budget: Budget breakdown
- metrics: Array of success metrics`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['hr', 'recruitment', 'hiring'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/performance-review',
    name: 'Performance Review',
    description: 'Conduct employee performance reviews and provide feedback',
    category: 'hr',
    agent: { id: 'performance-manager', capabilities: ['performance', 'feedback'] },
    config: {
      temperature: 0.1,
      maxTokens: 2500,
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
    promptTemplate: `You are conducting an employee performance review.

Employee: {{employee}}
Role: {{role}}
Period: {{period}}
Goals: {{goals}}
Achievements: {{achievements}}
Areas for Improvement: {{improvements}}

Provide a comprehensive performance review including:
- Overall rating
- Strengths
- Development areas
- Specific feedback
- Goals for next period

Return JSON with:
- rating: Overall rating (1-5)
- strengths: Array of strengths
- developmentAreas: Array of improvement areas
- feedback: Detailed feedback
- nextGoals: Array of goals for next period`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['hr', 'performance', 'reviews'],
    },
    governance: {
      requiresApproval: true,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),

  defineSkill({
    id: '/compensation-analysis',
    name: 'Compensation Analysis',
    description: 'Analyze compensation packages against market benchmarks',
    category: 'hr',
    agent: { id: 'compensation-analyst', capabilities: ['compensation', 'analysis'] },
    config: {
      temperature: 0.1,
      maxTokens: 3500,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic'],
      taskType: 'analysis',
      complexity: 'high',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a compensation analyst reviewing compensation packages.

Position: {{position}}
Location: {{location}}
Experience: {{experience}}
Current Package: {{currentPackage}}
Market Data: {{marketData}}

Analyze the compensation package against market benchmarks:
- Base salary comparison
- Bonus structure
- Equity/stock options
- Benefits package
- Total compensation value

Return JSON with:
- marketComparison: Market vs current comparison
- recommendations: Array of compensation recommendations
- totalValue: Total compensation analysis
- competitivePosition: Competitive positioning
- adjustmentNeeded: Whether adjustments are needed`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['hr', 'compensation', 'analysis'],
    },
    governance: {
      requiresApproval: true,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),

  defineSkill({
    id: '/employee-onboarding',
    name: 'Employee Onboarding',
    description: 'Create comprehensive onboarding plans for new employees',
    category: 'hr',
    agent: { id: 'onboarding-specialist', capabilities: ['onboarding', 'training'] },
    config: {
      temperature: 0.1,
      maxTokens: 2800,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['openai', 'anthropic'],
      taskType: 'planning',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are creating an employee onboarding plan.

Role: {{role}}
Department: {{department}}
Experience Level: {{level}}
Company Culture: {{culture}}

Create a comprehensive onboarding plan including:
- First week schedule
- Training modules
- Mentor assignment
- Department introductions
- Company orientation
- Progress checkpoints

Return JSON with:
- schedule: First week schedule
- training: Array of training modules
- mentors: Mentor assignment
- introductions: Array of key introductions
- orientation: Company orientation plan
- checkpoints: Progress checkpoints`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['hr', 'onboarding', 'training'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'internal',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/hr-policy-review',
    name: 'HR Policy Review',
    description: 'Review HR policies for compliance and effectiveness',
    category: 'hr',
    agent: { id: 'hr-compliance', capabilities: ['compliance', 'policy'] },
    config: {
      temperature: 0.1,
      maxTokens: 4000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic'],
      taskType: 'compliance',
      complexity: 'high',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are reviewing HR policies for compliance and effectiveness.

Policy: {{policy}}
Industry: {{industry}}
Jurisdiction: {{jurisdiction}}
Company Size: {{size}}

Review the policy for:
- Legal compliance
- Industry best practices
- Effectiveness
- Potential risks
- Improvement opportunities

Return JSON with:
- complianceStatus: Compliance assessment
- risks: Array of identified risks
- recommendations: Array of improvement suggestions
- bestPractices: Industry best practices
- effectiveness: Policy effectiveness rating`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['hr', 'policy', 'compliance'],
    },
    governance: {
      requiresApproval: true,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),
];

export function registerHrSkills(registry: any): void {
  hrSkills.forEach((skill) => registry.register(skill));
}

export default hrSkills;
