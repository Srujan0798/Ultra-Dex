import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { TeamManager } from '../../src/core/team/team-manager.js';

describe('TeamManager Persistence', () => {
  let teamManager;
  let testDir;
  const ownerId = 'user-123';

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-team-persist-'));
    teamManager = new TeamManager(testDir);
  });

  afterEach(async () => {
    // Cleanup: Remove the temporary directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should save team to disk upon creation', async () => {
    const team = await teamManager.createTeam('Persistence Test', ownerId);
    
    // Check if file exists
    const filePath = path.resolve(testDir, '.ultra-dex', 'team.json');
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    
    assert.strictEqual(parsed.id, team.id);
    assert.strictEqual(parsed.name, 'Persistence Test');
  });

  it('should load team from disk', async () => {
    // 1. Create team
    await teamManager.createTeam('Load Test', ownerId);
    
    // 2. Create new instance pointing to same dir
    const secondManager = new TeamManager(testDir);
    const team = await secondManager.getTeam();
    
    assert.ok(team, 'Should load team from disk');
    assert.strictEqual(team.name, 'Load Test');
  });

  it('should persist member additions', async () => {
    const team = await teamManager.createTeam('Member Persistence', ownerId);
    await teamManager.addMember(team.id, 'new-user', 'editor');
    
    const secondManager = new TeamManager(testDir);
    const members = await secondManager.getTeamMembers(team.id);
    
    assert.strictEqual(members.length, 2); // Owner + New Member
    assert.ok(members.find(m => m.userId === 'new-user'), 'New member should be persisted');
  });
});
