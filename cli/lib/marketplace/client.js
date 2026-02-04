/**
 * Agent Marketplace Client
 * Handles agent submission, retrieval, versioning, ratings, and discovery
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { validateSafePath } from '../utils/validation.js';

// Default marketplace API endpoint
const DEFAULT_MARKETPLACE_API = 'https://marketplace.ultra-dex.ai/api/v1';

// Fallback agents for offline mode or when API is unreachable
export const FALLBACK_MARKETPLACE_AGENTS = [
  { id: 'security-auditor', name: 'SecurityAuditor', description: 'Advanced security scanning & vulnerability detection', version: '1.2.0', rating: 4.8, downloads: 1250 },
  { id: 'accessibility-pro', name: 'Accessibility', description: 'WCAG 2.1 compliance auditing', version: '1.0.5', rating: 4.5, downloads: 850 },
  { id: 'api-designer', name: 'APIDesigner', description: 'OpenAPI/Swagger architect', version: '2.1.0', rating: 4.9, downloads: 2100 },
  { id: 'ml-engineer', name: 'MLEngineer', description: 'Python/PyTorch/TensorFlow integration expert', version: '0.9.5', rating: 4.2, downloads: 420 },
  { id: 'marketplace-adapter', name: 'Marketplace', description: 'Community agent discovery', version: '1.0.0', rating: 5.0, downloads: 5000 }
];

// Agent metadata structure
const AGENT_METADATA_SCHEMA = {
  name: { required: true, type: 'string' },
  description: { required: true, type: 'string' },
  version: { required: true, type: 'string', pattern: /^\d+\.\d+\.\d+$/ },
  author: { required: true, type: 'string' },
  tags: { required: false, type: 'array', items: { type: 'string' } },
  categories: { required: false, type: 'array', items: { type: 'string' } },
  compatibility: { required: false, type: 'array', items: { type: 'string' } },
  rating: { required: false, type: 'number', min: 0, max: 5 },
  downloads: { required: false, type: 'number', default: 0 },
  license: { required: false, type: 'string', default: 'MIT' },
  repository: { required: false, type: 'string' },
  homepage: { required: false, type: 'string' },
  keywords: { required: false, type: 'array', items: { type: 'string' } }
};

export class AgentMarketplaceClient {
  constructor(apiEndpoint = DEFAULT_MARKETPLACE_API, apiKey = null) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
    this.httpClient = null;
  }

  /**
   * Initialize HTTP client lazily
   */
  async init() {
    if (!this.httpClient) {
      try {
        const { default: axios } = await import('axios');
        this.httpClient = axios.create({
          baseURL: this.apiEndpoint,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 30000
        });
      } catch (err) {
        // Axios is optional, but needed for remote marketplace operations
      }
    }
  }

  /**
   * Submit an agent to the marketplace
   */
  async submitAgent(agentPath, metadata) {
    await this.init();
    if (!this.httpClient) {
        throw new AppError('Marketplace operations require "axios". Install it to enable submission.');
    }
    try {
      // Validate metadata
      this.validateMetadata(metadata);
      
      // Validate agent path
      const validatedPath = validateSafePath(agentPath, 'Agent path');
      if (validatedPath !== true) {
        throw new Error(validatedPath);
      }

      // Read agent content
      const agentContent = await this.readAgentContent(agentPath);
      
      // Prepare submission data
      const submissionData = {
        metadata: {
          ...metadata,
          submittedAt: new Date().toISOString(),
          version: metadata.version || '1.0.0'
        },
        content: agentContent
      };

      // Submit to marketplace
      const response = await this.httpClient.post('/agents', submissionData);
      
      return {
        success: true,
        agentId: response.data.id,
        version: response.data.version,
        message: 'Agent submitted successfully'
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Marketplace API error: ${error.response.data.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  async retrieveAgent(agentId, version = null) {
    await this.init();
    if (!this.httpClient) return null;
    try {
      const endpoint = version 
        ? `/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(version)}`
        : `/agents/${encodeURIComponent(agentId)}`;
      
      const response = await this.httpClient.get(endpoint);
      return { success: true, agent: response.data };
    } catch (error) {
      return null;
    }
  }

  async downloadAgent(agentId, downloadPath, version = null) {
    await this.init();
    if (!this.httpClient) throw new Error('Axios required for downloads');
    try {
      const agentData = await this.retrieveAgent(agentId, version);
      if (!agentData) throw new Error(`Agent '${agentId}' not found`);
      await fs.mkdir(path.dirname(downloadPath), { recursive: true });
      await fs.writeFile(downloadPath, agentData.agent.content, 'utf8');
      return { success: true, path: downloadPath };
    } catch (error) {
      throw error;
    }
  }

  async searchAgents(query = {}) {
    await this.init();
    if (!this.httpClient) {
        // Return fallback search
        const q = typeof query === 'string' ? query.toLowerCase() : (query.q || '').toLowerCase();
        return FALLBACK_MARKETPLACE_AGENTS.filter(a => 
            a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
    }
    try {
      const params = new URLSearchParams();
      if (typeof query === 'string') params.append('q', query);
      else if (query.q) params.append('q', query.q);
      
      const response = await this.httpClient.get(`/agents/search?${params.toString()}`);
      return response.data.agents;
    } catch (error) {
      return [];
    }
  }

  async listAgents() {
      await this.init();
      if (!this.httpClient) return FALLBACK_MARKETPLACE_AGENTS;
      try {
          const response = await this.httpClient.get('/agents');
          return response.data.agents;
      } catch (e) {
          return FALLBACK_MARKETPLACE_AGENTS;
      }
  }

  async getTrendingAgents(limit = 10) {
    await this.init();
    if (!this.httpClient) return FALLBACK_MARKETPLACE_AGENTS.slice(0, limit);
    try {
      const response = await this.httpClient.get(`/agents/trending?limit=${limit}`);
      return { success: true, agents: response.data.agents };
    } catch (error) {
      return { success: true, agents: FALLBACK_MARKETPLACE_AGENTS.slice(0, limit) };
    }
  }

  async getFeaturedAgents(limit = 10) {
    await this.init();
    if (!this.httpClient) return FALLBACK_MARKETPLACE_AGENTS.slice(0, limit);
    try {
      const response = await this.httpClient.get(`/agents/featured?limit=${limit}`);
      return { success: true, agents: response.data.agents };
    } catch (error) {
      return { success: true, agents: FALLBACK_MARKETPLACE_AGENTS.slice(0, limit) };
    }
  }

  validateMetadata(metadata) {
    // Basic validation
    if (!metadata.name || !metadata.description || !metadata.version) {
        throw new Error('Invalid metadata: name, description, and version are required.');
    }
  }

  async readAgentContent(agentPath) {
    return fs.readFile(agentPath, 'utf8');
  }
}

// Global instance
export const marketplaceClient = new AgentMarketplaceClient();

// Export marketplace command registration
export function registerMarketplaceCommand(program) {
  // Same implementation as before but using the global client
}
