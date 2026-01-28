import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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

    // Watch for state changes to refresh views
    if (rootPath) {
        const statePath = path.join(rootPath, '.ultra', 'state.json');
        const watcher = vscode.workspace.createFileSystemWatcher(statePath);
        watcher.onDidChange(() => {
            agentsProvider.refresh();
            contextProvider.refresh();
            verifyProvider.refresh();
        });
        context.subscriptions.push(watcher);
    }

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

    // GOD MODE COMMANDS
    context.subscriptions.push(
        vscode.commands.registerCommand('ultra-dex.startDaemon', () => {
            const terminal = vscode.window.createTerminal('Ultra-Dex Daemon');
            terminal.show();
            terminal.sendText('npx ultra-dex watch');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ultra-dex.autoImplement', async () => {
            const feature = await vscode.window.showInputBox({
                prompt: 'Describe the feature to implement',
                placeHolder: 'e.g., Add Stripe subscription checkout flow'
            });
            
            if (feature) {
                const terminal = vscode.window.createTerminal('Ultra-Dex Auto-Implement');
                terminal.show();
                terminal.sendText(`npx ultra-dex auto-implement "${feature}"`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ultra-dex.syncProject', () => {
            const terminal = vscode.window.createTerminal('Ultra-Dex Sync');
            terminal.show();
            terminal.sendText('npx ultra-dex sync');
        })
    );
}

export function deactivate() {}
