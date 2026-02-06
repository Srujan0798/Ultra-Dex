/**
 * Tests for Role-Based Access Control (RBAC)
 *
 * Security-critical module - ensures proper permission enforcement
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, PERMISSIONS, hasPermission, getRoleDefinition } from '../../lib/auth/rbac.js';

describe('RBAC - Roles', () => {
  test('should define all expected roles', () => {
    assert.strictEqual(ROLES.ADMIN, 'admin');
    assert.strictEqual(ROLES.MAINTAINER, 'maintainer');
    assert.strictEqual(ROLES.MEMBER, 'member');
    assert.strictEqual(ROLES.VIEWER, 'viewer');
  });

  test('should have consistent role keys and values', () => {
    assert.strictEqual(ROLES.ADMIN.toLowerCase(), 'admin');
    assert.strictEqual(ROLES.MAINTAINER.toLowerCase(), 'maintainer');
    assert.strictEqual(ROLES.MEMBER.toLowerCase(), 'member');
    assert.strictEqual(ROLES.VIEWER.toLowerCase(), 'viewer');
  });
});

describe('RBAC - Permissions', () => {
  test('should define admin-only permissions', () => {
    assert.strictEqual(PERMISSIONS.MANAGE_TEAM, 'manage_team');
    assert.strictEqual(PERMISSIONS.CONFIGURE_SSO, 'configure_sso');
    assert.strictEqual(PERMISSIONS.MANAGE_BILLING, 'manage_billing');
  });

  test('should define maintainer+ permissions', () => {
    assert.strictEqual(PERMISSIONS.PUBLISH_AGENTS, 'publish_agents');
    assert.strictEqual(PERMISSIONS.MANAGE_ENV, 'manage_env');
    assert.strictEqual(PERMISSIONS.APPROVE_PR, 'approve_pr');
  });

  test('should define member+ permissions', () => {
    assert.strictEqual(PERMISSIONS.USE_AGENTS, 'use_agents');
    assert.strictEqual(PERMISSIONS.CREATE_AGENTS, 'create_agents');
    assert.strictEqual(PERMISSIONS.READ_CODE, 'read_code');
    assert.strictEqual(PERMISSIONS.WRITE_CODE, 'write_code');
  });

  test('should define viewer+ permissions', () => {
    assert.strictEqual(PERMISSIONS.VIEW_AGENTS, 'view_agents');
    assert.strictEqual(PERMISSIONS.VIEW_METRICS, 'view_metrics');
  });
});

describe('hasPermission - Admin Role', () => {
  test('admin should have all permissions', () => {
    const allPermissions = Object.values(PERMISSIONS);

    for (const permission of allPermissions) {
      assert.strictEqual(
        hasPermission(ROLES.ADMIN, permission),
        true,
        `Admin should have ${permission}`
      );
    }
  });

  test('admin should have manage_team permission', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_TEAM), true);
  });

  test('admin should have configure_sso permission', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, PERMISSIONS.CONFIGURE_SSO), true);
  });

  test('admin should have manage_billing permission', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_BILLING), true);
  });
});

describe('hasPermission - Maintainer Role', () => {
  test('maintainer should have publish_agents permission', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.PUBLISH_AGENTS), true);
  });

  test('maintainer should have manage_env permission', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.MANAGE_ENV), true);
  });

  test('maintainer should have approve_pr permission', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.APPROVE_PR), true);
  });

  test('maintainer should have member permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.USE_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.CREATE_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.READ_CODE), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.WRITE_CODE), true);
  });

  test('maintainer should NOT have admin-only permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.MANAGE_TEAM), false);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.CONFIGURE_SSO), false);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.MANAGE_BILLING), false);
  });
});

describe('hasPermission - Member Role', () => {
  test('member should have use_agents permission', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.USE_AGENTS), true);
  });

  test('member should have create_agents permission', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.CREATE_AGENTS), true);
  });

  test('member should have code read/write permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.READ_CODE), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.WRITE_CODE), true);
  });

  test('member should have viewer permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.VIEW_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.VIEW_METRICS), true);
  });

  test('member should NOT have maintainer permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.PUBLISH_AGENTS), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.MANAGE_ENV), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.APPROVE_PR), false);
  });

  test('member should NOT have admin permissions', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.MANAGE_TEAM), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.CONFIGURE_SSO), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.MANAGE_BILLING), false);
  });
});

describe('hasPermission - Viewer Role', () => {
  test('viewer should have view_agents permission', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.VIEW_AGENTS), true);
  });

  test('viewer should have view_metrics permission', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.VIEW_METRICS), true);
  });

  test('viewer should NOT have member permissions', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.USE_AGENTS), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.CREATE_AGENTS), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.READ_CODE), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.WRITE_CODE), false);
  });

  test('viewer should NOT have maintainer permissions', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.PUBLISH_AGENTS), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.MANAGE_ENV), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.APPROVE_PR), false);
  });

  test('viewer should NOT have admin permissions', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.MANAGE_TEAM), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.CONFIGURE_SSO), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.MANAGE_BILLING), false);
  });
});

describe('hasPermission - Edge Cases', () => {
  test('should return false for null role', () => {
    assert.strictEqual(hasPermission(null, PERMISSIONS.USE_AGENTS), false);
  });

  test('should return false for undefined role', () => {
    assert.strictEqual(hasPermission(undefined, PERMISSIONS.USE_AGENTS), false);
  });

  test('should return false for empty string role', () => {
    assert.strictEqual(hasPermission('', PERMISSIONS.USE_AGENTS), false);
  });

  test('should return false for invalid role', () => {
    assert.strictEqual(hasPermission('invalid-role', PERMISSIONS.USE_AGENTS), false);
  });

  test('should handle uppercase role names', () => {
    assert.strictEqual(hasPermission('ADMIN', PERMISSIONS.MANAGE_TEAM), true);
    assert.strictEqual(hasPermission('MEMBER', PERMISSIONS.USE_AGENTS), true);
  });

  test('should handle mixed case role names', () => {
    assert.strictEqual(hasPermission('Admin', PERMISSIONS.MANAGE_TEAM), true);
    assert.strictEqual(hasPermission('MeMbEr', PERMISSIONS.USE_AGENTS), true);
  });

  test('should return false for invalid permission', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, 'invalid_permission'), false);
  });

  test('should handle whitespace in role names', () => {
    assert.strictEqual(hasPermission(' admin ', PERMISSIONS.MANAGE_TEAM), false);
  });
});

describe('getRoleDefinition', () => {
  test('should return admin role definition', () => {
    const def = getRoleDefinition(ROLES.ADMIN);

    assert.strictEqual(def.name, 'admin');
    assert.ok(Array.isArray(def.permissions));
    assert.ok(def.permissions.length > 0);
    assert.ok(def.permissions.includes(PERMISSIONS.MANAGE_TEAM));
  });

  test('should return maintainer role definition', () => {
    const def = getRoleDefinition(ROLES.MAINTAINER);

    assert.strictEqual(def.name, 'maintainer');
    assert.ok(def.permissions.includes(PERMISSIONS.PUBLISH_AGENTS));
    assert.ok(def.permissions.includes(PERMISSIONS.USE_AGENTS));
  });

  test('should return member role definition', () => {
    const def = getRoleDefinition(ROLES.MEMBER);

    assert.strictEqual(def.name, 'member');
    assert.ok(def.permissions.includes(PERMISSIONS.USE_AGENTS));
    assert.ok(def.permissions.includes(PERMISSIONS.CREATE_AGENTS));
  });

  test('should return viewer role definition', () => {
    const def = getRoleDefinition(ROLES.VIEWER);

    assert.strictEqual(def.name, 'viewer');
    assert.ok(def.permissions.includes(PERMISSIONS.VIEW_AGENTS));
    assert.ok(def.permissions.includes(PERMISSIONS.VIEW_METRICS));
  });

  test('should return empty permissions for invalid role', () => {
    const def = getRoleDefinition('invalid-role');

    assert.ok(Array.isArray(def.permissions));
    assert.strictEqual(def.permissions.length, 0);
  });

  test('should handle uppercase role names', () => {
    const def = getRoleDefinition('ADMIN');

    assert.ok(def.permissions.includes(PERMISSIONS.MANAGE_TEAM));
  });
});

describe('Permission Hierarchy', () => {
  test('admin should have more permissions than maintainer', () => {
    const adminDef = getRoleDefinition(ROLES.ADMIN);
    const maintainerDef = getRoleDefinition(ROLES.MAINTAINER);

    assert.ok(adminDef.permissions.length > maintainerDef.permissions.length);
  });

  test('maintainer should have more permissions than member', () => {
    const maintainerDef = getRoleDefinition(ROLES.MAINTAINER);
    const memberDef = getRoleDefinition(ROLES.MEMBER);

    assert.ok(maintainerDef.permissions.length > memberDef.permissions.length);
  });

  test('member should have more permissions than viewer', () => {
    const memberDef = getRoleDefinition(ROLES.MEMBER);
    const viewerDef = getRoleDefinition(ROLES.VIEWER);

    assert.ok(memberDef.permissions.length > viewerDef.permissions.length);
  });

  test('viewer should have fewest permissions', () => {
    const viewerDef = getRoleDefinition(ROLES.VIEWER);

    assert.strictEqual(viewerDef.permissions.length, 2); // VIEW_AGENTS + VIEW_METRICS
  });
});

describe('Real-World Scenarios', () => {
  test('member cannot manage team', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.MANAGE_TEAM), false);
  });

  test('viewer cannot create agents', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.CREATE_AGENTS), false);
  });

  test('maintainer can publish agents but not manage billing', () => {
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.PUBLISH_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.MANAGE_BILLING), false);
  });

  test('all roles can view agents', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, PERMISSIONS.VIEW_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.VIEW_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.VIEW_AGENTS), true);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.VIEW_AGENTS), true);
  });

  test('only admin can configure SSO', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, PERMISSIONS.CONFIGURE_SSO), true);
    assert.strictEqual(hasPermission(ROLES.MAINTAINER, PERMISSIONS.CONFIGURE_SSO), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, PERMISSIONS.CONFIGURE_SSO), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, PERMISSIONS.CONFIGURE_SSO), false);
  });
});
