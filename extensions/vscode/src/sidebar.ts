import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type StatusItem = {
  label: string;
  description?: string;
  icon?: string;
};

export class StatusProvider implements vscode.TreeDataProvider<StatusTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StatusTreeItem | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: StatusTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<StatusTreeItem[]> {
    const items = this.loadStatusItems();
    return Promise.resolve(items.map((item) => new StatusTreeItem(item)));
  }

  private loadStatusItems(): StatusItem[] {
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspace) {
      return [{ label: 'No workspace open', description: 'Open a folder to see status' }];
    }

    const statePath = path.join(workspace, '.ultra-dex', 'state.json');
    if (!fs.existsSync(statePath)) {
      return [
        { label: 'Health', description: 'Unknown' },
        { label: 'Budget', description: 'Unknown' },
        { label: 'Tasks', description: 'Unknown' },
      ];
    }

    try {
      const raw = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(raw);

      return [
        { label: 'Health', description: state.health || 'OK' },
        { label: 'Budget', description: state.budget || 'Not set' },
        { label: 'Tasks', description: state.tasks || 'None' },
      ];
    } catch {
      return [
        { label: 'Health', description: 'Invalid state.json' },
        { label: 'Budget', description: 'Invalid state.json' },
        { label: 'Tasks', description: 'Invalid state.json' },
      ];
    }
  }
}

class StatusTreeItem extends vscode.TreeItem {
  constructor(item: StatusItem) {
    super(item.label, vscode.TreeItemCollapsibleState.None);
    this.description = item.description;
  }
}
