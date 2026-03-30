/**
 * Team Permissions - REAL RBAC Implementation
 * Role-Based Access Control with hierarchy
 */

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
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

// Role hierarchy (higher roles inherit from lower)
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.EDITOR, ROLES.MEMBER, ROLES.VIEWER],
  [ROLES.EDITOR]: [ROLES.MEMBER, ROLES.VIEWER],
  [ROLES.MEMBER]: [ROLES.VIEWER],
  [ROLES.VIEWER]: [],
};

// Default permissions for each role
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
    explicit: [
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.AGENT_EXECUTE,
    ],
  },
  [ROLES.VIEWER]: {
    hasAll: false,
    explicit: [
      PERMISSIONS.PROJECT_READ,
    ],
  },
};

export class TeamPermissions {
  constructor() {
    this.userRoles = new Map();
    this.customRoles = new Map();
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
    
    // Validate permissions
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
    // Check custom roles first
    if (this.customRoles.has(role)) {
      return this.customRoles.get(role);
    }

    // Check built-in roles
    const roleConfig = ROLE_PERMISSIONS[role];
    if (!roleConfig) {
      return [];
    }

    if (roleConfig.hasAll) {
      return Object.values(PERMISSIONS);
    }

    // Include inherited permissions from lower roles
    const inheritedRoles = ROLE_HIERARCHY[role] || [];
    const allPermissions = new Set(roleConfig.explicit);

    for (const inheritedRole of inheritedRoles) {
      const inheritedConfig = ROLE_PERMISSIONS[inheritedRole];
      if (inheritedConfig && !inheritedConfig.hasAll) {
        inheritedConfig.explicit.forEach(p => allPermissions.add(p));
      }
    }

    return Array.from(allPermissions);
  }

  // Check if user has permission
  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    const rolePermissions = this.getRolePermissions(role);
    
    // Admin has all permissions
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

    // Remove from users
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
}

export const teamPermissions = new TeamPermissions();
export default teamPermissions;
