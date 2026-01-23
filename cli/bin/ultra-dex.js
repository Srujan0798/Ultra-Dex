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
  .version('1.6.0');

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
        } catch (err) {
          // Cursor rules not available (npm package, not local)
          console.log(chalk.yellow('\n  Note: cursor-rules not bundled. Download from GitHub:'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/tree/main/cursor-rules'));
        }
      }

      // Copy full template if requested
      if (answers.includeFullTemplate) {
        const templatePath = path.resolve(__dirname, '../../@ Ultra DeX/Saas plan/04-Imp-Template.md');
        try {
          await fs.copyFile(templatePath, path.join(outputDir, 'docs', 'MASTER-PLAN.md'));
        } catch (err) {
          console.log(chalk.yellow('\n  Note: Full template not bundled. Download from GitHub:'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex/blob/main/%40%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md'));
        }
      }

      // Copy docs if requested
      if (answers.includeDocs) {
        const verificationPath = path.resolve(__dirname, '../../VERIFICATION.md');
        const agentPath = path.resolve(__dirname, '../../AGENT-INSTRUCTIONS.md');
        try {
          await fs.copyFile(verificationPath, path.join(outputDir, 'docs', 'CHECKLIST.md'));
          await fs.copyFile(agentPath, path.join(outputDir, 'docs', 'AI-PROMPTS.md'));
        } catch (err) {
          console.log(chalk.yellow('\n  Note: Docs not bundled. Download from GitHub:'));
          console.log(chalk.blue('  https://github.com/Srujan0798/Ultra-Dex'));
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
          // Agents not available (npm package, not local)
          console.log(chalk.yellow('\n  Note: Agent prompts not bundled. Download from GitHub:'));
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
        console.log(chalk.gray('  └── .agents/ (14 AI agent prompts in 6 tiers)'));
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
    console.log(chalk.bold('\n🤖 Ultra-Dex AI Agents (14 Total)\n'));
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
      // Agent file not bundled (npm package)
      console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
      console.log(chalk.yellow('Agent prompts are not bundled with the npm package.'));
      console.log(chalk.gray('\nDownload from GitHub:'));
      console.log(chalk.blue(`  https://github.com/Srujan0798/Ultra-Dex/blob/main/agents/${agent.file}\n`));
    }
  });

program.parse();
