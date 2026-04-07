#!/usr/bin/env node
/**
 * Diamond State Demo
 * 
 * Demonstrates the key features of the Diamond State architecture:
 * - Semantic routing
 * - Self-healing
 * - Sandboxing
 * - Real-time streaming
 */

import { 
  initializeDiamondState, 
  getDiamondStats,
  AlertSeverity,
} from '../src/core/diamond-state.js';

async function main() {
  console.log('🚀 Starting Diamond State Demo...\n');

  // Initialize Diamond State
  const diamond = await initializeDiamondState({
    mesh: { enabled: false }, // Disable for demo
    streaming: { enabled: false }, // Disable for demo
    selfHealing: { enabled: true },
  });

  console.log('\n📊 Initial Statistics:');
  console.log(JSON.stringify(getDiamondStats(diamond), null, 2));

  // Demo 1: Semantic Routing
  console.log('\n🧭 Demo 1: Semantic Routing');
  console.log('─────────────────────────────────');
  
  const testTasks = [
    'Create a responsive navigation bar with mobile menu',
    'Set up PostgreSQL database with Prisma ORM',
    'Create Dockerfile for Node.js application',
    'Audit codebase for SQL injection vulnerabilities',
    'Build a React component with Tailwind CSS',
    'Configure Kubernetes deployment with auto-scaling',
  ];

  for (const task of testTasks) {
    const decision = await diamond.semanticRouter.route(task);
    console.log(`\nTask: "${task.slice(0, 50)}..."`);
    console.log(`  → Routed to: ${decision.agentId}`);
    console.log(`  → Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    console.log(`  → Reasoning: ${decision.reasoning}`);
  }

  // Demo 2: Self-Healing
  console.log('\n\n🔧 Demo 2: Self-Healing System');
  console.log('─────────────────────────────────');

  // Simulate a high latency alert
  diamond.alertManager.builder()
    .type('provider.latency.high')
    .severity(AlertSeverity.HIGH)
    .message('OpenAI API latency exceeded 2000ms')
    .source('ai-provider-monitor')
    .metrics({ latency: 3500, errorRate: 0.01 })
    .context({ providerId: 'openai', threshold: 2000 })
    .emit();

  console.log('Emitted high latency alert for OpenAI provider');

  // Simulate memory pressure
  diamond.alertManager.builder()
    .type('memory.usage.high')
    .severity(AlertSeverity.HIGH)
    .message('Memory usage exceeded 85%')
    .source('system-monitor')
    .metrics({ heapUsed: 900, heapTotal: 1024, percentage: 88 })
    .emit();

  console.log('Emitted memory pressure alert');

  // Wait for healing to process
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\nSelf-healing statistics:');
  console.log(JSON.stringify(diamond.siteReliability?.getStats(), null, 2));

  // Demo 3: Sandboxing
  console.log('\n\n🔒 Demo 3: Sandboxing');
  console.log('─────────────────────────────────');

  const safeCode = `
    const x = 10;
    const y = 20;
    x + y;
  `;

  const result = await diamond.isolatedVMSandbox.execute(safeCode, {
    timeout: 5000,
    memoryLimit: 128,
    allowedModules: [],
    logger: diamond.logger,
    filesystem: {
      readFile: async () => { throw new Error('FS disabled'); },
      writeFile: async () => { throw new Error('FS disabled'); },
      exists: async () => false,
      list: async () => [],
    },
    environment: {},
  });

  console.log('Sandbox execution result:');
  console.log(`  → Success: ${result.success}`);
  console.log(`  → Result: ${result.result}`);
  console.log(`  → Duration: ${result.executionTime}ms`);

  // Demo 4: MCP App Store
  console.log('\n\n📦 Demo 4: MCP App Store');
  console.log('─────────────────────────────────');

  // Publish a sample plugin
  const samplePlugin = {
    id: 'sample-logger',
    name: 'Sample Logger Plugin',
    version: '1.0.0',
    description: 'A sample logging plugin for demonstration',
    author: 'Ultra-Dex Team',
    license: 'MIT',
    capabilities: ['logging', 'monitoring'],
    entryPoint: './index.js',
    dependencies: {},
    permissions: ['logging:write'],
  };

  const publishResult = await diamond.appStore.publish(samplePlugin);
  console.log(`Publish result: ${publishResult.success ? '✅ Success' : '❌ Failed'}`);
  if (!publishResult.success) {
    console.log('Errors:', publishResult.errors);
  }

  // Search for plugins
  const searchResults = await diamond.appStore.search('logger');
  console.log(`\nFound ${searchResults.length} plugins matching "logger":`);
  for (const plugin of searchResults) {
    console.log(`  - ${plugin.name} by ${plugin.author} (${plugin.downloads} downloads)`);
  }

  // Final statistics
  console.log('\n\n📊 Final Diamond State Statistics:');
  console.log('─────────────────────────────────');
  console.log(JSON.stringify(getDiamondStats(diamond), null, 2));

  console.log('\n✨ Diamond State Demo Complete!');

  // Cleanup
  await diamond.telemetry.shutdown();
  process.exit(0);
}

main().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
