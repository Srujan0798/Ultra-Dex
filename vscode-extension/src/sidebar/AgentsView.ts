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

    // List of agents (hardcoded or scanned)
    const agents = [
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
      return new AgentItem(
        `@${agent.name}`,
        agent.role,
        vscode.TreeItemCollapsibleState.None,
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
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} - ${this.role}`;
    this.description = this.role;
    this.iconPath = new vscode.ThemeIcon('hubot'); 
  }
}
