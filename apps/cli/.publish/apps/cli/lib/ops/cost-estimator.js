// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const DEFAULT_RATES = {
  vercelBase: 20,
  vercelPer1000DAU: 15,
  dbPerGb: 1.5,
  storagePerGb: 0.15,
  bandwidthPerGb: 0.09,
};

export function estimateInfraCost({
  dailyActiveUsers = 1000,
  storagePerUserMb = 50,
  bandwidthGb = 500,
  rates = {},
} = {}) {
  const pricing = { ...DEFAULT_RATES, ...rates };
  const monthlyActiveUsers = dailyActiveUsers * 30;
  const storageGb = (dailyActiveUsers * storagePerUserMb) / 1024;

  const vercel = Math.max(pricing.vercelBase, (dailyActiveUsers / 1000) * pricing.vercelPer1000DAU);
  const db = storageGb * pricing.dbPerGb;
  const storage = storageGb * pricing.storagePerGb;
  const bandwidth = bandwidthGb * pricing.bandwidthPerGb;

  const total = vercel + db + storage + bandwidth;

  return {
    inputs: {
      dailyActiveUsers,
      monthlyActiveUsers,
      storagePerUserMb,
      bandwidthGb,
    },
    breakdown: {
      vercel,
      db,
      storage,
      bandwidth,
    },
    total,
  };
}

export function registerCostEstimatorCommand(program) {
  program
    .command('infra-cost')
    .description('Estimate monthly infrastructure cost for a SaaS project')
    .option('--dau <number>', 'Daily active users', (value) => parseInt(value, 10), 1000)
    .option('--storage-per-user <mb>', 'Storage per user (MB)', (value) => parseFloat(value), 50)
    .option('--bandwidth <gb>', 'Monthly bandwidth (GB)', (value) => parseFloat(value), 500)
    .option('--budget <usd>', 'Alert when total exceeds budget', (value) => parseFloat(value))
    .action((options) => {
      const estimate = estimateInfraCost({
        dailyActiveUsers: options.dau,
        storagePerUserMb: options.storagePerUser,
        bandwidthGb: options.bandwidth,
      });

      printInfo(chalk.cyan('\nInfrastructure Cost Estimate\n'));
      printInfo(`Daily Active Users: ${estimate.inputs.dailyActiveUsers}`);
      printInfo(`Storage/User: ${estimate.inputs.storagePerUserMb} MB`);
      printInfo(`Bandwidth: ${estimate.inputs.bandwidthGb} GB / month\n`);

      printInfo(chalk.bold('Breakdown (monthly):'));
      printInfo(`Vercel/Compute: $${estimate.breakdown.vercel.toFixed(2)}`);
      printInfo(`Database: $${estimate.breakdown.db.toFixed(2)}`);
      printInfo(`Storage: $${estimate.breakdown.storage.toFixed(2)}`);
      printInfo(`Bandwidth: $${estimate.breakdown.bandwidth.toFixed(2)}`);

      printSuccess(chalk.green(`\nEstimated Total: $${estimate.total.toFixed(2)} / month\n`));

      if (Number.isFinite(options.budget) && estimate.total > options.budget) {
        printWarning(
          chalk.yellow(
            `⚠️  Budget threshold exceeded: $${estimate.total.toFixed(2)} > $${options.budget}`
          )
        );
      }
    });
}

export default {
  estimateInfraCost,
  registerCostEstimatorCommand,
};

/**
 * Handle errors in cost-estimator module
 * @param {Error} error - The error to handle
 * @param {string} [context='cost-estimator'] - Error context
 */
function _handleModuleError(error, context = 'cost-estimator') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
