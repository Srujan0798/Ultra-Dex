# Ultra-Dex CLI Tool Implementation

## Overview

The Ultra-Dex CLI tool is a command-line interface built using Commander.js that helps users initialize and plan SaaS projects. [4-cite-0](#4-cite-0)

## Commands

The CLI provides two main commands:

1. **`init`** - Initializes a new Ultra-Dex project
2. **`examples`** - Lists available example projects [4-cite-1](#4-cite-1)

## User Inputs Collected

The `init` command collects the following information through interactive prompts using inquirer:

1. **Project name** - Name of the SaaS project
2. **Idea description** (ideaWhat) - What you're building (1 sentence)
3. **Target audience** (ideaFor) - Who it's for
4. **Three problems** being solved (problem1, problem2, problem3)
5. **Most important MVP feature** (feature1)
6. **Frontend framework** - Choice from: Next.js, Remix, SvelteKit, Nuxt, Other
7. **Database** - Choice from: PostgreSQL, Supabase, MongoDB, PlanetScale, Other
8. **Authentication** - Choice from: NextAuth, Clerk, Auth0, Supabase Auth, Other
9. **Payments** - Choice from: Stripe, Lemonsqueezy, Paddle, None (free), Other
10. **Hosting** - Choice from: Vercel, Railway, Fly.io, AWS, Other [4-cite-2](#4-cite-2)

## Markdown Files Generated

The CLI creates **three markdown files** in the project directory:

### 1. QUICK-START.md

This file uses a template that includes:

- Project name and idea summary
- The problem (3 bullets)
- MVP features table with priorities
- Tech stack table
- First 3 tasks checklist [4-cite-3](#4-cite-3)

### 2. CONTEXT.md

This file contains:

- Project overview with name, start date, and status
- Quick summary of the idea
- Key technical decisions (frontend, database, auth, payments, hosting)
- Current focus
- Resource links [4-cite-4](#4-cite-4)

### 3. IMPLEMENTATION-PLAN.md

This file provides:

- Project overview
- Next steps guide
- Resource links to the full template, examples, and methodology [4-cite-5](#4-cite-5)

## File Generation Process

The CLI:

1. Creates the output directory structure with a `docs` subdirectory
2. Replaces placeholders (e.g., `{{PROJECT_NAME}}`, `{{DATE}}`, `{{FRONTEND}}`) with user inputs
3. Writes the three markdown files to the project directory
4. Displays success messages and next steps [4-cite-6](#4-cite-6)

---

# AGENT-INSTRUCTIONS.md Structure

The AGENT-INSTRUCTIONS.md file defines **7 agent types** as manual prompts for AI agents to use with the Ultra-Dex framework. [4-cite-7](#4-cite-7)

## The 7 Agent Types

### 1. Planner Agent (Section 1)

**Purpose:** Generate complete implementation plans from raw ideas

**Key Rules:**

- Use the Ultra-Dex Implementation Template structure
- Fill all 24 sections completely
- Break features into atomic tasks (4-9 hours each)
- Include technical details: data models, API endpoints, components
- Define clear acceptance criteria
- Consider edge cases, error handling, security, performance, and accessibility [4-cite-8](#4-cite-8)

### 2. Coder Agent (Section 2)

**Purpose:** Implement tasks with production-quality code

**Key Rules:**

- Write clean, modular, maintainable code
- Follow project coding standards (Section 17.5)
- Include error handling for all edge cases
- No placeholder code
- Functions should be single-purpose (<30 lines)
- No hardcoded values, 'any' types, or console.log in production

**Pre-submission checklist:** Verify code follows style guide, handles edge cases, has error handling, and is ready for 21-step verification [4-cite-9](#4-cite-9)

### 3. Tester Agent (Section 3)

**Purpose:** Ensure quality through comprehensive testing

**Key Rules:**

- Write unit tests for all code (80%+ coverage target)
- Write integration tests for critical flows
- Think of edge cases the coder might have missed
- Verify error handling, security, accessibility, and performance

**Test Types:**

- Unit tests (Jest/Vitest)
- Integration tests (Supertest)
- E2E tests (Playwright)

**Test Scenarios:** Happy path, edge cases, error cases, security cases, performance cases [4-cite-10](#4-cite-10)

### 4. Reviewer Agent (Section 4)

**Purpose:** Code review and quality assurance

**Review Checklist covers:**

- Code quality (style guide, DRY, SRP, naming, no hardcoding)
- Security (no data exposure, input validation, SQL/XSS prevention, auth)
- Performance (no unnecessary re-renders, optimized queries, caching)
- Testing (unit tests, edge cases, 80%+ coverage)
- Documentation (comments, API docs, README)

**Output format:** Summary, critical issues, suggestions, praise, and approval status (APPROVED/CHANGES REQUESTED) [4-cite-11](#4-cite-11)

### 5. Full Implementation Prompt (Section 5)

**Purpose:** One-shot prompt to generate complete implementation from an idea

This is a template prompt that combines the implementation template with user's idea to generate all 24 sections with specific requirements including data models, API endpoints, components, atomic tasks, acceptance criteria, and security/performance/accessibility considerations. [4-cite-12](#4-cite-12)

### 6. Task Execution Prompt (Section 6)

**Purpose:** Execute a single task with 21-step verification

This prompt guides through all 21 steps of the Ultra-Dex framework:

1. Understand → 2. Assumptions → 3. Analyze → 4. Decompose → 5. Prepare → 6. Implement → 7. Document → 8. Unit Test → 9. Debug → 10. Integrate → 11. Validate → 12. UX Check → 13. Optimize → 14. Secure → 15. Refactor → 16. Error Handle → 17. Document API → 18. Version Control → 19. Build → 20. Deploy Ready → 21. Final Verify [4-cite-13](#4-cite-13)

### 7. Debug Prompt (Section 7)

**Purpose:** Debug issues with context

Requires context (project, task, expected/actual behavior, error), code, and follows a structured debugging methodology:

1. Analyze error/unexpected behavior
2. Identify root cause
3. Propose fix with explanation
4. Consider edge cases
5. Verify fix doesn't break functionality
6. Update tests if needed [4-cite-14](#4-cite-14)

## Quick Reference Table

The file includes a reference table showing which agent to use for which task:

- Generate implementation plan → Planner (#1 or #5)
- Write code for a task → Coder (#2 or #6)
- Write tests → Tester (#3)
- Review code → Reviewer (#4)
- Fix bugs → Coder (#7)
- Full implementation from idea → Planner (#5) [4-cite-15](#4-cite-15)

---

## Notes

- The CLI tool uses embedded templates rather than external files, making it self-contained and portable
- All markdown files use placeholder syntax (`{{VARIABLE}}`) that gets replaced with user input during generation
- The AGENT-INSTRUCTIONS.md file is designed for manual copy-paste into AI chat interfaces, not for automated agent orchestration
- The 21-step verification framework is a core principle referenced throughout all agent prompts
- The file emphasizes production-ready code with no placeholders, comprehensive testing, and quality assurance at every step

### Citations

**File:** cli/bin/ultra-dex.js (L1-14)

```javascript
#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();
```

**File:** cli/bin/ultra-dex.js (L40-82)

```javascript
const QUICK_START_TEMPLATE = `# {{PROJECT_NAME}} - Quick Start

## 1. Your Idea (2 sentences max)

**What:** {{IDEA_WHAT}}
**For whom:** {{IDEA_FOR}}

## 2. The Problem (3 bullets)

- {{PROBLEM_1}}
- {{PROBLEM_2}}
- {{PROBLEM_3}}

## 3. MVP Features (5 max)

| Feature | Priority | Why it's MVP? |
|---------|----------|---------------|
| {{FEATURE_1}} | P0 | |
| | P0 | |
| | P1 | |
| | P1 | |
| | P2 | |

## 4. Tech Stack

| Layer | Your Choice |
|-------|-------------|
| Frontend | {{FRONTEND}} |
| Database | {{DATABASE}} |
| Auth | {{AUTH}} |
| Payments | {{PAYMENTS}} |
| Hosting | {{HOSTING}} |

## 5. First 3 Tasks

1. [ ] Set up project with chosen stack
2. [ ] Implement core feature #1
3. [ ] Deploy to staging

---

**Next:** Fill out the full implementation plan using the Ultra-Dex template.
`;
```

**File:** cli/bin/ultra-dex.js (L84-107)

```javascript
const CONTEXT_TEMPLATE = `# {{PROJECT_NAME}} - Context

## Project Overview
**Name:** {{PROJECT_NAME}}
**Started:** {{DATE}}
**Status:** Planning

## Quick Summary
{{IDEA_WHAT}} for {{IDEA_FOR}}.

## Key Decisions
- Frontend: {{FRONTEND}}
- Database: {{DATABASE}}
- Auth: {{AUTH}}
- Payments: {{PAYMENTS}}
- Hosting: {{HOSTING}}

## Current Focus
Setting up the implementation plan.

## Resources
- [Ultra-Dex Template](https://github.com/Srujan0798/Ultra-Dex)
- [TaskFlow Example](https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
`;
```

**File:** cli/bin/ultra-dex.js (L109-112)

```javascript
program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('1.0.0');
```

**File:** cli/bin/ultra-dex.js (L124-198)

```javascript
const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'projectName',
    message: "What's your project name?",
    default: options.name || 'my-saas',
    validate: (input) => input.length > 0 || 'Project name is required',
  },
  {
    type: 'input',
    name: 'ideaWhat',
    message: 'What are you building? (1 sentence)',
    validate: (input) => input.length > 0 || 'Please describe your idea',
  },
  {
    type: 'input',
    name: 'ideaFor',
    message: 'Who is it for?',
    validate: (input) => input.length > 0 || 'Please specify your target users',
  },
  {
    type: 'input',
    name: 'problem1',
    message: "Problem #1 you're solving:",
    default: '',
  },
  {
    type: 'input',
    name: 'problem2',
    message: "Problem #2 you're solving:",
    default: '',
  },
  {
    type: 'input',
    name: 'problem3',
    message: "Problem #3 you're solving:",
    default: '',
  },
  {
    type: 'input',
    name: 'feature1',
    message: 'Most important MVP feature:',
    default: '',
  },
  {
    type: 'list',
    name: 'frontend',
    message: 'Frontend framework:',
    choices: ['Next.js', 'Remix', 'SvelteKit', 'Nuxt', 'Other'],
  },
  {
    type: 'list',
    name: 'database',
    message: 'Database:',
    choices: ['PostgreSQL', 'Supabase', 'MongoDB', 'PlanetScale', 'Other'],
  },
  {
    type: 'list',
    name: 'auth',
    message: 'Authentication:',
    choices: ['NextAuth', 'Clerk', 'Auth0', 'Supabase Auth', 'Other'],
  },
  {
    type: 'list',
    name: 'payments',
    message: 'Payments:',
    choices: ['Stripe', 'Lemonsqueezy', 'Paddle', 'None (free)', 'Other'],
  },
  {
    type: 'list',
    name: 'hosting',
    message: 'Hosting:',
    choices: ['Vercel', 'Railway', 'Fly.io', 'AWS', 'Other'],
  },
]);
```

**File:** cli/bin/ultra-dex.js (L203-236)

```javascript
const outputDir = path.resolve(options.dir, answers.projectName);

// Create directories
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.join(outputDir, 'docs'), { recursive: true });

// Replace placeholders
const replacements = {
  '{{PROJECT_NAME}}': answers.projectName,
  '{{DATE}}': new Date().toISOString().split('T')[0],
  '{{IDEA_WHAT}}': answers.ideaWhat,
  '{{IDEA_FOR}}': answers.ideaFor,
  '{{PROBLEM_1}}': answers.problem1 || 'Problem 1',
  '{{PROBLEM_2}}': answers.problem2 || 'Problem 2',
  '{{PROBLEM_3}}': answers.problem3 || 'Problem 3',
  '{{FEATURE_1}}': answers.feature1 || 'Core feature',
  '{{FRONTEND}}': answers.frontend,
  '{{DATABASE}}': answers.database,
  '{{AUTH}}': answers.auth,
  '{{PAYMENTS}}': answers.payments,
  '{{HOSTING}}': answers.hosting,
};

let quickStart = QUICK_START_TEMPLATE;
let context = CONTEXT_TEMPLATE;

for (const [key, value] of Object.entries(replacements)) {
  quickStart = quickStart.replace(new RegExp(key, 'g'), value);
  context = context.replace(new RegExp(key, 'g'), value);
}

// Write files
await fs.writeFile(path.join(outputDir, 'QUICK-START.md'), quickStart);
await fs.writeFile(path.join(outputDir, 'CONTEXT.md'), context);
```

**File:** cli/bin/ultra-dex.js (L239-263)

```javascript
const planContent = `# ${answers.projectName} - Implementation Plan

> Generated with Ultra-Dex CLI

## Overview

${answers.ideaWhat} for ${answers.ideaFor}.

---

## Next Steps

1. Open QUICK-START.md and complete the remaining sections
2. Copy sections from the full Ultra-Dex template as needed
3. Use the TaskFlow example as reference
4. Start building!

## Resources

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Imp%20Template.md)
- [TaskFlow Example](https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/METHODOLOGY.md)
`;

await fs.writeFile(path.join(outputDir, 'IMPLEMENTATION-PLAN.md'), planContent);
```

**File:** AGENT-INSTRUCTIONS.md (L1-10)

```markdown
# 🤖 ULTRA-DEX AGENT INSTRUCTIONS

> **System prompts for AI agents to use the Ultra-Dex framework**

---

## How to Use These Instructions

Copy the relevant prompt below and use it with your AI agent (Claude, GPT-4, Gemini, etc.) along with your idea and the Implementation Template.
```

**File:** AGENT-INSTRUCTIONS.md (L13-45)

```markdown
## 1. PLANNER AGENT

> For generating the complete implementation plan from an idea

### System Prompt:
```

You are an Ultra-Dex Planner Agent. Your role is to take a raw idea and generate a complete, production-ready implementation plan.

RULES:

1. Use the Ultra-Dex Implementation Template as your structure
2. Fill in ALL 24 sections completely - do not skip any
3. Be specific and actionable - no vagueness
4. Break features into atomic tasks (4-9 hours each)
5. Include technical details: data models, API endpoints, components
6. Define clear acceptance criteria for every feature
7. Consider edge cases and error handling
8. Include security, performance, and accessibility requirements

OUTPUT FORMAT:

- Follow the exact section numbering (1.1, 1.2, etc.)
- Use markdown tables where appropriate
- Include code examples for API requests/responses
- Provide ASCII diagrams for architecture and flows

QUALITY STANDARDS:

- Every task must be verifiable with the 21-step framework
- Estimates must be realistic (4-9 hours per task)
- Dependencies must be clearly mapped
- Critical path must be identified

When given an idea, generate the COMPLETE implementation plan.

```

```

**File:** AGENT-INSTRUCTIONS.md (L49-82)

```markdown
## 2. CODER AGENT

> For implementing tasks from the plan

### System Prompt:
```

You are an Ultra-Dex Coder Agent. Your role is to implement tasks from the implementation plan with production-quality code.

RULES:

1. Write clean, modular, maintainable code
2. Follow the project's coding standards (see Section 17.5)
3. Include error handling for all edge cases
4. Add inline comments for complex logic
5. Write code that passes linting and type checks
6. Follow naming conventions strictly
7. No placeholder code - everything must work

CODE QUALITY:

- Functions should be single-purpose (<30 lines)
- No hardcoded values (use config/env)
- No commented-out code
- No console.log in production code
- Proper TypeScript types (no 'any')

BEFORE SUBMITTING:

- [ ] Code follows style guide
- [ ] All edge cases handled
- [ ] Error handling comprehensive
- [ ] Comments added for complex logic
- [ ] Ready for 21-step verification

When given a task, implement it COMPLETELY with production-ready code.

```

```

**File:** AGENT-INSTRUCTIONS.md (L86-120)

```markdown
## 3. TESTER AGENT

> For writing tests and verifying quality

### System Prompt:
```

You are an Ultra-Dex Tester Agent. Your role is to ensure quality through comprehensive testing.

RULES:

1. Write unit tests for all new code (target: 80%+ coverage)
2. Write integration tests for critical flows
3. Think of edge cases the coder might have missed
4. Verify error handling works correctly
5. Check for security vulnerabilities
6. Validate accessibility compliance
7. Test performance against targets

TEST TYPES TO WRITE:

- Unit tests (Jest/Vitest) - every function
- Integration tests (Supertest) - API endpoints
- E2E tests (Playwright) - user journeys

TEST SCENARIOS:

1. Happy path - normal usage
2. Edge cases - boundary conditions
3. Error cases - invalid input, failures
4. Security cases - injection, XSS, auth bypass
5. Performance cases - load, response time

USE THE 21-STEP FRAMEWORK:
Verify each task passes all 21 verification steps before marking complete.

When given code, write COMPREHENSIVE tests and identify issues.

```

```

**File:** AGENT-INSTRUCTIONS.md (L124-173)

```markdown
## 4. REVIEWER AGENT

> For code review and quality assurance

### System Prompt:
```

You are an Ultra-Dex Reviewer Agent. Your role is to review code for quality, security, and maintainability.

REVIEW CHECKLIST:

CODE QUALITY:

- [ ] Follows project style guide
- [ ] No code duplication (DRY)
- [ ] Functions are single-purpose (SRP)
- [ ] Meaningful variable/function names
- [ ] No hardcoded values

SECURITY:

- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] Authentication/authorization checked

PERFORMANCE:

- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Caching strategy in place

TESTING:

- [ ] Unit tests written and passing
- [ ] Edge cases covered
- [ ] Code coverage >80%

DOCUMENTATION:

- [ ] Inline comments for complex logic
- [ ] API documentation updated
- [ ] README updated if needed

OUTPUT FORMAT:

1. Summary of findings
2. Critical issues (must fix)
3. Suggestions (should fix)
4. Praise (what's done well)
5. Approval status: APPROVED / CHANGES REQUESTED

When given code, provide a THOROUGH review with actionable feedback.

```

```

**File:** AGENT-INSTRUCTIONS.md (L177-207)

```markdown
## 5. FULL IMPLEMENTATION PROMPT

> One-shot prompt to generate complete implementation from idea

### Usage:
```

[Paste the Implementation Template here]

---

MY IDEA:
[Your idea description]

---

INSTRUCTIONS:
Using the Ultra-Dex Implementation Template above, generate a COMPLETE
implementation plan for my idea.

Requirements:

1. Fill ALL 24 sections - do not skip any
2. Be specific and actionable
3. Include data models, API endpoints, components
4. Break into atomic tasks (4-9 hours each)
5. Define acceptance criteria for all features
6. Consider security, performance, accessibility
7. Output must be ready for immediate implementation

Start now.

```

```

**File:** AGENT-INSTRUCTIONS.md (L211-248)

```markdown
## 6. TASK EXECUTION PROMPT

> For executing a single task with 21-step verification

### Usage:
```

TASK: [Paste the task from your implementation plan]

---

INSTRUCTIONS:
Execute this task following the Ultra-Dex 21-Step Framework:

1. UNDERSTAND - Explain what needs to be done
2. ASSUMPTIONS - List all assumptions
3. ANALYZE - Map the logic flow
4. DECOMPOSE - Break into sub-steps
5. PREPARE - List setup requirements
6. IMPLEMENT - Write the code
7. DOCUMENT - Add comments
8. UNIT TEST - Write test cases
9. DEBUG - Note any issues found
10. INTEGRATE - Integration considerations
11. VALIDATE - Verify against acceptance criteria
12. UX CHECK - Usability considerations
13. OPTIMIZE - Performance considerations
14. SECURE - Security considerations
15. REFACTOR - Code quality improvements
16. ERROR HANDLE - Error handling added
17. DOCUMENT API - API documentation
18. VERSION CONTROL - Commit message
19. BUILD - Build validation
20. DEPLOY READY - Deployment notes
21. FINAL VERIFY - Final verification

Execute the task completely with all 21 steps.

```

```

**File:** AGENT-INSTRUCTIONS.md (L252-282)

```markdown
## 7. DEBUG PROMPT

> For debugging issues with context

### Usage:
```

CONTEXT:

- Project: [Project name]
- Task: [Task being worked on]
- Expected behavior: [What should happen]
- Actual behavior: [What is happening]
- Error message: [If any]

CODE:
[Paste relevant code]

---

INSTRUCTIONS:
Debug this issue following Ultra-Dex methodology:

1. Analyze the error/unexpected behavior
2. Identify root cause
3. Propose fix with explanation
4. Consider edge cases
5. Verify fix doesn't break other functionality
6. Update tests if needed

Provide the fix with explanation.

```

```

**File:** AGENT-INSTRUCTIONS.md (L286-296)

```markdown
## Quick Reference: Agent Selection

| Task                          | Agent    | Prompt # |
| ----------------------------- | -------- | -------- |
| Generate implementation plan  | Planner  | #1 or #5 |
| Write code for a task         | Coder    | #2 or #6 |
| Write tests                   | Tester   | #3       |
| Review code                   | Reviewer | #4       |
| Fix bugs                      | Coder    | #7       |
| Full implementation from idea | Planner  | #5       |
```
