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
exports.PlanHoverProvider = exports.ContextHoverProvider = exports.AgentHoverProvider = void 0;
exports.registerHoverProviders = registerHoverProviders;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const AgentsView_1 = require("../sidebar/AgentsView");
// Agent mention hover provider - shows description when hovering over @agent mentions
class AgentHoverProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /@[A-Za-z]+/);
        if (!range)
            return null;
        const word = document.getText(range);
        const agentName = word.replace('@', '').toLowerCase();
        const agent = AgentsView_1.ALL_AGENTS.find(a => a.name.toLowerCase() === agentName);
        if (!agent)
            return null;
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`## 🤖 @${agent.name}\n\n`);
        markdown.appendMarkdown(`**Tier:** ${agent.tier}\n\n`);
        markdown.appendMarkdown(`**Role:** ${agent.description}\n\n`);
        markdown.appendMarkdown(`---\n\n`);
        markdown.appendMarkdown(`📁 \`agents/${agent.file}\`\n\n`);
        markdown.appendMarkdown(`[Copy Prompt](command:ultra-dex.copyAgentPrompt?${encodeURIComponent(JSON.stringify([agent, this.workspaceRoot]))})`);
        markdown.isTrusted = true;
        return new vscode.Hover(markdown, range);
    }
}
exports.AgentHoverProvider = AgentHoverProvider;
// CONTEXT.md reference hover provider - shows preview of referenced sections
class ContextHoverProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    provideHover(document, position) {
        // Match CONTEXT.md references like "See CONTEXT.md" or "CONTEXT.md#section"
        const lineText = document.lineAt(position.line).text;
        // Check for CONTEXT.md mention
        const contextMatch = lineText.match(/CONTEXT\.md(#[\w-]+)?/i);
        if (!contextMatch)
            return null;
        const matchStart = lineText.indexOf(contextMatch[0]);
        const matchEnd = matchStart + contextMatch[0].length;
        if (position.character < matchStart || position.character > matchEnd)
            return null;
        const range = new vscode.Range(position.line, matchStart, position.line, matchEnd);
        if (!this.workspaceRoot)
            return null;
        try {
            const contextPath = path.join(this.workspaceRoot, 'CONTEXT.md');
            if (!fs.existsSync(contextPath))
                return null;
            let content = fs.readFileSync(contextPath, 'utf-8');
            const section = contextMatch[1]?.replace('#', '');
            if (section) {
                // Extract specific section
                const sectionRegex = new RegExp(`^##\\s*\\d*\\.?\\s*${section}[\\s\\S]*?(?=^##|$)`, 'mi');
                const sectionMatch = content.match(sectionRegex);
                content = sectionMatch ? sectionMatch[0] : `Section "${section}" not found`;
            }
            else {
                // Show first 500 chars preview
                content = content.substring(0, 500) + (content.length > 500 ? '\n\n...' : '');
            }
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`## 📋 CONTEXT.md Preview\n\n`);
            markdown.appendMarkdown('```markdown\n' + content + '\n```');
            markdown.isTrusted = true;
            return new vscode.Hover(markdown, range);
        }
        catch {
            return null;
        }
    }
}
exports.ContextHoverProvider = ContextHoverProvider;
// Implementation plan hover provider
class PlanHoverProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    provideHover(document, position) {
        const lineText = document.lineAt(position.line).text;
        const planMatch = lineText.match(/IMPLEMENTATION-PLAN\.md/i);
        if (!planMatch)
            return null;
        const matchStart = lineText.indexOf(planMatch[0]);
        const matchEnd = matchStart + planMatch[0].length;
        if (position.character < matchStart || position.character > matchEnd)
            return null;
        const range = new vscode.Range(position.line, matchStart, position.line, matchEnd);
        if (!this.workspaceRoot)
            return null;
        try {
            const planPath = path.join(this.workspaceRoot, 'IMPLEMENTATION-PLAN.md');
            if (!fs.existsSync(planPath))
                return null;
            let content = fs.readFileSync(planPath, 'utf-8');
            content = content.substring(0, 600) + (content.length > 600 ? '\n\n...' : '');
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`## 📝 Implementation Plan Preview\n\n`);
            markdown.appendMarkdown('```markdown\n' + content + '\n```');
            markdown.isTrusted = true;
            return new vscode.Hover(markdown, range);
        }
        catch {
            return null;
        }
    }
}
exports.PlanHoverProvider = PlanHoverProvider;
function registerHoverProviders(context, workspaceRoot) {
    // Register for all file types
    const selector = { scheme: 'file' };
    context.subscriptions.push(vscode.languages.registerHoverProvider(selector, new AgentHoverProvider(workspaceRoot)), vscode.languages.registerHoverProvider(selector, new ContextHoverProvider(workspaceRoot)), vscode.languages.registerHoverProvider(selector, new PlanHoverProvider(workspaceRoot)));
}
//# sourceMappingURL=hoverProvider.js.map