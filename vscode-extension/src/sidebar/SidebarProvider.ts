/**
 * @fileoverview SidebarProvider module
 * @module sidebar/SidebarProvider
 */

import * as vscode from 'vscode';

const AGENTS = [
  { id: 'cto', label: 'CTO', icon: '🧠' },
  { id: 'planner', label: 'Planner', icon: '🗺️' },
  { id: 'backend', label: 'Backend', icon: '🧱' },
  { id: 'frontend', label: 'Frontend', icon: '🎨' },
  { id: 'database', label: 'Database', icon: '🗄️' },
  { id: 'reviewer', label: 'Reviewer', icon: '🧪' },
  { id: 'debugger', label: 'Debugger', icon: '🧯' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'devops', label: 'DevOps', icon: '⚙️' },
  { id: 'docs', label: 'Docs', icon: '📚' },
  { id: 'vision', label: 'Vision', icon: '👁️' },
  { id: 'tester', label: 'Tester', icon: '✅' },
  { id: 'architect', label: 'Architect', icon: '🏗️' },
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
  { id: 'sre', label: 'SRE', icon: '📈' },
  { id: 'agent', label: 'Agent', icon: '🤖' },
];

export class SidebarProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<AgentTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh() {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<AgentTreeItem[]> {
    return Promise.resolve(
      AGENTS.map((agent) => new AgentTreeItem(agent.label, agent.icon))
    );
  }
}

class AgentTreeItem extends vscode.TreeItem {
  constructor(label: string, icon: string) {
    super(`${icon} ${label}`, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${label} agent`;
    this.contextValue = 'agent';
  }
}

/**
 * Error handler for SidebarProvider
 * @param {Error} error - Error to handle
 */
function handleSidebarProviderError(error) {
  try {
    console.error('[SidebarProvider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
