// Copyright (c) 2026 Ultra-Dex
/**
 * User Management and Organization Service
 * Handles users, organizations, and hierarchical relationships
 *
 * @module services/auth/user-service
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import errorHandler from '../../../apps/cli/lib/utils/error-handler.js';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  parentId?: string; // For hierarchical organizations
  settings: {
    ssoEnabled: boolean;
    mfaRequired: boolean;
    defaultRole: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  joinedAt: Date;
}

/**
 * User and Organization Service
 */
export class UserService {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    process.stdout.write('✓ User service initialized\n');
    this.initialized = true;
  }

  /**
   * Create user
   */
  async createUser(
    email: string,
    firstName: string,
    lastName: string,
    organizationId: string,
    password?: string,
    role: string = 'member'
  ): Promise<User> {
    await this.initialize();

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw errorHandler.createError('VALIDATION_ERROR', 'User already exists');
    }

    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      firstName,
      lastName,
      organizationId,
      role,
      permissions: await this.getRolePermissions(role),
      mfaEnabled: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await ppmManager.add({
      content: `User created: ${email}`,
      type: 'user-created',
      importance: 8,
      metadata: user,
    });

    // Store password hash if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await ppmManager.add({
        content: `Password hash for user: ${email}`,
        type: 'user-password',
        importance: 1, // Low importance for security
        metadata: {
          userId: user.id,
          hash: passwordHash,
        },
      });
    }

    // Add to organization
    await this.addUserToOrganization(user.id, organizationId, role);

    await auditLogger.log({
      type: 'user.management',
      severity: 'info',
      action: 'USER_CREATED',
      resource: 'users',
      resourceId: user.id,
      details: {
        email,
        organizationId,
        role,
      },
    });

    return user;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    await this.initialize();

    const results = await ppmManager.search(`user:${userId}`);
    if (results && results.length > 0) {
      return results[0].metadata as User;
    }
    return null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();

    const results = await ppmManager.search(`user-email:${email.toLowerCase()}`);
    if (results && results.length > 0) {
      return results[0].metadata as User;
    }
    return null;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();

    const user = await this.getUser(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };

    // Update permissions if role changed
    if (updates.role && updates.role !== user.role) {
      updatedUser.permissions = await this.getRolePermissions(updates.role);
    }

    await ppmManager.add({
      content: `User updated: ${user.email}`,
      type: 'user-updated',
      importance: 6,
      metadata: updatedUser,
    });

    await auditLogger.log({
      type: 'user.management',
      severity: 'info',
      action: 'USER_UPDATED',
      userId,
      resource: 'users',
      resourceId: userId,
      details: updates,
    });

    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    await this.initialize();

    const user = await this.getUser(userId);
    if (!user) return false;

    // Mark as inactive instead of deleting
    await this.updateUser(userId, { status: 'inactive' });

    await auditLogger.log({
      type: 'user.management',
      severity: 'warning',
      action: 'USER_DELETED',
      userId,
      resource: 'users',
      resourceId: userId,
      details: {
        email: user.email,
      },
    });

    return true;
  }

  /**
   * Create organization
   */
  async createOrganization(
    name: string,
    domain?: string,
    parentId?: string,
    settings?: Partial<Organization['settings']>
  ): Promise<Organization> {
    await this.initialize();

    const organization: Organization = {
      id: uuidv4(),
      name,
      domain: domain?.toLowerCase(),
      parentId,
      settings: {
        ssoEnabled: false,
        mfaRequired: false,
        defaultRole: 'member',
        ...settings,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await ppmManager.add({
      content: `Organization created: ${name}`,
      type: 'organization-created',
      importance: 9,
      metadata: organization,
    });

    await auditLogger.log({
      type: 'organization.management',
      severity: 'info',
      action: 'ORGANIZATION_CREATED',
      resource: 'organizations',
      resourceId: organization.id,
      details: {
        name,
        domain,
        parentId,
      },
    });

    return organization;
  }

  /**
   * Get organization
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    await this.initialize();

    const results = await ppmManager.search(`organization:${orgId}`);
    if (results && results.length > 0) {
      return results[0].metadata as Organization;
    }
    return null;
  }

  /**
   * Get organization hierarchy
   */
  async getOrganizationHierarchy(orgId: string): Promise<Organization[]> {
    await this.initialize();

    const hierarchy: Organization[] = [];
    let currentOrg = await this.getOrganization(orgId);

    while (currentOrg) {
      hierarchy.unshift(currentOrg);
      if (currentOrg.parentId) {
        currentOrg = await this.getOrganization(currentOrg.parentId);
      } else {
        break;
      }
    }

    return hierarchy;
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(userId: string, organizationId: string, role: string): Promise<void> {
    await this.initialize();

    const member: OrganizationMember = {
      userId,
      organizationId,
      role,
      permissions: await this.getRolePermissions(role),
      joinedAt: new Date(),
    };

    await ppmManager.add({
      content: `User added to organization: ${organizationId}`,
      type: 'org-member-added',
      importance: 7,
      metadata: member,
    });

    await auditLogger.log({
      type: 'organization.management',
      severity: 'info',
      action: 'USER_ADDED_TO_ORG',
      userId,
      resource: 'organizations',
      resourceId: organizationId,
      details: {
        role,
      },
    });
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    await this.initialize();

    const results = await ppmManager.search(`org-members:${organizationId}`);
    const members: User[] = [];

    for (const result of results || []) {
      const member = result.metadata as OrganizationMember;
      const user = await this.getUser(member.userId);
      if (user && user.status === 'active') {
        members.push(user);
      }
    }

    return members;
  }

  /**
   * Update user role in organization
   */
  async updateUserRole(userId: string, organizationId: string, newRole: string): Promise<boolean> {
    await this.initialize();

    const results = await ppmManager.search(`org-member:${userId}:${organizationId}`);
    if (!results || results.length === 0) return false;

    const member = results[0].metadata as OrganizationMember;
    member.role = newRole;
    member.permissions = await this.getRolePermissions(newRole);

    await ppmManager.update(results[0].id, {
      content: `User role updated in organization: ${organizationId}`,
      metadata: member,
    });

    // Update user record
    await this.updateUser(userId, { role: newRole });

    await auditLogger.log({
      type: 'organization.management',
      severity: 'info',
      action: 'USER_ROLE_UPDATED',
      userId,
      resource: 'organizations',
      resourceId: organizationId,
      details: {
        newRole,
      },
    });

    return true;
  }

  /**
   * Authenticate user with password
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    await this.initialize();

    const user = await this.getUserByEmail(email);
    if (!user || user.status !== 'active') {
      return null;
    }

    // Get password hash
    const results = await ppmManager.search(`user-password:${user.id}`);
    if (!results || results.length === 0) {
      return null; // No password set
    }

    const metadata = results[0].metadata as { hash?: string };
    const passwordHash = metadata.hash;
    if (!passwordHash) return null;
    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
      // Update last login
      await this.updateUser(user.id, { lastLoginAt: new Date() });

      await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        action: 'USER_AUTHENTICATED',
        userId: user.id,
        resource: 'authentication',
        details: {
          method: 'password',
        },
      });

      return user;
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'AUTHENTICATION_FAILED',
      resource: 'authentication',
      details: {
        email,
        method: 'password',
      },
    });

    return null;
  }

  /**
   * Get role permissions (integrates with RBAC)
   */
  private async getRolePermissions(role: string): Promise<string[]> {
    // Import RBAC roles
    const { ROLE_PERMISSIONS } = await import('../../core/auth/rbac-manager.js');
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user has permission in organization
   */
  async userHasPermission(
    userId: string,
    permission: string,
    organizationId?: string
  ): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.status !== 'active') return false;

    // Check organization context
    if (organizationId && user.organizationId !== organizationId) {
      // Check if user is member of the organization
      const results = await ppmManager.search(`org-member:${userId}:${organizationId}`);
      if (!results || results.length === 0) return false;

      const member = results[0].metadata as OrganizationMember;
      return member.permissions.includes(permission);
    }

    return user.permissions.includes(permission);
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
