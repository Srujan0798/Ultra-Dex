// Copyright (c) 2026 Ultra-Dex

/**
 * Full automation pipeline for auto-implement
 */

import { CheckpointManager } from './checkpoints.js';
import { updateStateFile, loadState } from '../commands/state.js';
import { projectGraph } from '../mcp/graph.js';
import { runAgentLoop } from '../commands/run.js';
import { verifyCommand } from '../commands/verify.js';
import fs from 'fs/promises';

export class AutomationPipeline {
  constructor({ feature, provider, options = {} }) {
    this.feature = feature;
    this.provider = provider;
    this.options = options;
    this.checkpoints = new CheckpointManager();
  }

  async maybeStop(stage, payload = {}) {
    if (this.options.noStop || this.options.approve) return true;
    const cp = await this.checkpoints.saveCheckpoint(stage, payload);
    throw new Error(`Checkpoint "${stage}" created: ${cp.id}. Resume with --approve ${cp.id}`);
  }

  async run() {
    // Stage 1: Analyze
    await projectGraph.scan();
    const graphSummary = projectGraph.getSummary();

    const state = await loadState();
    const planMarkdown = state
      ? JSON.stringify(state)
      : await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => '');
    const contextMarkdown = await fs.readFile('CONTEXT.md', 'utf8').catch(() => '');

    const projectContext = {
      state,
      plan: planMarkdown,
      context: contextMarkdown,
      graph: graphSummary,
    };

    // Stage 2: Plan
    const plan = await runAgentLoop(
      'planner',
      `Break down this feature into atomic tasks: ${this.feature}.`,
      this.provider,
      projectContext
    );
    await this.maybeStop('plan', { plan });

    // Stage 3: Implement
    const tasks = plan
      .split('\n')
      .filter((line) => line.match(/^[*-]\s+/) || line.match(/^\d+\.\s+/));
    const taskList = tasks.length ? tasks : [plan];
    for (const task of taskList) {
      await runAgentLoop(
        'orchestrator',
        `Implement this task: ${task}\n\nFeature: ${this.feature}\nPlan:\n${plan}`,
        this.provider,
        projectContext
      );
      await updateStateFile();
    }
    await this.maybeStop('implementation', { tasks: taskList.length });

    // Stage 4: Verify
    if (!this.options.noVerify) {
      await verifyCommand(this.feature, { provider: this.options.provider });
    }
    await this.maybeStop('verification');

    await updateStateFile();
    return { plan, tasks: taskList.length };
  }
}

export default AutomationPipeline;
