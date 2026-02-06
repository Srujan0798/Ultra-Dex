// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

const execAsync = promisify(exec);

class Ralph {
  constructor(projectPath, provider, task, options = {}) {
    this.projectPath = projectPath;
    this.provider = provider;
    this.task = task;
    this.options = options;
    this.maxRetries = options.maxRetries || 5;
    this.history = [];
    this.contextSummary = '';
  }

  async run() {
    printInfo(`
🤖 Ralph is taking over: "${this.task}"`);

    let attempt = 1;
    let currentTask = this.task;

    while (attempt <= this.maxRetries) {
      printInfo(chalk.dim('─'.repeat(50)));
      printInfo(`Attempt ${attempt}/${this.maxRetries}`);

      // 1. Generate
      const spinner = ora('Generating solution...').start();
      const solution = await this.generate(currentTask);
      spinner.succeed('Solution generated');

      // 2. Execute
      const executionResult = await this.execute(solution);

      // 3. Verify - Check if execution was successful
      if (executionResult.success) {
        printSuccess('✅ Verification passed!');

        // If test command is provided, run it separately to ensure everything is working
        if (this.options.testCommand) {
          const testResult = await this.runTestCommand();
          if (testResult.success) {
            printSuccess('✅ All tests passed!');
            return true;
          } else {
            // Tests failed even though execution succeeded
            printWarning('⚠️  Execution succeeded but tests failed');
            executionResult.success = false;
            executionResult.error = testResult.error;
          }
        } else {
          // No test command provided, so we consider it successful
          return true;
        }
      }

      // 4. Handle Failure & Retry
      spinner.fail('Verification failed');
      printError(`Error: ${executionResult.error.slice(0, 300)}...`);

      this.history.push({
        attempt,
        task: currentTask,
        solution,
        error: executionResult.error,
        stderr: executionResult.stderr || '',
      });

      // Compact context if history gets too long
      if (this.history.length >= 2) {
        await this.compactContext();
      }

      // Refine task for next iteration - include both error and stderr if present
      let errorMessage = executionResult.error;
      if (executionResult.stderr && executionResult.stderr.trim() !== '') {
        errorMessage += `\n\nAdditionally, the command produced the following output to stderr:\n${executionResult.stderr.substring(0, 500)}...`;
      }

      currentTask = `The previous solution failed with the following error:

${errorMessage}

Please fix the code and try again. Focus on resolving the error. Pay special attention to any error messages in stderr output.`;
      attempt++;
    }

    printError('❌ Max retries reached. Ralph failed to solve the task.');
    return false;
  }

  async runTestCommand() {
    if (!this.options.testCommand) {
      return { success: true };
    }

    try {
      printInfo(`  🧪 Running verification: ${this.options.testCommand}`);
      const { stdout, stderr } = await execAsync(this.options.testCommand, {
        cwd: this.projectPath,
      });

      if (stdout) {
        printInfo(chalk.dim(stdout));
      }

      if (stderr && stderr.trim() !== '') {
        printInfo(chalk.yellow(stderr));
        // Check if stderr contains error indicators
        if (this.containsErrorIndicators(stderr)) {
          return { success: false, error: `Test command produced error output: ${stderr}` };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.stdout || error.stderr || error.message,
      };
    }
  }

  async generate(prompt) {
    const systemPrompt =
      'You are Ralph, an autonomous developer agent.\n' +
      "Your goal is to solve the user's task by writing code and verifying it.\n" +
      'You MUST output your solution in a format that can be executed or applied.\n' +
      'If you need to run shell commands, wrap them in ```bash``` blocks.\n' +
      'If you need to write code, wrap it in ```javascript``` (or appropriate language) blocks with a file path comment like // File: path/to/file.ext.\n' +
      'Ensure your code includes self-verification steps (e.g., assertions or print statements) if no test command is provided.';

    const fullPrompt = `${this.contextSummary}

Task: ${prompt}`;

    // Use the provider to generate content
    // Assuming provider.generate(system, user) signature
    const response = await this.provider.generate(systemPrompt, fullPrompt);
    return response.content || response;
  }

  async execute(solution) {
    // 1. Extract and Write Files
    const fileRegex = /```[\w]*\n\/\/\s*File:\s*([^\n]+)\n([\s\S]*?)```/g;
    const fileMatches = [...solution.matchAll(fileRegex)];
    for (const match of fileMatches) {
      const filePath = match[1].trim();
      const content = match[2];
      const fullPath = path.join(this.projectPath, filePath);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
      printInfo(`  💾 Wrote ${filePath}`);
    }

    // 2. Extract and Run Shell Commands
    const shellRegex = /```bash\n([\s\S]*?)```/g;
    const shellMatches = [...solution.matchAll(shellRegex)];
    if (shellMatches.length === 0 && fileMatches.length === 0) {
      // If no code or commands, assume it's just text/reasoning and treat as "success" for now,
      // but warn that nothing was executed.
      return { success: true, output: 'No executable code found.' };
    }

    let failureError = null;
    let stderrOutput = '';

    for (const match of shellMatches) {
      const command = match[1].trim();
      printInfo(`  ⚡ Executing: ${command}`);

      try {
        const { stdout, stderr } = await execAsync(command, { cwd: this.projectPath });

        // Capture stderr for later analysis
        if (stderr) {
          stderrOutput += stderr;
          // Show stderr output (warnings and info)
          printInfo(chalk.yellow(stderr));
        }

        // Show stdout output
        if (stdout) {
          printInfo(chalk.dim(stdout));
        }
      } catch (error) {
        // Command failed with non-zero exit code
        failureError = error.stderr || error.stdout || error.message;
        break; // Stop on first failure
      }
    }

    // If explicit test command was provided in options, run it
    if (!failureError && this.options.testCommand) {
      printInfo(`  🧪 Running verification: ${this.options.testCommand}`);
      try {
        const { stdout, stderr } = await execAsync(this.options.testCommand, {
          cwd: this.projectPath,
        });

        // Check if test command produced stderr (which could indicate issues even if exit code is 0)
        if (stderr && stderr.trim() !== '') {
          stderrOutput += stderr;
          // For test commands, stderr often indicates problems
          if (this.containsErrorIndicators(stderr)) {
            failureError = `Test command produced error output: ${stderr}`;
          }
        }

        if (stdout) {
          printInfo(chalk.dim(stdout));
        }
      } catch (error) {
        failureError = error.stdout || error.stderr || error.message;
      }
    }

    // Even if the command succeeded, check if stderr contains error indicators
    if (!failureError && stderrOutput && this.containsErrorIndicators(stderrOutput)) {
      failureError = `Command produced error output in stderr: ${stderrOutput.substring(0, 500)}...`;
    }

    if (failureError) {
      return { success: false, error: failureError, stderr: stderrOutput };
    }

    return { success: true, stderr: stderrOutput };
  }

  containsErrorIndicators(text) {
    // Check for common error indicators in stderr output
    const errorPatterns = [
      /error:/i,
      /exception/i,
      /failed/i,
      /fatal/i,
      /traceback/i,
      /stack trace/i,
      /segmentation fault/i,
      /abort/i,
      /panic/i,
      /not found/i,
      /permission denied/i,
      /connection refused/i,
      /timeout/i,
    ];

    return errorPatterns.some((pattern) => pattern.test(text));
  }

  async compactContext() {
    const spinner = ora('Compacting context...').start();

    // Create a more comprehensive summary of previous attempts
    const lastEntry = this.history[this.history.length - 1];
    let errorDetails = lastEntry.error;

    // Include stderr if available
    if (lastEntry.stderr && lastEntry.stderr.trim() !== '') {
      errorDetails += `\n\nStderr output:\n${lastEntry.stderr.substring(0, 300)}...`;
    }

    this.contextSummary = `
## Previous Attempts Summary
We have tried ${this.history.length} times to solve this.
The last attempt failed with:
${errorDetails.slice(0, 800)}...

Avoid repeating the same mistakes.
Focus on the specific error patterns mentioned above.
`;

    spinner.succeed('Context compacted');
  }
}

export function registerRalphCommand(program) {
  program
    .command('ralph <task>')
    .description('Run the autonomous Ralph loop (Generate -> Execute -> Verify -> Retry)')
    .option('-p, --provider <provider>', 'AI provider')
    .option('--test <command>', 'Verification command (e.g., "npm test")')
    .option('--retries <number>', 'Max retries', parseInt, 5)
    .action(async (task, options) => {
      try {
        const providerId = options.provider || getDefaultProvider();
        if (!providerId) {
          printError('No AI provider configured.');
          process.exit(1);
        }
        const provider = createProvider(providerId);

        const ralph = new Ralph(process.cwd(), provider, task, {
          testCommand: options.test,
          maxRetries: options.retries,
        });

        const success = await ralph.run();
        if (!success) {
          process.exit(1);
        }
      } catch (error) {
        printError(`Ralph crashed: ${error.message}`);
        process.exit(1);
      }
    });
}
