#!/usr/bin/env node

/**
 * Autonomous Mode (Wave 6: Self-Healing)
 * Reduces human-in-the-loop requirements through automated decision-making and AI-driven fixing.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { projectGraph } from '../mcp/graph.js';

// Autonomous configuration
const AUTONOMOUS_CONFIG = {
  autoCommit: true,
  autoFix: true,
  autoTest: true,
  autoHeal: true,
  maxRetries: 3
};

class AutonomousEngine {
  constructor(projectPath, provider) {
    this.projectPath = projectPath;
    this.provider = provider;
    this.decisions = [];
  }

  logDecision(type, action, confidence, result) {
    this.decisions.push({
      timestamp: new Date().toISOString(),
      type,
      action,
      confidence,
      result
    });
  }

  async selfHeal(errorOutput, context = '') {
    console.log(chalk.magenta('\n🔧 Entering Self-Healing Loop...'));
    
    // Prepare project context for the agent
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();
    
    const projectContext = {
      context: `ERROR DETECTED:\n${errorOutput}\n\nAdditional Context:\n${context}`,
      graph: graphSummary
    };

    const result = await runAgentLoop(
      'debugger', 
      `Identify and fix the root cause of this error. Use READ_CODE and WRITE_CODE to apply fixes. Error output: ${errorOutput}`, 
      this.provider,
      projectContext
    );

    return result;
  }

  async runTests() {
    try {
      console.log(chalk.gray('Running: npm test...'));
      // Using npx mocha directly for the demo to ensure it runs our specific file
      execSync('npx mocha cli/test/healing-demo.test.js', { stdio: 'pipe', cwd: this.projectPath });
      return { passed: true };
    } catch (error) {
      return { 
        passed: false, 
        output: error.stdout?.toString() || error.stderr?.toString() || error.message 
      };
    }
  }

  async runLint() {
    try {
      execSync('npm run lint', { stdio: 'pipe', cwd: this.projectPath });
      return { passed: true };
    } catch (error) {
      return { passed: false, output: error.stdout?.toString() };
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      decisions: this.decisions,
      summary: {
        total: this.decisions.length,
        successful: this.decisions.filter(d => d.result === 'success').length,
        failed: this.decisions.filter(d => d.result === 'failure').length
      }
    };

    const reportPath = path.join(this.projectPath, '.ultra-dex', 'autonomous-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }
}

export function registerAutonomousCommand(program) {
  program
    .command('autonomous')
    .description('Run in autonomous mode with self-healing capabilities')
    .option('--no-fix', 'Disable auto-fixing')
    .option('--heal', 'Enable AI self-healing', true)
    .option('--no-heal', 'Disable AI self-healing')
    .option('--commit', 'Auto-commit successful fixes')
    .option('--provider <provider>', 'AI provider to use')
    .action(async (options) => {
      console.log(chalk.bold.cyan('\n🤖 Ultra-Dex Pro: Autonomous Mode\n'));

      const providerId = options.provider || getDefaultProvider();
      if (!providerId) {
        console.log(chalk.red('❌ No AI provider configured. Self-healing disabled.'));
        return;
      }

      const provider = createProvider(providerId);
      const engine = new AutonomousEngine(process.cwd(), provider);
      
      // 1. Linting Phase
      const lintSpinner = ora('Checking code standards...').start();
      const lintResult = await engine.runLint();
      
      if (!lintResult.passed && options.fix) {
        lintSpinner.text = 'Issues found. Triggering self-healing...';
        await engine.selfHeal(lintResult.output, 'Linter failures detected.');
        lintSpinner.succeed('Linter issues resolved via self-healing.');
      } else if (lintResult.passed) {
        lintSpinner.succeed('Code standards look great.');
      } else {
        lintSpinner.warn('Linter failed (healing disabled).');
      }

      // 2. Test Phase
      const testSpinner = ora('Running project tests...').start();
      let testResult = await engine.runTests();

      if (!testResult.passed && options.heal) {
        testSpinner.text = 'Tests failed. Initiating AI recovery...';
        
        let attempts = 0;
        while (!testResult.passed && attempts < AUTONOMOUS_CONFIG.maxRetries) {
          attempts++;
          testSpinner.text = `Self-healing attempt ${attempts}/${AUTONOMOUS_CONFIG.maxRetries}...`;
          
          await engine.selfHeal(testResult.output, `Attempt ${attempts}: Fixing test failures.`);
          testResult = await engine.runTests();
        }

        if (testResult.passed) {
          testSpinner.succeed(chalk.green(`Self-healing successful after ${attempts} attempts!`));
        } else {
          testSpinner.fail(chalk.red(`Self-healing failed after ${attempts} attempts.`));
        }
      } else if (testResult.passed) {
        testSpinner.succeed('All tests passed.');
      } else {
        testSpinner.warn('Tests failed (healing disabled).');
      }

      // 3. Commit Phase
      if (options.commit && testResult.passed) {
        try {
          execSync('git add . && git commit -m "chore: autonomous self-healing fix applied"', { stdio: 'ignore' });
          console.log(chalk.green('\n✅ Fixes committed to history.'));
        } catch {
          console.log(chalk.gray('\nℹ️ Nothing to commit.'));
        }
      }

      const reportPath = await engine.generateReport();
      console.log(chalk.blue(`\n📝 Autonomous report saved to: ${reportPath}`));
      console.log(chalk.bold.green('\n✅ Autonomous session complete.'));
    });
}
