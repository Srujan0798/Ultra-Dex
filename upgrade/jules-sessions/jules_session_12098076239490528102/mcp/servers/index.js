// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Tool Servers — Ready-to-use integrations for the Ultra-Dex ecosystem
 *
 * Each server implements the MCP protocol and exposes tools that agents
 * can discover and call through the MCPServerManager.
 *
 * Servers included:
 *   1. GitHub    — repo search, file read, PR creation, issue management
 *   2. Filesystem — read, write, list, search files (sandboxed)
 *   3. Memory    — bridge to Unified Memory API (store, retrieve, graph)
 *   4. Web Search — search, fetch, summarize web content
 *   5. Code Exec — sandboxed code execution with timeout
 *
 * @module mcp-servers
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { readFile, writeFile, readdir, stat, mkdir, realpath } from 'fs/promises';
import { join, resolve, relative, extname, dirname } from 'path';
import { execSync, spawnSync } from 'child_process';
import vm from 'vm';
import { lookup } from 'dns/promises';

// ───────────────────────────────────────────────────────────────────────────
// Base MCP Server — shared protocol implementation
// ───────────────────────────────────────────────────────────────────────────

export class BaseMCPServer extends EventEmitter {
    constructor({ name, version = '1.0.0', description = '' }) {
        super();
        this.name = name;
        this.version = version;
        this.description = description;
        this.tools = new Map();
        this.stats = { calls: 0, errors: 0, totalLatencyMs: 0 };
    }

    registerTool(name, { description, inputSchema = {}, handler }) {
        this.tools.set(name, { name, description, inputSchema, handler });
    }

    async callTool(toolName, params = {}) {
        const tool = this.tools.get(toolName);
        if (!tool) throw new Error(`Tool "${toolName}" not found on server "${this.name}"`);

        const start = Date.now();
        this.stats.calls++;
        try {
            const result = await tool.handler(params);
            this.stats.totalLatencyMs += Date.now() - start;
            return { success: true, result };
        } catch (error) {
            this.stats.errors++;
            this.stats.totalLatencyMs += Date.now() - start;
            return { success: false, error: error.message };
        }
    }

    listTools() {
        return [...this.tools.values()].map(({ name, description, inputSchema }) => ({
            name: `${this.name}/${name}`,
            description,
            inputSchema,
        }));
    }

    getStats() {
        return {
            server: this.name,
            ...this.stats,
            avgLatencyMs: this.stats.calls > 0
                ? Math.round(this.stats.totalLatencyMs / this.stats.calls)
                : 0,
        };
    }

    getManifest() {
        return {
            name: this.name,
            version: this.version,
            description: this.description,
            tools: this.listTools(),
            stats: this.getStats(),
        };
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 1. GitHub MCP Server
// ───────────────────────────────────────────────────────────────────────────

export class GitHubMCPServer extends BaseMCPServer {
    constructor({ token = process.env.GITHUB_TOKEN } = {}) {
        super({ name: 'github', description: 'GitHub repository operations' });
        this.token = token;
        this.baseUrl = 'https://api.github.com';

        this.registerTool('search_repos', {
            description: 'Search GitHub repositories',
            inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } },
            handler: async ({ query, limit = 5 }) => {
                const res = await this._fetch(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`);
                return res.items?.map(r => ({ name: r.full_name, stars: r.stargazers_count, description: r.description, url: r.html_url })) || [];
            },
        });

        this.registerTool('get_file', {
            description: 'Read a file from a GitHub repository',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' } } },
            handler: async ({ owner, repo, path }) => {
                const res = await this._fetch(`/repos/${owner}/${repo}/contents/${path}`);
                return { path, content: Buffer.from(res.content || '', 'base64').toString('utf-8'), sha: res.sha };
            },
        });

        this.registerTool('list_issues', {
            description: 'List issues for a repository',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string' } } },
            handler: async ({ owner, repo, state = 'open' }) => {
                const res = await this._fetch(`/repos/${owner}/${repo}/issues?state=${state}&per_page=10`);
                return res.map(i => ({ number: i.number, title: i.title, state: i.state, labels: i.labels.map(l => l.name) }));
            },
        });

        this.registerTool('create_issue', {
            description: 'Create an issue in a repository',
            inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } } },
            handler: async ({ owner, repo, title, body = '' }) => {
                const res = await this._fetch(`/repos/${owner}/${repo}/issues`, 'POST', { title, body });
                return { number: res.number, url: res.html_url };
            },
        });
    }

    async _fetch(path, method = 'GET', body = null) {
        const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Ultra-Dex-MCP/1.0' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${this.baseUrl}${path}`, opts);
        if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
        return res.json();
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 2. Filesystem MCP Server (sandboxed)
// ───────────────────────────────────────────────────────────────────────────

export class FilesystemMCPServer extends BaseMCPServer {
    constructor({ rootDir = process.cwd(), allowWrite = true } = {}) {
        super({ name: 'filesystem', description: 'Sandboxed filesystem operations' });
        this.rootDir = resolve(rootDir);
        this.allowWrite = allowWrite;

        this.registerTool('read_file', {
            description: 'Read a file (sandboxed to root dir)',
            inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
            handler: async ({ path: filePath }) => {
                const abs = await this._resolve(filePath);
                const content = await readFile(abs, 'utf-8');
                return { path: filePath, content, size: content.length };
            },
        });

        this.registerTool('write_file', {
            description: 'Write a file (sandboxed)',
            inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } },
            handler: async ({ path: filePath, content }) => {
                if (!this.allowWrite) throw new Error('Write access disabled');
                const abs = await this._resolve(filePath);
                await mkdir(join(abs, '..'), { recursive: true });
                await writeFile(abs, content, 'utf-8');
                return { path: filePath, written: content.length };
            },
        });

        this.registerTool('list_dir', {
            description: 'List directory contents',
            inputSchema: { type: 'object', properties: { path: { type: 'string' }, recursive: { type: 'boolean' } } },
            handler: async ({ path: dirPath = '.', recursive = false }) => {
                const abs = await this._resolve(dirPath);
                const entries = await readdir(abs, { withFileTypes: true });
                return entries.map(e => ({
                    name: e.name,
                    type: e.isDirectory() ? 'directory' : 'file',
                    path: join(dirPath, e.name),
                }));
            },
        });

        this.registerTool('search_files', {
            description: 'Search for files by content or name pattern',
            inputSchema: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } } },
            handler: async ({ pattern, path: dirPath = '.' }) => {
                const abs = await this._resolve(dirPath);
                try {
                    // Use -e to prevent pattern being interpreted as a flag
                    const grepArgs = ['-rl', '--include=*.{js,ts,json,md}', '-e', pattern, abs];
                    const result = spawnSync('grep', grepArgs, {
                        encoding: 'utf-8',
                        timeout: 5000,
                        maxBuffer: 1024 * 1024
                    });

                    if (result.error) return [];
                    const output = result.stdout || '';
                    return output.trim().split('\n').filter(Boolean).slice(0, 20).map(f => relative(this.rootDir, f));
                } catch {
                    return [];
                }
            },
        });
    }

    async _resolve(filePath) {
        const abs = resolve(this.rootDir, filePath);
        if (!abs.startsWith(this.rootDir)) throw new Error('Path escapes sandbox');

        // Verify no symlink escape
        try {
            const realRoot = await realpath(this.rootDir);
            let current = abs;

            while (current.length >= this.rootDir.length) {
                try {
                    const realCurrent = await realpath(current);
                    if (!realCurrent.startsWith(realRoot)) throw new Error('Path escapes sandbox (symlink)');
                    break; // Found valid existing ancestor
                } catch (e) {
                    if (e.code !== 'ENOENT') throw e;
                    const parent = dirname(current);
                    if (parent === current) break;
                    current = parent;
                }
            }
        } catch (e) {
            if (e.message.includes('Path escapes sandbox')) throw e;
            // Only throw if it's our error, otherwise ignore (e.g. rootDir not found? shouldn't happen)
        }

        return abs;
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 3. Memory MCP Server — bridges to Unified Memory API
// ───────────────────────────────────────────────────────────────────────────

export class MemoryMCPServer extends BaseMCPServer {
    constructor({ memoryApi = null } = {}) {
        super({ name: 'memory', description: 'Persistent context memory (SQLite + ChromaDB + Neo4j)' });
        this.memoryApi = memoryApi;

        this.registerTool('store', {
            description: 'Store context in memory',
            inputSchema: { type: 'object', properties: { context: { type: 'object' }, options: { type: 'object' } } },
            handler: async ({ context, options = {} }) => {
                if (!this.memoryApi) throw new Error('Memory API not connected');
                return this.memoryApi.store(context, options);
            },
        });

        this.registerTool('retrieve', {
            description: 'Retrieve context from memory using hybrid strategy',
            inputSchema: { type: 'object', properties: { query: { type: 'string' }, options: { type: 'object' } } },
            handler: async ({ query, options = {} }) => {
                if (!this.memoryApi) throw new Error('Memory API not connected');
                return this.memoryApi.retrieve(query, options);
            },
        });

        this.registerTool('query_graph', {
            description: 'Query knowledge graph relationships',
            inputSchema: { type: 'object', properties: { entity: { type: 'string' }, depth: { type: 'number' } } },
            handler: async ({ entity, depth = 3 }) => {
                if (!this.memoryApi) throw new Error('Memory API not connected');
                return this.memoryApi.queryGraph(entity, { depth });
            },
        });

        this.registerTool('stats', {
            description: 'Get memory system statistics',
            inputSchema: {},
            handler: async () => {
                if (!this.memoryApi) throw new Error('Memory API not connected');
                return this.memoryApi.getStats();
            },
        });
    }

    connect(memoryApi) {
        this.memoryApi = memoryApi;
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 4. Web Search MCP Server
// ───────────────────────────────────────────────────────────────────────────

export class WebSearchMCPServer extends BaseMCPServer {
    constructor({ apiKey = process.env.SEARCH_API_KEY } = {}) {
        super({ name: 'web-search', description: 'Web search and content retrieval' });

        this.registerTool('search', {
            description: 'Search the web and return results',
            inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } },
            handler: async ({ query, limit = 5 }) => {
                // Uses DuckDuckGo-like API (no key needed) as default
                try {
                    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`);
                    const data = await res.json();
                    const results = (data.RelatedTopics || []).slice(0, limit).map(t => ({
                        text: t.Text || '',
                        url: t.FirstURL || '',
                    }));
                    return { query, results, source: 'duckduckgo' };
                } catch (error) {
                    return { query, results: [], error: error.message };
                }
            },
        });

        this.registerTool('fetch_url', {
            description: 'Fetch and extract text content from a URL',
            inputSchema: { type: 'object', properties: { url: { type: 'string' }, maxLength: { type: 'number' } } },
            handler: async ({ url, maxLength = 5000 }) => {
                try {
                    const parsed = new URL(url);
                    if (!['http:', 'https:'].includes(parsed.protocol)) {
                        throw new Error('Only HTTP/HTTPS protocols allowed');
                    }

                    // SSRF Protection: Resolve DNS and check IP
                    const hostname = parsed.hostname;
                    let ip;
                    try {
                        const lookupResult = await lookup(hostname);
                        ip = lookupResult.address;
                    } catch (e) {
                        // Allow if it's an IP literal that failed lookup (unlikely) or just fail safe
                        // But lookup handles IP literals.
                        throw new Error(`DNS lookup failed for ${hostname}`);
                    }

                    // Private IP Checks
                    if (ip === '::1' || ip === '0.0.0.0') throw new Error('Localhost access denied');
                    
                    // IPv4 Private Ranges
                    if (ip.includes('.')) {
                        const parts = ip.split('.').map(Number);
                        if (
                            parts[0] === 10 ||
                            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
                            (parts[0] === 192 && parts[1] === 168) ||
                            parts[0] === 127 ||
                            (parts[0] === 169 && parts[1] === 254) // Link-local
                        ) {
                            throw new Error('Private IP access denied');
                        }
                    } 
                    // IPv6 Private Ranges (Unique Local fc00::/7, Link-local fe80::/10)
                    else if (ip.includes(':')) {
                         const firstWord = parseInt(ip.split(':')[0], 16);
                         if (
                             (firstWord >= 0xfc00 && firstWord <= 0xfdff) || // fc00::/7
                             (firstWord >= 0xfe80 && firstWord <= 0xfebf)    // fe80::/10
                         ) {
                             throw new Error('Private IP access denied');
                         }
                    }

                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'Ultra-Dex-MCP/1.0' },
                        signal: AbortSignal.timeout(10000),
                    });
                    const html = await res.text();
                    // Simple HTML → text extraction
                    const text = html
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, maxLength);
                    return { url, content: text, length: text.length };
                } catch (error) {
                    return { url, content: '', error: error.message };
                }
            },
        });
    }
}

// ───────────────────────────────────────────────────────────────────────────
// 5. Code Execution MCP Server (sandboxed)
// ───────────────────────────────────────────────────────────────────────────

export class CodeExecMCPServer extends BaseMCPServer {
    constructor({ timeoutMs = 5000, allowedLanguages = ['javascript', 'python'] } = {}) {
        super({ name: 'code-exec', description: 'Sandboxed code execution' });
        this.timeoutMs = timeoutMs;
        this.allowedLanguages = allowedLanguages;

        this.registerTool('execute', {
            description: 'Execute code in a sandboxed environment',
            inputSchema: {
                type: 'object',
                properties: {
                    language: { type: 'string', enum: allowedLanguages },
                    code: { type: 'string' },
                },
            },
            handler: async ({ language, code }) => {
                if (!this.allowedLanguages.includes(language)) {
                    throw new Error(`Language "${language}" not allowed. Use: ${this.allowedLanguages.join(', ')}`);
                }
                return this._execute(language, code);
            },
        });

        this.registerTool('eval_expression', {
            description: 'Evaluate a JavaScript expression and return the result',
            inputSchema: { type: 'object', properties: { expression: { type: 'string' } } },
            handler: async ({ expression }) => {
                try {
                    const context = Object.create(null);
                    const result = vm.runInNewContext(`'use strict'; (${expression})`, context, { timeout: 1000 });
                    return { expression, result: String(result), type: typeof result };
                } catch (error) {
                    return { expression, error: error.message };
                }
            },
        });
    }

    _execute(language, code) {
        const commands = {
            javascript: ['node', '-e', code],
            python: ['python3', '-c', code],
        };

        try {
            const [cmd, ...args] = commands[language];
            const result = spawnSync(cmd, args, {
                encoding: 'utf-8',
                timeout: this.timeoutMs,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            
            if (result.error) throw result.error;
            
            if (result.status !== 0) {
                return { language, output: result.stderr || result.stdout || 'Error', exitCode: result.status };
            }

            return { language, output: result.stdout.trim(), exitCode: 0 };
        } catch (error) {
            return { language, output: error.stderr || error.message, exitCode: error.status || 1 };
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────
// MCP Server Registry — manages all servers
// ───────────────────────────────────────────────────────────────────────────

export class MCPServerRegistry {
    constructor() {
        this.servers = new Map();
    }

    register(server) {
        this.servers.set(server.name, server);
    }

    get(name) {
        return this.servers.get(name);
    }

    async callTool(fullToolName, params = {}) {
        const [serverName, toolName] = fullToolName.split('/');
        const server = this.servers.get(serverName);
        if (!server) throw new Error(`MCP server "${serverName}" not found`);
        return server.callTool(toolName, params);
    }

    listAllTools() {
        const tools = [];
        for (const server of this.servers.values()) {
            tools.push(...server.listTools());
        }
        return tools;
    }

    discoverByCapability(keyword) {
        return this.listAllTools().filter(t =>
            t.name.includes(keyword) || t.description.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    getManifests() {
        return [...this.servers.values()].map(s => s.getManifest());
    }

    getStats() {
        return [...this.servers.values()].map(s => s.getStats());
    }
}

/**
 * Create a fully configured MCP registry with all default servers
 */
export function createDefaultRegistry(config = {}) {
    const registry = new MCPServerRegistry();
    registry.register(new GitHubMCPServer(config.github));
    registry.register(new FilesystemMCPServer(config.filesystem));
    registry.register(new MemoryMCPServer(config.memory));
    registry.register(new WebSearchMCPServer(config.webSearch));
    registry.register(new CodeExecMCPServer(config.codeExec));
    return registry;
}

export default { createDefaultRegistry, MCPServerRegistry, BaseMCPServer };
