// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Slicer module
 * @module context/slicer
 */

import path from 'path';

const RULE_MAP = [
  { keyword: /auth|login|signup/i, rule: 'rules/auth.mdc' },
  { keyword: /db|database|schema|prisma/i, rule: 'rules/db.mdc' },
  { keyword: /security|owasp|xss|csrf/i, rule: 'rules/security.mdc' },
  { keyword: /frontend|ui|ux|react/i, rule: 'rules/frontend.mdc' },
  { keyword: /backend|api|server/i, rule: 'rules/backend.mdc' },
];

export function selectRules(task, baseDir = '.cursor') {
  if (!task) return [];
  const matched = RULE_MAP.filter((entry) => entry.keyword.test(task)).map((entry) =>
    path.join(baseDir, entry.rule)
  );
  return Array.from(new Set(matched));
}

/**
 * Handle errors in slicer module
 * @param {Error} error - The error to handle
 * @param {string} [context='slicer'] - Error context
 */
function _handleModuleError(error, context = 'slicer') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
