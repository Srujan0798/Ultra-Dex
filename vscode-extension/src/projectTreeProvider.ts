import * as vscode from 'vscode';

const KERNEL_URL = 'http://localhost:3001';

export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private state: any = null;

  constructor() {
      // Auto-refresh every 10 seconds if possible
      setInterval(() => this.refresh(), 10000);
  }

  async refresh(): Promise<void> {
    try {
        const res = await fetch(`${KERNEL_URL}/api/state`);
        if (res.ok) {
            this.state = await res.json();
            this._onDidChangeTreeData.fire();
        }
    } catch {
        // Kernel offline
    }
  }

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ProjectItem): Thenable<ProjectItem[]> {
    if (!this.state) {
      return Promise.resolve([new ProjectItem("Kernel Offline", "Start 'ultra-dex serve'", vscode.TreeItemCollapsibleState.None)]);
    }

    if (!element) {
      // Root level: Phases
      return Promise.resolve(this.state.phases.map((phase: any) => {
          const completed = phase.steps.filter((s: any) => s.status === 'completed').length;
          const total = phase.steps.length;
          return new ProjectItem(
              phase.name,
              `${completed}/${total} steps`,
              vscode.TreeItemCollapsibleState.Collapsed,
              'phase',
              phase.status
          );
      }));
    }

    if (element.contextValue === 'phase') {
        const phase = this.state.phases.find((p: any) => p.name === element.label);
        if (phase) {
            return Promise.resolve(phase.steps.map((step: any) => {
                return new ProjectItem(
                    step.task,
                    step.id,
                    vscode.TreeItemCollapsibleState.None,
                    'step',
                    step.status
                );
            }));
        }
    }

    return Promise.resolve([]);
  }
}

class ProjectItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly subLabel: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string = 'item',
    public readonly status?: string
  ) {
    super(label, collapsibleState);
    this.description = subLabel;
    this.tooltip = `${this.label} (${status})`;
    
    if (status === 'completed') {
        this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('debugIcon.stepOverForeground'));
    } else if (status === 'in_progress') {
        this.iconPath = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.cyan'));
    } else {
        this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('descriptionForeground'));
    }
  }
}
