/**
 * ultra-dex verify command
 * Executable 21-step verification framework
 */

import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { loadState } from './plan.js';
import { projectGraph } from '../mcp/graph.js';
import { runQualityScan } from '../quality/scanner.js';
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

export async function verifyCommand(taskName, options) {
  console.log(chalk.cyan.bold('\n⚖️  Ultra-Dex 21-Step Verification\n'));
  
  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId);
  const state = await loadState();
  const automatedResults = {};

  const projectDir = process.cwd();

  // 1. Automated Checks
  console.log(chalk.bold('1. Running Automated Gates...\n'));
  
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
    const res = await gate.fn(projectDir);
    automatedResults[gate.name] = res.status;
    const icon = res.status === 'PASS' ? '✅' : res.status === 'SKIP' ? '⚪' : '❌';
    console.log(`  ${icon} ${gate.name} (${res.message})`);
  }

  console.log('');

  // 2. AI Review
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
