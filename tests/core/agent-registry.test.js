// Copyright (c) 2026 Ultra-Dex
import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { AgentRegistry } from '../../src/core/orchestration/registry.js';

describe('AgentRegistry', () => {
  it('should register an agent and index its capabilities', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    const agentDef = {
      name: 'TestAgent',
      description: 'A test agent',
      capabilities: ['test-cap-1', 'test-cap-2']
    };
    
    await registry.registerAgent('test-agent', agentDef);
    
    const agent = registry.getAgentById('test-agent');
    assert.strictEqual(agent.name, 'TestAgent');
    assert.deepStrictEqual(agent.capabilities, ['test-cap-1', 'test-cap-2']);
    
    const agentsWithCap1 = registry.findAgentsByCapability('test-cap-1');
    assert.strictEqual(agentsWithCap1.length, 1);
    assert.strictEqual(agentsWithCap1[0].id, 'test-agent');
  });

  it('should throw error when registering agent without name', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    const agentDef = {
      description: 'Missing name',
      capabilities: []
    };
    
    await assert.rejects(
      () => registry.registerAgent('bad-agent', agentDef),
      { message: 'Agent definition must include a name' }
    );
  });

  it('should find agents by multiple capabilities (AND condition)', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    
    await registry.registerAgent('agent-a', {
      name: 'Agent A',
      description: 'Desc A',
      capabilities: ['cap1', 'cap2']
    });
    
    await registry.registerAgent('agent-b', {
      name: 'Agent B',
      description: 'Desc B',
      capabilities: ['cap1', 'cap3']
    });
    
    const bothCaps = registry.findAgentsByCapabilities(['cap1', 'cap2']);
    assert.strictEqual(bothCaps.length, 1);
    assert.strictEqual(bothCaps[0].id, 'agent-a');
    
    const cap1Only = registry.findAgentsByCapabilities(['cap1']);
    assert.strictEqual(cap1Only.length, 2);
  });

  it('should find agents by any capability (OR condition)', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    
    await registry.registerAgent('agent-a', {
      name: 'Agent A',
      description: 'Desc A',
      capabilities: ['cap1']
    });
    
    await registry.registerAgent('agent-b', {
      name: 'Agent B',
      description: 'Desc B',
      capabilities: ['cap2']
    });
    
    const anyCaps = registry.findAgentsByAnyCapability(['cap1', 'cap2']);
    assert.strictEqual(anyCaps.length, 2);
  });

  it('should update agent and re-index capabilities', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    
    await registry.registerAgent('test-agent', {
      name: 'TestAgent',
      description: 'Desc',
      capabilities: ['old-cap']
    });
    
    await registry.updateAgent('test-agent', { capabilities: ['new-cap'] });
    
    assert.strictEqual(registry.findAgentsByCapability('old-cap').length, 0);
    assert.strictEqual(registry.findAgentsByCapability('new-cap').length, 1);
  });

  it('should remove agent and clean up indexes', async () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    
    await registry.registerAgent('test-agent', {
      name: 'TestAgent',
      description: 'Desc',
      capabilities: ['cap']
    });
    
    await registry.removeAgent('test-agent');
    
    assert.strictEqual(registry.getAgentById('test-agent'), undefined);
    assert.strictEqual(registry.findAgentsByCapability('cap').length, 0);
  });

  it('should infer capabilities from role and name', () => {
    const registry = new AgentRegistry({ autoDiscover: false, enablePersistence: false });
    
    const caps = registry.inferCapabilities('cto', 'Responsible for architecture');
    assert.ok(caps.includes('planning'));
    assert.ok(caps.includes('architecture'));
    assert.ok(caps.includes('general'));
  });
});
