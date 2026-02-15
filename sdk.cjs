/**
 * Ultra-Dex SDK - Main Entry Point
 *
 * Provides easy access to all Ultra-Dex subsystems
 */

const { UltraDexCore } = require('./src/core/orchestration/ultra-dex-core.cjs');
const { UnifiedMemory } = require('./src/core/memory/unified-api.cjs');
const { AgentRegistry } = require('./src/core/agents/registry-enhanced.cjs');
const { AgentAutopsy } = require('./src/core/reliability/agent-autopsy.cjs');
const { AgentCoordinationProtocol } = require('./src/core/protocols/coordination.cjs');
const { MCPServerManager } = require('./src/core/mcp/server-manager.cjs');
const { AIProviderRouter } = require('./src/services/ai-providers/router.cjs');
const { ObservabilitySystem } = require('./src/core/system/observability.cjs');
const { ConfigManager } = require('./src/core/system/config-manager.cjs');
const { TokenOptimizer } = require('./src/core/performance/token-optimizer.cjs');

// Main SDK Class
class UltraDex {
  constructor(config = {}) {
    this.core = new UltraDexCore(config);
  }

  async initialize() {
    return this.core.initialize();
  }

  async start() {
    return this.core.start();
  }

  async stop() {
    return this.core.stop();
  }

  // Quick access to subsystems
  get config() {
    return this.core.config;
  }
  get memory() {
    return this.core.memory;
  }
  get agents() {
    return this.core.agents;
  }
  get mcp() {
    return this.core.mcp;
  }
  get router() {
    return this.core.router;
  }
  get observability() {
    return this.core.observability;
  }
  get coordination() {
    return this.core.coordination;
  }
  get autopsy() {
    return this.core.autopsy;
  }
  get tokenOptimizer() {
    return this.core.tokenOptimizer;
  }

  // Convenience methods
  async execute(task, options) {
    return this.core.execute(task, options);
  }

  async chat(messages, options) {
    return this.core.chat(messages, options);
  }

  async callTool(serverId, toolName, params) {
    return this.core.callTool(serverId, toolName, params);
  }

  get status() {
    return this.core.getStatus();
  }

  health() {
    return this.core.health();
  }
}

// Export everything
module.exports = {
  // Main SDK
  UltraDex,
  UltraDexCore,

  // Subsystems
  UnifiedMemory,
  AgentRegistry,
  AgentAutopsy,
  AgentCoordinationProtocol,
  MCPServerManager,
  AIProviderRouter,
  ObservabilitySystem,
  ConfigManager,
  TokenOptimizer,

  // Version
  version: '6.0.0',
};
