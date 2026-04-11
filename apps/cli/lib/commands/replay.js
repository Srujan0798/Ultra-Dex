/**
 * Replay Command
 * Execution trace playback for completed runs.
 *
 * Usage:
 *   ultra-dex replay <run_id>          Show step-by-step trace
 *   ultra-dex replay <run_id> --json   Output full trace as JSON
 *   ultra-dex replay --list            List recent execution traces
 */

import chalk from 'chalk';

/**
 * Get a Postgres client lazily. Returns null if DATABASE_URL not set or connection fails.
 */
async function getDbClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // Test connection
    const client = await pool.connect();
    client.release();
    return pool;
  } catch {
    return null;
  }
}

/**
 * Fetch a single execution trace by run_id.
 * Tries Postgres first, falls back to trace files.
 */
async function fetchTrace(runId) {
  const pool = await getDbClient();

  if (pool) {
    try {
      const result = await pool.query(
        'SELECT * FROM execution_traces WHERE run_id = $1',
        [runId]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          run_id: row.run_id,
          user_id: row.user_id,
          agent: row.agent,
          task: row.task,
          steps: row.steps || [],
          status: row.status,
          started_at: row.started_at,
          completed_at: row.completed_at,
        };
      }
    } catch {
      // Fall through to file-based
    } finally {
      await pool.end();
    }
  }

  // Fallback: try to find trace in .ultra-dex/traces/
  const fs = await import('fs/promises');
  const path = await import('path');
  const traceDir = path.join(process.cwd(), '.ultra-dex', 'traces');

  try {
    const files = await fs.readdir(traceDir);
    const match = files.find((f) => f.includes(runId) && f.endsWith('.json'));
    if (match) {
      const content = await fs.readFile(path.join(traceDir, match), 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // No trace directory or file not found
  }

  return null;
}

/**
 * List recent execution traces (last 10).
 */
async function listRecentTraces() {
  const pool = await getDbClient();

  if (pool) {
    try {
      const result = await pool.query(
        'SELECT run_id, agent, task, status, started_at, completed_at FROM execution_traces ORDER BY started_at DESC LIMIT 10'
      );
      return result.rows.map((row) => ({
        run_id: row.run_id,
        user_id: row.user_id,
        agent: row.agent,
        task: row.task,
        steps: null,
        status: row.status,
        started_at: row.started_at,
        completed_at: row.completed_at,
      }));
    } catch {
      // Fall through to file-based
    } finally {
      await pool.end();
    }
  }

  // Fallback: list trace files
  const fs = await import('fs/promises');
  const path = await import('path');
  const traceDir = path.join(process.cwd(), '.ultra-dex', 'traces');

  try {
    const files = await fs.readdir(traceDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json')).sort().reverse().slice(0, 10);

    const traces = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(traceDir, file), 'utf-8');
      traces.push(JSON.parse(content));
    }
    return traces;
  } catch {
    return [];
  }
}

/**
 * Format and display a step in the execution trace.
 */
function formatStep(index, step) {
  const agent = step.agent || step.agent_id || step.role || 'unknown';
  const provider = step.provider || step.model || '';
  const action = step.action || step.description || step.task || '';
  const durationMs = step.duration_ms;
  const status = step.status || step.result || '';

  const duration = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : '—';
  const statusIcon = status === 'completed' || status === 'success' || status === 'allowed'
    ? chalk.green('✓')
    : status === 'failed' || status === 'error' || status === 'blocked'
      ? chalk.red('✗')
      : chalk.yellow('…');

  const providerStr = provider ? ` [provider: ${provider}]` : '';
  const actionStr = action ? ` ${action}` : '';

  return `  Step ${index + 1}: ${statusIcon} [agent: ${agent}]${providerStr}${actionStr} [${duration}]`;
}

/**
 * Display the full trace with summary.
 */
function displayTrace(trace) {
  const statusColor = trace.status === 'completed'
    ? chalk.green
    : trace.status === 'failed'
      ? chalk.red
      : chalk.yellow;

  console.log(chalk.bold('\n⚡ Execution Trace Replay'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(`  Run ID:    ${chalk.cyan(trace.run_id)}`);
  console.log(`  Agent:     ${trace.agent}`);
  console.log(`  Task:      ${trace.task || '—'}`);
  console.log(`  Status:    ${statusColor(trace.status)}`);
  console.log(`  Started:   ${trace.started_at}`);
  console.log(`  Completed: ${trace.completed_at || '—'}`);
  console.log(chalk.dim('─'.repeat(50)));

  const steps = trace.steps || [];
  if (steps.length === 0) {
    console.log(chalk.yellow('\n  No steps recorded for this trace.'));
  } else {
    console.log(chalk.bold('\n  Steps:'));
    steps.forEach((step, i) => {
      console.log(formatStep(i, step));
    });
  }

  // Summary
  const totalDuration = trace.started_at && trace.completed_at
    ? (new Date(trace.completed_at).getTime() - new Date(trace.started_at).getTime()) / 1000
    : null;

  console.log(chalk.dim('\n─'.repeat(50)));
  console.log(chalk.bold('  Summary:'));
  console.log(`  Total Steps: ${steps.length}`);
  if (totalDuration !== null) {
    console.log(`  Total Time:  ${totalDuration.toFixed(1)}s`);
  }
  console.log(chalk.dim('─'.repeat(50)));
}

/**
 * Display recent traces in a table format.
 */
function displayRecentTraces(traces) {
  if (traces.length === 0) {
    console.log(chalk.yellow('No execution traces found.'));
    return;
  }

  console.log(chalk.bold('\n⚡ Recent Execution Traces'));
  console.log(chalk.dim('─'.repeat(90)));

  // Header
  console.log(
    chalk.dim(
      `  ${'Run ID'.padEnd(38)} ${'Agent'.padEnd(12)} ${'Status'.padEnd(12)} ${'Started'.padEnd(22)}`
    )
  );
  console.log(chalk.dim('─'.repeat(90)));

  traces.forEach((trace) => {
    const statusColor = trace.status === 'completed'
      ? chalk.green
      : trace.status === 'failed'
        ? chalk.red
        : chalk.yellow;

    const shortId = trace.run_id.length > 36 ? trace.run_id.slice(0, 36) + '…' : trace.run_id.padEnd(38);
    const agent = (trace.agent || '—').padEnd(12);
    const status = statusColor(trace.status).padEnd(12);
    const started = (trace.started_at || '—').slice(0, 19).padEnd(22);

    console.log(`  ${shortId} ${agent} ${status} ${started}`);
  });

  console.log(chalk.dim('─'.repeat(90)));
  console.log(chalk.dim(`\n  Use 'ultra-dex replay <run_id>' to view full trace.`));
}

/**
 * Register the replay command with the CLI program.
 */
export function registerReplayCommand(program) {
  program
    .command('replay')
    .description('Playback execution traces from previous runs')
    .argument('[run_id]', 'Execution trace run ID to replay')
    .option('--list', 'List recent execution traces')
    .option('--json', 'Output trace as JSON')
    .action(async (runId, options) => {
      try {
        // --list: show recent traces
        if (options.list) {
          const traces = await listRecentTraces();
          displayRecentTraces(traces);
          return;
        }

        // No run_id and no --list: show error
        if (!runId) {
          console.error(chalk.red('Error: Please provide a run_id or use --list to see recent traces.'));
          console.log(chalk.dim('\nUsage:'));
          console.log('  ultra-dex replay <run_id>          Show step-by-step trace');
          console.log('  ultra-dex replay <run_id> --json   Output full trace as JSON');
          console.log('  ultra-dex replay --list            List recent execution traces');
          process.exit(1);
        }

        // Fetch the trace
        const trace = await fetchTrace(runId);

        if (!trace) {
          console.error(chalk.red(`Error: No execution trace found for run_id "${runId}".`));
          process.exit(1);
        }

        // --json: output as JSON
        if (options.json) {
          console.log(JSON.stringify(trace, null, 2));
          return;
        }

        // Default: display formatted trace
        displayTrace(trace);
      } catch (err) {
        const error = err;
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}
