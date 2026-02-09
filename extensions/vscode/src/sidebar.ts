import * as vscode from 'vscode';

type StatusItem = {
  label: string;
  description?: string;
};

export class StatusProvider implements vscode.TreeDataProvider<StatusItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: StatusItem) {
    const item = new vscode.TreeItem(element.label);
    item.description = element.description;
    item.contextValue = 'statusItem';
    return item;
  }

  getChildren(): StatusItem[] {
    return [
      { label: 'Health', description: 'Green' },
      { label: 'Budget', description: '72% used' },
      { label: 'Tasks', description: '6 active' },
    ];
  }
}
