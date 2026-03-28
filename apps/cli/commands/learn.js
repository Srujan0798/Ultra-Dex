#!/usr/bin/env node

import { runTutorial } from '../lib/learn.js';
import { logger } from '../lib/utils/logger.js';

async function main() {
  try {
    await runTutorial();
  } catch (error) {
    logger.error(`Error running tutorial: ${error.message}`, {
      error: error.message,
      stack: process.env.DEBUG === 'true' ? error.stack : undefined
    });
    process.exit(1);
  }
}

main();