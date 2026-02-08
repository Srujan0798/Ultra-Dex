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

  // Method to get status items for status bar
  getStatusItems(): StatusItem[] {
    return this.loadStatusItems();
  }

  private loadStatusItems(): StatusItem[] {
    const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspace) {
      return [{ label: 'Workspace', description: 'No folder opened' }];
    }

    // Look for Ultra-Dex project files
    const ultraDexDir = path.join(workspace, '.ultra-dex');
    const contextFile = path.join(workspace, 'CONTEXT.md');
    const planFile = path.join(workspace, 'IMPLEMENTATION_PLAN.md');

    // Check if this is an Ultra-Dex project
    const isUltraDexProject = fs.existsSync(ultraDexDir) || fs.existsSync(contextFile);

    if (!isUltraDexProject) {
      return [
        { label: 'Project', description: 'Not an Ultra-Dex project' },
        { label: 'Health', description: 'N/A' },
        { label: 'Budget', description: 'N/A' },
        { label: 'Tasks', description: 'N/A' },
      ];
    }

    // Try to read project status from state file
    const statePath = path.join(ultraDexDir, 'state.json');
    if (fs.existsSync(statePath)) {
      try {
        const raw = fs.readFileSync(statePath, 'utf8');
        const state = JSON.parse(raw);

        return [
          { label: 'Project', description: 'Active Ultra-Dex project' },
          { label: 'Health', description: state.health || 'Unknown' },
          { label: 'Budget', description: state.budget || 'Not set' },
          { label: 'Tasks', description: state.tasks ? `${state.tasks} remaining` : 'Unknown' },
          { label: 'Last Updated', description: state.lastUpdated || 'Unknown' },
        ];
      } catch (error) {
        return [
          { label: 'Project', description: 'Ultra-Dex project (error reading state)' },
          { label: 'Health', description: 'Error' },
          { label: 'Budget', description: 'Error' },
          { label: 'Tasks', description: 'Error' },
        ];
      }
    } else {
      // If no state file, try to infer status from available files
      const hasPlan = fs.existsSync(planFile);
      const hasContext = fs.existsSync(contextFile);

      return [
        { label: 'Project', description: 'Ultra-Dex project' },
        { label: 'Health', description: 'Initializing...' },
        { label: 'Budget', description: 'Not set' },
        { label: 'Plan', description: hasPlan ? 'Available' : 'Missing' },
        { label: 'Context', description: hasContext ? 'Available' : 'Missing' },
      ];
    }
  }
}

class StatusTreeItem extends vscode.TreeItem {
  constructor(item: StatusItem) {
    super(item.label, vscode.TreeItemCollapsibleState.None);
    this.description = item.description;

    // Set icons based on status
    if (item.description?.toLowerCase().includes('error')) {
      this.iconPath = new vscode.ThemeIcon('error');
    } else if (item.description?.toLowerCase().includes('ok') || item.description?.toLowerCase().includes('active')) {
      this.iconPath = new vscode.ThemeIcon('pass');
    } else if (item.description?.toLowerCase().includes('unknown') || item.description?.toLowerCase().includes('missing')) {
      this.iconPath = new vscode.ThemeIcon('question');
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}
