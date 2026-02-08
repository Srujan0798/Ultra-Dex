import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { StatusProvider } from './sidebar';

export function activate(context: vscode.ExtensionContext) {
  const statusProvider = new StatusProvider();
  vscode.window.registerTreeDataProvider('ultraDexStatus', statusProvider);

  registerCommands(context, statusProvider);
}

export function deactivate() {}
