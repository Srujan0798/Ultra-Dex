// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Enterprise module
 * @module commands/enterprise
 */

import { Command } from 'commander';
import { enterpriseFeatures } from '../lib/enterprise/features.js';
import { printInfo, printSuccess, printError, printWarning } from '../lib/utils/output.js';

export function registerEnterpriseCommand(program) {
  const enterpriseCommand = program
    .command('enterprise')
    .description('Enterprise features: RBAC, SSO, compliance, on-premise');

  // Initialize enterprise features
  enterpriseCommand
    .command('init')
    .description('Initialize enterprise features')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        printSuccess('🏢 Enterprise features initialized');
      } catch (error) {
        printError(`Enterprise initialization failed: ${error.message}`);
        process.exit(1);
      }
    });

  // User management
  enterpriseCommand
    .command('user')
    .description('User management')
    .action(() => {
      logger.log('Manage users with subcommands:');
      logger.log('  ultra-dex enterprise user create <email> <name>');
      logger.log('  ultra-dex enterprise user list');
      logger.log('  ultra-dex enterprise user role <userId> <role>');
      logger.log('  ultra-dex enterprise user deactivate <userId>');
      logger.log('  ultra-dex enterprise user activate <userId>');
    });

  enterpriseCommand
    .command('user-create')
    .argument('<email>', 'User email')
    .argument('<name>', 'User name')
    .option('-p, --password <password>', 'User password')
    .option('-r, --role <role>', 'User role', 'member')
    .description('Create a new user')
    .action(async (email, name, options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const userData = {
          email,
          name,
          password: options.password || await generateRandomPassword(),
          role: options.role
        };

        const result = await enterpriseFeatures.createUser(userData);
        printSuccess(result.message);
      } catch (error) {
        printError(`User creation failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('user-list')
    .description('List all users')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const users = Array.from(enterpriseFeatures.users.values());
        
        if (users.length === 0) {
          printInfo('📭 No users found');
          return;
        }

        printSuccess(`👥 ${users.length} users:`);
        users.forEach(user => {
          const status = user.isActive ? '🟢' : '🔴';
          logger.log(`  ${status} ${user.name} (${user.email}) - ${user.role} ${user.lastLogin ? `(Last: ${new Date(user.lastLogin).toLocaleDateString()})` : ''}`);
        });
      } catch (error) {
        printError(`User list failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('user-role')
    .argument('<userId>', 'User ID')
    .argument('<role>', 'New role')
    .description('Update user role')
    .action(async (userId, role, options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.updateUserRole(userId, role);
        printSuccess(result.message);
      } catch (error) {
        printError(`User role update failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('user-deactivate')
    .argument('<userId>', 'User ID to deactivate')
    .description('Deactivate a user')
    .action(async (userId) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.deactivateUser(userId);
        printSuccess(result.message);
      } catch (error) {
        printError(`User deactivation failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('user-activate')
    .argument('<userId>', 'User ID to activate')
    .description('Activate a user')
    .action(async (userId) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.activateUser(userId);
        printSuccess(result.message);
      } catch (error) {
        printError(`User activation failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Role management
  enterpriseCommand
    .command('role')
    .description('Role management')
    .action(() => {
      logger.log('Manage roles with subcommands:');
      logger.log('  ultra-dex enterprise role create <id> <name>');
      logger.log('  ultra-dex enterprise role list');
      logger.log('  ultra-dex enterprise role permissions <roleId>');
    });

  enterpriseCommand
    .command('role-create')
    .argument('<id>', 'Role ID')
    .argument('<name>', 'Role name')
    .option('-d, --description <desc>', 'Role description')
    .option('-p, --permissions <perms...>', 'Permissions (comma-separated)')
    .option('-i, --inherits <roles...>', 'Inherited roles')
    .description('Create a new role')
    .action(async (id, name, options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const roleData = {
          id,
          name,
          description: options.description,
          permissions: options.permissions || [],
          inherits: options.inherits || []
        };

        const result = await enterpriseFeatures.createRole(roleData);
        printSuccess(result.message);
      } catch (error) {
        printError(`Role creation failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('role-list')
    .description('List all roles')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const roles = Array.from(enterpriseFeatures.roles.values());
        
        printSuccess(`🛡️  ${roles.length} roles:`);
        roles.forEach(role => {
          logger.log(`\n${role.name} (${role.id})`);
          logger.log(`   Level: ${role.level}`);
          logger.log(`   Permissions: ${role.permissions.length}`);
          logger.log(`   Inherits: ${role.inherits.join(', ') || 'None'}`);
          logger.log(`   ${role.description}`);
        });
      } catch (error) {
        printError(`Role list failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('role-permissions')
    .argument('<roleId>', 'Role ID')
    .description('List permissions for a role')
    .action(async (roleId) => {
      try {
        await enterpriseFeatures.initialize();
        
        const permissions = enterpriseFeatures.getRolePermissions(roleId);
        
        if (!permissions || permissions.length === 0) {
          printInfo('📭 No permissions found for this role');
          return;
        }

        printSuccess(`📋 Permissions for role ${roleId}:`);
        permissions.forEach(perm => {
          logger.log(`  - ${perm}`);
        });
      } catch (error) {
        printError(`Role permissions failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Team management
  enterpriseCommand
    .command('team')
    .description('Team management')
    .action(() => {
      logger.log('Manage teams with subcommands:');
      logger.log('  ultra-dex enterprise team create <name>');
      logger.log('  ultra-dex enterprise team list');
      logger.log('  ultra-dex enterprise team add <teamId> <userId>');
      logger.log('  ultra-dex enterprise team remove <teamId> <userId>');
    });

  enterpriseCommand
    .command('team-create')
    .argument('<name>', 'Team name')
    .option('-d, --description <desc>', 'Team description')
    .description('Create a new team')
    .action(async (name, options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const teamData = {
          name,
          description: options.description
        };

        const result = await enterpriseFeatures.createTeam(teamData);
        printSuccess(result.message);
      } catch (error) {
        printError(`Team creation failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('team-list')
    .description('List all teams')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const teams = Array.from(enterpriseFeatures.teams.values());
        
        if (teams.length === 0) {
          printInfo('📭 No teams found');
          return;
        }

        printSuccess(`👥 ${teams.length} teams:`);
        teams.forEach(team => {
          logger.log(`\n${team.name} (${team.id})`);
          logger.log(`   Members: ${team.members.length}`);
          logger.log(`   Permissions: ${team.permissions.length}`);
          logger.log(`   Created: ${new Date(team.createdAt).toLocaleDateString()}`);
          if (team.description) {
            logger.log(`   ${team.description}`);
          }
        });
      } catch (error) {
        printError(`Team list failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('team-add')
    .argument('<teamId>', 'Team ID')
    .argument('<userId>', 'User ID to add')
    .description('Add user to team')
    .action(async (teamId, userId) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.addUserToTeam(userId, teamId);
        printSuccess(result.message);
      } catch (error) {
        printError(`Add user to team failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('team-remove')
    .argument('<teamId>', 'Team ID')
    .argument('<userId>', 'User ID to remove')
    .description('Remove user from team')
    .action(async (teamId, userId) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.removeUserFromTeam(userId, teamId);
        printSuccess(result.message);
      } catch (error) {
        printError(`Remove user from team failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Audit and compliance
  enterpriseCommand
    .command('audit')
    .description('Audit log management')
    .action(() => {
      logger.log('Manage audit logs with subcommands:');
      logger.log('  ultra-dex enterprise audit log');
      logger.log('  ultra-dex enterprise audit export');
      logger.log('  ultra-dex enterprise audit search <query>');
    });

  enterpriseCommand
    .command('audit-log')
    .option('-l, --limit <n>', 'Number of entries to show', '50')
    .option('-u, --user <userId>', 'Filter by user')
    .option('-a, --action <action>', 'Filter by action')
    .description('View audit log')
    .action(async (options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const filters = {
          user: options.user,
          action: options.action
        };
        
        const auditLog = enterpriseFeatures.getAuditLog(filters);
        const entries = auditLog.slice(0, parseInt(options.limit));
        
        if (entries.length === 0) {
          printInfo('📭 No audit entries found');
          return;
        }

        printSuccess(`📋 Last ${entries.length} audit entries:`);
        entries.forEach(entry => {
          logger.log(`\n[${new Date(entry.timestamp).toLocaleString()}] ${entry.action}`);
          logger.log(`  Actor: ${entry.details.actor || entry.actor}`);
          logger.log(`  Details: ${JSON.stringify(entry.details, null, 2)}`);
        });
      } catch (error) {
        printError(`Audit log failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('compliance')
    .description('Compliance management')
    .action(() => {
      logger.log('Manage compliance with subcommands:');
      logger.log('  ultra-dex enterprise compliance status');
      logger.log('  ultra-dex enterprise compliance report');
      logger.log('  ultra-dex enterprise compliance create <type> <standard>');
    });

  enterpriseCommand
    .command('compliance-status')
    .description('Get compliance status')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const status = enterpriseFeatures.getComplianceStatus();
        
        printSuccess('🛡️  Compliance Status:');
        logger.log(`  Total Records: ${status.total}`);
        logger.log(`  Active: ${status.active}`);
        logger.log(`  Expired: ${status.expired}`);
        logger.log(`  Pending: ${status.pending}`);
        logger.log(`  Compliance Rate: ${status.complianceRate.toFixed(1)}%`);
      } catch (error) {
        printError(`Compliance status failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('compliance-report')
    .description('Generate compliance report')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const report = await enterpriseFeatures.generateEnterpriseReport();
        
        printSuccess('📊 Enterprise Compliance Report:');
        logger.log(`\nStatistics:`);
        logger.log(`  Users: ${report.stats.users}`);
        logger.log(`  Roles: ${report.stats.roles}`);
        logger.log(`  Teams: ${report.stats.teams}`);
        logger.log(`  Audit Entries: ${report.stats.auditLogSize}`);
        
        logger.log(`\nCompliance:`);
        logger.log(`  Total Records: ${report.compliance.total}`);
        logger.log(`  Active: ${report.compliance.active}`);
        logger.log(`  Compliance Rate: ${report.compliance.complianceRate.toFixed(1)}%`);
        
        logger.log(`\nSecurity Features:`);
        logger.log(`  Password Policy: ${report.security.passwordPolicy}`);
        logger.log(`  Audit Logging: ${report.security.auditLogging}`);
        logger.log(`  RBAC: ${report.security.rbac}`);
        logger.log(`  SSO: ${report.security.sso ? 'Enabled' : 'Disabled'}`);
      } catch (error) {
        printError(`Compliance report failed: ${error.message}`);
        process.exit(1);
      }
    });

  // SSO setup
  enterpriseCommand
    .command('sso-setup')
    .option('-p, --provider <provider>', 'SSO provider (saml, oidc, oauth2)')
    .option('-u, --url <url>', 'Identity provider URL')
    .option('-c, --client-id <id>', 'Client ID')
    .option('-s, --client-secret <secret>', 'Client secret')
    .description('Setup SSO integration')
    .action(async (options) => {
      try {
        await enterpriseFeatures.initialize();
        
        if (!options.provider || !options.url) {
          printError('Provider and URL are required for SSO setup');
          process.exit(1);
        }

        const config = {
          provider: options.provider,
          metadataUrl: options.url,
          clientId: options.clientId,
          clientSecret: options.clientSecret
        };

        const result = await enterpriseFeatures.setupSSO(config);
        printSuccess(result.message);
      } catch (error) {
        printError(`SSO setup failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Export/import
  enterpriseCommand
    .command('export')
    .option('-o, --output <path>', 'Output file path')
    .description('Export enterprise data for backup')
    .action(async (options) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.exportEnterpriseData();
        
        if (options.output) {
          // This would implement custom output path
          printSuccess(`📊 Enterprise data exported to: ${result.path}`);
        } else {
          printSuccess(`📊 Enterprise data exported to: ${result.path}`);
        }
        
        logger.log(`Records exported:`);
        logger.log(`  Users: ${result.records.users}`);
        logger.log(`  Roles: ${result.records.roles}`);
        logger.log(`  Teams: ${result.records.teams}`);
        logger.log(`  Audit Entries: ${result.records.auditEntries}`);
      } catch (error) {
        printError(`Export failed: ${error.message}`);
        process.exit(1);
      }
    });

  enterpriseCommand
    .command('import')
    .argument('<backupPath>', 'Path to backup file')
    .description('Import enterprise data from backup')
    .action(async (backupPath) => {
      try {
        await enterpriseFeatures.initialize();
        
        const result = await enterpriseFeatures.importEnterpriseData(backupPath);
        printSuccess(result.message);
        
        logger.log(`Records imported:`);
        logger.log(`  Users: ${result.records.users}`);
        logger.log(`  Roles: ${result.records.roles}`);
        logger.log(`  Teams: ${result.records.teams}`);
      } catch (error) {
        printError(`Import failed: ${error.message}`);
        process.exit(1);
      }
    });

  // Enterprise status
  enterpriseCommand
    .command('status')
    .description('Get enterprise features status')
    .action(async () => {
      try {
        await enterpriseFeatures.initialize();
        
        const stats = enterpriseFeatures.getEnterpriseStats();
        
        printSuccess('🏢 Ultra-Dex Enterprise Status:');
        logger.log(`\nUser Management:`);
        logger.log(`  Users: ${stats.users}`);
        logger.log(`  Roles: ${stats.roles}`);
        logger.log(`  Teams: ${stats.teams}`);
        
        logger.log(`\nSecurity & Compliance:`);
        logger.log(`  Audit Log Size: ${stats.auditLogSize}`);
        logger.log(`  Compliance Records: ${stats.complianceRecords}`);
        logger.log(`  Active Compliance: ${stats.activeCompliance}`);
        
        logger.log(`\nFeatures:`);
        logger.log(`  RBAC: Enabled`);
        logger.log(`  Audit Logging: Active`);
        logger.log(`  SSO: ${enterpriseFeatures.options.enableSSO ? 'Enabled' : 'Disabled'}`);
        logger.log(`  On-Premise: ${enterpriseFeatures.options.enableOnPremise ? 'Enabled' : 'Disabled'}`);
      } catch (error) {
        printError(`Status check failed: ${error.message}`);
        process.exit(1);
      }
    });
}

async function generateRandomPassword() {
  const crypto = await import('crypto');
  return crypto.randomBytes(12).toString('hex');
}

export default registerEnterpriseCommand;