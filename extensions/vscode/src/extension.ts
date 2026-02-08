import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { StatusProvider } from './sidebar';

let statusBar: vscode.StatusBarItem;
let statusProvider: StatusProvider;

export function activate(context: vscode.ExtensionContext) {
  // Create status bar item
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = 'ultra-dex.statusBarClick';
  statusBar.text = '$(sync~spin) Ultra-Dex: Initializing...';
  statusBar.tooltip = 'Ultra-Dex Status: Click for details';
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Create status provider
  statusProvider = new StatusProvider();
  vscode.window.registerTreeDataProvider('ultraDexStatus', statusProvider);

  // Register commands
  registerCommands(context, statusProvider);

  // Update status initially and periodically
  updateStatus();
  setInterval(updateStatus, 30000); // Update every 30 seconds
}

export function deactivate() {}

async function updateStatus() {
  if (!statusBar) return;

  try {
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspace) {
      statusBar.text = '$(circle-slash) Ultra-Dex: No workspace';
      statusBar.color = new vscode.ThemeColor('errorForeground');
      return;
    }

    // Check if ultra-dex is available
    const { exec } = await import('child_process');
    exec('ultra-dex --version', { cwd: workspace }, (error, stdout) => {
      if (error) {
        statusBar.text = '$(circle-slash) Ultra-Dex: Not installed';
        statusBar.color = new vscode.ThemeColor('errorForeground');
      } else {
        // Get project status
        const version = stdout.trim() || 'unknown';
        statusBar.text = `$(zap) Ultra-Dex v${version}`;
        statusBar.color = new vscode.ThemeColor('statusBar.foreground');
      }
    });

    // Update status provider
    statusProvider.refresh();
  } catch (error) {
    statusBar.text = '$(circle-slash) Ultra-Dex: Error';
    statusBar.color = new vscode.ThemeColor('errorForeground');
  }
}
