/**
 * Ultra-Dex Enterprise Organization Management
 * Multi-tenancy with complete resource isolation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const ORG_DIR = '.ultra-dex/organizations';

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

    this.organizations = new Map(); // orgId -> orgData
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
      teams: [],
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
      settings: {
        enableSandbox: orgData.enableSandbox !== false,
        allowExternalTools: orgData.allowExternalTools || false,
        dataResidency: orgData.dataResidency || 'global',
        auditLogging: orgData.auditLogging !== false,
        securityLevel: orgData.securityLevel || 'enterprise'
      },
      billing: {
        plan: orgData.plan || 'team',
        subscriptionId: null,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        usage: {
          current: 0,
          limit: orgData.plan === 'enterprise' ? Infinity : 50000 // Example limits
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Create organization-specific directory structure
    const orgDir = path.join(this.storagePath, orgId);
    await fs.mkdir(orgDir, { recursive: true });
    await fs.mkdir(path.join(orgDir, 'projects'), { recursive: true });
    await fs.mkdir(path.join(orgDir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(orgDir, 'memory'), { recursive: true });
    await fs.mkdir(path.join(orgDir, 'logs'), { recursive: true });

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
    if (updates.settings) organization.settings = { ...organization.settings, ...updates.settings };
    if (updates.billing) organization.billing = { ...organization.billing, ...updates.billing };

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
    const validRoles = ['owner', 'admin', 'manager', 'developer', 'viewer'];
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
    const validRoles = ['owner', 'admin', 'manager', 'developer', 'viewer'];
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
   * Create a team within an organization
   * @param {string} orgId - Organization ID
   * @param {object} teamData - Team data
   * @returns {object} Created team
   */
  async createTeam(orgId, teamData) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    // Check quota
    if (this.options.enableResourceQuotas && 
        organization.teams.length >= organization.quotas.maxTeams) {
      throw new Error('Team quota exceeded for organization');
    }

    const teamId = `team_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const team = {
      id: teamId,
      name: teamData.name,
      description: teamData.description || '',
      ownerId: teamData.ownerId,
      members: [{
        userId: teamData.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      projects: [],
      settings: {
        defaultAgentConcurrency: teamData.defaultAgentConcurrency || 4,
        enableSandbox: teamData.enableSandbox !== false,
        allowExternalTools: teamData.allowExternalTools || false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    organization.teams.push(teamId);
    organization.updatedAt = new Date().toISOString();

    // Create team directory within organization
    const teamDir = path.join(this.storagePath, orgId, 'teams', teamId);
    await fs.mkdir(teamDir, { recursive: true });

    // Save organization to disk
    await this.saveOrganization(organization);

    // Save team to its own file
    await this.saveTeam(orgId, team);

    this.emit('team:created', { orgId, team, timestamp: new Date().toISOString() });

    return team;
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
      settings: {
        enableSandbox: projectData.enableSandbox !== false,
        allowExternalTools: projectData.allowExternalTools || false,
        securityLevel: projectData.securityLevel || 'standard'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    organization.projects.push(projectId);
    organization.updatedAt = new Date().toISOString();

    // Create project directory within organization
    const projectDir = path.join(this.storagePath, orgId, 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Save organization to disk
    await this.saveOrganization(organization);

    // Save project to its own file
    await this.saveProject(orgId, project);

    this.emit('project:created', { orgId, project, timestamp: new Date().toISOString() });

    return project;
  }

  /**
   * Get all organizations for a user
   * @param {string} userId - User ID
   * @returns {Array<object>} Array of organizations with user's role
   */
  getUserOrganizations(userId) {
    const userOrgs = [];
    
    for (const [orgId, org] of this.organizations) {
      const member = org.members.find(m => m.userId === userId);
      if (member) {
        userOrgs.push({
          id: org.id,
          name: org.name,
          description: org.description,
          role: member.role,
          memberCount: org.members.length,
          teamCount: org.teams.length,
          projectCount: org.projects.length,
          createdAt: org.createdAt,
          isActive: org.isActive,
          usage: org.usage,
          quotas: org.quotas
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
      'owner': 5,
      'admin': 4,
      'manager': 3,
      'developer': 2,
      'viewer': 1
    };

    const userRoleLevel = roleHierarchy[member.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Check if an organization has exceeded its quotas
   * @param {string} orgId - Organization ID
   * @returns {object} Quota status
   */
  checkQuotas(orgId) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    const checks = {
      agents: {
        current: organization.usage.agents,
        limit: organization.quotas.maxAgents,
        exceeded: organization.usage.agents >= organization.quotas.maxAgents
      },
      memoryEntries: {
        current: organization.usage.memoryEntries,
        limit: organization.quotas.maxMemoryEntries,
        exceeded: organization.usage.memoryEntries >= organization.quotas.maxMemoryEntries
      },
      storage: {
        current: organization.usage.storageUsed,
        limit: organization.quotas.maxStorage,
        exceeded: organization.usage.storageUsed >= organization.quotas.maxStorage
      },
      apiCalls: {
        current: organization.usage.apiCalls,
        limit: organization.quotas.maxApiCalls,
        exceeded: organization.usage.apiCalls >= organization.quotas.maxApiCalls
      }
    };

    return {
      organizationId: orgId,
      checks,
      anyExceeded: Object.values(checks).some(check => check.exceeded),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update organization usage metrics
   * @param {string} orgId - Organization ID
   * @param {object} usageUpdates - Usage updates to apply
   * @returns {object} Updated usage
   */
  async updateUsage(orgId, usageUpdates) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    for (const [key, value] of Object.entries(usageUpdates)) {
      if (organization.usage.hasOwnProperty(key)) {
        organization.usage[key] = (organization.usage[key] || 0) + value;
      }
    }

    organization.updatedAt = new Date().toISOString();

    // Check if quotas are exceeded and emit event
    const quotaStatus = this.checkQuotas(orgId);
    if (quotaStatus.anyExceeded) {
      this.emit('quota:exceeded', { orgId, quotaStatus, timestamp: new Date().toISOString() });
    }

    // Save to disk
    await this.saveOrganization(organization);

    return organization.usage;
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
   * Save team to disk
   * @param {string} orgId - Organization ID
   * @param {object} team - Team to save
   * @private
   */
  async saveTeam(orgId, team) {
    const teamPath = path.join(this.storagePath, orgId, 'teams', `${team.id}.json`);
    await fs.writeFile(teamPath, JSON.stringify(team, null, 2));
  }

  /**
   * Save project to disk
   * @param {string} orgId - Organization ID
   * @param {object} project - Project to save
   * @private
   */
  async saveProject(orgId, project) {
    const projectPath = path.join(this.storagePath, orgId, 'projects', `${project.id}.json`);
    await fs.writeFile(projectPath, JSON.stringify(project, null, 2));
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
      teamCount: org.teams.length,
      projectCount: org.projects.length,
      createdAt: org.createdAt,
      isActive: org.isActive,
      usage: org.usage,
      quotas: org.quotas,
      billing: org.billing
    }));
  }

  /**
   * Get organization usage statistics
   * @param {string} orgId - Organization ID
   * @returns {object} Usage statistics
   */
  getUsageStats(orgId) {
    const organization = this.organizations.get(orgId);
    if (!organization) {
      throw new Error(`Organization ${orgId} not found`);
    }

    return {
      ...organization.usage,
      quotas: organization.quotas,
      utilization: {
        agents: (organization.usage.agents / organization.quotas.maxAgents) * 100,
        memoryEntries: (organization.usage.memoryEntries / organization.quotas.maxMemoryEntries) * 100,
        storage: (organization.usage.storageUsed / organization.quotas.maxStorage) * 100,
        apiCalls: (organization.usage.apiCalls / organization.quotas.maxApiCalls) * 100
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get organization health information
   * @returns {object} Health information
   */
  getHealth() {
    let totalMembers = 0;
    for (const org of this.organizations.values()) {
      if (org && org.members && Array.isArray(org.members)) {
        totalMembers += org.members.length;
      }
    }

    return {
      status: 'healthy',
      organizationCount: this.organizations.size,
      totalMembers: totalMembers,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const organizationsManager = new OrganizationsManager();

// Export class for instantiation with custom options
export default OrganizationsManager;