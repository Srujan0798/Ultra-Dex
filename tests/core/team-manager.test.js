import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import TeamManager from '../../src/core/team/team-manager.js';

describe('TeamManager', () => {
  let teamManager;
  const ownerId = 'user-123';

  beforeEach(() => {
    teamManager = new TeamManager();
  });

  it('should create a team successfully', async () => {
    const team = await teamManager.createTeam('Engineering', ownerId);
    
    assert.ok(team.id, 'Team ID should be generated');
    assert.strictEqual(team.name, 'Engineering');
    assert.strictEqual(team.ownerId, ownerId);
  });

  it('should add the owner as a member upon creation', async () => {
    const team = await teamManager.createTeam('Sales', ownerId);
    const members = await teamManager.getTeamMembers(team.id);

    assert.strictEqual(members.length, 1);
    assert.strictEqual(members[0].userId, ownerId);
    assert.strictEqual(members[0].role, 'owner');
  });

  it('should allow adding new members', async () => {
    const team = await teamManager.createTeam('Marketing', ownerId);
    await teamManager.addMember(team.id, 'user-456', 'editor');
    
    const members = await teamManager.getTeamMembers(team.id);
    assert.strictEqual(members.length, 2);
    
    const newMember = members.find(m => m.userId === 'user-456');
    assert.strictEqual(newMember.role, 'editor');
  });

  it('should throw error when adding member to non-existent team', async () => {
    await assert.rejects(
      async () => await teamManager.addMember('fake-team', 'user-1', 'member'),
      { message: 'Team not found' }
    );
  });
});
