import * as path from 'path';
import * as vscode from 'vscode';
import { AgentItem } from './agentTreeProvider';
import { updateAlignmentStatusBar } from './statusBar';

export function registerCommands(context: vscode.ExtensionContext, workspaceRoot?: string): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.selectAgent', async (agent?: AgentItem) => {
      if (!agent || !workspaceRoot) {
        vscode.window.showWarningMessage('No agent selected.');
        return;
      }
      const prompt = await readAgentPrompt(workspaceRoot, agent.filePath);
      if (!prompt) {
        vscode.window.showErrorMessage(`Unable to load prompt for ${agent.name}.`);
        return;
      }
      await vscode.env.clipboard.writeText(prompt);
      vscode.window.showInformationMessage(`${agent.name} prompt copied to clipboard.`);
    }),
    vscode.commands.registerCommand('ultra-dex.checkAlignment', async () => {
      const score = await getAlignmentScore(workspaceRoot);
      updateAlignmentStatusBar(score);
      vscode.window.showInformationMessage(`Alignment score: ${score}`);
    }),
    vscode.commands.registerCommand('ultra-dex.generatePlan', async () => {
      vscode.window.showInformationMessage('Generate plan: Use @Planner with the Implementation Template.');
    }),
    vscode.commands.registerCommand('ultra-dex.askAgent', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('Select code to ask an agent.');
        return;
      }
      const selection = editor.document.getText(editor.selection);
      const prompt = `Ask an Ultra-Dex agent about the following selection:\n\n${selection}`;
      await vscode.env.clipboard.writeText(prompt);
      vscode.window.showInformationMessage('Selection copied to clipboard with prompt.');
    })
  );
}

async function readAgentPrompt(workspaceRoot: string, relativePath: string): Promise<string | null> {
  const fullPath = path.join(workspaceRoot, 'agents', relativePath);
  try {
    const data = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
    return Buffer.from(data).toString('utf8');
  } catch {
    return null;
  }
}

async function getAlignmentScore(workspaceRoot?: string): Promise<string> {
  if (!workspaceRoot) {
    return 'Unknown';
  }
  const filePath = path.join(workspaceRoot, 'CONTEXT.md');
  try {
    const data = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    const content = Buffer.from(data).toString('utf8');
    const match = content.match(/alignment\\s*score\\s*:\\s*(\\d+%?)/i);
    return match?.[1] ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}
