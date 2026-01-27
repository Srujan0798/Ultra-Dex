/**
 * Prompt templates for ultra-dex generate command
 * Generates a full 34-section implementation plan from an idea
 */

export const SYSTEM_PROMPT = `You are an expert SaaS architect and product strategist. Your job is to take a simple product idea and generate a complete, production-ready implementation plan.

You MUST output a complete plan covering all 34 sections of the Ultra-Dex framework. Each section must be actionable and specific - no generic placeholders.

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

export function generateUserPrompt(idea) {
  return USER_PROMPT_TEMPLATE.replace('{{IDEA}}', idea);
}

export default {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  generateUserPrompt,
};
