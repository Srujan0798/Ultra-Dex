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
exports.askAgent = askAgent;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
async function askAgent(agentName) {
    if (!agentName) {
        // Show quick pick
        const agents = [
            'planner', 'cto', 'backend', 'frontend', 'database',
            'auth', 'security', 'testing', 'reviewer', 'devops'
        ];
        agentName = await vscode.window.showQuickPick(agents, {
            placeHolder: 'Select an AI Agent'
        });
    }
    if (!agentName)
        return;
    // Get project context
    const rootPath = vscode.workspace.rootPath;
    if (!rootPath) {
        vscode.window.showErrorMessage('Open a project folder first.');
        return;
    }
    // Try to read agent file
    const agentFile = path.join(rootPath, 'agents', `${agentName}.md`);
    // Fallback logic could be complex, keeping it simple for now
    // Assuming agent structure is flat or mapped.
    // Let's rely on the CLI 'agent' command logic conceptually but implementing simple read here.
    // Or we can execute the CLI command.
    // For extension, let's just copy a template prompt.
    const prompt = `You are @${agentName.charAt(0).toUpperCase() + agentName.slice(1)}.
Role: Specialized AI Agent for Ultra-Dex.

Current Task: [Describe task]

Context:
[Paste CONTEXT.md here]

Plan:
[Paste IMPLEMENTATION-PLAN.md here]
`;
    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage(`Prompt for @${agentName} copied to clipboard!`);
}
//# sourceMappingURL=askAgent.js.map