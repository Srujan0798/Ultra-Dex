/**
 * Ultra-Dex SDK - Main Entry Point
 *
 * Provides easy access to core Ultra-Dex subsystems from ESM consumers.
 */

import UltraDexCore from './src/core/orchestration/ultra-dex-core.js';
import UnifiedMemory from './src/core/memory/unified-api.js';
import AgentRegistry from './src/core/agents/registry-enhanced.js';
import AgentAutopsy from './src/core/reliability/agent-autopsy.js';
import AgentCoordinationProtocol from './src/core/protocols/coordination.js';
import MCPServerManager from './src/core/mcp/server-manager.js';
import AIProviderRouter from './src/services/ai-providers/router.js';
import ObservabilitySystem from './src/core/system/observability.js';
import ConfigManager from './src/core/system/config-manager.js';
import TokenOptimizer from './src/core/performance/token-optimizer.js';

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

const version = '6.0.0';

export {
  UltraDex,
  UltraDexCore,
  UnifiedMemory,
  AgentRegistry,
  AgentAutopsy,
  AgentCoordinationProtocol,
  MCPServerManager,
  AIProviderRouter,
  ObservabilitySystem,
  ConfigManager,
  TokenOptimizer,
  version,
};

export default UltraDex;
