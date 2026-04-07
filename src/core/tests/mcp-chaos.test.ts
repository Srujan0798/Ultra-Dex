// Copyright (c) 2026 Ultra-Dex
// Tests for MCP Tool Servers + Chaos Engine

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── MCP Servers ─────────────────────────────────────────────────────────────

import {
    BaseMCPServer,
    FilesystemMCPServer,
    MemoryMCPServer,
    CodeExecMCPServer,
    MCPServerRegistry,
    createDefaultRegistry,
} from '../../../mcp/servers/index.js';

describe('BaseMCPServer', () => {
    it('should register and call tools', async () => {
        const server = new BaseMCPServer({ name: 'test' });
        server.registerTool('greet', {
            description: 'Say hello',
            handler: async ({ name }) => `Hello ${name}!`,
        });
        const result = await server.callTool('greet', { name: 'Ultra-Dex' });
        assert.equal(result.success, true);
        assert.equal(result.result, 'Hello Ultra-Dex!');
    });

    it('should return error for unknown tool', async () => {
        const server = new BaseMCPServer({ name: 'test' });
        await assert.rejects(
            () => server.callTool('nonexistent'),
            /not found/
        );
    });

    it('should list tools with server prefix', () => {
        const server = new BaseMCPServer({ name: 'demo' });
        server.registerTool('action', { description: 'Do something', handler: async () => { } });
        const tools = server.listTools();
        assert.equal(tools[0].name, 'demo/action');
    });

    it('should track stats', async () => {
        const server = new BaseMCPServer({ name: 'test' });
        server.registerTool('work', { description: 'Work', handler: async () => 42 });
        await server.callTool('work');
        await server.callTool('work');
        const stats = server.getStats();
        assert.equal(stats.calls, 2);
        assert.equal(stats.errors, 0);
    });

    it('should count errors', async () => {
        const server = new BaseMCPServer({ name: 'test' });
        server.registerTool('fail', { description: 'Fail', handler: async () => { throw new Error('boom'); } });
        const result = await server.callTool('fail');
        assert.equal(result.success, false);
        assert.ok(result.error.includes('boom'));
        assert.equal(server.getStats().errors, 1);
    });

    it('should generate manifest', () => {
        const server = new BaseMCPServer({ name: 'my-server', version: '2.0', description: 'Test' });
        server.registerTool('t1', { description: 'Tool 1', handler: async () => { } });
        const manifest = server.getManifest();
        assert.equal(manifest.name, 'my-server');
        assert.equal(manifest.version, '2.0');
        assert.equal(manifest.tools.length, 1);
    });
});

describe('FilesystemMCPServer', () => {
    it('should list directory contents', async () => {
        const fs = new FilesystemMCPServer({ rootDir: process.cwd() });
        const result = await fs.callTool('list_dir', { path: '.' });
        assert.equal(result.success, true);
        assert.ok(result.result.length > 0);
    });

    it('should read a file', async () => {
        const fs = new FilesystemMCPServer({ rootDir: process.cwd() });
        const result = await fs.callTool('read_file', { path: 'package.json' });
        assert.equal(result.success, true);
        assert.ok(result.result.content.includes('Ultra-Dex') || result.result.content.includes('ultra-dex') || result.result.content.includes('{'));
    });

    it('should block path traversal', async () => {
        const fs = new FilesystemMCPServer({ rootDir: '/tmp/sandbox-test' });
        const result = await fs.callTool('read_file', { path: '../../../etc/passwd' });
        assert.equal(result.success, false);
        assert.ok(result.error.includes('sandbox') || result.error.includes('escape'));
    });

    it('should refuse writes when disabled', async () => {
        const fs = new FilesystemMCPServer({ allowWrite: false });
        const result = await fs.callTool('write_file', { path: 'test.txt', content: 'hello' });
        assert.equal(result.success, false);
    });
});

describe('MemoryMCPServer', () => {
    it('should expose memory tools', () => {
        const mem = new MemoryMCPServer();
        const tools = mem.listTools();
        assert.ok(tools.some(t => t.name.includes('store')));
        assert.ok(tools.some(t => t.name.includes('retrieve')));
        assert.ok(tools.some(t => t.name.includes('query_graph')));
    });

    it('should fail when memory API not connected', async () => {
        const mem = new MemoryMCPServer();
        const result = await mem.callTool('stats');
        assert.equal(result.success, false);
        assert.ok(result.error.includes('not connected'));
    });

    it('should work with a mock memory API', async () => {
        const mockApi = { getStats: async () => ({ entries: 42, tier: 'hot' }) };
        const mem = new MemoryMCPServer({ memoryApi: mockApi });
        const result = await mem.callTool('stats');
        assert.equal(result.success, true);
        assert.equal(result.result.entries, 42);
    });
});

describe('CodeExecMCPServer', () => {
    it('should evaluate expressions', async () => {
        const exec = new CodeExecMCPServer();
        const result = await exec.callTool('eval_expression', { expression: '2 + 2' });
        assert.equal(result.success, true);
        assert.equal(result.result.result, '4');
    });

    it('should handle eval errors', async () => {
        const exec = new CodeExecMCPServer();
        const result = await exec.callTool('eval_expression', { expression: 'undefined.foo' });
        assert.equal(result.success, true);
        assert.ok(result.result.error);
    });
});

describe('MCPServerRegistry', () => {
    it('should register and discover tools', () => {
        const registry = new MCPServerRegistry();
        const server = new BaseMCPServer({ name: 'custom' });
        server.registerTool('do-magic', { description: 'Magic tool', handler: async () => 'magic' });
        registry.register(server);

        const tools = registry.listAllTools();
        assert.ok(tools.some(t => t.name === 'custom/do-magic'));
    });

    it('should call tools by full name', async () => {
        const registry = new MCPServerRegistry();
        const server = new BaseMCPServer({ name: 'math' });
        server.registerTool('add', { description: 'Add', handler: async ({ a, b }) => a + b });
        registry.register(server);

        const result = await registry.callTool('math/add', { a: 3, b: 4 });
        assert.equal(result.result, 7);
    });

    it('should discover tools by capability', () => {
        const registry = new MCPServerRegistry();
        const s1 = new BaseMCPServer({ name: 's1' });
        s1.registerTool('search', { description: 'Search files', handler: async () => { } });
        const s2 = new BaseMCPServer({ name: 's2' });
        s2.registerTool('search-web', { description: 'Search the web', handler: async () => { } });
        registry.register(s1);
        registry.register(s2);

        const found = registry.discoverByCapability('search');
        assert.equal(found.length, 2);
    });

    it('should create default registry with all servers', () => {
        const registry = createDefaultRegistry();
        assert.ok(registry.get('github'));
        assert.ok(registry.get('filesystem'));
        assert.ok(registry.get('memory'));
        assert.ok(registry.get('web-search'));
        assert.ok(registry.get('code-exec'));
        assert.ok(registry.listAllTools().length >= 10);
    });
});

// ── Chaos Engine ────────────────────────────────────────────────────────────

import { ChaosAttack, ChaosEngine, builtInAttacks } from '../testing/chaos-engine.js';

describe('ChaosAttack', () => {
    it('should execute and track results', async () => {
        const attack = new ChaosAttack({
            name: 'test-attack',
            description: 'Test',
            severity: 'low',
            attackFn: async (target) => {
                const result = await target();
                return { survived: result === 'ok' };
            },
        });

        const run = await attack.execute(async () => 'ok');
        assert.equal(run.status, 'survived');
        assert.equal(attack.getStats().survived, 1);
    });

    it('should mark failed attacks', async () => {
        const attack = new ChaosAttack({
            name: 'fail-test',
            description: 'Always fails',
            severity: 'high',
            attackFn: async () => ({ survived: false }),
        });

        const run = await attack.execute(async () => { });
        assert.equal(run.status, 'failed');
    });
});

describe('ChaosEngine', () => {
    it('should list built-in attacks', () => {
        const engine = new ChaosEngine();
        const attacks = engine.listAttacks();
        assert.ok(attacks.length >= 6);
        assert.ok(attacks.some(a => a.name === 'latency-injection'));
        assert.ok(attacks.some(a => a.name === 'error-injection'));
        assert.ok(attacks.some(a => a.name === 'context-pollution'));
        assert.ok(attacks.some(a => a.name === 'provider-blackout'));
        assert.ok(attacks.some(a => a.name === 'infinite-loop-trap'));
    });

    it('should run a single attack', async () => {
        const engine = new ChaosEngine();
        const result = await engine.runAttack('error-injection', async () => 'ok', { errorRate: 0.3, attempts: 10 });
        assert.ok(result.status === 'survived' || result.status === 'failed');
        assert.ok(result.durationMs >= 0);
    });

    it('should run latency injection', async () => {
        const engine = new ChaosEngine();
        const result = await engine.runAttack('latency-injection', async () => 'fast', { minMs: 10, maxMs: 50, timeoutMs: 5000 });
        assert.equal(result.status, 'survived');
        assert.ok(result.result.delayInjected >= 10);
    });

    it('should run a full campaign', async () => {
        const engine = new ChaosEngine();
        const campaign = await engine.runCampaign(
            async () => 'ok',
            {
                name: 'test-campaign',
                attacks: ['error-injection', 'latency-injection'],
                config: {
                    'error-injection': { errorRate: 0.1, attempts: 3 },
                    'latency-injection': { minMs: 5, maxMs: 20, timeoutMs: 5000 },
                },
            }
        );

        assert.ok(campaign.summary);
        assert.ok(campaign.summary.grade);
        assert.ok(campaign.summary.survivalRate >= 0);
        assert.equal(campaign.results.length, 2);
    });

    it('should grade campaigns', async () => {
        const engine = new ChaosEngine();
        assert.equal(engine._grade(1.0), 'A+');
        assert.equal(engine._grade(0.9), 'A');
        assert.equal(engine._grade(0.8), 'B');
        assert.equal(engine._grade(0.5), 'D');
        assert.equal(engine._grade(0.2), 'F');
    });

    it('should generate a report', async () => {
        const engine = new ChaosEngine();
        await engine.runCampaign(async () => 'ok', {
            attacks: ['error-injection'],
            config: { 'error-injection': { errorRate: 0.0, attempts: 1 } },
        });

        const report = engine.generateReport();
        assert.ok(report.grade);
        assert.ok(report.recommendation);
        assert.ok(report.results.length > 0);
    });

    it('should emit events', async () => {
        const engine = new ChaosEngine();
        let attacked = false;
        engine.on('attack:complete', () => { attacked = true; });
        await engine.runAttack('error-injection', async () => 'ok', { attempts: 1 });
        assert.equal(attacked, true);
    });

    it('should register custom attacks', async () => {
        const engine = new ChaosEngine();
        engine.registerAttack(new ChaosAttack({
            name: 'custom-chaos',
            description: 'Custom test',
            severity: 'low',
            attackFn: async (target) => ({ survived: true, custom: true }),
        }));

        const result = await engine.runAttack('custom-chaos', async () => { });
        assert.equal(result.status, 'survived');
        assert.equal(result.result.custom, true);
    });

    it('should track stats across campaigns', async () => {
        const engine = new ChaosEngine();
        await engine.runCampaign(async () => 'ok', {
            name: 'campaign-1',
            attacks: ['error-injection'],
            config: { 'error-injection': { errorRate: 0, attempts: 1 } },
        });
        await engine.runCampaign(async () => 'ok', {
            name: 'campaign-2',
            attacks: ['error-injection'],
            config: { 'error-injection': { errorRate: 0, attempts: 1 } },
        });

        const stats = engine.getStats();
        assert.equal(stats.totalCampaigns, 2);
        assert.equal(stats.recentCampaigns.length, 2);
    });
});
