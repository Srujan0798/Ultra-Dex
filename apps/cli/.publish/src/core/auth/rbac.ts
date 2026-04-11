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
let RBAC = class {
  constructor() {
    this.roles = /* @__PURE__ */ new Map();
    this.permissions = /* @__PURE__ */ new Map();
    this.userRoles = /* @__PURE__ */ new Map();
    this.initializeDefaultRoles();
  }
  initializeDefaultRoles() {
    this.createRole('admin', {
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*'],
    });
    this.createRole('user', {
      name: 'User',
      description: 'Standard user access',
      permissions: ['read', 'execute', 'create_tasks'],
    });
    this.createRole('agent', {
      name: 'Agent',
      description: 'AI agent access',
      permissions: ['read', 'execute', 'write_logs', 'access_memory'],
    });
  }
  createRole(roleId, roleData) {
    this.roles.set(roleId, {
      id: roleId,
      ...roleData,
      created: /* @__PURE__ */ new Date(),
    });
    return this.roles.get(roleId);
  }
  assignRole(userId, roleId) {
    if (!this.roles.has(roleId)) {
      throw new Error(`Role not found: ${roleId}`);
    }
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, /* @__PURE__ */ new Set());
    }
    this.userRoles.get(userId).add(roleId);
    return true;
  }
  removeRole(userId, roleId) {
    const userRoles = this.userRoles.get(userId);
    if (userRoles) {
      userRoles.delete(roleId);
    }
    return true;
  }
  hasPermission(userId, permission) {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) return false;
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (role) {
        if (role.permissions.includes('*')) {
          return true;
        }
        if (role.permissions.includes(permission)) {
          return true;
        }
        for (const perm of role.permissions) {
          if (perm.includes('*') && permission.startsWith(perm.replace('*', ''))) {
            return true;
          }
        }
      }
    }
    return false;
  }
  getUserRoles(userId) {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) return [];
    return Array.from(userRoles).map((roleId) => this.roles.get(roleId));
  }
  checkAccess(userId, resource, action) {
    const permission = `${action}:${resource}`;
    return (
      this.hasPermission(userId, permission) ||
      this.hasPermission(userId, action) ||
      this.hasPermission(userId, `${resource}:*`)
    );
  }
  middleware() {
    return (req, res, next) => {
      const userId = req.user?.id;
      const resource = req.route?.path;
      const action = req.method.toLowerCase();
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!this.checkAccess(userId, resource, action)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
  getStats() {
    return {
      roles: this.roles.size,
      users: this.userRoles.size,
      totalPermissions: Array.from(this.roles.values()).reduce(
        (sum, role) => sum + role.permissions.length,
        0
      ),
    };
  }
};
RBAC = __decorateClass([singleton()], RBAC);
var rbac_default = RBAC;
export { RBAC, rbac_default as default };
