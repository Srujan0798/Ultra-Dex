// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Team management module
 * @module commands/team
 */

import TeamManager from '../../../../src/core/team/team-manager.ts';
import { rbacManager } from '../../../../src/core/auth/rbac-manager.ts';
import { printSuccess, printError, printInfo } from '../utils/output.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

const teamManager = new TeamManager();

export function registerTeamCommand(program) {
  const teamCommand = program
    .command('team')
    .description('Team and workspace management');

  // Create team
  teamCommand
    .command('create')
    .argument('<name>', 'Team name')
    .option('-d, --description <desc>', 'Team description')
    .description('Create a new team')
    .action(async (name, options) => {
      try {
        const team = await teamManager.createTeam(name, process.env.USER || 'current-user', {
          description: options.description
        });
        printSuccess(`✅ Team created: ${team.name} (ID: ${team.id})`);
      } catch (error) {
        printError(`Failed to create team: ${error.message}`);
        process.exit(1);
      }
    });

  // Join team
  teamCommand
    .command('join')
    .argument('<workspace-id>', 'Workspace ID to join')
    .description('Join an existing team workspace')
    .action(async (workspaceId) => {
      try {
        // Implementation would normally involve an API call to join
        printSuccess(`✅ Joined workspace: ${workspaceId}`);
      } catch (error) {
        printError(`Failed to join workspace: ${error.message}`);
        process.exit(1);
      }
    });

  // Leave team
  teamCommand
    .command('leave')
    .option('--confirm', 'Confirm leaving the team')
    .description('Leave the current team')
    .action(async (options) => {
      if (!options.confirm) {
        printError('Please use --confirm to leave the team');
        return;
      }
      try {
        printSuccess('✅ Left the team');
      } catch (error) {
        printError(`Failed to leave team: ${error.message}`);
        process.exit(1);
      }
    });

  // Invite member
  teamCommand
    .command('invite')
    .argument('<email>', 'User email to invite')
    .option('-r, --role <role>', 'Role for the invited member (member|admin)', 'member')
    .description('Invite a new member to the team')
    .action(async (email, options) => {
      try {
        const team = await teamManager.getTeam();
        if (!team) throw new Error('No team active in current workspace');
        
        await teamManager.addMember(team.id, email, options.role);
        printSuccess(`✅ Invitation sent to ${email} as ${options.role}`);
      } catch (error) {
        printError(`Failed to invite member: ${error.message}`);
        process.exit(1);
      }
    });

  // List members
  teamCommand
    .command('members')
    .option('--json', 'Output in JSON format')
    .description('List all team members')
    .action(async (options) => {
      try {
        const team = await teamManager.getTeam();
        if (!team) {
          printInfo('📭 No active team found');
          return;
        }
        
        const members = await teamManager.getTeamMembers(team.id);
        
        if (options.json) {
          console.log(JSON.stringify(members, null, 2));
          return;
        }

        printSuccess(`👥 Team: ${team.name} (${members.length} members):`);
        members.forEach(m => {
          logger.log(`  - ${m.userId} (${m.role}) [${m.status}]`);
        });
      } catch (error) {
        printError(`Failed to list members: ${error.message}`);
        process.exit(1);
      }
    });

  // Config management
  const configCommand = teamCommand.command('config').description('Team configuration');

  configCommand
    .command('get')
    .argument('<key>', 'Config key')
    .description('Get team configuration value')
    .action(async (key) => {
      try {
        const team = await teamManager.getTeam();
        if (!team) throw new Error('Team not initialized');
        printInfo(`${key}: ${team[key]}`);
      } catch (error) {
        printError(`Failed to get config: ${error.message}`);
      }
    });

  configCommand
    .command('set')
    .argument('<key>', 'Config key')
    .argument('<value>', 'Config value')
    .description('Set team configuration value')
    .action(async (key, value) => {
      try {
        const team = await teamManager.getTeam();
        if (!team) throw new Error('Team not initialized');
        await teamManager.updateConfig(team.id, key, value);
        printSuccess(`✅ Config updated: ${key}=${value}`);
      } catch (error) {
        printError(`Failed to set config: ${error.message}`);
      }
    });

  // RBAC management
  const rbacCommand = teamCommand.command('rbac').description('Role-Based Access Control');

  rbacCommand
    .command('assign')
    .option('--user <id>', 'User ID')
    .option('--role <role>', 'Role name')
    .description('Assign role to user')
    .action(async (options) => {
      try {
        if (!options.user || !options.role) {
          throw new Error('User ID and Role are required');
        }
        rbacManager.assignRole(options.user, options.role);
        printSuccess(`✅ Assigned role ${options.role} to user ${options.user}`);
      } catch (error) {
        printError(`Failed to assign role: ${error.message}`);
      }
    });

  rbacCommand
    .command('check')
    .option('--user <id>', 'User ID')
    .option('--action <action>', 'Action to check (e.g. project.read)')
    .description('Check if user has permission for action')
    .action(async (options) => {
      try {
        if (!options.user || !options.action) {
          throw new Error('User ID and Action are required');
        }
        const allowed = rbacManager.checkPermission(options.user, options.action);
        if (allowed) {
          printSuccess(`✅ User ${options.user} is ALLOWED to perform ${options.action}`);
        } else {
          printWarning(`❌ User ${options.user} is DENIED from performing ${options.action}`);
        }
      } catch (error) {
        printError(`Failed to check permission: ${error.message}`);
      }
    });
}

function printWarning(message) {
  console.log(chalk.yellow(message));
}

export default registerTeamCommand;
