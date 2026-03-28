// Copyright (c) 2026 Ultra-Dex

/**
 * AI Logic Traceability Engine
 * Force agents to output "Reasoning Summary" with every change
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Traceability log
class TraceabilityLogger {
  constructor() {
    this.logs = [];
    this.logDir = path.join(process.cwd(), 'logs', 'traceability');
    this.ensureLogDir();
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      logger.error(`Traceability Logger: Error creating log directory: ${error.message}`);
    }
  }

  /**
   * Log agent reasoning and changes
   */
  async logAgentActivity(activity) {
    const traceEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      activityType: activity.type || 'unknown',
      agent: activity.agent || 'unknown',
      task: activity.task || 'unknown',
      reasoning: activity.reasoning || 'No reasoning provided',
      changes: activity.changes || [],
      constraints: activity.constraints || [],
      filesModified: activity.filesModified || [],
      decisions: activity.decisions || [],
      context: activity.context || {},
      metadata: {
        ...activity.metadata,
        session: activity.session || process.env.SESSION_ID || 'default',
      },
    };

    this.logs.push(traceEntry);

    // Write to file
    await this.writeLogToFile(traceEntry);

    return traceEntry;
  }

  /**
   * Generate unique ID for trace entry
   */
  generateId() {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Write log entry to file
   */
  async writeLogToFile(entry) {
    const fileName = `trace-${entry.timestamp.substring(0, 10)}.jsonl`;
    const filePath = path.join(this.logDir, fileName);

    const logLine = JSON.stringify(entry) + '\n';

    try {
      await fs.appendFile(filePath, logLine);
    } catch (error) {
      logger.error(`Traceability Logger: Error writing log: ${error.message}`);
    }
  }

  /**
   * Log a reasoning step
   */
  async logReasoning(agent, task, reasoning, options = {}) {
    const activity = {
      type: 'reasoning',
      agent,
      task,
      reasoning,
      ...options,
    };

    return await this.logAgentActivity(activity);
  }

  /**
   * Log a code change
   */
  async logCodeChange(agent, task, file, change, reasoning) {
    const activity = {
      type: 'code-change',
      agent,
      task,
      reasoning,
      changes: [
        {
          file,
          change,
          timestamp: new Date().toISOString(),
        },
      ],
      filesModified: [file],
    };

    return await this.logAgentActivity(activity);
  }

  /**
   * Log a decision
   */
  async logDecision(agent, task, decision, reasoning, options = {}) {
    const activity = {
      type: 'decision',
      agent,
      task,
      reasoning,
      decisions: [
        {
          decision,
          reasoning,
          timestamp: new Date().toISOString(),
          ...options,
        },
      ],
    };

    return await this.logAgentActivity(activity);
  }

  /**
   * Log a constraint check
   */
  async logConstraintCheck(agent, task, constraint, result, reasoning) {
    const activity = {
      type: 'constraint-check',
      agent,
      task,
      reasoning,
      constraints: [
        {
          constraint,
          result,
          reasoning,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return await this.logAgentActivity(activity);
  }

  /**
   * Get traceability logs
   */
  async getLogs(filters = {}) {
    // In a real implementation, this would query the log files
    // For now, return in-memory logs
    return this.logs.filter((log) => {
      if (filters.agent && log.agent !== filters.agent) return false;
      if (filters.task && !log.task.includes(filters.task)) return false;
      if (filters.type && log.activityType !== filters.type) return false;
      if (filters.since) {
        const logTime = new Date(log.timestamp);
        const sinceTime = new Date(filters.since);
        if (logTime < sinceTime) return false;
      }
      return true;
    });
  }

  /**
   * Search traceability logs
   */
  async searchLogs(query) {
    const allLogs = await this.getLogs();
    const lowerQuery = query.toLowerCase();

    return allLogs.filter(
      (log) =>
        log.reasoning.toLowerCase().includes(lowerQuery) ||
        log.task.toLowerCase().includes(lowerQuery) ||
        log.agent.toLowerCase().includes(lowerQuery) ||
        log.changes.some(
          (change) =>
            change.file.toLowerCase().includes(lowerQuery) ||
            (change.change && change.change.toLowerCase().includes(lowerQuery))
        ) ||
        log.decisions.some(
          (decision) =>
            decision.decision.toLowerCase().includes(lowerQuery) ||
            decision.reasoning.toLowerCase().includes(lowerQuery)
        )
    );
  }

  /**
   * Generate traceability report
   */
  async generateReport(filters = {}) {
    const logs = await this.getLogs(filters);

    const report = {
      generatedAt: new Date().toISOString(),
      totalEntries: logs.length,
      byAgent: {},
      byType: {},
      byDay: {},
      summary: {
        totalChanges: 0,
        totalDecisions: 0,
        totalReasoningSteps: 0,
      },
      entries: logs,
    };

    // Aggregate statistics
    for (const log of logs) {
      // Count by agent
      if (!report.byAgent[log.agent]) {
        report.byAgent[log.agent] = 0;
      }
      report.byAgent[log.agent]++;

      // Count by type
      if (!report.byType[log.activityType]) {
        report.byType[log.activityType] = 0;
      }
      report.byType[log.activityType]++;

      // Count by day
      const day = log.timestamp.substring(0, 10);
      if (!report.byDay[day]) {
        report.byDay[day] = 0;
      }
      report.byDay[day]++;

      // Update summary counts
      if (log.activityType === 'code-change') {
        report.summary.totalChanges += log.changes.length;
      } else if (log.activityType === 'decision') {
        report.summary.totalDecisions += log.decisions.length;
      } else if (log.activityType === 'reasoning') {
        report.summary.totalReasoningSteps++;
      }
    }

    return report;
  }

  /**
   * Export traceability logs
   */
  async exportLogs(format = 'json', filters = {}) {
    const logs = await this.getLogs(filters);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      // Simple CSV export
      const headers = ['id', 'timestamp', 'agent', 'task', 'type', 'reasoning'];
      let csv = headers.join(',') + '\n';

      for (const log of logs) {
        const row = [
          `"${log.id}"`,
          `"${log.timestamp}"`,
          `"${log.agent}"`,
          `"${log.task}"`,
          `"${log.activityType}"`,
          `"${log.reasoning.substring(0, 100).replace(/"/g, '""')}"`,
        ];
        csv += row.join(',') + '\n';
      }

      return csv;
    } else if (format === 'markdown') {
      let md = '# Traceability Log Report\n\n';
      md += `Generated: ${new Date().toISOString()}\n\n`;

      for (const log of logs) {
        md += `## Entry: ${log.id}\n`;
        md += `- **Timestamp**: ${log.timestamp}\n`;
        md += `- **Agent**: ${log.agent}\n`;
        md += `- **Task**: ${log.task}\n`;
        md += `- **Type**: ${log.activityType}\n`;
        md += `- **Reasoning**: ${log.reasoning}\n\n`;

        if (log.changes.length > 0) {
          md += `### Changes:\n`;
          for (const change of log.changes) {
            md += `- **File**: ${change.file}\n`;
            md += `  - ${change.change.substring(0, 200)}\n\n`;
          }
        }

        if (log.decisions.length > 0) {
          md += `### Decisions:\n`;
          for (const decision of log.decisions) {
            md += `- **Decision**: ${decision.decision}\n`;
            md += `  - **Reasoning**: ${decision.reasoning}\n\n`;
          }
        }
      }

      return md;
    }
  }
}

// Singleton instance
const traceabilityLogger = new TraceabilityLogger();

/**
 * Decorator function to wrap agent operations with traceability
 */
export function withTraceability(agentName, taskDescription) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const reasoning = args[args.length - 1]?.reasoning || 'No reasoning provided';

      // Log the start of the operation
      await traceabilityLogger.logReasoning(agentName, taskDescription, reasoning, {
        phase: 'start',
        args: args.slice(0, -1),
      });

      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Log the successful completion
        await traceabilityLogger.logReasoning(
          agentName,
          taskDescription,
          `Operation completed successfully: ${reasoning}`,
          {
            phase: 'complete',
            result: typeof result === 'string' ? result.substring(0, 100) : 'non-string result',
          }
        );

        return result;
      } catch (error) {
        // Log the error
        await traceabilityLogger.logReasoning(
          agentName,
          taskDescription,
          `Operation failed: ${error.message}. Reasoning: ${reasoning}`,
          { phase: 'error', error: error.message }
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Log a reasoning step directly
 */
export async function logReasoning(agent, task, reasoning, options = {}) {
  return await traceabilityLogger.logReasoning(agent, task, reasoning, options);
}

/**
 * Log a code change directly
 */
export async function logCodeChange(agent, task, file, change, reasoning) {
  return await traceabilityLogger.logCodeChange(agent, task, file, change, reasoning);
}

/**
 * Log a decision directly
 */
export async function logDecision(agent, task, decision, reasoning, options = {}) {
  return await traceabilityLogger.logDecision(agent, task, decision, reasoning, options);
}

/**
 * Log a constraint check directly
 */
export async function logConstraintCheck(agent, task, constraint, result, reasoning) {
  return await traceabilityLogger.logConstraintCheck(agent, task, constraint, result, reasoning);
}

/**
 * Get traceability logs
 */
export async function getTraceabilityLogs(filters = {}) {
  return await traceabilityLogger.getLogs(filters);
}

/**
 * Search traceability logs
 */
export async function searchTraceabilityLogs(query) {
  return await traceabilityLogger.searchLogs(query);
}

/**
 * Generate traceability report
 */
export async function generateTraceabilityReport(filters = {}) {
  return await traceabilityLogger.generateReport(filters);
}

/**
 * Register traceability command
 */
export function registerTraceabilityCommand(program) {
  const traceCmd = program
    .command('trace')
    .alias('traceability')
    .description('AI reasoning traceability logging');

  traceCmd
    .command('log')
    .description('Log reasoning to traceability system')
    .argument('<agent>', 'Agent name')
    .argument('<task>', 'Task description')
    .argument('<reasoning>', 'Reasoning explanation')
    .option('-c, --change <file:change>', 'File change in format file:change description')
    .option('-d, --decision <decision>', 'Decision made')
    .option('-co, --constraint <constraint:result>', 'Constraint check in format constraint:result')
    .action(async (agent, task, reasoning, options) => {
      try {
        logger.log(`📝 Logging traceability for ${agent} on task: ${task}`);

        if (options.change) {
          const [file, changeDesc] = options.change.split(':');
          await logCodeChange(agent, task, file, changeDesc, reasoning);
          logger.log(`✅ Logged code change: ${file}`);
        } else if (options.decision) {
          await logDecision(agent, task, options.decision, reasoning);
          logger.log(`✅ Logged decision: ${options.decision}`);
        } else if (options.constraint) {
          const [constraint, resultStr] = options.constraint.split(':');
          const result = resultStr === 'pass' || resultStr === 'true';
          await logConstraintCheck(agent, task, constraint, result, reasoning);
          logger.log(`✅ Logged constraint check: ${constraint} = ${result}`);
        } else {
          await logReasoning(agent, task, reasoning);
          logger.log(`✅ Logged reasoning`);
        }

        logger.log('📋 Traceability log updated');
      } catch (error) {
        logger.error(`Error logging traceability: ${error.message}`);
      }
    });

  traceCmd
    .command('search')
    .description('Search traceability logs')
    .argument('<query>', 'Search query')
    .action(async (query) => {
      try {
        logger.log(`🔍 Searching traceability logs for: ${query}`);

        const results = await searchTraceabilityLogs(query);

        if (results.length === 0) {
          logger.log('No results found');
          return;
        }

        logger.log(`Found ${results.length} matching entries:\n`);

        for (const result of results.slice(0, 10)) {
          // Show top 10
          logger.log(`ID: ${result.id}`);
          logger.log(`Agent: ${result.agent}`);
          logger.log(`Task: ${result.task}`);
          logger.log(`Type: ${result.activityType}`);
          logger.log(`Reasoning: ${result.reasoning.substring(0, 100)}...`);
          logger.log('---');
        }

        if (results.length > 10) {
          logger.log(`... and ${results.length - 10} more`);
        }
      } catch (error) {
        logger.error(`Error searching traceability logs: ${error.message}`);
      }
    });

  traceCmd
    .command('report')
    .description('Generate traceability report')
    .option('-a, --agent <agent>', 'Filter by agent')
    .option('-t, --task <task>', 'Filter by task')
    .option('-s, --since <date>', 'Filter since date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format (json, csv, markdown)', 'json')
    .action(async (options) => {
      try {
        logger.log('📊 Generating traceability report...');

        const filters = {};
        if (options.agent) filters.agent = options.agent;
        if (options.task) filters.task = options.task;
        if (options.since) filters.since = options.since;

        const report = await generateTraceabilityReport(filters);

        if (options.format === 'json') {
          logger.log(JSON.stringify(report, null, 2));
        } else {
          const exportData = await traceabilityLogger.exportLogs(options.format, filters);
          logger.log(exportData);
        }
      } catch (error) {
        logger.error(`Error generating traceability report: ${error.message}`);
      }
    });

  traceCmd._examples = [
    {
      command: 'ultra-dex trace log @Planner "Add auth system" "Using NextAuth for authentication"',
      description: 'Log agent reasoning',
    },
    {
      command:
        'ultra-dex trace log @Backend "Update API" "Changed user endpoint" --change "pages/api/users.ts:Add JWT validation"',
      description: 'Log code change',
    },
    {
      command: 'ultra-dex trace search "authentication"',
      description: 'Search for auth-related traces',
    },
    {
      command: 'ultra-dex trace report --agent @Planner --format markdown',
      description: 'Generate report for Planner agent',
    },
  ];
}

export default {
  traceabilityLogger,
  withTraceability,
  logReasoning,
  logCodeChange,
  logDecision,
  logConstraintCheck,
  getTraceabilityLogs,
  searchTraceabilityLogs,
  generateTraceabilityReport,
  registerTraceabilityCommand,
};
