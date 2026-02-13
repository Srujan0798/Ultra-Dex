/**
 * Ultra-Dex Role-Based Access Control (RBAC) Manager
 * Centralizes permission logic for the entire meta-layer.
 */

import { ROLES, ROLE_PERMISSIONS, hasPermission } from '../team/permissions.js';

class RBACManager {
  constructor() {
    this.userRoles = new Map(); // userId -> role
    this.customRoles = new Map(); // roleName -> permissions[]
  }

  /**
   * Assign a role to a user
   * @param {string} userId 
   * @param {string} role 
   */
  assignRole(userId, role) {
    if (!this.isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    this.userRoles.set(userId, role);
  }

  /**
   * Get a user's role
   * @param {string} userId 
   */
  getRole(userId) {
    return this.userRoles.get(userId) || ROLES.VIEWER; // Default to viewer
  }

  /**
   * Check if a user has a specific permission
   * @param {string} userId 
   * @param {string} permission 
   */
  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    
    // Check standard roles
    if (Object.values(ROLES).includes(role)) {
      return hasPermission(role, permission);
    }

    // Check custom roles
    const customPermissions = this.customRoles.get(role);
    return customPermissions ? customPermissions.includes(permission) : false;
  }

  /**
   * Define a custom role
   * @param {string} roleName 
   * @param {string[]} permissions 
   */
  defineCustomRole(roleName, permissions) {
    if (Object.values(ROLES).includes(roleName)) {
      throw new Error(`Cannot overwrite standard role: ${roleName}`);
    }
    this.customRoles.set(roleName, permissions);
  }

  isValidRole(role) {
    return Object.values(ROLES).includes(role) || this.customRoles.has(role);
  }
}

export default RBACManager;
