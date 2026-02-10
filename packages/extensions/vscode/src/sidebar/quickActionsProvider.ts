/**
 * @fileoverview QuickActionsProvider module
 * @module sidebar/quickActionsProvider
 */

import * as vscode from 'vscode';

export class QuickActionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const actions = [
      {
        label: 'Generate Plan',
        command: 'ultra-dex.generatePlan',
        icon: 'zap',
        description: 'Create implementation plan',
      },
      {
        label: 'Start Build Mode',
        command: 'ultra-dex.startBuildMode',
        icon: 'tools',
        description: 'Auto-watch and align',
      },
      {
        label: 'Run Agent',
        command: 'ultra-dex.runAgent',
        icon: 'hubot',
        description: 'Execute agent task',
      },
      {
        label: 'Open Dashboard',
        command: 'ultra-dex.openDashboard',
        icon: 'dashboard',
        description: 'Open God Mode Dashboard',
      },
    ];

    return Promise.resolve(
      actions.map((action) => {
        const item = new vscode.TreeItem(action.label, vscode.TreeItemCollapsibleState.None);
        item.command = {
          command: action.command,
          title: action.label,
        };
        item.iconPath = new vscode.ThemeIcon(action.icon);
        item.description = action.description;
        return item;
      })
    );
  }
}

/**
 * Error handler for quickActionsProvider
 * @param {Error} error - Error to handle
 */
function handleQuickActionsProviderError(error) {
  try {
    console.error('[quickActionsProvider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
