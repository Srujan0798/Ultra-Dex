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
const askAgent_1 = require("./commands/askAgent");
const verify_1 = require("./commands/verify");
function activate(context) {
    console.log('Ultra-Dex extension is now active!');
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    // Register Sidebar Views
    const agentsProvider = new AgentsView_1.AgentsProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.agentExplorer', agentsProvider);
    const contextProvider = new ContextView_1.ContextProvider(rootPath);
    vscode.window.registerTreeDataProvider('ultra-dex.contextView', contextProvider);
    const verifyProvider = new VerifyView_1.VerifyProvider(rootPath);
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
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.selectAgent', (name) => {
        (0, askAgent_1.askAgent)(name);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.askAgent', () => {
        (0, askAgent_1.askAgent)();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.verify', () => {
        (0, verify_1.verifyCommand)();
    }));
    // GOD MODE COMMANDS
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
function deactivate() { }
//# sourceMappingURL=extension.js.map