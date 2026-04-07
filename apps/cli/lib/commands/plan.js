// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { marked } from 'marked';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

/**
 * Load project state from .ultra/state.json
 */
export async function loadState() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(content);
  } catch (_error) {
    return null; // Silent return for state existence check
  }
}

/**
 * Save project state to .ultra/state.json
 */
export async function saveState(state) {
  try {
    await fs.mkdir(path.resolve(process.cwd(), '.ultra'), { recursive: true });
    await fs.writeFile(
      path.resolve(process.cwd(), '.ultra/state.json'),
      JSON.stringify(state, null, 2)
    );
    return true;
  } catch (error) {
    throw new AppError('Failed to save project state', { cause: error });
  }
}

/**
 * Parse IMPLEMENTATION-PLAN.md into structured data
 */
export async function parsePlanFromMarkdown() {
  try {
    const content = await fs.readFile(
      path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'),
      'utf8'
    );
    const phases = [];
    let currentPhase = null;

    const tokens = marked.lexer(content);

    const pushPhase = () => {
      if (currentPhase) phases.push(currentPhase);
    };

    const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

    const tokensToText = (tokenList = []) => {
      const parts = [];
      for (const token of tokenList) {
        if (token.type === 'text' && token.text) {
          parts.push(token.text);
        } else if (token.type === 'codespan' && token.text) {
          parts.push(token.text);
        } else if ((token.type === 'strong' || token.type === 'em') && token.text) {
          parts.push(token.text);
        } else if (token.tokens) {
          parts.push(tokensToText(token.tokens));
        }
      }
      return normalizeText(parts.join(' '));
    };

    const addTask = (item) => {
      if (!currentPhase) return;
      const rawText = item.text || tokensToText(item.tokens) || '';
      const taskText = normalizeText(rawText);
      if (!taskText) return;
      const isCompleted = item.checked === true;
      currentPhase.steps.push({
        task: taskText,
        status: isCompleted ? 'completed' : 'pending',
      });
    };

    const extractTasksFromList = (listToken) => {
      if (!currentPhase || !listToken?.items) return;
      for (const item of listToken.items) {
        if (item.task) {
          addTask(item);
        }
        if (item.tokens) {
          for (const token of item.tokens) {
            if (token.type === 'list') {
              extractTasksFromList(token);
            }
          }
        }
      }
    };

    for (const token of tokens) {
      if (token.type === 'heading' && token.depth === 2) {
        pushPhase();
        currentPhase = { name: normalizeText(token.text || ''), status: 'pending', steps: [] };
        continue;
      }

      if (token.type === 'list') {
        extractTasksFromList(token);
      }
    }
    if (currentPhase) phases.push(currentPhase);

    phases.forEach((phase) => {
      if (phase.steps.length === 0) return;
      const allCompleted = phase.steps.every((s) => s.status === 'completed');
      const someCompleted = phase.steps.some((s) => s.status === 'completed');
      if (allCompleted) phase.status = 'completed';
      else if (someCompleted) phase.status = 'in_progress';
    });

    return phases;
  } catch (_e) {
    return [];
  }
}

/**
 * Calculate effort estimates
 */
export function estimateDuration(baseHours, factors = {}) {
  let multiplier = 1.0;
  if (factors.testing !== false) multiplier += 0.25;
  if (factors.codeReview !== false) multiplier += 0.1;
  if (factors.contextSwitching) multiplier += 0.15;
  if (factors.newTech) multiplier += 0.3;
  if (factors.integration) multiplier += 0.2;
  if (factors.uncertainty) multiplier += 0.2;

  return baseHours * multiplier;
}

/**
 * Render Gantt chart to console
 */
export function generateGantt(phases) {
  printInfo(chalk.bold.cyan('\n📊 Project Timeline (Gantt View)\n'));

  const width = 60;
  printInfo(chalk.gray('Phase' + ' '.repeat(25) + 'Progress' + ' '.repeat(width - 8) + 'Status'));
  printInfo(chalk.gray('─'.repeat(30 + width + 10)));

  phases.forEach((phase) => {
    const completedSteps = phase.steps.filter((s) => s.status === 'completed').length;
    const totalSteps = phase.steps.length;
    const percentage = totalSteps > 0 ? completedSteps / totalSteps : 0;

    const barWidth = Math.floor(percentage * width);
    let bar = '█'.repeat(barWidth) + '░'.repeat(width - barWidth);

    // Mark milestones in the bar if any
    phase.steps.forEach((step, idx) => {
      if (step.isMilestone) {
        const pos = Math.floor((idx / totalSteps) * width);
        const char = step.status === 'completed' ? '⭐' : '☆';
        // Replace characters in the bar - handle emoji width (2 chars usually)
        // This is a bit tricky with ASCII bars, let's just append an icon instead or use a different symbol
      }
    });

    const color = percentage === 1 ? chalk.green : percentage > 0 ? chalk.yellow : chalk.gray;
    const status = percentage === 1 ? 'DONE' : percentage > 0 ? 'WIP ' : 'TODO';

    let name = phase.name.length > 28 ? phase.name.substring(0, 25) + '...' : phase.name;
    name = name.padEnd(30);

    const hasMilestone = phase.steps.some((s) => s.isMilestone);
    const milestoneIcon = hasMilestone ? chalk.magenta(' ✦') : '';

    printInfo(
      `${name}${milestoneIcon.padEnd(hasMilestone ? 3 : 0)} ${color(bar)} ${color(status)} (${Math.round(percentage * 100)}%)`
    );
  });
  printInfo('');
}

/**
 * Render milestone timeline to console
 */
export function generateTimeline(phases) {
  printInfo(chalk.bold.cyan('\n📅 Milestone Timeline\n'));

  phases.forEach((phase, index) => {
    const completedSteps = phase.steps.filter((s) => s.status === 'completed').length;
    const totalSteps = phase.steps.length;
    if (totalSteps === 0) return;

    const isLast = index === phases.length - 1;
    const symbol =
      phase.status === 'completed' ? '🟢' : phase.status === 'in_progress' ? '🟡' : '⚪';
    const connector = isLast ? '   ' : ' │ ';

    printInfo(`${symbol} ${chalk.bold(phase.name)}`);

    // List specific milestones in this phase
    phase.steps.forEach((step) => {
      if (step.isMilestone) {
        const mSymbol = step.status === 'completed' ? chalk.magenta('✦') : chalk.gray('✧');
        printInfo(`${connector}   ${mSymbol} ${chalk.bold(step.task)}`);
      }
    });

    printInfo(`${connector} ${chalk.gray(`${completedSteps}/${totalSteps} tasks completed`)}`);

    if (phase.status === 'in_progress') {
      const nextTask = phase.steps.find((s) => s.status === 'pending');
      if (nextTask) {
        printInfo(`${connector} 👉 Next: ${chalk.cyan(nextTask.task)}`);
      }
    }
    printInfo(connector);
  });
}

export function generateMarkdown(state) {
  const { project, phases } = state;
  let md = `# ${project?.name || 'Project'} - Implementation Plan\n\n`;
  md += `> **Generated by Ultra-Dex Core**\n`;
  md += `> Version: ${project?.version || '1.0.0'}\n`;
  md += `> Mode: ${project?.mode || 'ULTRA_MODE'}\n\n`;

  md += `## 🚀 Execution Phases\n\n`;

  if (phases) {
    phases.forEach((phase) => {
      const statusIcon =
        phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
      md += `### ${statusIcon} ${phase.name}\n\n`;

      if (phase.steps && phase.steps.length > 0) {
        phase.steps.forEach((step) => {
          const stepIcon = step.status === 'completed' ? '- [x]' : '- [ ]';
          const milestoneMarker = step.isMilestone ? ' 🚩' : '';
          md += `${stepIcon} **${step.id || ''}**: ${step.task}${milestoneMarker}\n`;
        });
      } else {
        md += `_No steps defined for this phase._\n`;
      }
      md += `\n`;
    });
  }

  md += `## 🤖 Agent Registry\n\n`;
  if (state.agents && state.agents.registry) {
    state.agents.registry.forEach((agent) => {
      const active = state.agents.active?.includes(agent) ? '(Active)' : '';
      md += `- ${agent} ${active}\n`;
    });
  }

  md += `\n---\n`;
  md += `*This file is strictly read-only. Edit .ultra/state.json to update.*\n`;

  return md;
}

/**
 * Register the plan command with Commander
 */
export function registerPlanCommand(program) {
  program
    .command('plan')
    .description('Manage project plan (Gantt, Timeline, Generate)')
    .option('--gantt', 'Show Gantt chart')
    .option('--timeline', 'Show milestone timeline')
    .option('--milestones', 'List all project milestones')
    .option('--generate', 'Regenerate IMPLEMENTATION-PLAN.md from state')
    .option('--estimate', 'Show realistic effort estimates')
    .option('--milestone <stepId>', 'Mark a specific step as a milestone')
    .action(async (options) => {
      try {
        let state = await loadState();

        if (!state || !state.phases) {
          const phases = await parsePlanFromMarkdown();
          if (phases.length > 0) {
            if (!state) state = { project: { name: 'Current Project' } };
            state.phases = phases;
          }
        }

        if (!state || !state.phases) {
          throw new ValidationError(
            'No project plan found. Initialize your project with "ultra-dex init".'
          );
        }

        if (options.milestone) {
          return await handleMilestone(state, options.milestone);
        }

        if (options.milestones) {
          return displayMilestones(state);
        }

        if (options.estimate) {
          return displayEstimates(state);
        }

        if (options.timeline) {
          return generateTimeline(state.phases);
        }

        if (options.generate) {
          const markdown = generateMarkdown(state);
          await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
          printSuccess('✅ IMPLEMENTATION-PLAN.md generated successfully.');
          return;
        }

        // Default: Show Gantt
        generateGantt(state.phases);
      } catch (error) {
        await handleError(error, { command: 'plan', options });
        process.exit(error.exitCode || 1);
      }
    });
}

function displayMilestones(state) {
  printInfo(chalk.bold.magenta('\n✦ Project Milestones\n'));
  let found = false;
  state.phases.forEach((phase) => {
    const milestones = phase.steps.filter((s) => s.isMilestone);
    if (milestones.length > 0) {
      found = true;
      printInfo(chalk.bold(`  ${phase.name}`));
      milestones.forEach((m) => {
        const icon = m.status === 'completed' ? chalk.green('✅') : chalk.gray('⚪');
        printInfo(`    ${icon} ${m.task}`);
      });
      printInfo('');
    }
  });

  if (!found) {
    printWarning('  No milestones defined. Use --milestone <taskName> to mark one.');
  }
}

async function handleMilestone(state, milestoneId) {
  let found = false;
  state.phases.forEach((p) => {
    p.steps.forEach((s) => {
      if (s.id === milestoneId || s.task.includes(milestoneId)) {
        s.isMilestone = true;
        found = true;
      }
    });
  });

  if (found) {
    await saveState(state);
    printSuccess(`✅ Step "${milestoneId}" marked as milestone.`);
  } else {
    throw new ValidationError(`Step "${milestoneId}" not found in any phase.`);
  }
}

function displayEstimates(state) {
  printInfo(chalk.bold.cyan('\n🕒 Effort Estimates (Ultra-Dex Methodology)\n'));
  let totalBase = 0;
  let totalActual = 0;

  state.phases.forEach((phase) => {
    const baseHours = phase.steps.length * 6;
    const actualHours = estimateDuration(baseHours, {
      uncertainty: phase.status === 'pending',
      newTech: phase.name.toLowerCase().includes('ai'),
    });

    totalBase += baseHours;
    totalActual += actualHours;
    printInfo(
      `  ${chalk.bold(phase.name.padEnd(30))} ${chalk.gray(baseHours + 'h base')} → ${chalk.yellow(actualHours.toFixed(1) + 'h actual')}`
    );
  });

  printInfo(chalk.gray('  ' + '─'.repeat(50)));
  printInfo(
    `  ${chalk.bold('TOTAL PROJECT EFFORT'.padEnd(30))} ${chalk.gray(totalBase + 'h base')} → ${chalk.green(totalActual.toFixed(1) + 'h actual')}\n`
  );
}
