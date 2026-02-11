/**
 * @fileoverview Server Integration Test module
 * @module mcp/server.integration.test
 */

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  ListToolsResultSchema,
  ListResourcesResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createMcpServer } from '../../lib/mcp/server.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'ultra-dex.js');

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(port, pathName = '/api/info') {
  const url = `http://localhost:${port}${pathName}`;
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // keep retrying
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Server on port ${port} did not respond in time`);
}

async function createTempProject() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-mcp-int-'));
  await fs.writeFile(path.join(tmpDir, 'CONTEXT.md'), '# Test Context');
  await fs.writeFile(path.join(tmpDir, 'IMPLEMENTATION-PLAN.md'), '# Test Plan');
  return tmpDir;
}

describe('MCP Server Integration (stdio via in-memory transport)', () => {
  test('lists tools and resources', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer();

    await server.connect(serverTransport);

    const client = new Client({ name: 'test-client', version: '0.0.1' });
    await client.connect(clientTransport);

    const tools = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    assert.ok(tools.tools.length > 0, 'Expected tools to be available');
    assert.ok(
      tools.tools.some((tool) => tool.name === 'remember'),
      'Expected remember tool'
    );

    const resources = await client.request(
      { method: 'resources/list', params: {} },
      ListResourcesResultSchema
    );
    assert.ok(resources.resources.length > 0, 'Expected resources to be available');
    assert.ok(
      resources.resources.some((resource) => resource.name === 'graph'),
      'Expected graph resource'
    );

    await clientTransport.close();
  });
});

describe('MCP Server Integration (HTTP + SSE)', () => {
  let child;
  let tmpDir;
  let port;
  let transport;

  afterEach(async () => {
    if (transport) {
      await transport.close();
      transport = null;
    }
    if (child) {
      child.kill('SIGTERM');
      child = null;
    }
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  test('SSE transport lists tools and resources', async () => {
    tmpDir = await createTempProject();
    port = await getAvailablePort();

    child = spawn(process.execPath, [cliPath, 'serve', '--port', String(port)], {
      cwd: tmpDir,
      env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent' },
      stdio: 'ignore',
    });

    await waitForHttp(port);

    const client = new Client({ name: 'sse-client', version: '0.0.1' });
    transport = new SSEClientTransport(new URL(`http://localhost:${port}/sse`));
    await client.connect(transport);

    const tools = await client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    assert.ok(tools.tools.length > 0, 'Expected tools to be available over SSE');

    const resources = await client.request(
      { method: 'resources/list', params: {} },
      ListResourcesResultSchema
    );
    assert.ok(resources.resources.length > 0, 'Expected resources to be available over SSE');
  });
});
