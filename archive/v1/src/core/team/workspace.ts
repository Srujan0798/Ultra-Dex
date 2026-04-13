import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { GovernanceManager } from '../governance/governance-manager.ts';
import { Role, TeamMembership, type TeamMember } from './membership.ts';

export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedWorkspaceConfig {
  providers: Record<string, unknown>;
  models: Record<string, unknown>;
  policies: Record<string, unknown>;
  [key: string]: unknown;
}

export class TeamWorkspace {
  private readonly baseDir: string;
  private readonly governance: GovernanceManager;

  constructor(
    baseDir = path.join(os.homedir(), '.ultra-dex', 'teams'),
    governanceManager = new GovernanceManager()
  ) {
    this.baseDir = baseDir;
    this.governance = governanceManager;
  }

  private getWorkspaceDir(workspaceId: string): string {
    return path.join(this.baseDir, workspaceId);
  }

  private getConfigPath(workspaceId: string): string {
    return path.join(this.getWorkspaceDir(workspaceId), 'config.json');
  }

  private getMembersPath(workspaceId: string): string {
    return path.join(this.getWorkspaceDir(workspaceId), 'members.json');
  }

  private async readConfig(workspaceId: string): Promise<SharedWorkspaceConfig> {
    const content = await fs.readFile(this.getConfigPath(workspaceId), 'utf8');
    return JSON.parse(content) as SharedWorkspaceConfig;
  }

  private async writeConfig(workspaceId: string, config: SharedWorkspaceConfig): Promise<void> {
    await fs.writeFile(this.getConfigPath(workspaceId), JSON.stringify(config, null, 2), 'utf8');
  }

  private async readMembership(workspaceId: string): Promise<TeamMembership> {
    const raw = await fs.readFile(this.getMembersPath(workspaceId), 'utf8');
    const members = JSON.parse(raw) as TeamMember[];
    const owner = members.find((member) => member.role === Role.OWNER);
    if (!owner) {
      throw new Error(`Workspace "${workspaceId}" has no owner`);
    }
    return new TeamMembership(owner.userId, members);
  }

  private async writeMembership(workspaceId: string, membership: TeamMembership): Promise<void> {
    await fs.writeFile(
      this.getMembersPath(workspaceId),
      JSON.stringify(membership.listMembers(), null, 2),
      'utf8'
    );
  }

  async create(name: string, ownerId: string): Promise<WorkspaceRecord> {
    await this.governance.gate({
      action: 'team.create',
      agentId: ownerId,
      resource: `workspace:${name}`,
      details: { ownerId },
    });

    const workspaceId = randomUUID();
    const now = new Date().toISOString();
    const workspace: WorkspaceRecord = {
      id: workspaceId,
      name,
      ownerId,
      createdAt: now,
      updatedAt: now,
    };

    const workspaceDir = this.getWorkspaceDir(workspaceId);
    await fs.mkdir(workspaceDir, { recursive: true });
    await this.writeConfig(workspaceId, {
      id: workspaceId,
      name,
      providers: {},
      models: {},
      policies: {},
      createdAt: now,
      updatedAt: now,
    });

    const membership = new TeamMembership(ownerId);
    await this.writeMembership(workspaceId, membership);

    return workspace;
  }

  async join(workspaceId: string, userId: string): Promise<TeamMember> {
    await this.governance.gate({
      action: 'team.join',
      agentId: userId,
      resource: `workspace:${workspaceId}`,
      details: {},
    });

    const membership = await this.readMembership(workspaceId);
    const member = membership.addMember(userId, Role.MEMBER);
    await this.writeMembership(workspaceId, membership);
    return member;
  }

  async leave(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.readMembership(workspaceId);
    const role = membership.getRole(userId);
    if (role === Role.OWNER) {
      throw new Error('Owner cannot leave workspace');
    }
    const members = membership.listMembers().filter((member) => member.userId !== userId);
    const owner = members.find((member) => member.role === Role.OWNER);
    if (!owner) {
      throw new Error('Workspace must retain an owner');
    }
    const next = new TeamMembership(owner.userId, members);
    await this.writeMembership(workspaceId, next);
  }

  async getConfig(workspaceId: string, userId?: string): Promise<SharedWorkspaceConfig> {
    if (userId) {
      const membership = await this.readMembership(workspaceId);
      if (!membership.checkPermission(userId, 'workspace.read')) {
        throw new Error('Insufficient permission to read workspace config');
      }
    }
    return this.readConfig(workspaceId);
  }

  async setConfig(
    workspaceId: string,
    userId: string,
    key: string,
    value: unknown
  ): Promise<SharedWorkspaceConfig> {
    const membership = await this.readMembership(workspaceId);
    if (!membership.checkPermission(userId, 'config.update')) {
      throw new Error('Config updates require admin or owner role');
    }
    await this.governance.gate({
      action: 'config.update',
      agentId: userId,
      resource: `workspace:${workspaceId}.config.${key}`,
      details: { valueType: typeof value },
    });

    const config = await this.readConfig(workspaceId);
    const next: SharedWorkspaceConfig = {
      ...config,
      [key]: value,
      updatedAt: new Date().toISOString(),
    };
    await this.writeConfig(workspaceId, next);
    return next;
  }
}

