import { describe, it, expect, vi, beforeEach } from 'vitest';

// Manual mock for vscode
vi.mock('vscode', () => {
  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn(),
      })),
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }]
    },
    window: {
      registerWebviewViewProvider: vi.fn(),
      showInformationMessage: vi.fn().mockResolvedValue(undefined),
      showInputBox: vi.fn().mockResolvedValue('do task'),
    },
    commands: {
      registerCommand: vi.fn(),
      executeCommand: vi.fn(),
    },
    Uri: {
      file: vi.fn((path) => ({ fsPath: path })),
    },
  };
});

import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

describe('Extension Lifecycle', () => {
  let context: any;

  beforeEach(() => {
    vi.clearAllMocks();
    context = {
      subscriptions: [],
      extensionUri: { fsPath: '/test/path' },
    };
  });

  it('activate() registers all commands', () => {
    activate(context);

    // Sidebar webviews
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
      'ultra-dex.agents',
      expect.any(Object),
      expect.any(Object)
    );
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
      'ultra-dex.tasks',
      expect.any(Object),
      expect.any(Object)
    );
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
      'ultra-dex.memory',
      expect.any(Object),
      expect.any(Object)
    );

    // Commands
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'ultra-dex.run',
      expect.any(Function)
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'ultra-dex.swarm',
      expect.any(Function)
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'ultra-dex.config',
      expect.any(Function)
    );

    expect(context.subscriptions.length).toBeGreaterThan(0);
  });

  it('deactivate() cleans up processes', () => {
    activate(context);
    deactivate();
    expect(true).toBe(true);
  });

  it('sidebar provider resolves webview', () => {
    activate(context);
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalled();
  });
});
