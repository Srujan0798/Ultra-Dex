/**
 * Ultra-Dex Multi-Tenancy Manager
 * Enterprise-grade resource isolation and tenant management
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const TENANCY_DIR = '.ultra-dex/tenants';

class MultiTenancyManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || TENANCY_DIR,
      isolationLevel: options.isolationLevel || 'physical', // 'logical' or 'physical'
      enableResourceQuotas: options.enableResourceQuotas !== false,
      defaultQuotas: {
        maxAgents: options.defaultQuotas?.maxAgents || 50,
        maxMemoryEntries: options.defaultQuotas?.maxMemoryEntries || 10000,
        maxStorage: options.defaultQuotas?.maxStorage || 100 * 1024 * 1024, // 100MB
        maxApiCalls: options.defaultQuotas?.maxApiCalls || 10000
      },
      ...options
    };
    
    this.tenants = new Map(); // tenantId -> tenantData
    this.storagePath = path.resolve(this.options.storagePath);
    this.initialize();
  }

  async initialize() {
    // Ensure tenants directory exists
    await fs.mkdir(this.storagePath, { recursive: true });
    
    // Load existing tenants
    await this.loadTenants();
  }

  /**
   * Create a new tenant
   * @param {object} tenantData - Tenant data
   * @param {string} tenantData.name - Tenant name
   * @param {string} tenantData.ownerId - Owner user ID
   * @param {string} tenantData.description - Tenant description (optional)
   * @returns {object} Created tenant
   */
  async createTenant(tenantData) {
    if (!tenantData.name || !tenantData.ownerId) {
      throw new Error('Tenant name and owner ID are required');
    }

    // Check if tenant name already exists
    for (const [_, tenant] of this.tenants) {
      if (tenant.name.toLowerCase() === tenantData.name.toLowerCase()) {
        throw new Error(`Tenant with name "${tenantData.name}" already exists`);
      }
    }

    const tenantId = `tenant_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const tenant = {
      id: tenantId,
      name: tenantData.name,
      description: tenantData.description || '',
      ownerId: tenantData.ownerId,
      members: [{
        userId: tenantData.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      projects: [],
      quotas: {
        ...this.options.defaultQuotas,
        ...tenantData.customQuotas
      },
      usage: {
        agents: 0,
        memoryEntries: 0,
        storageUsed: 0,
        apiCalls: 0
      },
      settings: {
        enableSandbox: tenantData.enableSandbox !== false,
        allowExternalTools: tenantData.allowExternalTools || false,
        dataResidency: tenantData.dataResidency || 'global',
        auditLogging: tenantData.auditLogging !== false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Create tenant-specific directory
    const tenantDir = path.join(this.storagePath, tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    // Create subdirectories for isolation
    await fs.mkdir(path.join(tenantDir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(tenantDir, 'memory'), { recursive: true });
    await fs.mkdir(path.join(tenantDir, 'projects'), { recursive: true });
    await fs.mkdir(path.join(tenantDir, 'logs'), { recursive: true });

    // Save tenant to disk
    await this.saveTenant(tenant);

    // Add to in-memory store
    this.tenants.set(tenantId, tenant);

    this.emit('tenant:created', { tenant, timestamp: new Date().toISOString() });

    return tenant;
  }

  /**
   * Get a tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {object|null} Tenant or null if not found
   */
  getTenant(tenantId) {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Update tenant settings
   * @param {string} tenantId - Tenant ID
   * @param {object} updates - Updates to apply
   * @returns {object} Updated tenant
   */
  async updateTenant(tenantId, updates) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Update quotas if provided
    if (updates.quotas) {
      tenant.quotas = { ...tenant.quotas, ...updates.quotas };
    }

    // Update settings if provided
    if (updates.settings) {
      tenant.settings = { ...tenant.settings, ...updates.settings };
    }

    // Update other fields
    if (updates.name) tenant.name = updates.name;
    if (updates.description) tenant.description = updates.description;
    if (updates.isActive !== undefined) tenant.isActive = updates.isActive;

    tenant.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTenant(tenant);

    this.emit('tenant:updated', { tenantId, updates, timestamp: new Date().toISOString() });

    return tenant;
  }

  /**
   * Add a member to a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role to assign (owner, admin, member, viewer)
   * @returns {object} Updated tenant
   */
  async addMember(tenantId, userId, role = 'member') {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
    }

    // Check if user is already a member
    const existingMember = tenant.members.find(m => m.userId === userId);
    if (existingMember) {
      throw new Error(`User ${userId} is already a member of tenant ${tenantId}`);
    }

    // Add member
    tenant.members.push({
      userId,
      role,
      joinedAt: new Date().toISOString()
    });

    tenant.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTenant(tenant);

    this.emit('member:added', { tenantId, userId, role, timestamp: new Date().toISOString() });

    return tenant;
  }

  /**
   * Remove a member from a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID to remove
   * @returns {object} Updated tenant
   */
  async removeMember(tenantId, userId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Don't allow removing the owner
    const owner = tenant.members.find(m => m.role === 'owner');
    if (owner && owner.userId === userId) {
      throw new Error('Cannot remove tenant owner');
    }

    const initialLength = tenant.members.length;
    tenant.members = tenant.members.filter(m => m.userId !== userId);

    if (tenant.members.length === initialLength) {
      throw new Error(`User ${userId} is not a member of tenant ${tenantId}`);
    }

    tenant.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTenant(tenant);

    this.emit('member:removed', { tenantId, userId, timestamp: new Date().toISOString() });

    return tenant;
  }

  /**
   * Check if a user has access to a tenant
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @param {string} requiredRole - Required role (optional)
   * @returns {boolean} True if user has access
   */
  hasAccess(userId, tenantId, requiredRole = null) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || !tenant.isActive) {
      return false;
    }

    const member = tenant.members.find(m => m.userId === userId);
    if (!member) {
      return false;
    }

    if (!requiredRole) {
      return true; // User is a member
    }

    // Define role hierarchy
    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };

    const userRoleLevel = roleHierarchy[member.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Get tenant-specific resource path
   * @param {string} tenantId - Tenant ID
   * @param {string} resourceType - Type of resource (agents, memory, projects, etc.)
   * @param {string} resourceId - Resource ID
   * @returns {string} Tenant-specific resource path
   */
  getResourcePath(tenantId, resourceType, resourceId = null) {
    const tenantDir = path.join(this.storagePath, tenantId);
    const resourcePath = path.join(tenantDir, resourceType);
    
    if (resourceId) {
      return path.join(resourcePath, resourceId);
    }
    
    return resourcePath;
  }

  /**
   * Get tenant usage statistics
   * @param {string} tenantId - Tenant ID
   * @returns {object} Usage statistics
   */
  getUsage(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return {
      ...tenant.usage,
      quotas: tenant.quotas,
      utilization: {
        agents: (tenant.usage.agents / tenant.quotas.maxAgents) * 100,
        memoryEntries: (tenant.usage.memoryEntries / tenant.quotas.maxMemoryEntries) * 100,
        storage: (tenant.usage.storageUsed / tenant.quotas.maxStorage) * 100,
        apiCalls: (tenant.usage.apiCalls / tenant.quotas.maxApiCalls) * 100
      }
    };
  }

  /**
   * Enforce resource quotas for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} resourceType - Type of resource to check
   * @param {number} amount - Amount to check against quota
   * @returns {boolean} True if quota allows the operation
   */
  async checkQuota(tenantId, resourceType, amount = 1) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const quotaKey = `max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}s`;
    const usageKey = `${resourceType}s`;
    
    const currentUsage = tenant.usage[usageKey] || 0;
    const quotaLimit = tenant.quotas[quotaKey];
    
    if (!quotaLimit) {
      // No quota set for this resource type
      return true;
    }

    return (currentUsage + amount) <= quotaLimit;
  }

  /**
   * Update tenant usage
   * @param {string} tenantId - Tenant ID
   * @param {object} usageUpdates - Usage updates to apply
   * @returns {object} Updated usage
   */
  async updateUsage(tenantId, usageUpdates) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    for (const [key, value] of Object.entries(usageUpdates)) {
      if (tenant.usage.hasOwnProperty(key)) {
        tenant.usage[key] = (tenant.usage[key] || 0) + value;
      }
    }

    tenant.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTenant(tenant);

    return tenant.usage;
  }

  /**
   * Save tenant to disk
   * @param {object} tenant - Tenant to save
   * @private
   */
  async saveTenant(tenant) {
    const tenantPath = path.join(this.storagePath, tenant.id, 'tenant.json');
    await fs.writeFile(tenantPath, JSON.stringify(tenant, null, 2));
  }

  /**
   * Load all tenants from disk
   * @private
   */
  async loadTenants() {
    try {
      const tenantDirs = await fs.readdir(this.storagePath);
      
      for (const tenantDir of tenantDirs) {
        const tenantPath = path.join(this.storagePath, tenantDir, 'tenant.json');
        
        try {
          const tenantContent = await fs.readFile(tenantPath, 'utf8');
          const tenant = JSON.parse(tenantContent);
          
          this.tenants.set(tenant.id, tenant);
        } catch (error) {
          console.warn(`Failed to load tenant from ${tenantPath}:`, error.message);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist yet, which is fine
    }
  }

  /**
   * Get all tenants (admin only)
   * @returns {Array<object>} Array of all tenants
   */
  getAllTenants() {
    return Array.from(this.tenants.values()).map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description,
      memberCount: tenant.members.length,
      projectCount: tenant.projects.length,
      createdAt: tenant.createdAt,
      isActive: tenant.isActive,
      usage: tenant.usage
    }));
  }

  /**
   * Get tenant health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      tenantCount: this.tenants.size,
      totalMembers: Array.from(this.tenants.values()).reduce((sum, tenant) => sum + tenant.members.length, 0),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const multiTenancyManager = new MultiTenancyManager();

// Export class for instantiation with custom options
export default MultiTenancyManager;