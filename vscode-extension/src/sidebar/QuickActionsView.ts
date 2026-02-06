import * as vscode from 'vscode';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  command: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Generate Plan',
    description: 'Create implementation plan with @Planner',
    icon: 'list-ordered',
    command: 'ultra-dex.generatePlan',
  },
  {
    label: 'Start Build Mode',
    description: 'Begin implementation workflow',
    icon: 'tools',
    command: 'ultra-dex.startBuildMode',
  },
  {
    label: 'Run Agent',
    description: 'Select and run an agent',
    icon: 'run',
    command: 'ultra-dex.runAgent',
  },
  {
    label: 'Code Review',
    description: 'Run @Reviewer on changes',
    icon: 'eye',
    command: 'ultra-dex.runAgent',
  },
  {
    label: 'Open Dashboard',
    description: 'View project dashboard',
    icon: 'dashboard',
    command: 'ultra-dex.openDashboard',
  },
  {
    label: 'Verify Checklist',
    description: 'Run 21-step verification',
    icon: 'checklist',
    command: 'ultra-dex.verify',
  },
];

export class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> =
    new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QuickActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<QuickActionItem[]> {
    return Promise.resolve(QUICK_ACTIONS.map((action) => new QuickActionItem(action)));
  }
}

class QuickActionItem extends vscode.TreeItem {
  constructor(action: QuickAction) {
    super(action.label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = action.description;
    this.description = '';
    this.iconPath = new vscode.ThemeIcon(action.icon);
    this.command = {
      command: action.command,
      title: action.label,
      arguments:
        action.command === 'ultra-dex.runAgent' && action.label === 'Code Review'
          ? ['reviewer']
          : [],
    };
  }
}
