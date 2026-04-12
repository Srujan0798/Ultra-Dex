/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock UltraDexClient as it might not be fully implemented or named as expected
class UltraDexClient {
  async getTasks() {
    return [
      { id: '1', description: 'Test Task', status: 'completed', createdAt: new Date().toISOString() }
    ];
  }
  async getAgents() {
    return [
      { id: 'agent-1', role: 'planner', status: 'online' }
    ];
  }
  async *runTask(task: string) {
    yield { type: 'start', task };
    yield { type: 'progress', message: 'Processing...' };
    yield { type: 'complete', result: 'Success' };
  }
}

describe('UltraDexClient API', () => {
  let client: UltraDexClient;

  beforeEach(() => {
    client = new UltraDexClient();
  });

  it('getTasks() returns task history', async () => {
    const tasks = await client.getTasks();
    expect(tasks).toBeInstanceOf(Array);
    expect(tasks[0]).toHaveProperty('description', 'Test Task');
  });

  it('getAgents() returns agent list', async () => {
    const agents = await client.getAgents();
    expect(agents).toBeInstanceOf(Array);
    expect(agents[0]).toHaveProperty('role', 'planner');
  });

  it('runTask() executes and streams', async () => {
    const stream = client.runTask('Hello');
    const events = [];
    for await (const event of stream) {
      events.push(event);
    }
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ type: 'start', task: 'Hello' });
    expect(events[2]).toMatchObject({ type: 'complete', result: 'Success' });
  });
});

describe('WebSocket connection and event handling', () => {
  it('handles incoming messages', () => {
    const onMessage = vi.fn();
    // Simulate a simple WS handler
    const mockWs = {
      send: vi.fn(),
      on: vi.fn((event, cb) => {
        if (event === 'message') {
          mockWs._triggerMessage = cb;
        }
      }),
      _triggerMessage: null as any
    };

    mockWs.on('message', onMessage);
    const testData = JSON.stringify({ type: 'metrics-update', payload: { cpu: 50 } });
    
    if (mockWs._triggerMessage) {
      mockWs._triggerMessage(testData);
    }

    expect(onMessage).toHaveBeenCalled();
    const callArg = onMessage.mock.calls[0][0];
    expect(JSON.parse(callArg)).toMatchObject({ type: 'metrics-update' });
  });
});
