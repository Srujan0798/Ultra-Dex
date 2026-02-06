#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex batch command
 * Execute multiple commands in sequence
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

const program = new Command();

program
  .name('ultra-dex batch')
  .description('Execute multiple Ultra-Dex commands in batch')
  .version('1.0.0');

program
  .argument('<file>', 'Batch file (.json or .txt) or "-" for stdin')
  .option('--dry-run', 'Show commands without executing')
  .option('--continue-on-error', 'Continue even if a command fails')
  .option('--parallel', 'Execute commands in parallel (where safe)')
  .option('--timeout <ms>', 'Timeout per command', '300000')
  .action(async (file, options) => {
    try {
      printInfo(chalk.cyan.bold('\n📦 Ultra-Dex Batch Execution\n'));

      let commands = [];

      // Read commands from file or stdin
      if (file === '-') {
        // Read from stdin
        const stdin = process.stdin;
        stdin.setEncoding('utf8');

        let data = '';
        for await (const chunk of stdin) {
          data += chunk;
        }

        commands = parseCommands(data);
      } else {
        // Read from file
        try {
          const content = await fs.readFile(file, 'utf8');
          const ext = path.extname(file);

          if (ext === '.json') {
            const batch = JSON.parse(content);
            commands = batch.commands || [];
          } else {
            commands = parseCommands(content);
          }
        } catch (err) {
          printError(chalk.red(`Failed to read batch file: ${err.message}`));
          process.exit(1);
        }
      }

      if (commands.length === 0) {
        printWarning(chalk.yellow('No commands to execute'));
        return;
      }

      printInfo(chalk.blue(`Found ${commands.length} commands:\n`));

      // Display commands
      commands.forEach((cmd, i) => {
        printInfo(chalk.gray(`  ${i + 1}. ultra-dex ${cmd.command} ${cmd.args?.join(' ') || ''}`));
        if (cmd.description) {
          printInfo(chalk.dim(`     ${cmd.description}`));
        }
      });

      printInfo('');

      if (options.dryRun) {
        printWarning(chalk.yellow('Dry run mode - not executing\n'));
        return;
      }

      // Execute commands
      const results = [];
      let failed = 0;

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const cmdStr = `ultra-dex ${cmd.command} ${cmd.args?.join(' ') || ''}`;

        printInfo(chalk.cyan(`\n[${i + 1}/${commands.length}] Executing: ${cmdStr}`));

        const startTime = Date.now();

        try {
          await executeCommand(cmd, parseInt(options.timeout));
          const duration = Date.now() - startTime;

          results.push({
            command: cmdStr,
            status: 'success',
            duration,
          });

          printSuccess(chalk.green(`  ✓ Completed in ${(duration / 1000).toFixed(1)}s`));
        } catch (error) {
          const duration = Date.now() - startTime;
          failed++;

          results.push({
            command: cmdStr,
            status: 'error',
            duration,
            error: error.message,
          });

          printError(chalk.red(`  ✗ Failed: ${error.message}`));

          if (!options.continueOnError) {
            printError(chalk.red('\nStopping due to error (use --continue-on-error to skip)'));
            break;
          }
        }
      }

      // Summary
      printInfo(chalk.cyan.bold('\n📊 Summary:\n'));
      printInfo(`Total: ${commands.length}`);
      printInfo(chalk.green(`Successful: ${results.filter((r) => r.status === 'success').length}`));
      if (failed > 0) {
        printInfo(chalk.red(`Failed: ${failed}`));
      }

      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      printInfo(chalk.gray(`Total time: ${(totalDuration / 1000).toFixed(1)}s\n`));

      if (failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      printError(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Template command to create sample batch file
program
  .command('template [file]')
  .description('Create a sample batch file')
  .option('--type <type>', 'Template type: setup, deploy, test', 'setup')
  .action(async (file = 'batch.json', options) => {
    const templates = {
      setup: {
        name: 'Project Setup',
        description: 'Initialize and setup a new project',
        commands: [
          { command: 'init', args: ['--template', 'lite'], description: 'Initialize project' },
          { command: 'generate', args: ['My awesome SaaS'], description: 'Generate plan' },
          { command: 'hooks', args: ['install'], description: 'Install git hooks' },
        ],
      },
      deploy: {
        name: 'Deploy Pipeline',
        description: 'Full deployment pipeline',
        commands: [
          { command: 'verify', args: [], description: 'Verify implementation' },
          { command: 'align', args: ['--json'], description: 'Check alignment' },
          { command: 'build', args: [], description: 'Build project' },
          { command: 'cloud', args: ['deploy'], description: 'Deploy to cloud' },
        ],
      },
      test: {
        name: 'Test Suite',
        description: 'Run all tests and checks',
        commands: [
          { command: 'validate', args: [], description: 'Validate project' },
          { command: 'verify', args: [], description: 'Verify completeness' },
          { command: 'doctor', args: [], description: 'Health check' },
        ],
      },
    };

    const template = templates[options.type];
    if (!template) {
      printError(chalk.red(`Unknown template type: ${options.type}`));
      printInfo(chalk.gray('Available: setup, deploy, test'));
      return;
    }

    await fs.writeFile(file, JSON.stringify(template, null, 2));
    printSuccess(chalk.green(`\n✅ Created ${file}`));
    printInfo(chalk.gray(`Template: ${template.name}`));
    printInfo(chalk.gray(`Contains ${template.commands.length} commands\n`));
    printInfo(chalk.white('Run with:'));
    printInfo(chalk.cyan(`  ultra-dex batch ${file}\n`));
  });

function parseCommands(content) {
  try {
    // Try parsing as JSON first just in case
    const json = JSON.parse(content);
    if (json.commands) return json.commands;
  } catch {}

  const lines = content.split('\n');
  const commands = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse command
    const parts = trimmed.split(/\s+/);
    if (parts.length > 0) {
      commands.push({
        command: parts[0],
        args: parts.slice(1),
        description: '',
      });
    }
  }

  return commands;
}

function executeCommand(cmd, timeout) {
  return new Promise((resolve, reject) => {
    // Sanitize arguments slightly by ensuring strings
    const safeArgs = (cmd.args || []).map(String);
    const args = ['ultra-dex', cmd.command, ...safeArgs];

    // Warning: shell: true is used to allow command execution, but it carries security risks
    // if input is untrusted. Since this is a CLI tool run by the user with their own files,
    // we assume some level of trust, but we should be careful.
    const child = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderr += data;
      process.stderr.write(data);
    });

    const timeoutId = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

program.parse();
