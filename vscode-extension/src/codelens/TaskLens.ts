/**
 * CodeLens Provider for Implementation Plan Tasks
 * Shows task status above functions and provides quick actions
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TaskInfo {
    title: string;
    section: string;
    status: 'not_started' | 'in_progress' | 'completed';
    line: number;
}

export class TaskCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private tasks: Map<string, TaskInfo[]> = new Map();
    private planPath: string;

    constructor(workspaceRoot: string | undefined) {
        this.planPath = workspaceRoot ? path.join(workspaceRoot, 'IMPLEMENTATION-PLAN.md') : '';
        this.loadTasks();

        // Watch for changes to the implementation plan
        if (workspaceRoot) {
            const watcher = vscode.workspace.createFileSystemWatcher('**/IMPLEMENTATION-PLAN.md');
            watcher.onDidChange(() => this.loadTasks());
            watcher.onDidCreate(() => this.loadTasks());
        }
    }

    /**
     * Load tasks from IMPLEMENTATION-PLAN.md
     */
    private loadTasks() {
        if (!fs.existsSync(this.planPath)) {
            return;
        }

        try {
            const content = fs.readFileSync(this.planPath, 'utf8');
            this.parseTasks(content);
            this._onDidChangeCodeLenses.fire();
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    /**
     * Parse tasks from plan content
     */
    private parseTasks(content: string) {
        this.tasks.clear();
        const lines = content.split('\n');
        let currentSection = '';
        let inTaskList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Track sections
            if (line.startsWith('## ')) {
                currentSection = line.replace('## ', '').trim();
                inTaskList = false;
                continue;
            }

            // Check for task items
            const taskMatch = line.match(/^(\s*)- \[(.)\]\s*(.+)/);
            if (taskMatch) {
                const indent = taskMatch[1];
                const checkbox = taskMatch[2];
                const title = taskMatch[3];

                let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
                if (checkbox.toLowerCase() === 'x') status = 'completed';
                else if (checkbox === '~') status = 'in_progress';

                const taskInfo: TaskInfo = {
                    title,
                    section: currentSection,
                    status,
                    line: i
                };

                // Extract function/class name from task
                const functionMatch = title.match(/(?:function|method|class)\s+(\w+)|(\w+)\s*(?:function|method)/i);
                if (functionMatch) {
                    const name = functionMatch[1] || functionMatch[2];
                    if (!this.tasks.has(name)) {
                        this.tasks.set(name, []);
                    }
                    this.tasks.get(name)!.push(taskInfo);
                }
            }
        }
    }

    /**
     * Provide CodeLenses for a document
     */
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (token.isCancellationRequested) {
                break;
            }

            const line = lines[i];
            
            // Match function declarations
            const functionMatch = line.match(/(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                const tasks = this.tasks.get(functionName);
                
                if (tasks && tasks.length > 0) {
                    const task = tasks[0]; // Use first matching task
                    const range = new vscode.Range(i, 0, i, line.length);
                    
                    // Create CodeLens with status
                    const codeLens = new vscode.CodeLens(range, {
                        title: this.getStatusIcon(task.status) + ' ' + task.title.substring(0, 40),
                        tooltip: `${task.section}\nStatus: ${task.status}`,
                        command: 'ultra-dex.showTaskDetails',
                        arguments: [task]
                    });

                    codeLenses.push(codeLens);

                    // Add action buttons
                    if (task.status !== 'completed') {
                        const updateLens = new vscode.CodeLens(range, {
                            title: '$(check) Complete',
                            tooltip: 'Mark task as completed',
                            command: 'ultra-dex.updateTaskStatus',
                            arguments: [task, 'completed']
                        });
                        codeLenses.push(updateLens);
                    }

                    if (task.status === 'not_started') {
                        const startLens = new vscode.CodeLens(range, {
                            title: '$(play) Start',
                            tooltip: 'Mark task as in progress',
                            command: 'ultra-dex.updateTaskStatus',
                            arguments: [task, 'in_progress']
                        });
                        codeLenses.push(startLens);
                    }
                }
            }

            // Match class declarations
            const classMatch = line.match(/(?:export\s+(?:default\s+)?)?class\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[1];
                const tasks = this.tasks.get(className);
                
                if (tasks && tasks.length > 0) {
                    const task = tasks[0];
                    const range = new vscode.Range(i, 0, i, line.length);
                    
                    const codeLens = new vscode.CodeLens(range, {
                        title: this.getStatusIcon(task.status) + ' ' + task.title.substring(0, 40),
                        tooltip: `${task.section}\nStatus: ${task.status}`,
                        command: 'ultra-dex.showTaskDetails',
                        arguments: [task]
                    });

                    codeLenses.push(codeLens);
                }
            }
        }

        return codeLenses;
    }

    /**
     * Get status icon
     */
    private getStatusIcon(status: string): string {
        switch (status) {
            case 'completed': return '$(check)';
            case 'in_progress': return '$(sync~spin)';
            default: return '$(circle-outline)';
        }
    }

    /**
     * Refresh the CodeLenses
     */
    refresh() {
        this.loadTasks();
    }
}

/**
 * Show task details command
 */
export async function showTaskDetails(task: TaskInfo) {
    const items = [
        `Section: ${task.section}`,
        `Status: ${task.status}`,
        `Line: ${task.line + 1}`
    ];

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: task.title
    });
}

/**
 * Update task status command
 */
export async function updateTaskStatus(task: TaskInfo, newStatus: 'not_started' | 'in_progress' | 'completed') {
    // This would update the IMPLEMENTATION-PLAN.md file
    // For now, show a notification
    const statusText = newStatus === 'completed' ? 'completed' : 
                       newStatus === 'in_progress' ? 'in progress' : 'not started';
    
    vscode.window.showInformationMessage(
        `Task marked as ${statusText}: ${task.title}`,
        'Open Plan'
    ).then(selection => {
        if (selection === 'Open Plan') {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (workspaceRoot) {
                const planPath = path.join(workspaceRoot, 'IMPLEMENTATION-PLAN.md');
                vscode.workspace.openTextDocument(planPath).then(doc => {
                    vscode.window.showTextDocument(doc).then(editor => {
                        // Go to the task line
                        const position = new vscode.Position(task.line, 0);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position));
                    });
                });
            }
        }
    });
}
