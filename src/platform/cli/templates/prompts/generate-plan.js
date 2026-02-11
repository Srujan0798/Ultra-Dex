// Copyright (c) 2026 Ultra-Dex

/**
 * Prompt templates for ultra-dex generate command
 * Generates implementation plans from an idea (LITE/FULL/ENTERPRISE)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../../');

const SYSTEM_PROMPT_BASE = `You are an expert SaaS architect and product strategist. Your job is to take a simple product idea and generate a complete, production-ready implementation plan.

{{SECTION_REQUIREMENT}} Each section must be actionable and specific - no generic placeholders.

QUALITY STANDARDS:
- All acceptance criteria MUST be measurable (not "should work well" → use "<200ms response time")
- All estimates MUST include buffer (+20% for unknowns)
- All code examples MUST be production-ready (error handling, edge cases)
- All API endpoints MUST include request/response examples
- All database schemas MUST include indexes and constraints

SPECIFICITY RULES:
- Product Vision: ≤15 words, memorable
- Feature descriptions: User story + acceptance criteria + edge cases
- Task definitions: Single responsibility, testable completion
- Time estimates: 4-9 hours per atomic task

OUTPUT FORMAT:
- Use markdown with proper headers (## Section X: Title)
- Use tables for structured data
- Use code blocks with language tags
- Use checkboxes (- [ ]) for action items`;

function buildSystemPrompt(sectionRequirement) {
  return SYSTEM_PROMPT_BASE.replace('{{SECTION_REQUIREMENT}}', sectionRequirement);
}

export const SYSTEM_PROMPT = buildSystemPrompt(
  'You MUST output a complete plan covering all 34 sections of the Ultra-Dex FULL framework.'
);

export const SYSTEM_PROMPT_LITE = buildSystemPrompt(
  'You MUST output a complete plan covering all 12 sections of the Ultra-Dex LITE framework.'
);

export const SYSTEM_PROMPT_ENTERPRISE = buildSystemPrompt(
  'You MUST output a complete plan covering all 50+ sections of the Ultra-Dex ENTERPRISE framework.'
);

export const USER_PROMPT_TEMPLATE = `Generate a complete Ultra-Dex implementation plan for this idea:

**IDEA:** {{IDEA}}

Generate ALL 34 sections with specific, actionable content:

## SECTION 1: HIGH-LEVEL SUMMARY
### 1.1 Product Vision (One-liner)
### 1.2 Problem Statement
### 1.3 Solution Overview
### 1.4 Target Market
### 1.5 Unique Value Proposition
### 1.6 Success Metrics

## SECTION 2: CORE FEATURES
### 2.1 Core Production Features (P0)
### 2.2 Enhanced Features (P1)
### 2.3 Future Features (P2/P3)

## SECTION 3: PRODUCT DESCRIPTION

## SECTION 4: USER PERSONAS
(Include 2-3 detailed personas with goals, frustrations, tech comfort)

## SECTION 5: USER JOURNEYS
(Map key user flows with touchpoints)

## SECTION 6: SCREEN MAP
(List all screens/pages with purpose)

## SECTION 7: WIREFRAMES DESCRIPTION
(Describe layout for key screens)

## SECTION 8: NAVIGATION STRUCTURE

## SECTION 9: UI/UX SPECIFICATIONS
(Design tokens, component library choice, accessibility requirements)

## SECTION 10: DATA MODEL
(Complete database schema with Prisma syntax, indexes, relationships)

## SECTION 11: API BLUEPRINT
(REST endpoints with methods, request/response examples)

## SECTION 12: SYSTEM ARCHITECTURE
(Monolith/microservices decision, component diagram)

## SECTION 13: THIRD-PARTY INTEGRATIONS
(APIs, services with specific providers)

## SECTION 14: AUTHENTICATION & AUTHORIZATION
(Auth flow, RBAC, session management - be specific about provider)

## SECTION 15: TECH STACK
(Frontend, backend, database, hosting - with specific versions)

## SECTION 16: IMPLEMENTATION PLAN
(Atomic tasks with 4-9 hour estimates, dependencies)

## SECTION 17: MILESTONES & TIMELINE
(Sprint breakdown with deliverables)

## SECTION 18: RISK ASSESSMENT
(Technical and business risks with mitigations)

## SECTION 19: DEPLOYMENT PLAN
(CI/CD, environments, rollback strategy)

## SECTION 20: TESTING STRATEGY
(Unit, integration, E2E approach with coverage targets)

## SECTION 21: SECURITY GUIDELINES
(OWASP top 10 mitigations, data protection)

## SECTION 22: PERFORMANCE REQUIREMENTS
(Response times, concurrent users, optimization strategy)

## SECTION 23: MONITORING & LOGGING
(Observability stack, alerts, dashboards)

## SECTION 24: DOCUMENTATION PLAN

## SECTION 25: MAINTENANCE PLAN

## SECTION 26: COST ESTIMATION
(Infrastructure, API costs with specific pricing)

## SECTION 27: ERROR HANDLING
(Error codes, user messaging, recovery flows)

## SECTION 28: LEGAL & COMPLIANCE
(Privacy policy, ToS, GDPR considerations)

## SECTION 29: SEO STRATEGY

## SECTION 30: INTERNATIONALIZATION

## SECTION 31: FEATURE FLAGS

## SECTION 32: REAL-TIME FEATURES
(WebSocket/SSE architecture if needed)

## SECTION 33: AI/ML FEATURES
(If applicable)

## SECTION 34: SUPPORT SYSTEM
(Help docs, feedback collection)

Be thorough and specific. This plan will be used directly for implementation.`;

export const LITE_USER_PROMPT_TEMPLATE = `Generate a LITE (12-section) Ultra-Dex implementation plan for this idea:

**IDEA:** {{IDEA}}

Generate ALL 12 sections with specific, actionable content:

## SECTION 1: HIGH-LEVEL SUMMARY
### 1.1 Product Vision (One-liner)
### 1.2 Problem Statement
### 1.3 Solution Overview
### 1.4 Target Market
### 1.5 Unique Value Proposition

## SECTION 2: CORE FEATURES
### 2.1 MVP Features (Max 5)
### 2.2 Out of Scope (v1)

## SECTION 3: USER PERSONAS
(Primary persona with goals and pain points)

## SECTION 4: USER FLOWS
(Core flow with steps + success criteria)

## SECTION 5: SCREEN MAP
(Key screens + navigation structure)

## SECTION 6: TECH STACK
(Frontend, backend, database, auth, hosting)

## SECTION 7: DATA MODEL
(Core entities and relationships)

## SECTION 8: API BLUEPRINT
(Key endpoints with request/response)

## SECTION 9: IMPLEMENTATION PLAN
(Atomic tasks with estimates)

## SECTION 10: DEPLOYMENT
(Environments, CI/CD, rollout)

## SECTION 11: SECURITY
(Auth, data protection, OWASP basics)

## SECTION 12: 21-STEP VERIFICATION
(Checklist for QA and launch readiness)

Be concise but specific. This plan should be MVP-ready.`;

export const ENTERPRISE_USER_PROMPT_TEMPLATE = `Generate an ENTERPRISE (50+ section) Ultra-Dex implementation plan for this idea:

**IDEA:** {{IDEA}}

Generate ALL sections with specific, actionable content:

## SECTION 1: EXECUTIVE SUMMARY
## SECTION 2: STRATEGIC OBJECTIVES
## SECTION 3: MARKET ANALYSIS
## SECTION 4: CORE FEATURES
## SECTION 5: USER PERSONAS
## SECTION 6: USER FLOWS
## SECTION 7: SCREEN MAP
## SECTION 8: DESIGN SYSTEM
## SECTION 9: UI/UX SPECIFICATIONS
## SECTION 10: DATA MODEL
## SECTION 11: API ARCHITECTURE
## SECTION 12: SYSTEM ARCHITECTURE
## SECTION 13: AUTHENTICATION & AUTHORIZATION
## SECTION 14: INTEGRATION ARCHITECTURE
## SECTION 15: TECH STACK
## SECTION 16: IMPLEMENTATION PLAN
## SECTION 17: TESTING STRATEGY
## SECTION 18: DEPLOYMENT STRATEGY
## SECTION 19: MONITORING & OBSERVABILITY
## SECTION 20: SECURITY FRAMEWORK
## SECTION 21: PERFORMANCE REQUIREMENTS
## SECTION 22: SCALABILITY PLAN
## SECTION 23: MULTI-TENANCY
## SECTION 24: DATA GOVERNANCE
## SECTION 25: DISASTER RECOVERY
## SECTION 26: COST MANAGEMENT

## SECTION 27-50: ADDITIONAL ENTERPRISE SECTIONS
27. Change Management
28. Vendor Management
29. API Governance
30. Feature Flag Strategy
31. Documentation Standards
32. Training & Onboarding
33. Customer Support SLA
34. Incident Management
35. Business Continuity
36. Penetration Testing
37. Code Review Standards
38. Release Management
39. Configuration Management
40. Capacity Management
41. Service Level Agreements
42. IT Asset Management
43. Identity Governance
44. Network Security
45. Endpoint Protection
46. Audit & Compliance
47. Risk Management
48. Privacy Impact Assessment
49. Third-Party Risk
50. Continuous Improvement

Be thorough and specific. This plan is intended for large-scale enterprise delivery.`;

export const TEMPLATE_CHOICES = ['lite', 'full', 'enterprise'];

export function normalizeTemplate(input, fallback = 'full') {
  if (!input) return fallback;
  const normalized = input.toString().trim().toLowerCase();
  if (TEMPLATE_CHOICES.includes(normalized)) return normalized;
  if (['mvp', 'quick', 'small'].includes(normalized)) return 'lite';
  if (['ent', 'enterprise+', 'scale'].includes(normalized)) return 'enterprise';
  return null;
}

export function getSystemPrompt(template = 'full') {
  const normalized = normalizeTemplate(template);
  if (normalized === 'lite') return SYSTEM_PROMPT_LITE;
  if (normalized === 'enterprise') return SYSTEM_PROMPT_ENTERPRISE;
  return SYSTEM_PROMPT;
}

export function generateUserPrompt(idea, template = 'full') {
  const normalized = normalizeTemplate(template);
  const promptTemplate =
    normalized === 'lite'
      ? LITE_USER_PROMPT_TEMPLATE
      : normalized === 'enterprise'
        ? ENTERPRISE_USER_PROMPT_TEMPLATE
        : USER_PROMPT_TEMPLATE;
  const basePrompt = promptTemplate.replace('{{IDEA}}', idea);
  const featureSnippets = getFeatureSnippets(idea);
  return basePrompt + featureSnippets;
}

function getFeatureSnippets(idea) {
  if (!idea) return '';
  const lower = idea.toLowerCase();
  const snippets = [];

  if (/(revenue|billing|subscription|stripe)/.test(lower)) {
    const stripeTemplate = loadTemplateSnippet('templates/features/stripe-billing.ts');
    if (stripeTemplate) {
      snippets.push(`### Stripe Billing Reference\n\`\`\`ts\n${stripeTemplate.trim()}\n\`\`\`\n`);
    }
  }

  if (/(analytics|tracking|posthog|metrics)/.test(lower)) {
    const analyticsTemplate = loadTemplateSnippet('templates/features/analytics-posthog.ts');
    if (analyticsTemplate) {
      snippets.push(
        `### Analytics Reference (PostHog)\n\`\`\`ts\n${analyticsTemplate.trim()}\n\`\`\`\n`
      );
    }
  }

  if (!snippets.length) return '';

  return `\n\n## FEATURE TEMPLATES (REFERENCE)\n${snippets.join('\n')}`;
}

function loadTemplateSnippet(relativePath) {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(repoRoot, relativePath),
  ];

  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate, 'utf8');
    } catch {
      continue;
    }
  }

  return '';
}

export default {
  SYSTEM_PROMPT,
  SYSTEM_PROMPT_LITE,
  SYSTEM_PROMPT_ENTERPRISE,
  USER_PROMPT_TEMPLATE,
  LITE_USER_PROMPT_TEMPLATE,
  ENTERPRISE_USER_PROMPT_TEMPLATE,
  TEMPLATE_CHOICES,
  normalizeTemplate,
  getSystemPrompt,
  generateUserPrompt,
};
