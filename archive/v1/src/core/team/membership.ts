import { randomUUID } from 'crypto';

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export type TeamAction =
  | 'workspace.delete'
  | 'members.manage'
  | 'config.update'
  | 'task.run'
  | 'memory.read'
  | 'memory.write'
  | 'workspace.read';

export interface TeamMember {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
}

const ROLE_RANK: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.MEMBER]: 2,
  [Role.VIEWER]: 1,
};

const ACTION_PERMISSIONS: Record<TeamAction, Role[]> = {
  'workspace.delete': [Role.OWNER],
  'members.manage': [Role.OWNER, Role.ADMIN],
  'config.update': [Role.OWNER, Role.ADMIN],
  'task.run': [Role.OWNER, Role.ADMIN, Role.MEMBER],
  'memory.read': [Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER],
  'memory.write': [Role.OWNER, Role.ADMIN, Role.MEMBER],
  'workspace.read': [Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER],
};

export class TeamMembership {
  private readonly members = new Map<string, TeamMember>();

  constructor(ownerId: string, seedMembers: TeamMember[] = []) {
    if (seedMembers.length === 0) {
      this.members.set(ownerId, {
        id: randomUUID(),
        userId: ownerId,
        role: Role.OWNER,
        joinedAt: new Date().toISOString(),
      });
      return;
    }

    for (const member of seedMembers) {
      this.members.set(member.userId, member);
    }
  }

  listMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  addMember(userId: string, role: Role = Role.MEMBER): TeamMember {
    if (this.members.has(userId)) {
      throw new Error(`Member "${userId}" already exists`);
    }
    const member = {
      id: randomUUID(),
      userId,
      role,
      joinedAt: new Date().toISOString(),
    };
    this.members.set(userId, member);
    return member;
  }

  removeMember(actorId: string, userId: string): void {
    if (!this.checkPermission(actorId, 'members.manage')) {
      throw new Error('Insufficient permission to remove member');
    }
    const target = this.members.get(userId);
    if (!target) {
      throw new Error(`Member "${userId}" not found`);
    }
    if (target.role === Role.OWNER) {
      throw new Error('Owner cannot be removed');
    }
    this.members.delete(userId);
  }

  getRole(userId: string): Role {
    return this.members.get(userId)?.role ?? Role.VIEWER;
  }

  checkPermission(userId: string, action: TeamAction): boolean {
    const role = this.getRole(userId);
    return ACTION_PERMISSIONS[action].includes(role);
  }

  assignRole(actorId: string, targetUserId: string, role: Role): TeamMember {
    if (!this.checkPermission(actorId, 'members.manage')) {
      throw new Error('Role assignment requires admin or owner');
    }

    const actorRole = this.getRole(actorId);
    const target = this.members.get(targetUserId);
    if (!target) {
      throw new Error(`Member "${targetUserId}" not found`);
    }
    if (target.role === Role.OWNER && actorRole !== Role.OWNER) {
      throw new Error('Only owner can modify owner role');
    }
    if (ROLE_RANK[role] >= ROLE_RANK[actorRole] && actorRole !== Role.OWNER) {
      throw new Error('Permission escalation prevented');
    }

    const updated = { ...target, role };
    this.members.set(targetUserId, updated);
    return updated;
  }
}

