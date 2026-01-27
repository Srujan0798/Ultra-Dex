import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';

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
    console.log(chalk.red('\n❌ Team not initialized. Run "ultra-dex team init" first.\n'));
    process.exit(1);
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
          console.log(chalk.yellow('\nCanceled.\n'));
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
      console.log(chalk.green('\n✅ Team config created at .ultra-dex/team.json\n'));
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
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        console.log(chalk.red('\n❌ Invalid email format.\n'));
        process.exit(1);
      }

      const role = options.role?.toLowerCase() || 'member';
      if (!VALID_ROLES.includes(role)) {
        console.log(chalk.red(`\n❌ Invalid role. Use one of: ${VALID_ROLES.join(', ')}.\n`));
        process.exit(1);
      }

      const team = await loadTeamConfig();
      requireTeamConfig(team);

      const exists = team.members.some((member) => normalizeEmail(member.email) === normalizedEmail);
      if (exists) {
        console.log(chalk.yellow(`\n⚠️  ${normalizedEmail} is already on the team.\n`));
        process.exit(1);
      }

      team.members.push({
        email: normalizedEmail,
        role,
        addedAt: new Date().toISOString(),
      });

      await saveTeamConfig(team);
      console.log(chalk.green(`\n✅ Added ${normalizedEmail} as ${role}.\n`));
    });

  return command;
}

function buildListCommand() {
  const command = new Command('list');
  command
    .description('List team members')
    .action(async () => {
      const team = await loadTeamConfig();
      requireTeamConfig(team);

      if (!team.members.length) {
        console.log(chalk.yellow('\nNo team members yet.\n'));
        return;
      }

      const rows = team.members.map((member) => [
        member.email,
        member.role,
        member.addedAt,
      ]);

      console.log('\n' + chalk.bold('Team Members'));
      console.log(formatTable(rows));
      console.log('');
    });

  return command;
}

function buildRemoveCommand() {
  const command = new Command('remove');
  command
    .description('Remove a team member')
    .argument('<email>', 'Member email')
    .action(async (email) => {
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        console.log(chalk.red('\n❌ Invalid email format.\n'));
        process.exit(1);
      }

      const team = await loadTeamConfig();
      requireTeamConfig(team);

      const index = team.members.findIndex((member) => normalizeEmail(member.email) === normalizedEmail);
      if (index === -1) {
        console.log(chalk.red(`\n❌ ${normalizedEmail} not found in team.\n`));
        process.exit(1);
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
        console.log(chalk.yellow('\nCanceled.\n'));
        return;
      }

      team.members.splice(index, 1);
      await saveTeamConfig(team);
      console.log(chalk.green(`\n✅ Removed ${normalizedEmail}.\n`));
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
      const team = await loadTeamConfig();
      requireTeamConfig(team);

      const validKeys = ['name', 'description'];
      if (!key) {
        console.log(chalk.bold('\nTeam Settings\n'));
        console.log(chalk.gray(`Name: ${team.name || '-'}`));
        console.log(chalk.gray(`Description: ${team.description || '-'}`));
        console.log(chalk.gray(`Created: ${team.createdAt || '-'}`));
        console.log(chalk.gray(`Members: ${team.members.length}`));
        console.log('');
        return;
      }

      if (!validKeys.includes(key)) {
        console.log(chalk.red(`\n❌ Invalid key. Use: ${validKeys.join(', ')}.\n`));
        process.exit(1);
      }

      if (value === undefined) {
        console.log(chalk.gray(`\n${key}: ${team[key] || '-'}\n`));
        return;
      }

      team[key] = value.trim();
      await saveTeamConfig(team);
      console.log(chalk.green(`\n✅ Updated ${key}.\n`));
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
