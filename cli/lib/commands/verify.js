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

const CHECKLIST = [
  "Atomic Scope Defined", "Context Loaded", "Architecture Alignment", 
  "Security Patterns Applied", "Type Safety Check", "Error Handling Strategy",
  "API Documentation Updated", "Database Schema Verified", "Environment Variables Set",
  "Implementation Complete", "Console Logs Removed", "Edge Cases Handled",
  "Performance Check", "Accessibility (A11y) Check", "Cross-browser Check",
  "Unit Tests Passed", "Integration Tests Passed", "Linting & Formatting",
  "Code Review Approved", "Migration Scripts Ready", "Deployment Readiness"
];

async function runAutomatedCheck(name, command) {
    try {
        execSync(command, { stdio: 'ignore' });
        return { name, status: 'PASS' };
    } catch {
        return { name, status: 'FAIL' };
    }
}

export async function verifyCommand(taskName, options) {
  console.log(chalk.cyan.bold('\n⚖️  Ultra-Dex 21-Step Verification\n'));
  
  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId);
  const state = await loadState();
  const automatedResults = {};

  // 1. Automated Checks
  console.log(chalk.bold('1. Running Automated Gates...\n'));
  
  // Type Safety
  if (await fs.stat('tsconfig.json').catch(() => false)) {
      const res = await runAutomatedCheck('Type Safety Check', 'npx tsc --noEmit');
      automatedResults['Type Safety Check'] = res.status;
      console.log(`  ${res.status === 'PASS' ? '✅' : '❌'} Type Safety Check`);
  }

  // Tests
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8').catch(() => '{}'));
  if (pkg.scripts?.test) {
      const res = await runAutomatedCheck('Unit Tests Passed', 'npm test');
      automatedResults['Unit Tests Passed'] = res.status;
      console.log(`  ${res.status === 'PASS' ? '✅' : '❌'} Unit Tests Passed`);
  }

  // Linting
  if (pkg.scripts?.lint) {
      const res = await runAutomatedCheck('Linting & Formatting', 'npm run lint');
      automatedResults['Linting & Formatting'] = res.status;
      console.log(`  ${res.status === 'PASS' ? '✅' : '❌'} Linting & Formatting`);
  }

  // Quality Scan (Security, Console Logs)
  const scanResults = await runQualityScan(process.cwd());
  const securityPass = !scanResults.details.some(d => d.severity === 'critical');
  const logsPass = !scanResults.details.some(d => d.ruleId === 'console-log-in-api');
  
  automatedResults['Security Patterns Applied'] = securityPass ? 'PASS' : 'FAIL';
  automatedResults['Console Logs Removed'] = logsPass ? 'PASS' : 'FAIL';
  
  console.log(`  ${securityPass ? '✅' : '❌'} Security Patterns Applied`);
  console.log(`  ${logsPass ? '✅' : '❌'} Console Logs Removed`);

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
