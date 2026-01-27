#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { watch as fsWatch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_ROOT = path.resolve(__dirname, '../assets');
const ROOT_FALLBACK = path.resolve(__dirname, '../../');

const program = new Command();

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗   ██╗██╗  ████████╗██████╗  █████╗                 ║
║   ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗                ║
║   ██║   ██║██║     ██║   ██████╔╝███████║                ║
║   ██║   ██║██║     ██║   ██╔══██╗██╔══██║                ║
║   ╚██████╔╝███████╗██║   ██║  ██║██║  ██║                ║
║    ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝                ║
║                                                           ║
║   ██████╗ ███████╗██╗  ██╗                               ║
║   ██╔══██╗██╔════╝╚██╗██╔╝                               ║
║   ██║  ██║█████╗   ╚███╔╝                                ║
║   ██║  ██║██╔══╝   ██╔██╗                                ║
║   ██████╔╝███████╗██╔╝ ██╗                               ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝                               ║
║                                                           ║
║   From Idea to Production-Ready SaaS                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

// Template content (embedded)
const QUICK_START_TEMPLATE = `# {{PROJECT_NAME}} - Quick Start

## 1. Your Idea (2 sentences max)

**What:** {{IDEA_WHAT}}
**For whom:** {{IDEA_FOR}}

## 2. The Problem (3 bullets)

- {{PROBLEM_1}}
- {{PROBLEM_2}}
- {{PROBLEM_3}}

## 3. Core Production Features (5 max)

| Feature | Priority | Justification |
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
- [TaskFlow Example](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
`;

// ===========================================
// EMBEDDED ASSETS (bundled for offline use)
// ===========================================

const CORE_CURSOR_RULE = `# Ultra-Dex Core Rules

> Load this as your base ruleset. Add domain-specific rules as needed.

## Project Philosophy

- Build production-ready from day 1
- Every task: 4-9 hours with clear acceptance criteria
- 21-step verification for features (simplified for fixes)
- Code > Documentation (but document decisions)

## Code Standards

- TypeScript strict mode always
- Zod validation at all API boundaries
- Error handling: never swallow errors silently
- Logging: structured JSON, include request IDs
- Tests: minimum 80% coverage for business logic

## Architecture Defaults

- Next.js App Router (or specified framework)
- PostgreSQL with Prisma ORM
- NextAuth.js for authentication
- Stripe for payments
- Vercel for deployment

## Task Completion Checklist (Quick 5-Step)

1. Does it work? (Manual test)
2. Are there tests? (Automated)
3. Is it secure? (No secrets exposed, inputs validated)
4. Is it documented? (Code comments for complex logic)
5. Is it deployable? (No breaking changes)

## When to Use Full 21-Step

- New features affecting multiple files
- Security-sensitive changes
- Database schema changes
- API contract changes

## File Naming

- Components: PascalCase (UserProfile.tsx)
- Utilities: camelCase (formatDate.ts)
- API routes: kebab-case (/api/user-profile)
- Database: snake_case (user_profiles)
`;

const AGENT_INSTRUCTIONS_EMBEDDED = `# Ultra-Dex AI Agent Quick Reference

## Agent Selection

| Task | Agent | Use When |
|------|-------|----------|
| Architecture decisions | @CTO | Tech stack, scaling, trade-offs |
| Task breakdown | @Planner | Feature to atomic tasks |
| API endpoints | @Backend | REST/GraphQL, middleware |
| React components | @Frontend | UI, state, forms |
| Schema design | @Database | Models, migrations, queries |
| Auth flows | @Security | Login, sessions, permissions |
| CI/CD setup | @DevOps | Deploy, monitoring, infra |
| Code review | @Reviewer | PR review, quality gates |
| Test coverage | @Testing | Unit, integration, E2E |
| Bug fixing | @Debugger | Root cause, fixes |

## Quick Start Prompts

### @Backend - API Endpoint
Act as @Backend. Context: [paste CONTEXT.md]
Task: Create POST /api/users endpoint with validation.
Requirements: Zod schema, error handling, rate limiting.

### @Database - Schema Design
Act as @Database. Context: [paste CONTEXT.md]
Task: Design User and Organization tables with relationships.
Requirements: Prisma schema, indexes, soft deletes.

### @Frontend - Component
Act as @Frontend. Context: [paste CONTEXT.md]
Task: Create UserProfile component with edit form.
Requirements: React Hook Form, Zod validation, loading states.

## 21-Step Verification (Quick 5)

1. Does it work? (Manual test)
2. Are there tests? (80%+ coverage)
3. Is it secure? (Inputs validated, no secrets)
4. Is it documented? (Complex logic commented)
5. Is it deployable? (No breaking changes)

---
Full agents: https://github.com/Srujan0798/Ultra-Dex/tree/main/agents
`;

const VERIFICATION_CHECKLIST = `# Ultra-Dex 21-Step Verification Checklist

## Quick 5 (Every Task)
- [ ] 1. Does it work? (Manual test)
- [ ] 2. Are there tests? (Unit tests passing)
- [ ] 3. Is it secure? (No secrets, inputs validated)
- [ ] 4. Is it documented? (Comments for complex logic)
- [ ] 5. Is it deployable? (No breaking changes)

## Full 21 (New Features)

### Understanding (1-4)
- [ ] 1. Requirements clear?
- [ ] 2. Assumptions documented?
- [ ] 3. Logic flow mapped?
- [ ] 4. Subtasks identified?

### Implementation (5-10)
- [ ] 5. Setup complete?
- [ ] 6. Code written?
- [ ] 7. Comments added?
- [ ] 8. Unit tests passing?
- [ ] 9. Bugs fixed?
- [ ] 10. Integration verified?

### Quality (11-16)
- [ ] 11. Acceptance criteria met?
- [ ] 12. UX acceptable?
- [ ] 13. Performance acceptable?
- [ ] 14. Security reviewed?
- [ ] 15. Code refactored?
- [ ] 16. Errors handled?

### Delivery (17-21)
- [ ] 17. API documented?
- [ ] 18. Committed?
- [ ] 19. Build passing?
- [ ] 20. Deploy ready?
- [ ] 21. Final verified?

---
Use Quick 5 for bug fixes. Use Full 21 for new features.
`;

const GITHUB_RAW = 'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main';
const CURSOR_RULE_FILES = [
  '00-ultra-dex-core.mdc',
  '01-database.mdc',
  '02-api.mdc',
  '03-auth.mdc',
  '04-frontend.mdc',
  '05-payments.mdc',
  '06-testing.mdc',
  '07-security.mdc',
  '08-deployment.mdc',
  '09-error-handling.mdc',
  '10-performance.mdc',
  '11-nextjs-v15.mdc',
  '12-multi-tenancy.mdc',
];
const AGENT_PATHS = [
  '00-AGENT_INDEX.md',
  'README.md',
  'AGENT-INSTRUCTIONS.md',
  '1-leadership/cto.md',
  '1-leadership/planner.md',
  '1-leadership/research.md',
  '2-development/backend.md',
  '2-development/frontend.md',
  '2-development/database.md',
  '3-security/auth.md',
  '3-security/security.md',
  '4-devops/devops.md',
  '5-quality/reviewer.md',
  '5-quality/testing.md',
  '5-quality/debugger.md',
  '5-quality/documentation.md',
  '6-specialist/performance.md',
  '6-specialist/refactoring.md',
];
const DOC_FILES = [
  'VERIFICATION.md',
  'BUILD-AUTH-30M.md',
  'QUICK-REFERENCE.md',
  'TROUBLESHOOTING.md',
];
const GUIDE_FILES = [
  'PROJECT-ORCHESTRATION.md',
  'ADVANCED-WORKFLOWS.md',
  'DATABASE-DECISION-FRAMEWORK.md',
  'ARCHITECTURE-PATTERNS.md',
];
const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'out',
  '.turbo',
  '.cache',
  '.ultra-dex',
  '.cursor',
  '.agents',
  'coverage',
  '.idea',
  '.vscode',
]);
const IGNORED_FILES = new Set(['CONTEXT.md', '.DS_Store']);
const SNAPSHOT_DIR = '.ultra-dex';
const SNAPSHOT_FILE = 'context-snapshot.json';
const AUTO_SYNC_HEADER = '## Auto-Sync Snapshot';
const SCHEMA_PATTERNS = [
  /schema\.prisma$/i,
  /drizzle\/schema/i,
  /supabase\/migrations/i,
  /migrations\/.*\.(sql|ts|js)$/i,
  /db\/schema/i,
];

async function downloadFile(url, destPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const content = await response.text();
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, content);
    return true;
  } catch (err) {
    return false;
  }
}

async function readFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function formatYamlExport(data) {
  const lines = [];
  lines.push(`generatedAt: ${JSON.stringify(data.generatedAt)}`);
  lines.push(`root: ${JSON.stringify(data.root)}`);
  lines.push('files:');

  const fileEntries = Object.entries(data.files);
  if (fileEntries.length === 0) {
    lines.push('  {}');
  } else {
    fileEntries.forEach(([fileName, content]) => {
      lines.push(`  ${fileName}: |`);
      const contentLines = content.length === 0 ? [''] : content.split('\n');
      contentLines.forEach(line => {
        lines.push(`    ${line}`);
      });
    });
  }

  if (data.missing.length === 0) {
    lines.push('missing: []');
  } else {
    lines.push('missing:');
    data.missing.forEach(item => {
      lines.push(`  - ${item}`);
    });
  }

  return lines.join('\n');
}

async function listFilesRecursive(rootDir, baseDir = rootDir) {
  let results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(rootDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      results = results.concat(await listFilesRecursive(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;
      results.push(relativePath);
    }
  }
  return results;
}

function classifyFilePaths(files) {
  const appFiles = [];
  const apiFiles = [];
  const schemaFiles = [];
  const configFiles = [];

  for (const file of files) {
    if (SCHEMA_PATTERNS.some((pattern) => pattern.test(file))) {
      schemaFiles.push(file);
      continue;
    }
    if (/^app\/api\//i.test(file) || /api\/.*\.(ts|js)$/i.test(file)) {
      apiFiles.push(file);
      continue;
    }
    if (/\.(tsx|jsx|svelte|vue)$/i.test(file) || /^app\//i.test(file)) {
      appFiles.push(file);
      continue;
    }
    if (/(config|\.config)\.(js|ts|json)$/i.test(file) || /\.(env|toml|yaml|yml)$/i.test(file)) {
      configFiles.push(file);
    }
  }

  return { appFiles, apiFiles, schemaFiles, configFiles };
}

function buildAutoSyncSection(summary) {
  const lines = [];
  lines.push(AUTO_SYNC_HEADER);
  lines.push('');
  lines.push(`- Last synced: ${summary.generatedAt}`);
  lines.push(`- Project root: ${summary.root}`);
  lines.push(`- Stack guess: ${summary.stack}`);
  lines.push(`- Total files scanned: ${summary.fileCount}`);
  lines.push(`- App/UI files: ${summary.appCount}`);
  lines.push(`- API files: ${summary.apiCount}`);
  lines.push(`- Schema files: ${summary.schemaCount}`);
  lines.push(`- Config files: ${summary.configCount}`);
  lines.push('');
  if (summary.appFiles.length > 0) {
    lines.push('### App/UI Files');
    lines.push(...summary.appFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.apiFiles.length > 0) {
    lines.push('### API Files');
    lines.push(...summary.apiFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.schemaFiles.length > 0) {
    lines.push('### Schema Files');
    lines.push(...summary.schemaFiles.map((file) => `- ${file}`));
    lines.push('');
  }
  if (summary.configFiles.length > 0) {
    lines.push('### Config Files');
    lines.push(...summary.configFiles.map((file) => `- ${file}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}

function summarizeDiff(previous, next) {
  if (!previous) {
    return {
      added: next.fileCount,
      removed: 0,
    };
  }
  const previousSet = new Set(previous.fileList || []);
  const nextSet = new Set(next.fileList || []);
  let added = 0;
  let removed = 0;
  for (const file of nextSet) {
    if (!previousSet.has(file)) added++;
  }
  for (const file of previousSet) {
    if (!nextSet.has(file)) removed++;
  }
  return { added, removed };
}

async function snapshotContext(rootDir) {
  const files = await listFilesRecursive(rootDir);
  const { appFiles, apiFiles, schemaFiles, configFiles } = classifyFilePaths(files);
  const summary = {
    generatedAt: new Date().toISOString(),
    root: rootDir,
    fileCount: files.length,
    appCount: appFiles.length,
    apiCount: apiFiles.length,
    schemaCount: schemaFiles.length,
    configCount: configFiles.length,
    appFiles: appFiles.slice(0, 25),
    apiFiles: apiFiles.slice(0, 25),
    schemaFiles: schemaFiles.slice(0, 25),
    configFiles: configFiles.slice(0, 25),
    stack: inferStackFromFiles(files),
    fileList: files,
  };

  const snapshotDir = path.join(rootDir, SNAPSHOT_DIR);
  await fs.mkdir(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, SNAPSHOT_FILE);
  let previous = null;
  try {
    const previousRaw = await fs.readFile(snapshotPath, 'utf-8');
    previous = JSON.parse(previousRaw);
  } catch {
    previous = null;
  }

  await fs.writeFile(snapshotPath, JSON.stringify(summary, null, 2));

  const contextPath = path.join(rootDir, 'CONTEXT.md');
  let contextContent = null;
  try {
    contextContent = await fs.readFile(contextPath, 'utf-8');
  } catch {
    return {
      summary,
      updated: false,
      missingContext: true,
      diff: summarizeDiff(previous, summary),
      contextPath,
    };
  }

  const section = buildAutoSyncSection(summary);
  let updatedContext = contextContent;
  if (contextContent.includes(AUTO_SYNC_HEADER)) {
    const pattern = new RegExp(`${AUTO_SYNC_HEADER}[\\s\\S]*?(?=^##\\s|\\n##\\s|$)`, 'm');
    updatedContext = contextContent.replace(pattern, `${section}\n\n`);
  } else {
    updatedContext = `${contextContent.trim()}\n\n${section}\n`;
  }

  if (updatedContext !== contextContent) {
    await fs.writeFile(contextPath, updatedContext);
    return {
      summary,
      updated: true,
      missingContext: false,
      diff: summarizeDiff(previous, summary),
      contextPath,
    };
  }

  return {
    summary,
    updated: false,
    missingContext: false,
    diff: summarizeDiff(previous, summary),
    contextPath,
  };
}

async function copyDirectory(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function inferStackFromFiles(fileList) {
  if (fileList.some((file) => file.includes('package.json'))) {
    if (fileList.some((file) => file.includes('next.config'))) return 'Next.js';
    if (fileList.some((file) => file.includes('remix.config'))) return 'Remix';
    if (fileList.some((file) => file.includes('svelte.config'))) return 'SvelteKit';
    return 'Node.js';
  }
  if (fileList.some((file) => file.includes('pyproject.toml') || file.includes('requirements.txt'))) {
    return 'Python';
  }
  return 'Unknown';
}

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('2.1.0');

program
  .command('init')
  .description('Initialize a new Ultra-Dex project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .option('--preview', 'Preview files without creating them')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\nWelcome to Ultra-Dex! Let\'s plan your SaaS.\n'));

    if (options.preview) {
      console.log('\n📋 Files that would be created:\n');
      console.log('  QUICK-START.md');
      console.log('  CONTEXT.md');
      console.log('  IMPLEMENTATION-PLAN.md');
      console.log('  docs/CHECKLIST.md');
      console.log('  docs/AI-PROMPTS.md');
      console.log('\nRun without --preview to create files.');
      return;
    }

    // Gather project info
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What\'s your project name?',
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
        message: 'Problem #1 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'problem2',
        message: 'Problem #2 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'problem3',
        message: 'Problem #3 you\'re solving:',
        default: '',
      },
      {
        type: 'input',
        name: 'feature1',
        message: 'Critical production feature:',
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
      {
        type: 'confirm',
        name: 'includeCursorRules',
        message: 'Include cursor-rules for AI assistants? (Cursor, Copilot)',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeFullTemplate',
        message: 'Copy full 34-section template locally?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeDocs',
        message: 'Copy VERIFICATION.md & AGENT-INSTRUCTIONS.md to docs/?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeAgents',
        message: 'Include AI agent prompts? (.agents/ folder)',
        default: true,
      },
    ]);

    const spinner = ora('Creating project files...').start();

    try {
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

      // Create empty implementation plan
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

- [Full Template](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)
- [TaskFlow Example](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
- [Methodology](https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/03-METHODOLOGY.md)
`;

      await fs.writeFile(path.join(outputDir, 'IMPLEMENTATION-PLAN.md'), planContent);

      // Copy cursor-rules if requested
      if (answers.includeCursorRules) {
        const rulesDir = path.join(outputDir, '.cursor', 'rules');
        await fs.mkdir(rulesDir, { recursive: true });

        const cursorRulesPath = path.join(ASSETS_ROOT, 'cursor-rules');
        try {
          const ruleFiles = await fs.readdir(cursorRulesPath);
          for (const file of ruleFiles.filter(f => f.endsWith('.mdc'))) {
            await fs.copyFile(
              path.join(cursorRulesPath, file),
              path.join(rulesDir, file)
            );
          }
        // Also generate .github/copilot-instructions.md for Copilot users
          const coreRulePath = path.join(cursorRulesPath, '00-ultra-dex-core.mdc');
          try {
            const coreContent = await fs.readFile(coreRulePath, 'utf-8');
            const dotGithub = path.join(outputDir, '.github');
            await fs.mkdir(dotGithub, { recursive: true });
            await fs.writeFile(path.join(dotGithub, 'copilot-instructions.md'), coreContent);
          } catch (e) {
            // Core rule not available - skip Copilot setup
          }
        } catch (err) {
          // Fallback to repo root if assets are not packaged
          const fallbackRulesPath = path.join(ROOT_FALLBACK, 'cursor-rules');
          try {
            const ruleFiles = await fs.readdir(fallbackRulesPath);
            for (const file of ruleFiles.filter(f => f.endsWith('.mdc'))) {
              await fs.copyFile(
                path.join(fallbackRulesPath, file),
                path.join(rulesDir, file)
              );
            }
          } catch (fallbackErr) {
            console.log(chalk.red('\n  ❌ Cursor rules not found in assets or repo.'));
            console.log(chalk.cyan('  Fetch: npx ultra-dex fetch --rules'));
          }
        }
      }

      // Copy full template if requested
      if (answers.includeFullTemplate) {
        const templatePath = path.join(ASSETS_ROOT, 'saas-plan', '04-Imp-Template.md');
        try {
          await fs.copyFile(templatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
        } catch (err) {
          const fallbackTemplatePath = path.join(ROOT_FALLBACK, '@ Ultra DeX', 'Saas plan', '04-Imp-Template.md');
          try {
            await fs.copyFile(fallbackTemplatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
          } catch (fallbackErr) {
            console.log(chalk.red('\n  ❌ Full template not found in assets or repo.'));
            console.log(chalk.cyan('  Fetch: npx ultra-dex fetch --docs'));
          }
        }
      }

      // Copy docs if requested
      if (answers.includeDocs) {
        const verificationPath = path.join(ASSETS_ROOT, 'docs', 'VERIFICATION.md');
        const agentPath = path.join(ASSETS_ROOT, 'agents', 'AGENT-INSTRUCTIONS.md');
        try {
          await fs.copyFile(verificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
          await fs.copyFile(agentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
        } catch (err) {
          const fallbackVerificationPath = path.join(ROOT_FALLBACK, 'docs', 'VERIFICATION.md');
          const fallbackAgentPath = path.join(ROOT_FALLBACK, 'agents', 'AGENT-INSTRUCTIONS.md');
          try {
            await fs.copyFile(fallbackVerificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
            await fs.copyFile(fallbackAgentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
          } catch (fallbackErr) {
            console.log(chalk.red('\n  ❌ Docs not found in assets or repo.'));
            console.log(chalk.cyan('  Fetch: npx ultra-dex fetch --docs'));
          }
        }
      }

      // Copy agents if requested
      if (answers.includeAgents) {
        const agentsDir = path.join(outputDir, '.agents');
        await fs.mkdir(agentsDir, { recursive: true });

        const agentsSourcePath = path.join(ASSETS_ROOT, 'agents');
        try {
          // Copy tier directories and agent files
          const tiers = ['1-leadership', '2-development', '3-security', '4-devops', '5-quality', '6-specialist'];
          for (const tier of tiers) {
            const tierDir = path.join(agentsDir, tier);
            await fs.mkdir(tierDir, { recursive: true });

            const tierPath = path.join(agentsSourcePath, tier);
            const tierFiles = await fs.readdir(tierPath);
            for (const file of tierFiles.filter(f => f.endsWith('.md'))) {
              await fs.copyFile(
                path.join(tierPath, file),
                path.join(tierDir, file)
              );
            }
          }

          // Copy agent index and README
          await fs.copyFile(
            path.join(agentsSourcePath, '00-AGENT_INDEX.md'),
            path.join(agentsDir, '00-AGENT_INDEX.md')
          );
          await fs.copyFile(
            path.join(agentsSourcePath, 'README.md'),
            path.join(agentsDir, 'README.md')
          );
        } catch (err) {
          const fallbackAgentsPath = path.join(ROOT_FALLBACK, 'agents');
          try {
            const tiers = ['1-leadership', '2-development', '3-security', '4-devops', '5-quality', '6-specialist'];
            for (const tier of tiers) {
              const tierDir = path.join(agentsDir, tier);
              await fs.mkdir(tierDir, { recursive: true });

              const tierPath = path.join(fallbackAgentsPath, tier);
              const tierFiles = await fs.readdir(tierPath);
              for (const file of tierFiles.filter(f => f.endsWith('.md'))) {
                await fs.copyFile(
                  path.join(tierPath, file),
                  path.join(tierDir, file)
                );
              }
            }

            await fs.copyFile(
              path.join(fallbackAgentsPath, '00-AGENT_INDEX.md'),
              path.join(agentsDir, '00-AGENT_INDEX.md')
            );
            await fs.copyFile(
              path.join(fallbackAgentsPath, 'README.md'),
              path.join(agentsDir, 'README.md')
            );
          } catch (fallbackErr) {
            console.log(chalk.red('\n  ❌ Agent prompts not found in assets or repo.'));
            console.log(chalk.cyan('  Fetch: npx ultra-dex fetch --agents'));
          }
        }
      }

      spinner.succeed(chalk.green('Project created successfully!'));

      console.log('\n' + chalk.bold('Files created:'));
      console.log(chalk.gray(`  ${outputDir}/`));
      console.log(chalk.gray('  ├── QUICK-START.md'));
      console.log(chalk.gray('  ├── CONTEXT.md'));
      console.log(chalk.gray('  ├── IMPLEMENTATION-PLAN.md'));
      if (answers.includeFullTemplate) {
        console.log(chalk.gray('  ├── docs/MASTER-PLAN.md (34 sections)'));
      }
      if (answers.includeDocs) {
        console.log(chalk.gray('  ├── docs/CHECKLIST.md'));
        console.log(chalk.gray('  ├── docs/AI-PROMPTS.md'));
      }
      if (answers.includeCursorRules) {
        console.log(chalk.gray('  ├── .cursor/rules/ (11 AI rule files)'));
      }
      if (answers.includeAgents) {
        console.log(chalk.gray('  └── .agents/ (15 AI agent prompts in 6 tiers)'));
      }

      console.log('\n' + chalk.bold('Next steps:'));
      console.log(chalk.cyan(`  1. cd ${answers.projectName}`));
      console.log(chalk.cyan('  2. Open QUICK-START.md and complete it'));
      console.log(chalk.cyan('  3. Start building! 🚀'));

      console.log('\n' + chalk.gray('Full Ultra-Dex repo:'));
      console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex'));

    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Audit your Ultra-Dex project for completeness')
  .option('-d, --dir <directory>', 'Project directory to audit', '.')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔍 Ultra-Dex Project Audit\n'));

    const projectDir = path.resolve(options.dir);
    let score = 0;
    let maxScore = 0;
    const results = [];

    // Helper function to check file exists and has content
    async function checkFile(filePath, description, points) {
      maxScore += points;
      try {
        const content = await fs.readFile(path.join(projectDir, filePath), 'utf-8');
        if (content.length > 50) {
          score += points;
          results.push({ status: '✅', item: description, points: `+${points}` });
          return content;
        } else {
          results.push({ status: '⚠️', item: `${description} (empty/too short)`, points: '0' });
          return null;
        }
      } catch {
        results.push({ status: '❌', item: `${description} (missing)`, points: '0' });
        return null;
      }
    }

    // Helper to check content has section
    function hasSection(content, sectionName, points) {
      maxScore += points;
      if (content && content.toLowerCase().includes(sectionName.toLowerCase())) {
        score += points;
        results.push({ status: '✅', item: `Has ${sectionName}`, points: `+${points}` });
        return true;
      } else {
        results.push({ status: '❌', item: `Missing ${sectionName}`, points: '0' });
        return false;
      }
    }

    // Check core files
    console.log(chalk.bold('Checking project files...\n'));

    const quickStart = await checkFile('QUICK-START.md', 'QUICK-START.md', 10);
    const context = await checkFile('CONTEXT.md', 'CONTEXT.md', 5);
    const implPlan = await checkFile('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md', 5);
    const fullTemplate = await checkFile('04-Imp-Template.md', '04-Imp-Template.md', 10);

    // Check for alternative file names
    const readme = await checkFile('README.md', 'README.md', 5);

    // Check content quality if QUICK-START exists
    if (quickStart) {
      hasSection(quickStart, 'idea', 5);
      hasSection(quickStart, 'problem', 5);
      hasSection(quickStart, 'mvp', 5);
      hasSection(quickStart, 'tech stack', 10);
      hasSection(quickStart, 'feature', 5);
    }

    // Check for implementation details
    if (implPlan) {
      hasSection(implPlan, 'database', 5);
      hasSection(implPlan, 'api', 5);
      hasSection(implPlan, 'auth', 5);
    }

    // Check for docs folder
    try {
      await fs.access(path.join(projectDir, 'docs'));
      score += 5;
      maxScore += 5;
      results.push({ status: '✅', item: 'docs/ folder exists', points: '+5' });
    } catch {
      maxScore += 5;
      results.push({ status: '⚠️', item: 'docs/ folder (optional)', points: '0' });
    }

    // Print results
    console.log(chalk.bold('Audit Results:\n'));
    results.forEach(r => {
      const statusColor = r.status === '✅' ? chalk.green : r.status === '❌' ? chalk.red : chalk.yellow;
      console.log(`  ${statusColor(r.status)} ${r.item} ${chalk.gray(r.points)}`);
    });

    // Calculate percentage
    const percentage = Math.round((score / maxScore) * 100);

    console.log('\n' + chalk.bold('─'.repeat(50)));
    console.log(chalk.bold(`\nScore: ${score}/${maxScore} (${percentage}%)\n`));

    // Grade
    let grade, gradeColor, message;
    if (percentage >= 90) {
      grade = 'A';
      gradeColor = chalk.green;
      message = 'Excellent! Your project is well-documented.';
    } else if (percentage >= 75) {
      grade = 'B';
      gradeColor = chalk.green;
      message = 'Good! A few more sections would help.';
    } else if (percentage >= 60) {
      grade = 'C';
      gradeColor = chalk.yellow;
      message = 'Fair. Consider filling more sections before coding.';
    } else if (percentage >= 40) {
      grade = 'D';
      gradeColor = chalk.yellow;
      message = 'Needs work. Use QUICK-START.md to define your project.';
    } else {
      grade = 'F';
      gradeColor = chalk.red;
      message = 'Run "npx ultra-dex init" to get started properly.';
    }

    console.log(gradeColor(`Grade: ${grade}`));
    console.log(chalk.gray(message));

    // Suggestions
    const missing = results.filter(r => r.status === '❌');
    if (missing.length > 0) {
      console.log(chalk.bold('\n📋 To improve your score:\n'));
      missing.slice(0, 5).forEach(m => {
        console.log(chalk.cyan(`  → Add ${m.item.replace(' (missing)', '')}`));
      });
    }

    console.log('\n' + chalk.gray('Learn more: https://github.com/Srujan0798/Ultra-Dex\n'));
  });

program
  .command('examples')
  .description('List available examples')
  .action(() => {
    console.log(chalk.bold('\nAvailable Ultra-Dex Examples:\n'));

    const examples = [
      {
        name: 'TaskFlow',
        type: 'Task Management',
        url: 'https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md',
      },
      {
        name: 'InvoiceFlow',
        type: 'Invoicing',
        url: 'https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/Examples/InvoiceFlow-Complete.md',
      },
      {
        name: 'HabitStack',
        type: 'Habit Tracking',
        url: 'https://github.com/Srujan0798/Ultra-Dex/blob/main/@%20Ultra%20DeX/Saas%20plan/Examples/HabitStack-Complete.md',
      },
    ];

    examples.forEach((ex, i) => {
      console.log(chalk.cyan(`${i + 1}. ${ex.name}`) + chalk.gray(` (${ex.type})`));
      console.log(chalk.gray(`   ${ex.url}\n`));
    });
  });

// Agent definitions (organized by tier)
const AGENTS = [
  // Leadership Tier
  { name: 'cto', description: 'Architecture & tech decisions', file: '1-leadership/cto.md', tier: 'Leadership' },
  { name: 'planner', description: 'Task breakdown & planning', file: '1-leadership/planner.md', tier: 'Leadership' },
  { name: 'research', description: 'Technology evaluation & comparison', file: '1-leadership/research.md', tier: 'Leadership' },
  // Development Tier
  { name: 'backend', description: 'API & server logic', file: '2-development/backend.md', tier: 'Development' },
  { name: 'database', description: 'Schema design & queries', file: '2-development/database.md', tier: 'Development' },
  { name: 'frontend', description: 'UI & components', file: '2-development/frontend.md', tier: 'Development' },
  // Security Tier
  { name: 'auth', description: 'Authentication & authorization', file: '3-security/auth.md', tier: 'Security' },
  { name: 'security', description: 'Security audits & vulnerability fixes', file: '3-security/security.md', tier: 'Security' },
  // DevOps Tier
  { name: 'devops', description: 'Deployment & infrastructure', file: '4-devops/devops.md', tier: 'DevOps' },
  // Quality Tier
  { name: 'debugger', description: 'Bug fixing & troubleshooting', file: '5-quality/debugger.md', tier: 'Quality' },
  { name: 'documentation', description: 'Technical writing & docs maintenance', file: '5-quality/documentation.md', tier: 'Quality' },
  { name: 'reviewer', description: 'Code review & quality check', file: '5-quality/reviewer.md', tier: 'Quality' },
  { name: 'testing', description: 'QA & test automation', file: '5-quality/testing.md', tier: 'Quality' },
  // Specialist Tier
  { name: 'performance', description: 'Performance optimization', file: '6-specialist/performance.md', tier: 'Specialist' },
  { name: 'refactoring', description: 'Code quality & design patterns', file: '6-specialist/refactoring.md', tier: 'Specialist' },
];

program
  .command('agents')
  .description('List available AI agent prompts')
  .action(() => {
    console.log(chalk.bold('\n🤖 Ultra-Dex AI Agents (15 Total)\n'));
    console.log(chalk.gray('Organized by tier for production pipeline\n'));

    let currentTier = '';
    AGENTS.forEach((agent) => {
      if (agent.tier !== currentTier) {
        currentTier = agent.tier;
        console.log(chalk.bold(`\n  ${currentTier} Tier:`));
      }
      console.log(chalk.cyan(`    ${agent.name}`) + chalk.gray(` - ${agent.description}`));
    });

    console.log('\n' + chalk.bold('Usage:'));
    console.log(chalk.gray('  ultra-dex agent <name>   Show agent prompt'));
    console.log(chalk.gray('  ultra-dex agent backend  Example: show backend agent'));

    console.log('\n' + chalk.gray('Agent Index: https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/00-AGENT_INDEX.md\n'));
  });

// ========================================
// V2 IMPLEMENTED COMMANDS
// ========================================
const BUILD_AGENTS = [
  { name: 'planner', tier: 'architect', task: 'Break down requirements into tasks' },
  { name: 'cto', tier: 'architect', task: 'Technical decisions & architecture' },
  { name: 'backend', tier: 'core', task: 'API, business logic, services' },
  { name: 'frontend', tier: 'core', task: 'UI components, pages, styling' },
  { name: 'database', tier: 'core', task: 'Schema design, migrations, queries' },
  { name: 'auth', tier: 'specialist', task: 'Authentication & authorization' },
  { name: 'security', tier: 'specialist', task: 'Security audit & hardening' },
  { name: 'testing', tier: 'specialist', task: 'Test strategy & implementation' },
  { name: 'reviewer', tier: 'quality', task: 'Code review & best practices' },
  { name: 'devops', tier: 'quality', task: 'CI/CD, deployment, infrastructure' }
];

program
  .command('generate')
  .description('Generate a full implementation plan from an idea')
  .option('-i, --idea <idea>', 'Your SaaS idea (one-liner)')
  .option('--dry-run', 'Show what would be generated without writing')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    let idea = options.idea;
    if (!idea) {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'idea',
        message: 'What SaaS do you want to build?',
        validate: i => i.length > 5 || 'Please describe your idea'
      }]);
      idea = answers.idea;
    }
    console.log(chalk.green(`\n✨ Generating plan for: "${idea}"\n`));
    console.log(chalk.yellow('⚠️  Full AI generation requires API key configuration.'));
    console.log(chalk.gray('   Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY'));
    console.log(chalk.cyan('\n💡 For now, use `ultra-dex init` to create templates, then fill them in.\n'));
  });

program
  .command('build')
  .description('Start AI-assisted build flow with context auto-loading')
  .option('-a, --agent <agent>', 'Specific agent to use')
  .option('-t, --task <task>', 'Task description')
  .option('--list', 'List available agents')
  .option('--context', 'Show loaded context summary')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    
    if (options.list) {
      console.log(chalk.bold('\n🤖 Available Build Agents:\n'));
      const tiers = {};
      BUILD_AGENTS.forEach(a => {
        if (!tiers[a.tier]) tiers[a.tier] = [];
        tiers[a.tier].push(a);
      });
      Object.entries(tiers).forEach(([tier, agents]) => {
        console.log(chalk.yellow(`  ${tier.toUpperCase()}`));
        agents.forEach(a => console.log(chalk.gray(`    @${a.name} - ${a.task}`)));
      });
      console.log('');
      return;
    }

    // Load context files
    const contextFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', '.ultra-dex/config.json'];
    let loadedContext = {};
    for (const file of contextFiles) {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), file), 'utf8');
        loadedContext[file] = content.slice(0, 5000); // First 5k chars
        console.log(chalk.green(`  ✓ Loaded ${file}`));
      } catch { /* file not found, skip */ }
    }

    if (options.context) {
      console.log(chalk.bold('\n📄 Loaded Context Summary:\n'));
      Object.entries(loadedContext).forEach(([f, c]) => {
        console.log(chalk.cyan(`  ${f}: ${c.length} chars`));
      });
      console.log('');
      return;
    }

    let agent = options.agent;
    if (!agent) {
      const { selectedAgent } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedAgent',
        message: 'Select an agent:',
        choices: BUILD_AGENTS.map(a => ({ name: `@${a.name} - ${a.task}`, value: a.name }))
      }]);
      agent = selectedAgent;
    }

    let task = options.task;
    if (!task) {
      const { taskInput } = await inquirer.prompt([{
        type: 'input',
        name: 'taskInput',
        message: `What should @${agent} do?`,
        validate: t => t.length > 3 || 'Please describe the task'
      }]);
      task = taskInput;
    }

    console.log(chalk.bold(`\n🚀 BUILD SESSION: @${agent}\n`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Task: ') + task);
    console.log(chalk.cyan('Context: ') + Object.keys(loadedContext).join(', ') || 'None');
    console.log(chalk.gray('─'.repeat(50)));

    // Generate the prompt
    const agentFile = path.resolve(ASSETS_ROOT, `../agents/${agent}.md`);
    let agentPrompt = '';
    try {
      agentPrompt = await fs.readFile(agentFile, 'utf8');
    } catch {
      agentPrompt = `You are the @${agent} agent. ${BUILD_AGENTS.find(a=>a.name===agent)?.task || 'Help with development.'}`;
    }

    const fullPrompt = `${agentPrompt}\n\n---\nCONTEXT:\n${JSON.stringify(loadedContext, null, 2)}\n\n---\nTASK: ${task}`;
    
    console.log(chalk.green('\n✅ Prompt ready! Copy this to your AI:\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(fullPrompt.slice(0, 500) + (fullPrompt.length > 500 ? '\n...[truncated]' : ''));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.yellow(`\n📋 Full prompt: ${fullPrompt.length} chars`));
    console.log(chalk.cyan('💡 Pro tip: Use `ultra-dex serve` to connect via MCP instead of copy-paste.\n'));
  });

program
  .command('review')
  .description('Review code/project against implementation plan')
  .option('-q, --quick', 'Quick check - structure only')
  .option('-d, --deep', 'Deep check - all 34 sections')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\n🔍 Ultra-Dex Review\n'));

    const checks = {
      structure: { files: ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md'], found: [] },
      sections: { required: 34, found: 0 },
      agents: { available: 15, configured: 0 }
    };

    // Check structure
    const spinner = ora('Checking project structure...').start();
    for (const file of checks.structure.files) {
      try {
        await fs.access(path.resolve(process.cwd(), file));
        checks.structure.found.push(file);
      } catch { /* not found */ }
    }
    spinner.succeed(`Structure: ${checks.structure.found.length}/${checks.structure.files.length} core files`);

    // Check implementation plan sections
    const planSpinner = ora('Analyzing implementation plan...').start();
    try {
      const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
      const sectionMatches = plan.match(/^##\s+\d+\./gm) || [];
      checks.sections.found = sectionMatches.length;
      planSpinner.succeed(`Sections: ${checks.sections.found}/${checks.sections.required} documented`);
    } catch {
      planSpinner.warn('No IMPLEMENTATION-PLAN.md found');
    }

    // Check agents
    const agentSpinner = ora('Checking agent configuration...').start();
    try {
      const agentsDir = path.resolve(process.cwd(), 'agents');
      const agents = await fs.readdir(agentsDir);
      checks.agents.configured = agents.filter(f => f.endsWith('.md')).length;
      agentSpinner.succeed(`Agents: ${checks.agents.configured}/${checks.agents.available} configured`);
    } catch {
      agentSpinner.info('No local agents/ directory');
    }

    // Calculate score
    const structureScore = (checks.structure.found.length / checks.structure.files.length) * 40;
    const sectionScore = (checks.sections.found / checks.sections.required) * 40;
    const agentScore = Math.min((checks.agents.configured / 5) * 20, 20);
    const totalScore = Math.round(structureScore + sectionScore + agentScore);

    console.log(chalk.bold('\n📊 Review Results:\n'));
    console.log(chalk.gray('─'.repeat(40)));
    
    const scoreColor = totalScore >= 80 ? 'green' : totalScore >= 50 ? 'yellow' : 'red';
    console.log(chalk[scoreColor](`  ALIGNMENT SCORE: ${totalScore}/100`));
    
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.cyan('  Structure: ') + `${Math.round(structureScore)}/40`);
    console.log(chalk.cyan('  Sections:  ') + `${Math.round(sectionScore)}/40`);
    console.log(chalk.cyan('  Agents:    ') + `${Math.round(agentScore)}/20`);
    console.log(chalk.gray('─'.repeat(40)));

    if (checks.structure.found.length < checks.structure.files.length) {
      const missing = checks.structure.files.filter(f => !checks.structure.found.includes(f));
      console.log(chalk.yellow('\n⚠️  Missing files: ') + missing.join(', '));
    }
    if (checks.sections.found < 20) {
      console.log(chalk.yellow('⚠️  Plan incomplete: Fill more sections in IMPLEMENTATION-PLAN.md'));
    }

    if (options.json) {
      console.log(JSON.stringify({ score: totalScore, checks }, null, 2));
    }
    console.log('');
  });

program
  .command('align')
  .description('Quick alignment score (one-liner)')
  .option('--strict', 'Exit with error if score < 70')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    // Quick check without banner
    const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md'];
    let found = 0, sections = 0;
    
    for (const file of files) {
      try {
        await fs.access(path.resolve(process.cwd(), file));
        found++;
      } catch { /* not found */ }
    }
    
    try {
      const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
      sections = (plan.match(/^##\s+\d+\./gm) || []).length;
    } catch { /* no plan */ }

    const score = Math.round((found / files.length) * 40 + (sections / 34) * 60);
    
    if (options.json) {
      console.log(JSON.stringify({ score, files: found, sections }));
    } else {
      const icon = score >= 80 ? '✅' : score >= 50 ? '⚠️' : '❌';
      console.log(`${icon} Alignment: ${score}/100 (${found}/${files.length} files, ${sections}/34 sections)`);
    }
    
    if (options.strict && score < 70) {
      process.exit(1);
    }
  });

// ========================================
// SYNC COMMAND - Assets + Context Snapshot
// ========================================
program
  .command('sync')
  .description('Sync project assets or refresh CONTEXT.md snapshot')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--assets', 'Sync agents/rules/docs from GitHub')
  .option('--agents', 'Sync only agent prompts')
  .option('--rules', 'Sync only cursor rules')
  .option('--docs', 'Sync only documentation')
  .action(async (options) => {
    const rootDir = path.resolve(options.dir);
    const syncAssets = options.assets || options.agents || options.rules || options.docs;
    console.log(chalk.cyan(`\n${syncAssets ? '🔄 Ultra-Dex Sync' : '🔁 Ultra-Dex Context Sync'}\n`));

    if (syncAssets) {
      const syncAll = !options.agents && !options.rules && !options.docs;
      const spinner = ora('Syncing assets...').start();

      let downloaded = 0;
      let failed = 0;

      if (syncAll || options.rules) {
        spinner.text = 'Syncing cursor rules...';
        const rulesDir = path.join(rootDir, '.cursor', 'rules');
        await fs.mkdir(rulesDir, { recursive: true });

        for (const file of CURSOR_RULE_FILES) {
          const url = `${GITHUB_RAW}/cursor-rules/${file}`;
          const dest = path.join(rulesDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }

        await downloadFile(`${GITHUB_RAW}/cursor-rules/load.sh`, path.join(rulesDir, 'load.sh'));
        try {
          await fs.chmod(path.join(rulesDir, 'load.sh'), '755');
        } catch {}
      }

      if (syncAll || options.agents) {
        spinner.text = 'Syncing agent prompts...';
        const agentsDir = path.join(rootDir, '.agents');
        await fs.mkdir(agentsDir, { recursive: true });

        for (const agentPath of AGENT_PATHS) {
          const url = `${GITHUB_RAW}/agents/${agentPath}`;
          const dest = path.join(agentsDir, agentPath);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }
      }

      if (syncAll || options.docs) {
        spinner.text = 'Syncing documentation...';
        const docsDir = path.join(rootDir, 'docs');
        await fs.mkdir(docsDir, { recursive: true });

        for (const file of DOC_FILES) {
          const url = `${GITHUB_RAW}/docs/${file}`;
          const dest = path.join(docsDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }

        spinner.text = 'Syncing guides...';
        const guidesDir = path.join(rootDir, 'guides');
        await fs.mkdir(guidesDir, { recursive: true });

        for (const file of GUIDE_FILES) {
          const url = `${GITHUB_RAW}/guides/${file}`;
          const dest = path.join(guidesDir, file);
          if (await downloadFile(url, dest)) {
            downloaded++;
          } else {
            failed++;
          }
        }
      }

      if (failed === 0) {
        spinner.succeed(chalk.green(`Synced ${downloaded} files into ${rootDir}`));
      } else {
        spinner.warn(chalk.yellow(`Synced ${downloaded} files, ${failed} failed`));
      }

      console.log(chalk.bold('\n📁 Synced paths:\n'));
      if (syncAll || options.rules) {
        console.log(chalk.gray(`  ${rootDir}/.cursor/rules/`));
      }
      if (syncAll || options.agents) {
        console.log(chalk.gray(`  ${rootDir}/.agents/`));
      }
      if (syncAll || options.docs) {
        console.log(chalk.gray(`  ${rootDir}/docs/`));
        console.log(chalk.gray(`  ${rootDir}/guides/`));
      }
      console.log('');
      return;
    }

    try {
      const result = await snapshotContext(rootDir);
      if (result.missingContext) {
        console.log(chalk.red('❌ CONTEXT.md not found. Run `ultra-dex init` first.'));
        process.exit(1);
      }

      if (result.updated) {
        console.log(chalk.green('✅ CONTEXT.md updated with latest snapshot.'));
      } else {
        console.log(chalk.yellow('⚠️  CONTEXT.md already up to date.'));
      }
      console.log(chalk.gray(`Files scanned: ${result.summary.fileCount}`));
      console.log(chalk.gray(`Stack guess: ${result.summary.stack}`));
      console.log(chalk.gray(`Changes since last sync: +${result.diff.added} / -${result.diff.removed}\n`));
    } catch (error) {
      console.log(chalk.red('❌ Sync failed.'));
      console.error(error);
      process.exit(1);
    }
  });

// ========================================
// EXPORT COMMAND - JSON/YAML Snapshot
// ========================================
program
  .command('export')
  .description('Export project context as JSON or YAML')
  .option('-d, --dir <directory>', 'Project directory to export', '.')
  .option('--json', 'Output JSON (default)')
  .option('--yaml', 'Output YAML')
  .action(async (options) => {
    const projectDir = path.resolve(options.dir);
    const filesToExport = [
      'QUICK-START.md',
      'CONTEXT.md',
      'IMPLEMENTATION-PLAN.md',
      'docs/CHECKLIST.md',
      'docs/AI-PROMPTS.md',
    ];

    const files = {};
    const missing = [];
    for (const file of filesToExport) {
      const content = await readFileIfExists(path.join(projectDir, file));
      if (content === null) {
        missing.push(file);
      } else {
        files[file] = content;
      }
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      root: projectDir,
      files,
      missing,
    };

    if (options.yaml) {
      console.log(formatYamlExport(payload));
    } else {
      console.log(JSON.stringify(payload, null, 2));
    }
  });

// ========================================
// CHECK COMMAND - Real-time Health Monitor
// ========================================
program
  .command('check')
  .description('Real-time project health monitor')
  .option('-d, --dir <directory>', 'Project directory to monitor', '.')
  .option('-w, --watch', 'Watch for changes (press Ctrl+C to stop)')
  .action(async (options) => {
    const projectDir = path.resolve(options.dir);

    const renderSummary = async (previous) => {
      const result = await snapshotContext(projectDir);
      const diff = result.diff;

      console.log(chalk.bold('\n📊 Ultra-Dex Project Health\n'));
      console.log(chalk.gray(`Root: ${projectDir}`));
      console.log(chalk.gray(`Stack: ${result.summary.stack}`));
      console.log(chalk.gray(`Files scanned: ${result.summary.fileCount}`));
      console.log(chalk.gray(`App/UI: ${result.summary.appCount} | API: ${result.summary.apiCount} | Schema: ${result.summary.schemaCount} | Config: ${result.summary.configCount}`));
      console.log(chalk.gray(`Changes: +${diff.added} / -${diff.removed}`));

      if (result.missingContext) {
        console.log(chalk.yellow('\n⚠️  CONTEXT.md not found. Run "ultra-dex init" to create it.'));
      } else if (result.updated) {
        console.log(chalk.green(`\n✅ Updated ${path.relative(process.cwd(), result.contextPath)}`));
      } else {
        console.log(chalk.green('\n✅ CONTEXT.md is up to date'));
      }

      console.log(chalk.gray(`Snapshot: ${path.join(projectDir, SNAPSHOT_DIR, SNAPSHOT_FILE)}`));
      return result.summary;
    };

    let previous = null;
    previous = await renderSummary(previous);

    if (!options.watch) return;

    console.log(chalk.cyan('\n👀 Watching for changes...\n'));
    let timer = null;

    fsWatch(projectDir, { recursive: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          previous = await renderSummary(previous);
        } catch (err) {
          console.log(chalk.red(`\n❌ Check failed: ${err.message || err}`));
        }
      }, 300);
    });
  });

// ========================================
// DEPLOY-CHECK COMMAND - Pre-deployment Validation
// ========================================
program
  .command('deploy-check')
  .description('Pre-deployment validation checklist')
  .option('-d, --dir <directory>', 'Project directory to check', '.')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚦 Ultra-Dex Deploy Check\n'));

    const checkDir = path.resolve(options.dir);

    async function fileExists(fp) {
      try { await fs.access(fp); return true; } catch { return false; }
    }
    async function dirExists(fp) {
      try { return (await fs.stat(fp)).isDirectory(); } catch { return false; }
    }

    const checks = [
      { name: 'Implementation plan', path: 'IMPLEMENTATION-PLAN.md', type: 'file', required: true },
      { name: 'Quick start', path: 'QUICK-START.md', type: 'file', required: true },
      { name: 'Context', path: 'CONTEXT.md', type: 'file', required: false },
      { name: 'Docs folder', path: 'docs', type: 'dir', required: false },
      { name: 'Tests folder', path: 'tests', type: 'dir', required: false },
      { name: 'Environment template', path: '.env.example', type: 'file', required: false },
      { name: 'Cursor rules', path: '.cursor/rules', type: 'dir', required: false },
      { name: 'Agents', path: '.agents', type: 'dir', required: false },
      { name: 'Git repo', path: '.git', type: 'dir', required: false },
    ];

    const results = [];
    const issues = [];
    for (const check of checks) {
      const fullPath = path.join(checkDir, check.path);
      const exists = check.type === 'dir' ? await dirExists(fullPath) : await fileExists(fullPath);
      if (!exists && check.required) {
        issues.push(`${check.path} missing`);
      }
      results.push({ name: check.name, path: check.path, status: exists ? 'pass' : 'missing', required: check.required });
    }

    if (options.json) {
      console.log(JSON.stringify({ issues, checks: results }, null, 2));
      if (issues.length > 0) process.exit(1);
      return;
    }

    results.forEach((result) => {
      const icon = result.status === 'pass' ? chalk.green('✅') : result.required ? chalk.red('❌') : chalk.yellow('⚠️');
      console.log(`  ${icon} ${result.name} (${result.path})`);
    });

    if (issues.length > 0) {
      console.log(chalk.red('\n❌ Blocking issues:'));
      issues.forEach(issue => console.log(chalk.gray(`  • ${issue}`)));
      console.log(chalk.yellow('\nFix required items before deploying.\n'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ Ready for deployment checks.\n'));
    }
  });

program
  .command('pre-commit')
  .description('Pre-commit hook - verify before commit')
  .option('--install', 'Install git pre-commit hook')
  .action(async (options) => {
    if (options.install) {
      const hookPath = path.resolve(process.cwd(), '.git/hooks/pre-commit');
      const hookScript = `#!/bin/sh
# Ultra-Dex pre-commit hook
npx ultra-dex align --strict
if [ $? -ne 0 ]; then
  echo "❌ Ultra-Dex alignment check failed. Score must be >= 70."
  echo "   Run 'ultra-dex review' for details."
  exit 1
fi
`;
      try {
        await fs.mkdir(path.dirname(hookPath), { recursive: true });
        await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
        console.log(chalk.green('✅ Pre-commit hook installed!'));
        console.log(chalk.gray('   Commits will be blocked if alignment score < 70.'));
      } catch (e) {
        console.log(chalk.red('❌ Failed to install hook: ' + e.message));
      }
      return;
    }
    
    // Run alignment check
    const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md'];
    let found = 0, sections = 0;
    
    for (const file of files) {
      try {
        await fs.access(path.resolve(process.cwd(), file));
        found++;
      } catch { /* not found */ }
    }
    
    try {
      const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
      sections = (plan.match(/^##\s+\d+\./gm) || []).length;
    } catch { /* no plan */ }

    const score = Math.round((found / files.length) * 40 + (sections / 34) * 60);
    
    if (score < 70) {
      console.log(chalk.red(`❌ BLOCKED: Alignment score ${score}/100 (required: 70)`));
      console.log(chalk.yellow('   Run `ultra-dex review` for detailed analysis.'));
      process.exit(1);
    } else {
      console.log(chalk.green(`✅ Alignment OK: ${score}/100`));
    }
  });

// ========================================
// STATE MANAGEMENT (.ultra/state.json)
// ========================================
async function loadState() {
  const statePath = path.resolve(process.cwd(), '.ultra/state.json');
  try {
    const content = await fs.readFile(statePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveState(state) {
  const ultraDir = path.resolve(process.cwd(), '.ultra');
  const statePath = path.resolve(ultraDir, 'state.json');
  try {
    await fs.mkdir(ultraDir, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    return true;
  } catch {
    return false;
  }
}

async function computeState() {
  const state = {
    version: '2.1.0',
    updatedAt: new Date().toISOString(),
    project: { name: path.basename(process.cwd()) },
    files: {},
    sections: { total: 34, completed: 0, list: [] },
    score: 0
  };

  // Check core files
  const coreFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md', 'QUICK-START.md'];
  for (const file of coreFiles) {
    try {
      const stat = await fs.stat(path.resolve(process.cwd(), file));
      state.files[file] = { exists: true, size: stat.size, modified: stat.mtime.toISOString() };
    } catch {
      state.files[file] = { exists: false };
    }
  }

  // Parse sections from IMPLEMENTATION-PLAN.md
  try {
    const plan = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
    const sectionRegex = /^##\s+(\d+)\.\s+(.+)$/gm;
    let match;
    while ((match = sectionRegex.exec(plan)) !== null) {
      state.sections.list.push({ number: parseInt(match[1]), title: match[2].trim() });
    }
    state.sections.completed = state.sections.list.length;
  } catch { /* no plan */ }

  // Calculate score
  const fileScore = Object.values(state.files).filter(f => f.exists).length / coreFiles.length * 40;
  const sectionScore = state.sections.completed / state.sections.total * 60;
  state.score = Math.round(fileScore + sectionScore);

  return state;
}

program
  .command('status')
  .description('Show current project state (from .ultra/state.json)')
  .option('--refresh', 'Refresh state before showing')
  .option('--json', 'Output raw JSON')
  .action(async (options) => {
    if (options.refresh) {
      const state = await computeState();
      await saveState(state);
    }

    let state = await loadState();
    if (!state) {
      console.log(chalk.yellow('\n⚠️  No .ultra/state.json found. Generating...\n'));
      state = await computeState();
      await saveState(state);
    }

    if (options.json) {
      console.log(JSON.stringify(state, null, 2));
      return;
    }

    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\n📊 Ultra-Dex Status\n'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const scoreColor = state.score >= 80 ? 'green' : state.score >= 50 ? 'yellow' : 'red';
    console.log(chalk[scoreColor](`  Score: ${state.score}/100`));
    console.log(chalk.gray(`  Updated: ${state.updatedAt}`));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.bold('\n📁 Files:'));
    Object.entries(state.files).forEach(([name, info]) => {
      const icon = info.exists ? chalk.green('✓') : chalk.red('✗');
      const size = info.exists ? chalk.gray(` (${info.size} bytes)`) : '';
      console.log(`  ${icon} ${name}${size}`);
    });

    console.log(chalk.bold('\n📝 Sections:'));
    console.log(`  ${state.sections.completed}/${state.sections.total} documented`);
    if (state.sections.list.length > 0) {
      const recent = state.sections.list.slice(-3);
      recent.forEach(s => console.log(chalk.gray(`    ${s.number}. ${s.title}`)));
      if (state.sections.list.length > 3) {
        console.log(chalk.gray(`    ... and ${state.sections.list.length - 3} more`));
      }
    }
    console.log('');
  });

program
  .command('watch')
  .description('Watch files and auto-update .ultra/state.json')
  .option('-i, --interval <ms>', 'Check interval in ms', '5000')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\n👁️  Ultra-Dex Watch Mode\n'));
    
    const interval = parseInt(options.interval) || 5000;
    const watchFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md'];
    
    console.log(chalk.gray(`Watching: ${watchFiles.join(', ')}`));
    console.log(chalk.gray(`Interval: ${interval}ms`));
    console.log(chalk.yellow('\nPress Ctrl+C to stop.\n'));

    // Initial state
    let lastState = await computeState();
    await saveState(lastState);
    console.log(chalk.green(`✓ Initial state: ${lastState.score}/100`));

    // Watch loop
    const checkInterval = setInterval(async () => {
      const newState = await computeState();
      if (newState.score !== lastState.score || 
          newState.sections.completed !== lastState.sections.completed) {
        await saveState(newState);
        const trend = newState.score > lastState.score ? '📈' : newState.score < lastState.score ? '📉' : '➡️';
        console.log(chalk.cyan(`${trend} Score: ${lastState.score} → ${newState.score} (${new Date().toLocaleTimeString()})`));
        lastState = newState;
      }
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(checkInterval);
      console.log(chalk.yellow('\n\n👋 Watch stopped.\n'));
      process.exit(0);
    });
  });

program
  .command('state')
  .description('Manage .ultra/state.json')
  .option('--refresh', 'Refresh state from markdown files')
  .option('--init', 'Initialize .ultra directory')
  .action(async (options) => {
    if (options.init) {
      const ultraDir = path.resolve(process.cwd(), '.ultra');
      await fs.mkdir(ultraDir, { recursive: true });
      const state = await computeState();
      await saveState(state);
      console.log(chalk.green('✅ Initialized .ultra/state.json'));
      console.log(chalk.gray(`   Score: ${state.score}/100`));
      console.log(chalk.gray(`   Sections: ${state.sections.completed}/${state.sections.total}`));
      return;
    }

    if (options.refresh) {
      const state = await computeState();
      await saveState(state);
      console.log(chalk.green('✅ Refreshed .ultra/state.json'));
      console.log(chalk.gray(`   Score: ${state.score}/100`));
      return;
    }

    // Default: show current state
    let state = await loadState();
    if (!state) {
      console.log(chalk.yellow('No .ultra/state.json found. Run `ultra-dex state --init`'));
      return;
    }
    console.log(JSON.stringify(state, null, 2));
  });

// ========================================
// MCP SERVER (Context over HTTP)
// ========================================
program
  .command('serve')
  .description('Serve Ultra-Dex context over HTTP (MCP-compatible)')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options) => {
    const port = Number.parseInt(options.port, 10);
    if (Number.isNaN(port)) {
      console.log(chalk.red('Invalid port. Use a numeric value.'));
      process.exit(1);
    }

    async function readFileSafe(filePath, label) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { label, content };
      } catch {
        return { label, content: '' };
      }
    }

    const server = http.createServer(async (req, res) => {
      if (!req.url || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Ultra-Dex MCP Server\n');
        return;
      }

      if (req.url === '/context') {
        const [context, plan, quickStart] = await Promise.all([
          readFileSafe('CONTEXT.md', 'CONTEXT.md'),
          readFileSafe('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md'),
          readFileSafe('QUICK-START.md', 'QUICK-START.md'),
        ]);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ files: [context, plan, quickStart] }));
        return;
      }

      // NEW: /state endpoint - returns .ultra/state.json
      if (req.url === '/state') {
        let state = await loadState();
        if (!state) {
          state = await computeState();
          await saveState(state);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
        return;
      }

      // NEW: /score endpoint - quick alignment score
      if (req.url === '/score') {
        const state = await computeState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ score: state.score, sections: state.sections.completed }));
        return;
      }

      // NEW: /agents endpoint - list available agents
      if (req.url === '/agents') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ agents: BUILD_AGENTS }));
        return;
      }

      // NEW: /agent/:name endpoint - get specific agent prompt
      if (req.url.startsWith('/agent/')) {
        const agentName = req.url.replace('/agent/', '');
        const agentPath = path.resolve(ASSETS_ROOT, `../agents/${agentName}.md`);
        try {
          const content = await fs.readFile(agentPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ agent: agentName, prompt: content }));
        } catch {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Agent ${agentName} not found` }));
        }
        return;
      }

      // NEW: /refresh endpoint - force state refresh
      if (req.url === '/refresh') {
        const state = await computeState();
        await saveState(state);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ refreshed: true, score: state.score }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(port, () => {
      console.log(chalk.green(`\n✅ Ultra-Dex MCP server running on http://localhost:${port}`));
      console.log(chalk.bold('\n📡 Endpoints:'));
      console.log(chalk.gray('  GET /          → Health check'));
      console.log(chalk.gray('  GET /context   → All context files (CONTEXT.md, PLAN, etc.)'));
      console.log(chalk.gray('  GET /state     → Full state from .ultra/state.json'));
      console.log(chalk.gray('  GET /score     → Quick alignment score'));
      console.log(chalk.gray('  GET /agents    → List available agents'));
      console.log(chalk.gray('  GET /agent/:n  → Get specific agent prompt'));
      console.log(chalk.gray('  GET /refresh   → Force state refresh'));
      console.log(chalk.cyan('\n💡 Connect your AI tool to this server for live context.\n'));
    });
  });

program
  .command('agent <name>')
  .description('Show a specific agent prompt')
  .action(async (name) => {
    const agent = AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());

    if (!agent) {
      console.log(chalk.red(`\n❌ Agent "${name}" not found.\n`));
      console.log(chalk.gray('Available agents:'));
      AGENTS.forEach(a => console.log(chalk.cyan(`  - ${a.name}`)));
      console.log('\n' + chalk.gray('Run "ultra-dex agents" to see all agents.\n'));
      process.exit(1);
    }

    // Try to read agent file
    const agentPath = path.join(ASSETS_ROOT, 'agents', agent.file);
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(content);
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.bold('\n📋 Copy the above prompt and paste into your AI tool.\n'));
    } catch (err) {
      const fallbackPath = path.join(ROOT_FALLBACK, 'agents', agent.file);
      try {
        const content = await fs.readFile(fallbackPath, 'utf-8');
        console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.bold('\n📋 Copy the above prompt and paste into your AI tool.\n'));
      } catch (fallbackErr) {
        console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
        console.log(chalk.gray('View full prompt on GitHub:'));
        console.log(chalk.blue(`  https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n`));
      }
    }
  });

// Pack command - assemble context for any AI tool
program
  .command('pack <agent>')
  .description('Package project context + agent prompt for any AI tool')
  .option('-c, --clipboard', 'Copy to clipboard (requires pbcopy/xclip)')
  .action(async (agentName, options) => {
    // Find agent
    const agent = AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
    if (!agent) {
      console.log(chalk.red(`\n❌ Agent "${agentName}" not found.\n`));
      console.log(chalk.gray('Available agents:'));
      AGENTS.forEach(a => console.log(chalk.cyan(`  - ${a.name}`)));
      process.exit(1);
    }

    let output = '';

    // 1. Read Agent Prompt
    const agentPath = path.join(ASSETS_ROOT, 'agents', agent.file);
    try {
      const agentPrompt = await fs.readFile(agentPath, 'utf-8');
      output += agentPrompt + '\n\n';
    } catch (err) {
      const fallbackPath = path.join(ROOT_FALLBACK, 'agents', agent.file);
      try {
        const agentPrompt = await fs.readFile(fallbackPath, 'utf-8');
        output += agentPrompt + '\n\n';
      } catch (fallbackErr) {
        output += `# ${agent.name.toUpperCase()} Agent\n\nSee: https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n\n`;
      }
    }

    output += '---\n\n';

    // 2. Read CONTEXT.md
    try {
      const context = await fs.readFile('CONTEXT.md', 'utf-8');
      output += '# PROJECT CONTEXT\n\n' + context + '\n\n';
    } catch (err) {
      output += '# PROJECT CONTEXT\n\n*No CONTEXT.md found. Run `ultra-dex init` first.*\n\n';
    }

    output += '---\n\n';

    // 3. Read IMPLEMENTATION-PLAN.md
    try {
      const plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf-8');
      output += '# IMPLEMENTATION PLAN\n\n' + plan + '\n';
    } catch (err) {
      output += '# IMPLEMENTATION PLAN\n\n*No IMPLEMENTATION-PLAN.md found. Run `ultra-dex init` first.*\n';
    }

    // Output
    console.log(chalk.bold(`\n📦 Packed context for @${agent.name}\n`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(output);
    console.log(chalk.gray('─'.repeat(60)));

    // Try to copy to clipboard if requested
    if (options.clipboard) {
      try {
        const { execSync } = require('child_process');
        const platform = process.platform;
        if (platform === 'darwin') {
          execSync('pbcopy', { input: output });
          console.log(chalk.green('\n✅ Copied to clipboard!\n'));
        } else if (platform === 'linux') {
          execSync('xclip -selection clipboard', { input: output });
          console.log(chalk.green('\n✅ Copied to clipboard!\n'));
        } else {
          console.log(chalk.yellow('\n⚠️  Clipboard not supported on this platform. Copy manually.\n'));
        }
      } catch (err) {
        console.log(chalk.yellow('\n⚠️  Could not copy to clipboard. Copy manually.\n'));
      }
    } else {
      console.log(chalk.cyan('\n💡 Tip: Use --clipboard flag to copy directly\n'));
    }
  });

// Workflow examples map
const WORKFLOWS = {
  auth: {
    name: 'Authentication',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Complete authentication with email/password and OAuth',
    example: 'supabase',
  },
  supabase: {
    name: 'Supabase Authentication Setup',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'],
    description: 'Set up Supabase auth with RLS policies',
    steps: [
      '1. Create Supabase project and get API keys',
      '2. Set up database schema with RLS policies',
      '3. Configure authentication providers (email + Google OAuth)',
      '4. Implement backend auth middleware',
      '5. Build frontend auth UI components',
      '6. Test authentication flow',
    ],
  },
  payments: {
    name: 'Payment Integration (Stripe)',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Security', '@DevOps'],
    description: 'Integrate Stripe for subscriptions and one-time payments',
    steps: [
      '1. Create Stripe account and get API keys',
      '2. Design subscription/payment schema',
      '3. Implement Stripe Checkout API',
      '4. Handle webhooks for payment events',
      '5. Build payment UI with checkout flow',
      '6. Test with Stripe test cards',
    ],
  },
  deployment: {
    name: 'Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy to Vercel with staging and production environments',
    example: 'vercel',
  },
  vercel: {
    name: 'Vercel Deployment Pipeline',
    agents: ['@Planner', '@CTO', '@Frontend', '@DevOps'],
    description: 'Deploy Next.js app to Vercel',
    steps: [
      '1. Set up Vercel project and link Git repository',
      '2. Configure environment variables for staging/production',
      '3. Set up custom domain',
      '4. Configure preview deployments for PRs',
      '5. Set up deployment protection rules',
      '6. Test deployment pipeline',
    ],
  },
  cicd: {
    name: 'GitHub Actions CI/CD',
    agents: ['@Planner', '@CTO', '@Testing', '@DevOps'],
    description: 'Automated testing and deployment with GitHub Actions',
    steps: [
      '1. Create workflow file for CI (tests + lint)',
      '2. Add build verification job',
      '3. Add deployment job for production',
      '4. Configure secrets for deployment',
      '5. Add status badges to README',
      '6. Test workflow on PR',
    ],
  },
  database: {
    name: 'Database Migration',
    agents: ['@Planner', '@CTO', '@Database', '@Backend', '@Testing'],
    description: 'Database schema migration and data sync',
    steps: [
      '1. Design new schema changes',
      '2. Write migration scripts',
      '3. Test migrations in staging',
      '4. Back up production database',
      '5. Run migrations in production',
      '6. Verify data integrity',
    ],
  },
  email: {
    name: 'Email Notification System',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@Testing'],
    description: 'Transactional emails with templates',
    steps: [
      '1. Choose email service (Resend, SendGrid)',
      '2. Set up email templates',
      '3. Implement email API endpoints',
      '4. Add email queue for async sending',
      '5. Test email delivery',
      '6. Monitor deliverability',
    ],
  },
  realtime: {
    name: 'Real-Time Features',
    agents: ['@Planner', '@CTO', '@Backend', '@Frontend', '@Testing'],
    description: 'Live notifications with WebSockets',
    steps: [
      '1. Choose WebSocket library (Socket.io, Pusher)',
      '2. Set up WebSocket server',
      '3. Implement event broadcasting',
      '4. Build frontend listeners',
      '5. Test real-time updates',
      '6. Handle reconnection logic',
    ],
  },
  sentry: {
    name: 'Sentry Error Tracking',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@DevOps'],
    description: 'Error monitoring with Sentry',
    steps: [
      '1. Create Sentry account and project',
      '2. Install Sentry SDKs for frontend and backend',
      '3. Configure error boundaries for React',
      '4. Set up source maps for debugging',
      '5. Configure alerts and notifications',
      '6. Test error capture in development',
    ],
  },
  shopify: {
    name: 'Shopify Product Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@DevOps'],
    description: 'Sync products from Shopify store',
    steps: [
      '1. Create Shopify Partner account and development store',
      '2. Set up Shopify app with Admin API access',
      '3. Design database schema for products',
      '4. Build product sync endpoint',
      '5. Implement webhook handlers for product updates',
      '6. Schedule full product sync (cron job)',
    ],
  },
  analytics: {
    name: 'PostHog Analytics Integration',
    agents: ['@Planner', '@Research', '@CTO', '@Backend', '@Frontend', '@DevOps'],
    description: 'Track user behavior with PostHog',
    steps: [
      '1. Create PostHog account and project',
      '2. Install PostHog SDKs for frontend and backend',
      '3. Set up core event tracking (signup, login, feature usage)',
      '4. Create conversion funnel dashboard',
      '5. Set up feature flags (optional)',
      '6. Configure user identification',
    ],
  },
};

program
  .command('workflow <feature>')
  .description('Show workflow for common features (auth, payments, deployment, etc.)')
  .action((feature) => {
    const workflow = WORKFLOWS[feature.toLowerCase()];

    if (!workflow) {
      console.log(chalk.red(`\n❌ Workflow "${feature}" not found.\n`));
      console.log(chalk.gray('Available workflows:'));
      Object.keys(WORKFLOWS).forEach(key => {
        console.log(chalk.cyan(`  - ${key}`) + chalk.gray(` (${WORKFLOWS[key].name})`));
      });
      console.log('\n' + chalk.gray('Usage: ultra-dex workflow <feature>\n'));
      process.exit(1);
    }

    console.log(chalk.bold(`\n📋 ${workflow.name} Workflow\n`));
    console.log(chalk.gray(workflow.description));

    console.log(chalk.bold('\n🤖 Agents Involved:\n'));
    workflow.agents.forEach((agent, i) => {
      console.log(chalk.cyan(`  ${i + 1}. ${agent}`));
    });

    if (workflow.steps) {
      console.log(chalk.bold('\n📝 Implementation Steps:\n'));
      workflow.steps.forEach(step => {
        console.log(chalk.gray(`  ${step}`));
      });
    }

    console.log(chalk.bold('\n📚 Full Example:\n'));
    console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/blob/main/guides/ADVANCED-WORKFLOWS.md'));
    console.log(chalk.gray(`  (Search for "Example: ${workflow.name}")\n`));
  });

program
  .command('suggest')
  .description('Get AI agent suggestions for your task')
  .action(async () => {
    console.log(chalk.cyan('\n🤖 Ultra-Dex Agent Suggester\n'));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'taskType',
        message: 'What are you trying to build?',
        choices: [
          'New feature from scratch',
          'Authentication system',
          'Payment integration',
          'Database changes',
          'Bug fix',
          'Performance optimization',
          'Deployment/DevOps',
          'API endpoint',
          'UI component',
          'Testing',
        ],
      },
      {
        type: 'input',
        name: 'description',
        message: 'Briefly describe your task:',
        default: '',
      },
    ]);

    console.log(chalk.bold('\n💡 Suggested Agent Workflow:\n'));

    // Agent suggestions based on task type
    let suggestedAgents = [];
    let reasoning = '';

    switch (answers.taskType) {
      case 'New feature from scratch':
        suggestedAgents = ['@Planner', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Reviewer', '@DevOps'];
        reasoning = 'Complete feature requires planning, architecture, implementation, testing, and deployment';
        break;

      case 'Authentication system':
        suggestedAgents = ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'];
        reasoning = 'Auth requires research (providers), security review, and full-stack implementation';
        break;

      case 'Payment integration':
        suggestedAgents = ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Security', '@DevOps'];
        reasoning = 'Payments need provider research, webhook handling, testing, and security audit';
        break;

      case 'Database changes':
        suggestedAgents = ['@Planner', '@CTO', '@Database', '@Backend', '@Testing'];
        reasoning = 'Schema changes need planning, architecture review, migration, and testing';
        break;

      case 'Bug fix':
        suggestedAgents = ['@Debugger', '@Testing', '@Reviewer'];
        reasoning = 'Debug issue, add test to prevent regression, review fix';
        break;

      case 'Performance optimization':
        suggestedAgents = ['@Performance', '@Backend', '@Frontend', '@Database', '@Testing'];
        reasoning = 'Identify bottlenecks, optimize code/queries, verify improvements';
        break;

      case 'Deployment/DevOps':
        suggestedAgents = ['@DevOps', '@CTO', '@Security'];
        reasoning = 'Infrastructure setup with security review';
        break;

      case 'API endpoint':
        suggestedAgents = ['@Backend', '@Database', '@Testing', '@Reviewer'];
        reasoning = 'Implement endpoint, add tests, review code quality';
        break;

      case 'UI component':
        suggestedAgents = ['@Frontend', '@Reviewer'];
        reasoning = 'Build component, review for quality and accessibility';
        break;

      case 'Testing':
        suggestedAgents = ['@Testing', '@Reviewer'];
        reasoning = 'Write tests, review coverage';
        break;

      default:
        suggestedAgents = ['@Planner', '@CTO'];
        reasoning = 'Start with planning and architecture review';
    }

    console.log(chalk.gray(reasoning + '\n'));

    suggestedAgents.forEach((agent, i) => {
      const agentName = agent.replace('@', '').toLowerCase();
      const agentInfo = AGENTS.find(a => a.name === agentName);
      const arrow = i < suggestedAgents.length - 1 ? '  →' : '';
      console.log(chalk.cyan(`  ${i + 1}. ${agent}`) + chalk.gray(` - ${agentInfo?.description || ''}`) + arrow);
    });

    console.log(chalk.bold('\n📚 Next Steps:\n'));
    console.log(chalk.gray(`  1. Start with ${suggestedAgents[0]} to plan the task`));
    console.log(chalk.gray(`  2. Hand off to each agent in sequence`));
    console.log(chalk.gray('  3. Use "ultra-dex agent <name>" to see full prompts\n'));

    console.log(chalk.bold('🔗 Related Workflows:\n'));
    if (answers.taskType === 'Authentication system') {
      console.log(chalk.blue('  ultra-dex workflow auth'));
      console.log(chalk.blue('  ultra-dex workflow supabase\n'));
    } else if (answers.taskType === 'Payment integration') {
      console.log(chalk.blue('  ultra-dex workflow payments\n'));
    } else if (answers.taskType === 'Deployment/DevOps') {
      console.log(chalk.blue('  ultra-dex workflow vercel'));
      console.log(chalk.blue('  ultra-dex workflow cicd\n'));
    } else {
      console.log(chalk.gray('  Use "ultra-dex workflow <feature>" to see examples\n'));
    }
  });

program
  .command('validate')
  .description('Validate project structure against Ultra-Dex standards')
  .option('-d, --dir <directory>', 'Project directory to validate', '.')
  .action(async (options) => {
    console.log(chalk.cyan('\n✅ Ultra-Dex Structure Validator\n'));

    const projectDir = path.resolve(options.dir);
    let passed = 0;
    let failed = 0;
    const warnings = [];

    // Helper to check file/directory exists
    async function checkExists(itemPath, type = 'file') {
      try {
        const stats = await fs.stat(path.join(projectDir, itemPath));
        if (type === 'file' && stats.isFile()) return true;
        if (type === 'dir' && stats.isDirectory()) return true;
        return false;
      } catch {
        return false;
      }
    }

    console.log(chalk.bold('Checking required files...\n'));

    // Check core planning files
    const coreFiles = [
      { path: 'QUICK-START.md', required: true },
      { path: 'IMPLEMENTATION-PLAN.md', required: true },
      { path: 'CONTEXT.md', required: false },
      { path: 'README.md', required: false },
    ];

    for (const file of coreFiles) {
      const exists = await checkExists(file.path);
      if (exists) {
        passed++;
        console.log(chalk.green(`  ✅ ${file.path}`));
      } else if (file.required) {
        failed++;
        console.log(chalk.red(`  ❌ ${file.path} (required)`));
      } else {
        warnings.push(file.path);
        console.log(chalk.yellow(`  ⚠️  ${file.path} (recommended)`));
      }
    }

    console.log(chalk.bold('\nChecking directory structure...\n'));

    const directories = [
      { path: 'docs', required: false },
      { path: '.agents', required: false },
      { path: '.cursor/rules', required: false },
    ];

    for (const dir of directories) {
      const exists = await checkExists(dir.path, 'dir');
      if (exists) {
        passed++;
        console.log(chalk.green(`  ✅ ${dir.path}/`));
      } else {
        warnings.push(dir.path);
        console.log(chalk.yellow(`  ⚠️  ${dir.path}/ (optional)`));
      }
    }

    console.log(chalk.bold('\nValidating content quality...\n'));

    // Check if QUICK-START has key sections
    try {
      const quickStart = await fs.readFile(path.join(projectDir, 'QUICK-START.md'), 'utf-8');

      const sections = ['idea', 'problem', 'feature', 'tech stack', 'tasks'];
      let sectionsFound = 0;

      sections.forEach(section => {
        if (quickStart.toLowerCase().includes(section)) {
          sectionsFound++;
        }
      });

      if (sectionsFound >= 4) {
        passed++;
        console.log(chalk.green(`  ✅ QUICK-START.md has ${sectionsFound}/${sections.length} key sections`));
      } else {
        failed++;
        console.log(chalk.red(`  ❌ QUICK-START.md missing key sections (${sectionsFound}/${sections.length})`));
      }
    } catch {
      console.log(chalk.gray('  ⊘  Could not validate QUICK-START.md content'));
    }

    // Check if implementation plan has content
    try {
      const implPlan = await fs.readFile(path.join(projectDir, 'IMPLEMENTATION-PLAN.md'), 'utf-8');

      if (implPlan.length > 500) {
        passed++;
        console.log(chalk.green(`  ✅ IMPLEMENTATION-PLAN.md has substantial content`));
      } else {
        warnings.push('IMPLEMENTATION-PLAN.md needs more detail');
        console.log(chalk.yellow(`  ⚠️  IMPLEMENTATION-PLAN.md is sparse (${implPlan.length} chars)`));
      }
    } catch {
      console.log(chalk.gray('  ⊘  Could not validate IMPLEMENTATION-PLAN.md content'));
    }

    // Summary
    console.log('\n' + chalk.bold('─'.repeat(50)));
    console.log(chalk.bold('\nValidation Summary:\n'));
    console.log(chalk.green(`  ✅ Passed: ${passed}`));
    console.log(chalk.red(`  ❌ Failed: ${failed}`));
    console.log(chalk.yellow(`  ⚠️  Warnings: ${warnings.length}`));

    // Overall status
    if (failed === 0) {
      console.log(chalk.bold.green('\n✅ VALIDATION PASSED\n'));
      console.log(chalk.gray('Your project structure follows Ultra-Dex standards.'));
    } else {
      console.log(chalk.bold.yellow('\n⚠️  VALIDATION INCOMPLETE\n'));
      console.log(chalk.gray('Fix required files to meet Ultra-Dex standards.'));
    }

    // Recommendations
    if (warnings.length > 0) {
      console.log(chalk.bold('\n💡 Recommendations:\n'));
      warnings.slice(0, 3).forEach(w => {
        console.log(chalk.cyan(`  → Consider adding ${w}`));
      });
    }

    console.log('\n' + chalk.gray('Run "ultra-dex init" to set up a proper Ultra-Dex project.\n'));
  });

// ========================================
// HOOKS COMMAND - Automated Verification
// ========================================
program
  .command('hooks')
  .description('Set up git hooks for automated verification')
  .option('--remove', 'Remove Ultra-Dex git hooks')
  .action(async (options) => {
    console.log(chalk.cyan('\n🪝 Ultra-Dex Git Hooks Setup\n'));

    const gitDir = path.join(process.cwd(), '.git');
    const hooksDir = path.join(gitDir, 'hooks');

    // Check if git repo exists
    try {
      await fs.access(gitDir);
    } catch {
      console.log(chalk.red('❌ Not a git repository. Run "git init" first.\n'));
      process.exit(1);
    }

    // Create hooks directory if it doesn't exist
    await fs.mkdir(hooksDir, { recursive: true });

    const preCommitPath = path.join(hooksDir, 'pre-commit');

    if (options.remove) {
      // Remove hooks
      try {
        const content = await fs.readFile(preCommitPath, 'utf-8');
        if (content.includes('ultra-dex')) {
          await fs.unlink(preCommitPath);
          console.log(chalk.green('✅ Ultra-Dex pre-commit hook removed.\n'));
        } else {
          console.log(chalk.yellow('⚠️  Pre-commit hook exists but is not from Ultra-Dex.\n'));
        }
      } catch {
        console.log(chalk.gray('No Ultra-Dex hooks found.\n'));
      }
      return;
    }

    // Generate pre-commit hook
    const preCommitScript = `#!/bin/sh
# Ultra-Dex Pre-Commit Hook
# Validates project structure before allowing commits
# Remove with: npx ultra-dex hooks --remove

echo "🔍 Ultra-Dex: Validating project structure..."

# Run validation
npx ultra-dex validate --dir . > /tmp/ultra-dex-validate.log 2>&1
RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo ""
  echo "❌ Ultra-Dex validation failed. Commit blocked."
  echo ""
  echo "Run 'npx ultra-dex validate' to see details."
  echo "Fix issues or bypass with: git commit --no-verify"
  echo ""
  exit 1
fi

# Check for required files
if [ ! -f "QUICK-START.md" ]; then
  echo "⚠️  Warning: QUICK-START.md not found"
fi

if [ ! -f "IMPLEMENTATION-PLAN.md" ]; then
  echo "⚠️  Warning: IMPLEMENTATION-PLAN.md not found"
fi

echo "✅ Ultra-Dex validation passed."
exit 0
`;

    // Check if pre-commit already exists
    try {
      const existing = await fs.readFile(preCommitPath, 'utf-8');
      if (existing.includes('ultra-dex')) {
        console.log(chalk.yellow('⚠️  Ultra-Dex pre-commit hook already exists.\n'));
        console.log(chalk.gray('  Use --remove to remove it first.\n'));
        return;
      } else {
        // Append to existing hook
        const combined = existing + '\n\n' + preCommitScript;
        await fs.writeFile(preCommitPath, combined);
        await fs.chmod(preCommitPath, '755');
        console.log(chalk.green('✅ Ultra-Dex hook appended to existing pre-commit.\n'));
      }
    } catch {
      // No existing hook, create new
      await fs.writeFile(preCommitPath, preCommitScript);
      await fs.chmod(preCommitPath, '755');
      console.log(chalk.green('✅ Pre-commit hook installed.\n'));
    }

    console.log(chalk.bold('What this does:\n'));
    console.log(chalk.gray('  • Runs "ultra-dex validate" before each commit'));
    console.log(chalk.gray('  • Blocks commits if required files are missing'));
    console.log(chalk.gray('  • Warns about incomplete sections\n'));

    console.log(chalk.bold('To bypass (not recommended):\n'));
    console.log(chalk.cyan('  git commit --no-verify\n'));

    console.log(chalk.bold('To remove:\n'));
    console.log(chalk.cyan('  npx ultra-dex hooks --remove\n'));
  });

// ========================================
// FETCH COMMAND - Offline Mode Support
// ========================================
program
  .command('fetch')
  .description('Download all Ultra-Dex assets for offline use')
  .option('-d, --dir <directory>', 'Target directory', '.ultra-dex')
  .option('--agents', 'Fetch only agent prompts')
  .option('--rules', 'Fetch only cursor rules')
  .option('--docs', 'Fetch only documentation')
  .action(async (options) => {
    console.log(chalk.cyan('\n📦 Ultra-Dex Asset Fetcher\n'));

    const targetDir = path.resolve(options.dir);
    const fetchAll = !options.agents && !options.rules && !options.docs;

    const spinner = ora('Preparing to fetch assets...').start();

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    let downloaded = 0;
    let failed = 0;

    // Fetch cursor rules
    if (fetchAll || options.rules) {
      spinner.text = 'Fetching cursor rules...';
      const rulesDir = path.join(targetDir, 'cursor-rules');
      await fs.mkdir(rulesDir, { recursive: true });

      for (const file of CURSOR_RULE_FILES) {
        const url = `${GITHUB_RAW}/cursor-rules/${file}`;
        const dest = path.join(rulesDir, file);
        if (await downloadFile(url, dest)) {
          downloaded++;
        } else {
          failed++;
        }
      }

      // Also fetch load.sh
      await downloadFile(`${GITHUB_RAW}/cursor-rules/load.sh`, path.join(rulesDir, 'load.sh'));
      try {
        await fs.chmod(path.join(rulesDir, 'load.sh'), '755');
      } catch {}
    }

    // Fetch agent prompts
    if (fetchAll || options.agents) {
      spinner.text = 'Fetching agent prompts...';
      const agentsDir = path.join(targetDir, 'agents');

      for (const agentPath of AGENT_PATHS) {
        const url = `${GITHUB_RAW}/agents/${agentPath}`;
        const dest = path.join(agentsDir, agentPath);
        if (await downloadFile(url, dest)) {
          downloaded++;
        } else {
          failed++;
        }
      }
    }

    // Fetch documentation
    if (fetchAll || options.docs) {
      spinner.text = 'Fetching documentation...';
      const docsDir = path.join(targetDir, 'docs');

      for (const file of DOC_FILES) {
        const url = `${GITHUB_RAW}/docs/${file}`;
        const dest = path.join(docsDir, file);
        if (await downloadFile(url, dest)) {
          downloaded++;
        } else {
          failed++;
        }
      }

      // Fetch guides
      const guidesDir = path.join(targetDir, 'guides');
      for (const file of GUIDE_FILES) {
        const url = `${GITHUB_RAW}/guides/${file}`;
        const dest = path.join(guidesDir, file);
        if (await downloadFile(url, dest)) {
          downloaded++;
        } else {
          failed++;
        }
      }
    }

    if (failed === 0) {
      spinner.succeed(chalk.green(`Downloaded ${downloaded} files to ${targetDir}`));
    } else {
      spinner.warn(chalk.yellow(`Downloaded ${downloaded} files, ${failed} failed`));
    }

    console.log(chalk.bold('\n📁 Assets downloaded to:\n'));
    if (fetchAll || options.rules) {
      console.log(chalk.gray(`  ${targetDir}/cursor-rules/  (12 .mdc files)`));
    }
    if (fetchAll || options.agents) {
      console.log(chalk.gray(`  ${targetDir}/agents/        (16 agent prompts)`));
    }
    if (fetchAll || options.docs) {
      console.log(chalk.gray(`  ${targetDir}/docs/          (documentation)`));
      console.log(chalk.gray(`  ${targetDir}/guides/        (guides)`));
    }

    console.log(chalk.bold('\n💡 Usage:\n'));
    console.log(chalk.cyan('  # Copy cursor rules to project'));
    console.log(chalk.gray(`  cp -r ${targetDir}/cursor-rules .cursor/rules`));
    console.log(chalk.cyan('\n  # Copy agents to project'));
    console.log(chalk.gray(`  cp -r ${targetDir}/agents .agents`));
    console.log(chalk.cyan('\n  # Works offline now!'));
    console.log(chalk.gray('  No GitHub access needed after fetch.\n'));
  });

program.parse();
