#!/usr/bin/env node

/**
 * ACP (Agent Client Protocol) Host Implementation
 * Follows GitHub's ACP specification for agent portability across IDEs
 * @see https://github.com/agentclientprotocol/agent-client-protocol
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { VERSION } from '../utils/version.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { monitoring } from '../utils/monitoring.js';

// ACP Protocol Version
const ACP_PROTOCOL_VERSION = '0.10.8';

// Session management
const sessions = new Map();
const terminals = new Map();

// Error codes per ACP spec
const ErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  AUTH_REQUIRED: -32000,
  RESOURCE_NOT_FOUND: -32002
};

/**
 * Create a JSON-RPC 2.0 response
 */
function createResponse(id, result) {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    result
  });
}

/**
 * Create a JSON-RPC 2.0 error response
 */
function createErrorResponse(id, code, message, data = null) {
  const error = { code, message };
  if (data) error.data = data;
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    error
  });
}

/**
 * ACP Host class implementing the Agent Client Protocol
 */
export class ACPHost {
  constructor(options = {}) {
    this.options = {
      stdio: options.stdio ?? true,
      port: options.port ?? 3002,
      http: options.http ?? false,
      ...options
    };
    this.initialized = false;
    this.clientCapabilities = null;
  }

  /**
   * Start the ACP host
   */
  async start() {
    printInfo(`\n🚀 Starting ACP Host (Agent Client Protocol) v${ACP_PROTOCOL_VERSION}...\n`);
    
    monitoring.info('ACP Host starting', {
      protocolVersion: ACP_PROTOCOL_VERSION,
      mode: this.options.stdio ? 'stdio' : 'http'
    });

    if (this.options.stdio) {
      await this.startStdioMode();
    } else if (this.options.http) {
      await this.startHttpMode();
    }
  }

  /**
   * Start in stdio mode (for IDE integration)
   */
  async startStdioMode() {
    printInfo('ACP Host running in stdio mode');
    
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line) {
          try {
            const response = await this.handleMessage(line);
            if (response) {
              process.stdout.write(response + '\n');
            }
          } catch (err) {
            printError('Error handling message:', err.message);
            // Don't crash the host on single message error
          }
        }
      }
    });

    process.stdin.on('end', () => {
      printInfo('ACP Host: Client disconnected');
      this.shutdown();
    });

    // Handle process signals
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Start in HTTP mode
   */
  async startHttpMode() {
    const http = await import('http');
    
    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const response = await this.handleMessage(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(response || '');
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(createErrorResponse(null, ErrorCode.INTERNAL_ERROR, error.message));
        }
      });
    });

    server.listen(this.options.port, () => {
      printSuccess(`✅ ACP HTTP server listening on port ${this.options.port}`);
    });
  }

  /**
   * Handle incoming JSON-RPC message
   */
  async handleMessage(messageStr) {
    let requestId = null;
    
    try {
      const message = JSON.parse(messageStr);
      
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        return createErrorResponse(null, ErrorCode.INVALID_REQUEST, 'Invalid JSON-RPC version');
      }

      requestId = message.id ?? null;
      const { method, params = {} } = message;

      if (requestId === null && method) {
        await this.handleNotification(method, params);
        return null;
      }

      if (!method) {
        return createErrorResponse(requestId, ErrorCode.INVALID_REQUEST, 'Method is required');
      }

      if (!this.initialized && method !== 'initialize') {
        return createErrorResponse(requestId, ErrorCode.AUTH_REQUIRED, 'Host not initialized');
      }

      const result = await this.handleRequest(method, params, requestId);
      return createResponse(requestId, result);

    } catch (error) {
      if (error instanceof SyntaxError) {
        return createErrorResponse(requestId, ErrorCode.PARSE_ERROR, 'Parse error: Invalid JSON');
      }
      return createErrorResponse(requestId, ErrorCode.INTERNAL_ERROR, error.message);
    }
  }

  /**
   * Handle JSON-RPC requests
   */
  async handleRequest(method, params, id) {
    switch (method) {
      case 'initialize':
        return this.handleInitialize(params);
      case 'authenticate':
        return this.handleAuthenticate(params);
      case 'new_session':
        return this.handleNewSession(params);
      case 'load_session':
        return this.handleLoadSession(params);
      case 'set_session_mode':
        return this.handleSetSessionMode(params);
      case 'session/prompt':
        return this.handleSessionPrompt(params);
      case 'terminal/create':
        return this.handleTerminalCreate(params);
      case 'terminal/output':
        return this.handleTerminalOutput(params);
      case 'terminal/release':
        return this.handleTerminalRelease(params);
      case 'fs/readTextFile':
        return this.handleReadTextFile(params);
      case 'fs/writeTextFile':
        return this.handleWriteTextFile(params);
      case 'cursor/get_context':
        return this.handleCursorGetContext(params);
      case 'cursor/get_rules':
        return this.handleCursorGetRules(params);
      case 'ultradex/sync':
        return this.handleUltraDexSync(params);
      default:
        throw new Error(`Method not found: ${method}`);
    }
  }

  /**
   * Handle notifications
   */
  async handleNotification(method, params) {
    if (method === 'session/cancel') {
      const { sessionId } = params;
      printInfo(`ACP: Cancelling session ${sessionId}`);
      // Handle cancellation logic
    }
  }

  /**
   * Initialize connection
   */
  handleInitialize(params) {
    this.clientCapabilities = params.capabilities || {};
    this.initialized = true;

    printSuccess('✅ ACP Client initialized');

    return {
      protocolVersion: ACP_PROTOCOL_VERSION,
      capabilities: {
        loadSession: true,
        promptCapabilities: { text: true, embeddedContext: true },
        sessionCapabilities: { modes: ['ask', 'architect', 'code', 'review', 'test'] },
        terminalCapabilities: { shell: true },
        filesystemCapabilities: { read: true, write: true }
      },
      agentInfo: {
        name: 'ultra-dex',
        version: VERSION,
        vendor: 'Ultra-Dex AI'
      }
    };
  }

  handleAuthenticate(params) {
    return { authenticated: true };
  }

  handleNewSession(params) {
    const sessionId = randomUUID();
    const session = {
      id: sessionId,
      mode: params.initialMode || 'ask',
      availableModes: ['ask', 'architect', 'code', 'review', 'test'],
      history: [],
      createdAt: new Date().toISOString()
    };
    sessions.set(sessionId, session);
    printSuccess(`✅ ACP Session created: ${sessionId.slice(0, 8)}`);
    return { sessionId, currentModeId: session.mode };
  }

  handleLoadSession(params) {
    const session = sessions.get(params.sessionId);
    if (!session) throw new Error('Session not found');
    return { sessionId: session.id, currentModeId: session.mode };
  }

  handleSetSessionMode(params) {
    const session = sessions.get(params.sessionId);
    if (!session) throw new Error('Session not found');
    session.mode = params.modeId;
    return { currentModeId: session.mode };
  }

  async handleSessionPrompt(params) {
    const session = sessions.get(params.sessionId);
    if (!session) throw new Error('Session not found');
    
    printInfo(`ACP: Processing ${session.mode} prompt`);

    // In a production environment, this would call the internal Ultra-Dex orchestration engine
    // For now, we return a structured response indicating the mode and awareness
    return {
      content: [
        {
          type: 'text',
          text: `Ultra-Dex [${session.mode.toUpperCase()}] is processing your request.\n\nContext: Local codebase analysis active.\nTask: ${params.prompt}\n\nI am ready to help you build, architect, or review your SaaS application.`
        }
      ],
      stopReason: 'end_turn'
    };
  }

  handleTerminalCreate(params) {
    const terminalId = randomUUID();
    try {
      const child = spawn(params.command, params.args || [], {
        cwd: params.cwd || process.cwd(),
        shell: true,
        env: { ...process.env, ...params.env }
      });

      let output = '';
      child.stdout.on('data', data => output += data.toString());
      child.stderr.on('data', data => output += data.toString());

      terminals.set(terminalId, { id: terminalId, process: child, output });
      return { terminalId };
    } catch (error) {
      throw new Error(`Failed to create terminal: ${error.message}`);
    }
  }

  handleTerminalOutput(params) {
    const terminal = terminals.get(params.terminalId);
    if (!terminal) throw new Error('Terminal not found');
    return { output: terminal.output, exitStatus: terminal.process.exitCode };
  }

  handleTerminalRelease(params) {
    const terminal = terminals.get(params.terminalId);
    if (terminal) {
      terminal.process.kill();
      terminals.delete(params.terminalId);
    }
    return { released: true };
  }

  async handleReadTextFile(params) {
    try {
      const content = await fs.readFile(params.path, 'utf8');
      return { content };
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async handleWriteTextFile(params) {
    try {
      await fs.writeFile(params.path, params.content, 'utf8');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  async handleCursorGetContext(params) {
    let context = '';
    try {
      context = await fs.readFile(path.join(process.cwd(), 'CONTEXT.md'), 'utf8');
    } catch {
      context = 'No CONTEXT.md found. Run "ultra-dex init" to set up project context.';
    }
    return { projectContext: context, timestamp: new Date().toISOString() };
  }

  async handleCursorGetRules(params) {
    let rules = '';
    try {
      rules = await fs.readFile(path.join(process.cwd(), '.cursor', 'rules'), 'utf8');
    } catch {
      rules = '# Standard Ultra-Dex Rules\n- Follow CONTEXT.md\n- Use modular architecture\n- Implement validation before delivery';
    }
    return { rules, timestamp: new Date().toISOString() };
  }

  async handleUltraDexSync(params) {
    monitoring.info('ACP: Sync requested');
    return { status: 'synced', timestamp: new Date().toISOString() };
  }

  shutdown() {
    printInfo('\nShutting down ACP Host...');
    for (const t of terminals.values()) {
      try { t.process.kill(); } catch (e) { /* ignore */ }
    }
    process.exit(0);
  }
}

export async function startACPHost(options = {}) {
  const host = new ACPHost(options);
  await host.start();
  return host;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startACPHost().catch(err => {
    console.error(chalk.red('Fatal error in ACP Host:'), err);
    process.exit(1);
  });
}

export default ACPHost;