"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const AgentsView_1 = require("./sidebar/AgentsView");
const ContextView_1 = require("./sidebar/ContextView");
const VerifyView_1 = require("./sidebar/VerifyView");
const QuickActionsView_1 = require("./sidebar/QuickActionsView");
const hoverProvider_1 = require("./providers/hoverProvider");
let statusBarItem;
function activate(context) {
    console.log('Ultra-Dex extension is now active!');
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    // === SIDEBAR VIEWS ===
    const agentsProvider = new AgentsView_1.AgentsProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentsProvider);
    const contextProvider = new ContextView_1.ContextProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.contextView', contextProvider);
    const verifyProvider = new VerifyView_1.VerifyProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.verifyView', verifyProvider);
    const quickActionsProvider = new QuickActionsView_1.QuickActionsProvider();
    vscode.window.registerTreeDataProvider('ultra-dex.quickActions', quickActionsProvider);
    // === STATUS BAR - Alignment Score ===
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ultra-dex.showAlignmentScore';
    statusBarItem.text = '$(shield) Ultra-Dex';
    statusBarItem.tooltip = 'Click to check alignment score';
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();
    updateAlignmentScore(rootPath);
    // === HOVER PROVIDERS ===
    (0, hoverProvider_1.registerHoverProviders)(context, rootPath);
    // === FILE WATCHER ===
    if (rootPath) {
        const statePath = path.join(rootPath, '.ultra', 'state.json');
        const watcher = vscode.workspace.createFileSystemWatcher(statePath);
        watcher.onDidChange(() => {
            agentsProvider.refresh();
            contextProvider.refresh();
            verifyProvider.refresh();
            updateAlignmentScore(rootPath);
        });
        context.subscriptions.push(watcher);
    }
    // === COMMANDS ===
    // Copy Agent Prompt - Click agent to copy its full prompt
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.copyAgentPrompt', async (agent, wsRoot) => {
        const workspaceRoot = wsRoot || rootPath;
        if (!agent || !workspaceRoot) {
            vscode.window.showWarningMessage('No agent selected.');
            return;
        }
        const prompt = await readAgentPrompt(workspaceRoot, agent.file);
        if (!prompt) {
            vscode.window.showErrorMessage(`Unable to load prompt for @${agent.name}.`);
            return;
        }
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage(`📋 @${agent.name} prompt copied to clipboard!`);
    }));
    // Select Agent (legacy compatibility)
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.selectAgent', (agentName) => {
        const agent = AgentsView_1.ALL_AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
        if (agent) {
            vscode.commands.executeCommand('ultra-dex.copyAgentPrompt', agent, rootPath);
        }
    }));
    // Generate Plan
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.generatePlan', async () => {
        const feature = await vscode.window.showInputBox({
            prompt: 'What feature do you want to plan?',
            placeHolder: 'e.g., Add user authentication with OAuth'
        });
        if (feature) {
            const plannerAgent = AgentsView_1.ALL_AGENTS.find(a => a.name === 'Planner');
            if (plannerAgent && rootPath) {
                const prompt = await readAgentPrompt(rootPath, plannerAgent.file);
                const fullPrompt = `${prompt}\n\n---\n\n## Current Task\nCreate an implementation plan for: ${feature}`;
                await vscode.env.clipboard.writeText(fullPrompt);
                vscode.window.showInformationMessage('📋 @Planner prompt with your feature copied! Paste in your AI tool.');
            }
        }
    }));
    // Start Build Mode
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.startBuildMode', async () => {
        const options = [
            { label: '$(rocket) Full Feature Build', description: 'Orchestrate all agents for complete feature', value: 'full' },
            { label: '$(server) Backend Only', description: 'API and database work', value: 'backend' },
            { label: '$(browser) Frontend Only', description: 'UI and components', value: 'frontend' },
            { label: '$(bug) Debug Mode', description: 'Investigate and fix issues', value: 'debug' }
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select build mode'
        });
        if (selected) {
            const agents = {
                'full': ['Orchestrator'],
                'backend': ['Backend', 'Database'],
                'frontend': ['Frontend'],
                'debug': ['Debugger']
            };
            const agentName = agents[selected.value][0];
            const agent = AgentsView_1.ALL_AGENTS.find(a => a.name === agentName);
            if (agent && rootPath) {
                const prompt = await readAgentPrompt(rootPath, agent.file);
                await vscode.env.clipboard.writeText(prompt || '');
                vscode.window.showInformationMessage(`🚀 ${selected.label} - @${agentName} prompt copied!`);
            }
        }
    }));
    // Run Agent (with selector)
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.runAgent', async (preselectedAgent) => {
        let agentName = preselectedAgent;
        if (!agentName) {
            const agentOptions = AgentsView_1.ALL_AGENTS.map(a => ({
                label: `$(${a.icon}) @${a.name}`,
                description: a.description,
                detail: `Tier: ${a.tier}`,
                agent: a
            }));
            const selected = await vscode.window.showQuickPick(agentOptions, {
                placeHolder: 'Select an agent to run',
                matchOnDescription: true
            });
            if (selected) {
                agentName = selected.agent.name;
            }
        }
        if (agentName && rootPath) {
            const agent = AgentsView_1.ALL_AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
            if (agent) {
                const prompt = await readAgentPrompt(rootPath, agent.file);
                await vscode.env.clipboard.writeText(prompt || '');
                vscode.window.showInformationMessage(`🤖 @${agent.name} prompt copied to clipboard!`);
            }
        }
    }));
    // Open Dashboard
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.openDashboard', async () => {
        if (!rootPath) {
            vscode.window.showErrorMessage('Open a project folder first.');
            return;
        }
        // Create webview dashboard
        const panel = vscode.window.createWebviewPanel('ultraDexDashboard', 'Ultra-Dex Dashboard', vscode.ViewColumn.One, { enableScripts: true });
        const alignmentScore = await getAlignmentScore(rootPath);
        panel.webview.html = getDashboardHtml(alignmentScore);
    }));
    // Show Alignment Score
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.showAlignmentScore', async () => {
        const score = await getAlignmentScore(rootPath);
        updateStatusBar(score);
        vscode.window.showInformationMessage(`📊 Project Alignment Score: ${score}`);
    }));
    // Ask Agent (context menu)
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.askAgent', async () => {
        const editor = vscode.window.activeTextEditor;
        const selection = editor && !editor.selection.isEmpty
            ? editor.document.getText(editor.selection)
            : '';
        const agentOptions = AgentsView_1.ALL_AGENTS.map(a => ({
            label: `@${a.name}`,
            description: a.description,
            agent: a
        }));
        const selected = await vscode.window.showQuickPick(agentOptions, {
            placeHolder: 'Which agent should review this?'
        });
        if (selected && rootPath) {
            const prompt = await readAgentPrompt(rootPath, selected.agent.file);
            const fullPrompt = selection
                ? `${prompt}\n\n---\n\n## Code to Review\n\`\`\`\n${selection}\n\`\`\``
                : prompt;
            await vscode.env.clipboard.writeText(fullPrompt || '');
            vscode.window.showInformationMessage(`📋 @${selected.agent.name} prompt copied!`);
        }
    }));
    // Verify Command
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.verify', () => {
        const terminal = vscode.window.createTerminal('Ultra-Dex Verify');
        terminal.show();
        terminal.sendText('npx ultra-dex verify');
    }));
    // Refresh Agents
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.refreshAgents', () => {
        agentsProvider.refresh();
        vscode.window.showInformationMessage('Agents refreshed!');
    }));
    // God Mode Commands
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.startDaemon', () => {
        const terminal = vscode.window.createTerminal('Ultra-Dex Daemon');
        terminal.show();
        terminal.sendText('npx ultra-dex watch');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.autoImplement', async () => {
        const feature = await vscode.window.showInputBox({
            prompt: 'Describe the feature to implement',
            placeHolder: 'e.g., Add Stripe subscription checkout flow'
        });
        if (feature) {
            const terminal = vscode.window.createTerminal('Ultra-Dex Auto-Implement');
            terminal.show();
            terminal.sendText(`npx ultra-dex auto-implement "${feature}"`);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.syncProject', () => {
        const terminal = vscode.window.createTerminal('Ultra-Dex Sync');
        terminal.show();
        terminal.sendText('npx ultra-dex sync');
    }));
}
// === HELPER FUNCTIONS ===
async function readAgentPrompt(workspaceRoot, relativePath) {
    const fullPath = path.join(workspaceRoot, 'agents', relativePath);
    try {
        const data = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
        return Buffer.from(data).toString('utf8');
    }
    catch {
        return null;
    }
}
async function getAlignmentScore(workspaceRoot) {
    if (!workspaceRoot)
        return 'N/A';
    const contextPath = path.join(workspaceRoot, 'CONTEXT.md');
    try {
        const data = await vscode.workspace.fs.readFile(vscode.Uri.file(contextPath));
        const content = Buffer.from(data).toString('utf8');
        // Count filled sections
        const totalSections = 32;
        const filledSections = (content.match(/^##\s+\d+\./gm) || []).length;
        const score = Math.round((filledSections / totalSections) * 100);
        return `${score}%`;
    }
    catch {
        return 'No CONTEXT.md';
    }
}
async function updateAlignmentScore(workspaceRoot) {
    const score = await getAlignmentScore(workspaceRoot);
    updateStatusBar(score);
}
function updateStatusBar(score) {
    if (!statusBarItem)
        return;
    statusBarItem.text = `$(shield) Alignment: ${score}`;
    statusBarItem.tooltip = 'Ultra-Dex Project Alignment Score - Click to refresh';
    // Color based on score
    const numScore = parseInt(score);
    if (numScore >= 80) {
        statusBarItem.backgroundColor = undefined;
        statusBarItem.color = '#4caf50';
    }
    else if (numScore >= 50) {
        statusBarItem.color = '#ff9800';
    }
    else if (!isNaN(numScore)) {
        statusBarItem.color = '#f44336';
    }
    else {
        statusBarItem.color = undefined;
    }
}
function getDashboardHtml(alignmentScore) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra-Dex Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .score-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
        }
        .score { font-size: 48px; font-weight: bold; color: #4caf50; }
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        .agent-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            cursor: pointer;
        }
        .agent-card:hover { background: var(--vscode-list-hoverBackground); }
        .tier-section { margin-bottom: 20px; }
        .tier-title { font-size: 14px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Ultra-Dex Dashboard</h1>
    </div>
    
    <div class="score-card">
        <div>Project Alignment</div>
        <div class="score">${alignmentScore}</div>
    </div>
    
    <h2>🤖 Available Agents (16)</h2>
    <div class="agents-grid">
        ${AgentsView_1.ALL_AGENTS.map(a => `
            <div class="agent-card">
                <div style="font-size: 24px;">🤖</div>
                <div><strong>@${a.name}</strong></div>
                <div style="font-size: 11px; color: var(--vscode-descriptionForeground);">${a.tier}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map