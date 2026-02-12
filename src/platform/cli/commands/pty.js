// Copyright (c) 2026 Ultra-Dex

/**
 * PTY Command Registration
 * Adds PTY-enabled commands to the CLI (ultra-dex pty vim, ultra-dex pty shell)
 */

import { createPTYBridge, executeInteractiveCommand } from '../repl/pty.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { loadState } from '../commands/state.js';
import chalk from 'chalk';

/**
 * Register PTY commands with Commander
 */
export function registerPTYCommands(program) {
  const ptyCommand = program
    .command('pty')
    .description('Interactive PTY-enabled commands (vim, shell, etc.)');

  // PTY Vim command
  ptyCommand
    .command('vim [file]')
    .description('Open file in vim with AI assistance')
    .option('-l, --line <number>', 'Go to specific line number')
    .option('-c, --command <cmd>', 'Execute vim command after opening')
    .action(async (file, options) => {
      try {
        await handleVimCommand(file, options);
      } catch (error) {
        await handleError(error, { command: 'pty-vim', file, options });
        process.exit(error.exitCode || 1);
      }
    });

  // PTY Shell command
  ptyCommand
    .command('shell')
    .description('Start an interactive shell with AI assistance')
    .option('-s, --shell <shell>', 'Shell to use (bash, zsh, fish)', 'bash')
    .option('-c, --command <cmd>', 'Execute command and exit')
    .action(async (options) => {
      try {
        await handleShellCommand(options);
      } catch (error) {
        await handleError(error, { command: 'pty-shell', options });
        process.exit(error.exitCode || 1);
      }
    });

  // PTY Generic command
  ptyCommand
    .command('exec <command...>')
    .description('Execute interactive command with AI assistance')
    .option('-t, --timeout <seconds>', 'Command timeout in seconds', '30')
    .action(async (commandParts, options) => {
      let command;
      try {
        command = commandParts.join(' ');
        await handleExecCommand(command, options);
      } catch (error) {
        await handleError(error, { command: 'pty-exec', commandString: command, options });
        process.exit(error.exitCode || 1);
      }
    });
}

/**
 * Handle vim command with AI assistance
 */
async function handleVimCommand(file, options) {
  printInfo(chalk.cyan('\n🔧 Starting Vim with AI Assistance\n'));

  // Load project context
  const state = await loadState();
  const context = {
    project: state?.project || { name: 'Unknown Project' },
    file: file || 'unnamed',
    command: 'vim',
    mode: 'edit',
  };

  const vimCommand = buildVimCommand(file, options);

  try {
    const bridge = await createPTYBridge();

    // Set up AI callback to keep AI in the loop during editing
    bridge.setAICallback((feedback) => {
      handleAIFeedback(feedback, context);
    });

    printInfo(`Opening ${file ? file : 'new file'} in vim...`);
    printInfo(chalk.gray('(Press :q to quit vim when done)'));

    await bridge.startInteractiveSession(vimCommand, context);

    // Wait for vim to exit
    await new Promise((resolve) => {
      const exitHandler = () => {
        bridge.off('exit', exitHandler);
        printSuccess('\n✅ Vim session completed');
        resolve();
      };

      bridge.on('exit', exitHandler);
    });

    bridge.kill();
  } catch (error) {
    printError(`Vim session failed: ${error.message}`);
    throw error;
  }
}

/**
 * Build vim command with options
 */
function buildVimCommand(file, options) {
  let cmd = 'vim';

  if (options.line) {
    cmd += ` +${options.line}`;
  }

  if (options.command) {
    cmd += ` -c "${options.command}"`;
  }

  if (file) {
    cmd += ` "${file}"`;
  }

  return cmd;
}

/**
 * Handle shell command with AI assistance
 */
async function handleShellCommand(options) {
  printInfo(chalk.cyan('\n쉘 Starting Interactive Shell with AI Assistance\n'));

  // Load project context
  const state = await loadState();
  const context = {
    project: state?.project || { name: 'Unknown Project' },
    command: 'shell',
    mode: 'interactive',
  };

  try {
    const bridge = await createPTYBridge({ shell: options.shell });

    // Set up AI callback
    bridge.setAICallback((feedback) => {
      handleAIFeedback(feedback, context);
    });

    if (options.command) {
      // Execute single command and exit
      printInfo(`Executing: ${options.command}`);
      const result = await bridge.executeCommand(options.command);
      printInfo(result);
      printSuccess('Command completed');
      bridge.kill();
    } else {
      // Start interactive shell
      printInfo(`Starting ${options.shell} shell...`);
      printInfo(chalk.gray('(Type "exit" to quit the shell)'));

      // Write a welcome message to the shell
      bridge.sendData(`echo "${chalk.green('Welcome to Ultra-Dex AI-Assisted Shell')}"\n`);
      bridge.sendData(`echo "${chalk.gray('AI is monitoring this session for assistance')}"\n`);

      // Keep the process alive
      await new Promise((resolve) => {
        const exitHandler = () => {
          bridge.off('exit', exitHandler);
          printSuccess('\n✅ Shell session completed');
          resolve();
        };

        bridge.on('exit', exitHandler);
      });

      bridge.kill();
    }
  } catch (error) {
    printError(`Shell session failed: ${error.message}`);
    throw error;
  }
}

/**
 * Handle generic exec command
 */
async function handleExecCommand(command, options) {
  printInfo(chalk.cyan(`\n🔧 Executing: ${command}\n`));

  // Load project context
  const state = await loadState();
  const context = {
    project: state?.project || { name: 'Unknown Project' },
    command,
    mode: 'execution',
  };

  try {
    const timeout = parseInt(options.timeout) * 1000; // Convert to milliseconds

    const result = await executeInteractiveCommand(command, context, (feedback) =>
      handleAIFeedback(feedback, context)
    );

    if (typeof result === 'string') {
      printInfo(result);
    } else {
      printSuccess('Command completed successfully');
    }
  } catch (error) {
    printError(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Handle AI feedback during PTY sessions
 */
function handleAIFeedback(feedback, context) {
  switch (feedback.type) {
    case 'interactive-update':
      // Log ongoing activity without being too verbose
      if (feedback.output.length % 500 === 0) {
        // Every 500 chars
        printInfo(chalk.yellow(`📝 AI monitoring ${feedback.command}...`));
      }
      break;

    case 'interactive-session-end':
      printSuccess(chalk.green(`✅ ${feedback.command} completed`));
      break;

    default:
      // Handle other feedback types as needed
      break;
  }
}

export default {
  registerPTYCommands,
};
