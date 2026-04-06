// Copyright (c) 2026 Ultra-Dex
/**
 * Task Router - semantic routing for agent selection
 * Uses a hybrid vector router with a lexical fallback for low-confidence matches.
 */

import { encode } from 'gpt-tokenizer';
import { getAgentProfile } from '../routing/agent-profiles.js';
import { HybridRouter, SemanticRouter } from '../routing/semantic-router.js';

/**
 * Calculate TF-IDF vectors for documents.
 * Preserved for compatibility with existing tests and legacy scoring.
 */
export class TfIdfVectorizer {
  constructor() {
    this.documents = [];
    this.vocabulary = new Map();
    this.idf = new Map();
  }

  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const normalized = text.toLowerCase();
    encode(normalized);
    return normalized
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }

  fit(documents) {
    this.documents = documents.map((doc, idx) => ({
      id: doc.id || idx,
      text: doc.text || doc.capabilities?.join(' ') || '',
      original: doc,
      tokens: [...new Set(this.tokenize(doc.text || doc.capabilities?.join(' ') || ''))],
    }));

    const docFrequency = new Map();
    for (const doc of this.documents) {
      const uniqueTokens = new Set(doc.tokens);
      for (const token of uniqueTokens) {
        docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
      }
    }

    const count = this.documents.length || 1;
    for (const [token, frequency] of docFrequency) {
      this.idf.set(token, Math.log(count / (frequency + 1)) + 1);
    }

    this.vocabulary = docFrequency;
    return this;
  }

  transform(text) {
    const tokens = this.tokenize(text);
    const tf = new Map();

    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    const maxFreq = Math.max(...tf.values(), 1);
    const vector = new Map();

    for (const [token, count] of tf) {
      const tfNorm = count / maxFreq;
      const idf = this.idf.get(token) || 1;
      vector.set(token, tfNorm * idf);
    }

    return vector;
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);

    for (const key of allKeys) {
      const a = vecA.get(key) || 0;
      const b = vecB.get(key) || 0;
      dotProduct += a * b;
    }

    for (const value of vecA.values()) {
      normA += value * value;
    }

    for (const value of vecB.values()) {
      normB += value * value;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export class TaskRouter {
  constructor(options = {}) {
    this.vectorizer = new TfIdfVectorizer();
    this.agents = new Map();
    this.similarityThreshold = options.similarityThreshold || 0.3;
    this.minimumSemanticConfidence = options.minimumSemanticConfidence || 0.6;
    this.fallbackRouter = options.fallbackRouter || this.keywordFallback;
    this.semanticRouter =
      options.semanticRouter ||
      new SemanticRouter({
        backend: options.embeddingBackend || (process.env.NODE_ENV === 'test' ? 'hashed' : 'hashed'),
      });
    this.hybridRouter =
      options.hybridRouter ||
      new HybridRouter({
        semanticRouter: this.semanticRouter,
        minimumSemanticConfidence: this.minimumSemanticConfidence,
      });
    this.isFitted = false;
  }

  registerAgent(agentId, capabilities = [], metadata = {}) {
    const defaultProfile = getAgentProfile(agentId);
    const normalizedCapabilities = [
      ...new Set([...(defaultProfile?.capabilities || []), ...(Array.isArray(capabilities) ? capabilities : [capabilities])]),
    ];
    const examples = [
      ...new Set([...(defaultProfile?.examples || []), ...((Array.isArray(metadata.examples) && metadata.examples) || [])]),
    ];

    this.agents.set(agentId, {
      id: agentId,
      capabilities: normalizedCapabilities,
      metadata,
      examples,
      capabilityText: [...normalizedCapabilities, ...examples].join(' '),
    });
    this.isFitted = false;
  }

  fit() {
    const agentDocs = Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      text: agent.capabilityText,
      capabilities: agent.capabilities,
    }));

    this.vectorizer.fit(agentDocs);

    for (const agent of this.agents.values()) {
      agent.vector = this.vectorizer.transform(agent.capabilityText);
    }

    this.hybridRouter.retrainSync(
      Array.from(this.agents.values()).map((agent) => ({
        agentId: agent.id,
        capabilities: agent.capabilities,
        examples: agent.examples,
        metadata: agent.metadata,
      }))
    );

    this.isFitted = true;
    return this;
  }

  route(task, options = {}) {
    if (!this.isFitted) {
      this.fit();
    }

    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    if (!taskText.trim() || this.agents.size === 0) {
      return this.fallbackRouter(taskText, options);
    }

    const decision = this.hybridRouter.routeSync(taskText, options.requiredCapabilities || []);

    if (
      !decision.agentId ||
      decision.confidence < this.similarityThreshold
    ) {
      const fallback = this.fallbackRouter(taskText, options);
      return {
        ...fallback,
        semanticConfidence: decision.semanticConfidence,
        capabilityScore: decision.capabilityScore,
      };
    }

    return {
      agentId: decision.agentId,
      confidence: decision.confidence,
      similarity: decision.similarity,
      alternatives: decision.alternatives,
      semanticConfidence: decision.semanticConfidence,
      capabilityScore: decision.capabilityScore,
      method: decision.method === 'capability-fallback' ? 'fallback' : 'semantic',
    };
  }

  getScores(task) {
    if (!this.isFitted) {
      this.fit();
    }

    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    const decision = this.hybridRouter.routeSync(taskText);
    const alternatives = [
      {
        agentId: decision.agentId,
        similarity: decision.similarity ?? decision.semanticConfidence ?? 0,
        confidence: decision.confidence,
      },
      ...decision.alternatives.map((alternative) => ({
        agentId: alternative.agentId,
        similarity: alternative.similarity ?? alternative.confidence,
        confidence: alternative.confidence,
      })),
    ];

    const byId = new Map(alternatives.map((entry) => [entry.agentId, entry]));

    return Array.from(this.agents.keys())
      .map((agentId) => {
        const score = byId.get(agentId);
        return {
          agentId,
          similarity: score?.similarity || 0,
          confidence: score?.confidence || 0,
          capabilities: this.agents.get(agentId)?.capabilities || [],
        };
      })
      .sort((left, right) => right.similarity - left.similarity);
  }

  keywordFallback(task, _options = {}) {
    const taskLower = String(task || '').toLowerCase();
    const keywords = {
      frontend: ['ui', 'css', 'component', 'react', 'html', 'dom', 'style', 'layout', 'button'],
      backend: ['api', 'route', 'server', 'endpoint', 'middleware', 'controller', 'query'],
      database: ['db', 'schema', 'sql', 'migration', 'model', 'table', 'index'],
      testing: ['test', 'spec', 'jest', 'vitest', 'coverage', 'mock'],
      devops: ['docker', 'k8s', 'deploy', 'ci', 'cd', 'pipeline', 'infra'],
      security: ['auth', 'encrypt', 'hash', 'jwt', 'permission', 'governance'],
    };

    const scores = {};
    for (const [agent, words] of Object.entries(keywords)) {
      scores[agent] = words.reduce(
        (score, word) => score + (taskLower.includes(word) ? 1 : 0),
        0
      );
    }

    let bestAgent = 'orchestrator';
    let bestScore = 0;
    for (const [agent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestAgent = agent;
        bestScore = score;
      }
    }

    return {
      agentId: bestAgent,
      confidence: bestScore > 0 ? 0.25 : 0.1,
      method: 'fallback',
      alternatives: [],
    };
  }

  getAgents() {
    return Array.from(this.agents.keys());
  }

  clear() {
    this.agents.clear();
    this.isFitted = false;
  }
}

export default TaskRouter;
