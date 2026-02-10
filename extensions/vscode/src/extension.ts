/**
 * @fileoverview Extension module
 * @module src/extension
 */

import * as vscode from 'vscode';
import { fixCommand, planCommand, startCommand } from './commands';
import { StatusProvider } from './sidebar';

export function activate(context: vscode.ExtensionContext) {
  const statusProvider = new StatusProvider();

  context.subscriptions.push(
    vscode.commands.registerCommand('ultraDex.start', startCommand),
    vscode.commands.registerCommand('ultra-dex.start', startCommand),
    vscode.commands.registerCommand('ultraDex.plan', planCommand),
    vscode.commands.registerCommand('ultra-dex.plan', planCommand),
    vscode.commands.registerCommand('ultraDex.fix', fixCommand),
    vscode.commands.registerCommand('ultra-dex.fix', fixCommand),
    vscode.commands.registerCommand('ultraDex.openStatus', () => {
      vscode.commands.executeCommand('workbench.view.extension.ultraDex');
    }),
    vscode.commands.registerCommand('ultra-dex.openStatus', () => {
      vscode.commands.executeCommand('workbench.view.extension.ultraDex');
    }),
    vscode.window.registerTreeDataProvider('ultraDex.status', statusProvider)
  );
}

export function deactivate() {
  // no-op
}

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
