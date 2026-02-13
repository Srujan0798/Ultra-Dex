/**
 * Ultra-Dex Organizations Module
 * Enterprise multi-tenancy with resource isolation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const ORG_DIR = '.ultra-dex/orgs';

class OrganizationsManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || ORG_DIR,
      maxOrganizations: options.maxOrganizations || 1000,
      enableResourceQuotas: options.enableResourceQuotas !== false,
      defaultQuotas: {
        maxAgents: options.defaultQuotas?.maxAgents || 50,
        maxMemoryEntries: options.defaultQuotas?.maxMemoryEntries || 10000,
        maxStorage: options.defaultQuotas?.maxStorage || 100 * 1024 * 1024, // 100MB
        maxApiCalls: options.defaultQuotas?.maxApiCalls || 10000
      },
      ...options
    };
    
    this.organizations = new Map();
    this.storagePath = path.resolve(this.options.storagePath);
    this.initialize();
  }

  async initialize() {
    // Ensure organizations directory exists
    await fs.mkdir(this.storagePath, { recursive: true });
    
    // Load existing organizations
    await this.loadOrganizations();
  }

  /**
   * Create a new organization
   * @param {object} orgData - Organization data
   * @param {string} orgData.name - Organization name
   * @param {string} orgData.ownerId - Owner user ID
   * @param {string} orgData.description - Organization description (optional)
   * @returns {object} Created organization
   */
  async createOrganization(orgData) {
    if (this.organizations.size >= this.options.maxOrganizations) {
      throw new Error('Maximum number of organizations reached');
    }

    if (!orgData.name || !orgData.ownerId) {
      throw new Error('Organization name and owner ID are required');
    }

    // Check if organization name already exists
    for (const [_, org] of this.organizations) {
      if (org.name.toLowerCase() === orgData.name.toLowerCase()) {
        throw new Error(`Organization with name "${orgData.name}" already exists`);
      }
    }

    const orgId = `org_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const organization = {
      id: orgId,
      name: orgData.name,
      description: orgData.description || '',
      ownerId: orgData.ownerId,
      members: [{
        userId: orgData.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      projects: [],
      quotas: {
        ...this.options.defaultQuotas,
        ...orgData.customQuotas
      },
      usage: {
        agents: 0,
        memoryEntries: 0,
        storageUsed: 0,
        apiCalls: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Create organization directory
    const orgDir = path.join(this.storagePath, orgId);
    await fs.mkdir(orgDir, { recursive: true });

    // Save organization to disk
    await this.saveOrganization(organization);

    // Add to in-memory store
    this.organizations.set(orgId, organization);

    this.emit('organization:created', { organization, timestamp: new Date().toISOString() });

    return organization;
  }

  /**
   * Get an organization by ID
   * @param {string} orgId - Organization ID
   * @returns {object|null} Organization or null if not found
   */
  getOrganization(orgId) {
    return this.organizations.get(orgId) || null;
  }

  /**
   * Update organization details
   * @param {string} orgId - Organization ID
   * @param {object} updates - Updates to apply
   * @returns {object} Updated organization
   */
  async updateOrganization(orgId, updates) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Validate quota updates if present
    if (updates.quotas) {
      organization.quotas = { ...organization.quotas, ...updates.quotas };
    }

    // Update other fields
    if (updates.name) organization.name = updates.name;
    if (updates.description) organization.description = updates.description;
    if (updates.isActive !== undefined) organization.isActive = updates.isActive;

    organization.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveOrganization(organization);

    this.emit('organization:updated', { orgId, updates, timestamp: new Date().toISOString() });

    return organization;
  }

  /**
   * Add a member to an organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role to assign (owner, admin, member, viewer)
   * @returns {object} Updated organization
   */
  async addMember(orgId, userId, role = 'member') {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
    }

    // Check if user is already a member
    const existingMember = organization.members.find(m => m.userId === userId);
    if (existingMember) {
      throw new Error(`User ${userId} is already a member of organization ${orgId}`);
    }

    // Add member
    organization.members.push({
      userId,
      role,
      joinedAt: new Date().toISOString()
    });

    organization.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveOrganization(organization);

    this.emit('member:added', { orgId, userId, role, timestamp: new Date().toISOString() });

    return organization;
  }

  /**
   * Remove a member from an organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to remove
   * @returns {object} Updated organization
   */
  async removeMember(orgId, userId) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Don't allow removing the owner
    const owner = organization.members.find(m => m.role === 'owner');
    if (owner && owner.userId === userId) {
      throw new Error('Cannot remove organization owner');
    }

    const initialLength = organization.members.length;
    organization.members = organization.members.filter(m => m.userId !== userId);

    if (organization.members.length === initialLength) {
      throw new Error(`User ${userId} is not a member of organization ${orgId}`);
    }

    organization.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveOrganization(organization);

    this.emit('member:removed', { orgId, userId, timestamp: new Date().toISOString() });

    return organization;
  }

  /**
   * Change a member's role in an organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role to assign
   * @returns {object} Updated organization
   */
  async changeMemberRole(orgId, userId, newRole) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Valid roles: ${validRoles.join(', ')}`);
    }

    const member = organization.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error(`User ${userId} is not a member of organization ${orgId}`);
    }

    const oldRole = member.role;
    member.role = newRole;
    organization.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveOrganization(organization);

    this.emit('member:role_changed', { 
      orgId, 
      userId, 
      oldRole, 
      newRole, 
      timestamp: new Date().toISOString() 
    });

    return organization;
  }

  /**
   * Create a project within an organization
   * @param {string} orgId - Organization ID
   * @param {object} projectData - Project data
   * @returns {object} Created project
   */
  async createProject(orgId, projectData) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Check quota
    if (this.options.enableResourceQuotas && 
        organization.projects.length >= organization.quotas.maxProjects) {
      throw new Error('Project quota exceeded for organization');
    }

    const projectId = `proj_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const project = {
      id: projectId,
      name: projectData.name,
      description: projectData.description || '',
      ownerId: projectData.ownerId,
      members: [{
        userId: projectData.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      settings: projectData.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    organization.projects.push(project);
    organization.updatedAt = new Date().toISOString();

    // Create project directory within organization
    const projectDir = path.join(this.storagePath, orgId, 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Save organization to disk
    await this.saveOrganization(organization);

    this.emit('project:created', { orgId, project, timestamp: new Date().toISOString() });

    return project;
  }

  /**
   * Get all organizations for a user
   * @param {string} userId - User ID
   * @returns {Array<object>} Array of organizations
   */
  getUserOrganizations(userId) {
    const userOrgs = [];
    
    for (const [_, org] of this.organizations) {
      const isMember = org.members.some(member => member.userId === userId);
      if (isMember) {
        userOrgs.push({
          id: org.id,
          name: org.name,
          description: org.description,
          role: org.members.find(m => m.userId === userId).role,
          createdAt: org.createdAt,
          isActive: org.isActive
        });
      }
    }
    
    return userOrgs;
  }

  /**
   * Check if a user has access to an organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {string} requiredRole - Required role (optional)
   * @returns {boolean} True if user has access
   */
  hasAccess(userId, orgId, requiredRole = null) {
    const organization = this.organizations.get(orgId);
    if (!organization || !organization.isActive) {
      return false;
    }

    const member = organization.members.find(m => m.userId === userId);
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
   * Get organization usage statistics
   * @param {string} orgId - Organization ID
   * @returns {object} Usage statistics
   */
  getUsage(orgId) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // In a real implementation, this would calculate actual usage
    // For now, returning the stored usage data
    return {
      ...organization.usage,
      quotas: organization.quotas,
      utilization: {
        agents: (organization.usage.agents / organization.quotas.maxAgents) * 100,
        memoryEntries: (organization.usage.memoryEntries / organization.quotas.maxMemoryEntries) * 100,
        storage: (organization.usage.storageUsed / organization.quotas.maxStorage) * 100,
        apiCalls: (organization.usage.apiCalls / organization.quotas.maxApiCalls) * 100
      }
    };
  }

  /**
   * Save organization to disk
   * @param {object} organization - Organization to save
   * @private
   */
  async saveOrganization(organization) {
    const orgPath = path.join(this.storagePath, organization.id, 'organization.json');
    await fs.writeFile(orgPath, JSON.stringify(organization, null, 2));
  }

  /**
   * Load all organizations from disk
   * @private
   */
  async loadOrganizations() {
    try {
      const orgDirs = await fs.readdir(this.storagePath);
      
      for (const orgDir of orgDirs) {
        const orgPath = path.join(this.storagePath, orgDir, 'organization.json');
        
        try {
          const orgContent = await fs.readFile(orgPath, 'utf8');
          const organization = JSON.parse(orgContent);
          
          this.organizations.set(organization.id, organization);
        } catch (error) {
          console.warn(`Failed to load organization from ${orgPath}:`, error.message);
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
   * Get all organizations (admin only)
   * @returns {Array<object>} Array of all organizations
   */
  getAllOrganizations() {
    return Array.from(this.organizations.values()).map(org => ({
      id: org.id,
      name: org.name,
      description: org.description,
      memberCount: org.members.length,
      projectCount: org.projects.length,
      createdAt: org.createdAt,
      isActive: org.isActive,
      usage: org.usage
    }));
  }

  /**
   * Get organization health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      organizationCount: this.organizations.size,
      totalMembers: Array.from(this.organizations.values()).reduce((sum, org) => sum + org.members.length, 0),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const organizationsManager = new OrganizationsManager();

// Export class for instantiation with custom options
export default OrganizationsManager;