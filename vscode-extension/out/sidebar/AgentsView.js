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
exports.ALL_AGENTS = exports.AgentItem = exports.AgentsProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// All 16 Ultra-Dex agents organized by tier
const ALL_AGENTS = [
    // 0. Meta Orchestration
    { name: 'Orchestrator', tier: 'Meta', description: 'Coordinate all agents for complete features', icon: 'hubot', file: '0-orchestration/orchestrator.md' },
    // 1. Leadership
    { name: 'CTO', tier: 'Leadership', description: 'Architecture & tech stack decisions', icon: 'server-process', file: '1-leadership/cto.md' },
    { name: 'Planner', tier: 'Leadership', description: 'Task breakdown & sprint planning', icon: 'list-ordered', file: '1-leadership/planner.md' },
    { name: 'Research', tier: 'Leadership', description: 'Technology evaluation & comparison', icon: 'search', file: '1-leadership/research.md' },
    // 2. Development
    { name: 'Backend', tier: 'Development', description: 'API & server implementation', icon: 'server', file: '2-development/backend.md' },
    { name: 'Database', tier: 'Development', description: 'Schema design & query optimization', icon: 'database', file: '2-development/database.md' },
    { name: 'Frontend', tier: 'Development', description: 'UI & component implementation', icon: 'browser', file: '2-development/frontend.md' },
    // 3. Security
    { name: 'Auth', tier: 'Security', description: 'Authentication & authorization', icon: 'lock', file: '3-security/auth.md' },
    { name: 'Security', tier: 'Security', description: 'Security audits & vulnerability fixes', icon: 'shield', file: '3-security/security.md' },
    // 4. DevOps
    { name: 'DevOps', tier: 'DevOps', description: 'Deployment & infrastructure', icon: 'rocket', file: '4-devops/devops.md' },
    // 5. Quality
    { name: 'Debugger', tier: 'Quality', description: 'Bug investigation & fixes', icon: 'bug', file: '5-quality/debugger.md' },
    { name: 'Documentation', tier: 'Quality', description: 'Technical writing & docs maintenance', icon: 'book', file: '5-quality/documentation.md' },
    { name: 'Reviewer', tier: 'Quality', description: 'Code review & quality checks', icon: 'eye', file: '5-quality/reviewer.md' },
    { name: 'Testing', tier: 'Quality', description: 'QA & test automation', icon: 'beaker', file: '5-quality/testing.md' },
    // 6. Specialist
    { name: 'Performance', tier: 'Specialist', description: 'Performance optimization', icon: 'dashboard', file: '6-specialist/performance.md' },
    { name: 'Refactoring', tier: 'Specialist', description: 'Code quality & design patterns', icon: 'wand', file: '6-specialist/refactoring.md' },
];
exports.ALL_AGENTS = ALL_AGENTS;
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
        // If no element, return tier groups
        if (!element) {
            const tiers = ['Meta', 'Leadership', 'Development', 'Security', 'DevOps', 'Quality', 'Specialist'];
            return Promise.resolve(tiers.map(tier => new TierItem(tier)));
        }
        // If tier element, return agents in that tier
        if (element instanceof TierItem) {
            const activeAgents = this.getActiveAgents();
            const tierAgents = ALL_AGENTS.filter(a => a.tier === element.tier);
            return Promise.resolve(tierAgents.map(agent => {
                const isActive = activeAgents.includes(agent.name.toLowerCase());
                return new AgentItem(agent, isActive, this.workspaceRoot);
            }));
        }
        return Promise.resolve([]);
    }
    getActiveAgents() {
        if (!this.workspaceRoot)
            return [];
        try {
            const statePath = path.join(this.workspaceRoot, '.ultra', 'state.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                if (state.agents && state.agents.active) {
                    return state.agents.active;
                }
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    getAgentByName(name) {
        return ALL_AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
    }
}
exports.AgentsProvider = AgentsProvider;
class TierItem extends vscode.TreeItem {
    constructor(tier) {
        super(tier, vscode.TreeItemCollapsibleState.Expanded);
        this.tier = tier;
        this.contextValue = 'tier';
        const tierIcons = {
            'Meta': 'symbol-misc',
            'Leadership': 'organization',
            'Development': 'code',
            'Security': 'shield',
            'DevOps': 'rocket',
            'Quality': 'verified',
            'Specialist': 'sparkle',
        };
        this.iconPath = new vscode.ThemeIcon(tierIcons[tier] || 'folder');
    }
}
class AgentItem extends vscode.TreeItem {
    constructor(agent, isActive, workspaceRoot) {
        super(`@${agent.name}`, vscode.TreeItemCollapsibleState.None);
        this.agentInfo = agent;
        this.tooltip = `${agent.name}: ${agent.description}`;
        this.description = isActive ? '● Active' : agent.description;
        this.contextValue = 'agent';
        // Set icon with active color
        const iconColor = isActive ? new vscode.ThemeColor('charts.green') : undefined;
        this.iconPath = new vscode.ThemeIcon(agent.icon, iconColor);
        // Click to copy prompt
        this.command = {
            command: 'ultra-dex.copyAgentPrompt',
            title: 'Copy Agent Prompt',
            arguments: [agent, workspaceRoot]
        };
    }
}
exports.AgentItem = AgentItem;
//# sourceMappingURL=AgentsView.js.map