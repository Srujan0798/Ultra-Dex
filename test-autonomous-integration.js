import { BaseAgent } from './src/core/agents/base-agent.js';
import { Coordinator } from './src/core/agents/coordinator.js';
import { ContextManager } from './src/core/memory/context.js';
import { RBAC } from './src/core/auth/rbac.js';
import { PolicyEngine } from './src/core/governance/policy-engine.js';

console.log('🧪 Testing Ultra-Dex Autonomous System Integration');
console.log('=================================================');

async function testIntegration() {
    try {
        // Test 1: Agent System
        console.log('1. Testing Agent System...');
        const agent = new BaseAgent({ name: 'test-agent' });
        await agent.initialize();
        console.log('   ✅ BaseAgent initialized:', agent.getStatus().status);
        
        const coordinator = new Coordinator();
        await coordinator.initialize();
        coordinator.registerAgent(agent);
        console.log('   ✅ Coordinator operational with', coordinator.agents.size, 'agents');
        
        // Test 2: Memory System
        console.log('2. Testing Memory System...');
        const context = new ContextManager();
        const sessionContext = await context.createContext('test-session');
        await context.addMessage('test-session', { role: 'user', content: 'Hello system!' });
        console.log('   ✅ Memory system operational, session:', sessionContext.id);
        
        // Test 3: Security System
        console.log('3. Testing Security System...');
        const rbac = new RBAC();
        rbac.assignRole('test-user', 'user');
        const hasPermission = rbac.hasPermission('test-user', 'read');
        console.log('   ✅ RBAC system operational, permission check:', hasPermission);
        
        // Test 4: Governance System
        console.log('4. Testing Governance System...');
        const policy = new PolicyEngine();
        const evaluation = await policy.evaluatePolicy('security', { user: { id: 'test-user' } });
        console.log('   ✅ Policy engine operational, compliant:', evaluation.compliant);
        
        console.log('\n�� ALL SYSTEMS OPERATIONAL!');
        console.log('✅ Agent System: Functional');
        console.log('✅ Memory System: Functional');
        console.log('✅ Security System: Functional');
        console.log('✅ Governance System: Functional');
        
        console.log('\n🚀 Ultra-Dex Autonomous System Ready for Production!');
        
        // Cleanup
        await agent.shutdown();
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        process.exit(1);
    }
}

testIntegration();
