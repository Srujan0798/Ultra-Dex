import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function injectContext(textEditor?: vscode.TextEditor) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const contextPath = path.join(workspaceRoot, 'CONTEXT.md');
    const implPlanPath = path.join(workspaceRoot, 'IMPLEMENTATION-PLAN.md');

    // Get current selection or entire file
    let content = '';
    let source = 'file';

    if (textEditor && textEditor.selection && !textEditor.selection.isEmpty) {
        content = textEditor.document.getText(textEditor.selection);
        source = 'selection';
    } else if (textEditor) {
        content = textEditor.document.getText();
        source = textEditor.document.fileName;
    }

    if (!content) {
        vscode.window.showWarningMessage('No content to inject');
        return;
    }

    // Check which file to inject into
    const options = [];
    if (fs.existsSync(contextPath)) {
        options.push({ label: 'CONTEXT.md', path: contextPath });
    }
    if (fs.existsSync(implPlanPath)) {
        options.push({ label: 'IMPLEMENTATION-PLAN.md', path: implPlanPath });
    }

    if (options.length === 0) {
        // Create CONTEXT.md if it doesn't exist
        fs.writeFileSync(contextPath, `# Project Context\n\n## Injected Code\n\n\`\`\`\n${content}\n\`\`\`\n`);
        vscode.window.showInformationMessage('Created CONTEXT.md with injected content');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        options.map(o => o.label),
        { placeHolder: 'Select file to inject into' }
    );

    if (!selected) return;

    const targetFile = options.find(o => o.label === selected)!;
    const existingContent = fs.readFileSync(targetFile.path, 'utf8');

    const timestamp = new Date().toISOString();
    const injection = `\n\n---\n## Injected Context (${timestamp})\nSource: ${source}\n\n\`\`\`\n${content}\n\`\`\`\n`;

    fs.writeFileSync(targetFile.path, existingContent + injection);
    vscode.window.showInformationMessage(`Injected ${content.length} characters into ${selected}`);
}

export async function extractContext() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folder open');
        return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const contextPath = path.join(workspaceRoot, 'CONTEXT.md');

    if (!fs.existsSync(contextPath)) {
        vscode.window.showWarningMessage('No CONTEXT.md found');
        return;
    }

    const content = fs.readFileSync(contextPath, 'utf8');

    // Open in new editor
    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
}

export async function watchContext() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const contextPath = path.join(workspaceRoot, 'CONTEXT.md');

    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRoot, 'CONTEXT.md')
    );

    watcher.onDidChange(() => {
        vscode.window.showInformationMessage('CONTEXT.md updated');
    });

    watcher.onDidCreate(() => {
        vscode.window.showInformationMessage('CONTEXT.md created');
    });

    watcher.onDidDelete(() => {
        vscode.window.showWarningMessage('CONTEXT.md deleted');
    });

    return watcher;
}
