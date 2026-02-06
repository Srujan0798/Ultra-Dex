// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { printInfo, printWarning, printSuccess } from '../utils/output.js';

const STATES = ['PLAN', 'ACT', 'VERIFY', 'RECOVER', 'COMMIT'];

export async function runRalphLoop(options = {}) {
  const { plan, act, verify, recover, commit, maxRetries = 3 } = options;

  let state = 'PLAN';
  let retries = 0;
  let context = {};

  while (true) {
    switch (state) {
      case 'PLAN':
        printInfo(chalk.cyan('Ralph: Planning'));
        if (plan) context = await plan(context);
        state = 'ACT';
        break;
      case 'ACT':
        printInfo(chalk.cyan('Ralph: Acting'));
        if (act) context = await act(context);
        state = 'VERIFY';
        break;
      case 'VERIFY':
        printInfo(chalk.cyan('Ralph: Verifying'));
        if (verify) {
          const result = await verify(context);
          if (result?.ok) {
            state = 'COMMIT';
          } else {
            context.lastError = result?.error || 'Verification failed';
            state = 'RECOVER';
          }
        } else {
          state = 'COMMIT';
        }
        break;
      case 'RECOVER':
        retries += 1;
        printWarning(chalk.yellow(`Ralph: Recovering (attempt ${retries}/${maxRetries})`));
        if (recover) context = await recover(context);
        if (retries >= maxRetries) {
          throw new Error(
            `Ralph loop failed after ${maxRetries} retries: ${context.lastError || 'Unknown error'}`
          );
        }
        state = 'ACT';
        break;
      case 'COMMIT':
        printSuccess(chalk.green('Ralph: Committing'));
        if (commit) await commit(context);
        return context;
      default:
        throw new Error(`Unknown Ralph state: ${state}`);
    }
  }
}

export { STATES };
