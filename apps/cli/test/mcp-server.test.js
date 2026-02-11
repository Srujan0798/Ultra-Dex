/**
 * Unit tests for MCP server components
 * Tests: Server initialization, WebSocket, tools, resources
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('MCP Server Components', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-mcp-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('MCP Server', () => {
    test('exports startMcpServer function', async () => {
      const { startMcpServer } = await import('../lib/mcp/server.js');
      assert.strictEqual(typeof startMcpServer, 'function');
    });

    test('accepts options parameter with defaults', async () => {
      const { startMcpServer } = await import('../lib/mcp/server.js');
      // Function has default parameter so length is 0, but it accepts options
      assert.ok(
        startMcpServer.length === 0 || startMcpServer.length === 1,
        'Should accept optional options parameter'
      );
    });
  });

  describe('WebSocket Server', () => {
    test('UltraDexWebSocketServer class exists', async () => {
      const wsModule = await import('../lib/mcp/websocket.js');
      assert.ok(wsModule.UltraDexWebSocketServer, 'Should export UltraDexWebSocketServer class');
    });

    test('WebSocket server initializes with default port', async () => {
      const { UltraDexWebSocketServer } = await import('../lib/mcp/websocket.js');
      const server = new UltraDexWebSocketServer();

      assert.strictEqual(server.port, 3002, 'Should default to port 3002');
      assert.ok(server.clients instanceof Set, 'Should have clients Set');
    });

    test('WebSocket server accepts custom port', async () => {
      const { UltraDexWebSocketServer } = await import('../lib/mcp/websocket.js');
      const server = new UltraDexWebSocketServer(8080);

      assert.strictEqual(server.port, 8080, 'Should accept custom port');
    });

    test('WebSocket server has heartbeat configuration', async () => {
      const { UltraDexWebSocketServer } = await import('../lib/mcp/websocket.js');
      const server = new UltraDexWebSocketServer();

      assert.strictEqual(server.heartbeatIntervalMs, 30000, 'Should have 30s heartbeat');
      assert.strictEqual(server.connectionTimeout, 60000, 'Should have 60s timeout');
      assert.strictEqual(server.cleanupIntervalMs, 60000, 'Should have 60s cleanup');
    });

    test('webSocketServer singleton exists', async () => {
      const { webSocketServer } = await import('../lib/mcp/websocket.js');
      assert.ok(webSocketServer, 'Should export webSocketServer singleton');
    });
  });

  describe('MCP Tools', () => {
    test('registerTools function exists', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');
      assert.strictEqual(typeof registerTools, 'function');
    });

    test('registerTools accepts server parameter', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');
      assert.strictEqual(registerTools.length, 1, 'Should accept 1 parameter');
    });

    test('registers remember tool', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');

      const mockServer = {
        tools: [],
        tool(name, description, schema, handler) {
          this.tools.push({ name, description, schema, handler });
        },
      };

      registerTools(mockServer);

      const rememberTool = mockServer.tools.find((t) => t.name === 'remember');
      assert.ok(rememberTool, 'Should register remember tool');
      assert.ok(rememberTool.description.includes('Save'), 'Should have description');
    });

    test('registers recall tool', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');

      const mockServer = {
        tools: [],
        tool(name, description, schema, handler) {
          this.tools.push({ name, description, schema, handler });
        },
      };

      registerTools(mockServer);

      const recallTool = mockServer.tools.find((t) => t.name === 'recall');
      assert.ok(recallTool, 'Should register recall tool');
      assert.ok(recallTool.description.includes('Search'), 'Should have description');
    });

    test('registers clear_memory tool', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');

      const mockServer = {
        tools: [],
        tool(name, description, schema, handler) {
          this.tools.push({ name, description, schema, handler });
        },
      };

      registerTools(mockServer);

      const clearTool = mockServer.tools.find((t) => t.name === 'clear_memory');
      assert.ok(clearTool, 'Should register clear_memory tool');
    });

    test('tools have proper zod schemas', async () => {
      const { registerTools } = await import('../lib/mcp/tools.js');

      const mockServer = {
        tools: [],
        tool(name, description, schema) {
          this.tools.push({ name, description, schema });
        },
      };

      registerTools(mockServer);

      // Check remember tool schema
      const rememberTool = mockServer.tools.find((t) => t.name === 'remember');
      assert.ok(rememberTool.schema, 'Should have schema');
      assert.ok(rememberTool.schema.text, 'Should have text field');
      assert.ok(rememberTool.schema.tags, 'Should have tags field');
      assert.ok(rememberTool.schema.source, 'Should have source field');
    });
  });

  describe('MCP Resources', () => {
    test('registerResources function exists', async () => {
      const { registerResources } = await import('../lib/mcp/resources.js');
      assert.strictEqual(typeof registerResources, 'function');
    });

    test('registers graph resource', async () => {
      const { registerResources } = await import('../lib/mcp/resources.js');

      const mockServer = {
        resources: [],
        resource(name, uri, handler) {
          this.resources.push({ name, uri, handler });
        },
      };

      registerResources(mockServer);

      const graphResource = mockServer.resources.find((r) => r.name === 'graph');
      assert.ok(graphResource, 'Should register graph resource');
      assert.ok(graphResource.uri.includes('graph'), 'Should have graph URI');
    });

    test('registers context resource', async () => {
      const { registerResources } = await import('../lib/mcp/resources.js');

      const mockServer = {
        resources: [],
        resource(name, uri, handler) {
          this.resources.push({ name, uri, handler });
        },
      };

      registerResources(mockServer);

      const contextResource = mockServer.resources.find((r) => r.name === 'context');
      assert.ok(contextResource, 'Should register context resource');
      assert.ok(contextResource.uri.includes('context'), 'Should have context URI');
    });

    test('registers plan resource', async () => {
      const { registerResources } = await import('../lib/mcp/resources.js');

      const mockServer = {
        resources: [],
        resource(name, uri, handler) {
          this.resources.push({ name, uri, handler });
        },
      };

      registerResources(mockServer);

      const planResource = mockServer.resources.find((r) => r.name === 'plan');
      assert.ok(planResource, 'Should register plan resource');
      assert.ok(planResource.uri.includes('plan'), 'Should have plan URI');
    });

    test('context resource handler returns fallback when no file', async () => {
      const { registerResources } = await import('../lib/mcp/resources.js');

      const mockServer = {
        resources: [],
        resource(name, uri, handler) {
          this.resources.push({ name, uri, handler });
        },
      };

      registerResources(mockServer);

      const contextResource = mockServer.resources.find((r) => r.name === 'context');
      const result = await contextResource.handler({ href: 'ultradex://context' });

      assert.ok(result.contents, 'Should return contents array');
      assert.ok(result.contents[0].text.includes('No CONTEXT.md'), 'Should have fallback message');
    });

    test('context resource handler reads existing file', async () => {
      // Create CONTEXT.md
      await fs.writeFile(path.join(tmpDir, 'CONTEXT.md'), '# Test Context\n\nTest content.');

      const { registerResources } = await import('../lib/mcp/resources.js');

      const mockServer = {
        resources: [],
        resource(name, uri, handler) {
          this.resources.push({ name, uri, handler });
        },
      };

      registerResources(mockServer);

      const contextResource = mockServer.resources.find((r) => r.name === 'context');
      const result = await contextResource.handler({ href: 'ultradex://context' });

      assert.ok(result.contents[0].text.includes('# Test Context'), 'Should read file content');
    });
  });

  describe('MCP Memory', () => {
    test('ultraMemory exists', async () => {
      const { ultraMemory } = await import('../lib/mcp/memory.js');
      assert.ok(ultraMemory, 'Should export ultraMemory');
    });

    test('ultraMemory has required methods', async () => {
      const { ultraMemory } = await import('../lib/mcp/memory.js');

      assert.strictEqual(typeof ultraMemory.remember, 'function', 'Should have remember method');
      assert.strictEqual(typeof ultraMemory.search, 'function', 'Should have search method');
      assert.strictEqual(typeof ultraMemory.clear, 'function', 'Should have clear method');
    });
  });
});

/**
 * Error handler for mcp-server.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[mcp-server.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
