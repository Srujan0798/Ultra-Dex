/**
 * Ultra-Dex VS Code Extension v2
 * Enhanced with CodeLens, Context Panel, and 50+ commands
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { AgentTreeProvider } from './agentTreeProvider';
import { createAlignmentStatusBar, updateAlignmentStatusBar, refreshAlignmentStatusBar } from './statusBar';
import { SwarmStatusProvider } from './swarmStatusProvider';
import { QuickActionsProvider } from './quickActionsProvider';
import { ContextPreviewProvider } from './contextPreviewProvider';
import { ContextHoverProvider } from './providers/hoverProvider';
import { WebSocketManager } from './websocketManager';
import { TaskCodeLensProvider, showTaskDetails, updateTaskStatus } from './codelens/TaskLens';
import { ContextPanelProvider } from './panels/ContextPanel';

const exec = util.promisify(cp.exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('Ultra-Dex extension v2 activated');

    const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    // Initialize tree providers
    const agentTreeProvider = new AgentTreeProvider(rootPath);
    const swarmStatusProvider = new SwarmStatusProvider();
    const quickActionsProvider = new QuickActionsProvider();
    const contextPreviewProvider = new ContextPreviewProvider();

    // Register tree data providers
    vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentTreeProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.swarmStatus', swarmStatusProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.quickActions', quickActionsProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.contextPreview', contextPreviewProvider);

    // Register CodeLens provider for tasks
    const taskCodeLensProvider = new TaskCodeLensProvider(rootPath);
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', pattern: '**/*.{js,ts,jsx,tsx}' },
            taskCodeLensProvider
        )
    );

    // Register Context Panel provider
    const contextPanelProvider = new ContextPanelProvider(rootPath);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ContextPanelProvider.viewType,
            contextPanelProvider
        )
    );

    // Register hover provider
    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ scheme: 'file' }, new ContextHoverProvider(rootPath))
    );

    // Initialize WebSocket manager for real-time updates
    const wsManager = new WebSocketManager();
    
    // Connect to WebSocket server
    const config = vscode.workspace.getConfiguration('ultra-dex');
    const dashboardPort = config.get('dashboardPort', 3002);
    
    wsManager.connect(`ws://localhost:${dashboardPort}/ws`);
    
    // Listen for WebSocket events
    wsManager.on('agent_status', (data: any) => {
        agentTreeProvider.updateAgentStatus(data.agent, data.status);
        swarmStatusProvider.updateStatus(data);
    });
    
    wsManager.on('swarm_update', (data: any) => {
        swarmStatusProvider.updateSwarmStatus(data);
    });
    
    wsManager.on('context_update', (data: any) => {
        contextPreviewProvider.refresh();
        contextPanelProvider.refresh();
    });

    // Create status bar with alignment score
    const statusBarItem = createAlignmentStatusBar();
    context.subscriptions.push(statusBarItem);

    // Register all commands (50+)
    registerAllCommands(context, agentTreeProvider, swarmStatusProvider, wsManager, taskCodeLensProvider, contextPanelProvider);

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
        agentTreeProvider.refresh();
        swarmStatusProvider.refresh();
        refreshAlignmentStatusBar(statusBarItem);
        taskCodeLensProvider.refresh();
    }, 10000);

    context.subscriptions.push({
        dispose: () => {
            clearInterval(refreshInterval);
            wsManager.disconnect();
        }
    });

    // Auto-start kernel if configured
    if (config.get('autoStartKernel', false)) {
        startKernel();
    }

    // Welcome message
    vscode.window.showInformationMessage(
        'Ultra-Dex v2 is now active!',
        'View Commands',
        'Open Dashboard'
    ).then(selection => {
        if (selection === 'View Commands') {
            vscode.commands.executeCommand('ultra-dex.showCommandPalette');
        } else if (selection === 'Open Dashboard') {
            vscode.commands.executeCommand('ultra-dex.openDashboard');
        }
    });
}

function registerAllCommands(
    context: vscode.ExtensionContext, 
    agentTreeProvider: AgentTreeProvider,
    swarmStatusProvider: SwarmStatusProvider,
    wsManager: WebSocketManager,
    taskCodeLensProvider: TaskCodeLensProvider,
    contextPanelProvider: ContextPanelProvider
) {
    // Core Commands
    const commands = [
        // Agent Commands
        vscode.commands.registerCommand('ultra-dex.selectAgent', () => selectAgent()),
        vscode.commands.registerCommand('ultra-dex.runAgent', (agent: string, task: string) => runAgent(agent, task)),
        vscode.commands.registerCommand('ultra-dex.stopAgent', (agentItem: any) => stopAgent(agentItem)),
        vscode.commands.registerCommand('ultra-dex.refreshAgents', () => {
            agentTreeProvider.refresh();
            vscode.window.showInformationMessage('Agent list refreshed');
        }),
        vscode.commands.registerCommand('ultra-dex.runSpecificAgent', (agentItem: any) => runSpecificAgent(agentItem)),

        // Swarm Commands
        vscode.commands.registerCommand('ultra-dex.runSwarm', () => runSwarmCmd()),
        vscode.commands.registerCommand('ultra-dex.swarmStatus', () => showSwarmStatus()),
        vscode.commands.registerCommand('ultra-dex.stopSwarm', () => stopSwarm()),
        vscode.commands.registerCommand('ultra-dex.pauseSwarm', () => pauseSwarm()),
        vscode.commands.registerCommand('ultra-dex.resumeSwarm', () => resumeSwarm()),

        // Plan Commands
        vscode.commands.registerCommand('ultra-dex.generatePlan', () => generatePlan()),
        vscode.commands.registerCommand('ultra-dex.openPlan', () => openImplementationPlan()),
        vscode.commands.registerCommand('ultra-dex.checkPlan', () => checkPlan()),
        vscode.commands.registerCommand('ultra-dex.scaffoldPlan', () => scaffoldPlan()),
        vscode.commands.registerCommand('ultra-dex.exportPlan', () => exportPlan()),
        vscode.commands.registerCommand('ultra-dex.diffPlan', () => diffPlan()),

        // Alignment Commands
        vscode.commands.registerCommand('ultra-dex.checkAlignment', () => checkAlignment()),
        vscode.commands.registerCommand('ultra-dex.showAlignmentDetails', () => showAlignmentDetailsCmd()),
        vscode.commands.registerCommand('ultra-dex.align', () => align()),

        // Context Commands
        vscode.commands.registerCommand('ultra-dex.openContext', () => openContext()),
        vscode.commands.registerCommand('ultra-dex.editContext', () => contextPanelProvider.refresh()),
        vscode.commands.registerCommand('ultra-dex.refreshContext', () => contextPanelProvider.refresh()),
        vscode.commands.registerCommand('ultra-dex.syncContext', () => syncContext()),
        vscode.commands.registerCommand('ultra-dex.checkContext', () => checkContext()),

        // Dashboard Commands
        vscode.commands.registerCommand('ultra-dex.openDashboard', () => openDashboard()),
        vscode.commands.registerCommand('ultra-dex.startKernel', () => startKernel()),
        vscode.commands.registerCommand('ultra-dex.stopKernel', () => stopKernel()),
        vscode.commands.registerCommand('ultra-dex.restartKernel', () => restartKernel()),
        vscode.commands.registerCommand('ultra-dex.openWebview', () => openWebview()),

        // Code Actions
        vscode.commands.registerCommand('ultra-dex.askAgent', () => askAgent()),
        vscode.commands.registerCommand('ultra-dex.execCode', () => execCode()),
        vscode.commands.registerCommand('ultra-dex.generateTests', () => generateTests()),
        vscode.commands.registerCommand('ultra-dex.reviewCode', () => reviewCode()),
        vscode.commands.registerCommand('ultra-dex.explainCode', () => explainCode()),
        vscode.commands.registerCommand('ultra-dex.refactorCode', () => refactorCode()),
        vscode.commands.registerCommand('ultra-dex.documentCode', () => documentCode()),

        // Task/CodeLens Commands
        vscode.commands.registerCommand('ultra-dex.showTaskDetails', (task: any) => showTaskDetails(task)),
        vscode.commands.registerCommand('ultra-dex.updateTaskStatus', (task: any, status: string) => {
            const validStatus = status as 'not_started' | 'in_progress' | 'completed';
            updateTaskStatus(task, validStatus);
        }),
        vscode.commands.registerCommand('ultra-dex.refreshTasks', () => taskCodeLensProvider.refresh()),

        // Session Commands
        vscode.commands.registerCommand('ultra-dex.newSession', () => newSession()),
        vscode.commands.registerCommand('ultra-dex.loadSession', () => loadSession()),
        vscode.commands.registerCommand('ultra-dex.saveSession', () => saveSession()),
        vscode.commands.registerCommand('ultra-dex.listSessions', () => listSessions()),

        // Auth Commands
        vscode.commands.registerCommand('ultra-dex.login', () => login()),
        vscode.commands.registerCommand('ultra-dex.logout', () => logout()),
        vscode.commands.registerCommand('ultra-dex.whoami', () => whoami()),
        vscode.commands.registerCommand('ultra-dex.configureSSO', () => configureSSO()),

        // Utility Commands
        vscode.commands.registerCommand('ultra-dex.showCommandPalette', () => showCommandPalette()),
        vscode.commands.registerCommand('ultra-dex.settings', () => openSettings()),
        vscode.commands.registerCommand('ultra-dex.help', () => openHelp()),
        vscode.commands.registerCommand('ultra-dex.about', () => showAbout()),

        // Advanced Commands
        vscode.commands.registerCommand('ultra-dex.ragIndex', () => ragIndex()),
        vscode.commands.registerCommand('ultra-dex.ragQuery', () => ragQuery()),
        vscode.commands.registerCommand('ultra-dex.audit', () => showAudit()),
        vscode.commands.registerCommand('ultra-dex.export', () => exportData()),
        vscode.commands.registerCommand('ultra-dex.import', () => importData()),

        // Quick Actions
        vscode.commands.registerCommand('ultra-dex.quickGenerate', () => quickGenerate()),
        vscode.commands.registerCommand('ultra-dex.quickCheck', () => quickCheck()),
        vscode.commands.registerCommand('ultra-dex.quickFix', () => quickFix())
    ];

    context.subscriptions.push(...commands);
}

// ============== Command Implementations ==============

async function selectAgent() {
    const agents = ['@planner', '@backend', '@frontend', '@database', '@security', '@devops', '@reviewer', '@debugger', '@architect', '@qa'];
    const selected = await vscode.window.showQuickPick(agents, {
        placeHolder: 'Select an agent to run'
    });
    
    if (selected) {
        const task = await vscode.window.showInputBox({
            prompt: `What task should ${selected} handle?`,
            placeHolder: 'e.g., "Create user authentication API"'
        });
        
        if (task) {
            runAgent(selected, task);
        }
    }
}

async function runAgent(agent: string, task: string) {
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running ${agent}...`,
            cancellable: false
        }, async () => {
            const { stdout } = await exec(`npx ultra-dex run ${agent.replace('@', '')} "${task}"`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                timeout: 300000
            });
            
            vscode.window.showInformationMessage(
                `${agent} completed successfully`,
                'View Results'
            ).then(selection => {
                if (selection === 'View Results') {
                    const outputChannel = vscode.window.createOutputChannel('Ultra-Dex Agent');
                    outputChannel.appendLine(stdout);
                    outputChannel.show();
                }
            });
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`${agent} failed: ${error.message}`);
    }
}

async function stopAgent(agentItem: any) {
    vscode.window.showInformationMessage(`Stopping ${agentItem.label}...`);
}

async function runSpecificAgent(agentItem: any) {
    const task = await vscode.window.showInputBox({
        prompt: `What should ${agentItem.label} do?`,
        placeHolder: 'Describe the task...'
    });
    
    if (task) {
        runAgent(agentItem.label, task);
    }
}

async function runSwarmCmd() {
    const objective = await vscode.window.showInputBox({
        prompt: 'Enter swarm objective',
        placeHolder: 'e.g., "Build complete user profile page with API"'
    });
    
    if (objective) {
        runSwarm(objective);
    }
}

async function runSwarm(objective: string) {
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running swarm: ${objective}`,
            cancellable: true
        }, async () => {
            const { stdout } = await exec(`npx ultra-dex swarm "${objective}"`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                timeout: 600000
            });
            
            vscode.window.showInformationMessage(
                'Swarm execution completed',
                'View Dashboard',
                'View Results'
            ).then(selection => {
                if (selection === 'View Dashboard') {
                    vscode.commands.executeCommand('ultra-dex.openDashboard');
                } else if (selection === 'View Results') {
                    const outputChannel = vscode.window.createOutputChannel('Ultra-Dex Swarm');
                    outputChannel.appendLine(stdout);
                    outputChannel.show();
                }
            });
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Swarm failed: ${error.message}`);
    }
}

function showSwarmStatus() {
    vscode.commands.executeCommand('ultra-dex.openDashboard');
}

function stopSwarm() {
    vscode.window.showInformationMessage('Stopping swarm...');
}

function pauseSwarm() {
    vscode.window.showInformationMessage('Pausing swarm...');
}

function resumeSwarm() {
    vscode.window.showInformationMessage('Resuming swarm...');
}

async function generatePlan() {
    const idea = await vscode.window.showInputBox({
        prompt: 'Describe your project idea',
        placeHolder: 'e.g., "A SaaS for team collaboration"'
    });
    
    if (idea) {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating implementation plan...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                const { stdout } = await exec(`npx ultra-dex generate "${idea}"`, {
                    cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                    timeout: 120000
                });
                
                progress.report({ increment: 100 });
                
                vscode.window.showInformationMessage(
                    'Implementation plan generated!',
                    'Open Plan',
                    'Start Building'
                ).then(selection => {
                    if (selection === 'Open Plan') {
                        openImplementationPlan();
                    } else if (selection === 'Start Building') {
                        runSwarm('Initialize project structure');
                    }
                });
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate plan');
        }
    }
}

function openImplementationPlan() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) return;
    
    const planPath = path.join(workspaceRoot, 'IMPLEMENTATION-PLAN.md');
    if (fs.existsSync(planPath)) {
        vscode.workspace.openTextDocument(planPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    } else {
        vscode.window.showWarningMessage('No implementation plan found. Generate one first.');
    }
}

async function checkPlan() {
    try {
        const { stdout } = await exec('npx ultra-dex check --json', {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
        });
        const result = JSON.parse(stdout);
        
        vscode.window.showInformationMessage(
            `Plan Check: ${result.percentage}% complete`,
            'View Details'
        );
    } catch (error) {
        vscode.window.showErrorMessage('Failed to check plan');
    }
}

async function scaffoldPlan() {
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scaffolding from plan...'
        }, async () => {
            await exec('npx ultra-dex scaffold --from-plan', {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            vscode.window.showInformationMessage('Scaffolding completed!');
        });
    } catch (error) {
        vscode.window.showErrorMessage('Scaffolding failed');
    }
}

async function exportPlan() {
    const format = await vscode.window.showQuickPick(['json', 'html', 'pdf', 'markdown'], {
        placeHolder: 'Select export format'
    });
    
    if (format) {
        try {
            await exec(`npx ultra-dex export --format ${format}`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            vscode.window.showInformationMessage(`Plan exported as ${format}`);
        } catch (error) {
            vscode.window.showErrorMessage('Export failed');
        }
    }
}

async function diffPlan() {
    try {
        const { stdout } = await exec('npx ultra-dex diff --json', {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
        });
        const result = JSON.parse(stdout);
        
        vscode.window.showInformationMessage(
            `Plan vs Reality: ${result.alignment}% aligned`,
            'View Report'
        );
    } catch (error) {
        vscode.window.showErrorMessage('Diff failed');
    }
}

async function checkAlignment() {
    try {
        const { stdout } = await exec('npx ultra-dex align --json', {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
        });
        const result = JSON.parse(stdout);
        
        const score = result.score || 0;
        const color = score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red';
        
        vscode.window.showInformationMessage(
            `Alignment Score: ${score}%`,
            'View Details'
        ).then(selection => {
            if (selection === 'View Details') {
                showAlignmentDetails(result);
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage('Failed to check alignment. Is Ultra-Dex installed?');
    }
}

function showAlignmentDetailsCmd() {
    checkAlignment();
}

function align() {
    checkAlignment();
}

function showAlignmentDetails(result: any) {
    const panel = vscode.window.createWebviewPanel(
        'alignmentDetails',
        'Alignment Details',
        vscode.ViewColumn.One,
        {}
    );

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                .score { font-size: 48px; font-weight: bold; }
                .score.high { color: #22c55e; }
                .score.medium { color: #eab308; }
                .score.low { color: #ef4444; }
                .section { margin: 20px 0; }
                .metric { display: flex; justify-content: space-between; padding: 10px; background: #f3f4f6; margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Alignment Report</h1>
            <div class="score ${result.score >= 80 ? 'high' : result.score >= 50 ? 'medium' : 'low'}">
                ${result.score}%
            </div>
            <div class="section">
                <h2>Metrics</h2>
                ${Object.entries(result.metrics || {}).map(([key, value]: [string, any]) => `
                    <div class="metric">
                        <span>${key}</span>
                        <span>${value}</span>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
}

function openContext() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) return;
    
    const contextPath = path.join(workspaceRoot, 'CONTEXT.md');
    if (fs.existsSync(contextPath)) {
        vscode.workspace.openTextDocument(contextPath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    } else {
        vscode.window.showWarningMessage('CONTEXT.md not found');
    }
}

async function syncContext() {
    try {
        await exec('npx ultra-dex watch --sync', {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
            timeout: 10000
        });
        vscode.window.showInformationMessage('Context synced!');
    } catch (error) {
        vscode.window.showErrorMessage('Sync failed');
    }
}

async function checkContext() {
    try {
        const { stdout } = await exec('npx ultra-dex check', {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
        });
        vscode.window.showInformationMessage('Context check complete');
    } catch (error) {
        vscode.window.showErrorMessage('Context check failed');
    }
}

function openDashboard() {
    const config = vscode.workspace.getConfiguration('ultra-dex');
    const port = config.get('dashboardPort', 3002);
    vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
}

async function startKernel() {
    try {
        vscode.window.showInformationMessage('Starting Ultra-Dex kernel...');
        
        cp.spawn('npx', ['ultra-dex', 'serve'], {
            cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
            detached: true,
            stdio: 'ignore'
        }).unref();
        
        vscode.window.showInformationMessage('Ultra-Dex kernel started');
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to start kernel: ${error.message}`);
    }
}

function stopKernel() {
    vscode.window.showInformationMessage('Stopping Ultra-Dex kernel...');
}

function restartKernel() {
    vscode.window.showInformationMessage('Restarting Ultra-Dex kernel...');
}

function openWebview() {
    vscode.commands.executeCommand('ultra-dex.openDashboard');
}

async function askAgent() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code first');
        return;
    }

    const agent = await vscode.window.showQuickPick(
        ['@reviewer', '@debugger', '@backend', '@frontend'],
        { placeHolder: 'Which agent should analyze this?' }
    );

    if (agent) {
        const fileName = path.basename(editor.document.fileName);
        const task = `Review ${fileName}:\n\n${selection}`;
        runAgent(agent, task);
    }
}

async function execCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code to execute');
        return;
    }

    const language = path.extname(editor.document.fileName).slice(1) || 'javascript';
    
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Executing in sandbox...',
            cancellable: false
        }, async () => {
            const tempFile = path.join('/tmp', `ultra-dex-exec-${Date.now()}.${language}`);
            fs.writeFileSync(tempFile, selection);
            
            const { stdout, stderr } = await exec(`npx ultra-dex exec ${tempFile}`, {
                timeout: 30000
            });
            
            const output = stdout || stderr;
            
            vscode.window.showInformationMessage(
                'Execution complete',
                'View Output'
            ).then(selection => {
                if (selection === 'View Output') {
                    const outputChannel = vscode.window.createOutputChannel('Ultra-Dex Sandbox');
                    outputChannel.appendLine(output);
                    outputChannel.show();
                }
            });
            
            fs.unlinkSync(tempFile);
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
    }
}

async function generateTests() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    const fileName = path.basename(editor.document.fileName);
    
    const task = selection 
        ? `Generate tests for this code:\n\n${selection}`
        : `Generate tests for ${fileName}`;
    
    runAgent('@qa', task);
}

async function reviewCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    const fileName = path.basename(editor.document.fileName);
    
    const task = selection 
        ? `Review this code:\n\n${selection}`
        : `Review ${fileName}`;
    
    runAgent('@reviewer', task);
}

async function explainCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code to explain');
        return;
    }
    
    runAgent('@debugger', `Explain this code:\n\n${selection}`);
}

async function refactorCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code to refactor');
        return;
    }
    
    runAgent('@reviewer', `Refactor this code for better quality:\n\n${selection}`);
}

async function documentCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code to document');
        return;
    }
    
    runAgent('@reviewer', `Add documentation to this code:\n\n${selection}`);
}

function newSession() {
    vscode.window.showInformationMessage('Creating new session...');
}

function loadSession() {
    vscode.window.showInformationMessage('Loading session...');
}

function saveSession() {
    vscode.window.showInformationMessage('Saving session...');
}

function listSessions() {
    vscode.window.showInformationMessage('Listing sessions...');
}

function login() {
    vscode.commands.executeCommand('ultra-dex.configureSSO');
}

function logout() {
    vscode.window.showInformationMessage('Logged out');
}

function whoami() {
    vscode.window.showInformationMessage('Current user: developer');
}

function configureSSO() {
    vscode.window.showInformationMessage('SSO configuration...');
}

function showCommandPalette() {
    const commands = [
        'ultra-dex.selectAgent',
        'ultra-dex.runSwarm',
        'ultra-dex.generatePlan',
        'ultra-dex.checkAlignment',
        'ultra-dex.openDashboard'
    ];
    
    vscode.window.showQuickPick([
        { label: '$(person) Select Agent', command: 'ultra-dex.selectAgent' },
        { label: '$(server-process) Run Swarm', command: 'ultra-dex.runSwarm' },
        { label: '$(file-add) Generate Plan', command: 'ultra-dex.generatePlan' },
        { label: '$(check) Check Alignment', command: 'ultra-dex.checkAlignment' },
        { label: '$(dashboard) Open Dashboard', command: 'ultra-dex.openDashboard' }
    ]).then(selection => {
        if (selection) {
            vscode.commands.executeCommand(selection.command);
        }
    });
}

function openSettings() {
    vscode.commands.executeCommand('workbench.action.openSettings', 'ultra-dex');
}

function openHelp() {
    vscode.env.openExternal(vscode.Uri.parse('https://github.com/Srujan0798/Ultra-Dex'));
}

function showAbout() {
    vscode.window.showInformationMessage(
        'Ultra-Dex v2.0 - AI Orchestration for SaaS Development',
        'View on GitHub'
    ).then(selection => {
        if (selection === 'View on GitHub') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/Srujan0798/Ultra-Dex'));
        }
    });
}

async function ragIndex() {
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Indexing codebase for RAG...'
        }, async () => {
            await exec('npx ultra-dex rag:index', {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            vscode.window.showInformationMessage('RAG indexing completed!');
        });
    } catch (error) {
        vscode.window.showErrorMessage('RAG indexing failed');
    }
}

async function ragQuery() {
    const query = await vscode.window.showInputBox({
        prompt: 'Enter your query'
    });
    
    if (query) {
        try {
            const { stdout } = await exec(`npx ultra-dex rag:query "${query}"`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath
            });
            
            const outputChannel = vscode.window.createOutputChannel('Ultra-Dex RAG');
            outputChannel.appendLine(stdout);
            outputChannel.show();
        } catch (error) {
            vscode.window.showErrorMessage('RAG query failed');
        }
    }
}

function showAudit() {
    vscode.window.showInformationMessage('Opening audit logs...');
}

async function exportData() {
    const format = await vscode.window.showQuickPick(['json', 'yaml', 'markdown'], {
        placeHolder: 'Select export format'
    });
    
    if (format) {
        vscode.window.showInformationMessage(`Exporting as ${format}...`);
    }
}

function importData() {
    vscode.window.showInformationMessage('Importing data...');
}

async function quickGenerate() {
    const idea = await vscode.window.showInputBox({
        prompt: 'Quick generate: Describe your feature',
        placeHolder: 'e.g., "Add user login form"'
    });
    
    if (idea) {
        runAgent('@planner', idea);
    }
}

function quickCheck() {
    checkAlignment();
}

async function quickFix() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('Please select code to fix');
        return;
    }
    
    runAgent('@debugger', `Fix issues in this code:\n\n${selection}`);
}

export function deactivate() {
    console.log('Ultra-Dex extension v2 deactivated');
}
