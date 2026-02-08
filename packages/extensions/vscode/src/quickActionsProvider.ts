import * as vscode from 'vscode';

export class QuickActionsProvider implements vscode.TreeDataProvider<QuickActionItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QuickActionItem | undefined | null | void> =
    new vscode.EventEmitter<QuickActionItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<QuickActionItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private actions = [
    {
      label: 'Generate Implementation Plan',
      command: 'ultra-dex.generatePlan',
      icon: '$(list-ordered)',
      description: 'Create plan from idea',
    },
    {
      label: 'Run Agent Swarm',
      command: 'ultra-dex.runSwarm',
      icon: '$(run-all)',
      description: 'Multi-agent execution',
    },
    {
      label: 'Check Alignment',
      command: 'ultra-dex.checkAlignment',
      icon: '$(check)',
      description: 'Plan vs code analysis',
    },
    {
      label: 'Start Active Kernel',
      command: 'ultra-dex.startKernel',
      icon: '$(server-process)',
      description: 'Start MCP server',
    },
    {
      label: 'Open Dashboard',
      command: 'ultra-dex.openDashboard',
      icon: '$(dashboard)',
      description: 'God Mode UI',
    },
    {
      label: 'Select Agent',
      command: 'ultra-dex.selectAgent',
      icon: '$(robot)',
      description: 'Run single agent',
    },
  ];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QuickActionItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: QuickActionItem): Thenable<QuickActionItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const items = this.actions.map(
      (action) =>
        new QuickActionItem(action.label, action.icon, action.description, {
          command: action.command,
          title: action.label,
          arguments: [],
        })
    );

    return Promise.resolve(items);
  }
}

class QuickActionItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly icon: string,
    public readonly description: string,
    public readonly command: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon(icon.replace('$(', '').replace(')', ''));
    this.description = this.description;
    this.command = command;
    this.contextValue = 'quickAction';
  }
}
