import * as vscode from 'vscode';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(content: string, sectionRef: string) {
  const headingPattern = new RegExp(`^##?\\s+.*${escapeRegExp(sectionRef)}.*$`, 'im');
  const match = headingPattern.exec(content);
  if (!match) return null;

  const start = match.index;
  const rest = content.slice(start);
  const firstBreak = rest.indexOf('\n');
  if (firstBreak < 0) return rest.trim();

  const body = rest.slice(firstBreak + 1);
  const nextHeadingOffset = body.search(/^##?\\s+/m);
  const end = nextHeadingOffset >= 0 ? firstBreak + 1 + nextHeadingOffset : rest.length;
  return rest.slice(0, end).trim();
}

function findTokenAtPosition(lineText: string, character: number, pattern: RegExp): string | null {
  const matcher = new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  );
  let match: RegExpExecArray | null = matcher.exec(lineText);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (character >= start && character <= end) {
      return match[0];
    }
    match = matcher.exec(lineText);
  }
  return null;
}

export class ContextHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    const line = document.lineAt(position.line).text;
    const agentToken = findTokenAtPosition(line, position.character, /@[A-Za-z0-9_-]+/);
    const sectionToken = findTokenAtPosition(line, position.character, /Section\s+\d+(\.\d+)?/i);

    if (!agentToken && !sectionToken) return;

    const contextFiles = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
    if (!contextFiles.length) return;

    const contextDoc = await vscode.workspace.openTextDocument(contextFiles[0]);
    const content = contextDoc.getText();

    if (agentToken) {
      const agentName = agentToken.slice(1);
      return new vscode.Hover(`Ultra-Dex agent: **${agentName}**`);
    }

    if (sectionToken) {
      const section = extractSection(content, sectionToken);
      if (section) {
        return new vscode.Hover(new vscode.MarkdownString(section));
      }
    }

    return;
  }
}

/**
 * Error handler for HoverProvider
 * @param {Error} error - Error to handle
 */
function handleHoverProviderError(error) {
  try {
    console.error('[HoverProvider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
