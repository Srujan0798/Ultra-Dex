import * as vscode from 'vscode';
import { EventEmitter } from 'eventemitter3';

export class CLIBridge extends EventEmitter {
  private cliPath: string;
  private defaultProvider: string;
  private defaultAgent: string;

  constructor() {
    super();
    const config = vscode.workspace.getConfiguration('ultra-dex');
    this.cliPath = config.get('cliPath') || 'ultra-dex';
    this.defaultProvider = config.get('defaultProvider') || 'nvidia';
    this.defaultAgent = config.get('defaultAgent') || 'planner';
  }

  /**
   * Execute a task via Ultra-Dex CLI
   */
  async executeTask(prompt: string, options: TaskOptions = {}): Promise<TaskResult> {
    const { spawn } = require('child_process');
    const agent = options.agent || this.defaultAgent;
    const provider = options.provider || this.defaultProvider;

    const args = ['run', agent, '-t', prompt];

    if (provider) {
      args.push('--provider', provider);
    }

    if (options.optimize) {
      args.push('--optimize', options.optimize);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(this.cliPath, args, {
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        env: { ...process.env, ...options.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        this.emit('output', chunk);
      });

      proc.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        this.emit('error', chunk);
      });

      proc.on('close', (code: number) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            exitCode: code,
          });
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      proc.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  /**
   * Stream output from CLI in real-time
   */
  streamOutput(callback: (output: string) => void): void {
    this.on('output', callback);
    this.on('error', callback);
  }

  /**
   * Get list of available agents
   */
  async getAgents(): Promise<Agent[]> {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const proc = spawn(this.cliPath, ['marketplace', 'list', '--json']);

      let stdout = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.on('close', (code: number) => {
        if (code === 0) {
          try {
            const agents = JSON.parse(stdout);
            resolve(agents);
          } catch {
            // Return default agents if parsing fails
            resolve([
              { id: 'planner', name: 'Planner', category: 'planning' },
              { id: 'backend', name: 'Backend Developer', category: 'coding' },
              { id: 'frontend', name: 'Frontend Developer', category: 'coding' },
              { id: 'reviewer', name: 'Code Reviewer', category: 'review' },
              { id: 'security', name: 'Security Auditor', category: 'security' },
            ]);
          }
        } else {
          reject(new Error('Failed to list agents'));
        }
      });
    });
  }

  /**
   * Get recent tasks
   */
  async getRecentTasks(limit: number = 10): Promise<Task[]> {
    const { spawn } = require('child_process');

    return new Promise((resolve) => {
      const proc = spawn(this.cliPath, ['replay', '--list', '--json']);

      let stdout = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.on('close', () => {
        try {
          const tasks = JSON.parse(stdout).slice(0, limit);
          resolve(tasks);
        } catch {
          resolve([]);
        }
      });
    });
  }

  dispose() {
    this.removeAllListeners();
  }
}

interface TaskOptions {
  agent?: string;
  provider?: string;
  optimize?: 'cost' | 'latency' | 'quality';
  env?: Record<string, string>;
}

interface TaskResult {
  success: boolean;
  output: string;
  exitCode: number;
}

interface Agent {
  id: string;
  name: string;
  category: string;
}

interface Task {
  runId: string;
  agent: string;
  task: string;
  status: string;
  startedAt: string;
}
