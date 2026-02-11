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
exports.ContextHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function extractSection(content, sectionRef) {
    const headingPattern = new RegExp(`^##?\\s+.*${escapeRegExp(sectionRef)}.*$`, 'im');
    const match = headingPattern.exec(content);
    if (!match)
        return null;
    const start = match.index;
    const rest = content.slice(start);
    const firstBreak = rest.indexOf('\n');
    if (firstBreak < 0)
        return rest.trim();
    const body = rest.slice(firstBreak + 1);
    const nextHeadingOffset = body.search(/^##?\\s+/m);
    const end = nextHeadingOffset >= 0 ? firstBreak + 1 + nextHeadingOffset : rest.length;
    return rest.slice(0, end).trim();
}
function findTokenAtPosition(lineText, character, pattern) {
    const matcher = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match = matcher.exec(lineText);
    while (match) {
        const start = match.index;
        const end = start + match[0].length;
        if (character >= start && character <= end) {
            return match[0];
        }
        match = matcher.exec(lineText);
    }
    return null;
}
class ContextHoverProvider {
    async provideHover(document, position) {
        const line = document.lineAt(position.line).text;
        const agentToken = findTokenAtPosition(line, position.character, /@[A-Za-z0-9_-]+/);
        const sectionToken = findTokenAtPosition(line, position.character, /Section\s+\d+(\.\d+)?/i);
        if (!agentToken && !sectionToken)
            return;
        const contextFiles = await vscode.workspace.findFiles('**/CONTEXT.md', '**/node_modules/**', 1);
        if (!contextFiles.length)
            return;
        const contextDoc = await vscode.workspace.openTextDocument(contextFiles[0]);
        const content = contextDoc.getText();
        if (agentToken) {
            const agentName = agentToken.slice(1);
            return new vscode.Hover(`Ultra-Dex agent: **${agentName}**`);
        }
        if (sectionToken) {
            const section = extractSection(content, sectionToken);
            if (section) {
                return new vscode.Hover(new vscode.MarkdownString(section));
            }
        }
        return;
    }
}
exports.ContextHoverProvider = ContextHoverProvider;
