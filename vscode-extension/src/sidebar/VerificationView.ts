import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface VerificationStep {
    id: string;
    label: string;
    description: string;
    checked: boolean;
}

export class VerificationViewProvider implements vscode.TreeDataProvider<VerificationStep> {
    private _onDidChangeTreeData: vscode.EventEmitter<VerificationStep | undefined | null | void> = new vscode.EventEmitter<VerificationStep | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<VerificationStep | undefined | null | void> = this._onDidChangeTreeData.event;

    private steps: VerificationStep[] = [];

    constructor(private workspaceRoot: string | undefined) {
        this.loadSteps();
    }

    private loadSteps() {
        // 21-step verification framework
        this.steps = [
            { id: '1', label: '1. Project Structure', description: 'Directory layout matches template', checked: false },
            { id: '2', label: '2. Dependencies Installed', description: 'node_modules present and up-to-date', checked: false },
            { id: '3', label: '3. Environment Setup', description: '.env configured correctly', checked: false },
            { id: '4', label: '4. Database Connected', description: 'Prisma/DB connection working', checked: false },
            { id: '5', label: '5. Auth Configured', description: 'Clerk/Auth provider keys set', checked: false },
            { id: '6', label: '6. CONTEXT.md Exists', description: 'Project context documented', checked: false },
            { id: '7', label: '7. IMPLEMENTATION-PLAN.md', description: 'Plan documented and updated', checked: false },
            { id: '8', label: '8. Agents Configured', description: 'Agent index and prompts ready', checked: false },
            { id: '9', label: '9. Build Succeeds', description: 'npm run build passes', checked: false },
            { id: '10', label: '10. Tests Pass', description: 'npm test passes', checked: false },
            { id: '11', label: '11. Lint Clean', description: 'No linting errors', checked: false },
            { id: '12', label: '12. Type Check', description: 'TypeScript compiles', checked: false },
            { id: '13', label: '13. Security Audit', description: 'npm audit shows no critical issues', checked: false },
            { id: '14', label: '14. API Routes Work', description: 'All endpoints respond correctly', checked: false },
            { id: '15', label: '15. Frontend Renders', description: 'Pages load without errors', checked: false },
            { id: '16', label: '16. Mobile Responsive', description: 'UI works on mobile viewports', checked: false },
            { id: '17', label: '17. Performance Check', description: 'Lighthouse score acceptable', checked: false },
            { id: '18', label: '18. Error Handling', description: 'Errors caught and logged', checked: false },
            { id: '19', label: '19. Documentation', description: 'README and docs updated', checked: false },
            { id: '20', label: '20. Git Clean', description: 'All changes committed', checked: false },
            { id: '21', label: '21. Deploy Ready', description: 'Ready for production deployment', checked: false },
        ];

        // Load saved state
        if (this.workspaceRoot) {
            this.loadVerificationState();
        }
    }

    private loadVerificationState() {
        if (!this.workspaceRoot) return;

        const statePath = path.join(this.workspaceRoot, '.ultra-dex', 'verification-state.json');

        if (fs.existsSync(statePath)) {
            try {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                for (const step of this.steps) {
                    if (state[step.id]) {
                        step.checked = state[step.id];
                    }
                }
            } catch {
                // Ignore parse errors
            }
        }
    }

    private saveVerificationState() {
        if (!this.workspaceRoot) return;

        const stateDir = path.join(this.workspaceRoot, '.ultra-dex');
        const statePath = path.join(stateDir, 'verification-state.json');

        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }

        const state: Record<string, boolean> = {};
        for (const step of this.steps) {
            state[step.id] = step.checked;
        }

        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: VerificationStep): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label);
        treeItem.description = element.description;
        treeItem.iconPath = new vscode.ThemeIcon(element.checked ? 'check' : 'circle-outline');
        treeItem.command = {
            command: 'ultra-dex.toggleVerificationStep',
            title: 'Toggle',
            arguments: [element]
        };
        return treeItem;
    }

    getChildren(): VerificationStep[] {
        return this.steps;
    }

    toggleStep(step: VerificationStep) {
        step.checked = !step.checked;
        this.saveVerificationState();
        this.refresh();

        const completedCount = this.steps.filter(s => s.checked).length;
        const total = this.steps.length;

        vscode.window.showInformationMessage(
            `${step.label}: ${step.checked ? '✅' : '⬜'} (${completedCount}/${total} complete)`
        );
    }

    getProgress(): { completed: number; total: number; percent: number } {
        const completed = this.steps.filter(s => s.checked).length;
        const total = this.steps.length;
        return {
            completed,
            total,
            percent: Math.round((completed / total) * 100)
        };
    }

    resetAll() {
        for (const step of this.steps) {
            step.checked = false;
        }
        this.saveVerificationState();
        this.refresh();
        vscode.window.showInformationMessage('Verification checklist reset');
    }
}
