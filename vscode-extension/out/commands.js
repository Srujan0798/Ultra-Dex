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
exports.registerCommands = registerCommands;
exports.refreshAlignmentStatus = refreshAlignmentStatus;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const statusBar_1 = require("./statusBar");
function registerCommands(context, workspaceRoot) {
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.selectAgent', async (agent) => {
        if (!agent || !workspaceRoot) {
            vscode.window.showWarningMessage('No agent selected.');
            return;
        }
        const prompt = await readAgentPrompt(workspaceRoot, agent.filePath);
        if (!prompt) {
            vscode.window.showErrorMessage(`Unable to load prompt for ${agent.name}.`);
            return;
        }
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage(`${agent.name} prompt copied to clipboard.`);
    }), vscode.commands.registerCommand('ultra-dex.checkAlignment', async () => {
        const score = await getAlignmentScore(workspaceRoot);
        (0, statusBar_1.updateAlignmentStatusBar)(score);
        vscode.window.showInformationMessage(`Alignment score: ${score}`);
    }), vscode.commands.registerCommand('ultra-dex.generatePlan', async () => {
        vscode.window.showInformationMessage('Generate plan: Use @Planner with the Implementation Template.');
    }), vscode.commands.registerCommand('ultra-dex.askAgent', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage('Select code to ask an agent.');
            return;
        }
        const selection = editor.document.getText(editor.selection);
        const prompt = `Ask an Ultra-Dex agent about the following selection:\n\n${selection}`;
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage('Selection copied to clipboard with prompt.');
    }));
}
async function refreshAlignmentStatus(workspaceRoot) {
    const score = await getAlignmentScore(workspaceRoot);
    (0, statusBar_1.updateAlignmentStatusBar)(score);
}
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
    if (!workspaceRoot) {
        return 'Unknown';
    }
    const filePath = path.join(workspaceRoot, 'CONTEXT.md');
    try {
        const data = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        const content = Buffer.from(data).toString('utf8');
        const match = content.match(/alignment\s*score\s*:\s*(\d+%?)/i);
        return match?.[1] ?? 'Unknown';
    }
    catch {
        return 'Unknown';
    }
}
//# sourceMappingURL=commands.js.map