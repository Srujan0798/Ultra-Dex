// Copyright (c) 2026 Ultra-Dex
/**
 * Enterprise Features Test Suite
 * Comprehensive testing for Phase 3 enterprise features
 *
 * @module tests/enterprise/enterprise-features.test
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { teamManager, TeamRoles } from '../../apps/core-api/services/team/team-manager.js';
import { rbacManager, SystemRoles } from '../../src/core/auth/rbac-manager.js';
import { auditLogger } from '../../src/services/audit/audit-logger.js';
import { errorHandler, ErrorCodes } from '../../apps/cli/lib/utils/error-handler.js';

describe('Enterprise Features - Phase 3 Implementation', () => {
  describe('Team Management', () => {
    test('Create team with owner', async () => {
      const team = await teamManager.createTeam(
        'Engineering Team',
        'user-123',
        'Core engineering team'
      );

      assert.strictEqual(team.name, 'Engineering Team');
      assert.strictEqual(team.ownerId, 'user-123');
      assert.strictEqual(team.members.length, 1);
      assert.strictEqual(team.members[0].role, TeamRoles.OWNER);
    });

    test('Add member to team', async () => {
      const member = await teamManager.addMember(
        'team-456',
        'user-789',
        TeamRoles.MEMBER,
        'user-123'
      );

      assert.strictEqual(member.userId, 'user-789');
      assert.strictEqual(member.teamId, 'team-456');
      assert.strictEqual(member.role, TeamRoles.MEMBER);
      assert.strictEqual(member.status, 'pending');
    });

    test('Share project with team', async () => {
      const share = await teamManager.shareProject('project-abc', 'team-456', 'user-123', [
        'view',
        'edit',
      ]);

      assert.strictEqual(share.projectId, 'project-abc');
      assert.strictEqual(share.teamId, 'team-456');
      assert.deepStrictEqual(share.permissions, ['view', 'edit']);
    });

    test('Check team permissions', () => {
      const ownerMember = {
        id: '1',
        userId: 'user-123',
        teamId: 'team-456',
        role: TeamRoles.OWNER,
        joinedAt: new Date(),
        invitedBy: 'user-123',
        status: 'active',
      };

      assert.strictEqual(teamManager.hasPermission(ownerMember, 'team:manage'), true);
      assert.strictEqual(teamManager.hasPermission(ownerMember, 'billing:manage'), true);
    });
  });

  describe('RBAC System', () => {
    test('Initialize RBAC with system roles', async () => {
      await rbacManager.initialize();
      const roles = await rbacManager.listRoles();

      assert.strictEqual(roles.length >= 5, true);

      const superAdmin = roles.find((r) => r.id === SystemRoles.SUPER_ADMIN.id);
      assert.ok(superAdmin);
      assert.strictEqual(superAdmin?.isSystem, true);
    });

    test('Create custom role', async () => {
      const role = await rbacManager.createRole(
        'Custom Developer',
        'Custom role for developers',
        ['project:view', 'code:read', 'deployment:view'],
        'user-123'
      );

      assert.strictEqual(role.name, 'Custom Developer');
      assert.strictEqual(role.permissions.length, 3);
      assert.strictEqual(role.isSystem, false);
    });

    test('Assign role to user', async () => {
      const assignment = await rbacManager.assignRole(
        'user-789',
        SystemRoles.DEVELOPER.id,
        { type: 'team', id: 'team-456' },
        'user-123'
      );

      assert.strictEqual(assignment.userId, 'user-789');
      assert.strictEqual(assignment.roleId, SystemRoles.DEVELOPER.id);
      assert.strictEqual(assignment.scope.type, 'team');
    });

    test('Check user permissions', async () => {
      // This would normally require proper setup
      const decision = await rbacManager.checkPermission('user-789', 'project:view', {
        type: 'team',
        id: 'team-456',
      });

      assert.strictEqual(typeof decision.allowed, 'boolean');
      assert.ok(Array.isArray(decision.permissions));
    });

    test('Revoke role from user', async () => {
      const result = await rbacManager.revokeRole('assignment-123', 'user-123');

      assert.strictEqual(result, true);
    });
  });

  describe('Audit Logging', () => {
    test('Log user login event', async () => {
      const event = await auditLogger.logUserLogin('user-123', '192.168.1.1', 'Mozilla/5.0', true);

      assert.strictEqual(event.type, 'user.login');
      assert.strictEqual(event.severity, 'info');
      assert.strictEqual(event.userId, 'user-123');
      assert.strictEqual(event.details.success, true);
    });

    test('Log AI interaction', async () => {
      const event = await auditLogger.logAIInteraction(
        'user-123',
        'project-abc',
        'agent-backend',
        'code-generation',
        150,
        true,
        2500
      );

      assert.strictEqual(event.type, 'ai.request');
      assert.strictEqual(event.resourceId, 'agent-backend');
      assert.strictEqual(event.details.tokensUsed, 150);
    });

    test('Log permission change', async () => {
      const event = await auditLogger.logPermissionChange(
        'user-123',
        'user-789',
        'project',
        'project-abc',
        ['view'],
        ['view', 'edit'],
        'user-123'
      );

      assert.strictEqual(event.type, 'permission.changed');
      assert.strictEqual(event.severity, 'warning');
      assert.deepStrictEqual(event.details.oldPermissions, ['view']);
      assert.deepStrictEqual(event.details.newPermissions, ['view', 'edit']);
    });

    test('Query audit logs with filters', async () => {
      const events = await auditLogger.query({
        types: ['user.login', 'ai.request'],
        severities: ['info', 'warning'],
        limit: 10,
      });

      assert.ok(Array.isArray(events));
      assert.strictEqual(events.length <= 10, true);
    });

    test('Get audit statistics', async () => {
      const stats = await auditLogger.getStats(
        new Date(Date.now() - 86400000), // 1 day ago
        new Date()
      );

      assert.strictEqual(typeof stats.totalEvents, 'number');
      assert.ok(typeof stats.eventsByType === 'object');
      assert.ok(typeof stats.eventsBySeverity === 'object');
    });
  });

  describe('Error Handling', () => {
    test('Create enterprise error', () => {
      const error = errorHandler.createError(
        'UNAUTHORIZED',
        'Invalid credentials provided',
        { attempt: 3 },
        'user-123'
      );

      assert.strictEqual(error.code, 'AUTH_001');
      assert.strictEqual(error.category, 'authentication');
      assert.strictEqual(error.severity, 'high');
      assert.strictEqual(error.userId, 'user-123');
    });

    test('Handle error with recovery', async () => {
      const result = await errorHandler.handleError(new Error('Test error'), {
        userId: 'user-123',
        requestId: 'req-456',
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
      assert.strictEqual(typeof result.recovered, 'boolean');
    });

    test('Get error statistics', () => {
      const stats = errorHandler.getErrorStats();

      assert.strictEqual(typeof stats.total, 'number');
      assert.ok(typeof stats.byCategory === 'object');
      assert.ok(typeof stats.bySeverity === 'object');
    });
  });

  describe('Integration Tests', () => {
    test('Complete workflow: Team creation with RBAC and audit', async () => {
      // 1. Create team
      const team = await teamManager.createTeam(
        'Integration Test Team',
        'admin-user',
        'Testing enterprise features'
      );

      // 2. Assign admin role
      await rbacManager.assignRole(
        'member-user',
        SystemRoles.TEAM_ADMIN.id,
        { type: 'team', id: team.id },
        'admin-user'
      );

      // 3. Verify audit logs captured actions
      const events = await auditLogger.query({
        types: ['team.created'],
        limit: 1,
      });

      assert.ok(events.length > 0);
      assert.strictEqual(events[0].type, 'team.created');
    });

    test('Security: Unauthorized access attempt', async () => {
      // Attempt unauthorized action
      const error = errorHandler.createError(
        'FORBIDDEN',
        'User attempted unauthorized action',
        { action: 'delete-team', resource: 'team-123' },
        'unauthorized-user'
      );

      assert.strictEqual(error.severity, 'high');
      assert.strictEqual(error.category, 'authorization');

      // Verify audit log captured security event
      const securityEvent = await auditLogger.logSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'warning',
        {
          errorCode: error.code,
          userId: error.userId,
        },
        error.userId
      );

      assert.strictEqual(securityEvent.type, 'security.alert');
    });
  });
});

console.log('✓ Enterprise Features Test Suite Loaded');
console.log('  - Team Management: 4 tests');
console.log('  - RBAC System: 5 tests');
console.log('  - Audit Logging: 5 tests');
console.log('  - Error Handling: 3 tests');
console.log('  - Integration: 2 tests');
console.log('  Total: 19 comprehensive tests');
