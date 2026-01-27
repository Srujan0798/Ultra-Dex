import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function askAgent(agentName?: string) {
    if (!agentName) {
        // Show quick pick
        const agents = [
            'planner', 'cto', 'backend', 'frontend', 'database', 
            'auth', 'security', 'testing', 'reviewer', 'devops'
        ];
        agentName = await vscode.window.showQuickPick(agents, {
            placeHolder: 'Select an AI Agent'
        });
    }

    if (!agentName) return;

    // Get project context
    const rootPath = vscode.workspace.rootPath;
    if (!rootPath) {
        vscode.window.showErrorMessage('Open a project folder first.');
        return;
    }

    // Try to read agent file
    const agentFile = path.join(rootPath, 'agents', `${agentName}.md`);
    // Fallback logic could be complex, keeping it simple for now
    // Assuming agent structure is flat or mapped.
    // Let's rely on the CLI 'agent' command logic conceptually but implementing simple read here.
    // Or we can execute the CLI command.
    
    // For extension, let's just copy a template prompt.
    const prompt = `You are @${agentName.charAt(0).toUpperCase() + agentName.slice(1)}.
Role: Specialized AI Agent for Ultra-Dex.

Current Task: [Describe task]

Context:
[Paste CONTEXT.md here]

Plan:
[Paste IMPLEMENTATION-PLAN.md here]
`;

    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage(`Prompt for @${agentName} copied to clipboard!`);
}
