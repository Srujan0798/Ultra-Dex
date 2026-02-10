/**
 * @fileoverview Extension module
 * @module src/extension
 */

import * as vscode from 'vscode';
import axios from 'axios';
import { spawn } from 'child_process';
import { createServer } from 'net';

let mcpServerProcess: any = null;
let dashboardPanel: vscode.WebviewPanel | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('🎮 Ultra-Dex extension activated');

    // Register commands
    const openDashboard = vscode.commands.registerCommand('ultraDex.openDashboard', () => {
        openDashboardWebView(context);
    });

    const runAgent = vscode.commands.registerCommand('ultraDex.runAgent', async () => {
        await runAgentCommand();
    });

    const syncContext = vscode.commands.registerCommand('ultraDex.syncContext', async () => {
        await syncContextCommand();
    });

    const voiceCommand = vscode.commands.registerCommand('ultraDex.voiceCommand', async () => {
        await voiceCommandHandler();
    });

    const analyzeFile = vscode.commands.registerCommand('ultraDex.analyzeFile', async () => {
        await analyzeFileCommand();
    });

    const startMCP = vscode.commands.registerCommand('ultraDex.startMCP', async () => {
        await startMCPCommand();
    });

    const stopMCP = vscode.commands.registerCommand('ultraDex.stopMCP', async () => {
        await stopMCPCommand();
    });

    const mcpStatus = vscode.commands.registerCommand('ultraDex.mcpStatus', async () => {
        await mcpStatusCommand();
    });

    // Add to subscriptions
    context.subscriptions.push(
        openDashboard,
        runAgent,
        syncContext,
        voiceCommand,
        analyzeFile,
        startMCP,
        stopMCP,
        mcpStatus
    );

    // Initialize context sync if enabled
    const config = vscode.workspace.getConfiguration('ultraDex');
    if (config.get('enableContextSync')) {
        setupContextSync(context);
    }

    // Start MCP server automatically if configured
    if (config.get('autoStartMCP')) {
        await startMCPCommand();
    }

    console.log('✅ Ultra-Dex extension fully initialized');
}

export function deactivate() {
    if (mcpServerProcess) {
        mcpServerProcess.kill();
        console.log('🛑 MCP server stopped');
    }
    console.log('🎮 Ultra-Dex extension deactivated');
}

async function openDashboardWebView(context: vscode.ExtensionContext) {
    if (dashboardPanel) {
        dashboardPanel.reveal();
        return;
    }

    dashboardPanel = vscode.window.createWebviewPanel(
        'ultraDexDashboard',
        'Ultra-Dex Dashboard',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Load dashboard content
    const dashboardContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
                .dashboard { display: flex; flex-direction: column; gap: 20px; }
                .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f8f9fa; }
                .metric-title { font-weight: 600; margin-bottom: 8px; color: #333; }
                .metric-value { font-size: 1.8em; font-weight: 700; color: #007acc; }
                .agent-status { display: flex; align-items: center; gap: 8px; }
                .status-indicator { width: 12px; height: 12px; border-radius: 50%; }
                .status-active { background: #4caf50; }
                .status-idle { background: #ff9800; }
                .status-error { background: #f44336; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>🎮 Ultra-Dex Dashboard</h1>
                
                <div class="metric-card">
                    <div class="metric-title">Active Agents</div>
                    <div class="metric-value" id="agents-count">0</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">AI Requests Today</div>
                    <div class="metric-value" id="requests-count">0</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Memory Usage</div>
                    <div class="metric-value" id="memory-usage">0%</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">System Health</div>
                    <div id="health-status">Checking...</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Active Agents</div>
                    <div id="agents-list">
                        <div class="agent-status">
                            <div class="status-indicator status-active"></div>
                            <span>Planner Agent - Active</span>
                        </div>
                        <div class="agent-status">
                            <div class="status-indicator status-active"></div>
                            <span>Backend Agent - Active</span>
                        </div>
                        <div class="agent-status">
                            <div class="status-indicator status-idle"></div>
                            <span>Frontend Agent - Idle</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // Simulate real-time updates
                function updateMetrics() {
                    document.getElementById('agents-count').textContent = Math.floor(Math.random() * 20);
                    document.getElementById('requests-count').textContent = Math.floor(Math.random() * 1000);
                    document.getElementById('memory-usage').textContent = Math.floor(Math.random() * 100) + '%';
                    
                    // Simulate health status
                    const statuses = ['Healthy', 'Optimal', 'Good', 'Stable'];
                    document.getElementById('health-status').textContent = statuses[Math.floor(Math.random() * statuses.length)];
                }
                
                updateMetrics();
                setInterval(updateMetrics, 5000);
            </script>
        </body>
        </html>
    `;

    dashboardPanel.webview.html = dashboardContent;

    dashboardPanel.onDidDispose(() => {
        dashboardPanel = null;
    });
}

async function runAgentCommand() {
    const agentNames = [
        'Planner', 'Backend', 'Frontend', 'Database', 'Reviewer', 
        'Debugger', 'Architect', 'Security', 'Testing', 'Vision'
    ];

    const selectedAgent = await vscode.window.showQuickPick(agentNames, {
        placeHolder: 'Select an AI agent to run'
    });

    if (selectedAgent) {
        const task = await vscode.window.showInputBox({
            prompt: `Enter task for ${selectedAgent} agent`
        });

        if (task) {
            vscode.window.showInformationMessage(`🤖 Running ${selectedAgent} agent: "${task}"`);
            
            // In a real implementation, this would call the Ultra-Dex CLI
            // For now, we'll simulate
            setTimeout(() => {
                vscode.window.showInformationMessage(`✅ ${selectedAgent} agent completed: "${task}"`);
            }, 3000);
        }
    }
}

async function syncContextCommand() {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        const content = document.getText();
        const fileName = document.fileName;

        // Call Ultra-Dex CLI to sync context
        const terminal = vscode.window.createTerminal('Ultra-Dex');
        terminal.show();
        terminal.sendText(`npx ultra-dex sync --file "${fileName}"`);
        
        vscode.window.showInformationMessage(`🔄 Syncing context for ${fileName}...`);
    } catch (error) {
        vscode.window.showErrorMessage(`Context sync failed: ${error.message}`);
    }
}

async function voiceCommandHandler() {
    try {
        // In a real implementation, this would use the system's voice recognition
        // For now, we'll simulate with a text input
        const command = await vscode.window.showInputBox({
            prompt: 'Enter voice command (simulated)',
            placeHolder: 'e.g., "Create a login component with validation"'
        });

        if (command) {
            vscode.window.showInformationMessage(`🎤 Processing voice command: "${command}"`);
            
            // Call Ultra-Dex voice command
            const terminal = vscode.window.createTerminal('Ultra-Dex');
            terminal.show();
            terminal.sendText(`npx ultra-dex voice "${command}"`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Voice command failed: ${error.message}`);
    }
}

async function analyzeFileCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const document = editor.document;
    const fileName = document.fileName;

    try {
        vscode.window.showInformationMessage(`🔍 Analyzing ${fileName}...`);
        
        // Call Ultra-Dex analysis command
        const terminal = vscode.window.createTerminal('Ultra-Dex');
        terminal.show();
        terminal.sendText(`npx ultra-dex analyze "${fileName}"`);
    } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
    }
}

async function startMCPCommand() {
    try {
        const config = vscode.workspace.getConfiguration('ultraDex');
        const port = config.get('mcpPort', 3002);

        // Check if port is available
        const portAvailable = await checkPortAvailability(port);
        if (!portAvailable) {
            vscode.window.showErrorMessage(`Port ${port} is already in use`);
            return;
        }

        // Start MCP server via Ultra-Dex CLI
        mcpServerProcess = spawn('npx', ['ultra-dex', 'mcp', 'start', '--port', port.toString()], {
            cwd: vscode.workspace.rootPath || process.cwd(),
            stdio: 'pipe'
        });

        mcpServerProcess.on('error', (error: any) => {
            console.error('MCP server error:', error);
            vscode.window.showErrorMessage(`MCP server failed to start: ${error.message}`);
        });

        mcpServerProcess.on('close', (code: any) => {
            console.log(`MCP server exited with code ${code}`);
            mcpServerProcess = null;
        });

        // Wait a bit for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        vscode.window.showInformationMessage(`🔌 MCP server started on port ${port}`);
        console.log(`✅ MCP server started on port ${port}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
    }
}

async function stopMCPCommand() {
    if (mcpServerProcess) {
        mcpServerProcess.kill();
        mcpServerProcess = null;
        vscode.window.showInformationMessage('🛑 MCP server stopped');
        console.log('🛑 MCP server stopped');
    } else {
        vscode.window.showInformationMessage('MCP server is not running');
    }
}

async function mcpStatusCommand() {
    if (mcpServerProcess) {
        vscode.window.showInformationMessage('🟢 MCP server is running');
    } else {
        vscode.window.showInformationMessage('🔴 MCP server is not running');
    }
}

async function checkPortAvailability(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = createServer();
        
        server.listen(port, () => {
            server.close(() => {
                resolve(true);
            });
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

function setupContextSync(context: vscode.ExtensionContext) {
    // Listen for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,py,go,rs,json,md}');
    
    fileWatcher.onDidChange(uri => {
        console.log(`🔄 File changed: ${uri.fsPath}`);
        // Trigger context sync
        if (vscode.workspace.getConfiguration('ultraDex').get('enableContextSync')) {
            syncContextCommand();
        }
    });

    fileWatcher.onDidCreate(uri => {
        console.log(`➕ File created: ${uri.fsPath}`);
        if (vscode.workspace.getConfiguration('ultraDex').get('enableContextSync')) {
            syncContextCommand();
        }
    });

    fileWatcher.onDidDelete(uri => {
        console.log(`➖ File deleted: ${uri.fsPath}`);
        if (vscode.workspace.getConfiguration('ultraDex').get('enableContextSync')) {
            syncContextCommand();
        }
    });

    context.subscriptions.push(fileWatcher);
}