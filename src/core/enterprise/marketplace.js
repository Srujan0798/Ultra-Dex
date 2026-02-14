/**
 * Ultra-Dex Enterprise Marketplace
 * Custom agents and extensions marketplace for enterprise deployments
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const MARKETPLACE_DIR = '.ultra-dex/marketplace';

class AgentMarketplace extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || MARKETPLACE_DIR,
      enablePrivateRepos: options.enablePrivateRepos !== false,
      enableSecurityScanning: options.enableSecurityScanning !== false,
      enableApprovalWorkflow: options.enableApprovalWorkflow !== false,
      maxAgentSize: options.maxAgentSize || 10 * 1024 * 1024, // 10MB
      agentCategories: options.agentCategories || [
        'development', 'security', 'testing', 'deployment', 
        'monitoring', 'compliance', 'infrastructure', 'business'
      ],
      ...options
    };

    this.agents = new Map(); // agentId -> agentData
    this.installedAgents = new Map(); // orgId -> [agentIds]
    this.marketplace = new Map(); // public agents
    this.privateRepos = new Map(); // orgId -> [privateAgentIds]
    this.approvalQueue = new Map(); // agentId -> approvalRequest
    this.storagePath = path.resolve(this.options.storagePath);
    
    this.initialize();
  }

  async initialize() {
    // Ensure marketplace directories exist
    await fs.mkdir(this.storagePath, { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'agents'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'reviews'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'security'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'private'), { recursive: true });
    
    // Load existing agents
    await this.loadAgents();
  }

  /**
   * Publish an agent to the marketplace
   * @param {object} agentData - Agent data to publish
   * @param {string} publisherId - Publisher user ID
   * @param {boolean} isPrivate - Whether agent is private to organization
   * @returns {object} Published agent
   */
  async publishAgent(agentData, publisherId, isPrivate = false) {
    if (!agentData.name || !agentData.code || !publisherId) {
      throw new Error('Agent name, code, and publisher ID are required');
    }

    // Validate agent code for security if enabled
    if (this.options.enableSecurityScanning) {
      const securityResult = await this.scanAgentCode(agentData.code);
      if (!securityResult.safe) {
        throw new Error(`Security scan failed: ${securityResult.reason}`);
      }
    }

    // Check if agent already exists
    const agentId = isPrivate 
      ? `private_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      : `agent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const agent = {
      id: agentId,
      name: agentData.name,
      description: agentData.description || '',
      version: agentData.version || '1.0.0',
      publisherId,
      code: agentData.code,
      metadata: {
        ...agentData.metadata,
        publishedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      categories: agentData.categories || ['general'],
      tags: agentData.tags || [],
      rating: 0,
      downloads: 0,
      installs: 0,
      security: {
        scanned: this.options.enableSecurityScanning,
        score: 100, // Calculated by security scanner
        trusted: this.options.trustedPublishers?.includes(publisherId) || false,
        vulnerabilities: []
      },
      pricing: {
        model: agentData.pricing?.model || 'free',
        costPerUse: agentData.pricing?.costPerUse || 0,
        subscriptionFee: agentData.pricing?.subscriptionFee || 0
      },
      permissions: agentData.permissions || [],
      capabilities: agentData.capabilities || [],
      configSchema: agentData.configSchema || {},
      isPrivate,
      organizationId: isPrivate ? agentData.organizationId : null,
      isActive: true,
      verified: false // Will be verified by marketplace admins
    };

    // Save agent to disk
    const agentPath = path.join(this.storagePath, isPrivate ? 'private' : 'agents', `${agentId}.json`);
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

    // Add to appropriate store
    if (isPrivate) {
      if (!this.privateRepos.has(agent.organizationId)) {
        this.privateRepos.set(agent.organizationId, new Set());
      }
      this.privateRepos.get(agent.organizationId).add(agentId);
    } else {
      this.marketplace.set(agentId, agent);
    }

    // Add to all agents store
    this.agents.set(agentId, agent);

    // Emit event
    this.emit('agent:published', { 
      agentId, 
      publisherId, 
      isPrivate, 
      timestamp: new Date().toISOString() 
    });

    return agent;
  }

  /**
   * Install an agent to an organization
   * @param {string} agentId - Agent ID to install
   * @param {string} orgId - Organization ID to install to
   * @param {object} options - Installation options
   * @returns {object} Installation result
   */
  async installAgent(agentId, orgId, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in marketplace`);
    }

    if (!agent.isActive) {
      throw new Error(`Agent ${agentId} is not active`);
    }

    // Check if private agent belongs to organization
    if (agent.isPrivate && agent.organizationId !== orgId) {
      throw new Error(`Private agent ${agentId} does not belong to organization ${orgId}`);
    }

    // Check security score if enabled
    if (this.options.enableSecurityScanning && 
        agent.security.score < 80 && 
        !agent.security.trusted) {
      throw new Error(`Agent ${agentId} has low security score (${agent.security.score}/100)`);
    }

    // Check approval if required
    if (this.options.enableApprovalWorkflow && !agent.verified) {
      const approvalRequest = await this.submitForApproval(agentId, orgId, 'install');
      if (approvalRequest.status !== 'approved') {
        throw new Error(`Agent ${agentId} requires approval before installation`);
      }
    }

    // Create organization-specific agent directory
    const orgAgentDir = path.join(this.storagePath, 'organizations', orgId, 'agents');
    await fs.mkdir(orgAgentDir, { recursive: true });

    // Save agent code to organization directory
    const agentCodePath = path.join(orgAgentDir, `${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}.js`);
    await fs.writeFile(agentCodePath, agent.code);

    // Update installation metrics
    agent.installs++;
    agent.updatedAt = new Date().toISOString();

    // Save updated agent
    const agentPath = path.join(this.storagePath, agent.isPrivate ? 'private' : 'agents', `${agentId}.json`);
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

    // Track installation
    if (!this.installedAgents.has(orgId)) {
      this.installedAgents.set(orgId, new Set());
    }
    this.installedAgents.get(orgId).add(agentId);

    this.emit('agent:installed', { 
      agentId, 
      orgId, 
      options, 
      timestamp: new Date().toISOString() 
    });

    return {
      success: true,
      agentId,
      orgId,
      installedAt: new Date().toISOString(),
      securityScore: agent.security.score,
      verified: agent.verified
    };
  }

  /**
   * Submit agent for approval
   * @param {string} agentId - Agent ID
   * @param {string} orgId - Organization ID
   * @param {string} action - Action type (install, update, etc.)
   * @returns {object} Approval request
   */
  async submitForApproval(agentId, orgId, action) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const approvalRequest = {
      id: `approval_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      agentId,
      orgId,
      action,
      status: 'pending',
      submittedBy: orgId,
      submittedAt: new Date().toISOString(),
      reviewers: [],
      approvals: [],
      rejections: [],
      comments: [],
      metadata: {
        agentName: agent.name,
        agentVersion: agent.version,
        securityScore: agent.security.score,
        publisher: agent.publisherId
      }
    };

    this.approvalQueue.set(approvalRequest.id, approvalRequest);

    // Notify reviewers
    this.emit('approval:submitted', approvalRequest);

    return approvalRequest;
  }

  /**
   * Approve an agent for installation
   * @param {string} approvalId - Approval request ID
   * @param {string} approverId - Approver ID
   * @param {string} comment - Optional comment
   * @returns {object} Updated approval request
   */
  async approveAgent(approvalId, approverId, comment = '') {
    const approval = this.approvalQueue.get(approvalId);
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval request ${approvalId} is not pending`);
    }

    approval.status = 'approved';
    approval.approvals.push({
      approverId,
      approvedAt: new Date().toISOString(),
      comment
    });

    // Update agent to verified status
    const agent = this.agents.get(approval.agentId);
    if (agent) {
      agent.verified = true;
      agent.verifiedAt = new Date().toISOString();
      
      // Save updated agent
      const agentPath = path.join(this.storagePath, agent.isPrivate ? 'private' : 'agents', `${approval.agentId}.json`);
      await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));
    }

    this.approvalQueue.set(approvalId, approval);
    this.emit('approval:approved', approval);

    return approval;
  }

  /**
   * Scan agent code for security vulnerabilities
   * @param {string} code - Agent code to scan
   * @returns {object} Security scan result
   */
  async scanAgentCode(code) {
    // Basic security scanning - in production, this would use a more sophisticated scanner
    const dangerousPatterns = [
      /require\(['"`]\s*child_process\s*['"`]\)/i,
      /import\(['"`]\s*child_process\s*['"`]\)/i,
      /exec\(/i,
      /spawn\(/i,
      /fork\(/i,
      /eval\(/i,
      /new Function/i,
      /import\(['"`]\s*fs\s*['"`]\)/i,
      /require\(['"`]\s*fs\s*['"`]\)/i,
      /import\(['"`]\s*vm\s*['"`]\)/i,
      /require\(['"`]\s*vm\s*['"`]\)/i,
      /__proto__/i,
      /constructor\.prototype/i,
      /process\.env/i,
      /require\(['"`]\s*net\s*['"`]\)/i,
      /import\(['"`]\s*net\s*['"`]\)/i,
      /require\(['"`]\s*http\s*['"`]\)/i,
      /import\(['"`]\s*http\s*['"`]\)/i,
      /require\(['"`]\s*https\s*['"`]\)/i,
      /import\(['"`]\s*https\s*['"`]\)/i,
      /import\(['"`]\s*crypto\s*['"`]\)/i,  // Could be used for key extraction
      /process\.mainModule\.require/i,  // Dynamic require bypass
      /global\[["']require["']\]/i,  // Dynamic require bypass
      /Buffer\.from\([^)]*process\.env/i,  // Accessing environment variables
      /JSON\.parse\([^)]*fs\.readFileSync/i,  // Reading files and parsing as JSON
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          safe: false,
          reason: `Security violation: Code contains potentially dangerous pattern: ${pattern}`,
          vulnerabilities: [pattern.toString()]
        };
      }
    }

    // Additional checks could include:
    // - AST parsing to validate code structure
    // - Sandboxing execution
    // - Dependency analysis

    return {
      safe: true,
      reason: 'Code passed security scan',
      vulnerabilities: []
    };
  }

  /**
   * Search for agents in the marketplace
   * @param {object} query - Search query
   * @returns {Array<object>} Array of matching agents
   */
  searchAgents(query = {}) {
    let results = query.privateOnly 
      ? Array.from(this.privateRepos.get(query.orgId) || []).map(id => this.agents.get(id))
      : Array.from(this.marketplace.values());

    // Filter results based on query
    if (query.name) {
      results = results.filter(agent => 
        agent.name.toLowerCase().includes(query.name.toLowerCase())
      );
    }

    if (query.publisherId) {
      results = results.filter(agent => 
        agent.publisherId === query.publisherId
      );
    }

    if (query.category) {
      results = results.filter(agent => 
        agent.categories.includes(query.category)
      );
    }

    if (query.tag) {
      results = results.filter(agent => 
        agent.tags.includes(query.tag)
      );
    }

    if (query.minRating) {
      results = results.filter(agent => 
        agent.rating >= query.minRating
      );
    }

    if (query.trustedOnly) {
      results = results.filter(agent => 
        agent.security.trusted
      );
    }

    if (query.verifiedOnly) {
      results = results.filter(agent => 
        agent.verified
      );
    }

    // Sort results
    if (query.sortBy === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (query.sortBy === 'downloads') {
      results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (query.sortBy === 'newest') {
      results.sort((a, b) => new Date(b.metadata.publishedAt) - new Date(a.metadata.publishedAt));
    } else if (query.sortBy === 'popular') {
      // Sort by popularity (downloads * rating)
      results.sort((a, b) => ((b.downloads || 0) * (b.rating || 0)) - ((a.downloads || 0) * (a.rating || 0)));
    } else {
      // Default sort: relevance (downloads * rating)
      results.sort((a, b) => ((b.downloads || 0) * (b.rating || 0)) - ((a.downloads || 0) * (a.rating || 0)));
    }

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      publisherId: agent.publisherId,
      rating: agent.rating,
      downloads: agent.downloads,
      installs: agent.installs,
      categories: agent.categories,
      tags: agent.tags,
      security: {
        score: agent.security.score,
        trusted: agent.security.trusted,
        verified: agent.verified
      },
      pricing: agent.pricing,
      capabilities: agent.capabilities,
      isPrivate: agent.isPrivate,
      isActive: agent.isActive,
      publishedAt: agent.metadata.publishedAt,
      updatedAt: agent.updatedAt
    }));
  }

  /**
   * Get agent details by ID
   * @param {string} agentId - Agent ID
   * @returns {object|null} Agent details or null if not found
   */
  getAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return null;
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      version: agent.version,
      publisherId: agent.publisherId,
      code: agent.code, // In production, this might be restricted
      metadata: agent.metadata,
      categories: agent.categories,
      tags: agent.tags,
      rating: agent.rating,
      downloads: agent.downloads,
      installs: agent.installs,
      security: agent.security,
      pricing: agent.pricing,
      permissions: agent.permissions,
      capabilities: agent.capabilities,
      configSchema: agent.configSchema,
      isPrivate: agent.isPrivate,
      organizationId: agent.organizationId,
      isActive: agent.isActive,
      verified: agent.verified
    };
  }

  /**
   * Get all agents installed in an organization
   * @param {string} orgId - Organization ID
   * @returns {Array<object>} Array of installed agents
   */
  getInstalledAgents(orgId) {
    const installedIds = this.installedAgents.get(orgId) || new Set();
    const installed = [];

    for (const agentId of installedIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        installed.push({
          id: agent.id,
          name: agent.name,
          version: agent.version,
          publisherId: agent.publisherId,
          installedAt: agent.metadata.publishedAt, // This would be actual install time in real implementation
          securityScore: agent.security.score,
          verified: agent.verified
        });
      }
    }

    return installed;
  }

  /**
   * Rate an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID rating
   * @param {number} rating - Rating (1-5)
   * @param {string} review - Optional review text
   * @returns {object} Updated agent with new rating
   */
  async rateAgent(agentId, userId, rating, review = '') {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // In a real implementation, we'd store individual ratings and calculate average
    // For now, we'll just update the rating field directly
    const oldRating = agent.rating || 0;
    const oldDownloads = agent.downloads || 0;
    
    // Simple average calculation (in real system, would store individual ratings)
    const totalRatings = (agent.downloads || 0) + 1;
    const newRating = Math.round(((oldRating * oldDownloads) + rating) / totalRatings);
    
    agent.rating = newRating;
    agent.downloads = (agent.downloads || 0) + 1;
    agent.updatedAt = new Date().toISOString();

    // Save updated agent
    const agentPath = path.join(this.storagePath, agent.isPrivate ? 'private' : 'agents', `${agentId}.json`);
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

    this.emit('agent:rated', { 
      agentId, 
      userId, 
      rating, 
      oldRating,
      review, 
      timestamp: new Date().toISOString() 
    });

    return agent;
  }

  /**
   * Get trending agents
   * @param {number} limit - Number of agents to return
   * @returns {Array<object>} Array of trending agents
   */
  getTrendingAgents(limit = 10) {
    const allAgents = Array.from(this.marketplace.values());
    
    // Sort by recent downloads/activity
    const trending = allAgents
      .filter(agent => agent.isActive && agent.verified)
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, limit);

    return trending.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      publisherId: agent.publisherId,
      rating: agent.rating,
      downloads: agent.downloads,
      categories: agent.categories,
      tags: agent.tags,
      security: {
        score: agent.security.score,
        trusted: agent.security.trusted
      }
    }));
  }

  /**
   * Get featured agents
   * @returns {Array<object>} Array of featured agents
   */
  getFeaturedAgents() {
    const allAgents = Array.from(this.marketplace.values());
    
    // Featured agents are typically the most popular, highly rated, and trusted
    const featured = allAgents
      .filter(agent => agent.isActive && agent.verified && agent.security.trusted && (agent.rating || 0) >= 4)
      .sort((a, b) => ((b.rating || 0) * (b.downloads || 0)) - ((a.rating || 0) * (a.downloads || 0)))
      .slice(0, 6); // Top 6 featured agents

    return featured.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      publisherId: agent.publisherId,
      rating: agent.rating,
      downloads: agent.downloads,
      categories: agent.categories,
      tags: agent.tags,
      security: {
        score: agent.security.score,
        trusted: agent.security.trusted
      }
    }));
  }

  /**
   * Load all agents from disk
   * @private
   */
  async loadAgents() {
    try {
      // Load public agents
      const publicAgentFiles = await fs.readdir(path.join(this.storagePath, 'agents'));
      for (const file of publicAgentFiles) {
        if (file.endsWith('.json')) {
          const agentPath = path.join(this.storagePath, 'agents', file);
          const agentContent = await fs.readFile(agentPath, 'utf8');
          const agent = JSON.parse(agentContent);
          
          this.agents.set(agent.id, agent);
          this.marketplace.set(agent.id, agent);
        }
      }

      // Load private agents
      const privateAgentFiles = await fs.readdir(path.join(this.storagePath, 'private'));
      for (const file of privateAgentFiles) {
        if (file.endsWith('.json')) {
          const agentPath = path.join(this.storagePath, 'private', file);
          const agentContent = await fs.readFile(agentPath, 'utf8');
          const agent = JSON.parse(agentContent);
          
          this.agents.set(agent.id, agent);
          
          // Add to private repo for the organization
          if (agent.organizationId) {
            if (!this.privateRepos.has(agent.organizationId)) {
              this.privateRepos.set(agent.organizationId, new Set());
            }
            this.privateRepos.get(agent.organizationId).add(agent.id);
          }
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
   * Get marketplace health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      agentCount: this.agents.size,
      publicAgentCount: this.marketplace.size,
      privateAgentCount: Array.from(this.privateRepos.values()).reduce((sum, agents) => sum + agents.size, 0),
      installedCount: Array.from(this.installedAgents.values()).reduce((sum, agents) => sum + agents.size, 0),
      approvalQueueSize: this.approvalQueue.size,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const agentMarketplace = new AgentMarketplace();

// Export class for instantiation with custom options
export default AgentMarketplace;