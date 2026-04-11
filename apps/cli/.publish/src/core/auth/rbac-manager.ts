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
  VIEWER: 'viewer',
};
const PERMISSIONS = {
  PROJECT_READ: 'project.read',
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  TEAM_SETTINGS: 'team.settings',
  TEAM_MEMBERS: 'team.members',
};
const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.TEAM_SETTINGS,
    PERMISSIONS.TEAM_MEMBERS,
  ],
  editor: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.TEAM_SETTINGS,
  ],
  viewer: [PERMISSIONS.PROJECT_READ],
  member: [PERMISSIONS.PROJECT_READ, PERMISSIONS.PROJECT_CREATE],
};
let RBACManager = class {
  constructor() {
    this.roles = /* @__PURE__ */ new Map();
    this.customRoles = /* @__PURE__ */ new Map();
    this.roleHierarchy = {
      [ROLES.ADMIN]: [
        PERMISSIONS.PROJECT_READ,
        PERMISSIONS.PROJECT_CREATE,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.PROJECT_DELETE,
        PERMISSIONS.TEAM_SETTINGS,
        PERMISSIONS.TEAM_MEMBERS,
      ],
      [ROLES.EDITOR]: [
        PERMISSIONS.PROJECT_READ,
        PERMISSIONS.PROJECT_CREATE,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.TEAM_SETTINGS,
      ],
      [ROLES.VIEWER]: [PERMISSIONS.PROJECT_READ],
    };
    this.customRoles.set('role-developer', [
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_UPDATE,
    ]);
    // Set default role based on environment
    const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
    this.defaultRole = isProduction ? ROLES.VIEWER : 'role-developer';
  }
  assignRole(userId, role, scope = null, assignedBy = null) {
    if (
      role !== ROLES.ADMIN &&
      role !== ROLES.EDITOR &&
      role !== ROLES.VIEWER &&
      !this.customRoles.has(role)
    ) {
      throw new Error(`Invalid role: ${role}`);
    }
    this.roles.set(userId, role);
    return {
      userId,
      roleId: role,
      scope,
      assignedBy,
      assignedAt: /* @__PURE__ */ new Date(),
    };
  }
  getRole(userId) {
    return this.roles.get(userId) || this.defaultRole;
  }
  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    if (this.customRoles.has(role)) {
      const customRolePermissions = this.customRoles.get(role);
      return customRolePermissions.includes(permission);
    }
    const permissions = this.roleHierarchy[role] || this.roleHierarchy[this.defaultRole];
    return permissions.includes(permission);
  }
  defineCustomRole(roleName, permissions) {
    this.customRoles.set(roleName, permissions);
  }
};
RBACManager = __decorateClass([singleton()], RBACManager);
var rbac_manager_default = RBACManager;
export { PERMISSIONS, RBACManager, ROLES, ROLE_PERMISSIONS, rbac_manager_default as default };

export const rbacManager = new RBACManager();
