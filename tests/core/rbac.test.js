import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import RBACManager from '../../src/core/auth/rbac-manager.js';
import { ROLES, PERMISSIONS } from '../../src/core/team/permissions.js';

describe('RBACManager', () => {
  let rbac;

  beforeEach(() => {
    rbac = new RBACManager();
  });

  it('should verify roles correctly', () => {
    rbac.assignRole('user-1', ROLES.ADMIN);
    assert.strictEqual(rbac.getRole('user-1'), ROLES.ADMIN);
  });

  it('should default to viewer role', () => {
    assert.strictEqual(rbac.getRole('unknown-user'), ROLES.VIEWER);
  });

  it('should check permissions based on role hierarchy', () => {
    rbac.assignRole('admin-1', ROLES.ADMIN);
    rbac.assignRole('dev-1', ROLES.EDITOR);
    rbac.assignRole('viewer-1', ROLES.VIEWER);

    // Admin has everything
    assert.strictEqual(rbac.checkPermission('admin-1', PERMISSIONS.PROJECT_DELETE), true);
    
    // Editor has limited permissions
    assert.strictEqual(rbac.checkPermission('dev-1', PERMISSIONS.PROJECT_CREATE), true);
    assert.strictEqual(rbac.checkPermission('dev-1', PERMISSIONS.PROJECT_DELETE), false);
    
    // Viewer has read-only
    assert.strictEqual(rbac.checkPermission('viewer-1', PERMISSIONS.PROJECT_READ), true);
    assert.strictEqual(rbac.checkPermission('viewer-1', PERMISSIONS.PROJECT_UPDATE), false);
  });

  it('should support custom roles', () => {
    rbac.defineCustomRole('auditor', [PERMISSIONS.PROJECT_READ, PERMISSIONS.TEAM_SETTINGS]);
    rbac.assignRole('audit-1', 'auditor');

    assert.strictEqual(rbac.checkPermission('audit-1', PERMISSIONS.PROJECT_READ), true);
    assert.strictEqual(rbac.checkPermission('audit-1', PERMISSIONS.TEAM_SETTINGS), true);
    assert.strictEqual(rbac.checkPermission('audit-1', PERMISSIONS.PROJECT_UPDATE), false);
  });

  it('should reject invalid role assignment', () => {
    assert.throws(() => {
      rbac.assignRole('user-bad', 'hacker');
    }, /Invalid role/);
  });
});
