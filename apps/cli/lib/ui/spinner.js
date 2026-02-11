// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Spinner module
 * @module ui/spinner
 */

import ora from 'ora';
import { theme } from './theme.js';

const quantumSpinner = {
  interval: 80,
  frames: ['⟡', '⟡⟐', '⟡⟐⟡', '⟡⟐⟡⟐', '⟡⟐⟡', '⟡⟐', '⟡'],
};

export function createQuantumSpinner(text = 'Quantum Stabilizing...') {
  return ora({
    text: theme.dim(text),
    spinner: quantumSpinner,
  });
}

export async function runMultiStep(steps) {
  for (const step of steps) {
    const spinner = createQuantumSpinner(step.label || 'Working...');
    spinner.start();
    try {
      await step.run();
      spinner.succeed(theme.success(step.label || 'Done'));
    } catch (error) {
      spinner.fail(theme.error(`${step.label}: ${error.message}`));
      throw error;
    }
  }
}

export default {
  createQuantumSpinner,
  runMultiStep,
};
