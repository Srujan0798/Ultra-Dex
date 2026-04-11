var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { AGENT_PROFILES, buildProfileText } from './agent-profiles.js';
const DEFAULT_DIMENSIONS = 384;
const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';
const SYNONYM_MAP = /* @__PURE__ */ new Map([
  ['button', ['cta', 'component', 'ui', 'control']],
  ['bounce', ['animate', 'animation', 'motion', 'spring']],
  ['modal', ['dialog', 'overlay', 'popup']],
  ['query', ['database', 'sql', 'fetch']],
  ['queries', ['database', 'sql', 'fetch']],
  ['optimize', ['performance', 'improve', 'tune']],
  ['deployment', ['deploy', 'release', 'rollout']],
  ['endpoint', ['api', 'route', 'handler']],
  ['schema', ['database', 'table', 'model']],
  ['login', ['auth', 'authentication', 'signin']],
  ['test', ['qa', 'spec', 'coverage']],
]);
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function tokenize(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }
  const words = normalized.split(' ').filter(Boolean);
  const tokens = [...words];
  for (let index = 0; index < words.length - 1; index++) {
    tokens.push(`${words[index]} ${words[index + 1]}`);
  }
  return tokens;
}
function stableHash(input, seed = 0) {
  let hash = 2166136261 ^ seed;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function normalizeVector(vector) {
  let magnitude = 0;
  for (const value of vector) {
    magnitude += value * value;
  }
  magnitude = Math.sqrt(magnitude);
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}
function similarityToConfidence(similarity) {
  const confidence = 1 / (1 + Math.exp(-((similarity - 0.2) * 6)));
  return Number(clamp(confidence, 0.05, 0.99).toFixed(4));
}
function mergeCapabilities(agentId, capabilities = []) {
  const defaults = AGENT_PROFILES.find((profile) => profile.agentId === agentId);
  return [.../* @__PURE__ */ new Set([...(defaults?.capabilities || []), ...capabilities])];
}
function mergeExamples(agentId, examples = []) {
  const defaults = AGENT_PROFILES.find((profile) => profile.agentId === agentId);
  return [.../* @__PURE__ */ new Set([...(defaults?.examples || []), ...examples])];
}
function normalizeProfiles(profiles) {
  return profiles.map((profile) => {
    const capabilities = mergeCapabilities(profile.agentId, profile.capabilities || []);
    const examples = mergeExamples(profile.agentId, profile.examples || []);
    return {
      agentId: profile.agentId,
      capabilities,
      examples,
      metadata: profile.metadata || {},
      searchableText: buildProfileText({
        ...profile,
        capabilities,
        examples,
      }),
      capabilityTokenSet: new Set(tokenize(capabilities.join(' '))),
    };
  });
}
function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB) || vectorA.length !== vectorB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < vectorA.length; index++) {
    const a = vectorA[index] || 0;
    const b = vectorB[index] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
let HashEmbeddingModel = class {
  constructor(options = {}) {
    this.dimensions = options.dimensions || DEFAULT_DIMENSIONS;
    this.supportsSync = true;
  }
  expandTokens(tokens) {
    const expanded = [...tokens];
    for (const token of tokens) {
      const synonyms = SYNONYM_MAP.get(token);
      if (synonyms) {
        expanded.push(...synonyms);
      }
    }
    return expanded;
  }
  embedSync(text) {
    const vector = new Array(this.dimensions).fill(0);
    const tokens = this.expandTokens(tokenize(text));
    if (tokens.length === 0) {
      return vector;
    }
    for (const token of tokens) {
      const primaryIndex = stableHash(token) % this.dimensions;
      const secondaryIndex = stableHash(token, 97) % this.dimensions;
      const tertiaryIndex = stableHash(token, 193) % this.dimensions;
      const weight = token.includes(' ') ? 1.25 : 1;
      vector[primaryIndex] += weight;
      vector[secondaryIndex] += weight * 0.45;
      vector[tertiaryIndex] += weight * 0.2;
    }
    return normalizeVector(vector);
  }
  async embed(text) {
    return this.embedSync(text);
  }
  async embedMany(texts) {
    return texts.map((text) => this.embedSync(text));
  }
};
HashEmbeddingModel = __decorateClass([singleton()], HashEmbeddingModel);
let TransformersEmbeddingModel = class {
  constructor(options = {}) {
    this.modelName = options.modelName || DEFAULT_MODEL;
    this.dimensions = options.dimensions || DEFAULT_DIMENSIONS;
    this.supportsSync = false;
    this.pipelinePromise = null;
  }
  async getExtractor() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = import('@xenova/transformers').then(async ({ env, pipeline }) => {
        env.allowRemoteModels = true;
        env.allowLocalModels = true;
        return await pipeline('feature-extraction', this.modelName, { quantized: true });
      });
    }
    return await this.pipelinePromise;
  }
  async embed(text) {
    const extractor = await this.getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const rawVector = Array.from(output.data || []);
    const vector = rawVector.slice(0, this.dimensions);
    while (vector.length < this.dimensions) {
      vector.push(0);
    }
    return normalizeVector(vector);
  }
  async embedMany(texts) {
    const vectors = [];
    for (const text of texts) {
      vectors.push(await this.embed(text));
    }
    return vectors;
  }
};
TransformersEmbeddingModel = __decorateClass([singleton()], TransformersEmbeddingModel);
let SemanticRouter = class {
  constructor(options = {}) {
    this.dimensions = options.dimensions || DEFAULT_DIMENSIONS;
    this.backend =
      options.backend ||
      process.env.ULTRA_DEX_ROUTER_BACKEND ||
      (process.env.NODE_ENV === 'test' ? 'hashed' : 'hashed');
    this.modelName = options.modelName || DEFAULT_MODEL;
    this.embedder =
      options.embedder ||
      (this.backend === 'transformers'
        ? new TransformersEmbeddingModel({
            modelName: this.modelName,
            dimensions: this.dimensions,
          })
        : new HashEmbeddingModel({ dimensions: this.dimensions }));
    this.agentProfiles = [];
    this.profileEmbeddings = [];
    this.outcomeCount = 0;
    this.adjustmentInterval = options.adjustmentInterval || 50;
    this.feedbackStats = /* @__PURE__ */ new Map();
    this.feedbackAdjustments = /* @__PURE__ */ new Map();
  }
  canRouteSync() {
    return typeof this.embedder.embedSync === 'function';
  }
  async embed(text) {
    return await this.embedder.embed(text);
  }
  embedSync(text) {
    if (!this.canRouteSync()) {
      throw new Error('SemanticRouter sync routing requires a synchronous embedder backend');
    }
    return this.embedder.embedSync(text);
  }
  async retrain(profiles = AGENT_PROFILES) {
    this.agentProfiles = normalizeProfiles(profiles);
    this.profileEmbeddings = await this.embedder.embedMany(
      this.agentProfiles.map((profile) => profile.searchableText)
    );
    return this.agentProfiles;
  }
  retrainSync(profiles = AGENT_PROFILES) {
    this.agentProfiles = normalizeProfiles(profiles);
    this.profileEmbeddings = this.agentProfiles.map((profile) =>
      this.embedder.embedSync(profile.searchableText)
    );
    return this.agentProfiles;
  }
  ensureReadySync() {
    if (this.agentProfiles.length === 0) {
      this.retrainSync();
    }
  }
  async ensureReady() {
    if (this.agentProfiles.length === 0) {
      await this.retrain();
    }
  }
  buildMatches(taskEmbedding) {
    return this.agentProfiles
      .map((profile, index) => {
        const similarity = cosineSimilarity(taskEmbedding, this.profileEmbeddings[index]);
        return {
          agentId: profile.agentId,
          similarity,
          confidence: similarityToConfidence(similarity),
          profile,
        };
      })
      .sort((left, right) => right.similarity - left.similarity);
  }
  buildDecision(matches, method = 'semantic') {
    if (matches.length === 0) {
      return {
        agentId: 'orchestrator',
        confidence: 0.1,
        similarity: 0,
        method: 'fallback',
        alternatives: [],
        matches: [],
      };
    }
    const [best, ...rest] = matches;
    return {
      agentId: best.agentId,
      confidence: best.confidence,
      similarity: best.similarity,
      method,
      alternatives: rest.slice(0, 2).map((match) => ({
        agentId: match.agentId,
        confidence: match.confidence,
        similarity: match.similarity,
      })),
      matches,
    };
  }
  routeSync(task) {
    this.ensureReadySync();
    const taskEmbedding = this.embedSync(typeof task === 'string' ? task : JSON.stringify(task));
    return this.buildDecision(this.buildMatches(taskEmbedding));
  }
  async route(task) {
    if (this.canRouteSync()) {
      return this.routeSync(task);
    }
    await this.ensureReady();
    const taskEmbedding = await this.embed(typeof task === 'string' ? task : JSON.stringify(task));
    return this.buildDecision(this.buildMatches(taskEmbedding));
  }
  recordOutcome(taskId, agentId, outcome = {}) {
    if (!agentId) {
      return;
    }
    if (taskId) {
      this.lastOutcomeTaskId = taskId;
    }
    const aggregate = this.feedbackStats.get(agentId) || {
      totalTasks: 0,
      successCount: 0,
      latencyTotal: 0,
      tokensTotal: 0,
    };
    aggregate.totalTasks += 1;
    aggregate.successCount += outcome.success ? 1 : 0;
    aggregate.latencyTotal += Number(outcome.latencyMs || 0);
    aggregate.tokensTotal += Number(outcome.tokensUsed || 0);
    this.feedbackStats.set(agentId, aggregate);
    this.outcomeCount += 1;
    if (this.outcomeCount % this.adjustmentInterval === 0) {
      this.adjustProfiles();
    }
  }
  adjustProfiles() {
    for (const [agentId, aggregate] of this.feedbackStats.entries()) {
      if (aggregate.totalTasks < 5) {
        this.feedbackAdjustments.set(agentId, 1);
        continue;
      }
      const successRate = aggregate.successCount / aggregate.totalTasks;
      const avgLatency = aggregate.latencyTotal / aggregate.totalTasks;
      let factor = 1;
      if (successRate > 0.8 && avgLatency < 1e3) {
        factor += 0.15;
      }
      if (successRate < 0.5) {
        factor -= 0.15;
      }
      this.feedbackAdjustments.set(agentId, Number(clamp(factor, 0.5, 1.5).toFixed(4)));
    }
  }
  getFeedbackAdjustment(agentId) {
    return this.feedbackAdjustments.get(agentId) || 1;
  }
  getRouterStats() {
    const stats = {};
    for (const [agentId, aggregate] of this.feedbackStats.entries()) {
      const totalTasks = aggregate.totalTasks || 1;
      stats[agentId] = {
        totalTasks: aggregate.totalTasks,
        successRate: aggregate.successCount / totalTasks,
        avgLatency: Math.round(aggregate.latencyTotal / totalTasks),
        avgTokens: Math.round(aggregate.tokensTotal / totalTasks),
        adjustmentFactor: this.getFeedbackAdjustment(agentId),
      };
    }
    return stats;
  }
  clearFeedback() {
    this.outcomeCount = 0;
    this.feedbackStats.clear();
    this.feedbackAdjustments.clear();
  }
};
SemanticRouter = __decorateClass([singleton()], SemanticRouter);
let HybridRouter = class {
  constructor(options = {}) {
    this.semanticWeight = options.semanticWeight ?? 0.7;
    this.capabilityWeight = options.capabilityWeight ?? 0.3;
    this.minimumSemanticConfidence = options.minimumSemanticConfidence ?? 0.6;
    this.fallbackAgentId = options.fallbackAgentId || 'orchestrator';
    this.semanticRouter = options.semanticRouter || new SemanticRouter(options);
  }
  capabilityScore(taskText, profile, requiredCapabilities = []) {
    const taskTokens = new Set(tokenize(taskText));
    const lexicalMatches = Array.from(profile.capabilityTokenSet).filter((token) =>
      taskTokens.has(token)
    ).length;
    const lexicalScore =
      profile.capabilityTokenSet.size > 0
        ? lexicalMatches /
          Math.max(1, Math.min(profile.capabilityTokenSet.size, taskTokens.size || 1))
        : 0;
    if (!requiredCapabilities.length) {
      return Number(clamp(lexicalScore, 0, 1).toFixed(4));
    }
    const matchedRequired = requiredCapabilities.filter((capability) =>
      profile.capabilities.includes(capability)
    ).length;
    const requiredScore = matchedRequired / requiredCapabilities.length;
    return Number(clamp(requiredScore * 0.7 + lexicalScore * 0.3, 0, 1).toFixed(4));
  }
  rankMatches(taskText, semanticMatches, requiredCapabilities = []) {
    return semanticMatches
      .map((match) => {
        const feedbackAdjustment =
          typeof this.semanticRouter.getFeedbackAdjustment === 'function'
            ? this.semanticRouter.getFeedbackAdjustment(match.agentId)
            : 1;
        const adjustedSemanticConfidence = clamp(match.confidence * feedbackAdjustment, 0, 0.99);
        const capabilityScore = this.capabilityScore(taskText, match.profile, requiredCapabilities);
        const hybridScore =
          adjustedSemanticConfidence * this.semanticWeight +
          capabilityScore * this.capabilityWeight;
        return {
          ...match,
          capabilityScore,
          semanticConfidence: adjustedSemanticConfidence,
          adjustmentFactor: feedbackAdjustment,
          hybridScore: Number(clamp(hybridScore, 0, 0.99).toFixed(4)),
        };
      })
      .sort((left, right) => right.hybridScore - left.hybridScore);
  }
  buildDecision(ranked, method) {
    if (ranked.length === 0) {
      return {
        agentId: this.fallbackAgentId,
        confidence: 0.1,
        method: 'fallback',
        alternatives: [],
        semanticConfidence: 0,
        capabilityScore: 0,
      };
    }
    const [best, ...rest] = ranked;
    return {
      agentId: best.agentId,
      confidence: best.hybridScore,
      method,
      semanticConfidence: best.semanticConfidence,
      capabilityScore: best.capabilityScore,
      similarity: best.similarity,
      alternatives: rest.slice(0, 2).map((match) => ({
        agentId: match.agentId,
        confidence: match.hybridScore,
        similarity: match.similarity,
      })),
    };
  }
  retrainSync(profiles = AGENT_PROFILES) {
    return this.semanticRouter.retrainSync(profiles);
  }
  async retrain(profiles = AGENT_PROFILES) {
    return await this.semanticRouter.retrain(profiles);
  }
  routeSync(task, requiredCapabilities = []) {
    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    const semanticDecision = this.semanticRouter.routeSync(taskText);
    const ranked = this.rankMatches(taskText, semanticDecision.matches, requiredCapabilities);
    if (ranked.length === 0) {
      return this.buildDecision([], 'fallback');
    }
    if (ranked[0].confidence < this.minimumSemanticConfidence) {
      const capabilityRanked = requiredCapabilities.length
        ? [...ranked].sort(
            (left, right) =>
              right.capabilityScore - left.capabilityScore || right.hybridScore - left.hybridScore
          )
        : ranked;
      return this.buildDecision(capabilityRanked, 'capability-fallback');
    }
    return this.buildDecision(ranked, 'hybrid');
  }
  async route(task, requiredCapabilities = []) {
    const taskText = typeof task === 'string' ? task : JSON.stringify(task);
    const semanticDecision = await this.semanticRouter.route(taskText);
    const ranked = this.rankMatches(taskText, semanticDecision.matches, requiredCapabilities);
    if (ranked.length === 0) {
      return this.buildDecision([], 'fallback');
    }
    if (ranked[0].confidence < this.minimumSemanticConfidence) {
      const capabilityRanked = requiredCapabilities.length
        ? [...ranked].sort(
            (left, right) =>
              right.capabilityScore - left.capabilityScore || right.hybridScore - left.hybridScore
          )
        : ranked;
      return this.buildDecision(capabilityRanked, 'capability-fallback');
    }
    return this.buildDecision(ranked, 'hybrid');
  }
  recordOutcome(taskId, agentId, outcome = {}) {
    if (typeof this.semanticRouter.recordOutcome === 'function') {
      this.semanticRouter.recordOutcome(taskId, agentId, outcome);
    }
  }
  getRouterStats() {
    if (typeof this.semanticRouter.getRouterStats === 'function') {
      return this.semanticRouter.getRouterStats();
    }
    return {};
  }
  getFeedbackAdjustment(agentId) {
    if (typeof this.semanticRouter.getFeedbackAdjustment === 'function') {
      return this.semanticRouter.getFeedbackAdjustment(agentId);
    }
    return 1;
  }
  clearFeedback() {
    if (typeof this.semanticRouter.clearFeedback === 'function') {
      this.semanticRouter.clearFeedback();
    }
  }
};
HybridRouter = __decorateClass([singleton()], HybridRouter);
export {
  HashEmbeddingModel,
  HybridRouter,
  SemanticRouter,
  TransformersEmbeddingModel,
  cosineSimilarity,
};
