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
exports.QuickActionsProvider = void 0;
const vscode = __importStar(require("vscode"));
const QUICK_ACTIONS = [
    { label: 'Generate Plan', description: 'Create implementation plan with @Planner', icon: 'list-ordered', command: 'ultra-dex.generatePlan' },
    { label: 'Start Build Mode', description: 'Begin implementation workflow', icon: 'tools', command: 'ultra-dex.startBuildMode' },
    { label: 'Run Agent', description: 'Select and run an agent', icon: 'run', command: 'ultra-dex.runAgent' },
    { label: 'Code Review', description: 'Run @Reviewer on changes', icon: 'eye', command: 'ultra-dex.runAgent' },
    { label: 'Open Dashboard', description: 'View project dashboard', icon: 'dashboard', command: 'ultra-dex.openDashboard' },
    { label: 'Verify Checklist', description: 'Run 21-step verification', icon: 'checklist', command: 'ultra-dex.verify' },
];
class QuickActionsProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return Promise.resolve(QUICK_ACTIONS.map(action => new QuickActionItem(action)));
    }
}
exports.QuickActionsProvider = QuickActionsProvider;
class QuickActionItem extends vscode.TreeItem {
    constructor(action) {
        super(action.label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = action.description;
        this.description = '';
        this.iconPath = new vscode.ThemeIcon(action.icon);
        this.command = {
            command: action.command,
            title: action.label,
            arguments: action.command === 'ultra-dex.runAgent' && action.label === 'Code Review' ? ['reviewer'] : []
        };
    }
}
//# sourceMappingURL=QuickActionsView.js.map