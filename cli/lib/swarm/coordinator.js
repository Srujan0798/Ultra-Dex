// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from 'ora';
import { runAgentLoop } from '../commands/run.js';
import fs from 'fs/promises';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

export class SwarmCoordinator {
  constructor(provider, context) {
    this.provider = provider;
    this.context = context;
    this.history = [];
  }

  async plan(feature) {
    if (!feature || typeof feature !== 'string') {
      throw new ValidationError('Feature description is required for planning');
    }

    const spinner = ora('🧠 Hive Mind: Planning feature implementation...').start();

    // System prompt to force JSON output for the plan
    const plannerPrompt = `
You are the Hive Mind Planner.
Your goal: Break down the feature "${feature}" into sequential atomic tasks for other agents.

Available Agents:
- @Backend (API, logic)
- @Frontend (UI, React)
- @Database (Schema, migrations)
- @Auth (Authentication)
- @Testing (Tests)

Output STRICT JSON format only:
{
  "tasks": [
    {
      "id": 1,
      "agent": "backend",
      "task": "Create API endpoint for...",
      "context": "Needs to handle..."
    },
    ...
  ]
}
`;

    try {
      const result = await this.provider.generate(plannerPrompt, `Feature: ${feature}`);

      // Attempt to parse JSON (handling potential markdown code blocks)
      let jsonStr = result.content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const plan = JSON.parse(jsonStr);

      if (!plan.tasks || !Array.isArray(plan.tasks)) {
        throw new AppError('Invalid plan format: missing tasks array');
      }

      spinner.succeed(`Plan generated: ${plan.tasks.length} tasks identified.`);
      return plan.tasks;
    } catch (error) {
      spinner.fail('Planning failed.');
      logger.error('Swarm planning failed', error);
      throw new AppError(`Failed to generate swarm plan: ${error.message}`, { cause: error });
    }
  }

  async execute(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new ValidationError('A non-empty list of tasks is required for execution');
    }

    logger.header('Swarm Execution Started');

    for (const task of tasks) {
      logger.info(`Step ${task.id}: [${task.agent.toUpperCase()}] ${task.task}`);

      // Inject previous history into context
      const currentContext = {
        ...this.context,
        history: this.history.join('\n\n---\n\n'),
      };

      try {
        const output = await runAgentLoop(task.agent, task.task, this.provider, currentContext);

        // Save to history
        this.history.push(
          `## Task ${task.id} (${task.agent})\n**Goal:** ${task.task}\n\n**Output:**\n${output}`
        );

        // Save artifact
        const filename = `swarm-task-${task.id}-${task.agent}.md`;
        await fs.writeFile(filename, output);
        logger.success(`Output saved to ${filename}`);
      } catch (error) {
        logger.error(`Task failed: ${task.task}`, error);
        // Decide whether to continue or stop
        // For now, we continue but log it
      }
    }

    logger.success('Swarm Mission Complete');
  }
}
