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
    '@debugger': 'Diagnostic Expert - Identifies and fixes bugs.'
};

export class ContextHoverProvider implements vscode.HoverProvider {
    constructor(private rootPath: string | undefined) {}

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        if (!this.rootPath) return null;

        // 1. Check for filenames (legacy)
        const fileRange = document.getWordRangeAtPosition(position, /CONTEXT\.md|IMPLEMENTATION-PLAN\.md/);
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
}