/**
 * ultra-dex verify command
 * Executable 21-step verification framework
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { loadState } from './plan.js';
import { projectGraph } from '../mcp/graph.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { 
    verifyArchitectureAlignment, 
    verifyErrorHandlingStrategy, 
    verifyApiDocumentation, 
    verifyDatabaseSchema, 
    verifyEnvironmentVariables,
    verifyTypeSafety,
    verifyUnitTests,
    verifyLinting,
    verifySecurityPatterns,
    verifyConsoleLogs,
    verifyContextLoaded,
    verifyAccessibility,
    verifyPerformance,
    verifyDeploymentReadiness,
    verifyMigrationScripts
} from '../quality/automation.js';

const CHECKLIST = [
  "Atomic Scope Defined", "Context Loaded", "Architecture Alignment", 
  "Security Patterns Applied", "Type Safety Check", "Error Handling Strategy",
  "API Documentation Updated", "Database Schema Verified", "Environment Variables Set",
  "Implementation Complete", "Console Logs Removed", "Edge Cases Handled",
  "Performance Check", "Accessibility (A11y) Check", "Cross-browser Check",
  "Unit Tests Passed", "Integration Tests Passed", "Linting & Formatting",
  "Code Review Approved", "Migration Scripts Ready", "Deployment Readiness"
];

/**
 * Register the verify command with Commander
 */
export function registerVerifyCommand(program) {
    program
      .command('verify [task]')
      .description('Run executable 21-step verification on a task or project')
      .option('-p, --provider <provider>', 'AI provider')
      .action(async (task, options) => {
          try {
              await verifyCommand(task, options);
          } catch (error) {
              await handleError(error, { command: 'verify', task, options });
              process.exit(error.exitCode || 1);
          }
      });
}

/**
 * Core verification logic
 */
export async function verifyCommand(taskName, options) {
  printInfo('\n⚖️  Ultra-Dex 21-Step Verification\n');
  
  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId);
  const state = await loadState();
  const projectDir = process.cwd();

  // 1. Automated Checks
  printInfo(chalk.bold('1. Running Automated Gates...\n'));
  const automatedResults = await runAutomatedGates(projectDir);
  console.log('');

  // 2. AI Review
  printInfo(chalk.bold('2. Initiating AI Deep Review...\n'));
  const report = await runAiReview(taskName, provider, state, automatedResults);

  // 3. Final Verdict
  displayFinalVerdict(report);
}

/**
 * Execute all automated verification gates
 */
async function runAutomatedGates(projectDir) {
  const automatedResults = {};
  const gates = [
    { name: 'Context Loaded', fn: verifyContextLoaded },
    { name: 'Architecture Alignment', fn: verifyArchitectureAlignment },
    { name: 'Security Patterns Applied', fn: verifySecurityPatterns },
    { name: 'Type Safety Check', fn: verifyTypeSafety },
    { name: 'Error Handling Strategy', fn: verifyErrorHandlingStrategy },
    { name: 'API Documentation Updated', fn: verifyApiDocumentation },
    { name: 'Database Schema Verified', fn: verifyDatabaseSchema },
    { name: 'Migration Scripts Ready', fn: verifyMigrationScripts },
    { name: 'Environment Variables Set', fn: verifyEnvironmentVariables },
    { name: 'Console Logs Removed', fn: verifyConsoleLogs },
    { name: 'Accessibility (A11y) Check', fn: verifyAccessibility },
    { name: 'Performance Check', fn: verifyPerformance },
    { name: 'Unit Tests Passed', fn: verifyUnitTests },
    { name: 'Linting & Formatting', fn: verifyLinting },
    { name: 'Deployment Readiness', fn: verifyDeploymentReadiness }
  ];

  for (const gate of gates) {
    try {
        const res = await gate.fn(projectDir);
        automatedResults[gate.name] = res.status;
        const icon = res.status === 'PASS' ? chalk.green('✅') : res.status === 'SKIP' ? chalk.gray('⚪') : chalk.red('❌');
        console.log(`  ${icon} ${chalk.white(gate.name.padEnd(30))} [${res.status}] ${chalk.gray(`(${res.message})`)}`);
    } catch (e) {
        automatedResults[gate.name] = 'FAIL';
        printError(`  ❌ ${gate.name} failed to execute: ${e.message}`);
    }
  }
  return automatedResults;
}

/**
 * Use @Reviewer agent to verify the task against the 21-step framework
 */
async function runAiReview(taskName, provider, state, automatedResults) {
  const spinner = ora(`@Reviewer is verifying: "${taskName || 'Project'}"...`).start();

  try {
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();

    const projectContext = {
        state,
        graph: graphSummary,
        context: `Task to verify: ${taskName || 'All completed tasks'}\n\nAutomated Results:\n${JSON.stringify(automatedResults, null, 2)}`
    };

    const prompt = `
Verify the following task against the 21-Step Verification Framework:
"${taskName || 'Full Project Readiness'}"

The framework consists of:
${CHECKLIST.map((s, i) => `${i+1}. ${s}`).join('\n')}

Automated checks have already determined:
${JSON.stringify(automatedResults, null, 2)}

For steps NOT in automated results, verify them based on the codebase context.
For steps IN automated results, use the provided status (do not hallucinate).

Output a report in this format:
[ ] Step Name: [PASS/FAIL/SKIP] - Reasoning

Final Verdict: [APPROVED/REJECTED]
`;

    const report = await runAgentLoop('reviewer', prompt, provider, projectContext);
    spinner.succeed('Verification complete.');

    printInfo('\n📋 AI Verification Report:');
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(report));
    console.log(chalk.gray('─'.repeat(50)));
    
    return report;
  } catch (e) {
    spinner.fail(chalk.red('AI Verification failed'));
    throw new AppError('AI verification loop failed', { cause: e });
  }
}

/**
 * Handle the final verdict from the verification report
 */
function displayFinalVerdict(report) {
    if (report.includes('REJECTED')) {
        printError('\n❌ Task failed verification. Please address the issues above.');
        // We don't exit here, but return failure so the command action can handle it
        const err = new AppError('Verification rejected by AI reviewer', { code: 'VERIFICATION_REJECTED' });
        err.exitCode = 1;
        throw err;
    } else {
        printSuccess('\n✅ Task passed verification! Deployment recommended.');
    }
}