import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { AgentTreeProvider } from './agentTreeProvider';
import { createAlignmentStatusBar, updateAlignmentStatusBar } from './statusBar';
import { SwarmStatusProvider } from './swarmStatusProvider';
import { QuickActionsProvider } from './quickActionsProvider';
import { ContextPreviewProvider } from './contextPreviewProvider';
import { WebSocketManager } from './websocketManager';

const exec = util.promisify(cp.exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('Ultra-Dex extension activated');

    // Initialize tree providers
    const agentTreeProvider = new AgentTreeProvider();
    const swarmStatusProvider = new SwarmStatusProvider();
    const quickActionsProvider = new QuickActionsProvider();
    const contextPreviewProvider = new ContextPreviewProvider();

    // Register tree data providers
    vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentTreeProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.swarmStatus', swarmStatusProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.quickActions', quickActionsProvider);
    vscode.window.registerTreeDataProvider('ultra-dex.contextPreview', contextPreviewProvider);

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
    });

    // Create status bar
    const statusBarItem = createAlignmentStatusBar();
    context.subscriptions.push(statusBarItem);

    // Register commands
    registerCommands(context, agentTreeProvider, swarmStatusProvider, wsManager);

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
        agentTreeProvider.refresh();
        swarmStatusProvider.refresh();
        refreshAlignmentStatusBar(statusBarItem);
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
}

function registerCommands(
    context: vscode.ExtensionContext, 
    agentTreeProvider: AgentTreeProvider,
    swarmStatusProvider: SwarmStatusProvider,
    wsManager: WebSocketManager
) {
    // Command: Select Agent
    let selectAgentCommand = vscode.commands.registerCommand('ultra-dex.selectAgent', async () => {
        const agents = ['@planner', '@backend', '@frontend', '@database', '@security', '@devops', '@reviewer', '@debugger'];
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
    });

    // Command: Run Swarm
    let runSwarmCommand = vscode.commands.registerCommand('ultra-dex.runSwarm', async () => {
        const objective = await vscode.window.showInputBox({
            prompt: 'Enter swarm objective',
            placeHolder: 'e.g., "Build complete user profile page with API"'
        });
        
        if (objective) {
            runSwarm(objective);
        }
    });

    // Command: Check Alignment
    let checkAlignmentCommand = vscode.commands.registerCommand('ultra-dex.checkAlignment', async () => {
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
    });

    // Command: Generate Plan
    let generatePlanCommand = vscode.commands.registerCommand('ultra-dex.generatePlan', async () => {
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
    });

    // Command: Open Dashboard
    let openDashboardCommand = vscode.commands.registerCommand('ultra-dex.openDashboard', () => {
        const config = vscode.workspace.getConfiguration('ultra-dex');
        const port = config.get('dashboardPort', 3002);
        
        vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
    });

    // Command: Start Kernel
    let startKernelCommand = vscode.commands.registerCommand('ultra-dex.startKernel', () => {
        startKernel();
    });

    // Command: Ask Agent (context menu)
    let askAgentCommand = vscode.commands.registerCommand('ultra-dex.askAgent', async () => {
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
    });

    // Command: Execute in Sandbox
    let execCodeCommand = vscode.commands.registerCommand('ultra-dex.execCode', async () => {
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
                // Save to temp file and execute
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
                
                // Cleanup
                fs.unlinkSync(tempFile);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Execution failed: ${error.message}`);
        }
    });

    // Command: Refresh Agents
    let refreshAgentsCommand = vscode.commands.registerCommand('ultra-dex.refreshAgents', () => {
        agentTreeProvider.refresh();
        vscode.window.showInformationMessage('Agent list refreshed');
    });

    // Command: Run Specific Agent (from tree)
    let runSpecificAgentCommand = vscode.commands.registerCommand('ultra-dex.runSpecificAgent', async (agentItem: any) => {
        const task = await vscode.window.showInputBox({
            prompt: `What should ${agentItem.label} do?`,
            placeHolder: 'Describe the task...'
        });
        
        if (task) {
            runAgent(agentItem.label, task);
        }
    });

    // Command: Stop Agent
    let stopAgentCommand = vscode.commands.registerCommand('ultra-dex.stopAgent', (agentItem: any) => {
        vscode.window.showInformationMessage(`Stopping ${agentItem.label}...`);
        // This would connect to the dashboard API to stop the agent
        // For now, just a UI placeholder
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
        selectAgentCommand,
        runSwarmCommand,
        checkAlignmentCommand,
        generatePlanCommand,
        openDashboardCommand,
        startKernelCommand,
        askAgentCommand,
        execCodeCommand,
        refreshAgentsCommand,
        runSpecificAgentCommand,
        stopAgentCommand
    );
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
                timeout: 300000 // 5 minutes
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

async function runSwarm(objective: string) {
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running swarm: ${objective}`,
            cancellable: true
        }, async () => {
            const { stdout } = await exec(`npx ultra-dex swarm "${objective}"`, {
                cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                timeout: 600000 // 10 minutes
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

async function startKernel() {
    try {
        vscode.window.showInformationMessage('Starting Ultra-Dex kernel...');
        
        // Start in background
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

async function showAlignmentDetails(result: any) {
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

export function deactivate() {
    console.log('Ultra-Dex extension deactivated');
}
