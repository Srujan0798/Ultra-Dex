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
exports.ProjectTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const KERNEL_URL = 'http://localhost:3001';
class ProjectTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.state = null;
        // Auto-refresh every 10 seconds if possible
        setInterval(() => this.refresh(), 10000);
    }
    async refresh() {
        try {
            const res = await fetch(`${KERNEL_URL}/api/state`);
            if (res.ok) {
                this.state = await res.json();
                this._onDidChangeTreeData.fire();
            }
        }
        catch {
            // Kernel offline
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.state) {
            return Promise.resolve([new ProjectItem("Kernel Offline", "Start 'ultra-dex serve'", vscode.TreeItemCollapsibleState.None)]);
        }
        if (!element) {
            // Root level: Phases
            return Promise.resolve(this.state.phases.map((phase) => {
                const completed = phase.steps.filter((s) => s.status === 'completed').length;
                const total = phase.steps.length;
                return new ProjectItem(phase.name, `${completed}/${total} steps`, vscode.TreeItemCollapsibleState.Collapsed, 'phase', phase.status);
            }));
        }
        if (element.contextValue === 'phase') {
            const phase = this.state.phases.find((p) => p.name === element.label);
            if (phase) {
                return Promise.resolve(phase.steps.map((step) => {
                    return new ProjectItem(step.task, step.id, vscode.TreeItemCollapsibleState.None, 'step', step.status);
                }));
            }
        }
        return Promise.resolve([]);
    }
}
exports.ProjectTreeProvider = ProjectTreeProvider;
class ProjectItem extends vscode.TreeItem {
    constructor(label, subLabel, collapsibleState, contextValue = 'item', status) {
        super(label, collapsibleState);
        this.label = label;
        this.subLabel = subLabel;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.status = status;
        this.description = subLabel;
        this.tooltip = `${this.label} (${status})`;
        if (status === 'completed') {
            this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('debugIcon.stepOverForeground'));
        }
        else if (status === 'in_progress') {
            this.iconPath = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.cyan'));
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('descriptionForeground'));
        }
    }
}
//# sourceMappingURL=projectTreeProvider.js.map