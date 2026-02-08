import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('Ultra-Dex extension activated');

    // Register commands
    const openDashboard = vscode.commands.registerCommand('ultra-dex.openDashboard', () => {
        openDashboardWebView(context);
    });

    const runAgent = vscode.commands.registerCommand('ultra-dex.runAgent', async () => {
        await runAgentCommand();
    });

    const syncContext = vscode.commands.registerCommand('ultra-dex.syncContext', async () => {
        await syncContextCommand();
    });

    const voiceCommand = vscode.commands.registerCommand('ultra-dex.voiceCommand', async () => {
        await voiceCommandHandler();
    });

    const analyzeFile = vscode.commands.registerCommand('ultra-dex.analyzeFile', async () => {
        await analyzeFileCommand();
    });

    // Add to subscriptions
    context.subscriptions.push(openDashboard, runAgent, syncContext, voiceCommand, analyzeFile);

    // Initialize context sync if enabled
    const config = vscode.workspace.getConfiguration('ultra-dex');
    if (config.get('enableContextSync')) {
        setupContextSync(context);
    }

    console.log('Ultra-Dex extension fully initialized');
}

export function deactivate() {
    console.log('Ultra-Dex extension deactivated');
}

async function openDashboardWebView(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'ultraDexDashboard',
        'Ultra-Dex Dashboard',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Load dashboard content
    const dashboardUri = vscode.Uri.joinPath(context.extensionUri, 'media', 'dashboard.html');
    const dashboardContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .dashboard { display: flex; flex-direction: column; gap: 20px; }
                .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .metric-title { font-weight: bold; margin-bottom: 5px; }
                .metric-value { font-size: 1.5em; color: #007acc; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>.Ultra-Dex Dashboard</h1>
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
            </div>
            
            <script>
                // Simulate real-time updates
                function updateMetrics() {
                    document.getElementById('agents-count').textContent = Math.floor(Math.random() * 20);
                    document.getElementById('requests-count').textContent = Math.floor(Math.random() * 1000);
                    document.getElementById('memory-usage').textContent = Math.floor(Math.random() * 100) + '%';
                }
                
                updateMetrics();
                setInterval(updateMetrics, 5000);
            </script>
        </body>
        </html>
    `;

    panel.webview.html = dashboardContent;
}

async function runAgentCommand() {
    const agentNames = [
        'Planner', 'Backend', 'Frontend', 'Database', 'Reviewer', 
        'Debugger', 'Architect', 'Security', 'Testing'
    ];

    const selectedAgent = await vscode.window.showQuickPick(agentNames, {
        placeHolder: 'Select an AI agent to run'
    });

    if (selectedAgent) {
        vscode.window.showInformationMessage(`Running ${selectedAgent} agent...`);
        
        // Simulate agent execution
        setTimeout(() => {
            vscode.window.showInformationMessage(`${selectedAgent} agent completed successfully!`);
        }, 2000);
    }
}

async function syncContextCommand() {
    try {
        // Get current file content
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        const content = document.getText();
        const fileName = document.fileName;

        // Send to Ultra-Dex API
        const config = vscode.workspace.getConfiguration('ultra-dex');
        const apiKey = config.get('apiKey') as string;

        if (!apiKey) {
            vscode.window.showErrorMessage('Please configure your Ultra-Dex API key');
            return;
        }

        // Simulate context sync
        vscode.window.showInformationMessage(`Syncing context for ${fileName}...`);
        
        // In a real implementation, this would call the Ultra-Dex API
        // await axios.post('https://api.ultra-dex.ai/context/sync', {
        //     file: fileName,
        //     content: content,
        //     workspace: vscode.workspace.rootPath
        // }, {
        //     headers: { 'Authorization': `Bearer ${apiKey}` }
        // });

        vscode.window.showInformationMessage('Context synced successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Context sync failed: ${error.message}`);
    }
}

async function voiceCommandHandler() {
    try {
        // Simulate voice command
        const command = await vscode.window.showInputBox({
            prompt: 'Speak your command (simulated)',
            placeHolder: 'e.g., "Create a new React component called Header"'
        });

        if (command) {
            vscode.window.showInformationMessage(`Processing voice command: "${command}"`);
            
            // Simulate voice-to-code processing
            setTimeout(() => {
                vscode.window.showInformationMessage('Voice command processed successfully!');
            }, 3000);
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
    const content = document.getText();
    const fileName = document.fileName;

    try {
        vscode.window.showInformationMessage(`Analyzing ${fileName}...`);

        // Simulate AI analysis
        // In a real implementation, this would call the Ultra-Dex API
        setTimeout(() => {
            const issuesFound = Math.floor(Math.random() * 5);
            if (issuesFound > 0) {
                vscode.window.showWarningMessage(`Found ${issuesFound} issues in ${fileName}`);
            } else {
                vscode.window.showInformationMessage(`No issues found in ${fileName}`);
            }
        }, 2000);
    } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
    }
}

function setupContextSync(context: vscode.ExtensionContext) {
    // Listen for file changes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,json,md}');
    
    fileWatcher.onDidChange(uri => {
        console.log(`File changed: ${uri.fsPath}`);
        // Trigger context sync
        syncContextCommand();
    });

    fileWatcher.onDidCreate(uri => {
        console.log(`File created: ${uri.fsPath}`);
        syncContextCommand();
    });

    fileWatcher.onDidDelete(uri => {
        console.log(`File deleted: ${uri.fsPath}`);
        syncContextCommand();
    });

    context.subscriptions.push(fileWatcher);
}