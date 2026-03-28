#!/usr/bin/env node

import { runTutorial } from '../lib/learn.js';

async function main() {
  try {
    await runTutorial();
  } catch (error) {
    console.error(`\x1b[31mError running tutorial: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();