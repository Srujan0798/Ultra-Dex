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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ContextHoverProvider {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    provideHover(document, position, token) {
        if (!this.rootPath)
            return null;
        const range = document.getWordRangeAtPosition(position, /CONTEXT\.md|IMPLEMENTATION-PLAN\.md/);
        if (!range)
            return null;
        const fileName = document.getText(range);
        const filePath = path.join(this.rootPath, fileName === 'CONTEXT.md' ? 'CONTEXT.md' : 'docs/IMPLEMENTATION-PLAN.md');
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Get first 500 chars or summary
            const preview = content.slice(0, 500) + '...';
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${fileName} Preview**\n\n`);
            markdown.appendCodeblock(preview, 'markdown');
            return new vscode.Hover(markdown);
        }
        return null;
    }
}
exports.ContextHoverProvider = ContextHoverProvider;
//# sourceMappingURL=hoverProvider.js.map