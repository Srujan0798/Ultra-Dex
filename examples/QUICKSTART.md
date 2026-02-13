# Quick Start Guide - Ultra-Dex v6.0.0

Get up and running with Ultra-Dex in 5 minutes.

## Installation

```bash
# Clone the repository
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex

# Install dependencies
npm install

# Run validation tests
node test-validation.cjs
```

## Basic Usage

### 1. Initialize Ultra-Dex

```javascript
const { UltraDex } = require('./sdk.cjs');

async function main() {
  // Create instance
  const ultra = new UltraDex({
    dataPath: './data/my-app',
  });

  // Initialize all subsystems
  await ultra.initialize();
  console.log('✅ Ultra-Dex initialized');

  // Start services
  await ultra.start();
  console.log('✅ Services started');

  // Your code here...

  // Cleanup
  await ultra.stop();
}

main().catch(console.error);
```

### 2. Store and Retrieve Memory

```javascript
// Store context
await ultra.memory.store(
  {
    text: 'User prefers TypeScript',
    entities: ['user', 'typescript'],
    priority: 'high',
  },
  {
    strategy: 'hybrid', // Uses SQL + Vector + Graph
    tags: ['preferences'],
  }
);

// Retrieve context
const results = await ultra.memory.retrieve('What does user prefer?', {
  strategy: 'hybrid',
  limit: 5,
});

console.log(`Found ${results.items.length} results`);
results.items.forEach((item) => {
  console.log(`- ${item.content.text}`);
});
```

### 3. Register and Execute Agents

```javascript
// Register a custom agent
await ultra.agents.register({
  id: 'my-agent',
  name: 'My Custom Agent',
  description: 'Does custom work',
  capabilities: ['custom-task'],
  handler: async (input, context) => {
    // Your agent logic here
    return { processed: true, input };
  },
});

// Execute the agent
const result = await ultra.agents.execute('my-agent', {
  task: 'Process this data',
});

console.log(result);
```

### 4. Use MCP Tools

```javascript
// Start an MCP server
await ultra.mcp.startServer('github');

// List available tools
const tools = ultra.mcp.listTools();
console.log(`Available tools: ${tools.length}`);

// Call a tool
const repos = await ultra.callTool('github', 'search_repositories', {
  query: 'language:javascript stars:>1000',
});

console.log(repos);
```

### 5. Multi-Agent Coordination

```javascript
// Create a session
const session = ultra.coordination.createSession({
  goal: 'Build a feature',
  agents: ['planner', 'coder', 'reviewer'],
});

// Coordinate work
const result = await ultra.coordination.coordinate(session.id, {
  goal: 'Implement authentication',
  subtasks: [
    { agentId: 'planner', description: 'Design auth flow' },
    { agentId: 'coder', description: 'Implement JWT' },
    { agentId: 'reviewer', description: 'Review security' },
  ],
});

console.log('Task assignments:', result.assignments);
console.log('Results:', result.results);
```

### 6. Check System Health

```javascript
// Get health status
const health = ultra.health();
console.log('System health:', health.status);

// Get detailed status
const status = ultra.getStatus();
console.log('Status:', status.status);
console.log('Components:', status.components);
```

## Complete Example

```javascript
const { UltraDex } = require('./sdk.cjs');

async function main() {
  console.log('🚀 Starting Ultra-Dex Demo\n');

  // Initialize
  const ultra = new UltraDex();
  await ultra.initialize();
  await ultra.start();

  // Store user preference
  await ultra.memory.store({
    text: 'Build a REST API with authentication',
    priority: 'high',
  });

  // Retrieve relevant context
  const context = await ultra.memory.retrieve('What should I build?');
  console.log(`Found ${context.items.length} context items`);

  // Check system health
  const health = ultra.health();
  console.log(`System health: ${health.status}`);

  // Cleanup
  await ultra.stop();
  console.log('\n✅ Demo complete!');
}

main().catch(console.error);
```

## Environment Variables

```bash
# AI Provider API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# MCP Server Tokens
GITHUB_TOKEN=your_github_token
SLACK_BOT_TOKEN=your_slack_token
NOTION_API_TOKEN=your_notion_token
LINEAR_API_KEY=your_linear_key

# Database
DATABASE_URL=postgresql://user:pass@localhost/db
```

## Available MCP Servers

| Server     | Description                      | Auto-Start |
| ---------- | -------------------------------- | ---------- |
| github     | GitHub repositories, issues, PRs | No         |
| slack      | Slack messaging                  | No         |
| notion     | Notion pages and databases       | No         |
| linear     | Linear issues and projects       | No         |
| filesystem | Local file access                | Yes        |
| fetch      | Web requests                     | Yes        |
| postgres   | PostgreSQL queries               | No         |
| sqlite     | SQLite queries                   | Yes        |

## API Reference

### UltraDexCore

```javascript
// Core methods
await ultra.initialize(); // Initialize all subsystems
await ultra.start(); // Start services
await ultra.stop(); // Stop services
await ultra.execute(task); // Execute a task
await ultra.chat(messages); // Chat with AI
await ultra.callTool(server, tool, params); // Call MCP tool

// Status
ultra.getStatus(); // Get detailed status
ultra.health(); // Get health check

// Subsystems
ultra.memory; // UnifiedMemory
ultra.agents; // AgentRegistry
ultra.mcp; // MCPServerManager
ultra.router; // AIProviderRouter
ultra.coordination; // AgentCoordinationProtocol
ultra.autopsy; // AgentAutopsy
ultra.observability; // ObservabilitySystem
```

### UnifiedMemory

```javascript
// Storage
await memory.store(context, options);
// options: { strategy: 'sql'|'vector'|'graph'|'hybrid', priority, ttl, tags }

// Retrieval
await memory.retrieve(query, options);
// options: { strategy, limit, threshold, sessionId }

// Graph queries
await memory.queryGraph(entity, { depth, relationshipTypes });

// Management
await memory.update(id, updates);
await memory.delete(id);
await memory.compress(options);
memory.getStats();
```

### AgentRegistry

```javascript
// Registration
await agents.register({ id, name, description, capabilities, handler, config });
await agents.unregister(id);

// Execution
await agents.execute(agentId, input, options);

// Discovery
agents.discover(capability);
agents.find(query);
agents.list(filters);
agents.get(id);

// Sessions
agents.createSession(options);
agents.getSession(sessionId);
agents.addToSession(sessionId, agentId, config);

// Stats
agents.getStats();
```

### AgentCoordinationProtocol

```javascript
// Registration
coordination.registerAgent(agentId, capabilities, messageHandler);

// Sessions
coordination.createSession(options);
coordination.endSession(sessionId);

// Messaging
await coordination.sendMessage({ from, to, type, content, requiresResponse });
await coordination.broadcast(from, to, content);

// Coordination
await coordination.coordinate(sessionId, task);
await coordination.negotiate(sessionId, agents, conflict);
await coordination.consensus(question, agents, options);

// Stats
coordination.getStats();
```

### MCPServerManager

```javascript
// Server management
await mcp.registerServer(id, config);
await mcp.startServer(id);
await mcp.stopServer(id);
await mcp.unregisterServer(id);

// Tool usage
await mcp.callTool(serverId, toolName, params);
mcp.listTools();
mcp.discoverTools(capability);

// Status
mcp.getServerStatus(id);
mcp.listServers();
mcp.getStats();
```

### AIProviderRouter

```javascript
// Provider management
router.registerProvider(id, provider, config)
router.setProviderStatus(id, enabled)

// Usage
await router.chat(messages, options)
await router.streamChat(messages, options)
await router.embed(input, options)

// Configuration
options: {
  provider: 'specific-provider',
  strategy: 'cost'|'quality'|'latency'|'fallback',
  maxCost: 0.01,
  timeout: 30000
}

// Stats
router.getStats()
router.getHealth(providerId)
router.listModels(filters)
```

### ObservabilitySystem

```javascript
// Tracing
const trace = observability.startTrace(name, context);
const span = observability.startSpan(traceId, name, context);
observability.endSpan(spanId, result);
observability.endTrace(traceId, result);
observability.addEvent(spanId, name, data);

// Metrics
observability.recordMetric(name, value, tags);
observability.getMetricStats(name, tags);

// Logging
observability.log(level, message, context);

// Alerts
observability.createAlert(name, severity, data);
observability.getAlerts(filters);
observability.acknowledgeAlert(alertId);

// Dashboard
observability.getDashboard();
observability.getRecentTraces(limit);
observability.getTracesByTag(tag);
observability.generateReport(traceId);
```

## Troubleshooting

### Common Issues

**1. Module not found**

```bash
# Make sure to use .cjs extension
const { UltraDex } = require('./sdk.cjs')  // ✅
const { UltraDex } = require('./sdk')      // ❌
```

**2. Port already in use**

```bash
# MCP servers may fail if ports are in use
# Check what's using port 8000 (ChromaDB)
lsof -i :8000
```

**3. Database locked**

```bash
# SQLite database may be locked
# Delete and recreate
cd data && rm -f *.db
```

### Debug Mode

```javascript
const ultra = new UltraDex({
  dataPath: './data/debug',
  debug: true,
});

// Listen to events
ultra.on('error', (error) => {
  console.error('Ultra-Dex error:', error);
});

ultra.memory.on('error', (error) => {
  console.error('Memory error:', error);
});
```

## Next Steps

1. **Read the Architecture** - See `COMPLETION-REPORT.md`
2. **Run Examples** - Check `examples/demo.cjs`
3. **Explore APIs** - Review this guide
4. **Build Your App** - Start with the complete example above

## Support

- **Documentation:** `COMPLETION-REPORT.md`
- **Examples:** `examples/demo.cjs`
- **Tests:** `test-validation.cjs`
- **Issues:** GitHub Issues

---

**Happy building with Ultra-Dex! 🚀**
