#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Import Ultra-Dex components
import { Orchestrator } from '../../src/core/orchestration/orchestrator.js';
import { ExecutionEngine } from '../../src/core/orchestration/execution-engine.js';
import TraceCollector from '../../src/core/observability/trace-collector.js';

// Initialize components
const orchestrator = new Orchestrator();
const executionEngine = new ExecutionEngine();
const traceCollector = new TraceCollector();

// Create MCP server
const server = new McpServer({
  name: 'ultra-dex-mcp-server',
  version: '1.0.0',
});

// Register tools
server.registerTool(
  'ultra-dex-plan',
  {
    title: 'Plan Ultra-Dex Task',
    description: 'Plans a task using Ultra-Dex Orchestrator v2.0',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'The task input to orchestrate' },
        mode: {
          type: 'string',
          enum: ['simple', 'detailed', 'iterative'],
          description: 'Orchestration mode',
        },
        context: { type: 'object', description: 'Additional context for orchestration' },
      },
      required: ['input'],
    },
  },
  async ({ input, mode = 'simple', context = {} }) => {
    try {
      const task = await orchestrator.orchestrate(input, mode, context);
      return {
        content: [{ type: 'text', text: `Task planned: ${JSON.stringify(task, null, 2)}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Planning failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  'ultra-dex-execute',
  {
    title: 'Execute Ultra-Dex Task',
    description: 'Executes a planned task using Ultra-Dex ExecutionEngine',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The ID of the task to execute' },
        taskInput: { type: 'string', description: 'Task input if creating new task' },
        agent: { type: 'string', description: 'Agent to assign' },
        steps: { type: 'array', description: 'Execution steps' },
      },
      required: ['taskId'],
    },
  },
  async ({ taskId, taskInput, agent, steps }) => {
    try {
      let task;
      if (taskId) {
        // Assume task is passed or retrieved; for simplicity, create new
        task = {
          id: taskId,
          input: taskInput || 'execute task',
          agent: agent || 'default',
          steps: steps || [],
        };
      }
      const result = await executionEngine.execute(task);
      return {
        content: [{ type: 'text', text: `Task executed: ${JSON.stringify(result, null, 2)}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Execution failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  'ultra-dex-trace',
  {
    title: 'Retrieve Ultra-Dex Trace',
    description: 'Retrieves execution trace by ID',
    inputSchema: {
      type: 'object',
      properties: {
        traceId: { type: 'string', description: 'The trace ID to retrieve' },
      },
      required: ['traceId'],
    },
  },
  async ({ traceId }) => {
    try {
      const trace = traceCollector.get(traceId);
      if (!trace) {
        return {
          content: [{ type: 'text', text: `Trace not found: ${traceId}` }],
        };
      }
      return {
        content: [{ type: 'text', text: `Trace: ${JSON.stringify(trace, null, 2)}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Trace retrieval failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Connect to stdio transport
await server.connect(new StdioServerTransport());

// Handle process termination
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});
