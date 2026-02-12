/**
 * Ultra-Dex MCP Server with Expanded Tools
 * Model Context Protocol server for IDE integrations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ppmManager } from '../memory/manager.js';
import { agentOrchestrator } from '../orchestration/index.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ExpandedMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ultra-dex-mcp-server',
        version: '6.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // File Operations
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file' },
              encoding: { type: 'string', default: 'utf8' },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file' },
              content: { type: 'string', description: 'Content to write' },
              encoding: { type: 'string', default: 'utf8' },
            },
            required: ['path', 'content'],
          },
        },
        // Code Operations
        {
          name: 'search_code',
          description: 'Search for code patterns in the project',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query or pattern' },
              path: { type: 'string', description: 'Directory to search in' },
              filePattern: { type: 'string', description: 'File pattern (e.g., *.js)' },
            },
            required: ['query'],
          },
        },
        // Command Operations
        {
          name: 'run_command',
          description: 'Execute a shell command',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' },
              cwd: { type: 'string', description: 'Working directory' },
              timeout: { type: 'number', default: 30000 },
            },
            required: ['command'],
          },
        },
        // Git Operations
        {
          name: 'git_status',
          description: 'Get git status of the repository',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to git repository' },
            },
          },
        },
        {
          name: 'git_diff',
          description: 'Get git diff',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              staged: { type: 'boolean', default: false },
            },
          },
        },
        // Memory Operations
        {
          name: 'query_memory',
          description: 'Query the Ultra-Dex tiered memory (Hot/Warm/Cold)',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              tier: { type: 'string', enum: ['hot', 'warm', 'cold'] },
            },
            required: ['query'],
          },
        },
        {
          name: 'store_memory',
          description: 'Store information in Ultra-Dex memory',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              type: { type: 'string', enum: ['observation', 'decision', 'constraint'] },
              importance: { type: 'number', minimum: 1, maximum: 10 },
            },
            required: ['content', 'type'],
          },
        },
        // Agent Operations
        {
          name: 'list_agents',
          description: 'List all available agents',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_agent_status',
          description: 'Get the status of all active agents in the swarm',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'run_agent',
          description: 'Run an agent with a specific task',
          inputSchema: {
            type: 'object',
            properties: {
              agent: { type: 'string', description: 'Agent ID' },
              task: { type: 'string', description: 'Task description' },
              context: { type: 'object' },
            },
            required: ['agent', 'task'],
          },
        },
        // Project Operations
        {
          name: 'list_files',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path' },
              recursive: { type: 'boolean', default: false },
              pattern: { type: 'string' },
            },
          },
        },
        {
          name: 'get_project_info',
          description: 'Get information about the current project',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // File Operations
          case 'read_file':
            return await this.readFile(args);

          case 'write_file':
            return await this.writeFile(args);

          // Code Operations
          case 'search_code':
            return await this.searchCode(args);

          // Command Operations
          case 'run_command':
            return await this.runCommand(args);

          // Git Operations
          case 'git_status':
            return await this.gitStatus(args);

          case 'git_diff':
            return await this.gitDiff(args);

          // Memory Operations
          case 'query_memory':
            return await this.queryMemory(args);

          case 'store_memory':
            return await this.storeMemory(args);

          // Agent Operations
          case 'list_agents':
            return await this.listAgents();

          case 'get_agent_status':
            return await this.getAgentStatus();

          case 'run_agent':
            return await this.runAgent(args);

          // Project Operations
          case 'list_files':
            return await this.listFiles(args);

          case 'get_project_info':
            return await this.getProjectInfo();

          default:
            throw new Error(`Tool not found: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // File Operations
  async readFile(args) {
    const content = await fs.readFile(args.path, args.encoding || 'utf8');
    return {
      content: [{ type: 'text', text: content }],
    };
  }

  async writeFile(args) {
    await fs.mkdir(path.dirname(args.path), { recursive: true });
    await fs.writeFile(args.path, args.content, args.encoding || 'utf8');
    return {
      content: [{ type: 'text', text: `Successfully wrote to ${args.path}` }],
    };
  }

  // Code Operations
  async searchCode(args) {
    const { stdout } = await execAsync(
      `grep -r "${args.query}" ${args.path || '.'} --include="${args.filePattern || '*'}" -n`,
      { cwd: args.path || process.cwd() }
    );
    return {
      content: [{ type: 'text', text: stdout || 'No matches found' }],
    };
  }

  // Command Operations
  async runCommand(args) {
    const { stdout, stderr } = await execAsync(args.command, {
      cwd: args.cwd || process.cwd(),
      timeout: args.timeout || 30000,
    });
    return {
      content: [
        { type: 'text', text: stdout },
        ...(stderr ? [{ type: 'text', text: `stderr: ${stderr}` }] : []),
      ],
    };
  }

  // Git Operations
  async gitStatus(args) {
    const { stdout } = await execAsync('git status', {
      cwd: args.path || process.cwd(),
    });
    return {
      content: [{ type: 'text', text: stdout }],
    };
  }

  async gitDiff(args) {
    const cmd = args.staged ? 'git diff --staged' : 'git diff';
    const { stdout } = await execAsync(cmd, {
      cwd: args.path || process.cwd(),
    });
    return {
      content: [{ type: 'text', text: stdout || 'No changes' }],
    };
  }

  // Memory Operations
  async queryMemory(args) {
    const results = await ppmManager.search(args.query);
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  }

  async storeMemory(args) {
    const entry = await ppmManager.add({
      content: args.content,
      type: args.type,
      importance: args.importance,
      source: 'mcp',
    });
    return {
      content: [{ type: 'text', text: `Stored memory entry: ${entry.id}` }],
    };
  }

  // Agent Operations
  async listAgents() {
    const agents = [
      { id: 'architect', name: 'Architect', description: 'Designs system architecture' },
      { id: 'coder', name: 'Coder', description: 'Writes and refactors code' },
      { id: 'reviewer', name: 'Reviewer', description: 'Reviews code quality' },
      { id: 'tester', name: 'Tester', description: 'Creates and runs tests' },
    ];
    return {
      content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }],
    };
  }

  async getAgentStatus() {
    const sessions = agentOrchestrator.getActiveSessions?.() || [];
    return {
      content: [{ type: 'text', text: JSON.stringify(sessions, null, 2) }],
    };
  }

  async runAgent(args) {
    // Simulate agent execution
    return {
      content: [
        {
          type: 'text',
          text: `Running agent '${args.agent}' with task: ${args.task}\nStatus: started\nContext: ${JSON.stringify(args.context || {})}`,
        },
      ],
    };
  }

  // Project Operations
  async listFiles(args) {
    const files = await fs.readdir(args.path || '.', { recursive: args.recursive });
    const filtered = args.pattern ? files.filter((f) => f.match(new RegExp(args.pattern))) : files;
    return {
      content: [{ type: 'text', text: filtered.join('\n') }],
    };
  }

  async getProjectInfo() {
    const pkg = await fs.readFile('package.json', 'utf8').catch(() => '{}');
    const info = JSON.parse(pkg);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              name: info.name,
              version: info.version,
              description: info.description,
              workspace: process.cwd(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Ultra-Dex MCP Server with expanded tools running on Stdio');
  }
}

export const mcpServer = new ExpandedMCPServer();
export default ExpandedMCPServer;
