/**
 * Workflow Tree View Provider
 * 
 * Shows all .dex workflows in the workspace with their status.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WorkflowTreeProvider implements vscode.TreeDataProvider<WorkflowItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<WorkflowItem | undefined | null | void> = 
    new vscode.EventEmitter<WorkflowItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WorkflowItem | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WorkflowItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: WorkflowItem): Thenable<WorkflowItem[]> {
    if (!element) {
      return Promise.resolve(this.getWorkflows());
    }
    return Promise.resolve([]);
  }

  private getWorkflows(): WorkflowItem[] {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return [];
    }

    const workflows: WorkflowItem[] = [];

    for (const folder of workspaceFolders) {
      this.findWorkflows(folder.uri.fsPath, workflows);
    }

    return workflows.sort((a, b) => a.label.localeCompare(b.label));
  }

  private findWorkflows(dir: string, workflows: WorkflowItem[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          this.findWorkflows(fullPath, workflows);
        } else if (entry.isFile() && entry.name.endsWith('.dex')) {
          workflows.push(new WorkflowItem(
            entry.name,
            vscode.Uri.file(fullPath),
            'pending'
          ));
        }
      }
    } catch {
      // Ignore permission errors
    }
  }
}

export class WorkflowItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly resourceUri: vscode.Uri,
    public readonly status: 'pending' | 'running' | 'completed' | 'failed'
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.label} (${this.status})`;
    this.description = this.status;
    
    // Set icon based on status
    const iconMap = {
      pending: 'circle-outline',
      running: 'sync~spin',
      completed: 'check',
      failed: 'error'
    };
    this.iconPath = new vscode.ThemeIcon(iconMap[status]);

    this.command = {
      command: 'ultraDex.openWorkflow',
      title: 'Open Workflow',
      arguments: [this.resourceUri]
    };

    this.contextValue = 'workflow';
  }
}
