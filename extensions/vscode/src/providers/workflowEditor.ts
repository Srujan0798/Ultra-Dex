/**
 * Custom Workflow Editor Provider
 * 
 * Provides a visual editor for .dex workflow files alongside the YAML text editor.
 */

import * as vscode from 'vscode';
import * as yaml from 'yaml';

export class WorkflowEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'ultraDex.workflowEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

    // Update webview when document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(webviewPanel.webview, document);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'nodeSelected':
          vscode.window.showInformationMessage(`Selected node: ${message.nodeId}`);
          return;
        case 'runWorkflow':
          vscode.commands.executeCommand('ultraDex.runWorkflow', document.uri);
          return;
      }
    });
  }

  private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
    const workflow = this.parseWorkflow(document.getText());
    webview.postMessage({
      type: 'update',
      workflow
    });
  }

  private parseWorkflow(text: string): unknown {
    try {
      return yaml.parse(text);
    } catch {
      return null;
    }
  }

  private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
    const workflow = this.parseWorkflow(document.getText());
    const workflowJson = JSON.stringify(workflow);

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workflow Editor</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
          }
          .workflow-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .toolbar {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
          }
          button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            border-radius: 2px;
          }
          button:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .workflow-graph {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 20px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            min-height: 400px;
          }
          .node {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .node:hover {
            border-color: var(--vscode-focusBorder);
          }
          .node.selected {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
          }
          .node-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          .node-icon.agent { background: #4caf50; }
          .node-icon.decision { background: #ff9800; }
          .node-icon.action { background: #2196f3; }
          .node-info {
            flex: 1;
          }
          .node-name {
            font-weight: 500;
            margin-bottom: 2px;
          }
          .node-type {
            font-size: 12px;
            opacity: 0.7;
          }
          .properties {
            padding: 16px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
          }
          .properties h3 {
            margin-top: 0;
          }
          .property-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
          .property-row:last-child {
            border-bottom: none;
          }
          .empty-state {
            text-align: center;
            padding: 40px;
            opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <div class="workflow-container">
          <div class="toolbar">
            <button onclick="runWorkflow()">$(play) Run</button>
            <button onclick="layout()">$(layout) Auto Layout</button>
          </div>
          
          <div class="workflow-graph" id="graph">
            ${workflow ? this.renderNodes(workflow) : '<div class="empty-state">Invalid workflow YAML</div>'}
          </div>
          
          <div class="properties" id="properties">
            <h3>Properties</h3>
            <div class="empty-state">Select a node to view properties</div>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          let workflow = ${workflowJson};
          let selectedNode = null;

          function runWorkflow() {
            vscode.postMessage({ type: 'runWorkflow' });
          }

          function layout() {
            // Auto-layout nodes
            console.log('Auto layout');
          }

          function selectNode(nodeId) {
            selectedNode = nodeId;
            document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
            document.querySelector('[data-node-id="' + nodeId + '"]').classList.add('selected');
            
            const node = workflow?.nodes?.find(n => n.id === nodeId);
            if (node) {
              renderProperties(node);
            }
            
            vscode.postMessage({ type: 'nodeSelected', nodeId });
          }

          function renderProperties(node) {
            const props = document.getElementById('properties');
            let html = '<h3>Properties</h3>';
            html += '<div class="property-row"><span>ID</span><code>' + node.id + '</code></div>';
            html += '<div class="property-row"><span>Type</span><span>' + node.type + '</span></div>';
            html += '<div class="property-row"><span>Name</span><span>' + (node.name || 'Unnamed') + '</span></div>';
            if (node.agent) {
              html += '<div class="property-row"><span>Agent</span><span>' + node.agent + '</span></div>';
            }
            if (node.model) {
              html += '<div class="property-row"><span>Model</span><code>' + node.model + '</code></div>';
            }
            props.innerHTML = html;
          }

          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
              workflow = message.workflow;
              location.reload();
            }
          });
        </script>
      </body>
      </html>`;
  }

  private renderNodes(workflow: any): string {
    if (!workflow?.nodes || !Array.isArray(workflow.nodes)) {
      return '<div class="empty-state">No nodes defined</div>';
    }

    return workflow.nodes.map((node: any) => {
      const iconClass = node.type === 'agent' ? 'agent' : 
                        node.type === 'decision' ? 'decision' : 'action';
      const icon = node.type === 'agent' ? '🤖' : 
                   node.type === 'decision' ? '🔀' : '⚡';
      
      return `
        <div class="node" data-node-id="${node.id}" onclick="selectNode('${node.id}')">
          <div class="node-icon ${iconClass}">${icon}</div>
          <div class="node-info">
            <div class="node-name">${node.name || node.id}</div>
            <div class="node-type">${node.type}${node.agent ? ' • ' + node.agent : ''}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}
