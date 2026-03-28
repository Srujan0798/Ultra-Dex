/**
 * Ultra-Dex Example - Cross-Model Memory Demo
 *
 * This example demonstrates:
 * 1. Persisting context across multiple AI model interactions
 * 2. Agent orchestration
 * 3. MCP tool usage
 * 4. Observability and monitoring
 */

async function main() {
  const { UltraDexCore } = await import('../src/core/orchestration/ultra-dex-core.js');

  console.log('🚀 Ultra-Dex Cross-Model Memory Demo');
  console.log('=====================================\n');

  // Initialize Ultra-Dex
  const ultra = new UltraDexCore({
    dataPath: './data/demo',
    name: 'Ultra-Dex Demo',
  });

  // Setup event listeners
  ultra.on('initialized', () => console.log('✅ Ultra-Dex initialized'));
  ultra.on('started', () => console.log('✅ Services started\n'));
  ultra.on('error', (error) => console.error('❌ Error:', error.message));

  try {
    // Initialize all subsystems
    console.log('📦 Initializing subsystems...');
    const initResult = await ultra.initialize();
    console.log('Components ready:', Object.keys(initResult.components).join(', '));

    // Start services
    console.log('\n▶️  Starting services...');
    await ultra.start();

    // Demo 1: Store context
    console.log('\n💾 Demo 1: Storing Context');
    console.log('--------------------------');

    await ultra.memory.store(
      {
        text: 'User preference: prefers TypeScript over JavaScript',
        entities: ['user', 'preference', 'typescript'],
        priority: 'high',
      },
      {
        strategy: 'hybrid',
        tags: ['user-profile', 'preferences'],
      }
    );

    await ultra.memory.store(
      {
        text: 'Project requirement: Must use PostgreSQL database',
        entities: ['project', 'requirement', 'postgresql'],
        priority: 'critical',
      },
      {
        strategy: 'hybrid',
        tags: ['project', 'requirements'],
      }
    );

    console.log('✅ Stored 2 context items');

    // Demo 2: Retrieve context
    console.log('\n🔍 Demo 2: Retrieving Context');
    console.log('-----------------------------');

    const query = 'What database should I use?';
    const context = await ultra.memory.retrieve(query, {
      strategy: 'hybrid',
      limit: 5,
    });

    console.log(`Query: "${query}"`);
    console.log(`Found ${context.items.length} relevant items:`);
    context.items.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.content?.text || 'N/A'} (source: ${item._source})`);
    });

    // Demo 3: Agent Registry
    console.log('\n🤖 Demo 3: Agent Registry');
    console.log('--------------------------');

    // Register a custom agent
    await ultra.agents.register({
      id: 'demo-analyzer',
      name: 'Demo Analyzer',
      description: 'Analyzes demo data',
      capabilities: ['analysis', 'demo'],
      handler: async (input, context) => {
        return {
          analyzed: true,
          inputLength: input.task?.length || 0,
          timestamp: new Date().toISOString(),
        };
      },
    });

    console.log(
      'Registered agents:',
      ultra.agents
        .list()
        .map((a) => a.name)
        .join(', ')
    );

    // Execute agent
    const agentResult = await ultra.agents.execute('demo-analyzer', {
      task: 'Analyze this demo',
    });
    console.log('Agent execution result:', agentResult.result);

    // Demo 4: MCP Servers
    console.log('\n🔌 Demo 4: MCP Server Manager');
    console.log('-------------------------------');

    const mcpStats = ultra.mcp.getStats();
    console.log(`Available MCP servers: ${mcpStats.servers}`);
    console.log(`Running: ${mcpStats.running}`);
    console.log(`Available tools: ${mcpStats.tools}`);

    // Demo 5: Observability
    console.log('\n📊 Demo 5: Observability Dashboard');
    console.log('-----------------------------------');

    const dashboard = ultra.observability.getDashboard();
    console.log('Dashboard metrics:');
    console.log(`  Total requests: ${dashboard.requests}`);
    console.log(`  Average latency: ${dashboard.averageLatency}ms`);
    console.log(`  Error rate: ${dashboard.errorRate}`);
    console.log(`  Active traces: ${dashboard.activeTraces}`);

    // Demo 6: Multi-Agent Coordination
    console.log('\n🎯 Demo 6: Multi-Agent Coordination');
    console.log('------------------------------------');

    const session = ultra.coordination.createSession({
      goal: 'Demonstrate coordination',
      agents: ['demo-analyzer', 'code-reviewer'],
    });

    console.log(`Created coordination session: ${session.id}`);
    console.log(`Agents in session: ${Array.from(session.agents).join(', ')}`);

    // Demo 7: System Health
    console.log('\n❤️  Demo 7: System Health Check');
    console.log('--------------------------------');

    const health = ultra.health();
    console.log(`Overall health: ${health.status}`);
    console.log('Component health:');
    Object.entries(health.checks).forEach(([component, status]) => {
      console.log(`  ${component}: ${status ? '✅' : '❌'}`);
    });

    // Demo 8: Full Status
    console.log('\n📈 Demo 8: Full System Status');
    console.log('------------------------------');

    const status = ultra.getStatus();
    console.log(`Status: ${status.status}`);
    console.log(`Version: ${status.version}`);
    console.log(`Uptime: ${status.uptime}ms`);

    console.log('\n✨ Demo Complete!');
    console.log('==================');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✅ Unified Memory (SQLite + future Chroma + Neo4j)');
    console.log('  ✅ Agent Registry with execution');
    console.log('  ✅ MCP Server Management');
    console.log('  ✅ Full Observability & Tracing');
    console.log('  ✅ Multi-Agent Coordination');
    console.log('  ✅ System Health Monitoring');

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await ultra.stop();
    console.log('✅ Demo finished successfully!');
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run demo
main().catch(console.error);
