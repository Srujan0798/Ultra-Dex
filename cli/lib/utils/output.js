// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { formatError, formatWarning, formatInfo, formatSuccess, formatStatus } from './status.js';

export function printError(message, err) {
  console.log(formatError(message));
  if (err?.message) {
    console.log(chalk.gray(`  → ${err.message}`));
  }
}

export function printWarning(message) {
  console.log(formatWarning(message));
}

export function printInfo(message) {
  console.log(formatInfo(message));
}

export function printSuccess(message) {
  console.log(formatSuccess(message));
}
