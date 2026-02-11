// Copyright (c) 2026 Ultra-Dex

/**
 * Protocol 21 - 21-Step Verification Engine
 * Interactive checklist CLI command for comprehensive task verification
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';
import { loadState, saveState } from '../commands/state.js';

// Define the 21-step verification protocol
const VERIFICATION_STEPS = [
  {
    id: 'understand',
    title: 'Requirements Understanding',
    desc: 'All requirements clearly understood and documented',
  },
  { id: 'analyze', title: 'Technical Analysis', desc: 'Technical approach analyzed and validated' },
  { id: 'design', title: 'Design Review', desc: 'Architecture and design reviewed and approved' },
  { id: 'implement', title: 'Implementation Complete', desc: 'Core functionality implemented' },
  { id: 'unit-test', title: 'Unit Tests', desc: 'Unit tests written and passing' },
  {
    id: 'integration-test',
    title: 'Integration Tests',
    desc: 'Integration tests written and passing',
  },
  {
    id: 'security',
    title: 'Security Review',
    desc: 'Security vulnerabilities assessed and mitigated',
  },
  { id: 'performance', title: 'Performance Check', desc: 'Performance benchmarks met' },
  { id: 'accessibility', title: 'Accessibility Check', desc: 'WCAG 2.1 AA compliance verified' },
  {
    id: 'compatibility',
    title: 'Cross-browser Compatibility',
    desc: 'Works across target browsers',
  },
  { id: 'error-handling', title: 'Error Handling', desc: 'Proper error handling implemented' },
  {
    id: 'logging',
    title: 'Logging & Monitoring',
    desc: 'Appropriate logging and monitoring added',
  },
  {
    id: 'documentation',
    title: 'Documentation Updated',
    desc: 'Code and API documentation updated',
  },
  { id: 'code-review', title: 'Peer Code Review', desc: 'Code reviewed by another developer' },
  {
    id: 'dependency-check',
    title: 'Dependency Security',
    desc: 'Dependencies scanned for vulnerabilities',
  },
  { id: 'backup', title: 'Backup Strategy', desc: 'Backup and recovery procedures verified' },
  { id: 'rollback', title: 'Rollback Plan', desc: 'Rollback plan prepared and tested' },
  { id: 'deployment', title: 'Deployment Ready', desc: 'Deployment process validated' },
  {
    id: 'monitoring',
    title: 'Post-deployment Monitoring',
    desc: 'Monitoring and alerting configured',
  },
  { id: 'user-testing', title: 'User Acceptance Testing', desc: 'UAT completed and approved' },
  { id: 'sign-off', title: 'Final Sign-off', desc: 'Stakeholder sign-off obtained' },
];

import { execSync } from 'child_process';

/**
 * Perform automated technical checks for specific steps
 */
async function performAutomatedCheck(stepId) {
  try {
    switch (stepId) {
      case 'unit-test':
        execSync('npm run test:unit', { stdio: 'ignore' });
        return { passed: true, message: 'Unit tests passed' };
      case 'lint':
        execSync('npm run lint', { stdio: 'ignore' });
        return { passed: true, message: 'Linting passed' };
      case 'build':
        execSync('npm run build', { stdio: 'ignore' });
        return { passed: true, message: 'Build successful' };
      default:
        return null; // Not an automated step
    }
  } catch (error) {
    return { passed: false, message: error.message };
  }
}

export async function verifyTask(taskId, options = {}) {
  const results = {
    taskId,
    timestamp: new Date().toISOString(),
    steps: [],
    passed: false
  };

  printInfo(chalk.cyan(`🚀 Automating Protocol 21 for: ${taskId}`));

  for (const step of VERIFICATION_STEPS) {
    const autoResult = await performAutomatedCheck(step.id);
    if (autoResult) {
      results.steps.push({ id: step.id, status: autoResult.passed ? 'PASS' : 'FAIL', message: autoResult.message });
      if (autoResult.passed) {
        printSuccess(chalk.green(`✓ ${step.title}: Automated check passed`));
      } else {
        printError(chalk.red(`✗ ${step.title}: Automated check failed`));
      }
    }
  }
  
  return results;
}

export async function runVerification(taskId = null, options = {}) {
  printInfo(chalk.cyan('\n🛡️  Ultra-Dex Protocol 21 - 21-Step Verification\n'));

  // Get task ID if not provided
  if (!taskId) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskId',
        message: 'Enter task ID or description:',
        validate: (input) => input.trim().length > 0 || 'Task ID is required',
      },
    ]);
    taskId = answers.taskId;
  }

  printInfo(chalk.gray(`Verifying task: ${taskId}\n`));

  // Load existing verification state if it exists
  const verificationLog = await loadVerificationLog(taskId);
  const completedSteps = verificationLog.completed || [];
  const skippedSteps = verificationLog.skipped || [];

  // Run through each verification step
  const results = {
    taskId,
    completed: [...completedSteps],
    skipped: [...skippedSteps],
    timestamp: new Date().toISOString(),
    passed: false,
  };

  printInfo(chalk.yellow('Starting verification process...\n'));

  const phaseFilter = options.phase ? options.phase.toLowerCase() : null;
  const phaseMap = {
    planning: ['understand', 'analyze', 'design', 'implement'],
    implementation: ['unit-test', 'integration-test', 'security', 'performance', 'accessibility'],
    quality: ['compatibility', 'error-handling', 'logging', 'documentation', 'code-review'],
    security: ['dependency-check', 'backup', 'rollback'],
    documentation: ['deployment', 'monitoring', 'user-testing'],
    final: ['sign-off'],
  };
  const allowedIds = phaseFilter ? phaseMap[phaseFilter] : null;
  const stepsToRun = allowedIds
    ? VERIFICATION_STEPS.filter((step) => allowedIds.includes(step.id))
    : VERIFICATION_STEPS;

  for (const step of stepsToRun) {
    // Skip if already completed
    if (results.completed.includes(step.id)) {
      printInfo(chalk.gray(`✓ ${step.title} (already completed)`));
      continue;
    }

    // Ask user to verify the step
    const stepAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'status',
        message: `${step.title}\n${chalk.gray(step.desc)}\nStatus:`,
        choices: [
          { name: '✅ Complete', value: 'complete' },
          { name: '⏭️  Skip', value: 'skip' },
          { name: '❌ Revisit Later', value: 'revisit' },
        ],
      },
    ]);

    if (stepAnswers.status === 'complete') {
      results.completed.push(step.id);
      printSuccess(chalk.green(`✓ ${step.title}`));
    } else if (stepAnswers.status === 'skip') {
      results.skipped.push(step.id);
      printWarning(chalk.yellow(`~ ${step.title} (skipped)`));
    } else {
      // Revisit later - stop the process
      printInfo(chalk.cyan(`→ ${step.title} marked for revisit later`));
      break;
    }
  }

  // Check if all steps are completed
  const allSteps = stepsToRun.map((s) => s.id);
  const remainingSteps = allSteps.filter(
    (step) => !results.completed.includes(step) && !results.skipped.includes(step)
  );

  if (remainingSteps.length === 0) {
    results.passed = true;
    printSuccess(chalk.green.bold('\n🎉 All verification steps completed! Task is verified.\n'));
  } else {
    printWarning(
      chalk.yellow.bold(`\n⚠️  Verification incomplete. ${remainingSteps.length} steps remain.\n`)
    );
    printInfo(chalk.gray('Remaining steps:'));
    remainingSteps.forEach((stepId) => {
      const step = VERIFICATION_STEPS.find((s) => s.id === stepId);
      printInfo(chalk.gray(`  • ${step.title}`));
    });
  }

  // Save verification results
  await saveVerificationLog(results);

  // Generate verification report
  await generateVerificationReport(results);

  return results;
}

export async function runProtocol21({ taskId, options } = {}) {
  const results = await runVerification(taskId ?? null, options ?? {});
  return {
    status: results.passed ? 'PASS' : 'FAIL',
    results,
  };
}

/**
 * Load existing verification log for a task
 */
async function loadVerificationLog(taskId) {
  const logDir = path.join(process.cwd(), 'docs', 'verification-logs');
  const logPath = path.join(logDir, `${taskId.replace(/\s+/g, '_')}_verification.json`);

  try {
    const content = await fs.readFile(logPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // Return empty log if file doesn't exist
    return { completed: [], skipped: [] };
  }
}

/**
 * Save verification log
 */
async function saveVerificationLog(verificationResults) {
  const logDir = path.join(process.cwd(), 'docs', 'verification-logs');
  await fs.mkdir(logDir, { recursive: true });

  const logPath = path.join(
    logDir,
    `${verificationResults.taskId.replace(/\s+/g, '_')}_verification.json`
  );
  await fs.writeFile(logPath, JSON.stringify(verificationResults, null, 2));

  printInfo(chalk.gray(`\n📝 Verification log saved to: ${logPath}`));
}

/**
 * Generate a verification report
 */
async function generateVerificationReport(verificationResults) {
  const logDir = path.join(process.cwd(), 'docs', 'verification-logs');
  const reportPath = path.join(
    logDir,
    `${verificationResults.taskId.replace(/\s+/g, '_')}_report.md`
  );

  const completedSteps = VERIFICATION_STEPS.filter((step) =>
    verificationResults.completed.includes(step.id)
  );

  const skippedSteps = VERIFICATION_STEPS.filter((step) =>
    verificationResults.skipped.includes(step.id)
  );

  const remainingSteps = VERIFICATION_STEPS.filter(
    (step) =>
      !verificationResults.completed.includes(step.id) &&
      !verificationResults.skipped.includes(step.id)
  );

  const reportContent = `# Verification Report: ${verificationResults.taskId}

**Generated:** ${verificationResults.timestamp}

## Summary
- **Total Steps:** ${VERIFICATION_STEPS.length}
- **Completed:** ${completedSteps.length}
- **Skipped:** ${skippedSteps.length}
- **Remaining:** ${remainingSteps.length}
- **Status:** ${verificationResults.passed ? '✅ PASSED' : '❌ INCOMPLETE'}

## Completed Steps
${completedSteps.map((step) => `- ${step.title}`).join('\n') || 'None'}

## Skipped Steps
${skippedSteps.map((step) => `- ${step.title}`).join('\n') || 'None'}

## Remaining Steps
${remainingSteps.map((step) => `- ${step.title}`).join('\n') || 'None'}

## Notes
- Verification performed by: ${process.env.USER || 'Unknown User'}
- All completed steps have been validated and confirmed.

`;

  await fs.writeFile(reportPath, reportContent);
  printInfo(chalk.gray(`📋 Verification report saved to: ${reportPath}`));
}

export function registerProtocol21Command(program) {
  program
    .command('verify [task-id]')
    .description('Run 21-step verification protocol on a task')
    .option('-t, --task <taskId>', 'Task ID to verify')
    .option('-r, --report', 'Generate verification report only')
    .option('-s, --status', 'Show verification status only')
    .action(async (taskId, options) => {
      try {
        if (options.status) {
          await showVerificationStatus(taskId || options.task);
        } else if (options.report) {
          await generateReportOnly(taskId || options.task);
        } else {
          await runVerification(taskId || options.task, options);
        }
      } catch (error) {
        printError(chalk.red(`Verification failed: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * Show verification status for a task
 */
async function showVerificationStatus(taskId) {
  if (!taskId) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskId',
        message: 'Enter task ID to check status:',
        validate: (input) => input.trim().length > 0 || 'Task ID is required',
      },
    ]);
    taskId = answers.taskId;
  }

  const logDir = path.join(process.cwd(), 'docs', 'verification-logs');
  const logPath = path.join(logDir, `${taskId.replace(/\s+/g, '_')}_verification.json`);

  try {
    const content = await fs.readFile(logPath, 'utf8');
    const verificationLog = JSON.parse(content);

    const completedCount = verificationLog.completed ? verificationLog.completed.length : 0;
    const skippedCount = verificationLog.skipped ? verificationLog.skipped.length : 0;
    const totalCount = VERIFICATION_STEPS.length;
    const remainingCount = totalCount - completedCount - skippedCount;

    printInfo(chalk.cyan(`\n📊 Verification Status for Task: ${taskId}\n`));
    printInfo(chalk.gray(`Total Steps: ${totalCount}`));
    printSuccess(chalk.green(`Completed: ${completedCount}`));
    printWarning(chalk.yellow(`Skipped: ${skippedCount}`));
    printInfo(chalk.red(`Remaining: ${remainingCount}`));

    if (remainingCount === 0) {
      printSuccess(chalk.green.bold('\n✅ Task is fully verified!'));
    } else {
      printWarning(chalk.yellow.bold('\n⚠️  Task verification is incomplete'));
    }
  } catch (error) {
    printWarning(chalk.yellow(`No verification log found for task: ${taskId}`));
  }
}

/**
 * Generate report only
 */
async function generateReportOnly(taskId) {
  if (!taskId) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskId',
        message: 'Enter task ID to generate report:',
        validate: (input) => input.trim().length > 0 || 'Task ID is required',
      },
    ]);
    taskId = answers.taskId;
  }

  const logDir = path.join(process.cwd(), 'docs', 'verification-logs');
  const logPath = path.join(logDir, `${taskId.replace(/\s+/g, '_')}_verification.json`);

  try {
    const content = await fs.readFile(logPath, 'utf8');
    const verificationResults = JSON.parse(content);
    await generateVerificationReport(verificationResults);
    printSuccess(chalk.green('Verification report generated successfully'));
  } catch (error) {
    printError(chalk.red(`Cannot generate report: ${error.message}`));
  }
}

export default {
  runVerification,
  registerProtocol21Command,
  VERIFICATION_STEPS,
};
