import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { hasPermission, PERMISSIONS } from '../auth/rbac.js';
import { configManager } from '../utils/config-manager.js';
import { DEFAULT_AGENT_ACCESS } from '../enterprise/agent-access.js';

const TEAM_DIR = '.ultra-dex';
const TEAM_FILE = 'team.json';
const TEAM_PATH = path.resolve(process.cwd(), TEAM_DIR, TEAM_FILE);
const VALID_ROLES = ['admin', 'maintainer', 'member', 'viewer'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

async function loadTeamConfig() {
  try {
    const content = await fs.readFile(TEAM_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function saveTeamConfig(config) {
  const dir = path.resolve(process.cwd(), TEAM_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(TEAM_PATH, JSON.stringify(config, null, 2));
}

function requireTeamConfig(team) {
  if (!team) {
    printError(chalk.red('\n❌ Team not initialized. Run "ultra-dex team init" first.\n'));
    throw new Error('Team not initialized');
  }
}

async function getCurrentRole() {
  const config = await configManager.loadGlobal();
  return config?.user?.role || 'viewer';
}

async function checkPermission(permission) {
  const role = await getCurrentRole();
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: You need permission '${permission}' (Current role: ${role})`);
  }
}

function formatTable(rows) {
  const headers = ['Email', 'Role', 'Added'];
  const widths = headers.map((header, index) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, row[index].length), header.length);
    return Math.max(header.length, maxRow);
  });

  const headerLine = headers
    .map((header, index) => header.padEnd(widths[index]))
    .join(' | ');
  const divider = widths.map((width) => '-'.repeat(width)).join('-|-');

  const body = rows
    .map((row) => row.map((cell, index) => cell.padEnd(widths[index])).join(' | '))
    .join('\n');

  return `${headerLine}\n${divider}\n${body}`;
}

function buildInitCommand() {
  const command = new Command('init');
  command
    .description('Initialize team configuration')
    .action(async () => {
      try {
        // Init usually allows anyone to start if it doesn't exist, 
        // effectively claiming adminship of the local workspace.
        const existing = await loadTeamConfig();
        if (existing) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: 'Team config already exists. Overwrite it?',
              default: false,
            },
          ]);
          if (!overwrite) {
            printWarning(chalk.yellow('\nCanceled.\n'));
            return;
          }
        }

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Team name:',
            validate: (input) => (input.trim().length > 0 ? true : 'Team name is required'),
          },
          {
            type: 'input',
            name: 'description',
            message: 'Team description:',
            default: '',
          },
        ]);
        const config = {
          name: answers.name.trim(),
          description: answers.description.trim(),
          members: [],
          workspaces: [],
          activeWorkspace: null,
          agentAccess: JSON.parse(JSON.stringify(DEFAULT_AGENT_ACCESS)),
          createdAt: new Date().toISOString(),
        };

        // Add current user as admin
        const globalConfig = await configManager.loadGlobal();
        if (globalConfig?.user?.username) {
            config.members.push({
                email: globalConfig.user.username,
                role: 'admin',
                addedAt: new Date().toISOString()
            });
        }

        await saveTeamConfig(config);
        printSuccess(chalk.green('\n✅ Team config created at .ultra-dex/team.json\n'));
      } catch (error) {
        printError(chalk.red(`Init failed: ${error.message}`));
      }
    });

  return command;
}

function buildAddCommand() {
  const command = new Command('add');
  command
    .description('Add a team member')
    .argument('<email>', 'Member email')
    .option('-r, --role <role>', 'Role (admin|member|viewer)', 'member')
    .action(async (email, options) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);

        const normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
          printError(chalk.red('\n❌ Invalid email format.\n'));
          return;
        }

        const role = options.role?.toLowerCase() || 'member';
        if (!VALID_ROLES.includes(role)) {
          printError(chalk.red(`\n❌ Invalid role. Use one of: ${VALID_ROLES.join(', ')}.\n`));
          return;
        }

        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const exists = team.members.some((member) => normalizeEmail(member.email) === normalizedEmail);
        if (exists) {
          printWarning(chalk.yellow(`\n⚠️  ${normalizedEmail} is already on the team.\n`));
          return;
        }

        team.members.push({
          email: normalizedEmail,
          role,
          addedAt: new Date().toISOString(),
        });

        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Added ${normalizedEmail} as ${role}.\n`));
      } catch (error) {
        if (error.message !== 'Team not initialized') {
            printError(chalk.red(`Add failed: ${error.message}`));
        }
      }
    });

  return command;
}

function buildListCommand() {
  const command = new Command('list');
  command
    .description('List team members')
    .action(async () => {
      try {
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        if (!team.members.length) {
          printWarning(chalk.yellow('\nNo team members yet.\n'));
          return;
        }

        const rows = team.members.map((member) => [
          member.email,
          member.role,
          member.addedAt,
        ]);

        printInfo('\n' + chalk.bold('Team Members'));
        printInfo(formatTable(rows));
        printInfo('');
      } catch (error) {
        if (error.message !== 'Team not initialized') {
            printError(chalk.red(`List failed: ${error.message}`));
        }
      }
    });

  return command;
}

function buildRemoveCommand() {
  const command = new Command('remove');
  command
    .description('Remove a team member')
    .argument('<email>', 'Member email')
    .action(async (email) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);

        const normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
          printError(chalk.red('\n❌ Invalid email format.\n'));
          return;
        }

        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const index = team.members.findIndex((member) => normalizeEmail(member.email) === normalizedEmail);
        if (index === -1) {
          printError(chalk.red(`\n❌ ${normalizedEmail} not found in team.\n`));
          return;
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Remove ${normalizedEmail} from the team?`,
            default: false,
          },
        ]);

        if (!confirm) {
          printWarning(chalk.yellow('\nCanceled.\n'));
          return;
        }

        team.members.splice(index, 1);
        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Removed ${normalizedEmail}.\n`));
      } catch (error) {
        if (error.message !== 'Team not initialized') {
            printError(chalk.red(`Remove failed: ${error.message}`));
        }
      }
    });

  return command;
}

function buildConfigCommand() {
  const command = new Command('config');
  command
    .description('Show or update team settings')
    .argument('[key]', 'Setting key (name, description)')
    .argument('[value]', 'Setting value')
    .action(async (key, value) => {
      try {
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const validKeys = ['name', 'description'];
        if (!key) {
          printInfo(chalk.bold('\nTeam Settings\n'));
          printInfo(chalk.gray(`Name: ${team.name || '-'}`));
          printInfo(chalk.gray(`Description: ${team.description || '-'}`));
          printInfo(chalk.gray(`Created: ${team.createdAt || '-'}`));
          printInfo(chalk.gray(`Members: ${team.members.length}`));
          printInfo('');
          return;
        }

        if (!validKeys.includes(key)) {
          printError(chalk.red(`\n❌ Invalid key. Use: ${validKeys.join(', ')}.\n`));
          return;
        }

        if (value === undefined) {
          printInfo(chalk.gray(`\n${key}: ${team[key] || '-'}\n`));
          return;
        }

        // Updating requires permission
        await checkPermission(PERMISSIONS.MANAGE_TEAM);

        team[key] = value.trim();
        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Updated ${key}.\n`));
      } catch (error) {
        if (error.message !== 'Team not initialized') {
            printError(chalk.red(`Config failed: ${error.message}`));
        }
      }
    });

  return command;
}

function buildWorkspaceCommand() {
  const command = new Command('workspace');
  command
    .description('Manage team workspaces')
    .command('add [path]')
    .description('Add current or specified directory to team workspaces')
    .action(async (dir) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);
        const targetDir = path.resolve(dir || process.cwd());
        const name = path.basename(targetDir);

        const team = await loadTeamConfig();
        requireTeamConfig(team);

        team.workspaces = team.workspaces || [];
        team.workspaces = team.workspaces.filter(w => w.path !== targetDir && w.name !== name);
        team.workspaces.push({
          name,
          path: targetDir,
          addedAt: new Date().toISOString()
        });
        if (!team.activeWorkspace) {
          team.activeWorkspace = targetDir;
        }

        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Team workspace added: ${name}\n`));
      } catch (error) {
        printError(chalk.red(`Workspace add failed: ${error.message}`));
      }
    });

  command
    .command('list')
    .description('List team workspaces')
    .action(async () => {
      try {
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const workspaces = team.workspaces || [];
        if (!workspaces.length) {
          printWarning(chalk.yellow('\nNo team workspaces configured.\n'));
          return;
        }

        printInfo(chalk.bold('\nTeam Workspaces\n'));
        workspaces.forEach(ws => {
          const isActive = team.activeWorkspace === ws.path;
          const prefix = isActive ? chalk.green('➜ ') : '  ';
          printInfo(`${prefix}${chalk.bold(ws.name)} ${isActive ? chalk.green('(active)') : ''}`);
          printInfo(`    Path: ${chalk.gray(ws.path)}`);
          printInfo(`    Added: ${chalk.gray(ws.addedAt || '-')}`);
          printInfo('');
        });
      } catch (error) {
        if (error.message !== 'Team not initialized') {
          printError(chalk.red(`Workspace list failed: ${error.message}`));
        }
      }
    });

  command
    .command('remove <path_or_name>')
    .description('Remove a team workspace')
    .action(async (target) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const initialLen = team.workspaces?.length || 0;
        team.workspaces = (team.workspaces || []).filter(w => w.path !== path.resolve(target) && w.name !== target);

        if (team.workspaces.length < initialLen) {
          if (team.activeWorkspace && team.activeWorkspace === path.resolve(target)) {
            team.activeWorkspace = null;
          }
          await saveTeamConfig(team);
          printSuccess(chalk.green(`\n✅ Removed workspace: ${target}\n`));
        } else {
          printWarning(chalk.yellow(`\nWorkspace not found: ${target}\n`));
        }
      } catch (error) {
        printError(chalk.red(`Workspace remove failed: ${error.message}`));
      }
    });

  command
    .command('switch <path_or_name>')
    .description('Set the active team workspace')
    .action(async (target) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const workspaces = team.workspaces || [];
        const match = workspaces.find(w => w.name === target || w.path === path.resolve(target));
        if (!match) {
          printError(chalk.red(`\n❌ Workspace not found: ${target}\n`));
          return;
        }

        team.activeWorkspace = match.path;
        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Active team workspace set to ${match.name}\n`));
      } catch (error) {
        printError(chalk.red(`Workspace switch failed: ${error.message}`));
      }
    });

  return command;
}

function buildAgentAccessCommand() {
  const command = new Command('agents');
  command
    .description('Manage role-based agent access')
    .command('list')
    .description('List agent access rules by role')
    .action(async () => {
      try {
        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const access = team.agentAccess || DEFAULT_AGENT_ACCESS;
        printInfo(chalk.bold('\nAgent Access Rules\n'));
        Object.entries(access).forEach(([role, agents]) => {
          const list = Array.isArray(agents) ? agents.join(', ') : String(agents || '');
          printInfo(`${chalk.cyan(role)}: ${chalk.gray(list || '-')}`);
        });
        printInfo('');
      } catch (error) {
        if (error.message !== 'Team not initialized') {
          printError(chalk.red(`Agent access list failed: ${error.message}`));
        }
      }
    });

  command
    .command('set <role> <agents>')
    .description('Set allowed agents for a role (comma-separated or *)')
    .action(async (role, agents) => {
      try {
        await checkPermission(PERMISSIONS.MANAGE_TEAM);
        const normalizedRole = role.toLowerCase();
        if (!VALID_ROLES.includes(normalizedRole)) {
          printError(chalk.red(`\n❌ Invalid role. Use: ${VALID_ROLES.join(', ')}.\n`));
          return;
        }

        const team = await loadTeamConfig();
        requireTeamConfig(team);

        const parsedAgents = agents
          .split(',')
          .map(a => a.trim())
          .filter(Boolean);

        if (parsedAgents.length === 0) {
          printError(chalk.red('\n❌ No agents provided.\n'));
          return;
        }

        team.agentAccess = team.agentAccess || JSON.parse(JSON.stringify(DEFAULT_AGENT_ACCESS));
        team.agentAccess[normalizedRole] = parsedAgents;
        await saveTeamConfig(team);
        printSuccess(chalk.green(`\n✅ Updated agent access for ${normalizedRole}.\n`));
      } catch (error) {
        printError(chalk.red(`Agent access update failed: ${error.message}`));
      }
    });

  return command;
}

export function registerTeamCommand(program) {
  const team = program
    .command('team')
    .description('Team collaboration');

  team.addCommand(buildInitCommand());
  team.addCommand(buildAddCommand());
  team.addCommand(buildListCommand());
  team.addCommand(buildRemoveCommand());
  team.addCommand(buildConfigCommand());
  team.addCommand(buildWorkspaceCommand());
  team.addCommand(buildAgentAccessCommand());
}
