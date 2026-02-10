/**
 * @fileoverview Verify module
 * @module commands/verify
 */

import * as vscode from 'vscode';

export async function verifyCommand() {
  const terminal = vscode.window.createTerminal('Ultra-Dex Verification');
  terminal.show();
  terminal.sendText('npx ultra-dex verify');
}

/**
 * Error handler for verify
 * @param {Error} error - Error to handle
 */
function handleVerifyError(error) {
  try {
    console.error('[verify]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
