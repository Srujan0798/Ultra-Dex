// Copyright (c) 2026 Ultra-Dex

/**
 * Advanced Swarm Orchestration
 * Checkpoint/Resume, Conflict Resolution, Cost Tracking
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';

/**
 * Checkpoint Manager
 * Saves and restores swarm state for resume capability
 */
export class CheckpointManager {
  constructor(options = {}) {
    this.checkpointDir = options.checkpointDir || '.ultra-dex/checkpoints';
    this.maxCheckpoints = options.maxCheckpoints || 10;
  }

  /**
   * Initialize checkpoint directory
   */
  async initialize() {
    await fs.mkdir(this.checkpointDir, { recursive: true });
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(swarmId, state) {
    const checkpointId = this.generateCheckpointId();
    const checkpoint = {
      id: checkpointId,
      swarmId,
      timestamp: new Date().toISOString(),
      state: {
        ...state,
        timestamp: Date.now(),
      },
    };

    const filepath = path.join(this.checkpointDir, `checkpoint-${checkpointId}.json`);
    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2));

    // Clean old checkpoints
    await this.cleanupOldCheckpoints(swarmId);

    return checkpointId;
  }

  /**
   * Load a checkpoint
   */
  async loadCheckpoint(checkpointId) {
    const filepath = path.join(this.checkpointDir, `checkpoint-${checkpointId}.json`);

    try {
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content);
    } catch (_error) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
  }

  /**
   * List checkpoints for a swarm
   */
  async listCheckpoints(swarmId) {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints = [];

      for (const file of files) {
        if (!file.startsWith('checkpoint-')) continue;

        const content = await fs.readFile(path.join(this.checkpointDir, file), 'utf8');
        const checkpoint = JSON.parse(content);

        if (checkpoint.swarmId === swarmId) {
          checkpoints.push({
            id: checkpoint.id,
            timestamp: checkpoint.timestamp,
            swarmId: checkpoint.swarmId,
          });
        }
      }

      return checkpoints.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (_error) {
      return [];
    }
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(checkpointId) {
    const filepath = path.join(this.checkpointDir, `checkpoint-${checkpointId}.json`);

    try {
      await fs.unlink(filepath);
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Clean old checkpoints for a swarm
   */
  async cleanupOldCheckpoints(swarmId) {
    const checkpoints = await this.listCheckpoints(swarmId);

    if (checkpoints.length > this.maxCheckpoints) {
      const toDelete = checkpoints.slice(this.maxCheckpoints);

      for (const cp of toDelete) {
        await this.deleteCheckpoint(cp.id);
      }
    }
  }

  /**
   * Generate checkpoint ID
   */
  generateCheckpointId() {
    return crypto.randomBytes(8).toString('hex');
  }
}

/**
 * Conflict Resolver
 * Handles file edit conflicts during parallel agent execution
 */
export class ConflictResolver {
  constructor(options = {}) {
    this.resolutionStrategy = options.resolutionStrategy || 'manual'; // manual, auto-ours, auto-theirs, auto-merge
    this.conflicts = [];
  }

  /**
   * Detect conflicts between multiple agent edits
   */
  detectConflicts(edits) {
    const conflicts = [];
    const fileMap = new Map();

    for (const edit of edits) {
      const { file, agent, content, range } = edit;

      if (fileMap.has(file)) {
        const existing = fileMap.get(file);

        // Check for overlapping ranges
        if (this.rangesOverlap(existing.range, range)) {
          conflicts.push({
            file,
            agents: [existing.agent, agent],
            type: 'overlap',
            ranges: [existing.range, range],
          });
        }
      } else {
        fileMap.set(file, { agent, content, range });
      }
    }

    this.conflicts = conflicts;
    return conflicts;
  }

  /**
   * Check if two ranges overlap
   */
  rangesOverlap(range1, range2) {
    return !(range1.end < range2.start || range2.end < range1.start);
  }

  /**
   * Resolve conflicts using configured strategy
   */
  async resolveConflicts(conflicts, options = {}) {
    const resolutions = [];

    for (const conflict of conflicts) {
      let resolution;

      switch (this.resolutionStrategy) {
        case 'auto-ours':
          resolution = this.resolveOurs(conflict);
          break;
        case 'auto-theirs':
          resolution = this.resolveTheirs(conflict);
          break;
        case 'auto-merge':
          resolution = await this.resolveMerge(conflict);
          break;
        case 'manual':
        default:
          resolution = await this.resolveManual(conflict, options);
          break;
      }

      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Resolve using "ours" strategy
   */
  resolveOurs(conflict) {
    return {
      ...conflict,
      resolution: 'ours',
      winner: conflict.agents[0],
    };
  }

  /**
   * Resolve using "theirs" strategy
   */
  resolveTheirs(conflict) {
    return {
      ...conflict,
      resolution: 'theirs',
      winner: conflict.agents[1],
    };
  }

  /**
   * Resolve using merge strategy
   */
  async resolveMerge(conflict) {
    // Simple concatenation merge - could be smarter
    return {
      ...conflict,
      resolution: 'merged',
      requiresReview: true,
    };
  }

  /**
   * Manual resolution with UI
   */
  async resolveManual(conflict, options) {
    // If inquirer is available, prompt user
    if (options.inquirer) {
      const { resolution } = await options.inquirer.prompt([
        {
          type: 'list',
          name: 'resolution',
          message: `Conflict in ${conflict.file} between ${conflict.agents.join(' and ')}`,
          choices: [
            { name: `Accept ${conflict.agents[0]} (ours)`, value: 'ours' },
            { name: `Accept ${conflict.agents[1]} (theirs)`, value: 'theirs' },
            { name: 'Merge both', value: 'merge' },
            { name: 'Review manually', value: 'manual' },
          ],
        },
      ]);

      return {
        ...conflict,
        resolution,
        winner:
          resolution === 'ours'
            ? conflict.agents[0]
            : resolution === 'theirs'
              ? conflict.agents[1]
              : null,
      };
    }

    // Default to requiring manual review
    return {
      ...conflict,
      resolution: 'manual',
      requiresReview: true,
    };
  }

  /**
   * Lock file for editing
   */
  async lockFile(file, agent, timeout = 30000) {
    const lockId = `lock-${Date.now()}-${agent}`;
    // In a real implementation, this would use file locks or distributed locks
    return {
      file,
      agent,
      lockId,
      acquired: true,
      expiresAt: Date.now() + timeout,
    };
  }

  /**
   * Unlock file
   */
  async unlockFile(file, lockId) {
    // Release lock
    return true;
  }
}

/**
 * Cost Tracker
 * Track API costs per agent and overall
 */
export class CostTracker {
  constructor(options = {}) {
    this.rates = options.rates || {
      openai: { input: 0.00001, output: 0.00003 }, // per token
      anthropic: { input: 0.000008, output: 0.000024 },
      google: { input: 0.000005, output: 0.000015 },
    };
    this.usage = new Map();
    this.agentCosts = new Map();
  }

  /**
   * Track token usage
   */
  trackUsage(provider, agent, inputTokens, outputTokens) {
    const rate = this.rates[provider] || this.rates.openai;
    const cost = inputTokens * rate.input + outputTokens * rate.output;

    // Track total usage
    const current = this.usage.get(provider) || { input: 0, output: 0, cost: 0 };
    this.usage.set(provider, {
      input: current.input + inputTokens,
      output: current.output + outputTokens,
      cost: current.cost + cost,
    });

    // Track per-agent cost
    const agentCurrent = this.agentCosts.get(agent) || 0;
    this.agentCosts.set(agent, agentCurrent + cost);

    return cost;
  }

  /**
   * Get total cost
   */
  getTotalCost() {
    let total = 0;
    for (const { cost } of this.usage.values()) {
      total += cost;
    }
    return total;
  }

  /**
   * Get cost breakdown by agent
   */
  getAgentCosts() {
    return Array.from(this.agentCosts.entries()).map(([agent, cost]) => ({
      agent,
      cost: this.formatCost(cost),
      costRaw: cost,
    }));
  }

  /**
   * Get cost breakdown by provider
   */
  getProviderCosts() {
    return Array.from(this.usage.entries()).map(([provider, data]) => ({
      provider,
      ...data,
      costFormatted: this.formatCost(data.cost),
    }));
  }

  /**
   * Format cost as currency
   */
  formatCost(cost) {
    return `$${cost.toFixed(4)}`;
  }

  /**
   * Generate cost report
   */
  generateReport() {
    const total = this.getTotalCost();
    const byAgent = this.getAgentCosts();
    const byProvider = this.getProviderCosts();

    return {
      total: this.formatCost(total),
      totalRaw: total,
      byAgent,
      byProvider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset tracking
   */
  reset() {
    this.usage.clear();
    this.agentCosts.clear();
  }
}

/**
 * Progress Reporter
 * Report progress per agent and overall
 */
export class ProgressReporter {
  constructor(options = {}) {
    this.callbacks = [];
    this.agentProgress = new Map();
    this.overallProgress = {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      currentStep: null,
    };
  }

  /**
   * Register progress callback
   */
  onProgress(callback) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Report progress
   */
  reportProgress(data) {
    this.callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  /**
   * Update agent progress
   */
  updateAgentProgress(agent, progress) {
    this.agentProgress.set(agent, {
      ...progress,
      updatedAt: Date.now(),
    });

    this.reportProgress({
      type: 'agent',
      agent,
      ...progress,
    });
  }

  /**
   * Update overall progress
   */
  updateOverallProgress(progress) {
    this.overallProgress = {
      ...this.overallProgress,
      ...progress,
      updatedAt: Date.now(),
    };

    this.reportProgress({
      type: 'overall',
      ...this.overallProgress,
    });
  }

  /**
   * Get agent progress
   */
  getAgentProgress(agent) {
    return this.agentProgress.get(agent);
  }

  /**
   * Get all agent progress
   */
  getAllAgentProgress() {
    return Array.from(this.agentProgress.entries()).map(([agent, progress]) => ({
      agent,
      ...progress,
    }));
  }

  /**
   * Get overall progress
   */
  getOverallProgress() {
    return this.overallProgress;
  }

  /**
   * Mark step complete
   */
  stepComplete(agent, success = true) {
    this.overallProgress.completedSteps++;
    if (!success) {
      this.overallProgress.failedSteps++;
    }

    this.reportProgress({
      type: 'step_complete',
      agent,
      success,
      progress: this.overallProgress,
    });
  }

  /**
   * Mark swarm complete
   */
  swarmComplete(success = true) {
    this.reportProgress({
      type: 'complete',
      success,
      finalProgress: this.overallProgress,
    });
  }
}

// Export all classes
