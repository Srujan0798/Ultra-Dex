import 'reflect-metadata';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { TeamWorkspace } from '../../../src/core/team/workspace.ts';
import { TeamMembership } from '../../../src/core/team/membership.ts';
import { SharedMemoryPool } from '../../../src/core/team/shared-memory.ts';

describe('TeamWorkspace', () => {
  let tempDir: string;
  let workspace: TeamWorkspace;
  const governanceStub = { gate: async () => ({ allowed: true }) };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultradex-workspace-'));
    workspace = new TeamWorkspace(tempDir, governanceStub as any);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('supports workspace create, config update, and member lifecycle', async () => {
    const created = await workspace.create('team-alpha', 'owner-1');
    assert.ok(created.id);

    const joined = await workspace.join(created.id, 'member-1');
    assert.strictEqual(joined.role, 'member');

    const updated = await workspace.setConfig(created.id, 'owner-1', 'providers', { openai: true });
    assert.deepStrictEqual(updated.providers, { openai: true });

    await workspace.leave(created.id, 'member-1');
    const membersRaw = JSON.parse(
      await fs.readFile(path.join(tempDir, created.id, 'members.json'), 'utf8')
    ) as Array<{ userId: string }>;
    assert.strictEqual(membersRaw.some((member) => member.userId === 'member-1'), false);
  });

  it('enforces workspace isolation and shared config scope', async () => {
    const teamA = await workspace.create('team-a', 'owner-a');
    const teamB = await workspace.create('team-b', 'owner-b');

    await workspace.setConfig(teamA.id, 'owner-a', 'models', { planner: 'gpt-5.3-codex' });
    const configA = await workspace.getConfig(teamA.id, 'owner-a');
    const configB = await workspace.getConfig(teamB.id, 'owner-b');

    assert.deepStrictEqual(configA.models, { planner: 'gpt-5.3-codex' });
    assert.deepStrictEqual(configB.models, {});
  });

  it('isolates shared memory per workspace namespace', async () => {
    const teamA = await workspace.create('workspace-a', 'owner-a');
    const teamB = await workspace.create('workspace-b', 'owner-b');

    const membershipA = new TeamMembership('owner-a');
    const membershipB = new TeamMembership('owner-b');
    const memoryA = new SharedMemoryPool(teamA.id, membershipA, governanceStub as any, tempDir);
    const memoryB = new SharedMemoryPool(teamB.id, membershipB, governanceStub as any, tempDir);

    await memoryA.writeMemory('owner-a', 'strategy', { text: 'A-only memory' });
    await memoryB.writeMemory('owner-b', 'strategy', { text: 'B-only memory' });

    const readA = await memoryA.readMemory('owner-a', 'strategy');
    const readB = await memoryB.readMemory('owner-b', 'strategy');

    assert.strictEqual(readA?.namespaceKey.includes(`team/${teamA.id}/memory/`), true);
    assert.strictEqual(readB?.namespaceKey.includes(`team/${teamB.id}/memory/`), true);
    assert.notStrictEqual(readA?.namespaceKey, readB?.namespaceKey);
  });
});
