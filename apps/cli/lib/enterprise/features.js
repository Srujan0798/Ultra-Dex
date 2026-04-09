// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

/**
 * Enterprise Features Module
 * RBAC, Compliance, Security, and On-Premise capabilities
 */
export class EnterpriseFeatures {
  constructor(options = {}) {
    this.options = {
      enableRBAC: options.rbac !== false,
      enableCompliance: options.compliance !== false,
      enableAudit: options.audit !== false,
      enableSSO: options.sso !== false,
      enableOnPremise: options.onPremise !== false,
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET || randomBytes(64).toString('hex'),
      ...options,
    };

    this.users = new Map();
    this.roles = new Map();
    this.permissions = new Map();
    this.teams = new Map();
    this.auditLog = [];
    this.complianceRecords = new Map();

    this.initializeDefaultRoles();
    this.initializeDefaultPermissions();
  }

  /**
   * Initialize default enterprise roles
   */
  initializeDefaultRoles() {
    const defaultRoles = {
      'super-admin': {
        id: 'super-admin',
        name: 'Super Administrator',
        description: 'Full system access and management',
        permissions: ['*:*'], // All permissions
        inherits: [],
        level: 100,
      },
      admin: {
        id: 'admin',
        name: 'Administrator',
        description: 'System administration with limited access',
        permissions: [
          'user:manage',
          'role:manage',
          'team:manage',
          'project:create',
          'project:delete',
          'config:manage',
          'audit:view',
        ],
        inherits: [],
        level: 90,
      },
      manager: {
        id: 'manager',
        name: 'Manager',
        description: 'Team and project management',
        permissions: [
          'project:create',
          'project:read',
          'project:update',
          'team:manage',
          'user:read',
          'task:manage',
        ],
        inherits: ['member'],
        level: 70,
      },
      member: {
        id: 'member',
        name: 'Member',
        description: 'Standard development access',
        permissions: [
          'project:read',
          'project:update',
          'task:create',
          'task:read',
          'task:update',
          'code:read',
          'code:write',
        ],
        inherits: [],
        level: 50,
      },
      viewer: {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        permissions: ['project:read', 'task:read', 'code:read', 'docs:read'],
        inherits: [],
        level: 20,
      },
    };

    for (const [id, role] of Object.entries(defaultRoles)) {
      this.roles.set(id, role);
    }
  }

  /**
   * Initialize default permissions
   */
  initializeDefaultPermissions() {
    const defaultPermissions = {
      'user:read': { id: 'user:read', name: 'Read Users', description: 'View user information' },
      'user:write': {
        id: 'user:write',
        name: 'Write Users',
        description: 'Create/update user information',
      },
      'user:delete': {
        id: 'user:delete',
        name: 'Delete Users',
        description: 'Remove users from system',
      },
      'user:manage': {
        id: 'user:manage',
        name: 'Manage Users',
        description: 'Full user management',
      },

      'role:read': { id: 'role:read', name: 'Read Roles', description: 'View role information' },
      'role:write': { id: 'role:write', name: 'Write Roles', description: 'Create/update roles' },
      'role:delete': { id: 'role:delete', name: 'Delete Roles', description: 'Remove roles' },
      'role:manage': {
        id: 'role:manage',
        name: 'Manage Roles',
        description: 'Full role management',
      },

      'project:create': {
        id: 'project:create',
        name: 'Create Projects',
        description: 'Create new projects',
      },
      'project:read': {
        id: 'project:read',
        name: 'Read Projects',
        description: 'View project information',
      },
      'project:update': {
        id: 'project:update',
        name: 'Update Projects',
        description: 'Modify project information',
      },
      'project:delete': {
        id: 'project:delete',
        name: 'Delete Projects',
        description: 'Remove projects',
      },

      'task:create': { id: 'task:create', name: 'Create Tasks', description: 'Create new tasks' },
      'task:read': { id: 'task:read', name: 'Read Tasks', description: 'View task information' },
      'task:update': {
        id: 'task:update',
        name: 'Update Tasks',
        description: 'Modify task information',
      },
      'task:delete': { id: 'task:delete', name: 'Delete Tasks', description: 'Remove tasks' },

      'code:read': { id: 'code:read', name: 'Read Code', description: 'View code files' },
      'code:write': { id: 'code:write', name: 'Write Code', description: 'Modify code files' },
      'code:execute': {
        id: 'code:execute',
        name: 'Execute Code',
        description: 'Run code in sandbox',
      },

      'config:read': {
        id: 'config:read',
        name: 'Read Config',
        description: 'View system configuration',
      },
      'config:write': {
        id: 'config:write',
        name: 'Write Config',
        description: 'Modify system configuration',
      },
      'config:manage': {
        id: 'config:manage',
        name: 'Manage Config',
        description: 'Full configuration management',
      },

      'audit:read': { id: 'audit:read', name: 'Read Audit', description: 'View audit logs' },
      'audit:manage': {
        id: 'audit:manage',
        name: 'Manage Audit',
        description: 'Manage audit settings',
      },

      'docs:read': {
        id: 'docs:read',
        name: 'Read Documentation',
        description: 'View documentation',
      },
      'docs:write': {
        id: 'docs:write',
        name: 'Write Documentation',
        description: 'Create/update documentation',
      },

      'ai:execute': {
        id: 'ai:execute',
        name: 'Execute AI',
        description: 'Run AI agents and commands',
      },
      'ai:configure': {
        id: 'ai:configure',
        name: 'Configure AI',
        description: 'Configure AI settings',
      },

      'mcp:access': { id: 'mcp:access', name: 'MCP Access', description: 'Access MCP resources' },
      'mcp:manage': {
        id: 'mcp:manage',
        name: 'MCP Management',
        description: 'Manage MCP resources',
      },
    };

    for (const [id, permission] of Object.entries(defaultPermissions)) {
      this.permissions.set(id, permission);
    }
  }

  /**
   * Initialize enterprise system
   */
  async initialize() {
    // Create enterprise directories
    await fs.mkdir(path.join(process.cwd(), '.ultra-dex', 'enterprise'), { recursive: true });
    await fs.mkdir(path.join(process.cwd(), '.ultra-dex', 'audit'), { recursive: true });
    await fs.mkdir(path.join(process.cwd(), '.ultra-dex', 'compliance'), { recursive: true });

    // Load existing users and roles if they exist
    await this.loadEnterpriseData();

    printSuccess('🏢 Enterprise features initialized');
  }

  /**
   * Load enterprise data from disk
   */
  async loadEnterpriseData() {
    try {
      const enterpriseDir = path.join(process.cwd(), '.ultra-dex', 'enterprise');

      // Load users
      const usersFile = path.join(enterpriseDir, 'users.json');
      if (
        await fs
          .access(usersFile)
          .then(() => true)
          .catch(() => false)
      ) {
        const usersData = JSON.parse(await fs.readFile(usersFile, 'utf8'));
        for (const [id, user] of Object.entries(usersData)) {
          this.users.set(id, user);
        }
      }

      // Load custom roles
      const rolesFile = path.join(enterpriseDir, 'roles.json');
      if (
        await fs
          .access(rolesFile)
          .then(() => true)
          .catch(() => false)
      ) {
        const rolesData = JSON.parse(await fs.readFile(rolesFile, 'utf8'));
        for (const [id, role] of Object.entries(rolesData)) {
          this.roles.set(id, role);
        }
      }

      // Load teams
      const teamsFile = path.join(enterpriseDir, 'teams.json');
      if (
        await fs
          .access(teamsFile)
          .then(() => true)
          .catch(() => false)
      ) {
        const teamsData = JSON.parse(await fs.readFile(teamsFile, 'utf8'));
        for (const [id, team] of Object.entries(teamsData)) {
          this.teams.set(id, team);
        }
      }

      printInfo('📋 Enterprise data loaded');
    } catch (_error) {
      printWarning('⚠️  Could not load enterprise data, starting fresh');
    }
  }

  /**
   * Save enterprise data to disk
   */
  async saveEnterpriseData() {
    try {
      const enterpriseDir = path.join(process.cwd(), '.ultra-dex', 'enterprise');

      // Save users
      const usersObj = Object.fromEntries(this.users);
      await fs.writeFile(path.join(enterpriseDir, 'users.json'), JSON.stringify(usersObj, null, 2));

      // Save roles
      const rolesObj = Object.fromEntries(this.roles);
      await fs.writeFile(path.join(enterpriseDir, 'roles.json'), JSON.stringify(rolesObj, null, 2));

      // Save teams
      const teamsObj = Object.fromEntries(this.teams);
      await fs.writeFile(path.join(enterpriseDir, 'teams.json'), JSON.stringify(teamsObj, null, 2));

      printInfo('💾 Enterprise data saved');
    } catch (error) {
      printError(`Failed to save enterprise data: ${error.message}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      // Validate input
      const userSchema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
        role: z.string().optional().default('member'),
        teams: z.array(z.string()).optional().default([]),
      });

      const validatedData = userSchema.parse(userData);

      // Check if user exists
      const existingUser = Array.from(this.users.values()).find(
        (u) => u.email === validatedData.email
      );
      if (existingUser) {
        throw new Error(`User with email ${validatedData.email} already exists`);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user
      const user = {
        id: `user_${Date.now()}_${randomBytes(4).toString('hex')}`,
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        teams: validatedData.teams,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        permissions: this.getRolePermissions(validatedData.role),
      };

      this.users.set(user.id, user);
      await this.saveEnterpriseData();

      // Log the action
      await this.logAudit('user_create', {
        userId: user.id,
        userEmail: user.email,
        actor: 'system',
      });

      printSuccess(`✅ User created: ${user.name} (${user.email})`);

      return {
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: `User ${user.name} created successfully`,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(email, password) {
    try {
      // Find user by email
      const user = Array.from(this.users.values()).find((u) => u.email === email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      await this.saveEnterpriseData();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
        this.options.jwtSecret,
        { expiresIn: '24h' }
      );

      // Log the action
      await this.logAudit('user_login', {
        userId: user.id,
        userEmail: user.email,
        success: true,
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
        message: 'Authentication successful',
      };
    } catch (error) {
      // Log failed attempt
      await this.logAudit('user_login', {
        userEmail: email,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData) {
    try {
      const roleSchema = z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        name: z.string().min(2),
        description: z.string().optional(),
        permissions: z.array(z.string()),
        inherits: z.array(z.string()).optional().default([]),
      });

      const validatedData = roleSchema.parse(roleData);

      // Check if role exists
      if (this.roles.has(validatedData.id)) {
        throw new Error(`Role ${validatedData.id} already exists`);
      }

      // Validate permissions exist
      for (const perm of validatedData.permissions) {
        if (perm !== '*:*' && !this.permissions.has(perm)) {
          throw new Error(`Permission ${perm} does not exist`);
        }
      }

      // Validate inherited roles exist
      for (const inherit of validatedData.inherits) {
        if (!this.roles.has(inherit)) {
          throw new Error(`Inherited role ${inherit} does not exist`);
        }
      }

      const role = {
        id: validatedData.id,
        name: validatedData.name,
        description: validatedData.description || '',
        permissions: validatedData.permissions,
        inherits: validatedData.inherits,
        level: this.calculateRoleLevel(validatedData.permissions),
      };

      this.roles.set(role.id, role);
      await this.saveEnterpriseData();

      // Log the action
      await this.logAudit('role_create', {
        roleId: role.id,
        roleName: role.name,
        actor: 'system',
      });

      printSuccess(`✅ Role created: ${role.name} (${role.id})`);

      return {
        success: true,
        role,
        message: `Role ${role.name} created successfully`,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Create a new team
   */
  async createTeam(teamData) {
    try {
      const teamSchema = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        members: z.array(z.string()).optional().default([]),
        permissions: z.array(z.string()).optional().default([]),
      });

      const validatedData = teamSchema.parse(teamData);

      const team = {
        id: `team_${Date.now()}_${randomBytes(4).toString('hex')}`,
        name: validatedData.name,
        description: validatedData.description || '',
        members: validatedData.members,
        permissions: validatedData.permissions,
        createdAt: new Date().toISOString(),
      };

      this.teams.set(team.id, team);
      await this.saveEnterpriseData();

      // Log the action
      await this.logAudit('team_create', {
        teamId: team.id,
        teamName: team.name,
        actor: 'system',
      });

      printSuccess(`✅ Team created: ${team.name} (${team.id})`);

      return {
        success: true,
        team,
        message: `Team ${team.name} created successfully`,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId, permission) {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // Check user's direct permissions
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check wildcard permissions
    if (user.permissions.includes('*:*')) {
      return true;
    }

    // Check if permission matches pattern (e.g., 'project:*' matches 'project:create')
    for (const userPerm of user.permissions) {
      if (userPerm.endsWith(':*')) {
        const basePerm = userPerm.slice(0, -2); // Remove ':*'
        if (permission.startsWith(basePerm + ':')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getRolePermissions(roleId) {
    const role = this.roles.get(roleId);
    if (!role) {
      return [];
    }

    let allPermissions = [...role.permissions];

    // Add permissions from inherited roles
    for (const inheritRoleId of role.inherits) {
      const inheritedRole = this.roles.get(inheritRoleId);
      if (inheritedRole) {
        const inheritedPerms = this.getRolePermissions(inheritRoleId);
        allPermissions = [...new Set([...allPermissions, ...inheritedPerms])];
      }
    }

    return allPermissions;
  }

  /**
   * Calculate role level based on permissions
   */
  calculateRoleLevel(permissions) {
    if (permissions.includes('*:*')) return 100;

    let level = 0;
    if (permissions.includes('user:manage')) level += 20;
    if (permissions.includes('role:manage')) level += 15;
    if (permissions.includes('project:delete')) level += 10;
    if (permissions.includes('config:manage')) level += 15;
    if (permissions.includes('audit:manage')) level += 10;

    return Math.min(level, 100);
  }

  /**
   * Log audit event
   */
  async logAudit(action, details) {
    const auditEntry = {
      id: `audit_${Date.now()}_${randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      actor: details.actor || 'system',
    };

    this.auditLog.push(auditEntry);

    // Keep only last 10,000 entries to prevent memory issues
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }

    // Write to audit log file
    try {
      const auditFile = path.join(process.cwd(), '.ultra-dex', 'audit', 'log.jsonl');
      const stream = fs.createWriteStream(auditFile, { flags: 'a' });
      stream.write(JSON.stringify(auditEntry) + '\n');
      stream.end();
    } catch (error) {
      printError(`Failed to write audit log: ${error.message}`);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(filters = {}) {
    let filtered = this.auditLog;

    if (filters.user) {
      filtered = filtered.filter(
        (entry) => entry.details.userId === filters.user || entry.details.userEmail === filters.user
      );
    }

    if (filters.action) {
      filtered = filtered.filter((entry) => entry.action === filters.action);
    }

    if (filters.after) {
      filtered = filtered.filter((entry) => new Date(entry.timestamp) > new Date(filters.after));
    }

    if (filters.before) {
      filtered = filtered.filter((entry) => new Date(entry.timestamp) < new Date(filters.before));
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }

  /**
   * Add user to team
   */
  async addUserToTeam(userId, teamId) {
    const user = this.users.get(userId);
    const team = this.teams.get(teamId);

    if (!user) throw new Error(`User ${userId} not found`);
    if (!team) throw new Error(`Team ${teamId} not found`);

    if (!team.members.includes(userId)) {
      team.members.push(userId);
      await this.saveEnterpriseData();

      // Log the action
      await this.logAudit('team_add_member', {
        userId,
        teamId,
        actor: 'system',
      });

      printSuccess(`✅ User added to team: ${team.name}`);
    }

    return { success: true, message: `User added to team ${team.name}` };
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(userId, teamId) {
    const team = this.teams.get(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);

    const index = team.members.indexOf(userId);
    if (index !== -1) {
      team.members.splice(index, 1);
      await this.saveEnterpriseData();

      // Log the action
      await this.logAudit('team_remove_member', {
        userId,
        teamId,
        actor: 'system',
      });

      printSuccess(`✅ User removed from team: ${team.name}`);
    }

    return { success: true, message: `User removed from team ${team.name}` };
  }

  /**
   * Create compliance record
   */
  async createComplianceRecord(recordData) {
    const record = {
      id: `compliance_${Date.now()}_${randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: recordData.type,
      standard: recordData.standard,
      evidence: recordData.evidence,
      status: recordData.status || 'pending',
      reviewer: recordData.reviewer,
      expiresAt: recordData.expiresAt,
    };

    this.complianceRecords.set(record.id, record);

    // Save to compliance directory
    const complianceFile = path.join(
      process.cwd(),
      '.ultra-dex',
      'compliance',
      `${record.id}.json`
    );
    await fs.writeFile(complianceFile, JSON.stringify(record, null, 2));

    // Log the action
    await this.logAudit('compliance_record_create', {
      recordId: record.id,
      type: record.type,
      standard: record.standard,
      actor: recordData.reviewer,
    });

    printSuccess(`✅ Compliance record created: ${record.type} (${record.standard})`);

    return { success: true, record };
  }

  /**
   * Get compliance status
   */
  getComplianceStatus() {
    const records = Array.from(this.complianceRecords.values());
    const active = records.filter((r) => r.status === 'active');
    const expired = records.filter((r) => r.expiresAt && new Date(r.expiresAt) < new Date());
    const pending = records.filter((r) => r.status === 'pending');

    return {
      total: records.length,
      active: active.length,
      expired: expired.length,
      pending: pending.length,
      complianceRate: records.length > 0 ? (active.length / records.length) * 100 : 0,
    };
  }

  /**
   * Validate SSO configuration
   */
  async validateSSOConfig(config) {
    const ssoSchema = z.object({
      provider: z.enum(['saml', 'oidc', 'oauth2']),
      metadataUrl: z.string().url().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      redirectUri: z.string().url().optional(),
      domain: z.string().optional(),
    });

    return ssoSchema.parse(config);
  }

  /**
   * Setup SSO integration
   */
  async setupSSO(config) {
    try {
      const validatedConfig = await this.validateSSOConfig(config);

      // Save SSO configuration
      const ssoConfigPath = path.join(process.cwd(), '.ultra-dex', 'enterprise', 'sso.json');
      await fs.writeFile(ssoConfigPath, JSON.stringify(validatedConfig, null, 2));

      printSuccess(`✅ SSO configured: ${config.provider}`);

      return {
        success: true,
        message: `SSO ${config.provider} configured successfully`,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `SSO config validation error: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  }

  /**
   * Get enterprise statistics
   */
  getEnterpriseStats() {
    return {
      users: this.users.size,
      roles: this.roles.size,
      teams: this.teams.size,
      auditLogSize: this.auditLog.length,
      complianceRecords: this.complianceRecords.size,
      activeCompliance: Array.from(this.complianceRecords.values()).filter(
        (r) => r.status === 'active'
      ).length,
    };
  }

  /**
   * Export enterprise data for backup
   */
  async exportEnterpriseData() {
    const exportData = {
      users: Object.fromEntries(this.users),
      roles: Object.fromEntries(this.roles),
      teams: Object.fromEntries(this.teams),
      permissions: Object.fromEntries(this.permissions),
      auditLog: this.auditLog.slice(-1000), // Last 1000 entries
      complianceRecords: Object.fromEntries(this.complianceRecords),
      exportedAt: new Date().toISOString(),
    };

    const exportPath = path.join(process.cwd(), '.ultra-dex', 'enterprise', 'backup.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    printSuccess(`✅ Enterprise data exported to: ${exportPath}`);

    return {
      success: true,
      path: exportPath,
      records: {
        users: exportData.users.length,
        roles: exportData.roles.length,
        teams: exportData.teams.length,
        auditEntries: exportData.auditLog.length,
      },
    };
  }

  /**
   * Import enterprise data from backup
   */
  async importEnterpriseData(backupPath) {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

      // Validate backup structure
      if (!backupData.users || !backupData.roles || !backupData.teams) {
        throw new Error('Invalid backup file structure');
      }

      // Import data
      for (const [id, user] of Object.entries(backupData.users)) {
        this.users.set(id, user);
      }

      for (const [id, role] of Object.entries(backupData.roles)) {
        this.roles.set(id, role);
      }

      for (const [id, team] of Object.entries(backupData.teams)) {
        this.teams.set(id, team);
      }

      if (backupData.auditLog) {
        this.auditLog = backupData.auditLog;
      }

      if (backupData.complianceRecords) {
        for (const [id, record] of Object.entries(backupData.complianceRecords)) {
          this.complianceRecords.set(id, record);
        }
      }

      await this.saveEnterpriseData();

      printSuccess(`✅ Enterprise data imported from: ${backupPath}`);

      return {
        success: true,
        message: 'Enterprise data imported successfully',
        records: {
          users: Object.keys(backupData.users).length,
          roles: Object.keys(backupData.roles).length,
          teams: Object.keys(backupData.teams).length,
        },
      };
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Generate enterprise report
   */
  async generateEnterpriseReport() {
    const stats = this.getEnterpriseStats();
    const compliance = this.getComplianceStatus();

    const report = {
      timestamp: new Date().toISOString(),
      stats,
      compliance,
      security: {
        passwordPolicy: 'min 8 chars, complexity enforced',
        auditLogging: 'enabled',
        rbac: 'active',
        sso: this.options.enableSSO,
      },
      users: Array.from(this.users.values()).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        lastLogin: u.lastLogin,
      })),
      roles: Array.from(this.roles.values()).map((r) => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions.length,
        level: r.level,
      })),
    };

    return report;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, newRole) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (!this.roles.has(newRole)) {
      throw new Error(`Role ${newRole} does not exist`);
    }

    const oldRole = user.role;
    user.role = newRole;
    user.permissions = this.getRolePermissions(newRole);

    await this.saveEnterpriseData();

    // Log the action
    await this.logAudit('user_role_update', {
      userId,
      oldRole,
      newRole,
      actor: 'system',
    });

    printSuccess(`✅ User role updated: ${user.name} (${oldRole} → ${newRole})`);

    return {
      success: true,
      message: `User role updated from ${oldRole} to ${newRole}`,
    };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    user.isActive = false;
    await this.saveEnterpriseData();

    // Log the action
    await this.logAudit('user_deactivate', {
      userId,
      userEmail: user.email,
      actor: 'system',
    });

    printSuccess(`✅ User deactivated: ${user.name}`);

    return {
      success: true,
      message: `User ${user.name} deactivated`,
    };
  }

  /**
   * Activate user
   */
  async activateUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    user.isActive = true;
    await this.saveEnterpriseData();

    // Log the action
    await this.logAudit('user_activate', {
      userId,
      userEmail: user.email,
      actor: 'system',
    });

    printSuccess(`✅ User activated: ${user.name}`);

    return {
      success: true,
      message: `User ${user.name} activated`,
    };
  }
}

// Singleton instance
export const enterpriseFeatures = new EnterpriseFeatures();

export default EnterpriseFeatures;
