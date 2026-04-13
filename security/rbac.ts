/**
 * Ultra-Dex RBAC (Role-Based Access Control)
 *
 * Production-grade permission system for workflow execution.
 * Supports roles, permissions, and resource-level access control.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'operator' | 'viewer' | 'agent';

export type Permission =
  | 'workflow:create'
  | 'workflow:read'
  | 'workflow:update'
  | 'workflow:delete'
  | 'workflow:execute'
  | 'workflow:cancel'
  | 'task:read'
  | 'task:execute'
  | 'system:config'
  | 'system:logs'
  | 'system:metrics'
  | 'agent:register'
  | 'agent:unregister';

export interface User {
  id: string;
  name: string;
  roles: Role[];
  permissions?: Permission[]; // Additional granular permissions
}

export interface Resource {
  type: 'workflow' | 'task' | 'system' | 'agent';
  id: string;
  ownerId?: string;
  orgId?: string;
}

export interface AccessRequest {
  user: User;
  resource: Resource;
  permission: Permission;
}

// ──────────────────────────────────────────────────────────────────────────────
// Role Definitions
// ──────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'workflow:create', 'workflow:read', 'workflow:update', 'workflow:delete', 'workflow:execute', 'workflow:cancel',
    'task:read', 'task:execute',
    'system:config', 'system:logs', 'system:metrics',
    'agent:register', 'agent:unregister',
  ],
  operator: [
    'workflow:create', 'workflow:read', 'workflow:execute', 'workflow:cancel',
    'task:read', 'task:execute',
    'system:logs', 'system:metrics',
  ],
  viewer: [
    'workflow:read',
    'task:read',
    'system:metrics',
  ],
  agent: [
    'task:read', 'task:execute',
    'workflow:read',
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// RBAC Engine
// ──────────────────────────────────────────────────────────────────────────────

export interface RBACConfig {
  enforceOwnership?: boolean;
  allowWildcardResources?: boolean;
}

export class RBAC {
  private config: RBACConfig;

  constructor(config?: RBACConfig) {
    this.config = {
      enforceOwnership: config?.enforceOwnership ?? true,
      allowWildcardResources: config?.allowWildcardResources ?? false,
    };
  }

  /**
   * Check if a user has permission for a resource
   */
  check(request: AccessRequest): { allowed: boolean; reason?: string } {
    const { user, resource, permission } = request;

    // 1. Check role-based permissions
    const userPermissions = this.getUserPermissions(user);
    if (!userPermissions.includes(permission)) {
      return {
        allowed: false,
        reason: `User ${user.id} with roles [${user.roles.join(', ')}] lacks permission ${permission}`,
      };
    }

    // 2. Check ownership if enforcing
    if (this.config.enforceOwnership && resource.ownerId) {
      const isOwner = resource.ownerId === user.id;
      const isAdmin = user.roles.includes('admin');
      
      if (!isOwner && !isAdmin) {
        return {
          allowed: false,
          reason: `User ${user.id} is not owner of ${resource.type}:${resource.id}`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check permission (throws if denied)
   */
  enforce(request: AccessRequest): void {
    const result = this.check(request);
    if (!result.allowed) {
      throw new AuthorizationError(result.reason ?? 'Access denied');
    }
  }

  /**
   * Get all permissions for a user (from roles + explicit)
   */
  getUserPermissions(user: User): Permission[] {
    const fromRoles = user.roles.flatMap(r => ROLE_PERMISSIONS[r]);
    const explicit = user.permissions ?? [];
    return [...new Set([...fromRoles, ...explicit])];
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: User, role: Role): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: User, roles: Role[]): boolean {
    return roles.some(r => user.roles.includes(r));
  }

  /**
   * Validate that a user can assume the given roles
   */
  validateRoles(roles: Role[]): { valid: boolean; invalidRoles?: Role[] } {
    const validRoles: Role[] = ['admin', 'operator', 'viewer', 'agent'];
    const invalid = roles.filter(r => !validRoles.includes(r));
    
    if (invalid.length > 0) {
      return { valid: false, invalidRoles: invalid };
    }
    return { valid: true };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Authorization Error
// ──────────────────────────────────────────────────────────────────────────────

export class AuthorizationError extends Error {
  code = 'AUTHORIZATION_FAILED';
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Policy Engine
// ──────────────────────────────────────────────────────────────────────────────

export interface Policy {
  name: string;
  description: string;
  match: (request: AccessRequest) => boolean;
  effect: 'allow' | 'deny';
  priority: number;
}

export class PolicyEngine {
  private policies: Policy[] = [];

  addPolicy(policy: Policy): void {
    this.policies.push(policy);
    // Sort by priority (higher = evaluated first)
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  removePolicy(name: string): boolean {
    const idx = this.policies.findIndex(p => p.name === name);
    if (idx >= 0) {
      this.policies.splice(idx, 1);
      return true;
    }
    return false;
  }

  evaluate(request: AccessRequest): { allowed: boolean; matchedPolicy?: string } {
    for (const policy of this.policies) {
      if (policy.match(request)) {
        return {
          allowed: policy.effect === 'allow',
          matchedPolicy: policy.name,
        };
      }
    }
    // Default deny
    return { allowed: false };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────────────────────

export function createUser(id: string, name: string, roles: Role[]): User {
  return { id, name, roles };
}

export function createResource(type: Resource['type'], id: string, ownerId?: string): Resource {
  return { type, id, ownerId };
}
