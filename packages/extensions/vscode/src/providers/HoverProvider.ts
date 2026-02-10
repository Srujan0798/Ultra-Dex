/**
 * @fileoverview HoverProvider module
 * @module providers/HoverProvider
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENT_DESCRIPTIONS: { [key: string]: string } = {
  '@planner': 'Task Breakdown Specialist - Defines atomic 4-9h tasks.',
  '@cto': 'Technical Architecture Lead - Makes high-level design decisions.',
  '@backend': 'API & Business Logic Developer - Implements server-side code.',
  '@frontend': 'UI/UX Developer - Builds components and interfaces.',
  '@database': 'Database Architect - Designs schemas and optimizes queries.',
  '@security': 'Security Specialist - Performs audits and hardens code.',
  '@devops': 'Infrastructure Specialist - Manages CI/CD and deployment.',
  '@reviewer': 'Code Reviewer - Ensures quality and standards compliance.',
  '@debugger': 'Diagnostic Expert - Identifies and fixes bugs.',
};

export class ContextHoverProvider implements vscode.HoverProvider {
  constructor(private rootPath: string | undefined) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    if (!this.rootPath) return null;

    // 0. Check for section references (e.g., "Section 3", "Section 12")
    const sectionRange = document.getWordRangeAtPosition(position, /Section\s+\d+/i);
    if (sectionRange) {
      const sectionLabel = document.getText(sectionRange);
      const sectionNumber = sectionLabel.match(/\d+/)?.[0];
      if (sectionNumber) {
        const sectionPreview = this.getContextSectionPreview(sectionNumber);
        if (sectionPreview) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`**CONTEXT.md → Section ${sectionNumber}**\n\n`);
          markdown.appendCodeblock(sectionPreview, 'markdown');
          return new vscode.Hover(markdown);
        }
      }
    }

    // 1. Check for filenames (legacy)
    const fileRange = document.getWordRangeAtPosition(
      position,
      /CONTEXT\.md|IMPLEMENTATION-PLAN\.md/
    );
    if (fileRange) {
      const fileName = document.getText(fileRange);
      const filePath = path.join(this.rootPath, fileName);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const preview = content.slice(0, 500) + '...';
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**${fileName} Preview**\n\n`);
        markdown.appendCodeblock(preview, 'markdown');
        return new vscode.Hover(markdown);
      }
    }

    // 2. Check for Agent Names (@name)
    const agentRange = document.getWordRangeAtPosition(position, /@[a-zA-Z]+/);
    if (agentRange) {
      const agentName = document.getText(agentRange).toLowerCase();
      const description = AGENT_DESCRIPTIONS[agentName];

      if (description) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**Ultra-Dex Agent: ${agentName.toUpperCase()}**\n\n`);
        markdown.appendMarkdown(`${description}\n\n`);
        markdown.appendMarkdown(`[Run ${agentName}](command:ultra-dex.selectAgent)`);
        markdown.isTrusted = true;
        return new vscode.Hover(markdown);
      }
    }

    return null;
  }

  private getContextSectionPreview(sectionNumber: string): string | null {
    try {
      const contextPath = path.join(this.rootPath || '', 'CONTEXT.md');
      if (!fs.existsSync(contextPath)) return null;
      const content = fs.readFileSync(contextPath, 'utf-8');
      const lines = content.split('\n');
      const startIndex = lines.findIndex(
        (line) =>
          line.match(new RegExp(`^##\\s+${sectionNumber}\\b`)) ||
          line.match(new RegExp(`^##\\s+Section\\s+${sectionNumber}\\b`, 'i'))
      );
      if (startIndex === -1) return null;
      const sectionLines: string[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        if (i !== startIndex && lines[i].startsWith('## ')) break;
        sectionLines.push(lines[i]);
      }
      return sectionLines.join('\n').slice(0, 800);
    } catch {
      return null;
    }
  }
}
