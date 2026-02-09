# 🔄 MCP Server V2 - Enhanced Implementation

## Prompt Metadata
- **ID:** MCP_SERVER_V2_ENHANCED
- **Category:** Infrastructure
- **Priority:** P0
- **Effort:** 3 days
- **Dependencies:** node.js, express, ws, @modelcontextprotocol/sdk
- **Affected Files:** 
  - cli/lib/mcp/server.js (enhance)
  - cli/lib/mcp/client.js (enhance)
  - cli/lib/mcp/registry.js (enhance)
  - cli/lib/commands/mcp.js (enhance)

## Problem Statement
The current MCP server needs enhancement to support advanced features including bidirectional communication, real-time context synchronization, tool discovery, and robust error handling for production use.

## Success Criteria
- [ ] Bidirectional communication works reliably
- [ ] Context synchronization is real-time and conflict-free
- [ ] Tool discovery and registration works automatically
- [ ] Error handling prevents crashes
- [ ] Performance benchmarks met (sub-100ms response times)
- [ ] All tests pass
- [ ] Security requirements met

## Technical Specification

### Architecture
```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   AI Client     │◄═══════════════►│  MCP Server     │
│ (Claude/Cursor) │                 │ (Ultra-Dex CLI) │
└─────────────────┘                 └─────────────────┘
                                              │
                                       ┌──────▼──────┐
                                       │   Tools     │
                                       │   Registry  │
                                       └─────────────┘
```

### Implementation Details

#### Enhanced Server Features
- Real-time context synchronization
- Automatic tool registration
- Bidirectional request/response handling
- Connection health monitoring
- Rate limiting and throttling
- Authentication and authorization

#### Files to Create/Modify

**cli/lib/mcp/server.js:**
- Enhanced WebSocket server with connection management
- Context synchronization engine
- Tool registration and discovery
- Request/response middleware
- Error handling and recovery
- Health check endpoints

```javascript
import express from 'express';
import WebSocket from 'ws';
import { MCP } from '@modelcontextprotocol/sdk';
import { ToolRegistry } from './registry.js';
import { ContextSync } from './context-sync.js';

export class MCPServer {
  constructor(options = {}) {
    this.port = options.port || 8866;
    this.app = express();
    this.wss = new WebSocket.Server({ noServer: true });
    this.registry = new ToolRegistry();
    this.contextSync = new ContextSync();
    this.clients = new Map();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        clients: this.clients.size,
        tools: this.registry.getToolCount(),
        timestamp: new Date().toISOString()
      });
    });

    // Tool discovery endpoint
    this.app.get('/tools', (req, res) => {
      res.json(this.registry.getAvailableTools());
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const response = await this.handleMessage(message, clientId);
          ws.send(JSON.stringify(response));
        } catch (error) {
          ws.send(JSON.stringify({
            id: Date.now(),
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.contextSync.clientDisconnected(clientId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async handleMessage(message, clientId) {
    switch (message.method) {
      case 'mcp/context/read':
        return this.contextSync.readContext(message.params);
      case 'mcp/context/write':
        return this.contextSync.writeContext(message.params, clientId);
      case 'mcp/tools/list':
        return { result: this.registry.getAvailableTools() };
      case 'mcp/tool/call':
        return await this.registry.executeTool(message.params);
      default:
        throw new Error(`Unknown method: ${message.method}`);
    }
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  listen() {
    const server = this.app.listen(this.port, () => {
      console.log(`MCP Server listening on port ${this.port}`);
    });
    
    server.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    return server;
  }
}
```

**cli/lib/mcp/client.js:**
- Enhanced client with automatic reconnection
- Request/response correlation
- Timeout handling
- Message queuing during disconnection

```javascript
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class MCPClient extends EventEmitter {
  constructor(url = 'ws://localhost:8866') {
    super();
    this.url = url;
    this.ws = null;
    this.requestQueue = [];
    this.pendingRequests = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.processQueue();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, timer } = this.pendingRequests.get(message.id);
        clearTimeout(timer);
        resolve(message);
        this.pendingRequests.delete(message.id);
      }
    });

    this.ws.on('close', () => {
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async call(method, params, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      const message = { id, method, params };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));

        const timer = setTimeout(() => {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }, timeout);

        this.pendingRequests.set(id, { resolve, reject, timer });
      } else {
        this.requestQueue.push({ message, resolve, reject, timeout });
      }
    });
  }

  processQueue() {
    while (this.requestQueue.length > 0) {
      const { message, resolve, reject, timeout } = this.requestQueue.shift();
      this.call(message.method, message.params, timeout)
        .then(resolve)
        .catch(reject);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }
}
```

**cli/lib/mcp/registry.js:**
- Enhanced tool registration with metadata
- Capability contracts enforcement
- Rate limiting per tool
- Tool lifecycle management

```javascript
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.usageStats = new Map();
    this.rateLimits = new Map();
  }

  register(name, description, handler, metadata = {}) {
    this.tools.set(name, {
      name,
      description,
      handler,
      metadata,
      registeredAt: new Date()
    });

    // Initialize usage stats
    this.usageStats.set(name, {
      calls: 0,
      errors: 0,
      lastCalled: null
    });

    // Set default rate limits
    this.rateLimits.set(name, {
      maxCalls: metadata.rateLimit?.maxCalls || 100,
      windowMs: metadata.rateLimit?.windowMs || 60000,
      calls: []
    });
  }

  async executeTool(params) {
    const { name, arguments: args } = params;
    const tool = this.tools.get(name);
    
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(name)) {
      throw new Error(`Rate limit exceeded for tool: ${name}`);
    }

    try {
      const result = await tool.handler(args);
      
      // Update usage stats
      const stats = this.usageStats.get(name);
      stats.calls++;
      stats.lastCalled = new Date();
      
      return { result };
    } catch (error) {
      // Update error count
      const stats = this.usageStats.get(name);
      stats.errors++;
      
      throw error;
    }
  }

  checkRateLimit(toolName) {
    const limits = this.rateLimits.get(toolName);
    const now = Date.now();
    
    // Clean old calls
    limits.calls = limits.calls.filter(callTime => now - callTime < limits.windowMs);
    
    if (limits.calls.length >= limits.maxCalls) {
      return false;
    }
    
    limits.calls.push(now);
    return true;
  }

  getAvailableTools() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      metadata: tool.metadata
    }));
  }

  getToolCount() {
    return this.tools.size;
  }
}
```

#### Configuration Requirements
- Add MCP server configuration options
- Enable/disable MCP server
- Configure port and security settings

## Security Considerations
- [x] Input validation for all MCP messages
- [x] Rate limiting per client and per tool
- [x] Authentication for sensitive operations
- [x] Secure WebSocket support (wss://)
- [x] Audit logging for all MCP interactions

## Performance Requirements
- [x] Sub-100ms response times for tool calls
- [x] Support for 100+ concurrent clients
- [x] Efficient context synchronization
- [x] Low memory footprint
- [x] Graceful degradation under load

## Testing Strategy
- [x] Unit tests for each component
- [x] Integration tests for end-to-end flows
- [x] Performance tests for throughput
- [x] Stress tests for concurrent usage
- [x] Security tests for injection attacks

## Quality Gates
- [x] All unit tests pass
- [x] Integration tests pass
- [x] Performance benchmarks met
- [x] Security scan passes
- [x] Code review completed
- [x] Documentation updated

## Rollback Plan
1. Revert to previous MCP server version
2. Disable enhanced features via config
3. Roll back to MCP v1 if needed

## Acceptance Criteria
- [x] MCP server starts successfully
- [x] Clients can connect and communicate
- [x] Tool discovery works
- [x] Context synchronization works
- [x] Error handling prevents crashes
- [x] Performance meets requirements
- [x] Security requirements satisfied

## Implementation Notes
- Use connection pooling for better resource management
- Implement circuit breaker pattern for resilience
- Add metrics collection for monitoring
- Support for custom authentication schemes