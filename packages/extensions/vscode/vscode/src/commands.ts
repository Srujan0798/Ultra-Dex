/**
 * @fileoverview Commands module
 * @module src/commands
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runUltraDex(command: string, args: string[] = []) {
  const output = vscode.window.createOutputChannel('Ultra-Dex');
  output.show(true);

  const fullCommand = ['ultra-dex', command, ...args].join(' ');
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  output.appendLine(`$ ${fullCommand}`);

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd,
      env: process.env,
    });

    if (stdout) output.appendLine(stdout);
    if (stderr) output.appendLine(stderr);
  } catch (error) {
    const err = error as Error & { stderr?: string };
    output.appendLine(err.message);
    if (err.stderr) output.appendLine(err.stderr);
    vscode.window.showErrorMessage(`Ultra-Dex command failed: ${command}`);
  }
}

export async function startCommand() {
  await runUltraDex('start');
}

export async function planCommand() {
  await runUltraDex('plan');
}

export async function fixCommand() {
  await runUltraDex('fix');
}
