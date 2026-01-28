import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ALL_AGENTS, AgentInfo } from '../sidebar/AgentsView';

// Agent mention hover provider - shows description when hovering over @agent mentions
export class AgentHoverProvider implements vscode.HoverProvider {
  constructor(private workspaceRoot: string | undefined) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const range = document.getWordRangeAtPosition(position, /@[A-Za-z]+/);
    if (!range) return null;

    const word = document.getText(range);
    const agentName = word.replace('@', '').toLowerCase();
    
    const agent = ALL_AGENTS.find(a => a.name.toLowerCase() === agentName);
    if (!agent) return null;

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`## 🤖 @${agent.name}\n\n`);
    markdown.appendMarkdown(`**Tier:** ${agent.tier}\n\n`);
    markdown.appendMarkdown(`**Role:** ${agent.description}\n\n`);
    markdown.appendMarkdown(`---\n\n`);
    markdown.appendMarkdown(`📁 \`agents/${agent.file}\`\n\n`);
    markdown.appendMarkdown(`[Copy Prompt](command:ultra-dex.copyAgentPrompt?${encodeURIComponent(JSON.stringify([agent, this.workspaceRoot]))})`);
    markdown.isTrusted = true;

    return new vscode.Hover(markdown, range);
  }
}

// CONTEXT.md reference hover provider - shows preview of referenced sections
export class ContextHoverProvider implements vscode.HoverProvider {
  constructor(private workspaceRoot: string | undefined) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    // Match CONTEXT.md references like "See CONTEXT.md" or "CONTEXT.md#section"
    const lineText = document.lineAt(position.line).text;
    
    // Check for CONTEXT.md mention
    const contextMatch = lineText.match(/CONTEXT\.md(#[\w-]+)?/i);
    if (!contextMatch) return null;

    const matchStart = lineText.indexOf(contextMatch[0]);
    const matchEnd = matchStart + contextMatch[0].length;
    
    if (position.character < matchStart || position.character > matchEnd) return null;

    const range = new vscode.Range(position.line, matchStart, position.line, matchEnd);
    
    if (!this.workspaceRoot) return null;

    try {
      const contextPath = path.join(this.workspaceRoot, 'CONTEXT.md');
      if (!fs.existsSync(contextPath)) return null;

      let content = fs.readFileSync(contextPath, 'utf-8');
      const section = contextMatch[1]?.replace('#', '');

      if (section) {
        // Extract specific section
        const sectionRegex = new RegExp(`^##\\s*\\d*\\.?\\s*${section}[\\s\\S]*?(?=^##|$)`, 'mi');
        const sectionMatch = content.match(sectionRegex);
        content = sectionMatch ? sectionMatch[0] : `Section "${section}" not found`;
      } else {
        // Show first 500 chars preview
        content = content.substring(0, 500) + (content.length > 500 ? '\n\n...' : '');
      }

      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`## 📋 CONTEXT.md Preview\n\n`);
      markdown.appendMarkdown('```markdown\n' + content + '\n```');
      markdown.isTrusted = true;

      return new vscode.Hover(markdown, range);
    } catch {
      return null;
    }
  }
}

// Implementation plan hover provider
export class PlanHoverProvider implements vscode.HoverProvider {
  constructor(private workspaceRoot: string | undefined) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const lineText = document.lineAt(position.line).text;
    
    const planMatch = lineText.match(/IMPLEMENTATION-PLAN\.md/i);
    if (!planMatch) return null;

    const matchStart = lineText.indexOf(planMatch[0]);
    const matchEnd = matchStart + planMatch[0].length;
    
    if (position.character < matchStart || position.character > matchEnd) return null;

    const range = new vscode.Range(position.line, matchStart, position.line, matchEnd);
    
    if (!this.workspaceRoot) return null;

    try {
      const planPath = path.join(this.workspaceRoot, 'IMPLEMENTATION-PLAN.md');
      if (!fs.existsSync(planPath)) return null;

      let content = fs.readFileSync(planPath, 'utf-8');
      content = content.substring(0, 600) + (content.length > 600 ? '\n\n...' : '');

      const markdown = new vscode.MarkdownString();
      markdown.appendMarkdown(`## 📝 Implementation Plan Preview\n\n`);
      markdown.appendMarkdown('```markdown\n' + content + '\n```');
      markdown.isTrusted = true;

      return new vscode.Hover(markdown, range);
    } catch {
      return null;
    }
  }
}

export function registerHoverProviders(context: vscode.ExtensionContext, workspaceRoot: string | undefined): void {
  // Register for all file types
  const selector: vscode.DocumentSelector = { scheme: 'file' };
  
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new AgentHoverProvider(workspaceRoot)),
    vscode.languages.registerHoverProvider(selector, new ContextHoverProvider(workspaceRoot)),
    vscode.languages.registerHoverProvider(selector, new PlanHoverProvider(workspaceRoot))
  );
}
