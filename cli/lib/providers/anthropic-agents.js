// Copyright (c) 2026 Ultra-Dex

/**
 * Anthropic Agent SDK Integration for Ultra-Dex
 * Enables TRUE autonomous agents using Claude's Agent SDK
 * This is the future of AI-powered development
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

  // Tool definitions for agents
  tools: {
    read_file: {
      name: 'read_file',
      description: 'Read the contents of a file from the codebase',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to read',
          },
        },
        required: ['path'],
      },
    },

    write_file: {
      name: 'write_file',
      description: 'Write content to a file, creating directories if needed',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to write to',
          },
          content: {
            type: 'string',
            description: 'The content to write',
          },
        },
        required: ['path', 'content'],
      },
    },

    search_code: {
      name: 'search_code',
      description: 'Search for patterns in the codebase using grep',
      input_schema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The pattern to search for',
          },
          file_pattern: {
            type: 'string',
            description: 'Optional file glob pattern (e.g., "*.ts")',
          },
        },
        required: ['pattern'],
      },
    },

    run_command: {
      name: 'run_command',
      description: 'Execute a shell command in the project directory',
      input_schema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The command to execute',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
          },
        },
        required: ['command'],
      },
    },

    delegate_to_agent: {
      name: 'delegate_to_agent',
      description: 'Delegate a task to another specialized agent',
      input_schema: {
        type: 'object',
        properties: {
          agent: {
            type: 'string',
            enum: ['backend', 'frontend', 'database', 'testing', 'security', 'devops'],
            description: 'The agent to delegate to',
          },
          task: {
            type: 'string',
            description: 'The task to delegate',
          },
        },
        required: ['agent', 'task'],
      },
    },

    create_checkpoint: {
      name: 'create_checkpoint',
      description: 'Create a git checkpoint before making changes',
      input_schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Checkpoint description',
          },
        },
        required: ['message'],
      },
    },
  },

  // Agent system prompts
  agentPrompts: {
    orchestrator: `You are the Ultra-Dex Orchestrator Agent - the "Hive Mind" that coordinates complex software development tasks.

Your role:
1. Break down complex tasks into atomic subtasks
2. Delegate to specialized agents (@Backend, @Frontend, @Database, etc.)
3. Track progress and handle failures
4. Ensure code quality and consistency

You have access to tools to read/write files, search code, run commands, and delegate to other agents.

IMPORTANT: Always create a checkpoint before making significant changes. Always verify changes work before completing.`,

    backend: `You are the @Backend Agent - an expert in API development, server-side logic, and system architecture.

Expertise:
- Node.js, Python, Go, Rust backends
- REST APIs, GraphQL, tRPC
- Database interactions (Prisma, Drizzle, raw SQL)
- Authentication and authorization
- Server Actions (Next.js 15)

When implementing:
1. Follow existing code patterns in the project
2. Add proper error handling
3. Include TypeScript types
4. Write tests for critical paths`,

    frontend: `You are the @Frontend Agent - an expert in modern UI development and user experience.

Expertise:
- React, Next.js, Vue, Svelte
- Server Components vs Client Components
- State management (Zustand, Jotai, Redux)
- CSS-in-JS, Tailwind CSS
- Accessibility (WCAG 2.1)

When implementing:
1. Prefer Server Components when possible
2. Use proper semantic HTML
3. Ensure responsive design
4. Follow the project's component patterns`,

    database: `You are the @Database Agent - an expert in data modeling, queries, and database optimization.

Expertise:
- PostgreSQL, MySQL, MongoDB, SQLite
- Prisma, Drizzle, TypeORM
- Schema design and migrations
- Query optimization
- Row-Level Security (RLS)

When implementing:
1. Design normalized schemas
2. Add proper indexes
3. Consider query performance
4. Implement soft deletes when appropriate`,

    testing: `You are the @Testing Agent - an expert in test automation and quality assurance.

Expertise:
- Jest, Vitest, Mocha
- Playwright, Cypress for E2E
- Testing Library for component tests
- Mock Service Worker (MSW)
- Coverage analysis

When implementing:
1. Write unit tests for business logic
2. Write integration tests for APIs
3. Write E2E tests for critical flows
4. Aim for 80%+ coverage on critical code`,

    security: `You are the @Security Agent - an expert in application security and vulnerability prevention.

Expertise:
- OWASP Top 10
- Authentication/Authorization
- Input validation and sanitization
- SQL injection, XSS, CSRF prevention
- Secure coding practices

When reviewing:
1. Check for injection vulnerabilities
2. Verify authentication flows
3. Ensure proper authorization checks
4. Review data exposure risks`,

    devops: `You are the @DevOps Agent - an expert in CI/CD, deployment, and infrastructure.

Expertise:
- GitHub Actions, GitLab CI
- Docker, Kubernetes
- Vercel, Railway, AWS
- Monitoring (Sentry, DataDog)
- Infrastructure as Code

When implementing:
1. Create reliable CI/CD pipelines
2. Configure proper environments
3. Set up monitoring and alerts
4. Document deployment procedures`,
  },
};

// ============================================================================
// TOOL EXECUTORS
// ============================================================================

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';

const execAsync = promisify(execCallback);

/**
 * Execute a tool call
 */
async function executeTool(toolName, input, context = {}) {
  const { workdir = process.cwd() } = context;

  switch (toolName) {
    case 'read_file': {
      const filepath = path.resolve(workdir, input.path);
      try {
        const content = await fs.readFile(filepath, 'utf8');
        return { success: true, content };
      } catch (err) {
        return { success: false, error: `Failed to read file: ${err.message}` };
      }
    }

    case 'write_file': {
      const filepath = path.resolve(workdir, input.path);
      try {
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, input.content, 'utf8');
        return { success: true, message: `Wrote ${input.path}` };
      } catch (err) {
        return { success: false, error: `Failed to write file: ${err.message}` };
      }
    }

    case 'search_code': {
      try {
        const pattern = input.pattern;
        const filePattern = input.file_pattern || '**/*';

        const files = await glob(filePattern, {
          cwd: workdir,
          ignore: ['node_modules/**', '.git/**', 'dist/**'],
          nodir: true,
        });

        const results = [];
        for (const file of files.slice(0, 50)) {
          // Limit search
          try {
            const content = await fs.readFile(path.join(workdir, file), 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
              if (line.includes(pattern)) {
                results.push({
                  file,
                  line: idx + 1,
                  content: line.trim().slice(0, 200),
                });
              }
            });
          } catch {
            // Skip unreadable files
          }
        }

        return { success: true, results: results.slice(0, 20) };
      } catch (err) {
        return { success: false, error: `Search failed: ${err.message}` };
      }
    }

    case 'run_command': {
      try {
        const timeout = input.timeout || 30000;
        const { stdout, stderr } = await execAsync(input.command, {
          cwd: workdir,
          timeout,
        });
        return { success: true, stdout, stderr };
      } catch (err) {
        return { success: false, error: err.message, stderr: err.stderr };
      }
    }

    case 'create_checkpoint': {
      try {
        await execAsync('git add -A', { cwd: workdir });
        await execAsync(`git commit -m "checkpoint: ${input.message}" --allow-empty`, {
          cwd: workdir,
        });
        return { success: true, message: `Checkpoint created: ${input.message}` };
      } catch (err) {
        return { success: false, error: `Checkpoint failed: ${err.message}` };
      }
    }

    case 'delegate_to_agent': {
      // This will be handled by the agent loop
      return {
        success: true,
        delegation: {
          agent: input.agent,
          task: input.task,
        },
      };
    }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ============================================================================
// AUTONOMOUS AGENT CLASS
// ============================================================================

/**
 * Autonomous Agent powered by Anthropic Agent SDK
 */
export class AutonomousAgent {
  constructor(agentType, options = {}) {
    this.type = agentType;
    this.options = options;
    this.history = [];
    this.toolResults = [];
    this.maxTurns = options.maxTurns || 10;
    this.verbose = options.verbose || false;

    // System prompt for this agent type
    this.systemPrompt =
      AGENT_SDK_CONFIG.agentPrompts[agentType] || AGENT_SDK_CONFIG.agentPrompts.orchestrator;

    // Available tools
    this.tools = Object.values(AGENT_SDK_CONFIG.tools);
  }

  /**
   * Run the agent on a task
   */
  async run(task, context = {}) {
    const { provider, workdir = process.cwd() } = context;

    if (!provider) {
      throw new Error('Provider required for autonomous agent');
    }

    if (this.verbose) {
      console.log(chalk.cyan(`\n🤖 ${this.type.toUpperCase()} Agent starting...`));
      console.log(chalk.gray(`Task: ${task}\n`));
    }

    const messages = [{ role: 'user', content: task }];

    let turn = 0;
    let finalResult = null;

    while (turn < this.maxTurns) {
      turn++;

      if (this.verbose) {
        console.log(chalk.gray(`--- Turn ${turn}/${this.maxTurns} ---`));
      }

      // Call the model
      const response = await provider.generateWithTools(this.systemPrompt, messages, this.tools);

      // Check for tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Execute tools
        const toolMessages = [];

        for (const toolCall of response.toolCalls) {
          if (this.verbose) {
            console.log(
              chalk.yellow(
                `  🔧 ${toolCall.name}(${JSON.stringify(toolCall.input).slice(0, 50)}...)`
              )
            );
          }

          const result = await executeTool(toolCall.name, toolCall.input, { workdir });
          this.toolResults.push({ tool: toolCall.name, input: toolCall.input, result });

          // Handle delegation
          if (result.delegation) {
            const subAgent = new AutonomousAgent(result.delegation.agent, this.options);
            const subResult = await subAgent.run(result.delegation.task, context);
            toolMessages.push({
              role: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify({
                delegated: true,
                agent: result.delegation.agent,
                result: subResult,
              }),
            });
          } else {
            toolMessages.push({
              role: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Add assistant message and tool results to history
        messages.push({
          role: 'assistant',
          content: response.content,
          tool_calls: response.toolCalls,
        });
        messages.push(...toolMessages);
      } else {
        // No tool calls - agent is done
        finalResult = response.content;

        if (this.verbose) {
          console.log(chalk.green(`\n✅ Agent completed`));
        }

        break;
      }
    }

    if (!finalResult) {
      finalResult = 'Max turns reached without completion';
    }

    this.history = messages;

    return {
      success: true,
      result: finalResult,
      turns: turn,
      toolsUsed: this.toolResults.length,
      history: this.history,
    };
  }

  /**
   * Get execution summary
   */
  getSummary() {
    return {
      agent: this.type,
      toolsUsed: this.toolResults.map((t) => t.tool),
      historyLength: this.history.length,
    };
  }
}

// ============================================================================
// MULTI-AGENT SWARM
// ============================================================================

/**
 * Run a multi-agent swarm for complex tasks
 */
export async function runAutonomousSwarm(task, options = {}) {
  const { provider, workdir = process.cwd(), verbose = false } = options;

  console.log(chalk.cyan('\n🐝 Ultra-Dex Autonomous Swarm\n'));
  console.log(chalk.bold(`Task: ${task}\n`));

  // Start with orchestrator
  const orchestrator = new AutonomousAgent('orchestrator', {
    maxTurns: 15,
    verbose,
  });

  const result = await orchestrator.run(task, { provider, workdir });

  console.log(chalk.cyan('\n📊 Swarm Summary:'));
  console.log(`  Turns: ${result.turns}`);
  console.log(`  Tools used: ${result.toolsUsed}`);
  console.log(chalk.green(`\n✅ Swarm completed`));

  return result;
}

// ============================================================================
// PROVIDER EXTENSION
// ============================================================================

/**
 * Extend a provider with tool-use capability
 */
export function extendProviderWithTools(provider) {
  if (provider.generateWithTools) {
    return provider; // Already extended
  }

  provider.generateWithTools = async function (systemPrompt, messages, tools) {
    // For providers that don't natively support tools,
    // we simulate tool use through the prompt
    const toolDescriptions = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');

    const enhancedSystem = `${systemPrompt}

Available tools:
${toolDescriptions}

To use a tool, output JSON in this format:
{"tool": "tool_name", "input": {...}}

After receiving tool results, continue your work or provide your final answer.`;

    const result = await this.generate(enhancedSystem, messages[messages.length - 1].content);

    // Parse tool calls from response
    const toolCallMatch = result.content.match(/\{"tool":\s*"(\w+)",\s*"input":\s*(\{[^}]+\})\}/);

    if (toolCallMatch) {
      return {
        content: result.content,
        toolCalls: [
          {
            id: `tool_${Date.now()}`,
            name: toolCallMatch[1],
            input: JSON.parse(toolCallMatch[2]),
          },
        ],
      };
    }

    return {
      content: result.content,
      toolCalls: null,
    };
  };

  return provider;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AutonomousAgent,
  runAutonomousSwarm,
  extendProviderWithTools,
  executeTool,
  AGENT_SDK_CONFIG,
};
