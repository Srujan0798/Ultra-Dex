import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export async function loadState() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), '.ultra/state.json'), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // console.error(chalk.red('Failed to load .ultra/state.json. Is the project initialized?'));
    return null;
  }
}

export async function saveState(state) {
  try {
    await fs.mkdir(path.resolve(process.cwd(), '.ultra'), { recursive: true });
    await fs.writeFile(
      path.resolve(process.cwd(), '.ultra/state.json'), 
      JSON.stringify(state, null, 2)
    );
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to save state:'), error);
    return false;
  }
}

export async function parsePlanFromMarkdown() {
  try {
    const content = await fs.readFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), 'utf8');
    const phases = [];
    let currentPhase = null;
    
    const lines = content.split('\n');
    for (const line of lines) {
      // Match Section Header: ## 1. Name or ## Name
      const sectionMatch = line.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        if (currentPhase) phases.push(currentPhase);
        currentPhase = {
          name: sectionMatch[1].trim(),
          status: 'pending',
          steps: []
        };
        continue;
      }
      
      // Match Task: - [ ] Task Name
      const taskMatch = line.match(/^-\s+\[(x| )\]\s+(.+)$/);
      if (taskMatch && currentPhase) {
        const isCompleted = taskMatch[1] === 'x' || taskMatch[1] === 'X';
        currentPhase.steps.push({
          task: taskMatch[2].trim(),
          status: isCompleted ? 'completed' : 'pending'
        });
      }
    }
    if (currentPhase) phases.push(currentPhase);
    
    // Determine phase status based on steps
    phases.forEach(phase => {
        if (phase.steps.length === 0) return;
        const allCompleted = phase.steps.every(s => s.status === 'completed');
        const someCompleted = phase.steps.some(s => s.status === 'completed');
        if (allCompleted) phase.status = 'completed';
        else if (someCompleted) phase.status = 'in_progress';
    });

    return phases;
  } catch (e) {
    return [];
  }
}

export function estimateDuration(baseHours, factors = {}) {
    let multiplier = 1.0;
    if (factors.testing !== false) multiplier += 0.25;
    if (factors.codeReview !== false) multiplier += 0.10;
    if (factors.contextSwitching) multiplier += 0.15;
    if (factors.newTech) multiplier += 0.30;
    if (factors.integration) multiplier += 0.20;
    if (factors.uncertainty) multiplier += 0.20;
    
    return baseHours * multiplier;
}

export function generateGantt(phases) {
    console.log(chalk.bold.cyan('\n📊 Project Timeline (Gantt View)\n'));
    
    const width = 60;
    console.log(chalk.gray('Phase' + ' '.repeat(25) + 'Progress' + ' '.repeat(width - 8) + 'Status'));
    console.log(chalk.gray('─'.repeat(30 + width + 10)));

    phases.forEach((phase, index) => {
        const completedSteps = phase.steps.filter(s => s.status === 'completed').length;
        const totalSteps = phase.steps.length;
        const percentage = totalSteps > 0 ? (completedSteps / totalSteps) : 0;
        
        const barWidth = Math.floor(percentage * width);
        const bar = '█'.repeat(barWidth) + '░'.repeat(width - barWidth);
        
        const color = percentage === 1 ? chalk.green : percentage > 0 ? chalk.yellow : chalk.gray;
        const status = percentage === 1 ? 'DONE' : percentage > 0 ? 'WIP ' : 'TODO';
        
        // Truncate name
        let name = phase.name.length > 28 ? phase.name.substring(0, 25) + '...' : phase.name;
        name = name.padEnd(30);

        console.log(`${name} ${color(bar)} ${color(status)} (${Math.round(percentage * 100)}%)`);
    });
    console.log('');
}

export function generateTimeline(phases) {
    console.log(chalk.bold.cyan('\n📅 Milestone Timeline\n'));
    
    phases.forEach((phase, index) => {
        const completedSteps = phase.steps.filter(s => s.status === 'completed').length;
        const totalSteps = phase.steps.length;
        
        if (totalSteps === 0) return;

        const isLast = index === phases.length - 1;
        const symbol = phase.status === 'completed' ? '🟢' : phase.status === 'in_progress' ? '🟡' : '⚪';
        const connector = isLast ? '   ' : ' │ ';
        
        console.log(`${symbol} ${chalk.bold(phase.name)}`);
        console.log(`${connector} ${chalk.gray(`${completedSteps}/${totalSteps} tasks completed`)}`);
        
        if (phase.status === 'in_progress') {
            const nextTask = phase.steps.find(s => s.status === 'pending');
            if (nextTask) {
                console.log(`${connector} 👉 Next: ${chalk.cyan(nextTask.task)}`);
            }
        }
        
        // Show milestones in this phase
        phase.steps.forEach(s => {
            if (s.isMilestone) {
                const icon = s.status === 'completed' ? '🚩' : '🏁';
                console.log(`${connector} ${icon} ${chalk.magenta('MILESTONE')}: ${s.task}`);
            }
        });

        console.log(connector);
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
    phases.forEach(phase => {
        const statusIcon = phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳';
        md += `### ${statusIcon} ${phase.name}\n\n`;
        
        if (phase.steps && phase.steps.length > 0) {
        phase.steps.forEach(step => {
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
    state.agents.registry.forEach(agent => {
      const active = state.agents.active?.includes(agent) ? '(Active)' : '';
      md += `- ${agent} ${active}\n`;
    });
  }

  md += `\n---\n`;
  md += `*This file is strictly read-only. Edit .ultra/state.json to update.*
`;

  return md;
}

export function registerPlanCommand(program) {
  program
    .command('plan')
    .description('Manage project plan (Gantt, Timeline, Generate)')
    .option('--gantt', 'Show Gantt chart')
    .option('--timeline', 'Show milestone timeline')
    .option('--generate', 'Regenerate IMPLEMENTATION-PLAN.md from state')
    .option('--estimate', 'Show realistic effort estimates based on methodology')
    .option('--milestone <stepId>', 'Mark a specific step as a milestone')
    .action(async (options) => {
      let state = await loadState();
      
      // If state doesn't have phases, try to parse from Markdown
      if (!state || !state.phases) {
          const phases = await parsePlanFromMarkdown();
          if (phases.length > 0) {
              if (!state) state = { project: { name: 'Current Project' } };
              state.phases = phases;
          }
      }

      if (options.milestone) {
          if (!state || !state.phases) {
              console.log(chalk.red('No active plan found.'));
              return;
          }
          
          let found = false;
          state.phases.forEach(p => {
              p.steps.forEach(s => {
                  if (s.id === options.milestone || s.task.includes(options.milestone)) {
                      s.isMilestone = true;
                      found = true;
                  }
              });
          });

          if (found) {
              await saveState(state);
              console.log(chalk.green(`✅ Step "${options.milestone}" marked as milestone.`));
          } else {
              console.log(chalk.yellow(`Step "${options.milestone}" not found in any phase.`));
          }
          return;
      }

      if (options.estimate) {
          if (!state || !state.phases) {
              console.log(chalk.yellow('No phases found.'));
              return;
          }
          console.log(chalk.bold.cyan('\n🕒 Effort Estimates (Ultra-Dex Methodology)\n'));
          let totalBase = 0;
          let totalActual = 0;

          state.phases.forEach(phase => {
              const baseHours = phase.steps.length * 6; // Assume 6h average per atomic task
              const actualHours = estimateDuration(baseHours, { 
                  uncertainty: phase.status === 'pending',
                  newTech: phase.name.toLowerCase().includes('ai') || phase.name.toLowerCase().includes('blockchain')
              });
              
              totalBase += baseHours;
              totalActual += actualHours;

              console.log(`  ${chalk.bold(phase.name.padEnd(30))} ${chalk.gray(baseHours + 'h base')} → ${chalk.yellow(actualHours.toFixed(1) + 'h actual')}`);
          });

          console.log(chalk.gray('  ' + '─'.repeat(50)));
          console.log(`  ${chalk.bold('TOTAL PROJECT EFFORT'.padEnd(30))} ${chalk.gray(totalBase + 'h base')} → ${chalk.green(totalActual.toFixed(1) + 'h actual')}`);
          console.log(chalk.gray(`  (Actual Hours = Base × (1 + sum of methodology factors))\n`));
          return;
      }

      if (options.gantt) {
        if (state && state.phases) {
            generateGantt(state.phases);
        } else {
            console.log(chalk.yellow('No phases found. Create IMPLEMENTATION-PLAN.md first.'));
        }
        return;
      }

      if (options.timeline) {
        if (state && state.phases) {
            generateTimeline(state.phases);
        } else {
            console.log(chalk.yellow('No phases found. Create IMPLEMENTATION-PLAN.md first.'));
        }
        return;
      }

      if (options.generate) {
        if (!state) return;
        console.log(chalk.blue(`Generating plan for ${state.project.name}...`));
        const markdown = generateMarkdown(state);
        await fs.writeFile(path.resolve(process.cwd(), 'IMPLEMENTATION-PLAN.md'), markdown);
        console.log(chalk.green(`✅ IMPLEMENTATION-PLAN.md generated successfully.`));
        return;
      }

      // Default view
      if (state && state.phases) {
          generateGantt(state.phases);
      } else {
          // If no state and no file, show help
          console.log(chalk.cyan('Ultra-Dex Plan Manager'));
          console.log('Use --gantt or --timeline to visualize.');
      }
    });
}