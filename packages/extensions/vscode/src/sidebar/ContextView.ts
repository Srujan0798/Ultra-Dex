import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextProvider implements vscode.TreeDataProvider<ContextItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextItem | undefined | null | void> =
    new vscode.EventEmitter<ContextItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ContextItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContextItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ContextItem): Thenable<ContextItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    }

    return Promise.resolve([
      new ContextItem('Project Context', 'CONTEXT.md', vscode.TreeItemCollapsibleState.None),
      new ContextItem(
        'Implementation Plan',
        'IMPLEMENTATION-PLAN.md',
        vscode.TreeItemCollapsibleState.None
      ),
      new ContextItem('Current State', '.ultra/state.json', vscode.TreeItemCollapsibleState.None),
    ]);
  }
}

class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = filePath;
    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [vscode.Uri.file(path.join(vscode.workspace.rootPath || '', filePath))],
    };
    this.iconPath = new vscode.ThemeIcon('file-code');
  }
}
