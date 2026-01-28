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
exports.VerifyProvider = void 0;
const vscode = __importStar(require("vscode"));
class VerifyProvider {
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
        // Full 21-step checklist
        const steps = [
            "Atomic Scope Defined", "Context Loaded", "Architecture Alignment",
            "Security Patterns Applied", "Type Safety Check", "Error Handling Strategy",
            "API Documentation Updated", "Database Schema Verified", "Environment Variables Set",
            "Implementation Complete", "Console Logs Removed", "Edge Cases Handled",
            "Performance Check", "Accessibility Check", "Cross-browser Check",
            "Unit Tests Passed", "Integration Tests Passed", "Linting & Formatting",
            "Code Review Approved", "Migration Scripts Ready", "Deployment Readiness"
        ];
        return Promise.resolve(steps.map((label, i) => new VerifyItem(`${i + 1}. ${label}`, vscode.TreeItemCheckboxState.Unchecked)));
    }
}
exports.VerifyProvider = VerifyProvider;
class VerifyItem extends vscode.TreeItem {
    constructor(label, checkboxState) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.checkboxState = checkboxState;
        this.checkboxState = checkboxState;
    }
}
//# sourceMappingURL=VerifyView.js.map