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
class QuickActionsProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        const actions = [
            {
                label: 'Generate Plan',
                command: 'ultra-dex.generatePlan',
                icon: 'zap',
                description: 'Create implementation plan'
            },
            {
                label: 'Start Build Mode',
                command: 'ultra-dex.startBuildMode',
                icon: 'tools',
                description: 'Auto-watch and align'
            },
            {
                label: 'Run Agent',
                command: 'ultra-dex.runAgent',
                icon: 'hubot',
                description: 'Execute agent task'
            },
            {
                label: 'Open Dashboard',
                command: 'ultra-dex.openDashboard',
                icon: 'dashboard',
                description: 'Open God Mode Dashboard'
            }
        ];
        return Promise.resolve(actions.map(action => {
            const item = new vscode.TreeItem(action.label, vscode.TreeItemCollapsibleState.None);
            item.command = {
                command: action.command,
                title: action.label
            };
            item.iconPath = new vscode.ThemeIcon(action.icon);
            item.description = action.description;
            return item;
        }));
    }
}
exports.QuickActionsProvider = QuickActionsProvider;
//# sourceMappingURL=quickActionsProvider.js.map