#!/usr/bin/env node

/**
 * ultra-dex batch command
 * Execute multiple commands in sequence
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

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
      console.log(chalk.cyan.bold('\n📦 Ultra-Dex Batch Execution\n'));
      
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
        const content = await fs.readFile(file, 'utf8');
        const ext = path.extname(file);
        
        if (ext === '.json') {
          const batch = JSON.parse(content);
          commands = batch.commands || [];
        } else {
          commands = parseCommands(content);
        }
      }
      
      if (commands.length === 0) {
        console.log(chalk.yellow('No commands to execute'));
        return;
      }
      
      console.log(chalk.blue(`Found ${commands.length} commands:\n`));
      
      // Display commands
      commands.forEach((cmd, i) => {
        console.log(chalk.gray(`  ${i + 1}. ultra-dex ${cmd.command} ${cmd.args?.join(' ') || ''}`));
        if (cmd.description) {
          console.log(chalk.dim(`     ${cmd.description}`));
        }
      });
      
      console.log();
      
      if (options.dryRun) {
        console.log(chalk.yellow('Dry run mode - not executing\n'));
        return;
      }
      
      // Execute commands
      const results = [];
      let failed = 0;
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const cmdStr = `ultra-dex ${cmd.command} ${cmd.args?.join(' ') || ''}`;
        
        console.log(chalk.cyan(`\n[${i + 1}/${commands.length}] Executing: ${cmdStr}`));
        
        const startTime = Date.now();
        
        try {
          await executeCommand(cmd, parseInt(options.timeout));
          const duration = Date.now() - startTime;
          
          results.push({
            command: cmdStr,
            status: 'success',
            duration
          });
          
          console.log(chalk.green(`  ✓ Completed in ${(duration / 1000).toFixed(1)}s`));
        } catch (error) {
          const duration = Date.now() - startTime;
          failed++;
          
          results.push({
            command: cmdStr,
            status: 'error',
            duration,
            error: error.message
          });
          
          console.log(chalk.red(`  ✗ Failed: ${error.message}`));
          
          if (!options.continueOnError) {
            console.log(chalk.red('\nStopping due to error (use --continue-on-error to skip)'));
            break;
          }
        }
      }
      
      // Summary
      console.log(chalk.cyan.bold('\n📊 Summary:\n'));
      console.log(`Total: ${commands.length}`);
      console.log(chalk.green(`Successful: ${results.filter(r => r.status === 'success').length}`));
      if (failed > 0) {
        console.log(chalk.red(`Failed: ${failed}`));
      }
      
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      console.log(chalk.gray(`Total time: ${(totalDuration / 1000).toFixed(1)}s\n`));
      
      if (failed > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
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
          { command: 'hooks', args: ['install'], description: 'Install git hooks' }
        ]
      },
      deploy: {
        name: 'Deploy Pipeline',
        description: 'Full deployment pipeline',
        commands: [
          { command: 'verify', args: [], description: 'Verify implementation' },
          { command: 'align', args: ['--json'], description: 'Check alignment' },
          { command: 'build', args: [], description: 'Build project' },
          { command: 'cloud', args: ['deploy'], description: 'Deploy to cloud' }
        ]
      },
      test: {
        name: 'Test Suite',
        description: 'Run all tests and checks',
        commands: [
          { command: 'validate', args: [], description: 'Validate project' },
          { command: 'verify', args: [], description: 'Verify completeness' },
          { command: 'doctor', args: [], description: 'Health check' }
        ]
      }
    };
    
    const template = templates[options.type];
    if (!template) {
      console.log(chalk.red(`Unknown template type: ${options.type}`));
      console.log(chalk.gray('Available: setup, deploy, test'));
      return;
    }
    
    await fs.writeFile(file, JSON.stringify(template, null, 2));
    console.log(chalk.green(`\n✅ Created ${file}`));
    console.log(chalk.gray(`Template: ${template.name}`));
    console.log(chalk.gray(`Contains ${template.commands.length} commands\n`));
    console.log(chalk.white('Run with:'));
    console.log(chalk.cyan(`  ultra-dex batch ${file}\n`));
  });

function parseCommands(content) {
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
        description: ''
      });
    }
  }
  
  return commands;
}

function executeCommand(cmd, timeout) {
  return new Promise((resolve, reject) => {
    const args = ['ultra-dex', cmd.command, ...(cmd.args || [])];
    
    const child = spawn('npx', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
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
