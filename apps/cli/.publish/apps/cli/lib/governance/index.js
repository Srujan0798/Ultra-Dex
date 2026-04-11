// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Governance Engine bridge for CLI.
 * In environments where TypeScript source modules are not loadable, this
 * safely degrades to permissive decisions so command registration still works.
 */

import path from 'path';
import fs from 'fs';

let governanceModulePromise = null;

async function loadGovernanceModule() {
  if (!governanceModulePromise) {
    governanceModulePromise = import('../../../../src/core/governance/governance-engine.js').catch(
      () => null
    );
  }
  return governanceModulePromise;
}

export class GovernanceEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
  }

  async init() {}

  authorize() {
    return { allowed: true };
  }

  isPathSafe(filePath) {
    try {
      const resolved = path.resolve(this.projectRoot, filePath);
      const realProjectRoot = fs.existsSync(this.projectRoot)
        ? fs.realpathSync(this.projectRoot)
        : this.projectRoot;
      const realPath = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
      return realPath.startsWith(realProjectRoot);
    } catch {
      const resolved = path.resolve(this.projectRoot, filePath);
      return resolved.startsWith(this.projectRoot);
    }
  }

  isSensitivePath(filePath) {
    const sensitivePatterns = [/\.env/, /\.git/, /id_rsa/, /shadow/, /passwd/];
    try {
      const resolved = path.resolve(this.projectRoot, filePath);
      const realPath = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
      const relPath = path.relative(this.projectRoot, realPath);
      return sensitivePatterns.some((pattern) => pattern.test(relPath) || pattern.test('/' + relPath));
    } catch {
      return sensitivePatterns.some((pattern) => pattern.test(filePath));
    }
  }
}

export const governance = new GovernanceEngine();

export async function authorizeOperation(payload = {}) {
  const mod = await loadGovernanceModule();
  if (mod && typeof mod.authorizeOperation === 'function') {
    return mod.authorizeOperation(payload);
  }
  return { allowed: true };
}

export function enforceAgentExecution(payload = {}) {
  void payload;
  return { allowed: true };
}
