// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printWarning } from '../utils/output.js';

const POLICY_DIR = path.join(process.cwd(), '.ultra-dex', 'governance');
const AUDIT_LOG = path.join(POLICY_DIR, 'data-access.jsonl');

export const DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'];

export const DEFAULT_RETENTION_DAYS = {
  logs: 30,
  analytics: 90,
  pii: 365,
  backups: 30,
};

export function classifyData({
  containsPII = false,
  containsSecrets = false,
  exposure = 'internal',
} = {}) {
  if (containsSecrets) return 'restricted';
  if (containsPII) return 'confidential';
  if (exposure === 'public') return 'public';
  return 'internal';
}

export function getRetentionPolicy(type) {
  return DEFAULT_RETENTION_DAYS[type] || 30;
}

export async function recordAccess({ actor, resource, classification, reason }) {
  await fs.mkdir(POLICY_DIR, { recursive: true });
  const entry = {
    timestamp: new Date().toISOString(),
    actor,
    resource,
    classification,
    reason,
  };
  await fs.appendFile(AUDIT_LOG, JSON.stringify(entry) + '\n');
  return entry;
}

export async function purgeExpiredData({ datasets = [] } = {}) {
  await fs.mkdir(POLICY_DIR, { recursive: true });
  const now = Date.now();
  const results = [];

  for (const dataset of datasets) {
    const retentionDays = getRetentionPolicy(dataset.type);
    const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
    const expired = (dataset.records || []).filter(
      (record) => new Date(record.timestamp).getTime() < cutoff
    );
    results.push({
      name: dataset.name,
      type: dataset.type,
      retentionDays,
      expiredCount: expired.length,
    });
  }

  return results;
}

export function registerDataGovernanceCommand(program) {
  program
    .command('governance')
    .description('Data governance and retention utilities')
    .option('--classify', 'Classify a data asset')
    .option('--type <type>', 'Dataset type (logs|analytics|pii|backups)')
    .option('--contains-pii', 'Mark asset as PII')
    .option('--contains-secrets', 'Mark asset as restricted')
    .option('--exposure <level>', 'Exposure level (public|internal)', 'internal')
    .action((options) => {
      if (options.classify) {
        const classification = classifyData({
          containsPII: options.containsPii,
          containsSecrets: options.containsSecrets,
          exposure: options.exposure,
        });
        printInfo(`Classification: ${classification}`);
        printInfo(`Retention: ${getRetentionPolicy(options.type || 'logs')} days`);
        return;
      }
      printWarning('Use --classify to classify data assets.');
    });
}

export default {
  classifyData,
  getRetentionPolicy,
  purgeExpiredData,
  recordAccess,
  registerDataGovernanceCommand,
};

/**
 * Safe execution wrapper with error handling for data-policy
 * @param {Function} fn - Async function to execute
 * @param {string} [context='data-policy'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'data-policy') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
