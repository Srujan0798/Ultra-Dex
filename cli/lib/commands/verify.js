/**
 * ultra-dex verify command
 * Executable 21-step verification framework
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { loadState } from './plan.js';
import { projectGraph } from '../mcp/graph.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { buildDiffSummary, applyDiffSummary } from './brain.js';
import { VERIFICATION_STEPS, summarizeSteps } from '../verify/21-steps.js';
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
      .option('--json', 'Output results as JSON')
      .option('--template <path>', 'Template file path (optional)')
      .option('--live', 'Run active verification (automated gates only)')
      .option('--pre-push', 'Run pre-push checks (update CONTEXT.md + live gates)')
      .option('--full', 'Run full 21-step verification')
      .action(async (task, options) => {
          try {
              if (options.prePush) {
                  await runPrePushChecks();
              } else if (options.live) {
                  await verifyLive(process.cwd());
              } else if (options.full) {
                  await verifyCommand(task, options);
              } else {
                  await verifyCommand(task, options);
              }
          } catch (error) {
              await handleError(error, { command: 'verify', task, options });
              process.exit(error.exitCode || 1);
          }
      });
}

/**
 * Live verification mode (Automated Gates Only)
 */
export async function verifyLive(projectDir) {
    printInfo('\n⚡ Ultra-Dex Active Verification (Live Mode)\n');
    const results = await runAutomatedGates(projectDir);
    
    const failures = Object.entries(results).filter(([_, status]) => status === 'FAIL');

    if (failures.length > 0) {
        printError(`\n❌ Verification Failed: ${failures.length} checks failed.`);
        failures.forEach(([name]) => printError(`  - ${name}`));
        const error = new Error('Live verification failed');
        error.exitCode = 1;
        throw error;
    }
    
    printSuccess('\n✅ Active Verification Passed');
}

async function runPrePushChecks() {
    printInfo('\n🔒 Ultra-Dex Pre-Push Verification\n');

    const contextUpdated = await updateContextWithDiff();
    if (contextUpdated) {
        printWarning('CONTEXT.md updated from git diff. Please commit the changes before pushing.');
        const err = new AppError('CONTEXT.md updated - commit required', { code: 'CONTEXT_UPDATE_REQUIRED' });
        err.exitCode = 1;
        throw err;
    }

    await verifyLive(process.cwd());
}

async function updateContextWithDiff() {
    const contextPath = path.resolve(process.cwd(), 'CONTEXT.md');
    let contextContent = '';
    try {
        contextContent = await fs.readFile(contextPath, 'utf8');
    } catch {
        contextContent = '# Project Context\n';
    }

    const diffSummary = await buildDiffSummary();
    const updated = await applyDiffSummary(contextContent, diffSummary);

    if (updated !== contextContent) {
        await fs.writeFile(contextPath, updated);
        return true;
    }

    return false;
}

/**
 * Core verification logic
 */
export async function verifyCommand(taskName, options) {
  if (options.json) {
    try {
      const templatePath = path.resolve(process.cwd(), options.template || 'IMPLEMENTATION-PLAN.md');
      const contextPath = path.resolve(process.cwd(), 'CONTEXT.md');
      const planExists = await fs.stat(templatePath).then(() => true).catch(() => false);
      const contextExists = await fs.stat(contextPath).then(() => true).catch(() => false);

      let p0SectionsComplete = false;
      if (planExists) {
        const planContent = await fs.readFile(templatePath, 'utf-8');
        if (planContent.length > 100 && planContent.includes('##')) {
          p0SectionsComplete = true;
        }
      }

      const result = {
        valid: Boolean(planExists && contextExists),
        score: (planExists ? 50 : 0) + (contextExists ? 30 : 0) + (p0SectionsComplete ? 20 : 0),
        p0SectionsComplete,
        files: {
          plan: Boolean(planExists),
          context: Boolean(contextExists)
        }
      };

      console.log(JSON.stringify(result, null, 2));
      return;
    } catch (error) {
      console.log(JSON.stringify({ valid: false, error: error.message }));
      return;
    }
  }

  printInfo('\n⚖️  Ultra-Dex 21-Step Verification\n');
  
  const providerId = options.provider || getDefaultProvider();
  const provider = createProvider(providerId);
  const state = await loadState();
  const projectDir = process.cwd();

  // 1. Automated Checks
  printInfo(chalk.bold('1. Running Automated Gates...\n'));
  const automatedResults = await runAutomatedGates(projectDir);
  reportBlockers(automatedResults);
  printInfo('');

  // 2. AI Review
  printInfo(chalk.bold('2. Initiating AI Deep Review...\n'));
  const report = await runAiReview(taskName, provider, state, automatedResults);

  // 3. Final Verdict
  displayFinalVerdict(report);
}

function reportBlockers(results) {
  const failures = Object.entries(results).filter(([_, status]) => status === 'FAIL');
  if (!failures.length) return;
  printWarning(chalk.yellow('\nBlockers detected:'));
  failures.forEach(([name]) => printWarning(`  - ${name}`));
}

export function listVerificationSteps() {
  const phases = summarizeSteps();
  Object.entries(phases).forEach(([phase, steps]) => {
    printInfo(chalk.bold(`\n${phase}`));
    steps.forEach(step => printInfo(`  ${step.id}. ${step.name}`));
  });
  return VERIFICATION_STEPS;
}

/**
 * Execute all automated verification gates
 */
export async function runAutomatedGates(projectDir) {
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
        printInfo(`  ${icon} ${chalk.white(gate.name.padEnd(30))} [${res.status}] ${chalk.gray(`(${res.message})`)}`);
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
    printInfo(chalk.gray('─'.repeat(50)));
    printInfo(chalk.white(report));
    printInfo(chalk.gray('─'.repeat(50)));

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
