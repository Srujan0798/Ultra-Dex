// Copyright (c) 2026 Ultra-Dex
// Tests for Enterprise Governance + Agent Templates

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Governance ──────────────────────────────────────────────────────────────

import {
    AuditTrail,
    PolicyEngine,
    ApprovalWorkflow,
    GovernanceManager,
} from '../governance/governance-manager.js';

describe('AuditTrail', () => {
    it('should record and chain hash events', () => {
        const trail = new AuditTrail();
        const e1 = trail.record({ agentId: 'a1', action: 'read', resource: 'file.js' });
        const e2 = trail.record({ agentId: 'a1', action: 'write', resource: 'file.js' });
        assert.ok(e1.hash);
        assert.equal(e2.previousHash, e1.hash);
    });

    it('should verify integrity of chain', () => {
        const trail = new AuditTrail();
        trail.record({ agentId: 'a1', action: 'read' });
        trail.record({ agentId: 'a1', action: 'write' });
        trail.record({ agentId: 'a2', action: 'deploy' });
        assert.equal(trail.verifyIntegrity().valid, true);
    });

    it('should detect tampering', () => {
        const trail = new AuditTrail();
        trail.record({ agentId: 'a1', action: 'read' });
        trail.record({ agentId: 'a1', action: 'write' });
        trail.entries[0].hash = 'tampered';
        assert.equal(trail.verifyIntegrity().valid, false);
    });

    it('should filter audit queries', () => {
        const trail = new AuditTrail();
        trail.record({ agentId: 'a1', action: 'read' });
        trail.record({ agentId: 'a2', action: 'write' });
        trail.record({ agentId: 'a1', action: 'deploy' });

        assert.equal(trail.query({ agentId: 'a1' }).length, 2);
        assert.equal(trail.query({ action: 'write' }).length, 1);
    });

    it('should evict old entries', () => {
        const trail = new AuditTrail({ maxEntries: 3 });
        for (let i = 0; i < 5; i++) trail.record({ agentId: 'a1', action: `action-${i}` });
        assert.equal(trail.entries.length, 3);
    });

    it('should provide stats', () => {
        const trail = new AuditTrail();
        trail.record({ agentId: 'a1', action: 'read' });
        trail.record({ agentId: 'a1', action: 'read' });
        trail.record({ agentId: 'a1', action: 'write' });
        const stats = trail.getStats();
        assert.equal(stats.totalEntries, 3);
        assert.equal(stats.byAction.read, 2);
        assert.equal(stats.integrityValid, true);
    });
});

describe('PolicyEngine', () => {
    it('should load default policies', () => {
        const pe = new PolicyEngine();
        pe.loadDefaults();
        assert.ok(pe.listPolicies().length >= 5);
    });

    it('should evaluate and pass', () => {
        const pe = new PolicyEngine();
        pe.addPolicy({
            id: 'test',
            name: 'Test',
            condition: (ctx) => ctx.safe === true,
            enforcement: 'block',
        });
        const result = pe.evaluate({ safe: true });
        assert.equal(result.allowed, true);
    });

    it('should block on violation', () => {
        const pe = new PolicyEngine();
        pe.addPolicy({
            id: 'no-delete',
            name: 'No Delete',
            condition: (ctx) => ctx.action !== 'delete',
            enforcement: 'block',
        });
        const result = pe.evaluate({ action: 'delete' });
        assert.equal(result.allowed, false);
    });

    it('should require approval for some actions', () => {
        const pe = new PolicyEngine();
        pe.addPolicy({
            id: 'approve-deploy',
            name: 'Approve Deploys',
            condition: (ctx) => ctx.action !== 'deploy' || ctx.approved,
            enforcement: 'require-approval',
        });
        const result = pe.evaluate({ action: 'deploy' });
        assert.equal(result.requiresApproval, true);
    });

    it('should track violations', () => {
        const pe = new PolicyEngine();
        pe.addPolicy({ id: 'block', name: 'Block', condition: () => false, enforcement: 'block' });
        pe.evaluate({});
        pe.evaluate({});
        assert.equal(pe.getViolations().length, 2);
        assert.equal(pe.getStats().totalViolations, 2);
    });

    it('should enable/disable policies', () => {
        const pe = new PolicyEngine();
        pe.addPolicy({ id: 'p1', name: 'P1', condition: () => false, enforcement: 'block' });
        pe.disablePolicy('p1');
        assert.equal(pe.evaluate({}).allowed, true);
        pe.enablePolicy('p1');
        assert.equal(pe.evaluate({}).allowed, false);
    });
});

describe('ApprovalWorkflow', () => {
    it('should create and approve requests', () => {
        const aw = new ApprovalWorkflow();
        const id = aw.requestApproval({ agentId: 'a1', action: 'deploy' });
        assert.equal(aw.getPending().length, 1);

        const result = aw.approve(id, 'admin', 'Looks good');
        assert.equal(result.status, 'approved');
        assert.equal(aw.getPending().length, 0);
        assert.equal(aw.getHistory().length, 1);
    });

    it('should reject requests', () => {
        const aw = new ApprovalWorkflow();
        const id = aw.requestApproval({ agentId: 'a1', action: 'delete-all' });
        const result = aw.reject(id, 'admin', 'Too risky');
        assert.equal(result.status, 'rejected');
    });

    it('should emit events', () => {
        const aw = new ApprovalWorkflow();
        let approved = false;
        aw.on('approval:approved', () => { approved = true; });
        const id = aw.requestApproval({ agentId: 'a1', action: 'test' });
        aw.approve(id);
        assert.equal(approved, true);
    });

    it('should track stats', () => {
        const aw = new ApprovalWorkflow();
        const id1 = aw.requestApproval({ agentId: 'a1', action: 'a' });
        const id2 = aw.requestApproval({ agentId: 'a1', action: 'b' });
        aw.approve(id1);
        aw.reject(id2);
        const stats = aw.getStats();
        assert.equal(stats.totalProcessed, 2);
        assert.equal(stats.approved, 1);
        assert.equal(stats.rejected, 1);
        assert.equal(stats.approvalRate, 50);
    });
});

describe('GovernanceManager', () => {
    it('should gate allowed actions', async () => {
        const gm = new GovernanceManager({ loadDefaults: false });
        const result = await gm.gate({ agentId: 'a1', action: 'read' });
        assert.equal(result.allowed, true);
    });

    it('should block policy violations', async () => {
        const gm = new GovernanceManager();
        const result = await gm.gate({
            agentId: 'a1',
            action: 'delete',
            environment: 'production',
        });
        assert.equal(result.allowed, false);
        assert.equal(result.reason, 'policy-violation');
    });

    it('should require approval for deployments', async () => {
        const gm = new GovernanceManager();
        const result = await gm.gate({ agentId: 'a1', action: 'deploy' });
        assert.equal(result.allowed, false);
        assert.equal(result.reason, 'approval-required');
        assert.ok(result.approvalId);
    });

    it('should provide dashboard data', async () => {
        const gm = new GovernanceManager();
        await gm.gate({ agentId: 'a1', action: 'read' });
        const dashboard = gm.getDashboard();
        assert.ok(dashboard.audit);
        assert.ok(dashboard.policies);
        assert.ok(dashboard.approvals);
    });
});

// ── Agent Templates ─────────────────────────────────────────────────────────

import {
    validateTemplate,
    builtInTemplates,
    TemplateRegistry,
    TemplateBuilder,
} from '../templates/agent-templates.js';

describe('validateTemplate', () => {
    it('should validate a valid template', () => {
        const result = validateTemplate({
            id: 'test', name: 'Test', role: 'tester', model: 'gpt-4o',
            systemPrompt: 'You are a test', capabilities: ['testing'],
        });
        assert.equal(result.valid, true);
    });

    it('should reject invalid templates', () => {
        const result = validateTemplate({});
        assert.equal(result.valid, false);
        assert.ok(result.errors.length > 0);
    });
});

describe('builtInTemplates', () => {
    it('should have 10 templates', () => {
        assert.equal(builtInTemplates.length, 10);
    });

    it('should all be valid', () => {
        for (const t of builtInTemplates) {
            const result = validateTemplate(t);
            assert.equal(result.valid, true, `Template ${t.id} is invalid: ${result.errors.join(', ')}`);
        }
    });
});

describe('TemplateRegistry', () => {
    it('should load built-ins and search', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        assert.equal(reg.templates.size, 10);
        assert.ok(reg.get('code-reviewer'));
    });

    it('should search by category', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const devTemplates = reg.search({ category: 'development' });
        assert.ok(devTemplates.length >= 3);
    });

    it('should search by tag', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const securityTemplates = reg.search({ tag: 'security' });
        assert.ok(securityTemplates.length >= 1);
    });

    it('should search by query', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const results = reg.search({ query: 'deploy' });
        assert.ok(results.length >= 1);
    });

    it('should instantiate templates with overrides', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const instance = reg.instantiate('code-reviewer', { model: 'claude-4-sonnet' });
        assert.equal(instance.model, 'claude-4-sonnet');
        assert.equal(instance.instantiatedFrom, 'code-reviewer');
        assert.ok(instance.instanceId);
    });

    it('should version templates on update', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const original = reg.get('code-reviewer');
        reg.register({ ...original, description: 'Updated' });
        const versions = reg.getVersions('code-reviewer');
        assert.equal(versions.length, 1);
    });

    it('should return catalog for dashboard', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const catalog = reg.getCatalog();
        assert.equal(catalog.totalTemplates, 10);
        assert.ok(Object.keys(catalog.categories).length >= 4);
    });
});

describe('TemplateBuilder', () => {
    it('should build a template with fluent API', () => {
        const template = new TemplateBuilder()
            .id('custom-agent')
            .name('Custom Agent')
            .role('custom')
            .model('gpt-4o')
            .systemPrompt('You are a custom agent')
            .addCapability('analysis')
            .addTool('memory/retrieve')
            .addTag('custom')
            .setConfig('maxTokens', 1000)
            .build();

        assert.equal(template.id, 'custom-agent');
        assert.equal(template.capabilities.length, 1);
        assert.equal(template.config.maxTokens, 1000);
    });

    it('should extend existing templates', () => {
        const reg = new TemplateRegistry();
        reg.loadBuiltIns();
        const base = reg.get('code-reviewer');

        const extended = new TemplateBuilder()
            .extend(base)
            .id('code-reviewer-v2')
            .name('Code Reviewer V2')
            .addCapability('performance-profiling')
            .addTool('code-exec/execute')
            .build();

        assert.equal(extended.id, 'code-reviewer-v2');
        assert.ok(extended.capabilities.includes('performance-profiling'));
        assert.ok(extended.tools.includes('code-exec/execute'));
    });

    it('should reject invalid builds', () => {
        assert.throws(
            () => new TemplateBuilder().id('bad').build(),
            /Invalid template/
        );
    });
});
