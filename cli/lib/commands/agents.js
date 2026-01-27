import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { ASSETS_ROOT, ROOT_FALLBACK } from '../config/paths.js';
import { githubBlobUrl } from '../config/urls.js';
import { readWithFallback } from '../utils/fallback.js';

export const AGENTS = [
  { name: 'cto', description: 'Architecture & tech decisions', file: '1-leadership/cto.md', tier: 'Leadership' },
  { name: 'planner', description: 'Task breakdown & planning', file: '1-leadership/planner.md', tier: 'Leadership' },
  { name: 'research', description: 'Technology evaluation & comparison', file: '1-leadership/research.md', tier: 'Leadership' },
  { name: 'backend', description: 'API & server logic', file: '2-development/backend.md', tier: 'Development' },
  { name: 'database', description: 'Schema design & queries', file: '2-development/database.md', tier: 'Development' },
  { name: 'frontend', description: 'UI & components', file: '2-development/frontend.md', tier: 'Development' },
  { name: 'auth', description: 'Authentication & authorization', file: '3-security/auth.md', tier: 'Security' },
  { name: 'security', description: 'Security audits & vulnerability fixes', file: '3-security/security.md', tier: 'Security' },
  { name: 'devops', description: 'Deployment & infrastructure', file: '4-devops/devops.md', tier: 'DevOps' },
  { name: 'debugger', description: 'Bug fixing & troubleshooting', file: '5-quality/debugger.md', tier: 'Quality' },
  { name: 'documentation', description: 'Technical writing & docs maintenance', file: '5-quality/documentation.md', tier: 'Quality' },
  { name: 'reviewer', description: 'Code review & quality check', file: '5-quality/reviewer.md', tier: 'Quality' },
  { name: 'testing', description: 'QA & test automation', file: '5-quality/testing.md', tier: 'Quality' },
  { name: 'performance', description: 'Performance optimization', file: '6-specialist/performance.md', tier: 'Specialist' },
  { name: 'refactoring', description: 'Code quality & design patterns', file: '6-specialist/refactoring.md', tier: 'Specialist' },
];

async function readAgentPrompt(agent) {
  const agentPath = path.join(ASSETS_ROOT, 'agents', agent.file);
  const fallbackPath = path.join(ROOT_FALLBACK, 'agents', agent.file);
  return readWithFallback(agentPath, fallbackPath, 'utf-8');
}

export function registerAgentsCommand(program) {
  program
    .command('agents')
    .description('List available AI agent prompts')
    .action(() => {
      console.log(chalk.bold('\n🤖 Ultra-Dex AI Agents (15 Total)\n'));
      console.log(chalk.gray('Organized by tier for production pipeline\n'));

      let currentTier = '';
      AGENTS.forEach((agent) => {
        if (agent.tier !== currentTier) {
          currentTier = agent.tier;
          console.log(chalk.bold(`\n  ${currentTier} Tier:`));
        }
        console.log(chalk.cyan(`    ${agent.name}`) + chalk.gray(` - ${agent.description}`));
      });

      console.log('\n' + chalk.bold('Usage:'));
      console.log(chalk.gray('  ultra-dex agent <name>   Show agent prompt'));
      console.log(chalk.gray('  ultra-dex agent backend  Example: show backend agent'));

      console.log(`\n${chalk.gray(`Agent Index: ${githubBlobUrl('agents/00-AGENT_INDEX.md')}\n`)}`);
    });

  program
    .command('agent <name>')
    .description('Show a specific agent prompt')
    .action(async (name) => {
      const agent = AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());

      if (!agent) {
        console.log(chalk.red(`\n❌ Agent "${name}" not found.\n`));
        console.log(chalk.gray('Available agents:'));
        AGENTS.forEach(a => console.log(chalk.cyan(`  - ${a.name}`)));
        console.log('\n' + chalk.gray('Run "ultra-dex agents" to see all agents.\n'));
        process.exit(1);
      }

      try {
        const content = await readAgentPrompt(agent);
        console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.bold('\n📋 Copy the above prompt and paste into your AI tool.\n'));
      } catch (err) {
        console.log(chalk.bold(`\n🤖 ${agent.name.toUpperCase()} Agent\n`));
        console.log(chalk.gray('View full prompt on GitHub:'));
        console.log(chalk.blue(`  ${githubBlobUrl(`agents/${agent.file}`)}\n`));
      }
    });
}

export function registerPackCommand(program) {
  program
    .command('pack <agent>')
    .description('Package project context + agent prompt for any AI tool')
    .option('-c, --clipboard', 'Copy to clipboard (requires pbcopy/xclip)')
    .action(async (agentName, options) => {
      const agent = AGENTS.find(a => a.name.toLowerCase() === agentName.toLowerCase());
      if (!agent) {
        console.log(chalk.red(`\n❌ Agent "${agentName}" not found.\n`));
        console.log(chalk.gray('Available agents:'));
        AGENTS.forEach(a => console.log(chalk.cyan(`  - ${a.name}`)));
        process.exit(1);
      }

      let output = '';

      try {
        const agentPrompt = await readAgentPrompt(agent);
        output += agentPrompt + '\n\n';
      } catch (err) {
        output += `# ${agent.name.toUpperCase()} Agent\n\nSee: ${githubBlobUrl(`agents/${agent.file}`)}\n\n`;
      }

      output += '---\n\n';

      try {
        const context = await fs.readFile('CONTEXT.md', 'utf-8');
        output += '# PROJECT CONTEXT\n\n' + context + '\n\n';
      } catch (err) {
        output += '# PROJECT CONTEXT\n\n*No CONTEXT.md found. Run `ultra-dex init` first.*\n\n';
      }

      output += '---\n\n';

      try {
        const plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf-8');
        output += '# IMPLEMENTATION PLAN\n\n' + plan + '\n';
      } catch (err) {
        output += '# IMPLEMENTATION PLAN\n\n*No IMPLEMENTATION-PLAN.md found. Run `ultra-dex init` first.*\n';
      }

      console.log(chalk.bold(`\n📦 Packed context for @${agent.name}\n`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(output);
      console.log(chalk.gray('─'.repeat(60)));

      if (options.clipboard) {
        try {
          const { execSync } = await import('child_process');
          const platform = process.platform;
          if (platform === 'darwin') {
            execSync('pbcopy', { input: output });
            console.log(chalk.green('\n✅ Copied to clipboard!\n'));
          } else if (platform === 'linux') {
            execSync('xclip -selection clipboard', { input: output });
            console.log(chalk.green('\n✅ Copied to clipboard!\n'));
          } else {
            console.log(chalk.yellow('\n⚠️  Clipboard not supported on this platform. Copy manually.\n'));
          }
        } catch (err) {
          console.log(chalk.yellow('\n⚠️  Could not copy to clipboard. Copy manually.\n'));
        }
      } else {
        console.log(chalk.cyan('\n💡 Tip: Use --clipboard flag to copy directly\n'));
      }
    });
}
