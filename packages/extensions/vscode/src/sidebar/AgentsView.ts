/**
 * @fileoverview AgentsView module
 * @module sidebar/AgentsView
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

// All 16 Ultra-Dex agents organized by tier
const ALL_AGENTS = [
  // 0. Meta Orchestration
  {
    name: 'Orchestrator',
    tier: 'Meta',
    description: 'Coordinate all agents for complete features',
    icon: 'hubot',
    file: '0-orchestration/orchestrator.md',
  },
  // 1. Leadership
  {
    name: 'CTO',
    tier: 'Leadership',
    description: 'Architecture & tech stack decisions',
    icon: 'server-process',
    file: '1-leadership/cto.md',
  },
  {
    name: 'Planner',
    tier: 'Leadership',
    description: 'Task breakdown & sprint planning',
    icon: 'list-ordered',
    file: '1-leadership/planner.md',
  },
  {
    name: 'Research',
    tier: 'Leadership',
    description: 'Technology evaluation & comparison',
    icon: 'search',
    file: '1-leadership/research.md',
  },
  // 2. Development
  {
    name: 'Backend',
    tier: 'Development',
    description: 'API & server implementation',
    icon: 'server',
    file: '2-development/backend.md',
  },
  {
    name: 'Database',
    tier: 'Development',
    description: 'Schema design & query optimization',
    icon: 'database',
    file: '2-development/database.md',
  },
  {
    name: 'Frontend',
    tier: 'Development',
    description: 'UI & component implementation',
    icon: 'browser',
    file: '2-development/frontend.md',
  },
  // 3. Security
  {
    name: 'Auth',
    tier: 'Security',
    description: 'Authentication & authorization',
    icon: 'lock',
    file: '3-security/auth.md',
  },
  {
    name: 'Security',
    tier: 'Security',
    description: 'Security audits & vulnerability fixes',
    icon: 'shield',
    file: '3-security/security.md',
  },
  // 4. DevOps
  {
    name: 'DevOps',
    tier: 'DevOps',
    description: 'Deployment & infrastructure',
    icon: 'rocket',
    file: '4-devops/devops.md',
  },
  // 5. Quality
  {
    name: 'Debugger',
    tier: 'Quality',
    description: 'Bug investigation & fixes',
    icon: 'bug',
    file: '5-quality/debugger.md',
  },
  {
    name: 'Documentation',
    tier: 'Quality',
    description: 'Technical writing & docs maintenance',
    icon: 'book',
    file: '5-quality/documentation.md',
  },
  {
    name: 'Reviewer',
    tier: 'Quality',
    description: 'Code review & quality checks',
    icon: 'eye',
    file: '5-quality/reviewer.md',
  },
  {
    name: 'Testing',
    tier: 'Quality',
    description: 'QA & test automation',
    icon: 'beaker',
    file: '5-quality/testing.md',
  },
  // 6. Specialist
  {
    name: 'Performance',
    tier: 'Specialist',
    description: 'Performance optimization',
    icon: 'dashboard',
    file: '6-specialist/performance.md',
  },
  {
    name: 'Refactoring',
    tier: 'Specialist',
    description: 'Code quality & design patterns',
    icon: 'wand',
    file: '6-specialist/refactoring.md',
  },
];

export interface AgentInfo {
  name: string;
  tier: string;
  description: string;
  icon: string;
  file: string;
}

export class AgentsProvider implements vscode.TreeDataProvider<AgentItem | TierItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    AgentItem | TierItem | undefined | null | void
  > = new vscode.EventEmitter<AgentItem | TierItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AgentItem | TierItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AgentItem | TierItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AgentItem | TierItem): Promise<(AgentItem | TierItem)[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No project open');
      return [];
    }

    // If no element, return tier groups
    if (!element) {
      const tiers = [
        'Meta',
        'Leadership',
        'Development',
        'Security',
        'DevOps',
        'Quality',
        'Specialist',
      ];
      return tiers.map((tier) => new TierItem(tier));
    }

    // If tier element, return agents in that tier
    if (element instanceof TierItem) {
      const activeAgents = await this.getActiveAgents();
      const tierAgents = ALL_AGENTS.filter((a) => a.tier === element.tier);
      return tierAgents.map((agent) => {
        const isActive = activeAgents.includes(agent.name.toLowerCase());
        return new AgentItem(agent, isActive, this.workspaceRoot!);
      });
    }

    return [];
  }

  private async getActiveAgents(): Promise<string[]> {
    if (!this.workspaceRoot) return [];
    try {
      const statePath = path.join(this.workspaceRoot, '.ultra', 'state.json');
      const content = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(content);
      if (state.agents && state.agents.active) {
        return state.agents.active;
      }
    } catch {
      // ignore
    }
    return [];
  }

  getAgentByName(name: string): AgentInfo | undefined {
    return ALL_AGENTS.find((a) => a.name.toLowerCase() === name.toLowerCase());
  }
}

class TierItem extends vscode.TreeItem {
  constructor(public readonly tier: string) {
    super(tier, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'tier';
    const tierIcons: Record<string, string> = {
      Meta: 'symbol-misc',
      Leadership: 'organization',
      Development: 'code',
      Security: 'shield',
      DevOps: 'rocket',
      Quality: 'verified',
      Specialist: 'sparkle',
    };
    this.iconPath = new vscode.ThemeIcon(tierIcons[tier] || 'folder');
  }
}

export class AgentItem extends vscode.TreeItem {
  public readonly agentInfo: AgentInfo;

  constructor(agent: AgentInfo, isActive: boolean, workspaceRoot: string) {
    super(`@${agent.name}`, vscode.TreeItemCollapsibleState.None);
    this.agentInfo = agent;
    this.tooltip = `${agent.name}: ${agent.description}`;
    this.description = isActive ? '● Active' : agent.description;
    this.contextValue = 'agent';

    // Set icon with active color
    const iconColor = isActive ? new vscode.ThemeColor('charts.green') : undefined;
    this.iconPath = new vscode.ThemeIcon(agent.icon, iconColor);

    // Click to copy prompt
    this.command = {
      command: 'ultra-dex.copyAgentPrompt',
      title: 'Copy Agent Prompt',
      arguments: [agent, workspaceRoot],
    };
  }
}

export { ALL_AGENTS };
