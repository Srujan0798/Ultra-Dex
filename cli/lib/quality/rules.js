// Copyright (c) 2026 Ultra-Dex

/**
 * Quality gate rules
 */

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_RULES = {
  gates: {
    'p0-complete': { threshold: 100, severity: 'error' },
    alignment: { threshold: 80, severity: 'error' },
    'test-coverage': { threshold: 70, severity: 'warning' },
    'lint-clean': { threshold: 0, severity: 'error' },
    'security-critical': { threshold: 0, severity: 'error' },
  },
  ignore: ['docs/**', '*.test.js'],
};

export async function loadQualityRules(projectDir = process.cwd()) {
  const configPath = path.join(projectDir, 'quality-gate.json');
  try {
    const content = await fs.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return DEFAULT_RULES;
  }
}

export default {
  loadQualityRules,
  DEFAULT_RULES,
};
