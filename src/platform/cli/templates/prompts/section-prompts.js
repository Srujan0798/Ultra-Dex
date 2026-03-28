// Copyright (c) 2026 Ultra-Dex

/**
 * Section Prompts for 34-Section Implementation Plan Generation
 * These prompts guide the AI to generate each section properly
 */

export const SECTION_STRUCTURE = `
## SECTION 1: HIGH-LEVEL SUMMARY
### 1.1 Product Vision (One-liner)
### 1.2 Problem Statement
### 1.3 Solution Overview
### 1.4 Target Market
### 1.5 Unique Value Proposition
### 1.6 Success Metrics (Key)

## SECTION 2: CORE FEATURES
### 2.1 Feature List (Priority-Ordered)
### 2.2 Feature Details
### 2.3 MVP Scope
### 2.4 Post-MVP Features

## SECTION 3: USER STORIES
### 3.1 User Journey Maps
### 3.2 User Stories by Role
### 3.3 Acceptance Criteria

## SECTION 4: USER PERSONAS
### 4.1 Primary Persona
### 4.2 Secondary Personas
### 4.3 Anti-Personas

## SECTION 5: COMPETITIVE ANALYSIS
### 5.1 Direct Competitors
### 5.2 Indirect Competitors
### 5.3 Differentiators
### 5.4 SWOT Analysis

## SECTION 6: SCREEN MAP
### 6.1 Information Architecture
### 6.2 Navigation Structure
### 6.3 Key Screens List
### 6.4 User Flows

## SECTION 7: WIREFRAMES
### 7.1 Low-Fidelity Wireframes
### 7.2 Key Screen Descriptions
### 7.3 Interaction Notes

## SECTION 8: DESIGN SYSTEM
### 8.1 Color Palette
### 8.2 Typography
### 8.3 Component Library
### 8.4 Accessibility Guidelines

## SECTION 9: UI/UX SPECIFICATIONS
### 9.1 Design Principles
### 9.2 Responsive Breakpoints
### 9.3 Animation Guidelines
### 9.4 Form Patterns

## SECTION 10: DATA MODEL
### 10.1 Entity Relationship Diagram
### 10.2 Database Schema
### 10.3 Indexes and Constraints
### 10.4 Data Migrations Strategy

## SECTION 11: API BLUEPRINT
### 11.1 API Architecture
### 11.2 Endpoint Documentation
### 11.3 Authentication Flow
### 11.4 Rate Limiting

## SECTION 12: SYSTEM ARCHITECTURE
### 12.1 High-Level Architecture
### 12.2 Component Diagram
### 12.3 Data Flow
### 12.4 Third-Party Integrations

## SECTION 13: AUTHENTICATION & AUTHORIZATION
### 13.1 Auth Strategy
### 13.2 Role-Based Access Control
### 13.3 Session Management
### 13.4 OAuth Providers

## SECTION 14: PAYMENT INTEGRATION
### 14.1 Payment Provider
### 14.2 Pricing Plans
### 14.3 Subscription Management
### 14.4 Billing Workflows

## SECTION 15: TECH STACK
### 15.1 Frontend
### 15.2 Backend
### 15.3 Database
### 15.4 Infrastructure
### 15.5 Development Tools

## SECTION 16: IMPLEMENTATION PLAN
### 16.1 Phase Breakdown
### 16.2 Sprint Planning
### 16.3 Task Breakdown (Atomic Tasks)
### 16.4 Dependencies

## SECTION 17: TIMELINE
### 17.1 Milestone Schedule
### 17.2 Critical Path
### 17.3 Buffer Time

## SECTION 18: RISK ASSESSMENT
### 18.1 Technical Risks
### 18.2 Business Risks
### 18.3 Mitigation Strategies

## SECTION 19: DEPLOYMENT PLAN
### 19.1 Environment Setup
### 19.2 CI/CD Pipeline
### 19.3 Deployment Checklist
### 19.4 Rollback Strategy

## SECTION 20: TESTING STRATEGY
### 20.1 Testing Pyramid
### 20.2 Unit Tests
### 20.3 Integration Tests
### 20.4 E2E Tests
### 20.5 Coverage Targets

## SECTION 21: SECURITY GUIDELINES
### 21.1 Security Checklist
### 21.2 OWASP Considerations
### 21.3 Data Protection
### 21.4 Vulnerability Scanning

## SECTION 22: PERFORMANCE REQUIREMENTS
### 22.1 Performance Targets
### 22.2 Caching Strategy
### 22.3 Database Optimization
### 22.4 CDN Configuration

## SECTION 23: MONITORING & LOGGING
### 23.1 Logging Strategy
### 23.2 Monitoring Tools
### 23.3 Alerting Rules
### 23.4 Dashboards

## SECTION 24: MAINTENANCE PLAN
### 24.1 Update Schedule
### 24.2 Dependency Management
### 24.3 Technical Debt Tracking

## SECTION 25: DOCUMENTATION
### 25.1 Code Documentation
### 25.2 API Documentation
### 25.3 User Documentation
### 25.4 Runbooks

## SECTION 26: ANALYTICS
### 26.1 Analytics Strategy
### 26.2 Key Metrics
### 26.3 Tracking Implementation
### 26.4 Reporting

## SECTION 27: ERROR HANDLING
### 27.1 Error Strategy
### 27.2 User-Facing Errors
### 27.3 System Errors
### 27.4 Error Recovery

## SECTION 28: LEGAL & COMPLIANCE
### 28.1 Privacy Policy
### 28.2 Terms of Service
### 28.3 GDPR Compliance
### 28.4 Data Retention

## SECTION 29: SEO
### 29.1 SEO Strategy
### 29.2 Meta Tags
### 29.3 Sitemap
### 29.4 Structured Data

## SECTION 30: INTERNATIONALIZATION
### 30.1 i18n Strategy
### 30.2 Supported Languages
### 30.3 Localization Workflow

## SECTION 31: ACCESSIBILITY
### 31.1 WCAG Compliance Level
### 31.2 Accessibility Checklist
### 31.3 Testing Tools

## SECTION 32: FEATURE FLAGS
### 32.1 Feature Flag Strategy
### 32.2 Flag Categories
### 32.3 Rollout Process

## SECTION 33: AI/ML INTEGRATION
### 33.1 AI Features (if applicable)
### 33.2 Model Selection
### 33.3 Training Data
### 33.4 Fallback Strategy

## SECTION 34: FUTURE ROADMAP
### 34.1 Version 2.0 Features
### 34.2 Long-term Vision
### 34.3 Scalability Plan
`;

export const USER_PROMPT_TEMPLATE = `
Generate a complete Ultra-Dex implementation plan for the following idea:

**IDEA:** {{IDEA}}

## Requirements

1. Fill out ALL 34 sections completely - no shortcuts
2. Be specific to this exact product idea
3. Use the default tech stack unless the idea requires something different:
   - Frontend: Next.js 15 + TypeScript + Tailwind CSS
   - Backend: Next.js API Routes + Prisma ORM
   - Database: PostgreSQL
   - Auth: NextAuth.js
   - Payments: Stripe
   - Hosting: Vercel
4. Break down implementation into 4-9 hour atomic tasks
5. Include realistic time estimates with +20% buffer
6. Add code examples for database schema, API endpoints, and key components

## Output Format

Start with a header:

\`\`\`
═══════════════════════════════════════════════════════════════
PROJECT: [Derived project name]
GENERATED: [Current date]
IDEA: {{IDEA}}
═══════════════════════════════════════════════════════════════
\`\`\`

Then output all 34 sections following this structure:

${SECTION_STRUCTURE}

Be thorough, specific, and production-ready. This plan should be immediately actionable by a development team.
`;

export const QUICK_START_PROMPT = `
Based on the implementation plan you just generated, create a concise QUICK-START.md file that:

1. Summarizes the idea in 2 sentences
2. Lists the top 3 problems solved
3. Shows the 5 core features (priority ordered)
4. Displays the tech stack in a table
5. Lists the first 3 tasks to get started

Keep it under 50 lines. Make it scannable.
`;

export const CONTEXT_PROMPT = `
Based on the implementation plan, create a CONTEXT.md file for AI agents that includes:

1. Project Overview (name, status, current focus)
2. Quick Summary (what it does, for whom)
3. Key Technical Decisions (stack choices)
4. Current Phase (what's being built now)
5. Links to resources

This file will be used to give AI coding agents context about the project.
Keep it under 40 lines.
`;

export default {
  SECTION_STRUCTURE,
  USER_PROMPT_TEMPLATE,
  QUICK_START_PROMPT,
  CONTEXT_PROMPT,
};

/**
 * Error handler for section-prompts
 * @param {Error} error - Error to handle
 */
function handleSectionpromptsError(error) {
  try {
    logger.error('[section-prompts]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
