import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class AgentsProvider implements vscode.TreeDataProvider<AgentItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<AgentItem | undefined | null | void> = new vscode.EventEmitter<AgentItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AgentItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AgentItem): Thenable<AgentItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No project open');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve([]);
    }

    // Try to read state
    let activeAgents: string[] = [];
    try {
        const statePath = path.join(this.workspaceRoot, '.ultra', 'state.json');
        if (fs.existsSync(statePath)) {
            const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            if (state.agents && state.agents.active) {
                activeAgents = state.agents.active;
            }
        }
    } catch (e) {
        // ignore
    }

    // List of agents
    const agents = [
      { name: 'Orchestrator', role: 'Meta-Layer', icon: 'hubot' },
      { name: 'Planner', role: 'Leadership', icon: 'list-unordered' },
      { name: 'CTO', role: 'Leadership', icon: 'server-process' },
      { name: 'Backend', role: 'Development', icon: 'server' },
      { name: 'Frontend', role: 'Development', icon: 'layout' },
      { name: 'Database', role: 'Development', icon: 'database' },
      { name: 'Auth', role: 'Security', icon: 'lock' },
      { name: 'Security', role: 'Security', icon: 'shield' },
      { name: 'Testing', role: 'Quality', icon: 'beaker' },
      { name: 'Reviewer', role: 'Quality', icon: 'eye' },
      { name: 'DevOps', role: 'DevOps', icon: 'rocket' }
    ];

    return Promise.resolve(agents.map(agent => {
      const isActive = activeAgents.includes(agent.name.toLowerCase());
      return new AgentItem(
        `@${agent.name}`,
        agent.role,
        isActive ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None,
        isActive,
        {
          command: 'ultra-dex.selectAgent',
          title: 'Select Agent',
          arguments: [agent.name.toLowerCase()]
        }
      );
    }));
  }
}

class AgentItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private role: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    private isActive: boolean,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} - ${this.role}`;
    this.description = this.isActive ? `${this.role} (Active)` : this.role;
    // Use built-in icons, highlight if active
    this.iconPath = new vscode.ThemeIcon(this.isActive ? 'pulse' : 'circle-filled', this.isActive ? new vscode.ThemeColor('charts.green') : undefined);
  }
}
