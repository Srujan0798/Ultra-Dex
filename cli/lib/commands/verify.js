/**
 * ultra-dex verify command
 * Executable 21-step verification framework
 */

import chalk from 'chalk';
import ora from 'ora';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { loadState } from './plan.js';
import { projectGraph } from '../mcp/graph.js';

const CHECKLIST = [
  "Atomic Scope Defined", "Context Loaded", "Architecture Alignment", 
  "Security Patterns Applied", "Type Safety Check", "Error Handling Strategy",
  "API Documentation Updated", "Database Schema Verified", "Environment Variables Set",
  "Implementation Complete", "Console Logs Removed", "Edge Cases Handled",
  "Performance Check", "Accessibility (A11y) Check", "Cross-browser Check",
  "Unit Tests Passed", "Integration Tests Passed", "Linting & Formatting",
  "Code Review Approved", "Migration Scripts Ready", "Deployment Readiness"
];

export async function verifyCommand(taskName, options) {
  console.log(chalk.cyan.bold('\n⚖️  Ultra-Dex 21-Step Verification\n'));
  
  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId);
  const state = await loadState();
  
  const spinner = ora(`@Reviewer is verifying: "${taskName || 'Project'}"...`).start();

  try {
    // 1. Structural Scan
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();

    // 2. AI Review
    const projectContext = {
        state,
        graph: graphSummary,
        context: `Task to verify: ${taskName || 'All completed tasks'}`
    };

    const prompt = `
Verify the following task against the 21-Step Verification Framework:
"${taskName || 'Full Project Readiness'}"

The framework consists of:
${CHECKLIST.map((s, i) => `${i+1}. ${s}`).join('\n')}

Based on the codebase graph and current state, provide a report in this format:
[ ] Step Name: [PASS/FAIL/SKIP] - Reasoning

Final Verdict: [APPROVED/REJECTED]
`;

    const report = await runAgentLoop('reviewer', prompt, provider, projectContext);
    spinner.succeed('Verification complete.');

    console.log(chalk.bold('\n📋 Verification Report:'));
    console.log(chalk.white(report));

    if (report.includes('REJECTED')) {
        console.log(chalk.red.bold('\n❌ Task failed verification. Please address the issues above.'));
        process.exit(1);
    } else {
        console.log(chalk.green.bold('\n✅ Task passed verification!'));
    }

  } catch (e) {
    spinner.fail(chalk.red(`Verification failed: ${e.message}`));
  }
}

export function registerVerifyCommand(program) {
    program
      .command('verify [task]')
      .description('Run executable 21-step verification on a task or project')
      .option('-p, --provider <provider>', 'AI provider')
      .action(verifyCommand);
}
