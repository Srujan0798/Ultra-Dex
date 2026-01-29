import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextHoverProvider implements vscode.HoverProvider {
    constructor(private rootPath: string | undefined) {}

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        if (!this.rootPath) return null;

        const range = document.getWordRangeAtPosition(position, /CONTEXT\.md|IMPLEMENTATION-PLAN\.md/);
        if (!range) return null;

        const fileName = document.getText(range);
        const filePath = path.join(this.rootPath, fileName === 'CONTEXT.md' ? 'CONTEXT.md' : 'docs/IMPLEMENTATION-PLAN.md');

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Get first 500 chars or summary
            const preview = content.slice(0, 500) + '...';
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${fileName} Preview**\n\n`);
            markdown.appendCodeblock(preview, 'markdown');
            return new vscode.Hover(markdown);
        }

        return null;
    }
}