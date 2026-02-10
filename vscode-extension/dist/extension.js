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
const SidebarProvider_1 = require("./sidebar/SidebarProvider");
const HoverProvider_1 = require("./providers/HoverProvider");
const child_process_1 = require("child_process");
function activate(context) {
    const sidebar = new SidebarProvider_1.SidebarProvider(context);
    vscode.window.registerTreeDataProvider('ultraDexSidebar', sidebar);
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.openContext', async () => {
        const files = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
        if (!files.length) {
            vscode.window.showWarningMessage('CONTEXT.md not found.');
            return;
        }
        const doc = await vscode.workspace.openTextDocument(files[0]);
        await vscode.window.showTextDocument(doc);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ultra-dex.generate', async () => {
        const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        (0, child_process_1.exec)('ultra-dex plan', { cwd }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(stderr || err.message);
                return;
            }
            vscode.window.showInformationMessage('Ultra-Dex plan generated.');
        });
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file' }, new HoverProvider_1.ContextHoverProvider()));
}
function deactivate() { }
