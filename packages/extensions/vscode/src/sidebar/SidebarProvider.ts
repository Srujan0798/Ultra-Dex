/**
 * @fileoverview SidebarProvider module
 * @module sidebar/SidebarProvider
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const AGENTS = [
  { id: 'planner', name: 'Planner', icon: '🧭' },
  { id: 'cto', name: 'CTO', icon: '🏗️' },
  { id: 'backend', name: 'Backend', icon: '⚙️' },
  { id: 'frontend', name: 'Frontend', icon: '🎨' },
  { id: 'database', name: 'Database', icon: '🗄️' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'devops', name: 'DevOps', icon: '☁️' },
  { id: 'testing', name: 'Testing', icon: '🧪' },
  { id: 'reviewer', name: 'Reviewer', icon: '🔍' },
  { id: 'debugger', name: 'Debugger', icon: '🐞' },
  { id: 'documentation', name: 'Docs', icon: '📚' },
  { id: 'performance', name: 'Performance', icon: '⚡' },
  { id: 'refactoring', name: 'Refactor', icon: '🧹' },
  { id: 'auth', name: 'Auth', icon: '🔐' },
  { id: 'research', name: 'Research', icon: '🧠' },
  { id: 'meta-orchestrator', name: 'Meta', icon: '🛰️' },
];

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ultra-dex.sidebar';

  constructor(private readonly rootPath: string | undefined) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: this.rootPath ? [vscode.Uri.file(this.rootPath)] : [],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'copyPrompt':
          await this.copyPrompt(message.agentId);
          return;
        case 'runCommand':
          await vscode.commands.executeCommand(message.command);
          return;
      }
    });
  }

  private async copyPrompt(agentId: string) {
    if (!this.rootPath) {
      vscode.window.showWarningMessage('Open a workspace to copy agent prompts.');
      return;
    }

    const candidate = path.join(this.rootPath, 'agents', `${agentId}.md`);
    let content = '';

    if (fs.existsSync(candidate)) {
      content = fs.readFileSync(candidate, 'utf8');
    } else {
      content = `You are the @${agentId} agent. Focus on your specialty and follow CONTEXT.md + IMPLEMENTATION-PLAN.md.`;
    }

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(`Copied ${agentId} prompt to clipboard.`);
  }

  private getAlignmentScore() {
    if (!this.rootPath) return 'n/a';
    const statePath = path.join(this.rootPath, '.ultra-dex', 'state.json');
    if (!fs.existsSync(statePath)) return 'n/a';
    try {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return data.alignmentScore ?? data.score ?? 'n/a';
    } catch {
      return 'n/a';
    }
  }

  private getContextPreview() {
    if (!this.rootPath) return 'No workspace open';
    const contextPath = path.join(this.rootPath, 'CONTEXT.md');
    if (!fs.existsSync(contextPath)) return 'CONTEXT.md not found';
    try {
      const content = fs.readFileSync(contextPath, 'utf8');
      return content.substring(0, 500) + (content.length > 500 ? '...' : '');
    } catch {
      return 'Error reading CONTEXT.md';
    }
  }

  private getHtml(webview: vscode.Webview) {
    const alignmentScore = this.getAlignmentScore();
    const contextPreview = this.getContextPreview();
    const agentsHtml = AGENTS.map(
      (agent) => `
      <li>
        <button data-agent="${agent.id}" class="agent-btn">${agent.icon} ${agent.name}</button>
      </li>
    `
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: sans-serif; padding: 12px; color: #e2e8f0; background: #0f172a; }
      h2 { margin-top: 0; }
      .score { padding: 8px 12px; background: #1e293b; border-radius: 8px; margin-bottom: 12px; }
      .context-box { padding: 8px; background: #1e293b; border-radius: 6px; font-size: 11px; margin-bottom: 12px; white-space: pre-wrap; max-height: 150px; overflow: hidden; }
      ul { list-style: none; padding: 0; margin: 0; }
      .agent-btn { width: 100%; text-align: left; margin: 4px 0; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #111827; color: #e2e8f0; cursor: pointer; }
      .agent-btn:hover { background: #1f2937; }
      .actions { margin-top: 12px; display: grid; gap: 8px; }
      .action-btn { padding: 8px; border-radius: 6px; background: #2563eb; color: #fff; border: none; cursor: pointer; }
      .action-btn.secondary { background: #64748b; }
    </style>
  </head>
  <body>
    <h2>Ultra-Dex Sidebar</h2>
    <div class="score">Alignment Score: <strong>${alignmentScore}</strong></div>
    
    <h3>Context Preview</h3>
    <div class="context-box">${contextPreview}</div>

    <h3>Agents</h3>
    <ul>${agentsHtml}</ul>
    
    <div class="actions">
      <button class="action-btn" data-command="ultra-dex.generatePlan">Generate</button>
      <button class="action-btn" data-command="ultra-dex.checkPlan">Validate Plan</button>
      <button class="action-btn" data-command="ultra-dex.runSwarm">Run Swarm</button>
      <button class="action-btn secondary" data-command="ultra-dex.reviewCode">Review</button>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      document.querySelectorAll('.agent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          vscode.postMessage({ type: 'copyPrompt', agentId: btn.dataset.agent });
        });
      });
      document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          vscode.postMessage({ type: 'runCommand', command: btn.dataset.command });
        });
      });
    </script>
  </body>
</html>`;
  }
}
