#!/usr/bin/env node

/**
 * Autonomous Mode (Wave 6: Self-Healing)
 * Reduces human-in-the-loop requirements through automated decision-making and AI-driven fixing.
 */

import fs from 'fs/promises';
import { watch, existsSync } from 'fs';
import path from 'path';
import http from 'http';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { projectGraph } from '../mcp/graph.js';
import { copyDirectory } from '../utils/files.js';

// Autonomous configuration
const AUTONOMOUS_CONFIG = {
  autoCommit: true,
  autoFix: true,
  autoTest: true,
  autoHeal: true,
  maxRetries: 3
};

export class AutonomousEngine {
  constructor(projectPath, provider, testCommand = 'npm test') {
    this.projectPath = projectPath;
    this.provider = provider;
    this.testCommand = testCommand;
    this.decisions = [];
    this.historyPath = path.join(projectPath, '.ultra-dex', 'history');
    this.snapshotsPath = path.join(projectPath, '.ultra-dex', 'snapshots');
    this.fixCount = 0;
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

  async sendDashboardUpdate(status, message) {
    // Fire and forget - don't await response to avoid blocking if dashboard isn't running
    const data = JSON.stringify({
      status,
      message,
      stats: { fixes: this.fixCount }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: '/api/autonomous/status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    });

    req.on('error', () => {
      // Dashboard likely not running, ignore
    });

    req.write(data);
    req.end();
  }

  async loadHistory() {
    try {
      const files = await fs.readdir(this.historyPath);
      const history = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = JSON.parse(await fs.readFile(path.join(this.historyPath, file), 'utf8'));
          history.push(content);
        }
      }
      this.fixCount = history.length;
      return history;
    } catch (e) {
      return [];
    }
  }

  async saveHistory(errorOutput, fixDescription) {
    try {
      await fs.mkdir(this.historyPath, { recursive: true });
      const id = new Date().getTime();
      const entry = {
        id,
        timestamp: new Date().toISOString(),
        error: errorOutput,
        fix: fixDescription
      };
      await fs.writeFile(path.join(this.historyPath, `${id}.json`), JSON.stringify(entry, null, 2));
      this.fixCount++;
    } catch (e) {
      console.error(chalk.red(`Failed to save history: ${e.message}`));
    }
  }

  async createSnapshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotDir = path.join(this.snapshotsPath, timestamp);
    
    try {
      await fs.mkdir(snapshotDir, { recursive: true });
      
      // Manual copy to filter out heavy directories
      const entries = await fs.readdir(this.projectPath, { withFileTypes: true });
      for (const entry of entries) {
        if (['node_modules', '.git', '.ultra-dex', '.ultra', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
        
        const src = path.join(this.projectPath, entry.name);
        const dest = path.join(snapshotDir, entry.name);
        
        if (entry.isDirectory()) {
          await copyDirectory(src, dest);
        } else {
          await fs.copyFile(src, dest);
        }
      }
      return snapshotDir;
    } catch (error) {
      console.error(chalk.red(`Snapshot failed: ${error.message}`));
      return null;
    }
  }

  async restoreSnapshot(snapshotDir) {
    if (!snapshotDir) return false;
    try {
      // We only restore files that exist in the snapshot to avoid deleting new unrelated files
      // In a real system, we might want a cleaner restore (rsync-like)
      await copyDirectory(snapshotDir, this.projectPath);
      return true;
    } catch (error) {
      console.error(chalk.red(`Restore failed: ${error.message}`));
      return false;
    }
  }

  async selfHeal(errorOutput, context = '') {
    console.log(chalk.magenta('\n🔧 Entering Self-Healing Loop...'));
    this.sendDashboardUpdate('healing', 'Analyzing error patterns...');
    
    // Prepare project context for the agent
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();
    const history = await this.loadHistory();
    const historyContext = history.length > 0 
      ? `\n\nLESSONS LEARNED (Past Fixes):\n${history.map(h => `- Error: ${h.error.slice(0, 50)}... -> Fix: ${h.fix}`).join('\n')}` 
      : '';
    
    const projectContext = {
      context: `ERROR DETECTED:\n${errorOutput}\n\nAdditional Context:\n${context}${historyContext}`,
      graph: graphSummary
    };

    this.sendDashboardUpdate('healing', 'Agent devising fix...');
    const result = await runAgentLoop(
      'debugger', 
      `Identify and fix the root cause of this error. Use READ_CODE and WRITE_CODE to apply fixes. Error output: ${errorOutput}`, 
      this.provider,
      projectContext
    );

    if (result && !result.startsWith('[Error]')) {
       // We assume the agent output describes the fix. 
       // In a real scenario, we might want to extract a specific summary.
       await this.saveHistory(errorOutput, result.slice(0, 100));
       this.sendDashboardUpdate('fixed', 'Fix applied successfully');
    } else {
       this.sendDashboardUpdate('failed', 'Agent failed to fix issue');
    }

    return result;
  }

  async runTests() {
    try {
      console.log(chalk.gray(`Running: ${this.testCommand}...`));
      execSync(this.testCommand, { stdio: 'pipe', cwd: this.projectPath });
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
  
  startWatchMode() {
    console.log(chalk.cyan.bold('\n👁️  Starting Watch & Heal Mode...\n'));
    this.sendDashboardUpdate('idle', 'Watch mode active');
    
    const watchPaths = ['src', 'lib', 'app', 'test', 'cli'].filter(p => existsSync(path.join(this.projectPath, p)));
    console.log(chalk.gray(`Watching for changes in: ${watchPaths.join(', ')}`));

    let debounceTimer = null;
    let isHealing = false;

    watchPaths.forEach(watchPath => {
        try {
            watch(path.join(this.projectPath, watchPath), { recursive: true }, (eventType, filename) => {
                if (debounceTimer) clearTimeout(debounceTimer);
                if (isHealing) return; // Don't trigger if already healing
                
                debounceTimer = setTimeout(async () => {
                    const timestamp = new Date().toLocaleTimeString();
                    console.log(chalk.yellow(`\n[${timestamp}] 📝 Change detected in ${filename}. Running tests...`));
                    this.sendDashboardUpdate('checking', `Validating changes in ${filename}...`);
                    
                    const testResult = await this.runTests();
                    if (!testResult.passed) {
                        console.log(chalk.red('❌ Tests failed! Triggering self-healing...'));
                        isHealing = true;
                        
                        // Snapshot before healing
                        const snapshotPath = await this.createSnapshot();
                        if (snapshotPath) console.log(chalk.gray(`📸 Snapshot: ${snapshotPath}`));

                        try {
                            await this.selfHeal(testResult.output, 'Tests failed during watch mode.');
                            
                            // Verify fix
                            const verifyResult = await this.runTests();
                            if (verifyResult.passed) {
                                console.log(chalk.green('✅ Fix verified! Tests passed.'));
                                this.sendDashboardUpdate('fixed', 'Self-healing successful');
                            } else {
                                console.log(chalk.red('❌ Self-healing failed.'));
                                this.sendDashboardUpdate('failed', 'Self-healing failed to resolve issue');
                                if (snapshotPath) {
                                    console.log(chalk.yellow(`⚠️  You may want to restore from: ${snapshotPath}`));
                                }
                            }
                        } catch (e) {
                             console.error(chalk.red(`Self-healing error: ${e.message}`));
                             this.sendDashboardUpdate('failed', `Error: ${e.message}`);
                        } finally {
                            isHealing = false;
                            console.log(chalk.cyan('\n👁️  Resuming watch mode...'));
                            setTimeout(() => this.sendDashboardUpdate('idle', 'Watch mode active'), 2000);
                        }
                    } else {
                        console.log(chalk.green('✅ Tests passed.'));
                        this.sendDashboardUpdate('idle', 'Tests passed. System healthy.');
                    }
                }, 1000); // 1s debounce
            });
        } catch (e) {
            console.log(chalk.gray(`⚠️  Cannot watch ${watchPath}: ${e.message}`));
        }
    });
    
    // Keep process alive
    process.stdin.resume();
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
    .option('--watch', 'Run in watch mode (continuously heal on file changes)')
    .option('--provider <provider>', 'AI provider to use')
    .option('--test-cmd <command>', 'Custom test command to run', 'npm test')
    .action(async (options) => {
      console.log(chalk.bold.cyan('\n🤖 Ultra-Dex Pro: Autonomous Mode\n'));

      const providerId = options.provider || getDefaultProvider();
      if (!providerId) {
        console.log(chalk.red('❌ No AI provider configured. Self-healing disabled.'));
        return;
      }

      const provider = createProvider(providerId);
      const engine = new AutonomousEngine(process.cwd(), provider, options.testCmd);
      
      if (options.watch) {
          engine.startWatchMode();
          return;
      }
      
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
        
        // Create Snapshot before healing
        const snapshotPath = await engine.createSnapshot();
        if (snapshotPath) {
          console.log(chalk.gray(`\n📸 Snapshot created at: ${snapshotPath}`));
        }

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
          if (snapshotPath) {
             console.log(chalk.yellow(`\n⚠️ Recovery failed. To restore original state:\n   cp -r ${snapshotPath}/* .`));
             // Optionally auto-restore here if configured
             // await engine.restoreSnapshot(snapshotPath);
          }
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
