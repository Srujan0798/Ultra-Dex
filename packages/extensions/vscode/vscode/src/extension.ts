import * as vscode from 'vscode';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { ContextHoverProvider } from './providers/HoverProvider';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  const sidebar = new SidebarProvider(context);
  vscode.window.registerTreeDataProvider('ultraDexSidebar', sidebar);

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.openContext', async () => {
      const files = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
      if (!files.length) {
        vscode.window.showWarningMessage('CONTEXT.md not found.');
        return;
      }
      const doc = await vscode.workspace.openTextDocument(files[0]);
      await vscode.window.showTextDocument(doc);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.generate', async () => {
      const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      exec('ultra-dex plan', { cwd }, (err, stdout, stderr) => {
        if (err) {
          vscode.window.showErrorMessage(stderr || err.message);
          return;
        }
        vscode.window.showInformationMessage('Ultra-Dex plan generated.');
      });
    })
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: 'file' }, new ContextHoverProvider())
  );
}

export function deactivate() {}

/**
 * Error handler for extension
 * @param {Error} error - Error to handle
 */
function handleExtensionError(error) {
  try {
    console.error('[extension]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
