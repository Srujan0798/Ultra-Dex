/**
 * Ultra-Dex VS Code Extension
 * 
 * Features:
 * - Visual workflow editor with live preview
 * - Workflow execution and debugging
 * - Real-time dashboard integration
 * - IntelliSense for .dex files
 */

import * as vscode from 'vscode';
import { WorkflowEditorProvider } from './providers/workflowEditor.js';
import { WorkflowTreeProvider } from './providers/workflowTree.js';
import { DashboardPanel } from './providers/dashboardPanel.js';
import { runWorkflow, debugWorkflow, validateWorkflow } from './commands/execution.js';
import { UltraDexClient } from './utils/client.js';

let client: UltraDexClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('Ultra-Dex extension activating...');

  // Initialize Ultra-Dex client
  client = new UltraDexClient();

  // Register custom editor provider for .dex files
  const editorProvider = new WorkflowEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'ultraDex.workflowEditor',
      editorProvider,
      { supportsMultipleEditorsPerDocument: false }
    )
  );

  // Register tree view provider for workflows
  const workflowTreeProvider = new WorkflowTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('ultraDex.workflows', workflowTreeProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ultraDex.openWorkflow', (uri?: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (fileUri) {
        vscode.commands.executeCommand('vscode.openWith', fileUri, 'ultraDex.workflowEditor');
      }
    }),

    vscode.commands.registerCommand('ultraDex.runWorkflow', (uri?: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (fileUri) {
        runWorkflow(fileUri, client);
      }
    }),

    vscode.commands.registerCommand('ultraDex.debugWorkflow', (uri?: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (fileUri) {
        debugWorkflow(fileUri, client);
      }
    }),

    vscode.commands.registerCommand('ultraDex.showDashboard', () => {
      DashboardPanel.createOrShow(context.extensionUri, client);
    }),

    vscode.commands.registerCommand('ultraDex.validateWorkflow', (uri?: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (fileUri) {
        validateWorkflow(fileUri);
      }
    }),

    vscode.commands.registerCommand('ultraDex.refreshWorkflows', () => {
      workflowTreeProvider.refresh();
    })
  );

  // Set context for view visibility
  vscode.commands.executeCommand('setContext', 'ultraDex.enabled', true);

  // Watch for .dex file changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.dex');
  context.subscriptions.push(
    watcher.onDidChange(() => workflowTreeProvider.refresh()),
    watcher.onDidCreate(() => workflowTreeProvider.refresh()),
    watcher.onDidDelete(() => workflowTreeProvider.refresh())
  );

  console.log('Ultra-Dex extension activated');
}

export function deactivate() {
  client?.dispose();
}
