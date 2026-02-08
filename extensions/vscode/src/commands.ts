import * as vscode from 'vscode';
import { exec } from 'child_process';
import { StatusProvider } from './sidebar';

function runCli(command: string, cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(stderr || error.message);
        reject(error);
        return;
      }
      if (stdout.trim()) {
        vscode.window.showInformationMessage(stdout.split('\n')[0]);
      }
      resolve();
    });
  });
}

export function registerCommands(
  context: vscode.ExtensionContext,
  statusProvider: StatusProvider
) {
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.start', async () => {
      await runCli('ultra-dex init', workspace);
      statusProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.plan', async () => {
      await runCli('ultra-dex plan', workspace);
      statusProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.fix', async () => {
      await runCli('ultra-dex fix', workspace);
      statusProvider.refresh();
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
}
