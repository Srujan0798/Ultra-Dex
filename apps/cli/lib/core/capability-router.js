// Copyright (c) 2026 Ultra-Dex

/**
 * Core Capability Router
 * Routes tasks to the appropriate agent/capability based on intent analysis.
 * Decouples task description from agent selection.
 */

import { logger } from '../utils/logger.js';

/**
 * Capability definition
 * @typedef {Object} Capability
 * @property {string} id - Unique capability identifier
 * @property {string} name - Human-readable name
 * @property {string} description - What this capability does
 * @property {string[]} keywords - Keywords for intent matching
 * @property {string} agent - Agent name to execute
 * @property {number} [priority] - Routing priority (higher = preferred)
 * @property {string[]} [requires] - Required capabilities
 */

/**
 * Routing result
 * @typedef {Object} RoutingResult
 * @property {string} capabilityId - Matched capability ID
 * @property {string} agent - Agent to execute
 * @property {number} confidence - Match confidence (0-1)
 * @property {string} reason - Why this capability was chosen
 */

export class CapabilityRouter {
  /**
   * Create a capability router
   * @param {Object} [options]
   * @param {number} [options.defaultConfidence=0.5] - Default confidence for keyword matches
   */
  constructor(options = {}) {
    this.defaultConfidence = options.defaultConfidence ?? 0.5;
    /** @type {Map<string, Capability>} */
    this.capabilities = new Map();
    this._registerDefaults(options.availableAgents ?? null);
  }

  /**
   * Register a new capability
   * @param {Capability} capability
   */
  register(capability) {
    this.capabilities.set(capability.id, capability);
    logger.debug(`Capability registered: ${capability.id}`, {
      agent: capability.agent,
      keywords: capability.keywords.length,
    });
  }

  /**
   * Register multiple capabilities
   * @param {Capability[]} capabilities
   */
  registerAll(capabilities) {
    capabilities.forEach((cap) => this.register(cap));
  }

  /**
   * Route a task to the appropriate capability
   * @param {string} taskDescription - Natural language task description
   * @returns {RoutingResult}
   */
  route(taskDescription) {
    const normalizedTask = taskDescription.toLowerCase().trim();
    const scores = new Map();

    for (const [id, capability] of this.capabilities) {
      const score = this._scoreCapability(normalizedTask, capability);
      if (score > 0) {
        scores.set(id, { score, capability });
      }
    }

    if (scores.size === 0) {
      logger.warn(`No capability matched for task: "${taskDescription}"`);
      return this._fallbackRoute(taskDescription);
    }

    // Find best match with deterministic tie-break:
    // 1. Highest score wins
    // 2. If tied, highest priority wins
    // 3. If still tied, lowest id (alphabetical) wins
    let bestId = null;
    let bestScore = 0;
    let bestPriority = -Infinity;

    for (const [id, { score, capability }] of scores) {
      const priority = capability.priority ?? 1;
      if (
        score > bestScore ||
        (score === bestScore && priority > bestPriority) ||
        (score === bestScore && priority === bestPriority && (bestId === null || id < bestId))
      ) {
        bestScore = score;
        bestPriority = priority;
        bestId = id;
      }
    }

    const best = scores.get(bestId);
    const result = {
      capabilityId: bestId,
      agent: best.capability.agent,
      confidence: Math.min(best.score, 1.0),
      reason: `Matched keywords: ${best.capability.keywords.filter((k) =>
        normalizedTask.includes(k.toLowerCase())
      ).join(', ')}`,
    };

    logger.info(`Routed task to ${result.agent}`, {
      capability: bestId,
      confidence: result.confidence.toFixed(2),
      task: taskDescription.slice(0, 80),
    });

    return result;
  }

  /**
   * Get all registered capabilities
   * @returns {Capability[]}
   */
  listCapabilities() {
    return [...this.capabilities.values()];
  }

  /**
   * Get a specific capability
   * @param {string} id
   * @returns {Capability|undefined}
   */
  getCapability(id) {
    return this.capabilities.get(id);
  }

  /**
   * Score how well a capability matches a task
   * @private
   */
  _scoreCapability(task, capability) {
    let score = 0;
    const matchedKeywords = [];

    for (const keyword of capability.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (task.includes(normalizedKeyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Bonus for exact agent name match
    if (task.includes(capability.agent.toLowerCase())) {
      score += 2;
    }

    // Bonus for description match
    if (task.includes(capability.description.toLowerCase().slice(0, 30))) {
      score += 1;
    }

    // Normalize by keyword count to avoid bias toward capabilities with many keywords
    const normalizedScore = capability.keywords.length > 0
      ? (score / capability.keywords.length) * (capability.priority ?? 1)
      : 0;

    return normalizedScore;
  }

  /**
   * Fallback routing when no capability matches
   * @private
   */
  _fallbackRoute(_taskDescription) {
    // Default to planner for unknown tasks
    const planner = this.capabilities.get('planner');
    if (planner) {
      return {
        capabilityId: 'planner',
        agent: planner.agent,
        confidence: 0.3,
        reason: 'Fallback to planner (no specific capability matched)',
      };
    }

    return {
      capabilityId: 'unknown',
      agent: 'planner',
      confidence: 0.1,
      reason: 'No capabilities registered, defaulting to planner',
    };
  }

  /**
   * Register default capabilities
   * @private
   * @param {Set<string>} [availableAgents] - If provided, only register capabilities for these agents
   */
  _registerDefaults(availableAgents = null) {
    const allCapabilities = [
      {
        id: 'planner',
        name: 'Task Planner',
        description: 'Break down features into atomic tasks and create implementation plans',
        keywords: ['plan', 'break down', 'implement', 'build', 'create', 'feature', 'task'],
        agent: 'planner',
        priority: 1,
      },
      {
        id: 'reviewer',
        name: 'Code Reviewer',
        description: 'Review code for quality, security, and best practices',
        keywords: ['review', 'audit', 'check', 'quality', 'security', 'lint', 'analyze'],
        agent: 'reviewer',
        priority: 1,
      },
      {
        id: 'debugger',
        name: 'Debugger',
        description: 'Find and fix bugs, errors, and issues in code',
        keywords: ['debug', 'fix', 'error', 'bug', 'issue', 'crash', 'fail'],
        agent: 'debugger',
        priority: 2,
      },
      {
        id: 'architect',
        name: 'System Architect',
        description: 'Design system architecture, APIs, and data models',
        keywords: ['architecture', 'design', 'api', 'schema', 'database', 'model', 'structure'],
        agent: 'architect',
        priority: 1,
      },
    ];

    // Only register capabilities for agents that actually exist
    const filtered = availableAgents
      ? allCapabilities.filter((cap) => availableAgents.has(cap.agent))
      : allCapabilities;

    this.registerAll(filtered);
  }
}

/**
 * Create a new capability router
 * @param {Object} [options]
 * @returns {CapabilityRouter}
 */
export function createCapabilityRouter(options = {}) {
  return new CapabilityRouter(options);
}

export default { CapabilityRouter, createCapabilityRouter };
