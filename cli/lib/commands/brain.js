/**
 * Ultra-Dex Brain Sync Command
 * Auto-sync CONTEXT.md with codebase changes, git history, and project state
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadState } from './state.js';
import { projectGraph } from '../mcp/graph.js';
import { hybridRAG } from '../ai/hybrid-rag.js';
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

async function enhanceContextWithProjectInfo(context, state, graphSummary) {
  // Parse existing context
  const lines = context.split('\n');
  let enhancedLines = [];
  
  let inCurrentFocus = false;
  let inResources = false;
  
  for (const line of lines) {
    if (line.startsWith('## Current Focus')) {
      inCurrentFocus = true;
      enhancedLines.push(line);
      continue;
    }
    
    if (line.startsWith('## Resources')) {
      inCurrentFocus = false;
      inResources = true;
    }
    
    if (inCurrentFocus && line.trim() === '') {
      // Add enhanced current focus information
      enhancedLines.push(line);
      enhancedLines.push('');
      enhancedLines.push('### Current State');
      enhancedLines.push(`- **Files Analyzed**: ${graphSummary.nodeCount}`);
      enhancedLines.push(`- **Dependencies**: ${graphSummary.edgeCount}`);
      enhancedLines.push(`- **Project Phases**: ${state?.phases?.length || 0} active`);
      enhancedLines.push(`- **Last Sync**: ${new Date().toISOString()}`);
      enhancedLines.push('');
      
      if (state?.phases) {
        enhancedLines.push('### Active Phases:');
        for (const phase of state.phases.slice(0, 3)) { // Show first 3 phases
          enhancedLines.push(`- **${phase.name}**: ${phase.status} (${phase.steps.filter(s => s.status === 'completed').length}/${phase.steps.length} tasks complete)`);
        }
        enhancedLines.push('');
      }
      
      continue;
    }
    
    if (inResources && line.startsWith('##')) {
      inResources = false;
    }
    
    enhancedLines.push(line);
  }
  
  // Add project statistics if not already present
  if (!context.includes('## Project Statistics')) {
    enhancedLines.push('');
    enhancedLines.push('## Project Statistics');
    enhancedLines.push('');
    enhancedLines.push('| Metric | Count |');
    enhancedLines.push('|--------|-------|');
    enhancedLines.push(`| Files | ${graphSummary.nodeCount} |`);
    enhancedLines.push(`| Dependencies | ${graphSummary.edgeCount} |`);
    enhancedLines.push(`| Lines of Code | ${graphSummary.totalLines || 'N/A'} |`);
    enhancedLines.push(`| Last Updated | ${new Date().toISOString()} |`);
    enhancedLines.push('');
  }
  
  return enhancedLines.join('\n');
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