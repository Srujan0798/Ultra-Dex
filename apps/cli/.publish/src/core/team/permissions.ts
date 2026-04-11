var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  MEMBER: 'member',
  VIEWER: 'viewer',
};
const PERMISSIONS = {
  // Project permissions
  PROJECT_READ: 'project:read',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  // Team permissions
  TEAM_SETTINGS: 'team:settings',
  TEAM_INVITE: 'team:invite',
  TEAM_REMOVE: 'team:remove',
  // Agent permissions
  AGENT_EXECUTE: 'agent:execute',
  AGENT_CONFIGURE: 'agent:configure',
  // System permissions
  SYSTEM_ADMIN: 'system:admin',
};
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.EDITOR, ROLES.MEMBER, ROLES.VIEWER],
  [ROLES.EDITOR]: [ROLES.MEMBER, ROLES.VIEWER],
  [ROLES.MEMBER]: [ROLES.VIEWER],
  [ROLES.VIEWER]: [],
};
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    hasAll: true,
    explicit: [],
  },
  [ROLES.EDITOR]: {
    hasAll: false,
    explicit: [
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_UPDATE,
      PERMISSIONS.AGENT_EXECUTE,
    ],
  },
  [ROLES.MEMBER]: {
    hasAll: false,
    explicit: [PERMISSIONS.PROJECT_READ, PERMISSIONS.AGENT_EXECUTE],
  },
  [ROLES.VIEWER]: {
    hasAll: false,
    explicit: [PERMISSIONS.PROJECT_READ],
  },
};
let TeamPermissions = class {
  constructor() {
    this.userRoles = /* @__PURE__ */ new Map();
    this.customRoles = /* @__PURE__ */ new Map();
    this.initialized = false;
  }
  async initialize() {
    this.initialized = true;
  }
  // Get all available roles
  getAvailableRoles() {
    return Object.values(ROLES);
  }
  // Get all available permissions
  getAvailablePermissions() {
    return Object.values(PERMISSIONS);
  }
  // Define a custom role
  defineCustomRole(roleName, permissions) {
    if (this.userRoles.has(roleName)) {
      throw new Error(`Cannot define custom role: '${roleName}' already exists as a user role`);
    }
    const validPermissions = Object.values(PERMISSIONS);
    for (const perm of permissions) {
      if (!validPermissions.includes(perm)) {
        throw new Error(`Invalid permission: ${perm}`);
      }
    }
    this.customRoles.set(roleName, permissions);
    return { name: roleName, permissions };
  }
  // Assign role to user
  assignRole(userId, role) {
    const validRoles = [...this.getAvailableRoles(), ...this.customRoles.keys()];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
    }
    this.userRoles.set(userId, role);
    return { userId, role };
  }
  // Get user's role
  getRole(userId) {
    return this.userRoles.get(userId) || ROLES.VIEWER;
  }
  // Get permissions for a role
  getRolePermissions(role) {
    if (this.customRoles.has(role)) {
      return this.customRoles.get(role);
    }
    const roleConfig = ROLE_PERMISSIONS[role];
    if (!roleConfig) {
      return [];
    }
    if (roleConfig.hasAll) {
      return Object.values(PERMISSIONS);
    }
    const inheritedRoles = ROLE_HIERARCHY[role] || [];
    const allPermissions = new Set(roleConfig.explicit);
    for (const inheritedRole of inheritedRoles) {
      const inheritedConfig = ROLE_PERMISSIONS[inheritedRole];
      if (inheritedConfig && !inheritedConfig.hasAll) {
        inheritedConfig.explicit.forEach((p) => allPermissions.add(p));
      }
    }
    return Array.from(allPermissions);
  }
  // Check if user has permission
  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    const rolePermissions = this.getRolePermissions(role);
    if (role === ROLES.ADMIN) {
      return true;
    }
    return rolePermissions.includes(permission);
  }
  // Check if user has role
  hasRole(userId, role) {
    return this.getRole(userId) === role;
  }
  // Check if user has any of the roles
  hasAnyRole(userId, roles) {
    const userRole = this.getRole(userId);
    return roles.includes(userRole);
  }
  // Remove user's role
  removeRole(userId) {
    return this.userRoles.delete(userId);
  }
  // Delete custom role
  deleteCustomRole(roleName) {
    if (!this.customRoles.has(roleName)) {
      throw new Error(`Custom role not found: ${roleName}`);
    }
    for (const [userId, role] of this.userRoles.entries()) {
      if (role === roleName) {
        this.userRoles.set(userId, ROLES.VIEWER);
      }
    }
    return this.customRoles.delete(roleName);
  }
  // Get all users with a specific role
  getUsersByRole(role) {
    const users = [];
    for (const [userId, userRole] of this.userRoles.entries()) {
      if (userRole === role) {
        users.push(userId);
      }
    }
    return users;
  }
  // Export configuration
  export() {
    return {
      userRoles: Object.fromEntries(this.userRoles),
      customRoles: Object.fromEntries(this.customRoles),
      roles: this.getAvailableRoles(),
      permissions: this.getAvailablePermissions(),
    };
  }
  // Import configuration
  import(config) {
    if (config.userRoles) {
      for (const [userId, role] of Object.entries(config.userRoles)) {
        this.userRoles.set(userId, role);
      }
    }
    if (config.customRoles) {
      for (const [name, permissions] of Object.entries(config.customRoles)) {
        this.customRoles.set(name, permissions);
      }
    }
  }
};
TeamPermissions = __decorateClass([singleton()], TeamPermissions);
const teamPermissions = new TeamPermissions();
var permissions_default = teamPermissions;
export { PERMISSIONS, ROLES, TeamPermissions, permissions_default as default, teamPermissions };
