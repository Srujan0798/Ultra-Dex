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
exports.AgentsProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class AgentsProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No project open');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve([]);
        }
        // Try to read state
        let activeAgents = [];
        try {
            const statePath = path.join(this.workspaceRoot, '.ultra', 'state.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                if (state.agents && state.agents.active) {
                    activeAgents = state.agents.active;
                }
            }
        }
        catch (e) {
            // ignore
        }
        // List of agents
        const agents = [
            { name: 'Orchestrator', role: 'Meta-Layer', icon: 'hubot' },
            { name: 'Planner', role: 'Leadership', icon: 'list-unordered' },
            { name: 'CTO', role: 'Leadership', icon: 'server-process' },
            { name: 'Backend', role: 'Development', icon: 'server' },
            { name: 'Frontend', role: 'Development', icon: 'layout' },
            { name: 'Database', role: 'Development', icon: 'database' },
            { name: 'Auth', role: 'Security', icon: 'lock' },
            { name: 'Security', role: 'Security', icon: 'shield' },
            { name: 'Testing', role: 'Quality', icon: 'beaker' },
            { name: 'Reviewer', role: 'Quality', icon: 'eye' },
            { name: 'DevOps', role: 'DevOps', icon: 'rocket' }
        ];
        return Promise.resolve(agents.map(agent => {
            const isActive = activeAgents.includes(agent.name.toLowerCase());
            return new AgentItem(`@${agent.name}`, agent.role, isActive ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None, isActive, {
                command: 'ultra-dex.selectAgent',
                title: 'Select Agent',
                arguments: [agent.name.toLowerCase()]
            });
        }));
    }
}
exports.AgentsProvider = AgentsProvider;
class AgentItem extends vscode.TreeItem {
    constructor(label, role, collapsibleState, isActive, command) {
        super(label, collapsibleState);
        this.label = label;
        this.role = role;
        this.collapsibleState = collapsibleState;
        this.isActive = isActive;
        this.command = command;
        this.tooltip = `${this.label} - ${this.role}`;
        this.description = this.isActive ? `${this.role} (Active)` : this.role;
        // Use built-in icons, highlight if active
        this.iconPath = new vscode.ThemeIcon(this.isActive ? 'pulse' : 'circle-filled', this.isActive ? new vscode.ThemeColor('charts.green') : undefined);
    }
}
//# sourceMappingURL=AgentsView.js.map