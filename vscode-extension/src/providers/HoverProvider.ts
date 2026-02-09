import * as vscode from 'vscode';

function extractSection(content: string, sectionId: string) {
  const pattern = new RegExp(`^##?\\s+${sectionId}.*$`, 'm');
  const match = content.match(pattern);
  if (!match) return null;

  const start = match.index || 0;
  const rest = content.slice(start);
  const next = rest.search(/^##?\\s+/m);
  const slice = next > 0 ? rest.slice(0, next) : rest;
  return slice.trim();
}

export class ContextHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    const range = document.getWordRangeAtPosition(position);
    if (!range) return;

    const word = document.getText(range);
    if (!word.startsWith('@') && !word.startsWith('Section')) return;

    const contextFiles = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
    if (!contextFiles.length) return;

    const contextDoc = await vscode.workspace.openTextDocument(contextFiles[0]);
    const content = contextDoc.getText();

    if (word.startsWith('@')) {
      const agentName = word.slice(1);
      return new vscode.Hover(`Ultra-Dex agent: **${agentName}**`);
    }

    if (word.startsWith('Section')) {
      const section = extractSection(content, word);
      if (section) {
        return new vscode.Hover(new vscode.MarkdownString(section));
      }
    }

    return;
  }
}
