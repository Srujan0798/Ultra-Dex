import * as vscode from 'vscode';
import { AgentsProvider } from './sidebar/AgentsView';
import { ContextProvider } from './sidebar/ContextView';
import { VerifyProvider } from './sidebar/VerifyView';
import { askAgent } from './commands/askAgent';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ultra-Dex extension is now active!');

    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	// Register Sidebar Views
	const agentsProvider = new AgentsProvider(rootPath);
	vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentsProvider);

    const contextProvider = new ContextProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.contextView', contextProvider);

    const verifyProvider = new VerifyProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.verifyView', verifyProvider);

	// Register Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('ultra-dex.selectAgent', (name: string) => {
			askAgent(name);
		})
	);

    context.subscriptions.push(
        vscode.commands.registerCommand('ultra-dex.askAgent', () => {
            askAgent();
        })
    );
}

export function deactivate() {}
