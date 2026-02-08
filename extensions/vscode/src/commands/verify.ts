import * as vscode from 'vscode';

export async function verifyCommand() {
  const terminal = vscode.window.createTerminal('Ultra-Dex Verification');
  terminal.show();
  terminal.sendText('npx ultra-dex verify');
}
