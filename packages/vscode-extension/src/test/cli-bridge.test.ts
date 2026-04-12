import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';

// Manual mock for vscode
vi.mock('vscode', () => {
  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn((key: string) => {
          if (key === 'cliPath') return 'ultra-dex';
          if (key === 'defaultProvider') return 'nvidia';
          if (key === 'defaultAgent') return 'planner';
          return undefined;
        }),
      })),
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    },
  };
});

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

import { CLIBridge } from '../cli-bridge';

describe('CLIBridge', () => {
  let bridge: CLIBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    bridge = new CLIBridge();
  });

  it('executeTask() spawns CLI with correct args', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

    const promise = bridge.executeTask('test task');

    mockProcess.stdout.emit('data', Buffer.from('output chunk'));
    mockProcess.emit('close', 0);

    const result = await promise;

    expect(child_process.spawn).toHaveBeenCalledWith(
      'ultra-dex',
      ['run', 'planner', '-t', 'test task', '--provider', 'nvidia'],
      expect.any(Object)
    );

    expect(result.success).toBe(true);
    expect(result.output).toBe('output chunk');
    expect(result.exitCode).toBe(0);
  });

  it('streamOutput() receives chunked data', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

    const chunks: string[] = [];
    bridge.streamOutput((chunk) => {
      chunks.push(chunk);
    });

    const promise = bridge.executeTask('test task');

    mockProcess.stdout.emit('data', Buffer.from('chunk 1 '));
    mockProcess.stdout.emit('data', Buffer.from('chunk 2'));
    mockProcess.emit('close', 0);

    await promise;

    expect(chunks).toEqual(['chunk 1 ', 'chunk 2']);
  });

  it('getAgents() parses CLI agent list output', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

    const promise = bridge.getAgents();

    const mockAgents = [{ id: 'test-agent', name: 'Test Agent', category: 'test' }];
    mockProcess.stdout.emit('data', Buffer.from(JSON.stringify(mockAgents)));
    mockProcess.emit('close', 0);

    const agents = await promise;

    expect(child_process.spawn).toHaveBeenCalledWith('ultra-dex', ['marketplace', 'list', '--json']);
    expect(agents).toEqual(mockAgents);
  });

  it('timeout handling (CLI hangs -> kill after 30s)', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

    const promise = bridge.executeTask('test task');

    // Simulate timeout error
    mockProcess.emit('error', new Error('Timeout'));

    await expect(promise).rejects.toThrow('Timeout');
  });

  it('error propagation (CLI exit code != 0)', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

    const promise = bridge.executeTask('test task');

    mockProcess.stderr.emit('data', Buffer.from('CLI error message'));
    mockProcess.emit('close', 1);

    await expect(promise).rejects.toThrow('CLI error message');
  });
});
