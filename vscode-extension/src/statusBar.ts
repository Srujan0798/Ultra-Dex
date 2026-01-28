import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function createAlignmentStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ultra-dex.checkAlignment';
    context.subscriptions.push(statusBarItem);
    updateAlignmentStatusBar('Unknown');
    statusBarItem.show();
}

export function updateAlignmentStatusBar(score: string) {
    statusBarItem.text = `$(shield) Alignment: ${score}`;
    statusBarItem.tooltip = 'Ultra-Dex Project Alignment Score';
    if (score === '100%') {
        statusBarItem.color = '#4caf50';
    } else if (score !== 'Unknown') {
        statusBarItem.color = '#ff9800';
    } else {
        statusBarItem.color = undefined;
    }
}
