import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

const TEAM_DIR = '.ultra-dex';
const TEAM_FILE = 'team.json';
const TEAM_PATH = path.resolve(process.cwd(), TEAM_DIR, TEAM_FILE);
const VALID_ROLES = ['admin', 'member', 'viewer'];
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
    // process.exit(1); // Removed hard exit, throw error instead for better testing
    throw new Error('Team not initialized');
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
          createdAt: new Date().toISOString(),
        };

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

export function registerTeamCommand(program) {
  const team = program
    .command('team')
    .description('Team collaboration');

  team.addCommand(buildInitCommand());
  team.addCommand(buildAddCommand());
  team.addCommand(buildListCommand());
  team.addCommand(buildRemoveCommand());
  team.addCommand(buildConfigCommand());
}
