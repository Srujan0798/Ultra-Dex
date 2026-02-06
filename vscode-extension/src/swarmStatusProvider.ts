import * as vscode from 'vscode';

export class SwarmStatusProvider implements vscode.TreeDataProvider<SwarmItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SwarmItem | undefined | null | void> =
    new vscode.EventEmitter<SwarmItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SwarmItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private swarmStatus: any = {
    status: 'idle',
    agents: [],
    progress: 0,
    objective: null,
  };

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateStatus(data: any): void {
    if (data.type === 'swarm_update') {
      this.swarmStatus = { ...this.swarmStatus, ...data.data };
    } else if (data.agent) {
      // Update individual agent status
      const existingAgent = this.swarmStatus.agents.find((a: any) => a.name === data.agent);
      if (existingAgent) {
        existingAgent.status = data.status;
        existingAgent.activity = data.activity;
      } else {
        this.swarmStatus.agents.push({
          name: data.agent,
          status: data.status,
          activity: data.activity || 'Waiting...',
        });
      }
    }
    this.refresh();
  }

  updateSwarmStatus(status: any): void {
    this.swarmStatus = { ...this.swarmStatus, ...status };
    this.refresh();
  }

  getTreeItem(element: SwarmItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SwarmItem): Thenable<SwarmItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const items: SwarmItem[] = [];

    // Overall status
    const statusItem = new SwarmItem(
      `Status: ${this.swarmStatus.status.toUpperCase()}`,
      this.swarmStatus.status === 'running'
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
      {
        command: 'ultra-dex.openDashboard',
        title: 'Open Dashboard',
        arguments: [],
      },
      this.getStatusIcon(this.swarmStatus.status)
    );
    items.push(statusItem);

    // Progress
    if (this.swarmStatus.progress > 0) {
      const progressItem = new SwarmItem(
        `Progress: ${this.swarmStatus.progress}%`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        'progress'
      );
      items.push(progressItem);
    }

    // Objective
    if (this.swarmStatus.objective) {
      const objectiveItem = new SwarmItem(
        `Objective: ${this.swarmStatus.objective.substring(0, 40)}...`,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        'objective'
      );
      items.push(objectiveItem);
    }

    // Active agents
    if (this.swarmStatus.agents.length > 0) {
      items.push(
        new SwarmItem(
          'Active Agents',
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          'agents'
        )
      );

      for (const agent of this.swarmStatus.agents) {
        const agentItem = new SwarmItem(
          `${agent.name}: ${agent.status}`,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          this.getAgentIcon(agent.status)
        );
        agentItem.tooltip = agent.activity;
        items.push(agentItem);
      }
    }

    return Promise.resolve(items);
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'running':
        return '$(play-circle)';
      case 'completed':
        return '$(check-circle)';
      case 'error':
        return '$(error)';
      case 'idle':
        return '$(circle-outline)';
      default:
        return '$(circle-outline)';
    }
  }

  private getAgentIcon(status: string): string {
    switch (status) {
      case 'working':
        return '$(sync~spin)';
      case 'completed':
        return '$(check)';
      case 'error':
        return '$(x)';
      case 'idle':
        return '$(circle-small)';
      default:
        return '$(circle-small)';
    }
  }
}

class SwarmItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly icon?: string
  ) {
    super(label, collapsibleState);

    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon.replace('$(', '').replace(')', ''));
    }

    this.contextValue = 'swarmItem';
  }
}
