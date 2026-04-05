// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Brain Sync Command
 * Auto-sync CONTEXT.md with codebase changes, git history, and project state
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadState } from './state.js';
import { projectGraph } from '../mcp/graph.js';
// hybridRAG imported for future use with advanced brain features
// import { hybridRAG } from '../ai/hybrid-rag.js';
import ora from '../utils/ora.js';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function brainCommand(options) {
  logger.print(chalk.bold.blue('\n🧠 Ultra-Dex Brain Sync\n'));
  logger.print('Synchronizing project context with codebase...\n');

  const spinner = ora('Scanning project for context updates...').start();

  try {
    // Load current state
    const state = await loadState();

    // Scan project graph
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();

    // Update CONTEXT.md with latest information
    const contextPath = path.resolve(process.cwd(), 'CONTEXT.md');
    let contextContent = '';

    try {
      contextContent = await fs.readFile(contextPath, 'utf8');
    } catch (error) {
      // If CONTEXT.md doesn't exist, create it
      contextContent = `# {{PROJECT_NAME}} - Context

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
    }

    // Enhance context with current project information
    let enhancedContext = await enhanceContextWithProjectInfo(contextContent, state, graphSummary);

    if (options.diff) {
      const diffSummary = await buildDiffSummary();
      enhancedContext = await applyDiffSummary(enhancedContext, diffSummary);
    }

    // Write updated context
    await fs.writeFile(contextPath, enhancedContext);

    spinner.succeed('Context synchronized with project state');

    logger.print(chalk.green('✅ CONTEXT.md updated with current project information'));
    logger.print(chalk.gray(`  - Files analyzed: ${graphSummary.nodeCount}`));
    logger.print(chalk.gray(`  - Dependencies mapped: ${graphSummary.edgeCount}`));
    logger.print(chalk.gray(`  - Project phases: ${state?.phases?.length || 0}`));

    if (options.commit) {
      logger.print(chalk.cyan('\n committing changes...'));
      try {
        const { execSync } = await import('child_process');
        execSync('git add CONTEXT.md');
        execSync('git commit -m "feat: sync CONTEXT.md with brain"');
        logger.print(chalk.green('✅ Changes committed to git'));
      } catch (gitError) {
        logger.print(chalk.yellow('⚠️  Git commit failed (not in git repo or no changes)'));
      }
    }

    if (options.push) {
      logger.print(chalk.cyan(' pushing to remote...'));
      try {
        const { execSync } = await import('child_process');
        execSync('git push');
        logger.print(chalk.green('✅ Changes pushed to remote'));
      } catch (gitError) {
        logger.print(chalk.yellow('⚠️  Git push failed'));
      }
    }
  } catch (error) {
    spinner.fail('Context sync failed');
    logger.error(chalk.red(`❌ ${error.message}`));
    throw error;
  }
}

export async function enhanceContextWithProjectInfo(context, state, graphSummary) {
  // 1. Remove existing "Current State" blocks (and their content up to next header)
  // We use a regex that matches "### Current State" and everything until the next "## " header or end of string
  let newContext = context
    .replace(/\n### Current State[\s\S]*?(?=\n## |\n$|$)/g, '')
    .replace(/\n## Project Statistics[\s\S]*?(?=\n## |\n$|$)/g, '')
    .trim();

  // 2. Prepare new Current State block
  let currentStateBlock = `\n\n### Current State
- **Files Analyzed**: ${graphSummary.nodeCount}
- **Dependencies**: ${graphSummary.edgeCount}
- **Project Phases**: ${state?.phases?.length || 0} active
- **Last Sync**: ${new Date().toISOString()}
`;

  if (state?.phases && state.phases.length > 0) {
    currentStateBlock += `\n### Active Phases:\n`;
    for (const phase of state.phases.slice(0, 3)) {
      // Show first 3 phases
      currentStateBlock += `- **${phase.name}**: ${phase.status} (${phase.steps.filter((s) => s.status === 'completed').length}/${phase.steps.length} tasks complete)\n`;
    }
  }

  // 3. Insert Current State after "Current Focus" content
  // Find "## Current Focus"
  const focusRegex = /(## Current Focus[\s\S]*?)(?=\n## |$)/;
  const match = newContext.match(focusRegex);

  if (match) {
    // We found the section. We append our block to it.
    // match[0] is the entire "Current Focus" section content
    const updatedSection = match[0].trimEnd() + currentStateBlock + '\n';
    newContext = newContext.replace(focusRegex, updatedSection);
  } else {
    // Fallback: Append if section missing
    newContext += `\n\n## Current Focus\n${currentStateBlock}`;
  }

  // 4. Append Project Statistics
  const statsBlock = `\n\n## Project Statistics

| Metric | Count |
|--------|-------|
| Files | ${graphSummary.nodeCount} |
| Dependencies | ${graphSummary.edgeCount} |
| Lines of Code | ${graphSummary.totalLines || 'N/A'} |
| Last Updated | ${new Date().toISOString()} |
`;

  return newContext + statsBlock;
}

export async function buildDiffSummary() {
  try {
    const upstream = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
    const range = `${upstream}..HEAD`;
    const stat = execSync(`git diff --stat ${range}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    const commits = execSync(`git log --oneline ${range}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
    return { range, stat, commits };
  } catch (error) {
    try {
      const stat = execSync('git diff --stat HEAD~1..HEAD', {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
      const commits = execSync('git log -1 --oneline', { encoding: 'utf8', stdio: 'pipe' }).trim();
      return { range: 'HEAD~1..HEAD', stat, commits };
    } catch {
      return { range: 'unknown', stat: '', commits: '' };
    }
  }
}

export async function applyDiffSummary(context, diffSummary) {
  if (!diffSummary?.stat) return context;

  const heading = '## Recent Changes (Auto)';
  const block = `${heading}

- **Range**: ${diffSummary.range}
- **Updated**: ${new Date().toISOString()}

### Diff Summary
${diffSummary.stat}

### Commits
${diffSummary.commits || 'No commits detected'}
`;

  const sectionRegex = /\n## Recent Changes \(Auto\)[\s\S]*?(?=\n## |\n$|$)/;

  if (sectionRegex.test(context)) {
    return context.replace(sectionRegex, `\n${block}`);
  }

  return `${context.trim()}\n\n${block}\n`;
}

export function registerBrainCommand(program) {
  program
    .command('brain')
    .alias('sync-brain')
    .description('Synchronize project context with codebase (persistent AI memory)')
    .option('-c, --commit', 'Auto-commit changes to git')
    .option('-p, --push', 'Auto-push changes to remote')
    .option('--diff', 'Include git diff summary in CONTEXT.md')
    .option('-f, --force', 'Force sync even if no changes detected')
    .action(brainCommand);
}

export default { registerBrainCommand, brainCommand };
