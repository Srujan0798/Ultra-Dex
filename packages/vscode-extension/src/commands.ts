import * as vscode from 'vscode';
import type { CLIBridge } from './cli-bridge';
import type { UltraDexSidebarProvider } from './sidebar';

export function registerCommands(
  context: vscode.ExtensionContext,
  cliBridge: CLIBridge,
  sidebar: UltraDexSidebarProvider
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.run', async () => {
      const prompt = await vscode.window.showInputBox({
        placeHolder: 'Describe the task',
        prompt: 'Run Ultra-Dex agent task',
      });
      if (!prompt) return;

      const result = await cliBridge.executeTask(prompt);
      await vscode.window.showInformationMessage(
        result.success ? 'Ultra-Dex task completed' : 'Ultra-Dex task failed'
      );
      sidebar.postMessage({ type: 'task-result', payload: result });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.swarm', async () => {
      await vscode.window.showInformationMessage('Swarm command is available from the CLI bridge.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.config', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'ultra-dex');
    })
  );
}

