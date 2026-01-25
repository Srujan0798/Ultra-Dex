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

program
  .name('ultra-dex')
  .description('CLI for Ultra-Dex SaaS Implementation Framework')
  .version('1.7.1');

program
  .command('init')
  .description('Initialize a new Ultra-Dex project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .action(async (options) => {
    console.log(chalk.cyan(banner));
    console.log(chalk.bold('\nWelcome to Ultra-Dex! Let\'s plan your SaaS.\n'));

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

        const cursorRulesPath = path.resolve(__dirname, '../../cursor-rules');
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
          // Cursor rules not available (npm package, not local) - this is expected
          console.log(chalk.gray('\n  Cursor rules: Download from GitHub for AI-assisted development'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/tree/main/cursor-rules'));
        }
      }

      // Copy full template if requested
      if (answers.includeFullTemplate) {
        const templatePath = path.resolve(__dirname, '../../@ Ultra DeX/Saas plan/04-Imp-Template.md');
        try {
          await fs.copyFile(templatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
        } catch (err) {
          // Template not available locally - this is expected for npm installs
          console.log(chalk.gray('\n  Full 34-section template: Download from GitHub'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md'));
        }
      }

      // Copy docs if requested
      if (answers.includeDocs) {
        const verificationPath = path.resolve(__dirname, '../../docs/VERIFICATION.md');
        const agentPath = path.resolve(__dirname, '../../agents/AGENT-INSTRUCTIONS.md');
        try {
          await fs.copyFile(verificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
          await fs.copyFile(agentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
        } catch (err) {
          // Docs not available locally - this is expected for npm installs
          console.log(chalk.gray('\n  Verification checklist & agent instructions: Download from GitHub'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/tree/main/docs'));
        }
      }

      // Copy agents if requested
      if (answers.includeAgents) {
        const agentsDir = path.join(outputDir, '.agents');
        await fs.mkdir(agentsDir, { recursive: true });

        const agentsSourcePath = path.resolve(__dirname, '../../agents');
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
          // Agents not available locally - this is expected for npm installs
          console.log(chalk.gray('\n  15 AI agent prompts: Download from GitHub'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/tree/main/agents'));
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
    const agentPath = path.resolve(__dirname, '../../agents', agent.file);
    try {
      const content = await fs.readFile(agentPath, 'utf-8');
      console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(content);
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.bold('\n📋 Copy the above prompt and paste into your AI tool.\n'));
    } catch (err) {
      // Agent file not bundled (npm package) - show URL instead
      console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
      console.log(chalk.gray('View full prompt on GitHub:'));
      console.log(chalk.blue(`  https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n`));
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
    const agentPath = path.resolve(__dirname, '../../agents', agent.file);
    try {
      const agentPrompt = await fs.readFile(agentPath, 'utf-8');
      output += agentPrompt + '\n\n';
    } catch (err) {
      output += `# ${agent.name.toUpperCase()} Agent\n\nSee: https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n\n`;
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

program.parse();
