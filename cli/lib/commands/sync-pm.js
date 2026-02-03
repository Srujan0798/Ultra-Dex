/**
 * Project Management Integrations for Ultra-Dex
 * Sync tasks with Linear, GitHub Issues, Jira, Notion
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import fs from 'fs/promises';

const program = new Command();

program
  .name('ultra-dex sync')
  .description('Sync implementation plan with project management tools')
  .version('1.0.0');

// Parse implementation plan and extract tasks
async function parseImplementationPlan(planPath) {
  try {
    const content = await fs.readFile(planPath, 'utf8');
    const tasks = [];
    
    // Extract tasks from markdown tables (simplified parser)
    const lines = content.split('\n');
    let currentPhase = '';
    
    for (const line of lines) {
      // Detect phase headers
      if (line.startsWith('## Sprint ') || line.startsWith('### Phase ')) {
        currentPhase = line.replace(/^#+\s+/, '').trim();
      }
      
      // Parse task rows from tables
      if (line.startsWith('|') && line.includes('☐')) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const taskText = parts[1].replace('☐', '').trim();
          const priority = parts[2] || 'P1';
          const status = parts[3] || 'todo';
          
          if (taskText) {
            tasks.push({
              title: taskText,
              phase: currentPhase,
              priority: priority,
              status: status === 'done' || status === 'completed' ? 'completed' : 'todo',
              source: 'implementation-plan'
            });
          }
        }
      }
      
      // Parse checklist items
      if (line.match(/^\s*- \[([ x])\]\s+(.+)$/)) {
        const match = line.match(/^\s*- \[([ x])\]\s+(.+)$/);
        if (match) {
          tasks.push({
            title: match[2].trim(),
            phase: currentPhase,
            priority: 'P2',
            status: match[1] === 'x' ? 'completed' : 'todo',
            source: 'checklist'
          });
        }
      }
    }
    
    return tasks;
  } catch (error) {
    console.error(chalk.red('Error parsing plan:'), error.message);
    return [];
  }
}

// Linear integration
async function syncWithLinear(tasks, options) {
  console.log(chalk.cyan('\n📋 Syncing with Linear...\n'));
  
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.log(chalk.yellow('⚠️  LINEAR_API_KEY not found in environment'));
    console.log(chalk.gray('   Set it with: export LINEAR_API_KEY=your_key\n'));
    return;
  }
  
  const teamId = options.teamId || process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    console.log(chalk.yellow('⚠️  Linear team ID required'));
    console.log(chalk.gray('   Use --team-id or set LINEAR_TEAM_ID\n'));
    return;
  }
  
  console.log(chalk.gray(`Found ${tasks.length} tasks to sync`));
  
  for (const task of tasks) {
    try {
      const query = `
        mutation IssueCreate {
          issueCreate(
            input: {
              title: "${task.title.replace(/"/g, '\\"')}"
              teamId: "${teamId}"
              priority: ${task.priority === 'P0' ? 1 : task.priority === 'P1' ? 2 : 3}
              stateId: ${task.status === 'completed' ? '"Done"' : '"Todo"'}
            }
          ) {
            success
            issue {
              id
              identifier
              title
            }
          }
        }
      `;
      
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (data.data?.issueCreate?.success) {
        const issue = data.data.issueCreate.issue;
        console.log(chalk.green(`✅ Created: ${issue.identifier} - ${issue.title}`));
      } else {
        console.log(chalk.red(`❌ Failed: ${task.title}`));
        if (data.errors) {
          console.log(chalk.gray(`   ${data.errors[0].message}`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error creating issue: ${task.title}`));
      console.log(chalk.gray(`   ${error.message}`));
    }
  }
  
  console.log(chalk.green(`\n✅ Synced ${tasks.length} tasks to Linear\n`));
}

// GitHub Issues integration
async function syncWithGitHub(tasks, options) {
  console.log(chalk.cyan('\n🐙 Syncing with GitHub Issues...\n'));
  
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log(chalk.yellow('⚠️  GITHUB_TOKEN not found in environment'));
    console.log(chalk.gray('   Set it with: export GITHUB_TOKEN=your_token\n'));
    return;
  }
  
  // Parse owner/repo from git remote or options
  let owner, repo;
  
  if (options.repo) {
    [owner, repo] = options.repo.split('/');
  } else {
    try {
      const { execSync } = await import('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)\.git$/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    } catch (e) {
      console.log(chalk.yellow('⚠️  Could not detect GitHub repo'));
      console.log(chalk.gray('   Use --repo owner/name\n'));
      return;
    }
  }
  
  if (!owner || !repo) {
    console.log(chalk.yellow('⚠️  GitHub owner/repo required'));
    console.log(chalk.gray('   Use --repo owner/name\n'));
    return;
  }
  
  console.log(chalk.gray(`Target: ${owner}/${repo}`));
  console.log(chalk.gray(`Found ${tasks.length} tasks to sync\n`));
  
  const labels = options.labels ? options.labels.split(',') : ['ultra-dex', 'enhancement'];
  
  for (const task of tasks) {
    try {
      // Map priority to GitHub labels
      const priorityLabel = task.priority === 'P0' ? 'priority-critical' : 
                           task.priority === 'P1' ? 'priority-high' : 'priority-medium';
      const allLabels = [...labels, priorityLabel];
      
      const body = `
## Task
${task.title}

## Phase
${task.phase}

## Source
Generated from Ultra-Dex implementation plan

## Acceptance Criteria
- [ ] Task completed according to 21-step verification
- [ ] Tests written and passing
- [ ] Documentation updated
`;
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: task.title,
          body: body,
          labels: allLabels
        })
      });
      
      if (response.ok) {
        const issue = await response.json();
        console.log(chalk.green(`✅ Created: #${issue.number} - ${issue.title}`));
      } else {
        const error = await response.text();
        console.log(chalk.red(`❌ Failed: ${task.title}`));
        console.log(chalk.gray(`   ${error}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error creating issue: ${task.title}`));
      console.log(chalk.gray(`   ${error.message}`));
    }
  }
  
  console.log(chalk.green(`\n✅ Synced ${tasks.length} issues to GitHub\n`));
}

// Export to JSON for other tools
async function exportToJson(tasks, outputPath) {
  const data = {
    exported_at: new Date().toISOString(),
    total_tasks: tasks.length,
    tasks: tasks
  };
  
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(chalk.green(`\n✅ Exported ${tasks.length} tasks to ${outputPath}\n`));
}

// Main sync command
program
  .argument('[plan]', 'Path to implementation plan', './IMPLEMENTATION-PLAN.md')
  .option('--linear', 'Sync to Linear')
  .option('--github', 'Sync to GitHub Issues')
  .option('--json <file>', 'Export to JSON file')
  .option('--team-id <id>', 'Linear team ID')
  .option('--repo <owner/name>', 'GitHub owner/repo')
  .option('--labels <labels>', 'Comma-separated labels for GitHub', 'ultra-dex,enhancement')
  .option('--dry-run', 'Show what would be synced without creating')
  .action(async (planPath, options) => {
    try {
      console.log(chalk.cyan.bold('\n🔄 Ultra-Dex Project Management Sync\n'));
      
      // Parse implementation plan
      console.log(chalk.blue(`📖 Parsing: ${planPath}`));
      const tasks = await parseImplementationPlan(planPath);
      
      if (tasks.length === 0) {
        console.log(chalk.yellow('\n⚠️  No tasks found in implementation plan\n'));
        return;
      }
      
      console.log(chalk.green(`✅ Found ${tasks.length} tasks\n`));
      
      // Show preview table
      const table = new Table({
        head: ['#', 'Phase', 'Task', 'Priority', 'Status'],
        colWidths: [5, 25, 40, 10, 12],
        style: { head: ['cyan'] }
      });
      
      tasks.slice(0, 20).forEach((task, i) => {
        table.push([
          i + 1,
          task.phase.substring(0, 23),
          task.title.substring(0, 38),
          task.priority,
          task.status
        ]);
      });
      
      if (tasks.length > 20) {
        table.push(['...', '...', `+ ${tasks.length - 20} more tasks`, '', '']);
      }
      
      console.log(table.toString());
      console.log();
      
      // Dry run mode
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 Dry run mode - no issues created\n'));
        return;
      }
      
      // Sync based on options
      if (options.linear) {
        await syncWithLinear(tasks, options);
      }
      
      if (options.github) {
        await syncWithGitHub(tasks, options);
      }
      
      if (options.json) {
        await exportToJson(tasks, options.json);
      }
      
      if (!options.linear && !options.github && !options.json) {
        console.log(chalk.yellow('ℹ️  No sync target specified'));
        console.log(chalk.gray('   Use --linear, --github, or --json'));
        console.log();
        console.log(chalk.gray('Examples:'));
        console.log(chalk.gray('  ultra-dex sync --linear --team-id TEAM_ID'));
        console.log(chalk.gray('  ultra-dex sync --github --repo owner/repo'));
        console.log(chalk.gray('  ultra-dex sync --json tasks.json'));
        console.log();
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List tasks from implementation plan')
  .argument('[plan]', 'Path to implementation plan', './IMPLEMENTATION-PLAN.md')
  .option('--status <status>', 'Filter by status: todo, completed, all', 'all')
  .option('--phase <phase>', 'Filter by phase')
  .action(async (planPath, options) => {
    try {
      const tasks = await parseImplementationPlan(planPath);
      
      let filtered = tasks;
      if (options.status !== 'all') {
        filtered = filtered.filter(t => t.status === options.status);
      }
      if (options.phase) {
        filtered = filtered.filter(t => t.phase.toLowerCase().includes(options.phase.toLowerCase()));
      }
      
      console.log(chalk.cyan(`\n📋 Tasks (${filtered.length}/${tasks.length}):\n`));
      
      filtered.forEach((task, _i) => {
        const icon = task.status === 'completed' ? '✅' : '☐';
        const color = task.status === 'completed' ? chalk.gray : chalk.white;
        console.log(color(`${icon} [${task.priority}] ${task.title}`));
        console.log(chalk.gray(`   Phase: ${task.phase}`));
      });
      
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  });

program.parse();
