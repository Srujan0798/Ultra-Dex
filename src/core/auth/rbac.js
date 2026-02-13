/**
 * Ultra-Dex Role-Based Access Control (RBAC) Manager
 * Enterprise-grade permission system with hierarchical roles
 */

import { EventEmitter } from 'events';

// Define role hierarchy (higher roles inherit permissions from lower roles)
const ROLE_HIERARCHY = {
  'owner': ['admin', 'manager', 'developer', 'viewer'],
  'admin': ['manager', 'developer', 'viewer'],
  'manager': ['developer', 'viewer'],
  'developer': ['viewer'],
  'viewer': [],
};

// Define system-wide permissions
const PERMISSIONS = {
  // Core system permissions
  'system:read': 'Read system information',
  'system:write': 'Write system information',
  'system:admin': 'Full system administration',
  
  // Agent permissions
  'agent:create': 'Create new agents',
  'agent:read': 'Read agent information',
  'agent:update': 'Update agent configuration',
  'agent:delete': 'Delete agents',
  'agent:execute': 'Execute agent tasks',
  
  // Memory permissions
  'memory:read': 'Read memory entries',
  'memory:write': 'Write to memory',
  'memory:delete': 'Delete memory entries',
  'memory:search': 'Search memory',
  
  // Project permissions
  'project:create': 'Create new projects',
  'project:read': 'Read project information',
  'project:update': 'Update project configuration',
  'project:delete': 'Delete projects',
  
  // User management permissions
  'user:read': 'Read user information',
  'user:create': 'Create new users',
  'user:update': 'Update user information',
  'user:delete': 'Delete users',
  
  // Configuration permissions
  'config:read': 'Read system configuration',
  'config:write': 'Write system configuration',
  'config:admin': 'Full configuration management',
  
  // Audit permissions
  'audit:read': 'Read audit logs',
  'audit:write': 'Write audit logs',
  'audit:admin': 'Full audit management',
  
  // Security permissions
  'security:read': 'Read security information',
  'security:write': 'Write security information',
  'security:admin': 'Full security administration',
  
  // Billing permissions
  'billing:read': 'Read billing information',
  'billing:write': 'Write billing information',
  'billing:admin': 'Full billing administration',
};

class RBACManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      defaultRole: options.defaultRole || 'viewer',
      enableAudit: options.enableAudit !== false,
      ...options
    };
    
    this.roles = new Map(); // role -> permissions mapping
    this.users = new Map(); // userId -> roles mapping
    this.auditLog = []; // Permission audit trail
    
    this.initializeDefaultRoles();
  }

  initializeDefaultRoles() {
    // Initialize default roles with their permissions
    this.roles.set('viewer', {
      name: 'Viewer',
      description: 'Can view but not modify anything',
      permissions: [
        'system:read',
        'agent:read',
        'memory:read',
        'memory:search',
        'project:read',
        'user:read',
        'config:read',
        'audit:read',
        'security:read'
      ]
    });
    
    this.roles.set('developer', {
      name: 'Developer',
      description: 'Can develop and execute agents',
      permissions: [
        'system:read',
        'agent:read',
        'agent:create',
        'agent:execute',
        'memory:read',
        'memory:write',
        'memory:search',
        'project:read',
        'project:create',
        'user:read',
        'config:read',
        'audit:read',
        'security:read'
      ]
    });
    
    this.roles.set('manager', {
      name: 'Manager',
      description: 'Can manage projects and teams',
      permissions: [
        'system:read',
        'agent:read',
        'agent:create',
        'agent:update',
        'agent:execute',
        'memory:read',
        'memory:write',
        'memory:search',
        'project:read',
        'project:create',
        'project:update',
        'user:read',
        'config:read',
        'audit:read',
        'security:read'
      ]
    });
    
    this.roles.set('admin', {
      name: 'Administrator',
      description: 'Full administrative access',
      permissions: [
        'system:read',
        'system:write',
        'system:admin',
        'agent:read',
        'agent:create',
        'agent:update',
        'agent:delete',
        'agent:execute',
        'memory:read',
        'memory:write',
        'memory:delete',
        'memory:search',
        'project:read',
        'project:create',
        'project:update',
        'project:delete',
        'user:read',
        'user:create',
        'user:update',
        'user:delete',
        'config:read',
        'config:write',
        'config:admin',
        'audit:read',
        'audit:write',
        'audit:admin',
        'security:read',
        'security:write',
        'security:admin',
        'billing:read',
        'billing:write',
        'billing:admin'
      ]
    });
    
    this.roles.set('owner', {
      name: 'Owner',
      description: 'Complete system access with no restrictions',
      permissions: Object.keys(PERMISSIONS) // All permissions
    });
  }

  /**
   * Add a new role to the system
   * @param {string} roleName - Name of the role
   * @param {object} roleDefinition - Role definition with permissions
   */
  addRole(roleName, roleDefinition) {
    if (this.roles.has(roleName)) {
      throw new Error(`Role ${roleName} already exists`);
    }
    
    if (!roleDefinition.permissions || !Array.isArray(roleDefinition.permissions)) {
      throw new Error('Role definition must include permissions array');
    }
    
    // Validate all permissions exist
    for (const perm of roleDefinition.permissions) {
      if (!PERMISSIONS[perm]) {
        throw new Error(`Unknown permission: ${perm}`);
      }
    }
    
    this.roles.set(roleName, {
      name: roleDefinition.name || roleName,
      description: roleDefinition.description || `Custom role: ${roleName}`,
      permissions: roleDefinition.permissions,
      createdAt: new Date().toISOString()
    });
    
    this.emit('role:created', { roleName, roleDefinition });
  }

  /**
   * Assign a role to a user
   * @param {string} userId - User ID
   * @param {string} roleName - Role to assign
   */
  async assignRole(userId, roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role ${roleName} does not exist`);
    }
    
    if (!this.users.has(userId)) {
      this.users.set(userId, { roles: new Set([this.options.defaultRole]), assignedAt: new Date().toISOString() });
    }
    
    const userData = this.users.get(userId);
    userData.roles.add(roleName);
    userData.assignedAt = new Date().toISOString();
    
    if (this.options.enableAudit) {
      this.auditLog.push({
        action: 'role:assign',
        userId,
        roleName,
        timestamp: new Date().toISOString(),
        grantedBy: 'system' // In real implementation, this would be the admin who granted
      });
    }
    
    this.emit('role:assigned', { userId, roleName, timestamp: new Date().toISOString() });
  }

  /**
   * Remove a role from a user
   * @param {string} userId - User ID
   * @param {string} roleName - Role to remove
   */
  async removeRole(userId, roleName) {
    const userData = this.users.get(userId);
    if (!userData) {
      throw new Error(`User ${userId} not found`);
    }
    
    if (!userData.roles.has(roleName)) {
      throw new Error(`User ${userId} does not have role ${roleName}`);
    }
    
    // Don't allow removing the default role if it's the only role
    if (userData.roles.size === 1 && roleName === this.options.defaultRole) {
      throw new Error(`Cannot remove default role ${roleName} from user ${userId}`);
    }
    
    userData.roles.delete(roleName);
    
    if (this.options.enableAudit) {
      this.auditLog.push({
        action: 'role:remove',
        userId,
        roleName,
        timestamp: new Date().toISOString(),
        revokedBy: 'system'
      });
    }
    
    this.emit('role:removed', { userId, roleName, timestamp: new Date().toISOString() });
  }

  /**
   * Check if a user has a specific role
   * @param {string} userId - User ID
   * @param {string} roleName - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(userId, roleName) {
    const userData = this.users.get(userId);
    if (!userData) {
      return false;
    }
    
    // Check direct role assignment
    if (userData.roles.has(roleName)) {
      return true;
    }
    
    // Check inherited roles
    for (const userRole of userData.roles) {
      const hierarchy = ROLE_HIERARCHY[userRole] || [];
      if (hierarchy.includes(roleName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a user has a specific permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has the permission
   */
  hasPermission(userId, permission) {
    const userData = this.users.get(userId);
    if (!userData) {
      return false;
    }
    
    // Check all roles and their inherited roles for the permission
    for (const roleName of userData.roles) {
      const role = this.roles.get(roleName);
      if (role && role.permissions.includes(permission)) {
        return true;
      }
      
      // Check inherited permissions from role hierarchy
      const hierarchy = ROLE_HIERARCHY[roleName] || [];
      for (const inheritedRole of hierarchy) {
        const inheritedRoleData = this.roles.get(inheritedRole);
        if (inheritedRoleData && inheritedRoleData.permissions.includes(permission)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get all permissions for a user (including inherited)
   * @param {string} userId - User ID
   * @returns {Array<string>} Array of permissions
   */
  getUserPermissions(userId) {
    const userData = this.users.get(userId);
    if (!userData) {
      return [];
    }
    
    const permissions = new Set();
    
    // Add permissions from direct roles
    for (const roleName of userData.roles) {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(perm => permissions.add(perm));
      }
      
      // Add permissions from inherited roles
      const hierarchy = ROLE_HIERARCHY[roleName] || [];
      for (const inheritedRole of hierarchy) {
        const inheritedRoleData = this.roles.get(inheritedRole);
        if (inheritedRoleData) {
          inheritedRoleData.permissions.forEach(perm => permissions.add(perm));
        }
      }
    }
    
    return Array.from(permissions);
  }

  /**
   * Get all roles assigned to a user
   * @param {string} userId - User ID
   * @returns {Array<string>} Array of roles
   */
  getUserRoles(userId) {
    const userData = this.users.get(userId);
    if (!userData) {
      return [];
    }
    
    return Array.from(userData.roles);
  }

  /**
   * Get all users with a specific role
   * @param {string} roleName - Role to search for
   * @returns {Array<string>} Array of user IDs
   */
  getUsersWithRole(roleName) {
    const users = [];
    
    for (const [userId, userData] of this.users) {
      if (this.hasRole(userId, roleName)) {
        users.push(userId);
      }
    }
    
    return users;
  }

  /**
   * Validate a user's access to a resource
   * @param {string} userId - User ID
   * @param {string} resource - Resource identifier
   * @param {string} action - Action to perform (read, write, delete, etc.)
   * @returns {object} Validation result with allowed status and reason
   */
  validateAccess(userId, resource, action) {
    const permission = `${resource}:${action}`;
    const hasPerm = this.hasPermission(userId, permission);
    
    if (hasPerm) {
      return {
        allowed: true,
        reason: 'User has required permission',
        permission
      };
    }
    
    // Check for wildcard permissions
    const wildcardPermission = `${resource}:*`;
    if (this.hasPermission(userId, wildcardPermission)) {
      return {
        allowed: true,
        reason: 'User has wildcard permission for resource',
        permission: wildcardPermission
      };
    }
    
    return {
      allowed: false,
      reason: 'User does not have required permission',
      permission
    };
  }

  /**
   * Bulk permission check for multiple resources
   * @param {string} userId - User ID
   * @param {Array<{resource: string, action: string}>} checks - Array of resource-action pairs to check
   * @returns {Array<{resource: string, action: string, allowed: boolean, reason: string}>} Results
   */
  bulkPermissionCheck(userId, checks) {
    return checks.map(check => ({
      resource: check.resource,
      action: check.action,
      ...this.validateAccess(userId, check.resource, check.action)
    }));
  }

  /**
   * Get role definition
   * @param {string} roleName - Role name
   * @returns {object} Role definition
   */
  getRole(roleName) {
    return this.roles.get(roleName);
  }

  /**
   * Get all roles in the system
   * @returns {Array<string>} Array of role names
   */
  getAllRoles() {
    return Array.from(this.roles.keys());
  }

  /**
   * Get all users in the system
   * @returns {Array<string>} Array of user IDs
   */
  getAllUsers() {
    return Array.from(this.users.keys());
  }

  /**
   * Get audit log
   * @param {object} options - Filtering options
   * @returns {Array<object>} Audit log entries
   */
  getAuditLog(options = {}) {
    let log = this.auditLog;
    
    if (options.userId) {
      log = log.filter(entry => entry.userId === options.userId);
    }
    
    if (options.action) {
      log = log.filter(entry => entry.action === options.action);
    }
    
    if (options.startDate) {
      log = log.filter(entry => new Date(entry.timestamp) >= new Date(options.startDate));
    }
    
    if (options.endDate) {
      log = log.filter(entry => new Date(entry.timestamp) <= new Date(options.endDate));
    }
    
    // Sort by timestamp descending
    log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (options.limit) {
      log = log.slice(0, options.limit);
    }
    
    return log;
  }

  /**
   * Get user access summary
   * @param {string} userId - User ID
   * @returns {object} User access summary
   */
  getUserAccessSummary(userId) {
    const roles = this.getUserRoles(userId);
    const permissions = this.getUserPermissions(userId);
    
    return {
      userId,
      roles,
      permissions,
      roleDetails: roles.map(role => this.getRole(role)),
      permissionDetails: permissions.map(perm => ({
        permission: perm,
        description: PERMISSIONS[perm]
      }))
    };
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissions - Permissions to check
   * @returns {boolean} True if user has any of the permissions
   */
  hasAnyPermission(userId, permissions) {
    return permissions.some(perm => this.hasPermission(userId, perm));
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissions - Permissions to check
   * @returns {boolean} True if user has all of the permissions
   */
  hasAllPermissions(userId, permissions) {
    return permissions.every(perm => this.hasPermission(userId, perm));
  }

  /**
   * Get role hierarchy information
   * @returns {object} Role hierarchy mapping
   */
  getRoleHierarchy() {
    return { ...ROLE_HIERARCHY };
  }

  /**
   * Get all available permissions
   * @returns {object} Permission definitions
   */
  getAvailablePermissions() {
    return { ...PERMISSIONS };
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      userCount: this.users.size,
      roleCount: this.roles.size,
      auditLogSize: this.auditLog.length,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();

// Export class for instantiation with custom options
export default RBACManager;