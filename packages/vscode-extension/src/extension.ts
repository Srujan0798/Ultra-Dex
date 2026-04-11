import * as vscode from 'vscode';
import { UltraDexSidebarProvider } from './sidebar';
import { CLIBridge } from './cli-bridge';
import { registerCommands } from './commands';

let cliBridge: CLIBridge | undefined;
let sidebarProvider: UltraDexSidebarProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Ultra-Dex extension activated');

  // Initialize CLI bridge
  cliBridge = new CLIBridge();

  // Create sidebar provider
  sidebarProvider = new UltraDexSidebarProvider(context.extensionUri, cliBridge);

  // Register sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('ultra-dex.agents', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('ultra-dex.tasks', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('ultra-dex.memory', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // Register commands
  registerCommands(context, cliBridge, sidebarProvider);

  // Show welcome message
  vscode.window
    .showInformationMessage(
      'Ultra-Dex activated. Use Ctrl+Shift+U to run an agent.',
      'Open Sidebar'
    )
    .then((selection) => {
      if (selection === 'Open Sidebar') {
        vscode.commands.executeCommand('ultra-dex-sidebar.focus');
      }
    });
}

export function deactivate() {
  console.log('Ultra-Dex extension deactivated');

  // Cleanup CLI bridge
  if (cliBridge) {
    cliBridge.dispose();
    cliBridge = undefined;
  }
}

// Export for testing
export { CLIBridge, UltraDexSidebarProvider };
