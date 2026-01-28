import * as vscode from 'vscode';
import { AgentTreeProvider } from './agentTreeProvider';
import { ProjectTreeProvider } from './projectTreeProvider';
import { registerCommands, refreshAlignmentStatus } from './commands';
import { createAlignmentStatusBar } from './statusBar';

export function activate(context: vscode.ExtensionContext) {
    console.log('Ultra-Dex extension is now active!');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const rootPath = workspaceFolder?.uri.fsPath;

    const agentsProvider = new AgentTreeProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentsProvider);

    const projectProvider = new ProjectTreeProvider();
    vscode.window.registerTreeDataProvider('ultra-dex.projectRoadmap', projectProvider);

    createAlignmentStatusBar(context);
    registerCommands(context, rootPath);

    if (workspaceFolder) {
        const contextWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'CONTEXT.md')
        );
        const agentIndexWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspaceFolder, 'agents/00-AGENT_INDEX.md')
        );

        const refreshAlignment = () => {
            void refreshAlignmentStatus(rootPath);
        };

        contextWatcher.onDidChange(refreshAlignment);
        contextWatcher.onDidCreate(refreshAlignment);
        contextWatcher.onDidDelete(refreshAlignment);

        agentIndexWatcher.onDidChange(() => agentsProvider.refresh());
        agentIndexWatcher.onDidCreate(() => agentsProvider.refresh());
        agentIndexWatcher.onDidDelete(() => agentsProvider.refresh());

        context.subscriptions.push(contextWatcher, agentIndexWatcher);
    }

    void refreshAlignmentStatus(rootPath);
}

export function deactivate() {}
