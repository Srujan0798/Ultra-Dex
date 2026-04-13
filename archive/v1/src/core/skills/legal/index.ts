/**
 * Legal Skills
 * Contract review, compliance, legal research, and regulatory analysis
 */

import { defineSkill } from '../framework.js';
import { SkillDefinition } from '../types.js';

export const legalSkills: SkillDefinition[] = [
  defineSkill({
    id: '/contract-review',
    name: 'Contract Review',
    description: 'Review contracts for legal compliance, risks, and terms',
    category: 'legal',
    agent: { id: 'legal-reviewer', capabilities: ['legal-analysis', 'contract-review'] },
    config: {
      temperature: 0.1,
      maxTokens: 4000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic', 'openai'],
      taskType: 'legal-analysis',
      complexity: 'high',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a legal expert reviewing a contract. Analyze the following contract text and provide a structured review.

Contract:
{{contract}}

Focus areas:
- Legal compliance
- Risk assessment  
- Ambiguous terms
- Unfavorable clauses
- Recommendations

Return JSON with:
- summary: Brief overview
- risks: Array of identified risks
- recommendations: Array of improvement suggestions
- complianceStatus: 'compliant' | 'needs-review' | 'non-compliant'
- redFlags: Array of critical issues`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['legal', 'contracts'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),

  defineSkill({
    id: '/compliance-check',
    name: 'Compliance Check',
    description: 'Check business operations against regulatory requirements',
    category: 'legal',
    agent: { id: 'compliance-officer', capabilities: ['compliance', 'regulatory'] },
    config: {
      temperature: 0.1,
      maxTokens: 3000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic', 'openai'],
      taskType: 'compliance',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a compliance officer checking business operations against regulations.

Operation: {{operation}}
Regulations: {{regulations}}
Industry: {{industry}}

Check for compliance with:
- Data privacy regulations
- Industry-specific requirements
- Consumer protection laws
- Employment regulations

Return JSON with:
- complianceStatus: 'compliant' | 'needs-review' | 'non-compliant'
- violations: Array of potential violations
- recommendations: Array of compliance actions
- riskLevel: 'low' | 'medium' | 'high'
- nextSteps: Array of required actions`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['legal', 'compliance'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),

  defineSkill({
    id: '/legal-research',
    name: 'Legal Research',
    description: 'Research legal precedents, case law, and regulations',
    category: 'legal',
    agent: { id: 'legal-researcher', capabilities: ['research', 'legal-analysis'] },
    config: {
      temperature: 0.1,
      maxTokens: 5000,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic'],
      taskType: 'research',
      complexity: 'high',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a legal researcher conducting research on a specific legal topic.

Topic: {{topic}}
Jurisdiction: {{jurisdiction}}
Specific Questions: {{questions}}

Research and provide:
- Relevant case law
- Applicable regulations
- Legal precedents
- Key arguments
- Potential implications

Return JSON with:
- summary: Research overview
- cases: Array of relevant cases
- regulations: Array of applicable laws
- arguments: Array of legal arguments
- implications: Potential consequences
- citations: Legal citations`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['legal', 'research'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'public',
      auditLevel: 'basic',
    },
  }),

  defineSkill({
    id: '/nda-review',
    name: 'NDA Review',
    description: 'Review Non-Disclosure Agreements for confidentiality terms',
    category: 'legal',
    agent: { id: 'contract-reviewer', capabilities: ['contract-analysis', 'confidentiality'] },
    config: {
      temperature: 0.1,
      maxTokens: 2500,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic', 'openai'],
      taskType: 'contract-analysis',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are reviewing a Non-Disclosure Agreement (NDA). Analyze the confidentiality terms and obligations.

NDA Text:
{{ndaText}}

Focus on:
- Confidentiality scope
- Exclusions
- Term and termination
- Remedies and liabilities
- Jurisdiction

Return JSON with:
- summary: NDA overview
- scope: Confidentiality scope analysis
- risks: Array of potential risks
- recommendations: Array of improvement suggestions
- compliance: Compliance assessment`,
    memory: {
      storeInput: false,
      storeOutput: true,
      searchable: true,
      tags: ['legal', 'nda', 'confidentiality'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'confidential',
      auditLevel: 'full',
    },
  }),

  defineSkill({
    id: '/regulatory-update',
    name: 'Regulatory Update',
    description: 'Provide updates on regulatory changes affecting the business',
    category: 'legal',
    agent: { id: 'regulatory-analyst', capabilities: ['regulatory', 'analysis'] },
    config: {
      temperature: 0.1,
      maxTokens: 3500,
      responseFormat: 'json',
    },
    routing: {
      providerPriority: ['anthropic'],
      taskType: 'analysis',
      complexity: 'medium',
      fallback: true,
    },
    input: {},
    output: {},
    promptTemplate: `You are a regulatory analyst providing updates on regulatory changes.

Industry: {{industry}}
Jurisdiction: {{jurisdiction}}
Recent Changes: {{changes}}

Provide:
- Summary of regulatory changes
- Impact assessment
- Compliance requirements
- Timeline for implementation
- Recommended actions

Return JSON with:
- updates: Array of regulatory updates
- impact: Impact assessment
- complianceRequirements: Array of requirements
- timeline: Implementation timeline
- actions: Recommended actions`,
    memory: {
      storeInput: true,
      storeOutput: true,
      searchable: true,
      tags: ['legal', 'regulatory', 'updates'],
    },
    governance: {
      requiresApproval: false,
      dataClassification: 'public',
      auditLevel: 'basic',
    },
  }),
];

export function registerLegalSkills(registry: any): void {
  legalSkills.forEach((skill) => registry.register(skill));
}

export default legalSkills;
