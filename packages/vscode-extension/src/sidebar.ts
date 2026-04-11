import * as vscode from 'vscode';
import type { CLIBridge } from './cli-bridge';

export class UltraDexSidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly cliBridge: CLIBridge
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === 'refresh-agents') {
        const agents = await this.cliBridge.getAgents();
        webviewView.webview.postMessage({ type: 'agents', payload: agents });
      }
    });
  }

  postMessage(message: unknown): Thenable<boolean> | undefined {
    return this.view?.webview.postMessage(message);
  }

  private getHtml(): string {
    return `<!doctype html>
<html>
  <body>
    <h3>Ultra-Dex</h3>
    <button id="refresh">Refresh agents</button>
    <pre id="output">Ready</pre>
    <script>
      const vscode = acquireVsCodeApi();
      const output = document.getElementById('output');
      document.getElementById('refresh').addEventListener('click', () => {
        vscode.postMessage({ type: 'refresh-agents' });
      });
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'agents') {
          output.textContent = JSON.stringify(event.data.payload, null, 2);
        }
      });
    </script>
  </body>
</html>`;
  }
}

