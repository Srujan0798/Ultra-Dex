import { describe, it, expect, vi, beforeEach } from 'vitest';

// Manual mock for vscode
vi.mock('vscode', () => {
  return {
    window: {
      showInputBox: vi.fn(),
      showInformationMessage: vi.fn().mockResolvedValue(undefined),
    },
    commands: {
      registerCommand: vi.fn((cmd, callback) => ({ cmd, callback })),
      executeCommand: vi.fn(),
    },
  };
});

import * as vscode from 'vscode';
import { registerCommands } from '../commands';
import { CLIBridge } from '../cli-bridge';

describe('Commands', () => {
  let context: any;
  let cliBridge: any;
  let sidebarProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();
    context = {
      subscriptions: [],
    };
    cliBridge = {
      executeTask: vi.fn().mockResolvedValue({ success: true, output: 'Done', exitCode: 0 }),
    };
    sidebarProvider = {
      postMessage: vi.fn(),
    };
  });

  it('run command shows input box and executes', async () => {
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce('do something');

    registerCommands(context, cliBridge as unknown as CLIBridge, sidebarProvider);

    // Find the run command callback
    const runCommandCall = vi.mocked(vscode.commands.registerCommand).mock.calls.find(call => call[0] === 'ultra-dex.run');
    expect(runCommandCall).toBeDefined();

    const runCallback = runCommandCall![1];
    await runCallback();

    expect(vscode.window.showInputBox).toHaveBeenCalled();
    expect(cliBridge.executeTask).toHaveBeenCalledWith('do something');
    expect(sidebarProvider.postMessage).toHaveBeenCalledWith({
      type: 'task-result',
      payload: { success: true, output: 'Done', exitCode: 0 }
    });
  });

  it('swarm command creates multi-agent task', async () => {
    registerCommands(context, cliBridge as unknown as CLIBridge, sidebarProvider);

    const swarmCommandCall = vi.mocked(vscode.commands.registerCommand).mock.calls.find(call => call[0] === 'ultra-dex.swarm');
    expect(swarmCommandCall).toBeDefined();

    const swarmCallback = swarmCommandCall![1];
    await swarmCallback();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Swarm command is available from the CLI bridge.');
  });

  it('config command opens settings', async () => {
    registerCommands(context, cliBridge as unknown as CLIBridge, sidebarProvider);

    const configCommandCall = vi.mocked(vscode.commands.registerCommand).mock.calls.find(call => call[0] === 'ultra-dex.config');
    expect(configCommandCall).toBeDefined();

    const configCallback = configCommandCall![1];
    await configCallback();

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.openSettings', 'ultra-dex');
  });
});
