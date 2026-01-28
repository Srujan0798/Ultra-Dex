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
exports.AgentTreeProvider = void 0;
exports.loadAgentIndex = loadAgentIndex;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const TIER_LABELS = {
    '0-orchestration': '0. Meta Orchestration',
    '1-leadership': '1. Leadership',
    '2-development': '2. Development',
    '3-security': '3. Security',
    '4-devops': '4. DevOps',
    '5-quality': '5. Quality',
    '6-specialist': '6. Specialist',
};
class AgentTreeProvider {
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
            return Promise.resolve([]);
        }
        if (!element) {
            return Promise.resolve(this.getTierItems());
        }
        if (element.contextValue?.startsWith('tier:')) {
            const tier = element.contextValue.replace('tier:', '');
            return this.getAgentItems(tier);
        }
        return Promise.resolve([]);
    }
    getTierItems() {
        return Object.entries(TIER_LABELS).map(([tierKey, label]) => {
            const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = `tier:${tierKey}`;
            return item;
        });
    }
    async getAgentItems(tierKey) {
        const agentIndex = await loadAgentIndex(this.workspaceRoot);
        const agents = agentIndex.filter((agent) => agent.tier === tierKey);
        return agents.map((agent) => {
            const item = new vscode.TreeItem(agent.name, vscode.TreeItemCollapsibleState.None);
            item.description = agent.description;
            item.command = {
                command: 'ultra-dex.selectAgent',
                title: 'Select Agent',
                arguments: [agent],
            };
            item.contextValue = 'agent';
            item.iconPath = this.workspaceRoot ? getTierIcon(this.workspaceRoot, tierKey) : undefined;
            return item;
        });
    }
}
exports.AgentTreeProvider = AgentTreeProvider;
async function loadAgentIndex(workspaceRoot) {
    if (!workspaceRoot) {
        return [];
    }
    const indexPath = path.join(workspaceRoot, 'agents', '00-AGENT_INDEX.md');
    const fileUri = vscode.Uri.file(indexPath);
    let content = '';
    try {
        const data = await vscode.workspace.fs.readFile(fileUri);
        content = Buffer.from(data).toString('utf8');
    }
    catch {
        return [];
    }
    const rows = content.split('\n').filter((line) => line.trim().startsWith('| **@'));
    return rows.map((row) => {
        const parts = row.split('|').map((part) => part.trim()).filter(Boolean);
        const name = parts[0]?.replace('**', '').replace('**', '') ?? '';
        const description = parts[1] ?? '';
        const file = parts[3]?.replace('[', '').split('](')[1]?.replace(')', '') ?? '';
        const tier = file.split('/')[1] ?? 'unknown';
        return {
            name,
            description,
            tier,
            filePath: file,
        };
    }).filter((agent) => agent.name && agent.filePath);
}
function getTierIcon(workspaceRoot, tierKey) {
    const iconPath = path.join(workspaceRoot, 'vscode-extension', 'resources', 'icons', `${tierKey}.svg`);
    return { light: vscode.Uri.file(iconPath), dark: vscode.Uri.file(iconPath) };
}
//# sourceMappingURL=agentTreeProvider.js.map