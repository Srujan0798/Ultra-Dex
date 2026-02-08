import * as vscode from 'vscode';
import { exec } from 'child_process';
import { StatusProvider } from './sidebar';

function runCli(command: string, cwd?: string): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        const errorMsg = stderr || error.message;
        vscode.window.showErrorMessage(`Ultra-Dex Error: ${errorMsg}`);
        resolve({ success: false, error: errorMsg });
        return;
      }
      if (stdout.trim()) {
        const output = stdout.split('\n')[0];
        vscode.window.showInformationMessage(`Ultra-Dex: ${output}`);
        resolve({ success: true, output });
      } else {
        resolve({ success: true });
      }
    });
  });
}

export function registerCommands(
  context: vscode.ExtensionContext,
  statusProvider: StatusProvider
) {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // Register all commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.start', async () => {
      const result = await runCli('ultra-dex init', workspace);
      if (result.success) {
        statusProvider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.plan', async () => {
      // Prompt user for plan description
      const planDescription = await vscode.window.showInputBox({
        prompt: 'Describe what you want to build',
        placeHolder: 'e.g., "Create a React todo app with authentication"'
      });

      if (planDescription) {
        const result = await runCli(`ultra-dex plan "${planDescription}"`, workspace);
        if (result.success) {
          statusProvider.refresh();

          // Open the generated plan
          const planFiles = await vscode.workspace.findFiles('**/IMPLEMENTATION_PLAN.md', '**/node_modules/**', 1);
          if (planFiles.length > 0) {
            const doc = await vscode.workspace.openTextDocument(planFiles[0]);
            await vscode.window.showTextDocument(doc);
          }
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.fix', async () => {
      const result = await runCli('ultra-dex fix', workspace);
      if (result.success) {
        statusProvider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.openContext', async () => {
      const files = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
      if (!files.length) {
        vscode.window.showWarningMessage('CONTEXT.md not found in this workspace.');
        return;
      }
      const doc = await vscode.workspace.openTextDocument(files[0]);
      await vscode.window.showTextDocument(doc);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.statusBarClick', async () => {
      // Show status information in an information message
      const statusItems = statusProvider.getStatusItems();
      if (statusItems.length > 0) {
        const statusText = statusItems.map(item => `${item.label}: ${item.description}`).join('\n');
        vscode.window.showInformationMessage(`Ultra-Dex Status:\n${statusText}`);
      } else {
        vscode.window.showInformationMessage('Ultra-Dex: Checking status...');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.runTask', async () => {
      const taskFile = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Task File',
        filters: {
          'Task Files': ['md', 'txt', 'json'],
          'All files': ['*']
        }
      });

      if (taskFile && taskFile.length > 0) {
        const taskPath = taskFile[0].fsPath;
        const fileName = taskPath.split('/').pop();

        const result = await runCli(`ultra-dex run "${taskPath}"`, workspace);
        if (result.success) {
          statusProvider.refresh();
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.verify', async () => {
      const result = await runCli('ultra-dex verify --full', workspace);
      if (result.success) {
        statusProvider.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.swarm', async () => {
      const result = await runCli('ultra-dex swarm start --parallel 3', workspace);
      if (result.success) {
        statusProvider.refresh();
      }
    })
  );
}
