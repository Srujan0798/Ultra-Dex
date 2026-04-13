/**
 * Dashboard WebView Panel
 * 
 * Embeds the Ultra-Dex dashboard directly in VS Code.
 */

import * as vscode from 'vscode';
import { UltraDexClient, WorkflowStatus } from '../utils/client.js';

export class DashboardPanel {
  public static currentPanel?: DashboardPanel;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, client: UltraDexClient): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'ultraDex.dashboard',
      'Ultra-Dex Dashboard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, client);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    client: UltraDexClient
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getDashboardHtml(client);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'refresh':
            vscode.window.showInformationMessage('Refreshing dashboard...');
            return;
        }
      },
      undefined,
      this.disposables
    );

    // Listen for status updates
    this.disposables.push(
      client.onStatusChange((status: WorkflowStatus) => {
        this.panel.webview.postMessage({
          type: 'status',
          data: status
        });
      })
    );

    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
  }

  private getDashboardHtml(client: UltraDexClient): string {
    const config = vscode.workspace.getConfiguration('ultraDex.server');
    const host = config.get<string>('host', 'localhost');
    const port = config.get<number>('port', 8080);
    const dashboardUrl = `http://${host}:3000`; // Dashboard runs on port 3000

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ultra-Dex Dashboard</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #1e1e1e;
          }
          .dashboard-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .toolbar {
            padding: 10px;
            background: #2d2d2d;
            border-bottom: 1px solid #3d3d3d;
            display: flex;
            gap: 10px;
          }
          button {
            background: #0e639c;
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 3px;
          }
          button:hover {
            background: #1177bb;
          }
          iframe {
            flex: 1;
            border: none;
            width: 100%;
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #888;
            font-size: 18px;
          }
          .error {
            color: #f44336;
            padding: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="dashboard-container">
          <div class="toolbar">
            <button onclick="refresh()">$(refresh) Refresh</button>
            <button onclick="openExternal()">Open in Browser</button>
            <span id="status" style="margin-left: auto; color: #888;">Connecting...</span>
          </div>
          <div id="content" class="loading">
            Loading dashboard...
          </div>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          const dashboardUrl = '${dashboardUrl}';
          
          function refresh() {
            vscode.postMessage({ command: 'refresh' });
            location.reload();
          }
          
          function openExternal() {
            window.open(dashboardUrl, '_blank');
          }
          
          // Try to load the dashboard
          fetch(dashboardUrl, { mode: 'no-cors' })
            .then(() => {
              document.getElementById('content').innerHTML = 
                '<iframe src="' + dashboardUrl + '"></iframe>';
              document.getElementById('status').textContent = 'Connected';
              document.getElementById('status').style.color = '#4caf50';
            })
            .catch(() => {
              document.getElementById('content').innerHTML = 
                '<div class="error">' +
                '<h3>Dashboard Not Running</h3>' +
                '<p>Start the Ultra-Dex dashboard server:</p>' +
                '<code>npm run dashboard</code>' +
                '</div>';
              document.getElementById('status').textContent = 'Disconnected';
              document.getElementById('status').style.color = '#f44336';
            });
          
          // Listen for messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'status') {
              console.log('Workflow status:', message.data);
            }
          });
        </script>
      </body>
      </html>`;
  }

  dispose(): void {
    DashboardPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
