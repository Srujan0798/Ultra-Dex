/**
 * Quick Validation Test
 * Tests core subsystems without external dependencies
 */

const assert = require('assert');

console.log('🧪 Ultra-Dex Core Validation\n');
console.log('===========================\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: Module Loading
test('Module: UnifiedMemory can be loaded', () => {
  const { UnifiedMemory } = require('./src/core/memory/unified-api.cjs');
  assert(UnifiedMemory, 'UnifiedMemory should be exported');
});

test('Module: AgentRegistry can be loaded', () => {
  const { AgentRegistry } = require('./src/core/agents/registry-enhanced.cjs');
  assert(AgentRegistry, 'AgentRegistry should be exported');
});

test('Module: AgentAutopsy can be loaded', () => {
  const { AgentAutopsy } = require('./src/core/reliability/agent-autopsy.cjs');
  assert(AgentAutopsy, 'AgentAutopsy should be exported');
});

test('Module: AgentCoordinationProtocol can be loaded', () => {
  const { AgentCoordinationProtocol } = require('./src/core/protocols/coordination.cjs');
  assert(AgentCoordinationProtocol, 'AgentCoordinationProtocol should be exported');
});

test('Module: MCPServerManager can be loaded', () => {
  const { MCPServerManager } = require('./src/core/mcp/server-manager.cjs');
  assert(MCPServerManager, 'MCPServerManager should be exported');
});

test('Module: AIProviderRouter can be loaded', () => {
  const { AIProviderRouter } = require('./src/services/ai-providers/router.cjs');
  assert(AIProviderRouter, 'AIProviderRouter should be exported');
});

test('Module: ObservabilitySystem can be loaded', () => {
  const { ObservabilitySystem } = require('./src/core/system/observability.cjs');
  assert(ObservabilitySystem, 'ObservabilitySystem should be exported');
});

test('Module: UltraDexCore can be loaded', () => {
  const { UltraDexCore } = require('./src/core/orchestration/ultra-dex-core.cjs');
  assert(UltraDexCore, 'UltraDexCore should be exported');
});

test('Module: SDK can be loaded', () => {
  const { UltraDex } = require('./sdk.cjs');
  assert(UltraDex, 'UltraDex SDK should be exported');
});

// Test 2: Class Instantiation
test('UnifiedMemory: Can create instance', () => {
  const { UnifiedMemory } = require('./src/core/memory/unified-api.cjs');
  const memory = new UnifiedMemory();
  assert(memory, 'Should create instance');
  assert(!memory.initialized, 'Should not be initialized yet');
});

test('AgentRegistry: Can create instance', () => {
  const { AgentRegistry } = require('./src/core/agents/registry-enhanced.cjs');
  const registry = new AgentRegistry();
  assert(registry, 'Should create instance');
  assert(!registry.initialized, 'Should not be initialized yet');
});

test('AgentAutopsy: Can create instance', () => {
  const { AgentAutopsy } = require('./src/core/reliability/agent-autopsy.cjs');
  const autopsy = new AgentAutopsy();
  assert(autopsy, 'Should create instance');
  assert(!autopsy.initialized, 'Should not be initialized yet');
});

test('MCPServerManager: Can create instance', () => {
  const { MCPServerManager } = require('./src/core/mcp/server-manager.cjs');
  const mcp = new MCPServerManager();
  assert(mcp, 'Should create instance');
  assert(!mcp.initialized, 'Should not be initialized yet');
});

test('AIProviderRouter: Can create instance', () => {
  const { AIProviderRouter } = require('./src/services/ai-providers/router.cjs');
  const router = new AIProviderRouter();
  assert(router, 'Should create instance');
  assert(!router.initialized, 'Should not be initialized yet');
});

test('ObservabilitySystem: Can create instance', () => {
  const { ObservabilitySystem } = require('./src/core/system/observability.cjs');
  const obs = new ObservabilitySystem();
  assert(obs, 'Should create instance');
  assert(!obs.initialized, 'Should not be initialized yet');
});

test('UltraDexCore: Can create instance', () => {
  const { UltraDexCore } = require('./src/core/orchestration/ultra-dex-core.cjs');
  const core = new UltraDexCore();
  assert(core, 'Should create instance');
  assert(!core.initialized, 'Should not be initialized yet');
  assert(core.status === 'stopped', 'Status should be stopped');
});

// Test 3: EventEmitter inheritance
test('UnifiedMemory: Extends EventEmitter', () => {
  const { UnifiedMemory } = require('./src/core/memory/unified-api.cjs');
  const memory = new UnifiedMemory();
  assert(typeof memory.on === 'function', 'Should have on() method');
  assert(typeof memory.emit === 'function', 'Should have emit() method');
});

test('AgentRegistry: Extends EventEmitter', () => {
  const { AgentRegistry } = require('./src/core/agents/registry-enhanced.cjs');
  const registry = new AgentRegistry();
  assert(typeof registry.on === 'function', 'Should have on() method');
  assert(typeof registry.emit === 'function', 'Should have emit() method');
});

// Test 4: API Methods
test('UnifiedMemory: Has required methods', () => {
  const { UnifiedMemory } = require('./src/core/memory/unified-api.cjs');
  const memory = new UnifiedMemory();
  assert(typeof memory.initialize === 'function', 'Should have initialize()');
  assert(typeof memory.store === 'function', 'Should have store()');
  assert(typeof memory.retrieve === 'function', 'Should have retrieve()');
  assert(typeof memory.queryGraph === 'function', 'Should have queryGraph()');
  assert(typeof memory.getStats === 'function', 'Should have getStats()');
});

test('AgentRegistry: Has required methods', () => {
  const { AgentRegistry } = require('./src/core/agents/registry-enhanced.cjs');
  const registry = new AgentRegistry();
  assert(typeof registry.initialize === 'function', 'Should have initialize()');
  assert(typeof registry.register === 'function', 'Should have register()');
  assert(typeof registry.execute === 'function', 'Should have execute()');
  assert(typeof registry.discover === 'function', 'Should have discover()');
  assert(typeof registry.list === 'function', 'Should have list()');
});

test('AgentAutopsy: Has required methods', () => {
  const { AgentAutopsy } = require('./src/core/reliability/agent-autopsy.cjs');
  const autopsy = new AgentAutopsy();
  assert(typeof autopsy.initialize === 'function', 'Should have initialize()');
  assert(typeof autopsy.monitor === 'function', 'Should have monitor()');
  assert(typeof autopsy.performAutopsy === 'function', 'Should have performAutopsy()');
  assert(typeof autopsy.checkHealth === 'function', 'Should have checkHealth()');
});

test('MCPServerManager: Has required methods', () => {
  const { MCPServerManager } = require('./src/core/mcp/server-manager.cjs');
  const mcp = new MCPServerManager();
  assert(typeof mcp.initialize === 'function', 'Should have initialize()');
  assert(typeof mcp.registerServer === 'function', 'Should have registerServer()');
  assert(typeof mcp.startServer === 'function', 'Should have startServer()');
  assert(typeof mcp.listTools === 'function', 'Should have listTools()');
});

test('AIProviderRouter: Has required methods', () => {
  const { AIProviderRouter } = require('./src/services/ai-providers/router.cjs');
  const router = new AIProviderRouter();
  assert(typeof router.initialize === 'function', 'Should have initialize()');
  assert(typeof router.registerProvider === 'function', 'Should have registerProvider()');
  assert(typeof router.chat === 'function', 'Should have chat()');
  assert(typeof router.getStats === 'function', 'Should have getStats()');
});

test('ObservabilitySystem: Has required methods', () => {
  const { ObservabilitySystem } = require('./src/core/system/observability.cjs');
  const obs = new ObservabilitySystem();
  assert(typeof obs.initialize === 'function', 'Should have initialize()');
  assert(typeof obs.startTrace === 'function', 'Should have startTrace()');
  assert(typeof obs.recordMetric === 'function', 'Should have recordMetric()');
  assert(typeof obs.getDashboard === 'function', 'Should have getDashboard()');
});

test('UltraDexCore: Has required methods', () => {
  const { UltraDexCore } = require('./src/core/orchestration/ultra-dex-core.cjs');
  const core = new UltraDexCore();
  assert(typeof core.initialize === 'function', 'Should have initialize()');
  assert(typeof core.start === 'function', 'Should have start()');
  assert(typeof core.execute === 'function', 'Should have execute()');
  assert(typeof core.chat === 'function', 'Should have chat()');
  assert(typeof core.getStatus === 'function', 'Should have getStatus()');
  assert(typeof core.health === 'function', 'Should have health()');
});

// Summary
console.log('\n===========================');
console.log('📊 Test Results');
console.log('===========================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed');
  process.exit(1);
}
