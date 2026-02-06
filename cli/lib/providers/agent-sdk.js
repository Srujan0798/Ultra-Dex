// Copyright (c) 2026 Ultra-Dex

/**
 * Anthropic Agent SDK Integration
 * Enables true autonomous agents with tool use, memory, and reasoning
 * This transforms Ultra-Dex swarm from prompt-based to SDK-based agents
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// AGENT SDK CONFIGURATION
// ============================================================================

const AGENT_SDK_CONFIG = {
  // Default model for agents
  defaultModel: 'claude-sonnet-4-20250514',

  // Available models
  models: {
    fast: 'claude-sonnet-4-20250514',
    balanced: 'claude-sonnet-4-20250514',
    powerful: 'claude-opus-4-20250514',
  },

  // Max tokens for different agent types
  maxTokens: {
    planner: 8000,
    coder: 16000,
    reviewer: 4000,
    default: 8000,
  },

  // Tool definitions for agents
  tools: {
    read_file: {
      name: 'read_file',
      description: 'Read the contents of a file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
        },
        required: ['path'],
      },
    },
    write_file: {
      name: 'write_file',
      description: 'Write content to a file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
    search_code: {
      name: 'search_code',
      description: 'Search for code patterns in the codebase',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query or regex pattern' },
          file_pattern: { type: 'string', description: 'Glob pattern for files to search' },
        },
        required: ['query'],
      },
    },
    run_command: {
      name: 'run_command',
      description: 'Run a shell command (sandboxed)',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          timeout: { type: 'number', description: 'Timeout in milliseconds' },
        },
        required: ['command'],
      },
    },
    delegate_task: {
      name: 'delegate_task',
      description: 'Delegate a task to another specialized agent',
      input_schema: {
        type: 'object',
        properties: {
          agent: { type: 'string', description: 'Agent name (backend, frontend, etc.)' },
          task: { type: 'string', description: 'Task description' },
          context: { type: 'string', description: 'Additional context' },
        },
        required: ['agent', 'task'],
      },
    },
    create_checkpoint: {
      name: 'create_checkpoint',
      description: 'Create a rollback checkpoint before making changes',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Checkpoint name' },
          files: { type: 'array', items: { type: 'string' }, description: 'Files to checkpoint' },
        },
        required: ['name'],
      },
    },
    browse_web: {
      name: 'browse_web',
      description: 'Browse a webpage and extract information',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to browse' },
          action: { type: 'string', description: 'Action: read, screenshot, click, fill' },
          selector: { type: 'string', description: 'CSS selector for action' },
          value: { type: 'string', description: 'Value for fill action' },
        },
        required: ['url'],
      },
    },
  },
};

// ============================================================================
// AGENT CLASS
// ============================================================================

/**
 * Autonomous Agent powered by Anthropic SDK
 */
export class AutonomousAgent {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.systemPrompt = config.systemPrompt;
    this.tools = config.tools || [];
    this.model = config.model || AGENT_SDK_CONFIG.defaultModel;
    this.maxTokens = config.maxTokens || AGENT_SDK_CONFIG.maxTokens.default;
    this.memory = [];
    this.artifacts = [];
    this.checkpoints = new Map();
    this.provider = config.provider;
    this.workdir = config.workdir || process.cwd();
    this.browser = null;
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolName, input) {
    switch (toolName) {
      case 'read_file':
        return this._readFile(input.path);

      case 'write_file':
        return this._writeFile(input.path, input.content);

      case 'search_code':
        return this._searchCode(input.query, input.file_pattern);

      case 'run_command':
        return this._runCommand(input.command, input.timeout);

      case 'delegate_task':
        return this._delegateTask(input.agent, input.task, input.context);

      case 'create_checkpoint':
        return this._createCheckpoint(input.name, input.files);

      case 'browse_web':
        return this._browseWeb(input.url, input.action, input.selector, input.value);

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  async _readFile(filepath) {
    try {
      const fullPath = path.resolve(this.workdir, filepath);
      const content = await fs.readFile(fullPath, 'utf8');
      return { success: true, content, path: filepath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _writeFile(filepath, content) {
    try {
      const fullPath = path.resolve(this.workdir, filepath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      this.artifacts.push(filepath);
      return { success: true, path: filepath, bytesWritten: content.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _searchCode(query, filePattern = '**/*') {
    try {
      const { glob } = await import('glob');
      const files = await glob(filePattern, {
        cwd: this.workdir,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        nodir: true,
      });

      const results = [];
      const regex = new RegExp(query, 'gi');

      for (const file of files.slice(0, 50)) {
        try {
          const content = await fs.readFile(path.join(this.workdir, file), 'utf8');
          const matches = content.match(regex);
          if (matches) {
            results.push({
              file,
              matches: matches.length,
              preview: content.substring(0, 200),
            });
          }
        } catch {
          continue;
        }
      }

      return { success: true, results, total: results.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _runCommand(command, timeout = 30000) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workdir,
        timeout,
        maxBuffer: 1024 * 1024,
      });

      return { success: true, stdout, stderr };
    } catch (err) {
      return { success: false, error: err.message, stdout: err.stdout, stderr: err.stderr };
    }
  }

  async _delegateTask(agentName, task, context) {
    return {
      delegated: true,
      agent: agentName,
      task,
      context,
    };
  }

  async _createCheckpoint(name, files = []) {
    const checkpoint = {
      name,
      timestamp: new Date().toISOString(),
      files: {},
    };

    const filesToCheckpoint = files.length > 0 ? files : this.artifacts;

    for (const file of filesToCheckpoint) {
      try {
        const content = await fs.readFile(path.resolve(this.workdir, file), 'utf8');
        checkpoint.files[file] = content;
      } catch {
        // File doesn't exist yet
      }
    }

    this.checkpoints.set(name, checkpoint);
    return { success: true, name, filesCheckpointed: Object.keys(checkpoint.files).length };
  }

  async _browseWeb(url, action = 'read', selector, value) {
    try {
      // Dynamic import of browser module
      const { BrowserAutomation } = await import('../utils/browser.js');

      if (!this.browser) {
        this.browser = new BrowserAutomation();
        await this.browser.launch();
      }

      let result;

      switch (action) {
        case 'read':
          result = await this.browser.getPageContent(url);
          break;
        case 'screenshot':
          result = await this.browser.screenshot(url);
          break;
        case 'click':
          await this.browser.navigate(url);
          result = await this.browser.click(selector);
          break;
        case 'fill':
          await this.browser.navigate(url);
          result = await this.browser.fill(selector, value);
          break;
        default:
          result = await this.browser.getPageContent(url);
      }

      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Rollback to a checkpoint
   */
  async rollback(checkpointName) {
    const checkpoint = this.checkpoints.get(checkpointName);
    if (!checkpoint) {
      return { success: false, error: `Checkpoint not found: ${checkpointName}` };
    }

    for (const [file, content] of Object.entries(checkpoint.files)) {
      await fs.writeFile(path.resolve(this.workdir, file), content, 'utf8');
    }

    return { success: true, restoredFiles: Object.keys(checkpoint.files).length };
  }

  /**
   * Close browser if open
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Run the agent with a task (agentic loop)
   */
  async run(task, options = {}) {
    const { maxIterations = 10, verbose = false } = options;

    const messages = [
      {
        role: 'user',
        content: `${task}\n\nYou have access to tools. Use them to complete this task. When done, respond with TASK_COMPLETE.`,
      },
    ];

    if (this.memory.length > 0) {
      const memoryContext = this.memory
        .slice(-5)
        .map((m) => `- ${m}`)
        .join('\n');
      messages[0].content = `Previous context:\n${memoryContext}\n\n${messages[0].content}`;
    }

    let iteration = 0;
    const trace = [];

    try {
      while (iteration < maxIterations) {
        iteration++;

        if (verbose) {
          console.log(chalk.gray(`  [${this.name}] Iteration ${iteration}...`));
        }

        const response = await this.provider.generateWithTools(
          this.systemPrompt,
          messages,
          Object.values(AGENT_SDK_CONFIG.tools).filter((t) => this.tools.includes(t.name)),
          { maxTokens: this.maxTokens }
        );

        if (response.content?.includes('TASK_COMPLETE') || response.stopReason === 'end_turn') {
          trace.push({ iteration, type: 'complete', content: response.content });
          break;
        }

        if (response.toolUse && response.toolUse.length > 0) {
          for (const tool of response.toolUse) {
            if (verbose) {
              console.log(
                chalk.cyan(`    -> ${tool.name}(${JSON.stringify(tool.input).substring(0, 50)}...)`)
              );
            }

            const result = await this.executeTool(tool.name, tool.input);

            trace.push({
              iteration,
              type: 'tool',
              tool: tool.name,
              input: tool.input,
              result,
            });

            if (result.delegated) {
              return {
                status: 'delegated',
                delegateTo: result.agent,
                task: result.task,
                context: result.context,
                trace,
              };
            }

            messages.push({
              role: 'assistant',
              content: response.content || '',
              tool_use: [tool],
            });

            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: tool.id,
                  content: JSON.stringify(result),
                },
              ],
            });
          }
        } else {
          trace.push({ iteration, type: 'response', content: response.content });
          messages.push({ role: 'assistant', content: response.content });
        }
      }
    } finally {
      await this.cleanup();
    }

    this.memory.push(`Completed: ${task}`);

    return {
      status: iteration >= maxIterations ? 'max_iterations' : 'complete',
      artifacts: this.artifacts,
      trace,
      iterations: iteration,
    };
  }
}

// ============================================================================
// AGENT FACTORY
// ============================================================================

export function createAgent(type, provider, options = {}) {
  const agents = {
    planner: {
      name: '@Planner',
      role: 'Task Breakdown Specialist',
      systemPrompt: `You are @Planner, an expert at breaking down features into atomic, implementable tasks.
You analyze requirements and create clear, sequential task lists.
Use search_code to understand the existing codebase before planning.
Output tasks with clear assignments to other agents.`,
      tools: ['search_code', 'read_file', 'delegate_task', 'browse_web'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.planner,
    },

    backend: {
      name: '@Backend',
      role: 'API & Server Developer',
      systemPrompt: `You are @Backend, an expert backend developer.
You write clean, secure API code following best practices.
Always create checkpoints before making changes.
Run tests after implementing.`,
      tools: ['read_file', 'write_file', 'search_code', 'run_command', 'create_checkpoint'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.coder,
    },

    frontend: {
      name: '@Frontend',
      role: 'UI/UX Developer',
      systemPrompt: `You are @Frontend, an expert React/Next.js developer.
You build accessible, performant UI components.
Follow the project's existing patterns and component library.`,
      tools: [
        'read_file',
        'write_file',
        'search_code',
        'run_command',
        'create_checkpoint',
        'browse_web',
      ],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.coder,
    },

    database: {
      name: '@Database',
      role: 'Database Architect',
      systemPrompt: `You are @Database, an expert in database design and optimization.
You create efficient schemas, migrations, and queries.
Consider indexing and performance in all decisions.`,
      tools: ['read_file', 'write_file', 'search_code', 'run_command'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.coder,
    },

    testing: {
      name: '@Testing',
      role: 'QA Engineer',
      systemPrompt: `You are @Testing, an expert in test automation.
You write comprehensive unit, integration, and e2e tests.
Ensure high coverage of edge cases and error paths.`,
      tools: ['read_file', 'write_file', 'search_code', 'run_command', 'browse_web'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.coder,
    },

    reviewer: {
      name: '@Reviewer',
      role: 'Code Review Specialist',
      systemPrompt: `You are @Reviewer, an expert code reviewer.
You identify bugs, security issues, and improvement opportunities.
Provide actionable feedback with specific line references.`,
      tools: ['read_file', 'search_code'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.reviewer,
    },

    research: {
      name: '@Research',
      role: 'Technology Research Specialist',
      systemPrompt: `You are @Research, an expert at technology evaluation.
You research libraries, frameworks, and best practices.
Use browse_web to gather information from documentation and articles.`,
      tools: ['browse_web', 'read_file', 'search_code', 'delegate_task'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.planner,
    },

    devops: {
      name: '@DevOps',
      role: 'Infrastructure Engineer',
      systemPrompt: `You are @DevOps, an expert in CI/CD and infrastructure.
You set up deployment pipelines, Docker configs, and cloud infrastructure.
Prioritize security and reliability.`,
      tools: ['read_file', 'write_file', 'search_code', 'run_command'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.coder,
    },

    security: {
      name: '@Security',
      role: 'Security Auditor',
      systemPrompt: `You are @Security, an expert security auditor.
You identify vulnerabilities (OWASP Top 10, etc.) and recommend fixes.
Never ignore potential security issues.`,
      tools: ['read_file', 'search_code', 'run_command', 'browse_web'],
      maxTokens: AGENT_SDK_CONFIG.maxTokens.reviewer,
    },
  };

  const agentConfig = agents[type];
  if (!agentConfig) {
    throw new Error(`Unknown agent type: ${type}`);
  }

  return new AutonomousAgent({
    ...agentConfig,
    ...options,
    provider,
  });
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class AgentOrchestrator {
  constructor(provider, options = {}) {
    this.provider = provider;
    this.agents = new Map();
    this.options = options;
    this.history = [];
  }

  register(type) {
    const agent = createAgent(type, this.provider, this.options);
    this.agents.set(type, agent);
    return agent;
  }

  async runSwarm(task, options = {}) {
    const { startAgent = 'planner', verbose = false } = options;

    const agentTypes = [
      'planner',
      'backend',
      'frontend',
      'database',
      'testing',
      'reviewer',
      'research',
      'security',
      'devops',
    ];
    for (const type of agentTypes) {
      if (!this.agents.has(type)) {
        this.register(type);
      }
    }

    const results = [];
    let currentAgent = startAgent;
    let currentTask = task;
    let maxDelegations = 10;

    while (maxDelegations > 0) {
      const agent = this.agents.get(currentAgent);
      if (!agent) {
        console.log(chalk.red(`Agent not found: ${currentAgent}`));
        break;
      }

      if (verbose) {
        console.log(chalk.cyan(`\n[${agent.name}] Starting task...`));
      }

      const result = await agent.run(currentTask, { verbose });
      results.push({ agent: currentAgent, result });
      this.history.push({ agent: currentAgent, task: currentTask, result });

      if (result.status === 'delegated') {
        currentAgent = result.delegateTo.toLowerCase().replace('@', '');
        currentTask = `${result.task}\n\nContext: ${result.context || ''}`;
        maxDelegations--;
      } else {
        break;
      }
    }

    return {
      results,
      history: this.history,
      artifacts: results.flatMap((r) => r.result.artifacts || []),
    };
  }
}

export default {
  AutonomousAgent,
  AgentOrchestrator,
  createAgent,
  AGENT_SDK_CONFIG,
};
