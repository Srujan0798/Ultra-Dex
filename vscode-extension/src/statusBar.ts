import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';

const exec = util.promisify(cp.exec);

let statusBarItem: vscode.StatusBarItem;

export function createAlignmentStatusBar(): vscode.StatusBarItem {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ultra-dex.checkAlignment';
    updateAlignmentStatusBar('Unknown');
    statusBarItem.show();
    return statusBarItem;
}

export function updateAlignmentStatusBar(score: string | number) {
    const scoreStr = typeof score === 'number' ? `${score}%` : score;
    statusBarItem.text = `$(shield) Alignment: ${scoreStr}`;
    statusBarItem.tooltip = 'Ultra-Dex Project Alignment Score - Click to refresh';
    
    if (typeof score === 'number') {
        if (score >= 80) {
            statusBarItem.color = '#4caf50'; // Green
        } else if (score >= 50) {
            statusBarItem.color = '#ff9800'; // Orange
        } else {
            statusBarItem.color = '#f44336'; // Red
        }
    } else if (score === '100%') {
        statusBarItem.color = '#4caf50';
    } else if (score !== 'Unknown') {
        statusBarItem.color = '#ff9800';
    } else {
        statusBarItem.color = undefined;
    }
}

export async function refreshAlignmentStatusBar(statusBar: vscode.StatusBarItem) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspaceRoot) return;

        const { stdout } = await exec('npx ultra-dex align --json', {
            cwd: workspaceRoot,
            timeout: 30000
        });
        
        const result = JSON.parse(stdout);
        const score = result.score || 0;
        
        updateAlignmentStatusBar(score);
    } catch (error) {
        // Silently fail - don't spam user with errors on auto-refresh
        console.error('Failed to refresh alignment:', error);
    }
}
