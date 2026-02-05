/**
 * Context Panel Provider
 * Inline editing and preview of CONTEXT.md
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ContextPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ultra-dex.contextPanel';
    private _view?: vscode.WebviewView;
    private contextPath: string;
    private disposables: vscode.Disposable[] = [];

    constructor(workspaceRoot: string | undefined) {
        this.contextPath = workspaceRoot ? path.join(workspaceRoot, 'CONTEXT.md') : '';
        
        if (workspaceRoot) {
            const watcher = vscode.workspace.createFileSystemWatcher('**/CONTEXT.md');
            watcher.onDidChange(() => this.refresh());
            watcher.onDidCreate(() => this.refresh());
            this.disposables.push(watcher);
        }
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        await this.saveContext(message.text);
                        break;
                    case 'refresh':
                        this.refresh();
                        break;
                    case 'check':
                        await this.runAlignmentCheck();
                        break;
                }
            },
            undefined,
            this.disposables
        );

        this.refresh();
    }

    public refresh() {
        if (this._view) {
            const content = this.loadContextContent();
            this._view.webview.postMessage({ command: 'update', content });
        }
    }

    private loadContextContent(): string {
        if (!fs.existsSync(this.contextPath)) {
            return '# CONTEXT.md not found';
        }
        
        try {
            return fs.readFileSync(this.contextPath, 'utf8');
        } catch (error) {
            return '# Error loading CONTEXT.md';
        }
    }

    private async saveContext(content: string) {
        try {
            fs.writeFileSync(this.contextPath, content);
            vscode.window.showInformationMessage('CONTEXT.md saved');
            await this.runAlignmentCheck();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to save: ${error.message}`);
        }
    }

    private async runAlignmentCheck() {
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            const { stdout } = await execAsync('npx ultra-dex align --json', {
                cwd: path.dirname(this.contextPath),
                timeout: 30000
            });

            const result = JSON.parse(stdout);
            
            if (this._view) {
                this._view.webview.postMessage({ 
                    command: 'alignment', 
                    score: result.score || 0 
                });
            }
        } catch (error) {
            console.error('Alignment check failed:', error);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const htmlParts = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<meta charset="UTF-8">',
            '<style>',
            'body{font-family:var(--vscode-font-family);padding:10px;margin:0;}',
            '.toolbar{display:flex;gap:8px;margin-bottom:10px;}',
            'button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:6px 12px;cursor:pointer;}',
            'textarea{width:100%;height:calc(100vh - 100px);background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);font-family:monospace;padding:10px;}',
            '.score{padding:4px 8px;border-radius:3px;font-weight:bold;margin-left:auto;}',
            '.score.high{background:#22c55e20;color:#22c55e;}',
            '.score.medium{background:#eab30820;color:#eab308;}',
            '.score.low{background:#ef444420;color:#ef4444;}',
            '</style>',
            '</head>',
            '<body>',
            '<div class="toolbar">',
            '<button onclick="save()">Save</button>',
            '<button onclick="refresh()">Refresh</button>',
            '<button onclick="check()">Check</button>',
            '<span id="score" class="score" style="display:none"></span>',
            '</div>',
            '<textarea id="editor"></textarea>',
            '<script>',
            'const vscode = acquireVsCodeApi();',
            'window.addEventListener("message", event => {',
            '  const msg = event.data;',
            '  if (msg.command === "update") {',
            '    document.getElementById("editor").value = msg.content;',
            '  }',
            '  if (msg.command === "alignment") {',
            '    const el = document.getElementById("score");',
            '    el.style.display = "inline-flex";',
            '    el.textContent = "Score: " + msg.score + "%";',
            '    el.className = "score " + (msg.score >= 80 ? "high" : msg.score >= 50 ? "medium" : "low");',
            '  }',
            '});',
            'function save() { vscode.postMessage({command:"save",text:document.getElementById("editor").value}); }',
            'function refresh() { vscode.postMessage({command:"refresh"}); }',
            'function check() { vscode.postMessage({command:"check"}); }',
            'document.getElementById("editor").addEventListener("keydown", e => {',
            '  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); }',
            '});',
            '</script>',
            '</body>',
            '</html>'
        ];
        return htmlParts.join('');
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
