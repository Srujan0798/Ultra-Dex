/**
 * @fileoverview ContextPreviewProvider module
 * @module src/contextPreviewProvider
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ContextPreviewProvider implements vscode.TreeDataProvider<ContextItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ContextItem | undefined | null | void> =
    new vscode.EventEmitter<ContextItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ContextItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private contextData: any = {};

  refresh(): void {
    this.loadContextData();
    this._onDidChangeTreeData.fire();
  }

  private loadContextData(): void {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) return;

      const contextPath = path.join(workspaceRoot, 'CONTEXT.md');
      if (fs.existsSync(contextPath)) {
        const content = fs.readFileSync(contextPath, 'utf8');
        this.parseContext(content);
      }
    } catch (error) {
      console.error('Failed to load context:', error);
    }
  }

  private parseContext(content: string): void {
    // Extract key sections from CONTEXT.md
    this.contextData = {
      techStack: this.extractSection(content, 'Tech Stack'),
      currentFocus: this.extractSection(content, 'Current Focus'),
      lastUpdated: this.extractSection(content, 'Last Updated'),
    };
  }

  private extractSection(content: string, sectionName: string): string {
    const regex = new RegExp(`## ${sectionName}\\n\\n([^#]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim().substring(0, 100) : 'Not specified';
  }

  getTreeItem(element: ContextItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ContextItem): Thenable<ContextItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const items: ContextItem[] = [];

    // Tech Stack
    if (this.contextData.techStack) {
      items.push(
        new ContextItem(
          'Tech Stack',
          this.contextData.techStack,
          vscode.TreeItemCollapsibleState.None,
          '$(gear)'
        )
      );
    }

    // Current Focus
    if (this.contextData.currentFocus) {
      items.push(
        new ContextItem(
          'Current Focus',
          this.contextData.currentFocus,
          vscode.TreeItemCollapsibleState.None,
          '$(target)'
        )
      );
    }

    // Open Context.md action
    items.push(
      new ContextItem(
        'Open CONTEXT.md',
        'View full project context',
        vscode.TreeItemCollapsibleState.None,
        '$(file)',
        {
          command: 'vscode.open',
          title: 'Open Context',
          arguments: [
            vscode.Uri.file(
              path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', 'CONTEXT.md')
            ),
          ],
        }
      )
    );

    return Promise.resolve(items);
  }
}

class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    if (icon) {
      this.iconPath = new vscode.ThemeIcon(icon.replace('$(', '').replace(')', ''));
    }

    this.description = this.description;
    this.contextValue = 'contextItem';
    this.tooltip = this.description;
  }
}
