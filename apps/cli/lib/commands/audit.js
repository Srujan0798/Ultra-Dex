// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Audit management module
 * @module commands/audit
 */

import { auditLogger } from '../../../../src/services/audit/audit-logger.js';
import { printSuccess, printError, printInfo } from '../utils/output.js';
import { logger } from '../utils/logger.js';

export function registerAuditCommand(program) {
  const auditCommand = program
    .command('audit')
    .description('Audit log and compliance management');

  // Show audit logs
  auditCommand
    .command('show')
    .option('--days <number>', 'Number of days to look back', '7')
    .option('--user <id>', 'Filter by user ID')
    .option('--action <type>', 'Filter by action type')
    .description('Show audit logs')
    .action(async (options) => {
      try {
        const days = parseInt(options.days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const filter = {
          startDate,
          userId: options.user,
          types: options.action ? [options.action] : undefined,
        };

        const logs = await auditLogger.query(filter);

        if (logs.length === 0) {
          printInfo('📭 No audit logs found matching criteria');
          return;
        }

        printSuccess(`📋 Last ${logs.length} audit entries (Last ${days} days):`);
        logs.forEach(log => {
          logger.log(`\n[${log.timestamp.toLocaleString()}] ${log.action}`);
          logger.log(`  Actor: ${log.userId || 'system'}`);
          logger.log(`  Resource: ${log.resource}`);
          logger.log(`  Severity: ${log.severity.toUpperCase()}`);
        });
      } catch (error) {
        printError(`Failed to show audit logs: ${error.message}`);
        process.exit(1);
      }
    });

  // Export audit logs
  auditCommand
    .command('export')
    .option('--format <format>', 'Export format (csv|json|soc2)', 'json')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .description('Export audit logs for compliance')
    .action(async (options) => {
      try {
        const startDate = options.from ? new Date(options.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = options.to ? new Date(options.to) : new Date();

        const format = options.format === 'soc2' ? 'json' : options.format;
        const report = await auditLogger.generateComplianceReport(startDate, endDate, format);
        
        console.log(report);
        printSuccess('\n✅ Audit export completed');
      } catch (error) {
        printError(`Failed to export audit logs: ${error.message}`);
        process.exit(1);
      }
    });

  // Retention management
  auditCommand
    .command('retention')
    .option('--set <days>', 'Set retention period in days')
    .description('Manage audit log retention')
    .action(async (options) => {
      try {
        if (!options.set) {
          throw new Error('Retention days (--set) is required');
        }
        const days = parseInt(options.set);
        const olderThan = new Date();
        olderThan.setDate(olderThan.getDate() - days);

        await auditLogger.purgeOldLogs(olderThan);
        printSuccess(`✅ Retention policy set to ${days} days. Purge request sent.`);
      } catch (error) {
        printError(`Failed to set retention: ${error.message}`);
        process.exit(1);
      }
    });

  // Audit stats
  auditCommand
    .command('stats')
    .option('--days <number>', 'Period in days', '30')
    .description('Show audit log statistics')
    .action(async (options) => {
      try {
        const days = parseInt(options.days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        const stats = await auditLogger.getStats(startDate, endDate);

        printSuccess(`📊 Audit Statistics (Last ${days} days):`);
        logger.log(`  Total Events: ${stats.totalEvents}`);
        logger.log(`  Unique Users: ${stats.uniqueUsers}`);
        logger.log('\n  Events by Severity:');
        Object.entries(stats.eventsBySeverity).forEach(([sev, count]) => {
          logger.log(`    - ${sev}: ${count}`);
        });
      } catch (error) {
        printError(`Failed to get audit stats: ${error.message}`);
        process.exit(1);
      }
    });
}

export default registerAuditCommand;
