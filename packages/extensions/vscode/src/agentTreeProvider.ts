/**
 * @fileoverview AgentTreeProvider module
 * @module src/agentTreeProvider
 */

import * as path from 'path';
import * as vscode from 'vscode';

export interface AgentItem {
  name: string;
  tier: string;
  description: string;
  filePath: string;
  status?: string;
}

const TIER_LABELS: Record<string, string> = {
  '0-orchestration': '0. Meta Orchestration',
  '1-leadership': '1. Leadership',
  '2-development': '2. Development',
  '3-security': '3. Security',
  '4-devops': '4. DevOps',
  '5-quality': '5. Quality',
  '6-specialist': '6. Specialist',
};

export class AgentTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private agentStatuses: Map<string, string> = new Map();

  constructor(private readonly workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateAgentStatus(agentName: string, status: string): void {
    this.agentStatuses.set(agentName, status);
    this.refresh();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve(this.getTierItems());
    }

    if (element.contextValue?.startsWith('tier:')) {
      const tier = element.contextValue.replace('tier:', '');
      return this.getAgentItems(tier);
    }

    return Promise.resolve([]);
  }

  private getTierItems(): vscode.TreeItem[] {
    return Object.entries(TIER_LABELS).map(([tierKey, label]) => {
      const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = `tier:${tierKey}`;
      return item;
    });
  }

  private async getAgentItems(tierKey: string): Promise<vscode.TreeItem[]> {
    const agentIndex = await loadAgentIndex(this.workspaceRoot);
    const agents = agentIndex.filter((agent) => agent.tier === tierKey);
    return agents.map((agent) => {
      const status = this.agentStatuses.get(agent.name);
      const label = status ? `${agent.name} (${status})` : agent.name;

      const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
      item.description = agent.description;
      item.command = {
        command: 'ultra-dex.selectAgent',
        title: 'Select Agent',
        arguments: [agent],
      };
      item.contextValue = 'agent';

      // Set icon based on status
      if (status === 'working') {
        item.iconPath = new vscode.ThemeIcon('sync~spin');
      } else if (status === 'completed') {
        item.iconPath = new vscode.ThemeIcon('check');
      } else if (status === 'error') {
        item.iconPath = new vscode.ThemeIcon('error');
      } else {
        item.iconPath = this.workspaceRoot ? getTierIcon(this.workspaceRoot, tierKey) : undefined;
      }

      return item;
    });
  }
}

export async function loadAgentIndex(workspaceRoot?: string): Promise<AgentItem[]> {
  if (!workspaceRoot) {
    return [];
  }

  const indexPath = path.join(workspaceRoot, 'agents', '00-AGENT_INDEX.md');
  const fileUri = vscode.Uri.file(indexPath);
  let content = '';
  try {
    const data = await vscode.workspace.fs.readFile(fileUri);
    content = Buffer.from(data).toString('utf8');
  } catch {
    return [];
  }

  const rows = content.split('\n').filter((line) => line.trim().startsWith('| **@'));
  return rows
    .map((row) => {
      const parts = row
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
      const name = parts[0]?.replace('**', '').replace('**', '') ?? '';
      const description = parts[1] ?? '';
      const file = parts[3]?.replace('[', '').split('](')[1]?.replace(')', '') ?? '';
      const tier = file.split('/')[1] ?? 'unknown';
      return {
        name,
        description,
        tier,
        filePath: file,
      };
    })
    .filter((agent) => agent.name && agent.filePath);
}

function getTierIcon(
  workspaceRoot: string,
  tierKey: string
): { light: vscode.Uri; dark: vscode.Uri } {
  const iconPath = path.join(
    workspaceRoot,
    'vscode-extension',
    'resources',
    'icons',
    `${tierKey}.svg`
  );
  return { light: vscode.Uri.file(iconPath), dark: vscode.Uri.file(iconPath) };
}
