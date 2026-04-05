/**
 * Quick Validation Test
 * Tests core subsystems without external dependencies
 */

const assert = require('assert');

console.log('🧪 Ultra-Dex Core Validation\n');
console.log('===========================\n');

let testsPassed = 0;
let testsFailed = 0;

function load(specifier) {
  return import(specifier);
}

function loadSdk() {
  return require('./sdk.cjs');
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function run() {
  await test('Module: UnifiedMemory can be loaded', async () => {
    const { UnifiedMemory } = await load('./src/core/memory/unified-api.js');
    assert(UnifiedMemory, 'UnifiedMemory should be exported');
  });

  await test('Module: AgentRegistry can be loaded', async () => {
    const { AgentRegistry } = await load('./src/core/agents/registry-enhanced.js');
    assert(AgentRegistry, 'AgentRegistry should be exported');
  });

  await test('Module: AgentAutopsy can be loaded', async () => {
    const { AgentAutopsy } = await load('./src/core/reliability/agent-autopsy.js');
    assert(AgentAutopsy, 'AgentAutopsy should be exported');
  });

  await test('Module: AgentCoordinationProtocol can be loaded', async () => {
    const { AgentCoordinationProtocol } = await load('./src/core/protocols/coordination.js');
    assert(AgentCoordinationProtocol, 'AgentCoordinationProtocol should be exported');
  });

  await test('Module: MCPServerManager can be loaded', async () => {
    const { MCPServerManager } = await load('./src/core/mcp/server-manager.js');
    assert(MCPServerManager, 'MCPServerManager should be exported');
  });

  await test('Module: AIProviderRouter can be loaded', async () => {
    const { AIProviderRouter } = await load('./src/services/ai-providers/router.js');
    assert(AIProviderRouter, 'AIProviderRouter should be exported');
  });

  await test('Module: ObservabilitySystem can be loaded', async () => {
    const { ObservabilitySystem } = await load('./src/core/system/observability.js');
    assert(ObservabilitySystem, 'ObservabilitySystem should be exported');
  });

  await test('Module: UltraDexCore can be loaded', async () => {
    const { UltraDexCore } = await load('./src/core/orchestration/ultra-dex-core.js');
    assert(UltraDexCore, 'UltraDexCore should be exported');
  });

  await test('Module: SDK can be loaded', async () => {
    const { UltraDex } = await loadSdk();
    assert(UltraDex, 'UltraDex SDK should be exported');
  });

  await test('UnifiedMemory: Can create instance', async () => {
    const { UnifiedMemory } = await load('./src/core/memory/unified-api.js');
    const memory = new UnifiedMemory();
    assert(memory, 'Should create instance');
    assert(!memory.initialized, 'Should not be initialized yet');
  });

  await test('AgentRegistry: Can create instance', async () => {
    const { AgentRegistry } = await load('./src/core/agents/registry-enhanced.js');
    const registry = new AgentRegistry();
    assert(registry, 'Should create instance');
    assert(!registry.initialized, 'Should not be initialized yet');
  });

  await test('AgentAutopsy: Can create instance', async () => {
    const { AgentAutopsy } = await load('./src/core/reliability/agent-autopsy.js');
    const autopsy = new AgentAutopsy();
    assert(autopsy, 'Should create instance');
    assert(!autopsy.initialized, 'Should not be initialized yet');
  });

  await test('MCPServerManager: Can create instance', async () => {
    const { MCPServerManager } = await load('./src/core/mcp/server-manager.js');
    const mcp = new MCPServerManager();
    assert(mcp, 'Should create instance');
    assert(!mcp.initialized, 'Should not be initialized yet');
  });

  await test('AIProviderRouter: Can create instance', async () => {
    const { AIProviderRouter } = await load('./src/services/ai-providers/router.js');
    const router = new AIProviderRouter();
    assert(router, 'Should create instance');
    assert(!router.initialized, 'Should not be initialized yet');
  });

  await test('ObservabilitySystem: Can create instance', async () => {
    const { ObservabilitySystem } = await load('./src/core/system/observability.js');
    const obs = new ObservabilitySystem();
    assert(obs, 'Should create instance');
    assert(!obs.initialized, 'Should not be initialized yet');
  });

  await test('UltraDexCore: Can create instance', async () => {
    const { UltraDexCore } = await load('./src/core/orchestration/ultra-dex-core.js');
    const core = new UltraDexCore();
    assert(core, 'Should create instance');
    assert(!core.initialized, 'Should not be initialized yet');
    assert(core.status === 'stopped', 'Status should be stopped');
  });

  await test('UnifiedMemory: Extends EventEmitter', async () => {
    const { UnifiedMemory } = await load('./src/core/memory/unified-api.js');
    const memory = new UnifiedMemory();
    assert(typeof memory.on === 'function', 'Should have on() method');
    assert(typeof memory.emit === 'function', 'Should have emit() method');
  });

  await test('AgentRegistry: Extends EventEmitter', async () => {
    const { AgentRegistry } = await load('./src/core/agents/registry-enhanced.js');
    const registry = new AgentRegistry();
    assert(typeof registry.on === 'function', 'Should have on() method');
    assert(typeof registry.emit === 'function', 'Should have emit() method');
  });

  await test('UnifiedMemory: Has required methods', async () => {
    const { UnifiedMemory } = await load('./src/core/memory/unified-api.js');
    const memory = new UnifiedMemory();
    assert(typeof memory.initialize === 'function', 'Should have initialize()');
    assert(typeof memory.store === 'function', 'Should have store()');
    assert(typeof memory.retrieve === 'function', 'Should have retrieve()');
    assert(typeof memory.queryGraph === 'function', 'Should have queryGraph()');
    assert(typeof memory.getStats === 'function', 'Should have getStats()');
  });

  await test('AgentRegistry: Has required methods', async () => {
    const { AgentRegistry } = await load('./src/core/agents/registry-enhanced.js');
    const registry = new AgentRegistry();
    assert(typeof registry.initialize === 'function', 'Should have initialize()');
    assert(typeof registry.register === 'function', 'Should have register()');
    assert(typeof registry.execute === 'function', 'Should have execute()');
    assert(typeof registry.discover === 'function', 'Should have discover()');
    assert(typeof registry.list === 'function', 'Should have list()');
  });

  await test('AgentAutopsy: Has required methods', async () => {
    const { AgentAutopsy } = await load('./src/core/reliability/agent-autopsy.js');
    const autopsy = new AgentAutopsy();
    assert(typeof autopsy.initialize === 'function', 'Should have initialize()');
    assert(typeof autopsy.monitor === 'function', 'Should have monitor()');
    assert(typeof autopsy.performAutopsy === 'function', 'Should have performAutopsy()');
    assert(typeof autopsy.checkHealth === 'function', 'Should have checkHealth()');
  });

  await test('MCPServerManager: Has required methods', async () => {
    const { MCPServerManager } = await load('./src/core/mcp/server-manager.js');
    const mcp = new MCPServerManager();
    assert(typeof mcp.initialize === 'function', 'Should have initialize()');
    assert(typeof mcp.registerServer === 'function', 'Should have registerServer()');
    assert(typeof mcp.startServer === 'function', 'Should have startServer()');
    assert(typeof mcp.listTools === 'function', 'Should have listTools()');
  });

  await test('AIProviderRouter: Has required methods', async () => {
    const { AIProviderRouter } = await load('./src/services/ai-providers/router.js');
    const router = new AIProviderRouter();
    assert(typeof router.initialize === 'function', 'Should have initialize()');
    assert(typeof router.registerProvider === 'function', 'Should have registerProvider()');
    assert(typeof router.chat === 'function', 'Should have chat()');
    assert(typeof router.getStats === 'function', 'Should have getStats()');
  });

  await test('ObservabilitySystem: Has required methods', async () => {
    const { ObservabilitySystem } = await load('./src/core/system/observability.js');
    const obs = new ObservabilitySystem();
    assert(typeof obs.initialize === 'function', 'Should have initialize()');
    assert(typeof obs.startTrace === 'function', 'Should have startTrace()');
    assert(typeof obs.recordMetric === 'function', 'Should have recordMetric()');
    assert(typeof obs.getDashboard === 'function', 'Should have getDashboard()');
  });

  await test('UltraDexCore: Has required methods', async () => {
    const { UltraDexCore } = await load('./src/core/orchestration/ultra-dex-core.js');
    const core = new UltraDexCore();
    assert(typeof core.initialize === 'function', 'Should have initialize()');
    assert(typeof core.start === 'function', 'Should have start()');
    assert(typeof core.execute === 'function', 'Should have execute()');
    assert(typeof core.chat === 'function', 'Should have chat()');
    assert(typeof core.getStatus === 'function', 'Should have getStatus()');
    assert(typeof core.health === 'function', 'Should have health()');
  });

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
}

run().catch((error) => {
  console.error('\n💥 Validation runner crashed');
  console.error(error);
  process.exit(1);
});
