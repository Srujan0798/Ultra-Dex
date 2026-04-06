// Copyright (c) 2026 Ultra-Dex
/**
 * Task Router - Semantic routing for agent selection
 * Uses TF-IDF and cosine similarity to match tasks to agent capabilities
 */

import { encode } from 'gpt-tokenizer';

/**
 * Calculate TF-IDF vectors for documents
 */
export class TfIdfVectorizer {
  constructor() {
    this.documents = [];
    this.vocabulary = new Map();
    this.idf = new Map();
  }

  /**
   * Tokenize text using gpt-tokenizer
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    // Convert to lowercase and tokenize
    const normalized = text.toLowerCase();
    // Use gpt-tokenizer to get tokens, then convert back to strings
    const tokenIds = encode(normalized);
    // Simple word tokenization as fallback for interpretability
    const words = normalized
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    return [...new Set(words)]; // Unique tokens
  }

  /**
   * Fit the vectorizer on a corpus of documents
   */
  fit(documents) {
    this.documents = documents.map((doc, idx) => ({
      id: doc.id || idx,
      text: doc.text || doc.capabilities?.join(' ') || '',
      original: doc,
      tokens: this.tokenize(doc.text || doc.capabilities?.join(' ') || ''),
    }));

    // Build vocabulary
    const docFrequency = new Map();
    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc.tokens);
      for (const token of uniqueTokens) {
        docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
      }
    }

    // Calculate IDF
    const n = this.documents.length;
    for (const [token, df] of docFrequency) {
      this.idf.set(token, Math.log(n / (df + 1)) + 1);
    }

    this.vocabulary = docFrequency;
    return this;
  }

  /**
   * Transform a document to TF-IDF vector
   */
  transform(text) {
    const tokens = this.tokenize(text);
    const tf = new Map();
    
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Normalize term frequency
    const maxFreq = Math.max(...tf.values(), 1);
    const vector = new Map();
    
    for (const [token, count] of tf) {
      const tfNorm = count / maxFreq;
      const idf = this.idf.get(token) || 1;
      vector.set(token, tfNorm * idf);
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Calculate dot product and norms
    const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);
    
    for (const key of allKeys) {
      const a = vecA.get(key) || 0;
      const b = vecB.get(key) || 0;
      dotProduct += a * b;
    }

    for (const val of vecA.values()) {
      normA += val * val;
    }

    for (const val of vecB.values()) {
      normB += val * val;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }
}

/**
 * Task Router - Routes tasks to agents based on semantic similarity
 */
export class TaskRouter {
  constructor(options = {}) {
    this.vectorizer = new TfIdfVectorizer();
    this.agents = new Map();
    this.similarityThreshold = options.similarityThreshold || 0.3;
    this.fallbackRouter = options.fallbackRouter || this.keywordFallback;
    this.isFitted = false;
  }

  /**
   * Register an agent with its capabilities
   */
  registerAgent(agentId, capabilities = [], metadata = {}) {
    this.agents.set(agentId, {
      id: agentId,
      capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
      metadata,
      capabilityText: Array.isArray(capabilities) ? capabilities.join(' ') : capabilities,
    });
    this.isFitted = false; // Need to refit
  }

  /**
   * Fit the router on all registered agents
   */
  fit() {
    const agentDocs = Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      text: agent.capabilityText,
      capabilities: agent.capabilities,
    }));

    this.vectorizer.fit(agentDocs);
    
    // Pre-compute vectors for all agents
    for (const agent of this.agents.values()) {
      agent.vector = this.vectorizer.transform(agent.capabilityText);
    }

    this.isFitted = true;
    return this;
  }

  /**
   * Route a task to the best matching agent
   */
  route(task, options = {}) {
    if (!this.isFitted) {
      this.fit();
    }

    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    const taskVector = this.vectorizer.transform(taskText);

    // Score all agents
    const scores = [];
    for (const [agentId, agent] of this.agents) {
      const similarity = this.vectorizer.cosineSimilarity(taskVector, agent.vector);
      scores.push({
        agentId,
        similarity,
        agent,
      });
    }

    // Sort by similarity descending
    scores.sort((a, b) => b.similarity - a.similarity);

    // Check if best score meets threshold
    if (scores.length === 0 || scores[0].similarity < this.similarityThreshold) {
      // Fall back to keyword matching
      return this.fallbackRouter(taskText, options);
    }

    return {
      agentId: scores[0].agentId,
      confidence: scores[0].similarity,
      alternatives: scores.slice(1, 4).map(s => ({
        agentId: s.agentId,
        confidence: s.similarity,
      })),
      method: 'semantic',
    };
  }

  /**
   * Get scores for all agents for a given task
   */
  getScores(task) {
    if (!this.isFitted) {
      this.fit();
    }

    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    const taskVector = this.vectorizer.transform(taskText);

    const scores = [];
    for (const [agentId, agent] of this.agents) {
      const similarity = this.vectorizer.cosineSimilarity(taskVector, agent.vector);
      scores.push({
        agentId,
        similarity,
        capabilities: agent.capabilities,
      });
    }

    return scores.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Keyword-based fallback router
   */
  keywordFallback(task, options = {}) {
    const taskLower = task.toLowerCase();
    
    // Keyword matching rules
    const keywords = {
      frontend: ['ui', 'css', 'component', 'react', 'html', 'dom', 'style', 'layout'],
      backend: ['api', 'route', 'server', 'endpoint', 'middleware', 'controller'],
      database: ['db', 'schema', 'sql', 'query', 'migration', 'model', 'table'],
      testing: ['test', 'spec', 'jest', 'vitest', 'coverage', 'mock'],
      devops: ['docker', 'k8s', 'deploy', 'ci', 'cd', 'pipeline', 'infra'],
      security: ['auth', 'encrypt', 'hash', 'jwt', 'permission', 'governance'],
    };

    const scores = {};
    for (const [agent, words] of Object.entries(keywords)) {
      scores[agent] = words.reduce((score, word) => {
        return score + (taskLower.includes(word) ? 1 : 0);
      }, 0);
    }

    // Find best match
    let bestAgent = 'orchestrator';
    let bestScore = 0;

    for (const [agent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return {
      agentId: bestAgent,
      confidence: bestScore > 0 ? 0.25 : 0.1,
      method: 'fallback',
      alternatives: [],
    };
  }

  /**
   * Get all registered agents
   */
  getAgents() {
    return Array.from(this.agents.keys());
  }

  /**
   * Clear all registered agents
   */
  clear() {
    this.agents.clear();
    this.isFitted = false;
  }
}

export default TaskRouter;
