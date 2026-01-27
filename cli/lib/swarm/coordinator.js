import chalk from 'chalk';
import ora from 'spinner';
import { runAgentLoop } from '../commands/run.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { loadState } from '../commands/plan.js';
import fs from 'fs/promises';

export class SwarmCoordinator {
  constructor(provider, context) {
    this.provider = provider;
    this.context = context;
    this.history = [];
  }

  async plan(feature) {
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
      spinner.succeed(`Plan generated: ${plan.tasks.length} tasks identified.`);
      return plan.tasks;
    } catch (error) {
      spinner.fail('Planning failed.');
      console.error(chalk.red(error.message));
      return null;
    }
  }

  async execute(tasks) {
    console.log(chalk.bold('\n🐝 Swarm Execution Started\n'));

    for (const task of tasks) {
      console.log(chalk.bold.cyan(`\n🔹 Step ${task.id}: [${task.agent.toUpperCase()}] ${task.task}`));
      
      // Inject previous history into context
      const currentContext = {
        ...this.context,
        history: this.history.join('\n\n---\n\n')
      };

      try {
        const output = await runAgentLoop(task.agent, task.task, this.provider, currentContext);
        
        // Save to history
        this.history.push(`## Task ${task.id} (${task.agent})\n**Goal:** ${task.task}\n\n**Output:**\n${output}`);
        
        // Save artifact
        const filename = `swarm-task-${task.id}-${task.agent}.md`;
        await fs.writeFile(filename, output);
        console.log(chalk.green(`   ✓ Output saved to ${filename}`));

      } catch (error) {
        console.log(chalk.red(`   ❌ Task failed: ${error.message}`));
        // Decide whether to continue or stop
        // For now, we continue
      }
    }

    console.log(chalk.bold.green('\n✅ Swarm Mission Complete'));
  }
}
