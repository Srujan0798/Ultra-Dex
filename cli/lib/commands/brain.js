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
import ora from 'ora';

export async function brainCommand(options) {
  console.log(chalk.bold.blue('\n🧠 Ultra-Dex Brain Sync\n'));
  console.log('Synchronizing project context with codebase...\n');

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
    const enhancedContext = await enhanceContextWithProjectInfo(contextContent, state, graphSummary);
    
    // Write updated context
    await fs.writeFile(contextPath, enhancedContext);
    
    spinner.succeed('Context synchronized with project state');
    
    console.log(chalk.green('✅ CONTEXT.md updated with current project information'));
    console.log(chalk.gray(`  - Files analyzed: ${graphSummary.nodeCount}`));
    console.log(chalk.gray(`  - Dependencies mapped: ${graphSummary.edgeCount}`));
    console.log(chalk.gray(`  - Project phases: ${state?.phases?.length || 0}`));
    
    if (options.commit) {
      console.log(chalk.cyan('\n committing changes...'));
      try {
        const { execSync } = await import('child_process');
        execSync('git add CONTEXT.md');
        execSync('git commit -m "feat: sync CONTEXT.md with brain"');
        console.log(chalk.green('✅ Changes committed to git'));
      } catch (gitError) {
        console.log(chalk.yellow('⚠️  Git commit failed (not in git repo or no changes)'));
      }
    }
    
    if (options.push) {
      console.log(chalk.cyan(' pushing to remote...'));
      try {
        const { execSync } = await import('child_process');
        execSync('git push');
        console.log(chalk.green('✅ Changes pushed to remote'));
      } catch (gitError) {
        console.log(chalk.yellow('⚠️  Git push failed'));
      }
    }
    
  } catch (error) {
    spinner.fail('Context sync failed');
    console.error(chalk.red(`❌ ${error.message}`));
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
    for (const phase of state.phases.slice(0, 3)) { // Show first 3 phases
      currentStateBlock += `- **${phase.name}**: ${phase.status} (${phase.steps.filter(s => s.status === 'completed').length}/${phase.steps.length} tasks complete)\n`;
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

export function registerBrainCommand(program) {
  program
    .command('brain')
    .alias('sync-brain')
    .description('Synchronize project context with codebase (persistent AI memory)')
    .option('-c, --commit', 'Auto-commit changes to git')
    .option('-p, --push', 'Auto-push changes to remote')
    .option('-f, --force', 'Force sync even if no changes detected')
    .action(brainCommand);
}

export default { registerBrainCommand, brainCommand };