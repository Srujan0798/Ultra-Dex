// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Verification Checklist Runner (21-step)
 * Provides a unified checklist for quality gates and post-tool-use hooks.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  verifyArchitectureAlignment,
  verifyErrorHandlingStrategy,
  verifyApiDocumentation,
  verifyDatabaseSchema,
  verifyEnvironmentVariables,
  verifyTypeSafety,
  verifyUnitTests,
  verifyLinting,
  verifySecurityPatterns,
  verifyConsoleLogs,
  verifyContextLoaded,
  verifyAccessibility,
  verifyPerformance,
  verifyDeploymentReadiness,
  verifyMigrationScripts,
} from './automation.js';

const CHECKLIST_STEPS = [
  'Atomic Scope Defined',
  'Context Loaded',
  'Architecture Alignment',
  'Security Patterns Applied',
  'Type Safety Check',
  'Error Handling Strategy',
  'API Documentation Updated',
  'Database Schema Verified',
  'Environment Variables Set',
  'Implementation Complete',
  'Console Logs Removed',
  'Edge Cases Handled',
  'Performance Check',
  'Accessibility (A11y) Check',
  'Cross-browser Check',
  'Unit Tests Passed',
  'Integration Tests Passed',
  'Linting & Formatting',
  'Code Review Approved',
  'Migration Scripts Ready',
  'Deployment Readiness',
];

const HEAVY_STEPS = new Set([
  'Type Safety Check',
  'Unit Tests Passed',
  'Linting & Formatting',
  'Integration Tests Passed',
]);

function skipStep(message) {
  return { status: 'SKIP', message };
}

async function verifyIntegrationTests(projectDir, fastMode) {
  if (fastMode) {
    return skipStep('Skipped integration tests in fast mode');
  }

  try {
    const content = await fs.readFile(path.join(projectDir, 'package.json'), 'utf8');
    const pkg = JSON.parse(content);
    const integrationScript =
      pkg.scripts?.['test:integration'] ||
      pkg.scripts?.integration ||
      pkg.scripts?.['test:integration:ci'];

    if (!integrationScript) {
      return skipStep('No integration test script found');
    }

    const { execSync } = await import('child_process');
    try {
      execSync('npm run test:integration', { stdio: 'ignore', cwd: projectDir });
      return { status: 'PASS', message: 'Integration tests passed' };
    } catch (_error) {
      return { status: 'FAIL', message: 'Integration tests failed' };
    }
  } catch {
    return skipStep('Unable to read package.json for integration tests');
  }
}

function evaluateManualStep(name, context) {
  switch (name) {
    case 'Atomic Scope Defined':
      if (context?.task || context?.reason) {
        return { status: 'PASS', message: 'Scope provided by task context' };
      }
      return skipStep('Manual confirmation required');
    case 'Implementation Complete':
      return skipStep('Manual confirmation required');
    case 'Edge Cases Handled':
      return skipStep('Manual confirmation required');
    case 'Cross-browser Check':
      return skipStep('Manual confirmation required');
    case 'Code Review Approved':
      if (
        process.env.CODE_REVIEW_APPROVED === 'true' ||
        process.env.ULTRA_DEX_CODE_REVIEW === 'approved'
      ) {
        return { status: 'PASS', message: 'Code review approval set via env' };
      }
      return skipStep('Manual approval required');
    default:
      return skipStep('Manual confirmation required');
  }
}

export async function runVerificationChecklist(projectDir, options = {}) {
  const results = [];
  const fastMode = options.fast === true;

  const automatedSteps = {
    'Context Loaded': verifyContextLoaded,
    'Architecture Alignment': verifyArchitectureAlignment,
    'Security Patterns Applied': verifySecurityPatterns,
    'Type Safety Check': verifyTypeSafety,
    'Error Handling Strategy': verifyErrorHandlingStrategy,
    'API Documentation Updated': verifyApiDocumentation,
    'Database Schema Verified': verifyDatabaseSchema,
    'Environment Variables Set': verifyEnvironmentVariables,
    'Console Logs Removed': verifyConsoleLogs,
    'Accessibility (A11y) Check': verifyAccessibility,
    'Performance Check': verifyPerformance,
    'Unit Tests Passed': verifyUnitTests,
    'Linting & Formatting': verifyLinting,
    'Migration Scripts Ready': verifyMigrationScripts,
    'Deployment Readiness': verifyDeploymentReadiness,
  };

  for (const step of CHECKLIST_STEPS) {
    try {
      if (step === 'Integration Tests Passed') {
        const result = await verifyIntegrationTests(projectDir, fastMode);
        results.push({ step, ...result });
        continue;
      }

      const automated = automatedSteps[step];
      if (automated) {
        if (fastMode && HEAVY_STEPS.has(step)) {
          results.push({ step, ...skipStep('Skipped in fast mode') });
          continue;
        }

        const res = await automated(projectDir);
        results.push({ step, ...res });
        continue;
      }

      results.push({ step, ...evaluateManualStep(step, options.context) });
    } catch (error) {
      results.push({ step, status: 'FAIL', message: error.message });
    }
  }

  const failures = results.filter((r) => r.status === 'FAIL');
  return {
    results,
    failures,
    passed: failures.length === 0,
    summary: {
      total: results.length,
      failed: failures.length,
      skipped: results.filter((r) => r.status === 'SKIP').length,
    },
  };
}

export { CHECKLIST_STEPS };
