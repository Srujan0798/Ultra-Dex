import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Role, TeamMembership } from '../../../src/core/team/membership.ts';

describe('TeamMembership RBAC', () => {
  it('enforces role permission hierarchy owner > admin > member > viewer', () => {
    const membership = new TeamMembership('owner-1');
    membership.addMember('admin-1', Role.ADMIN);
    membership.addMember('member-1', Role.MEMBER);
    membership.addMember('viewer-1', Role.VIEWER);

    assert.strictEqual(membership.checkPermission('owner-1', 'workspace.delete'), true);
    assert.strictEqual(membership.checkPermission('admin-1', 'config.update'), true);
    assert.strictEqual(membership.checkPermission('member-1', 'task.run'), true);
    assert.strictEqual(membership.checkPermission('viewer-1', 'task.run'), false);
  });

  it('prevents permission escalation by non-owner admins', () => {
    const membership = new TeamMembership('owner-1');
    membership.addMember('admin-1', Role.ADMIN);
    membership.addMember('member-1', Role.MEMBER);

    assert.throws(
      () => membership.assignRole('admin-1', 'member-1', Role.ADMIN),
      /Permission escalation prevented/
    );
  });

  it('requires admin+ for role assignment', () => {
    const membership = new TeamMembership('owner-1');
    membership.addMember('member-1', Role.MEMBER);
    membership.addMember('viewer-1', Role.VIEWER);

    assert.throws(
      () => membership.assignRole('viewer-1', 'member-1', Role.VIEWER),
      /Role assignment requires admin or owner/
    );
  });

  it("ensures viewer can't write memory or run tasks", () => {
    const membership = new TeamMembership('owner-1');
    membership.addMember('viewer-1', Role.VIEWER);

    assert.strictEqual(membership.checkPermission('viewer-1', 'memory.write'), false);
    assert.strictEqual(membership.checkPermission('viewer-1', 'task.run'), false);
    assert.strictEqual(membership.checkPermission('viewer-1', 'memory.read'), true);
  });
});

