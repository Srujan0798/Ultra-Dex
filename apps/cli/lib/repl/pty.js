// Copyright (c) 2026 Ultra-Dex

/**
 * Interactive PTY Bridge for Shell Operations
 * Enables vim, git rebase, and other interactive shell tools within the AI orchestration
 */

import pty from 'node-pty';
import os from 'os';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { AppError } from '../utils/errors.js';

class PTYBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      cols: options.cols || 80,
      rows: options.rows || 30,
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: options.shell || (os.platform() === 'win32' ? 'powershell.exe' : 'bash'),
    };
    this.terminal = null;
    this.isActive = false;
    this.commandHistory = [];
    this.aiCallback = null;
  }

  /**
   * Initialize the PTY terminal
   */
  async init() {
    try {
      this.terminal = pty.spawn(this.options.shell, [], {
        name: 'xterm-color',
        cols: this.options.cols,
        rows: this.options.rows,
        cwd: this.options.cwd,
        env: this.options.env,
      });

      this.setupEventHandlers();
      this.isActive = true;

      printSuccess('PTY Terminal initialized successfully');
      return true;
    } catch (error) {
      printError(`Failed to initialize PTY: ${error.message}`);
      throw new AppError('PTY initialization failed', { cause: error });
    }
  }

  /**
   * Set up event handlers for the terminal
   */
  setupEventHandlers() {
    this.terminal.onData((data) => {
      this.emit('data', data);
    });

    this.terminal.onExit((exitCode) => {
      this.isActive = false;
      this.emit('exit', exitCode);
    });

    this.terminal.onResize((size) => {
      this.emit('resize', size);
    });
  }

  /**
   * Send data to the terminal
   */
  sendData(input) {
    if (!this.terminal || !this.isActive) {
      throw new AppError('Terminal is not active');
    }
    this.terminal.write(input);
  }

  /**
   * Execute a command in the PTY
   */
  executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.terminal || !this.isActive) {
        reject(new AppError('Terminal is not active'));
        return;
      }

      const timeout = options.timeout || 30000; // 30 seconds default
      const timeoutId = setTimeout(() => {
        reject(new AppError('Command timed out'));
      }, timeout);

      let output = '';
      const dataHandler = (data) => {
        output += data;

        // Check for command completion indicators
        if (this.isCommandComplete(output, command)) {
          clearTimeout(timeoutId);
          this.terminal.off('data', dataHandler);
          this.commandHistory.push({ command, output, timestamp: Date.now() });
          resolve(output);
        }
      };

      this.terminal.on('data', dataHandler);
      this.terminal.write(command + '\n');
    });
  }

  /**
   * Check if a command has completed
   */
  isCommandComplete(output, command) {
    // Simple heuristic: command prompt appears after command execution
    const promptPattern = /[$#%>] $/;
    return promptPattern.test(output);
  }

  /**
   * Start an interactive session (vim, git rebase, etc.)
   */
  async startInteractiveSession(command, aiContext = {}) {
    if (!this.terminal || !this.isActive) {
      throw new AppError('Terminal is not active');
    }

    printInfo(`Starting interactive session: ${command}`);

    // Emit event to notify AI agents about the interactive session
    this.emit('interactive-session-start', { command, context: aiContext });

    // Set up AI callback to keep AI in the loop during edits
    if (this.aiCallback) {
      this.setupAIFeedback(aiContext);
    }

    this.terminal.write(command + '\n');
  }

  /**
   * Setup AI feedback during interactive sessions
   */
  setupAIFeedback(context) {
    let sessionOutput = '';

    const dataHandler = (data) => {
      sessionOutput += data;

      // Periodically send updates to AI
      if (sessionOutput.length % 100 === 0) {
        // Every 100 characters
        this.aiCallback({
          type: 'interactive-update',
          command: context.command,
          output: sessionOutput,
          context,
        });
      }
    };

    this.terminal.on('data', dataHandler);

    // Clean up when session ends
    this.terminal.once('exit', () => {
      this.terminal.off('data', dataHandler);
      this.emit('interactive-session-end', {
        command: context.command,
        output: sessionOutput,
        context,
      });
    });
  }

  /**
   * Set AI callback function
   */
  setAICallback(callback) {
    if (typeof callback === 'function') {
      this.aiCallback = callback;
    } else {
      throw new AppError('AI callback must be a function');
    }
  }

  /**
   * Resize the terminal
   */
  resize(cols, rows) {
    if (this.terminal && this.isActive) {
      this.terminal.resize(cols, rows);
      this.options.cols = cols;
      this.options.rows = rows;
    }
  }

  /**
   * Get terminal info
   */
  getInfo() {
    return {
      isActive: this.isActive,
      pid: this.terminal ? this.terminal.pid : null,
      cols: this.options.cols,
      rows: this.options.rows,
      cwd: this.options.cwd,
      shell: this.options.shell,
      commandHistory: this.commandHistory.slice(-10), // Last 10 commands
    };
  }

  /**
   * Kill the terminal
   */
  kill() {
    if (this.terminal && this.isActive) {
      this.terminal.kill();
      this.isActive = false;
      this.emit('kill');
    }
  }

  /**
   * Send interrupt signal (Ctrl+C equivalent)
   */
  interrupt() {
    if (this.terminal && this.isActive) {
      this.terminal.write('\x03'); // Send SIGINT
    }
  }

  /**
   * Send EOF signal (Ctrl+D equivalent)
   */
  sendEOF() {
    if (this.terminal && this.isActive) {
      this.terminal.write('\x04'); // Send EOF
    }
  }
}

/**
 * Utility function to create a PTY bridge instance
 */
export async function createPTYBridge(options = {}) {
  const bridge = new PTYBridge(options);
  await bridge.init();
  return bridge;
}

/**
 * Convenience function for executing interactive commands with AI feedback
 */
export async function executeInteractiveCommand(command, aiContext = {}, aiCallback = null) {
  const bridge = await createPTYBridge();

  if (aiCallback) {
    bridge.setAICallback(aiCallback);
  }

  try {
    if (isInteractiveCommand(command)) {
      await bridge.startInteractiveSession(command, aiContext);

      // Wait for the session to complete
      return await new Promise((resolve) => {
        const exitHandler = () => {
          bridge.off('interactive-session-end', exitHandler);
          resolve(bridge.getInfo());
        };

        bridge.on('interactive-session-end', exitHandler);
      });
    } else {
      return await bridge.executeCommand(command);
    }
  } finally {
    bridge.kill();
  }
}

/**
 * Check if a command is interactive (requires user input)
 */
function isInteractiveCommand(command) {
  const interactiveCommands = [
    'vim',
    'nvim',
    'nano',
    'emacs',
    'less',
    'more',
    'man',
    'git rebase',
    'git commit',
    'git merge',
    'git add -p',
    'ssh',
    'telnet',
    'ftp',
    'top',
    'htop',
    'mc',
    'dialog',
  ];

  return interactiveCommands.some((cmd) => command.includes(cmd));
}

export default PTYBridge;
