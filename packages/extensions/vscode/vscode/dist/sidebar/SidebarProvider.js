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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const AGENTS = [
    { id: 'cto', label: 'CTO', icon: '🧠' },
    { id: 'planner', label: 'Planner', icon: '🗺️' },
    { id: 'backend', label: 'Backend', icon: '🧱' },
    { id: 'frontend', label: 'Frontend', icon: '🎨' },
    { id: 'database', label: 'Database', icon: '🗄️' },
    { id: 'reviewer', label: 'Reviewer', icon: '🧪' },
    { id: 'debugger', label: 'Debugger', icon: '🧯' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'devops', label: 'DevOps', icon: '⚙️' },
    { id: 'docs', label: 'Docs', icon: '📚' },
    { id: 'vision', label: 'Vision', icon: '👁️' },
    { id: 'tester', label: 'Tester', icon: '✅' },
    { id: 'architect', label: 'Architect', icon: '🏗️' },
    { id: 'cloud', label: 'Cloud', icon: '☁️' },
    { id: 'sre', label: 'SRE', icon: '📈' },
    { id: 'agent', label: 'Agent', icon: '🤖' },
];
class SidebarProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return Promise.resolve(AGENTS.map((agent) => new AgentTreeItem(agent.label, agent.icon)));
    }
}
exports.SidebarProvider = SidebarProvider;
class AgentTreeItem extends vscode.TreeItem {
    constructor(label, icon) {
        super(`${icon} ${label}`, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${label} agent`;
        this.contextValue = 'agent';
    }
}
