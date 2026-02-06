import assert from 'assert';
import { runAgentLoop } from '../lib/commands/run.js';

// Mock Provider for Delegation Test
class DelegationMockProvider {
  constructor() {
    this.calls = 0;
  }

  async generate(system, prompt) {
    this.calls++;

    // First call: The Manager delegates to the Worker
    if (this.calls === 1) {
      return {
        content: 'I need help with this.\n>> DELEGATE: @Worker "Do the work"',
      };
    }

    // Second call: The Worker performs the task
    if (this.calls === 2) {
      // Verify that the prompt contains the task "Do the work"
      if (prompt.includes('Do the work')) {
        return { content: 'Work complete.' };
      }
      return { content: 'Wrong task received.' };
    }

    return { content: 'Unexpected call.' };
  }
}

// Mock Agents (Need to ensure these exist in run.js AGENTS map or are handled)
// run.js has specific agents. We should use existing ones like 'backend' and 'frontend'
// or ensure run.js handles unknown agents gracefully or we use known ones.
// The test uses 'Manager' and 'Worker'. run.js checks `AGENTS[agentName.toLowerCase()]`.
// So we must use valid agent names or mock the AGENTS object in run.js.
// Since we can't easily mock the internal AGENTS object of the module without a rewire tool,
// we will use existing agents: 'planner' delegating to 'backend'.

async function testDelegation() {
  console.log('🧪 Testing Agent Delegation...');

  const provider = new DelegationMockProvider();
  const context = { context: 'Project Context' };

  // We use 'planner' as the first agent (Manager) and 'backend' as the delegate (Worker)
  // provider.generate will handle the logic based on call count.

  // Refined Mock Provider to match specific agent prompts if needed,
  // but our simple counter approach works if we assume the sequence.

  // Overriding provider for clarity
  provider.generate = async (system, prompt) => {
    provider.calls++;
    if (system.includes('@Planner')) {
      return { content: 'Delegating task...\n>> DELEGATE: @Backend "Build API"' };
    }
    if (system.includes('@Backend')) {
      if (prompt.includes('Build API')) {
        return { content: 'API Built successfully.' };
      }
      return { content: 'Error: Wrong task.' };
    }
    return { content: 'Unknown agent.' };
  };

  const result = await runAgentLoop('planner', 'Plan the system', provider, context);

  // Check if the result contains the delegated output
  assert.match(result, /Delegated Result from @Backend/);
  assert.match(result, /API Built successfully/);

  console.log('  ✅ Delegation flow passed');
}

testDelegation().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
