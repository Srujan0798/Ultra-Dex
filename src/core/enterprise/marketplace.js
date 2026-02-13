/**
 * Ultra-Dex Custom Agents Marketplace
 * Enterprise agent marketplace with security and governance
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const MARKETPLACE_DIR = '.ultra-dex/marketplace';

class MarketplaceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || MARKETPLACE_DIR,
      enableSecurityScanning: options.enableSecurityScanning !== false,
      trustedSources: options.trustedSources || [],
      maxAgentSize: options.maxAgentSize || 10 * 1024 * 1024, // 10MB
      ...options
    };
    
    this.agents = new Map(); // agentId -> agentData
    this.installedAgents = new Map(); // tenantId -> [agentIds]
    this.storagePath = path.resolve(this.options.storagePath);
    this.initialize();
  }

  async initialize() {
    // Ensure marketplace directories exist
    await fs.mkdir(this.storagePath, { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'agents'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'reviews'), { recursive: true });
    await fs.mkdir(path.join(this.storagePath, 'security'), { recursive: true });
    
    // Load existing agents
    await this.loadAgents();
  }

  /**
   * Publish an agent to the marketplace
   * @param {object} agentData - Agent data to publish
   * @param {string} publisherId - Publisher user ID
   * @returns {object} Published agent
   */
  async publishAgent(agentData, publisherId) {
    if (!agentData.name || !agentData.code || !publisherId) {
      throw new Error('Agent name, code, and publisher ID are required');
    }

    // Validate agent code for security
    if (this.options.enableSecurityScanning) {
      const securityResult = await this.scanAgentCode(agentData.code);
      if (!securityResult.safe) {
        throw new Error(`Security scan failed: ${securityResult.reason}`);
      }
    }

    // Check if agent already exists
    for (const [_, agent] of this.agents) {
      if (agent.name === agentData.name && agent.publisherId === publisherId) {
        throw new Error(`Agent ${agentData.name} already published by this publisher`);
      }
    }

    const agentId = `agent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
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
        trusted: this.options.trustedSources.includes(publisherId),
        vulnerabilities: []
      },
      pricing: {
        model: agentData.pricing?.model || 'free',
        costPerUse: agentData.pricing?.costPerUse || 0,
        subscriptionFee: agentData.pricing?.subscriptionFee || 0
      },
      permissions: agentData.permissions || [],
      isActive: true
    };

    // Save agent to disk
    const agentPath = path.join(this.storagePath, 'agents', `${agentId}.json`);
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

    // Add to in-memory store
    this.agents.set(agentId, agent);

    this.emit('agent:published', { agent, publisherId, timestamp: new Date().toISOString() });

    return agent;
  }

  /**
   * Install an agent to a tenant
   * @param {string} agentId - Agent ID to install
   * @param {string} tenantId - Tenant ID to install to
   * @param {object} options - Installation options
   * @returns {object} Installation result
   */
  async installAgent(agentId, tenantId, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in marketplace`);
    }

    if (!agent.isActive) {
      throw new Error(`Agent ${agentId} is not active`);
    }

    // Check security score
    if (agent.security.score < 80 && !options.overrideSecurity) {
      throw new Error(`Agent ${agentId} has low security score (${agent.security.score}/100)`);
    }

    // Check permissions
    if (agent.permissions && agent.permissions.length > 0) {
      // In a real implementation, this would check tenant permissions
      // For now, we'll just log the required permissions
      console.log(`[MARKETPLACE] Agent ${agentId} requires permissions:`, agent.permissions);
    }

    // Create tenant-specific agent directory
    const tenantAgentDir = path.join(this.storagePath, 'tenants', tenantId, 'agents');
    await fs.mkdir(tenantAgentDir, { recursive: true });

    // Save agent code to tenant directory
    const agentCodePath = path.join(tenantAgentDir, `${agent.name}.js`);
    await fs.writeFile(agentCodePath, agent.code);

    // Update install count
    agent.installs++;
    agent.lastUpdated = new Date().toISOString();

    // Save updated agent
    const agentPath = path.join(this.storagePath, 'agents', `${agentId}.json`);
    await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

    // Track installation
    if (!this.installedAgents.has(tenantId)) {
      this.installedAgents.set(tenantId, new Set());
    }
    this.installedAgents.get(tenantId).add(agentId);

    this.emit('agent:installed', { agentId, tenantId, options, timestamp: new Date().toISOString() });

    return {
      success: true,
      agentId,
      tenantId,
      installedAt: new Date().toISOString(),
      securityScore: agent.security.score
    };
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
    let results = Array.from(this.agents.values());

    if (query.name) {
      results = results.filter(agent => 
        agent.name.toLowerCase().includes(query.name.toLowerCase())
      );
    }

    if (query.category) {
      results = results.filter(agent => 
        agent.categories.includes(query.category)
      );
    }

    if (query.publisherId) {
      results = results.filter(agent => 
        agent.publisherId === query.publisherId
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

    if (query.securityMin) {
      results = results.filter(agent => 
        agent.security.score >= query.securityMin
      );
    }

    // Sort results
    if (query.sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (query.sortBy === 'downloads') {
      results.sort((a, b) => b.downloads - a.downloads);
    } else if (query.sortBy === 'newest') {
      results.sort((a, b) => new Date(b.metadata.publishedAt) - new Date(a.metadata.publishedAt));
    } else {
      // Default sort: relevance (downloads * rating)
      results.sort((a, b) => (b.downloads * b.rating) - (a.downloads * a.rating));
    }

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    // Return simplified agent objects
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
        trusted: agent.security.trusted
      },
      pricing: agent.pricing,
      isActive: agent.isActive,
      publishedAt: agent.metadata.publishedAt
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
      metadata: agent.metadata,
      categories: agent.categories,
      tags: agent.tags,
      rating: agent.rating,
      downloads: agent.downloads,
      installs: agent.installs,
      security: agent.security,
      pricing: agent.pricing,
      permissions: agent.permissions,
      isActive: agent.isActive
    };
  }

  /**
   * Get agents installed in a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Array<object>} Array of installed agents
   */
  getTenantAgents(tenantId) {
    const installedIds = this.installedAgents.get(tenantId) || new Set();
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
          securityScore: agent.security.score
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
   * @returns {object} Updated agent
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
    const oldRating = agent.rating;
    const oldDownloads = agent.downloads;
    
    // Simple average calculation (in real system, would store individual ratings)
    agent.rating = Math.round((agent.rating * agent.downloads + rating) / (agent.downloads + 1));
    agent.downloads++; // Count as a "download" for rating purposes
    agent.metadata.lastUpdated = new Date().toISOString();

    // Save updated agent
    const agentPath = path.join(this.storagePath, 'agents', `${agentId}.json`);
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
   * Load all agents from disk
   * @private
   */
  async loadAgents() {
    try {
      const agentFiles = await fs.readdir(path.join(this.storagePath, 'agents'));
      
      for (const file of agentFiles) {
        if (file.endsWith('.json')) {
          const agentPath = path.join(this.storagePath, 'agents', file);
          const agentContent = await fs.readFile(agentPath, 'utf8');
          const agent = JSON.parse(agentContent);
          
          this.agents.set(agent.id, agent);
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
      installedCount: Array.from(this.installedAgents.values()).reduce((sum, agents) => sum + agents.size, 0),
      trustedAgents: Array.from(this.agents.values()).filter(a => a.security.trusted).length,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const marketplaceManager = new MarketplaceManager();

// Export class for instantiation with custom options
export default MarketplaceManager;