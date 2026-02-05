import * as vscode from 'vscode';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'ultraDexDashboard',
            'Ultra-Dex Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getHtmlContent();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'selectAgent':
                        vscode.commands.executeCommand('ultra-dex.selectAgent');
                        return;
                    case 'runSwarm':
                        vscode.commands.executeCommand('ultra-dex.runSwarm');
                        return;
                    case 'refresh':
                        this._panel.webview.html = this._getHtmlContent();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultra-Dex Dashboard</title>
  <style>
    :root {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --accent: #8b5cf6;
      --text: #e4e4e7;
      --text-muted: #71717a;
      --border: #27272a;
      --success: #22c55e;
      --warning: #f59e0b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-primary);
      color: var(--text);
      padding: 20px;
      min-height: 100vh;
    }
    h1 { font-size: 24px; margin-bottom: 20px; }
    h2 { font-size: 18px; color: var(--text-muted); margin-bottom: 16px; }
    
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .card-title { color: var(--text-muted); font-size: 12px; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: bold; }
    .card-value.success { color: var(--success); }
    .card-value.warning { color: var(--warning); }
    .card-value.accent { color: var(--accent); }
    
    .agents-list { margin-bottom: 24px; }
    .agent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .agent-name { font-weight: 500; }
    .agent-tier {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--accent);
      opacity: 0.8;
    }
    .agent-tier.tier-0 { background: #ef4444; }
    .agent-tier.tier-1 { background: #f59e0b; }
    .agent-tier.tier-2 { background: #22c55e; }
    
    .actions { display: flex; gap: 12px; margin-top: 24px; }
    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary { background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text); }
    .btn-secondary:hover { background: var(--border); }
  </style>
</head>
<body>
  <h1>🚀 Ultra-Dex Dashboard</h1>
  
  <div class="grid">
    <div class="card">
      <div class="card-title">Active Agents</div>
      <div class="card-value accent">18</div>
    </div>
    <div class="card">
      <div class="card-title">Tasks Completed</div>
      <div class="card-value success">247</div>
    </div>
    <div class="card">
      <div class="card-title">Token Usage (Today)</div>
      <div class="card-value warning">12.4K</div>
    </div>
  </div>
  
  <h2>Available Agents</h2>
  <div class="agents-list">
    <div class="agent-item">
      <span class="agent-name">🎯 Architect</span>
      <span class="agent-tier tier-1">Tier 1</span>
    </div>
    <div class="agent-item">
      <span class="agent-name">💻 Developer</span>
      <span class="agent-tier tier-2">Tier 2</span>
    </div>
    <div class="agent-item">
      <span class="agent-name">🔍 Reviewer</span>
      <span class="agent-tier tier-2">Tier 2</span>
    </div>
    <div class="agent-item">
      <span class="agent-name">🛡️ Security</span>
      <span class="agent-tier tier-1">Tier 1</span>
    </div>
    <div class="agent-item">
      <span class="agent-name">🧪 Tester</span>
      <span class="agent-tier tier-2">Tier 2</span>
    </div>
    <div class="agent-item">
      <span class="agent-name">🚀 Optimizer</span>
      <span class="agent-tier tier-0">Tier 0</span>
    </div>
  </div>
  
  <div class="actions">
    <button class="btn-primary" onclick="selectAgent()">Select Agent</button>
    <button class="btn-secondary" onclick="runSwarm()">Run Swarm</button>
    <button class="btn-secondary" onclick="refresh()">Refresh</button>
  </div>
  
  <script>
    const vscode = acquireVsCodeApi();
    function selectAgent() { vscode.postMessage({ command: 'selectAgent' }); }
    function runSwarm() { vscode.postMessage({ command: 'runSwarm' }); }
    function refresh() { vscode.postMessage({ command: 'refresh' }); }
  </script>
</body>
</html>`;
    }
}
