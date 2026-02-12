// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Marketplace Client
 * Handles agent submission, retrieval, versioning, ratings, and discovery.
 */

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { AppError, NetworkError, ValidationError } from '../utils/errors.js';
import { validateSafePath } from '../utils/validation.js';

const DEFAULT_MARKETPLACE_API =
  process.env.ULTRA_DEX_MARKETPLACE_API ||
  process.env.MARKETPLACE_API_URL ||
  'https://marketplace.ultra-dex.ai/api/v1';

const DEFAULT_TIMEOUT_MS = 30000;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

// Fallback agents for offline mode or when API is unreachable
export const FALLBACK_MARKETPLACE_AGENTS = [
  {
    id: 'security-auditor',
    name: 'SecurityAuditor',
    description: 'Advanced security scanning & vulnerability detection',
    version: '1.2.0',
    rating: 4.8,
    downloads: 1250,
  },
  {
    id: 'accessibility-pro',
    name: 'Accessibility',
    description: 'WCAG 2.1 compliance auditing',
    version: '1.0.5',
    rating: 4.5,
    downloads: 850,
  },
  {
    id: 'api-designer',
    name: 'APIDesigner',
    description: 'OpenAPI/Swagger architect',
    version: '2.1.0',
    rating: 4.9,
    downloads: 2100,
  },
  {
    id: 'ml-engineer',
    name: 'MLEngineer',
    description: 'Python/PyTorch/TensorFlow integration expert',
    version: '0.9.5',
    rating: 4.2,
    downloads: 420,
  },
  {
    id: 'marketplace-adapter',
    name: 'Marketplace',
    description: 'Community agent discovery',
    version: '1.0.0',
    rating: 5.0,
    downloads: 5000,
  },
];

function normalizeQuery(query) {
  if (typeof query === 'string') {
    return { q: query };
  }
  if (query && typeof query === 'object') {
    return query;
  }
  return {};
}

function stripContentFields(metadata = {}) {
  const { content, systemPrompt, prompt, ...rest } = metadata;
  return rest;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export class AgentMarketplaceClient {
  constructor(apiEndpoint = DEFAULT_MARKETPLACE_API, apiKey = null) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey =
      apiKey || process.env.ULTRA_DEX_MARKETPLACE_KEY || process.env.MARKETPLACE_API_KEY || null;
    this.httpClient = null;
  }

  init() {
    if (this.httpClient) return;
    this.httpClient = axios.create({
      baseURL: this.apiEndpoint,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });
  }

  async request(method, url, { data, params } = {}) {
    try {
      const response = await this.httpClient.request({ method, url, data, params });
      return response.data;
    } catch (err) {
      if (err.response) {
        const message =
          err.response.data?.message || err.response.statusText || 'Marketplace API error';
        throw new AppError(message, { code: 'MARKETPLACE_API_ERROR', details: err.response.data });
      }
      throw new NetworkError('Marketplace API unavailable', { cause: err });
    }
  }

  ensureOnline() {
    this.init();
    if (!this.httpClient) {
      throw new AppError('Marketplace client not initialized', { code: 'MARKETPLACE_INIT_ERROR' });
    }
  }

  validateMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      throw new ValidationError('Invalid metadata: object expected');
    }
    const required = ['name', 'description', 'version'];
    for (const field of required) {
      if (!metadata[field] || String(metadata[field]).trim() === '') {
        throw new ValidationError(`Invalid metadata: "${field}" is required`);
      }
    }
    if (!VERSION_PATTERN.test(metadata.version)) {
      throw new ValidationError('Invalid metadata: version must be semver (x.y.z)');
    }
    if (metadata.rating !== undefined) {
      const rating = Number(metadata.rating);
      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        throw new ValidationError('Invalid metadata: rating must be between 0 and 5');
      }
    }
  }

  async readAgentContent(agentPath) {
    const resolvedPath = path.resolve(agentPath);
    return fs.readFile(resolvedPath, 'utf8');
  }

  async buildSubmission(agentInput, metadata) {
    let content = null;
    let meta = metadata;

    if (typeof agentInput === 'string') {
      const validatedPath = validateSafePath(agentInput, 'Agent path');
      if (validatedPath !== true) {
        throw new ValidationError(validatedPath);
      }
      content = await this.readAgentContent(agentInput);
    } else if (agentInput && typeof agentInput === 'object') {
      meta = agentInput;
    }

    if (!meta || typeof meta !== 'object') {
      throw new ValidationError('Metadata is required for marketplace submission');
    }

    const providedContent = meta.content || meta.systemPrompt || meta.prompt;
    content = content || providedContent;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new ValidationError('Agent content is required for submission');
    }

    const metadataToSend = {
      ...stripContentFields(meta),
      tags: normalizeTags(meta.tags),
      categories: normalizeTags(meta.categories),
      keywords: normalizeTags(meta.keywords),
      submittedAt: new Date().toISOString(),
    };

    this.validateMetadata(metadataToSend);

    return { metadata: metadataToSend, content };
  }

  /**
   * Submit a new agent to the marketplace.
   * Accepts either a file path + metadata, or a metadata object containing content/systemPrompt.
   */
  async submitAgent(agentInput, metadata = null) {
    this.ensureOnline();
    const payload = await this.buildSubmission(agentInput, metadata);
    const data = await this.request('post', '/agents', { data: payload });
    return {
      success: true,
      agentId: data.id || data.agentId,
      version: data.version || payload.metadata.version,
      message: data.message || 'Agent submitted successfully',
    };
  }

  /**
   * Publish a new version for an existing agent.
   */
  async publishVersion(agentId, version, content, metadata = {}) {
    this.ensureOnline();
    if (!agentId) {
      throw new ValidationError('Agent id is required');
    }
    if (!VERSION_PATTERN.test(version)) {
      throw new ValidationError('Version must be semver (x.y.z)');
    }
    if (!content || typeof content !== 'string') {
      throw new ValidationError('Agent content is required');
    }
    const payload = {
      metadata: { ...stripContentFields(metadata), version, updatedAt: new Date().toISOString() },
      content,
    };
    const data = await this.request('post', `/agents/${encodeURIComponent(agentId)}/versions`, {
      data: payload,
    });
    return { success: true, version: data.version || version };
  }

  /**
   * Retrieve agent details (optionally by version).
   */
  async retrieveAgent(agentId, version = null) {
    this.ensureOnline();
    if (!agentId) {
      throw new ValidationError('Agent id is required');
    }
    const endpoint = version
      ? `/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(version)}`
      : `/agents/${encodeURIComponent(agentId)}`;
    const data = await this.request('get', endpoint);
    return { success: true, agent: data };
  }

  /**
   * Convenience method used by CLI to fetch an agent object.
   */
  async getAgent(agentId, version = null) {
    try {
      const result = await this.retrieveAgent(agentId, version);
      return result.agent;
    } catch {
      return (
        FALLBACK_MARKETPLACE_AGENTS.find(
          (agent) => agent.id === agentId || agent.name.toLowerCase() === agentId
        ) || null
      );
    }
  }

  async listVersions(agentId) {
    this.ensureOnline();
    if (!agentId) {
      throw new ValidationError('Agent id is required');
    }
    const data = await this.request('get', `/agents/${encodeURIComponent(agentId)}/versions`);
    return data.versions || [];
  }

  /**
   * Rate an agent (1-5).
   */
  async rateAgent(agentId, rating, review = '', metadata = {}) {
    this.ensureOnline();
    if (!agentId) {
      throw new ValidationError('Agent id is required');
    }
    const normalizedRating = Number(rating);
    if (Number.isNaN(normalizedRating) || normalizedRating < 0 || normalizedRating > 5) {
      throw new ValidationError('Rating must be between 0 and 5');
    }
    const payload = {
      rating: normalizedRating,
      review: review || undefined,
      metadata: metadata || {},
    };
    const data = await this.request('post', `/agents/${encodeURIComponent(agentId)}/ratings`, {
      data: payload,
    });
    return { success: true, rating: data.rating || normalizedRating, summary: data.summary };
  }

  async getRatings(agentId) {
    this.ensureOnline();
    if (!agentId) {
      throw new ValidationError('Agent id is required');
    }
    const data = await this.request('get', `/agents/${encodeURIComponent(agentId)}/ratings`);
    return data;
  }

  async downloadAgent(agentId, downloadPath, version = null) {
    this.ensureOnline();
    const agent = await this.getAgent(agentId, version);
    if (!agent) {
      throw new AppError(`Agent '${agentId}' not found`, { code: 'MARKETPLACE_AGENT_NOT_FOUND' });
    }
    const content = agent.content || agent.systemPrompt || agent.prompt;
    if (!content) {
      throw new AppError(`Agent '${agentId}' has no downloadable content`, {
        code: 'MARKETPLACE_AGENT_NO_CONTENT',
      });
    }
    await fs.mkdir(path.dirname(downloadPath), { recursive: true });
    await fs.writeFile(downloadPath, content, 'utf8');
    return { success: true, path: downloadPath };
  }

  async searchAgents(query = {}, options = {}) {
    const normalized = { ...normalizeQuery(query), ...options };
    this.init();

    try {
      const params = new URLSearchParams();
      if (normalized.q) params.append('q', normalized.q);
      if (normalized.tags) params.append('tags', normalizeTags(normalized.tags).join(','));
      if (normalized.categories)
        params.append('categories', normalizeTags(normalized.categories).join(','));
      if (normalized.minRating !== undefined)
        params.append('minRating', String(normalized.minRating));
      if (normalized.sort) params.append('sort', normalized.sort);
      if (normalized.limit) params.append('limit', String(normalized.limit));
      if (normalized.page) params.append('page', String(normalized.page));

      const data = await this.request('get', `/agents/search?${params.toString()}`);
      return data.agents || [];
    } catch (error) {
      if (normalized.throwOnError) {
        throw error;
      }
      const q = (normalized.q || '').toLowerCase();
      return FALLBACK_MARKETPLACE_AGENTS.filter(
        (agent) =>
          agent.name.toLowerCase().includes(q) || agent.description.toLowerCase().includes(q)
      );
    }
  }

  async listAgents(options = {}) {
    this.init();
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', String(options.limit));
      if (options.page) params.append('page', String(options.page));
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const data = await this.request('get', `/agents${suffix}`);
      return data.agents || [];
    } catch {
      return FALLBACK_MARKETPLACE_AGENTS;
    }
  }

  async getTrendingAgents(limit = 10) {
    this.init();
    try {
      const data = await this.request('get', `/agents/trending?limit=${limit}`);
      return { success: true, agents: data.agents || [] };
    } catch {
      return { success: true, agents: FALLBACK_MARKETPLACE_AGENTS.slice(0, limit) };
    }
  }

  async getFeaturedAgents(limit = 10) {
    this.init();
    try {
      const data = await this.request('get', `/agents/featured?limit=${limit}`);
      return { success: true, agents: data.agents || [] };
    } catch {
      return { success: true, agents: FALLBACK_MARKETPLACE_AGENTS.slice(0, limit) };
    }
  }
}

// Global instance
export const marketplaceClient = new AgentMarketplaceClient();
