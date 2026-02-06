import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Agent {
  name: string;
  tier: number;
  description: string;
  filename: string;
}

export class AgentPickerProvider implements vscode.TreeDataProvider<Agent> {
  private _onDidChangeTreeData: vscode.EventEmitter<Agent | undefined | null | void> =
    new vscode.EventEmitter<Agent | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Agent | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private agents: Agent[] = [];

  constructor(private workspaceRoot: string | undefined) {
    this.loadAgents();
  }

  private loadAgents() {
    // Default agents from Ultra-Dex
    this.agents = [
      {
        name: '👔 CTO',
        tier: 0,
        description: 'Strategic technical decisions',
        filename: '01-CTO.md',
      },
      {
        name: '🏗️ Architect',
        tier: 1,
        description: 'System design and patterns',
        filename: '02-ARCHITECT.md',
      },
      {
        name: '🔧 Backend',
        tier: 2,
        description: 'API and server development',
        filename: '03-BACKEND.md',
      },
      {
        name: '🎨 Frontend',
        tier: 2,
        description: 'UI/UX development',
        filename: '04-FRONTEND.md',
      },
      {
        name: '🗄️ Database',
        tier: 2,
        description: 'Data modeling and queries',
        filename: '05-DATABASE.md',
      },
      {
        name: '🔐 Security',
        tier: 1,
        description: 'Security audits and hardening',
        filename: '06-SECURITY.md',
      },
      {
        name: '☁️ DevOps',
        tier: 1,
        description: 'CI/CD and infrastructure',
        filename: '07-DEVOPS.md',
      },
      {
        name: '🧪 QA',
        tier: 2,
        description: 'Testing and quality assurance',
        filename: '08-QA.md',
      },
      { name: '📚 Docs', tier: 2, description: 'Documentation and guides', filename: '09-DOCS.md' },
      {
        name: '🚀 Performance',
        tier: 1,
        description: 'Optimization and profiling',
        filename: '10-PERFORMANCE.md',
      },
      {
        name: '♿ Accessibility',
        tier: 2,
        description: 'A11y compliance',
        filename: '11-ACCESSIBILITY.md',
      },
      { name: '📱 Mobile', tier: 2, description: 'Mobile development', filename: '12-MOBILE.md' },
      { name: '🤖 AI/ML', tier: 1, description: 'AI integrations', filename: '13-AI-ML.md' },
      {
        name: '💳 Payments',
        tier: 1,
        description: 'Payment integrations',
        filename: '14-PAYMENTS.md',
      },
      {
        name: '📊 Analytics',
        tier: 2,
        description: 'Analytics and tracking',
        filename: '15-ANALYTICS.md',
      },
      {
        name: '🔧 Debug',
        tier: 2,
        description: 'Debugging and troubleshooting',
        filename: '16-DEBUG.md',
      },
    ];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Agent): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.name);
    treeItem.description = element.description;
    treeItem.tooltip = `Tier ${element.tier}: ${element.description}`;
    treeItem.contextValue = 'agent';

    // Color by tier
    if (element.tier === 0) {
      treeItem.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.red'));
    } else if (element.tier === 1) {
      treeItem.iconPath = new vscode.ThemeIcon('star', new vscode.ThemeColor('charts.yellow'));
    } else {
      treeItem.iconPath = new vscode.ThemeIcon(
        'circle-filled',
        new vscode.ThemeColor('charts.green')
      );
    }

    treeItem.command = {
      command: 'ultra-dex.selectAgentFromPicker',
      title: 'Select Agent',
      arguments: [element],
    };

    return treeItem;
  }

  getChildren(): Agent[] {
    // Sort by tier (0 first)
    return this.agents.sort((a, b) => a.tier - b.tier);
  }

  async selectAgent(agent: Agent) {
    if (!this.workspaceRoot) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const agentPath = path.join(this.workspaceRoot, 'agents', agent.filename);

    if (fs.existsSync(agentPath)) {
      const content = fs.readFileSync(agentPath, 'utf8');
      await vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(`${agent.name} prompt copied to clipboard!`);
    } else {
      // Show default prompt
      const defaultPrompt = `You are the ${agent.name} agent. ${agent.description}. 

Focus on:
- Best practices for your domain
- Clear, maintainable solutions
- Security and performance considerations

Current context: [Review CONTEXT.md and IMPLEMENTATION-PLAN.md]`;

      await vscode.env.clipboard.writeText(defaultPrompt);
      vscode.window.showInformationMessage(`${agent.name} default prompt copied to clipboard!`);
    }
  }

  async askAgent(agent: Agent, selection: string) {
    const prompt = `@${agent.name} 

Please analyze and help with the following code:

\`\`\`
${selection}
\`\`\`

Focus on ${agent.description.toLowerCase()}.`;

    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage(
      `Ask ${agent.name} prompt ready! Paste into your AI tool.`
    );
  }
}
