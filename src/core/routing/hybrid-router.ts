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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
let HybridRouter = class {
  constructor(semanticRouter, agentRegistry, logger, config) {
    this.semanticRouter = semanticRouter;
    this.agentRegistry = agentRegistry;
    this.logger = logger;
    this.config = config;
    this.semanticWeight = this.config.get('routing.semanticWeight', 0.7);
    this.capabilityWeight = this.config.get('routing.capabilityWeight', 0.3);
    this.minSemanticConfidence = this.config.get('routing.minSemanticConfidence', 0.6);
  }
  semanticWeight;
  capabilityWeight;
  minSemanticConfidence;
  async route(task, requiredCapabilities) {
    const startTime = Date.now();
    try {
      const semanticDecision = await this.semanticRouter.route(task);
      if (semanticDecision.confidence >= this.minSemanticConfidence) {
        this.logger.debug('Using pure semantic routing (high confidence)', {
          agentId: semanticDecision.agentId,
          confidence: semanticDecision.confidence,
        });
        return semanticDecision;
      }
      this.logger.debug('Using hybrid routing (semantic confidence below threshold)', {
        semanticConfidence: semanticDecision.confidence,
        requiredCapabilities,
      });
      const capableAgents = this.agentRegistry.findAgentsByCapabilities(requiredCapabilities);
      if (capableAgents.length === 0) {
        this.logger.warn('No agents found with required capabilities', {
          requiredCapabilities,
        });
        return semanticDecision;
      }
      const hybridScores = capableAgents.map((agent) => {
        const agentId = agent.id || agent.name;
        const semanticScore = this.getSemanticScoreForAgent(agentId, semanticDecision);
        const capabilityScore = this.calculateCapabilityScore(
          agent.capabilities,
          requiredCapabilities
        );
        return {
          agentId,
          semanticScore,
          capabilityScore,
          finalScore: this.semanticWeight * semanticScore + this.capabilityWeight * capabilityScore,
          capabilities: agent.capabilities,
        };
      });
      hybridScores.sort((a, b) => b.finalScore - a.finalScore);
      const topMatch = hybridScores[0];
      const alternatives = hybridScores.slice(1, 4);
      const duration = Date.now() - startTime;
      this.logger.debug('Hybrid routing completed', {
        task: task.slice(0, 100),
        topAgent: topMatch.agentId,
        finalScore: topMatch.finalScore,
        semanticScore: topMatch.semanticScore,
        capabilityScore: topMatch.capabilityScore,
        duration,
      });
      return {
        agentId: topMatch.agentId,
        confidence: topMatch.finalScore,
        alternatives: alternatives.map((a) => ({
          agentId: a.agentId,
          confidence: a.finalScore,
        })),
        reasoning: this.generateHybridReasoning(topMatch, requiredCapabilities),
      };
    } catch (error) {
      this.logger.error('Hybrid routing failed', error, {
        task: task.slice(0, 100),
      });
      return this.semanticRouter.route(task);
    }
  }
  /**
   * Batch route with hybrid scoring
   */
  async routeBatch(tasks) {
    return Promise.all(tasks.map((t) => this.route(t.task, t.requiredCapabilities)));
  }
  /**
   * Update routing weights dynamically
   */
  updateWeights(semanticWeight, capabilityWeight) {
    if (semanticWeight + capabilityWeight !== 1) {
      throw new Error('Weights must sum to 1');
    }
    this.semanticWeight = semanticWeight;
    this.capabilityWeight = capabilityWeight;
    this.logger.info('Updated routing weights', {
      semanticWeight,
      capabilityWeight,
    });
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return {
      semanticWeight: this.semanticWeight,
      capabilityWeight: this.capabilityWeight,
      minSemanticConfidence: this.minSemanticConfidence,
    };
  }
  getSemanticScoreForAgent(agentId, semanticDecision) {
    if (semanticDecision.agentId === agentId) {
      return semanticDecision.confidence;
    }
    const alternative = semanticDecision.alternatives.find((a) => a.agentId === agentId);
    return alternative?.confidence || 0;
  }
  calculateCapabilityScore(agentCapabilities, requiredCapabilities) {
    if (requiredCapabilities.length === 0) {
      return 1;
    }
    const normalizedAgentCaps = agentCapabilities.map((c) => c.toLowerCase());
    const matches = requiredCapabilities.filter((req) =>
      normalizedAgentCaps.includes(req.toLowerCase())
    );
    return matches.length / requiredCapabilities.length;
  }
  generateHybridReasoning(score, requiredCapabilities) {
    return `Hybrid routing: ${(score.finalScore * 100).toFixed(1)}% match (semantic: ${(score.semanticScore * 100).toFixed(1)}%, capabilities: ${(score.capabilityScore * 100).toFixed(1)}%). Agent has ${score.capabilities.length} capabilities including ${requiredCapabilities.slice(0, 2).join(', ')}.`;
  }
};
HybridRouter = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.SemanticRouter)),
    __decorateParam(1, inject(DI_TOKENS.AgentRegistry)),
    __decorateParam(2, inject(DI_TOKENS.Logger)),
    __decorateParam(3, inject(DI_TOKENS.ConfigService)),
  ],
  HybridRouter
);
export { HybridRouter };
