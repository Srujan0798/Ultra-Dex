import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { DaemonServer } from '../daemon/server.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const STATE_PATH = path.resolve(process.cwd(), '.ultra-dex', 'daemon', 'state.json');

async function writeState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

async function readState() {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function registerDaemonCommand(program) {
  const cmd = program.command('daemon').description('24/7 development agent daemon');

  cmd
    .command('start')
    .action(async () => {
      const daemon = new DaemonServer();
      daemon.on('log', (message) => printInfo(chalk.gray(message)));
      daemon.on('started', async (payload) => {
        await writeState({ status: 'running', startedAt: payload.startedAt });
        printSuccess(chalk.green('Daemon started. Press Ctrl+C to stop.'));
      });
      daemon.start();

      process.on('SIGINT', async () => {
        daemon.stop();
        await writeState({ status: 'stopped', stoppedAt: new Date().toISOString() });
        process.exit(0);
      });

      process.stdin.resume();
    });

  cmd
    .command('status')
    .action(async () => {
      const state = await readState();
      if (!state) {
        printWarning(chalk.yellow('Daemon not running.'));
        return;
      }
      printInfo(chalk.cyan(`Status: ${state.status}`));
      if (state.startedAt) printInfo(chalk.gray(`Started: ${state.startedAt}`));
    });

  cmd
    .command('stop')
    .action(async () => {
      const state = await readState();
      if (!state || state.status !== 'running') {
        printWarning(chalk.yellow('Daemon not running.'));
        return;
      }
      await writeState({ status: 'stopped', stoppedAt: new Date().toISOString() });
      printSuccess(chalk.green('Daemon stop requested.'));
    });

  cmd
    .command('logs')
    .action(() => {
      printInfo(chalk.gray('Daemon logs are emitted during runtime. Use your process manager logs.'));
    });

  cmd.on('command:*', () => {
    printError(chalk.red('Unknown daemon command.'));
  });
}
