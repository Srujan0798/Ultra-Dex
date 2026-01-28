import * as path from 'path';
import * as vscode from 'vscode';
import { AgentItem } from './agentTreeProvider';
import { updateAlignmentStatusBar } from './statusBar';

const KERNEL_URL = 'http://localhost:3001';

export function registerCommands(context: vscode.ExtensionContext, workspaceRoot?: string): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('ultra-dex.selectAgent', async (agent?: AgentItem) => {
      if (!agent || !workspaceRoot) {
        vscode.window.showWarningMessage('No agent selected.');
        return;
      }
      
      // Try to fetch from Kernel first, fallback to local
      let prompt = await fetchFromKernel(`/agents/${agent.name.replace('@', '')}`);
      if (!prompt) {
          prompt = await readAgentPrompt(workspaceRoot, agent.filePath);
      }

      if (!prompt) {
        vscode.window.showErrorMessage(`Unable to load prompt for ${agent.name}.`);
        return;
      }
      await vscode.env.clipboard.writeText(prompt);
      vscode.window.showInformationMessage(`${agent.name} prompt copied to clipboard.`);
    }),

    vscode.commands.registerCommand('ultra-dex.checkAlignment', async () => {
      const scoreData = await fetchFromKernel('/score', true);
      const score = scoreData ? `${scoreData.score}%` : await getAlignmentScoreFallback(workspaceRoot);
      updateAlignmentStatusBar(score);
      vscode.window.showInformationMessage(`Alignment score: ${score}`);
    }),

    vscode.commands.registerCommand('ultra-dex.triggerSwarm', async () => {
      const editor = vscode.window.activeTextEditor;
      let task = '';
      
      if (editor && !editor.selection.isEmpty) {
          task = editor.document.getText(editor.selection);
      } else {
          task = await vscode.window.showInputBox({ 
              prompt: 'Enter the feature or task for the agent swarm',
              placeHolder: 'e.g. Build user authentication system'
          }) || '';
      }

      if (!task) return;

      vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Ultra-Dex Swarm",
          cancellable: false
      }, async (progress) => {
          progress.report({ message: "Initiating Swarm..." });
          try {
              const res = await fetch(`${KERNEL_URL}/api/swarm`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ task })
              });
              if (res.ok) {
                  vscode.window.showInformationMessage('Swarm initiated! Monitor progress in the Ultra-Dex Dashboard.');
              } else {
                  throw new Error('Kernel rejected swarm request');
              }
          } catch (e) {
              vscode.window.showErrorMessage('Failed to trigger Swarm. Is "ultra-dex serve" running?');
          }
      });
    }),

    vscode.commands.registerCommand('ultra-dex.openDashboard', () => {
        vscode.env.openExternal(vscode.Uri.parse(KERNEL_URL));
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

async function fetchFromKernel(endpoint: string, isJson = false): Promise<any> {
    try {
        const res = await fetch(`${KERNEL_URL}${endpoint.startsWith('/api') ? endpoint : '/api' + endpoint}`);
        if (!res.ok) return null;
        return isJson ? await res.json() : await res.text();
    } catch {
        return null;
    }
}

export async function refreshAlignmentStatus(workspaceRoot?: string): Promise<void> {
  const scoreData = await fetchFromKernel('/score', true);
  const score = scoreData ? `${scoreData.score}%` : await getAlignmentScoreFallback(workspaceRoot);
  updateAlignmentStatusBar(score);
}

async function readAgentPrompt(workspaceRoot: string, relativePath: string): Promise<string | null> {
  const fullPath = path.join(workspaceRoot, relativePath.startsWith('agents') ? '' : 'agents', relativePath);
  try {
    const data = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
    return Buffer.from(data).toString('utf8');
  } catch {
    return null;
  }
}

async function getAlignmentScoreFallback(workspaceRoot?: string): Promise<string> {
  if (!workspaceRoot) return 'Unknown';
  const filePath = path.join(workspaceRoot, 'CONTEXT.md');
  try {
    const data = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    const content = Buffer.from(data).toString('utf8');
    const match = content.match(/alignment\s*score\s*:\s*(\d+%?)/i);
    return match?.[1] ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}
