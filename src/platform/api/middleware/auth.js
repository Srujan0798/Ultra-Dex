// Copyright (c) 2026 Ultra-Dex
// RBAC Middleware for API route protection

import { verifyToken } from '../authentication/jwt-service.js';

class RBACMiddleware {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
    this.roleHierarchy = new Map(); // parent -> [children]
  }

  // Define roles and their permissions
  defineRole(role, permissions = [], parentRoles = []) {
    this.roles.set(role, {
      permissions: new Set(permissions),
      parentRoles: new Set(parentRoles)
    });

    // Set up role hierarchy
    for (const parentRole of parentRoles) {
      if (!this.roleHierarchy.has(parentRole)) {
        this.roleHierarchy.set(parentRole, new Set());
      }
      this.roleHierarchy.get(parentRole).add(role);
    }
  }

  // Check if a role has a specific permission
  hasPermission(role, permission) {
    // Direct permission check
    const roleDef = this.roles.get(role);
    if (!roleDef) return false;
    
    if (roleDef.permissions.has(permission)) {
      return true;
    }

    // Check inherited permissions from parent roles
    for (const parentRole of roleDef.parentRoles) {
      if (this.hasPermission(parentRole, permission)) {
        return true;
      }
    }

    return false;
  }

  // Get all permissions for a role (including inherited)
  getAllPermissions(role) {
    const allPermissions = new Set();
    const visited = new Set();

    const collectPermissions = (currentRole) => {
      if (visited.has(currentRole)) return;
      visited.add(currentRole);

      const roleDef = this.roles.get(currentRole);
      if (roleDef) {
        // Add direct permissions
        roleDef.permissions.forEach(p => allPermissions.add(p));

        // Recursively add parent role permissions
        roleDef.parentRoles.forEach(parentRole => {
          collectPermissions(parentRole);
        });
      }
    };

    collectPermissions(role);
    return Array.from(allPermissions);
  }

  // Middleware function to check authorization
  async authorize(requiredPermission) {
    return async (req, res, next) => {
      try {
        // Extract token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Unauthorized: Missing or invalid authorization header'
          });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        let decoded;
        try {
          decoded = await verifyToken(token, process.env.JWT_SECRET || 'fallback-secret-key');
        } catch (error) {
          return res.status(401).json({
            error: 'Unauthorized: Invalid or expired token'
          });
        }

        // Check if user has required permission
        const userRole = decoded.role || 'user'; // Default role if not specified
        const hasPerm = this.hasPermission(userRole, requiredPermission);

        if (!hasPerm) {
          return res.status(403).json({
            error: `Forbidden: Insufficient permissions. Required: ${requiredPermission}, User role: ${userRole}`
          });
        }

        // Attach user info to request
        req.user = {
          id: decoded.userId || decoded.sub,
          role: userRole,
          permissions: this.getAllPermissions(userRole)
        };

        next();
      } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
          error: 'Internal server error during authorization'
        });
      }
    };
  }

  // Initialize default roles and permissions
  initializeDefaultRoles() {
    // Define basic roles
    this.defineRole('anonymous', []); // Unauthenticated users
    this.defineRole('user', [
      'read:profile',
      'read:dashboard',
      'create:chat',
      'read:chat'
    ]);
    this.defineRole('admin', [
      'read:profile',
      'read:dashboard',
      'create:chat',
      'read:chat',
      'manage:users',
      'read:analytics',
      'manage:settings',
      'delete:resources'
    ], ['user']); // Admin inherits from user
    this.defineRole('superadmin', [
      'read:profile',
      'read:dashboard',
      'create:chat',
      'read:chat',
      'manage:users',
      'read:analytics',
      'manage:settings',
      'delete:resources',
      'manage:roles',
      'manage:permissions',
      'access:all'
    ], ['admin']); // Superadmin inherits from admin
  }
}

// Singleton instance
const rbac = new RBACMiddleware();
rbac.initializeDefaultRoles();

export default rbac;