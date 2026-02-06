// Copyright (c) 2026 Ultra-Dex

/**
 * Session Command for Ultra-Dex
 * Manages persistent agent sessions with checkpoint/resume capabilities
 */

import { sessionManager } from '../agents/session-manager.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

/**
 * List all sessions
 */
export async function listSessions(options = {}) {
  try {
    printInfo(chalk.cyan('\n📋 Ultra-Dex Session Management\n'));

    const sessions = await sessionManager.listSessions();

    if (sessions.length === 0) {
      printInfo(chalk.gray('No active sessions found'));
      return;
    }

    // Group by status
    const groupedSessions = sessions.reduce((acc, session) => {
      if (!acc[session.status]) acc[session.status] = [];
      acc[session.status].push(session);
      return acc;
    }, {});

    for (const [status, statusSessions] of Object.entries(groupedSessions)) {
      const statusColors = {
        running: chalk.green,
        paused: chalk.yellow,
        completed: chalk.blue,
        failed: chalk.red,
        stopped: chalk.gray,
      };

      const color = statusColors[status] || chalk.white;

      printInfo(color.bold(`\n${status.toUpperCase()} (${statusSessions.length})\n`));

      for (const session of statusSessions) {
        printInfo(`${color('●')} ${chalk.bold(session.name)} (${session.id})`);
        printInfo(chalk.gray(`  Agent: ${session.agent || 'default'}`));
        printInfo(
          chalk.gray(
            `  Progress: ${session.progress || 0}% (${session.currentStep || 0}/${session.totalSteps || 1})`
          )
        );
        printInfo(chalk.gray(`  Started: ${new Date(session.startedAt).toLocaleString()}`));

        if (session.status === 'failed' && session.error) {
          printInfo(chalk.red(`  Error: ${session.error}`));
        }

        printInfo(''); // Empty line
      }
    }
  } catch (error) {
    printError(chalk.red(`❌ Failed to list sessions: ${error.message}`));
    throw error;
  }
}

/**
 * Start a new session
 */
export async function startSession(task, options = {}) {
  try {
    printInfo(chalk.cyan(`\n🚀 Starting new session for: ${task}\n`));

    const session = await sessionManager.createSession(task, {
      name: options.name,
      agent: options.agent,
      priority: options.priority || 'p2',
      dependencies: options.dependencies || [],
    });

    printSuccess(chalk.green(`✅ Session started: ${session.name} (${session.id})`));
    printInfo(chalk.gray(`   Agent: ${session.agent}`));
    printInfo(chalk.gray(`   Priority: ${session.priority}`));

    return session;
  } catch (error) {
    printError(chalk.red(`❌ Failed to start session: ${error.message}`));
    throw error;
  }
}

/**
 * Resume a paused or stopped session
 */
export async function resumeSession(sessionId, options = {}) {
  try {
    printInfo(chalk.cyan(`\n🔄 Resuming session: ${sessionId}\n`));

    const session = await sessionManager.resumeSession(sessionId);

    printSuccess(chalk.green(`✅ Session resumed: ${session.id}`));
    printInfo(chalk.gray(`   Current step: ${session.currentStep}/${session.totalSteps}`));
    printInfo(chalk.gray(`   Status: ${session.status}`));

    return session;
  } catch (error) {
    printError(chalk.red(`❌ Failed to resume session: ${error.message}`));
    throw error;
  }
}

/**
 * Pause a running session
 */
export async function pauseSession(sessionId, options = {}) {
  try {
    printInfo(chalk.cyan(`\n⏸️  Pausing session: ${sessionId}\n`));

    const session = await sessionManager.pauseSession(sessionId);

    printSuccess(chalk.yellow(`✅ Session paused: ${session.id}`));
    printInfo(chalk.gray(`   Progress: ${session.progress}%`));

    return session;
  } catch (error) {
    printError(chalk.red(`❌ Failed to pause session: ${error.message}`));
    throw error;
  }
}

/**
 * Stop a running session
 */
export async function stopSession(sessionId, options = {}) {
  try {
    printInfo(chalk.cyan(`\n⏹️  Stopping session: ${sessionId}\n`));

    const session = await sessionManager.stopSession(sessionId);

    printSuccess(chalk.red(`✅ Session stopped: ${session.id}`));
    printInfo(chalk.gray(`   Completed: ${session.completedAt ? 'Yes' : 'No'}`));

    return session;
  } catch (error) {
    printError(chalk.red(`❌ Failed to stop session: ${error.message}`));
    throw error;
  }
}

/**
 * Show session status
 */
export async function sessionStatus(sessionId, options = {}) {
  try {
    printInfo(chalk.cyan(`\n📊 Session Status: ${sessionId}\n`));

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new AppError(`Session not found: ${sessionId}`, { code: 'SESSION_NOT_FOUND' });
    }

    printInfo(chalk.bold(session.name));
    printInfo(chalk.gray(`ID: ${session.id}`));
    printInfo(chalk.gray(`Status: ${session.status}`));
    printInfo(chalk.gray(`Agent: ${session.agent}`));
    printInfo(
      chalk.gray(
        `Progress: ${session.progress || 0}% (${session.currentStep || 0}/${session.totalSteps || 1})`
      )
    );
    printInfo(chalk.gray(`Started: ${new Date(session.startedAt).toLocaleString()}`));

    if (session.updatedAt) {
      printInfo(chalk.gray(`Updated: ${new Date(session.updatedAt).toLocaleString()}`));
    }

    if (session.completedAt) {
      printInfo(chalk.gray(`Completed: ${new Date(session.completedAt).toLocaleString()}`));
    }

    if (session.error) {
      printError(chalk.red(`Error: ${session.error}`));
    }

    // Show recent steps if available
    if (session.state?.history && session.state.history.length > 0) {
      printInfo(chalk.blue('\nRecent Steps:'));
      const recentSteps = session.state.history.slice(-5); // Last 5 steps
      for (const step of recentSteps) {
        printInfo(chalk.gray(`  • ${step.step || 'Unknown'} - ${step.status || 'Unknown'}`));
      }
    }
  } catch (error) {
    printError(chalk.red(`❌ Failed to get session status: ${error.message}`));
    throw error;
  }
}

/**
 * Show session logs
 */
export async function sessionLogs(sessionId, options = {}) {
  try {
    printInfo(chalk.cyan(`\n📝 Session Logs: ${sessionId}\n`));

    const logs = await sessionManager.getSessionLogs(sessionId);

    if (logs.length === 0) {
      printInfo(chalk.gray('No logs available for this session'));
      return;
    }

    // Show last 10 logs
    const recentLogs = logs.slice(-10);
    for (const log of recentLogs) {
      const timestamp = new Date(log.timestamp || log.createdAt).toLocaleTimeString();
      printInfo(chalk.gray(`${timestamp} - ${log.message || log.step || 'Log entry'}`));
    }

    if (logs.length > 10) {
      printInfo(chalk.gray(`\n... and ${logs.length - 10} more entries`));
    }
  } catch (error) {
    printError(chalk.red(`❌ Failed to get session logs: ${error.message}`));
    throw error;
  }
}

/**
 * Register the session command with Commander
 */
export function registerSessionCommand(program) {
  program
    .command('session')
    .description('Manage persistent agent sessions with checkpoint/resume')
    .option('--list', 'List all sessions')
    .option('--start <task>', 'Start a new session')
    .option('--resume <id>', 'Resume a paused session')
    .option('--pause <id>', 'Pause a running session')
    .option('--stop <id>', 'Stop a running session')
    .option('--status <id>', 'Show session status')
    .option('--logs <id>', 'Show session logs')
    .option('--name <name>', 'Session name')
    .option('--agent <agent>', 'Agent to use')
    .option('--priority <level>', 'Priority level (p0, p1, p2, p3)', 'p2')
    .action(async (options) => {
      try {
        if (options.list) {
          await listSessions(options);
        } else if (options.start) {
          await startSession(options.start, options);
        } else if (options.resume) {
          await resumeSession(options.resume, options);
        } else if (options.pause) {
          await pauseSession(options.pause, options);
        } else if (options.stop) {
          await stopSession(options.stop, options);
        } else if (options.status) {
          await sessionStatus(options.status, options);
        } else if (options.logs) {
          await sessionLogs(options.logs, options);
        } else {
          // Default: show session status if no specific action
          await listSessions(options);
        }
      } catch (error) {
        printError(chalk.red(`\n❌ Session command failed: ${error.message}`));
        process.exitCode = error.exitCode || 1;
        throw error;
      }
    });
}

export default {
  listSessions,
  startSession,
  resumeSession,
  pauseSession,
  stopSession,
  sessionStatus,
  sessionLogs,
  registerSessionCommand,
};
