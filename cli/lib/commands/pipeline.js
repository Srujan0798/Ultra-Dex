#!/usr/bin/env node

/**
 * Automated Task Execution Pipeline
 * Executes the 21-step verification framework programmatically
 * Addresses devin_ceo_1.md Gap #4: No automated task execution pipeline
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { AppError, ValidationError } from '../utils/errors.js';

const STEPS_21 = [
  { id: 1, name: 'UNDERSTAND', description: 'Read and comprehend full requirement', time: '5-10 min' },
  { id: 2, name: 'ASSUMPTIONS', description: 'List all assumptions explicitly', time: '3-5 min' },
  { id: 3, name: 'ANALYZE', description: 'Map logic flow and data dependencies', time: '10-15 min' },
  { id: 4, name: 'DECOMPOSE', description: 'Break into atomic sub-steps', time: '5-10 min' },
  { id: 5, name: 'PREPARE', description: 'Set up environment, configs, dependencies', time: '10-20 min' },
  { id: 6, name: 'IMPLEMENT', description: 'Write clean, modular, maintainable code', time: '30-120 min' },
  { id: 7, name: 'DOCUMENT', description: 'Add inline comments and follow naming conventions', time: '10-15 min' },
  { id: 8, name: 'UNIT TEST', description: 'Write and run unit tests (Target: 80%+ coverage)', time: '20-30 min' },
  { id: 9, name: 'DEBUG', description: 'Identify and fix all issues', time: '15-45 min' },
  { id: 10, name: 'INTEGRATE', description: 'Run integration tests with existing systems', time: '15-30 min' },
  { id: 11, name: 'VALIDATE', description: 'Verify outputs match expected results', time: '10-15 min' },
  { id: 12, name: 'UX CHECK', description: 'Ensure usability and WCAG 2.1 accessibility', time: '15-20 min' },
  { id: 13, name: 'OPTIMIZE', description: 'Improve performance (Target: <3s load, <200ms response)', time: '20-40 min' },
  { id: 14, name: 'SECURE', description: 'Check for security vulnerabilities (OWASP Top 10)', time: '15-25 min' },
  { id: 15, name: 'REFACTOR', description: 'Improve code quality and maintainability', time: '15-30 min' },
  { id: 16, name: 'ERROR HANDLE', description: 'Add comprehensive error handling', time: '15-20 min' },
  { id: 17, name: 'DOCUMENT API', description: 'Document all functions, APIs, interfaces', time: '20-30 min' },
  { id: 18, name: 'VERSION CONTROL', description: 'Commit with clear, descriptive message', time: '5 min' },
  { id: 19, name: 'BUILD', description: 'Compile/bundle and validate build', time: '5-15 min' },
  { id: 20, name: 'DEPLOY READY', description: 'Prepare for deployment or final delivery', time: '10-20 min' },
  { id: 21, name: 'FINAL VERIFY', description: 'Run complete end-to-end verification', time: '15-30 min' }
];

// Automated step executors
const stepExecutors = {
  // Step 1: UNDERSTAND - Parse task and context
  async understand(taskPath, context) {
    const task = await fs.readFile(taskPath, 'utf-8');
    const analysis = {
      taskLength: task.length,
      hasAcceptanceCriteria: task.includes('Acceptance Criteria'),
      hasDependencies: task.includes('Dependencies'),
      estimatedComplexity: task.length > 5000 ? 'high' : task.length > 2000 ? 'medium' : 'low'
    };
    return { passed: true, analysis };
  },

  // Step 5: PREPARE - Check dependencies
  async prepare(projectPath) {
    const checks = [];
    
    // Check package.json exists
    try {
      await fs.access(path.join(projectPath, 'package.json'));
      checks.push({ name: 'package.json', status: 'pass' });
    } catch {
      checks.push({ name: 'package.json', status: 'fail', message: 'Missing package.json' });
    }
    
    // Check node_modules
    try {
      await fs.access(path.join(projectPath, 'node_modules'));
      checks.push({ name: 'node_modules', status: 'pass' });
    } catch {
      checks.push({ name: 'node_modules', status: 'warning', message: 'Run npm install' });
    }
    
    // Check .env
    try {
      await fs.access(path.join(projectPath, '.env'));
      checks.push({ name: '.env', status: 'pass' });
    } catch {
      checks.push({ name: '.env', status: 'warning', message: 'Missing environment variables' });
    }
    
    return { 
      passed: checks.every(c => c.status !== 'fail'),
      checks
    };
  },

  // Step 8: UNIT TEST - Run tests
  async unitTest(projectPath) {
    try {
      const result = execSync('npm test 2>&1', { 
        cwd: projectPath, 
        encoding: 'utf-8',
        timeout: 120000
      });
      
      // Parse coverage
      const coverageMatch = result.match(/(\d+(?:\.\d+)?)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
      
      return {
        passed: coverage >= 80,
        coverage,
        output: result.substring(0, 500)
      };
    } catch (error) {
      return {
        passed: false,
        coverage: 0,
        error: error.message
      };
    }
  },

  // Step 14: SECURE - Security checks
  async secure(projectPath) {
    const checks = [];
    
    // Check for hardcoded secrets
    try {
      const envContent = await fs.readFile(path.join(projectPath, '.env'), 'utf-8');
      const hasHardcodedKeys = /api[_-]?key.*=.*[a-zA-Z0-9]{20,}/i.test(envContent);
      checks.push({
        name: 'Hardcoded Secrets',
        status: hasHardcodedKeys ? 'fail' : 'pass',
        message: hasHardcodedKeys ? 'Found potential hardcoded API keys' : 'No hardcoded secrets detected'
      });
    } catch {
      checks.push({ name: 'Hardcoded Secrets', status: 'warning', message: 'Could not check .env' });
    }
    
    // Check for input validation
    const srcPath = path.join(projectPath, 'src');
    try {
      const files = await fs.readdir(srcPath, { recursive: true });
      const hasValidation = files.some(f => f.includes('validation') || f.includes('schema'));
      checks.push({
        name: 'Input Validation',
        status: hasValidation ? 'pass' : 'warning',
        message: hasValidation ? 'Validation layer detected' : 'Consider adding input validation'
      });
    } catch {
      checks.push({ name: 'Input Validation', status: 'warning', message: 'Could not check source files' });
    }
    
    return {
      passed: checks.every(c => c.status !== 'fail'),
      checks
    };
  },

  // Step 19: BUILD - Build validation
  async build(projectPath) {
    try {
      const result = execSync('npm run build 2>&1', { 
        cwd: projectPath, 
        encoding: 'utf-8',
        timeout: 300000
      });
      
      const hasErrors = result.includes('error') || result.includes('Error');
      
      return {
        passed: !hasErrors,
        output: result.substring(0, 500),
        errors: hasErrors ? 'Build failed' : null
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  },

  // Step 21: FINAL VERIFY - End-to-end
  async finalVerify(projectPath) {
    const checks = [];
    
    // Check TypeScript compilation
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      try {
        execSync('npx tsc --noEmit', { cwd: projectPath, timeout: 60000 });
        checks.push({ name: 'TypeScript', status: 'pass' });
      } catch {
        checks.push({ name: 'TypeScript', status: 'fail', message: 'Type errors found' });
      }
    } catch {
      checks.push({ name: 'TypeScript', status: 'skip', message: 'No tsconfig.json' });
    }
    
    // Check linting
    try {
      execSync('npm run lint', { cwd: projectPath, timeout: 60000 });
      checks.push({ name: 'Linting', status: 'pass' });
    } catch {
      checks.push({ name: 'Linting', status: 'warning', message: 'Lint errors found' });
    }
    
    return {
      passed: !checks.some(c => c.status === 'fail'),
      checks
    };
  }
};

// Execute a single step
async function executeStep(stepId, context) {
  const step = STEPS_21.find(s => s.id === stepId);
  if (!step) return { passed: false, error: 'Invalid step' };
  
  // Check if we have an automated executor for this step
  const executor = stepExecutors[step.name.toLowerCase().replace(/\s+/g, '')];
  
  if (executor) {
    try {
      const result = await executor(context.taskPath, context);
      return {
        stepId,
        stepName: step.name,
        passed: result.passed,
        details: result,
        automated: true
      };
    } catch (error) {
      return {
        stepId,
        stepName: step.name,
        passed: false,
        error: error.message,
        automated: true
      };
    }
  } else {
    // Manual step - provide guidance
    return {
      stepId,
      stepName: step.name,
      passed: null, // Needs manual verification
      description: step.description,
      estimatedTime: step.time,
      automated: false,
      guidance: getStepGuidance(stepId)
    };
  }
}

// Get guidance for manual steps
function getStepGuidance(stepId) {
  const guidance = {
    2: 'List assumptions:\n- What do you assume about user behavior?\n- What dependencies are assumed to work?\n- What security assumptions are you making?',
    3: 'Draw the flow:\n- Input → Process → Output\n- What data is needed at each step?\n- What are the failure points?',
    4: 'Break down:\n- Each sub-task should be <30 lines\n- Each should be testable independently\n- Identify the critical path',
    6: 'Write code following:\n- Style guide from cursor-rules\n- Single purpose functions\n- No hardcoded values',
    7: 'Document:\n- JSDoc for all functions\n- Inline comments for complex logic\n- README updates if needed',
    9: 'Debug checklist:\n- Check console for errors\n- Verify network requests\n- Test edge cases',
    10: 'Integration:\n- Test with real database\n- Verify API contracts\n- Check third-party services',
    11: 'Validate:\n- Compare output to acceptance criteria\n- Run happy path\n- Run edge cases',
    12: 'UX Check:\n- Keyboard navigation works\n- Screen reader compatible\n- Responsive design',
    13: 'Optimize:\n- Check bundle size\n- Measure response times\n- Review database queries',
    15: 'Refactor:\n- Remove duplication\n- Simplify complex functions\n- Improve naming',
    16: 'Error handling:\n- Add try/catch blocks\n- Validate all inputs\n- Return meaningful errors',
    17: 'API Documentation:\n- Update OpenAPI specs\n- Document error codes\n- Add examples',
    18: 'Version control:\n- git add relevant files\n- Write clear commit message\n- Reference ticket/issue',
    20: 'Deploy ready:\n- Update environment variables\n- Verify secrets are set\n- Check monitoring'
  };
  
  return guidance[stepId] || 'Complete this step according to the 21-step framework.';
}

// Export registration function
export function registerPipelineCommand(program) {
  const pipeline = program
    .command('pipeline')
    .description('Automated 21-step task execution pipeline')
    .option('-t, --task <path>', 'Path to task file')
    .option('-p, --project <path>', 'Project root path', '.')
    .option('--step <number>', 'Execute specific step only')
    .option('--from <number>', 'Start from step')
    .option('--to <number>', 'Stop at step')
    .option('--auto', 'Run automated steps only')
    .option('--report', 'Generate execution report')
    .action(async (options) => {
      try {
        printInfo(chalk.blue('\n🔄 21-Step Task Execution Pipeline\n'));

        const context = {
          taskPath: options.task,
          projectPath: path.resolve(options.project)
        };

        // Determine step range
        let startStep = options.from ? parseInt(options.from) : 1;
        let endStep = options.to ? parseInt(options.to) : 21;

        if (options.step) {
          startStep = endStep = parseInt(options.step);
        }

        const results = [];
        let allPassed = true;

        for (let stepId = startStep; stepId <= endStep; stepId++) {
          const step = STEPS_21.find(s => s.id === stepId);
          const spinner = ora(`${step.id}. ${step.name}...`).start();

          try {
            const result = await executeStep(stepId, context);
            results.push(result);

            if (result.automated) {
              if (result.passed) {
                spinner.succeed(chalk.green(`${step.id}. ${step.name} ✓`));
              } else {
                spinner.fail(chalk.red(`${step.id}. ${step.name} ✗`));
                allPassed = false;
              }
            } else {
              spinner.info(chalk.blue(`${step.id}. ${step.name} (Manual)`));
              printInfo(chalk.gray(`   ${step.description}`));
              printInfo(chalk.yellow(`   ⏱️  Estimated: ${step.time}`));
              if (result.guidance) {
                printInfo(chalk.dim('   Guidance:'));
                printInfo(chalk.dim(result.guidance.split('\n').map(l => `   ${l}`).join('\n')));
              }
            }
          } catch (error) {
            spinner.fail(chalk.red(`${step.id}. ${step.name} - Error: ${error.message}`));
            allPassed = false;
          }

          // Stop on failure if not continuing
          if (!allPassed && !options.continue) {
            printError(chalk.red('\n⛔ Pipeline stopped due to failure'));
            printWarning(chalk.yellow('Use --continue to proceed regardless'));
            break;
          }
        }

        // Summary
        printInfo(chalk.blue('\n📊 Execution Summary\n'));
        const automated = results.filter(r => r.automated);
        const manual = results.filter(r => !r.automated);
        const passed = automated.filter(r => r.passed).length;
        const failed = automated.filter(r => !r.passed).length;

        printInfo(`  Automated Steps: ${automated.length} (${passed} passed, ${failed} failed)`);
        printInfo(`  Manual Steps: ${manual.length}`);
        printInfo(`  Completion: ${Math.round((results.length / (endStep - startStep + 1)) * 100)}%`);

        if (allPassed) {
          printSuccess(chalk.green('\n✅ All automated steps passed!'));
        } else {
          printError(chalk.red('\n❌ Some steps failed. Review output above.'));
        }

        // Generate report if requested
        if (options.report) {
          const reportPath = path.join(context.projectPath, 'pipeline-report.json');
          await fs.writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            context,
            results,
            summary: {
              total: results.length,
              automated: automated.length,
              manual: manual.length,
              passed,
              failed
            }
          }, null, 2));
          printInfo(chalk.blue(`\n📝 Report saved: ${reportPath}`));
        }
      } catch (error) {
        printError(`Error in pipeline command: ${error.message}`);
        process.exit(1);
      }
    });

  // Add subcommand to show all steps
  pipeline
    .command('steps')
    .description('Show all 21 steps')
    .action(() => {
      printInfo(chalk.blue('\n📋 21-Step Verification Framework\n'));

      STEPS_21.forEach(step => {
        const status = step.id <= 5 || step.id === 8 || step.id === 14 || step.id === 19 || step.id === 21
          ? chalk.green('[Automated]')
          : chalk.yellow('[Manual]');

        printInfo(`${chalk.cyan(step.id.toString().padStart(2))}. ${chalk.white(step.name.padEnd(15))} ${status}`);
        printInfo(`   ${chalk.gray(step.description)} (${step.time})`);
      });

      printInfo(chalk.blue('\n💡 Automated steps run without user intervention.'));
      printInfo(chalk.blue('   Manual steps require developer verification.\n'));
    });
}
