// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Governance Engine
 * Enforces security, role-based access, and constitutional AI rules
 */

import fs from 'fs';
import path from 'path';
import {
  ROLE_DEFINITIONS,
  FILE_TYPE_DEFINITIONS,
  SENSITIVE_PATH_PATTERNS,
  FILE_ACCESS_RULES,
  DESTRUCTIVE_COMMAND_PATTERNS,
} from './rules.js';
import { configManager } from '../utils/config-manager.js';
import { initializeGovernanceAuditSink } from './audit.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class GovernanceEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.config = null;
    this.initialized = false;
    this.initializing = null;
  }

  async init() {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      // Load project-specific governance config if available
      const globalConfig = await configManager.load();
      this.config = globalConfig?.governance || {};
      this.initialized = true;
      this.initializing = null;
    })();

    return this.initializing;
  }

  /**
   * Authorize an action for an agent
   * @param {string} agentRole - Role of the agent (e.g., 'backend', 'planner')
   * @param {string} action - Action type ('read', 'write', 'execute')
   * @param {string} target - Target path or command
   * @returns {Object} { allowed: boolean, reason: string }
   */
  authorize(agentRole, action, target) {
    const roleDef = ROLE_DEFINITIONS[agentRole] || ROLE_DEFINITIONS.default;
    const normalizedTarget = this.normalizeTarget(target);

    // 1. Constitutional Checks (Global Bans)
    if (action === 'execute') {
      if (this.isDestructiveCommand(normalizedTarget)) {
        return { allowed: false, reason: 'Command is destructive and banned by constitution.' };
      }
    }

    if (action === 'write' || action === 'read') {
      if (this.isSensitivePath(normalizedTarget)) {
        // Strict sensitive file block
        return {
          allowed: false,
          reason: `Access to sensitive file '${path.basename(normalizedTarget)}' is restricted.`,
        };
      }

      // Path Traversal Check
      if (!this.isPathSafe(normalizedTarget)) {
        return { allowed: false, reason: 'Path traversal detected. Stay within project root.' };
      }

      const accessRule = this.getFileAccessRule(action, normalizedTarget);
      if (accessRule) {
        return { allowed: false, reason: accessRule.reason || 'Blocked by file access policy.' };
      }
    }

    // 2. Role-Based Access Control (RBAC)
    if (!this.checkRolePermission(roleDef, action, normalizedTarget)) {
      return {
        allowed: false,
        reason: `Role '${agentRole}' is not authorized to ${action} ${this.getFileType(normalizedTarget)} files.`,
      };
    }

    // 3. User Configuration (Allow/Block Lists)
    if (this.config) {
      if (!this.isAllowedByConfig(normalizedTarget)) {
        return { allowed: false, reason: 'Blocked by allowlist policy.' };
      }

      if (this.isBlockedByConfig(normalizedTarget)) {
        return { allowed: false, reason: 'Blocked by project configuration.' };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if command is destructive
   */
  isDestructiveCommand(command) {
    return DESTRUCTIVE_COMMAND_PATTERNS.some((pattern) => pattern.test(command));
  }

  /**
   * Check if path is sensitive
   */
  isSensitivePath(filePath) {
    try {
      const resolved = path.resolve(this.projectRoot, filePath);
      // Resolve symlinks to their real path
      const realPath = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
      const relPath = path.isAbsolute(realPath)
        ? path.relative(this.projectRoot, realPath)
        : realPath;
      return SENSITIVE_PATH_PATTERNS.some(
        (pattern) => pattern.test(relPath) || pattern.test('/' + relPath)
      );
    } catch {
      // If realpathSync fails, fall back to normal path check
      const relPath = path.isAbsolute(filePath)
        ? path.relative(this.projectRoot, filePath)
        : filePath;
      return SENSITIVE_PATH_PATTERNS.some(
        (pattern) => pattern.test(relPath) || pattern.test('/' + relPath)
      );
    }
  }

  /**
   * Check if path is safe (within project root)
   */
  isPathSafe(filePath) {
    try {
      const resolved = path.resolve(this.projectRoot, filePath);
      // Get real project root path
      const realProjectRoot = fs.existsSync(this.projectRoot)
        ? fs.realpathSync(this.projectRoot)
        : this.projectRoot;
      // Resolve symlinks to their real path
      const realPath = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
      return realPath.startsWith(realProjectRoot);
    } catch {
      // If realpathSync fails (e.g., file doesn't exist), fall back to path resolution
      const resolved = path.resolve(this.projectRoot, filePath);
      return resolved.startsWith(this.projectRoot);
    }
  }

  /**
   * Check if blocked by user config
   */
  isBlockedByConfig(target) {
    if (!this.config?.blocklist) return false;
    return this.matchesConfiguredPatterns(this.config.blocklist, target);
  }

  isAllowedByConfig(target) {
    if (!this.config?.allowlist || this.config.allowlist.length === 0) return true;
    return this.matchesConfiguredPatterns(this.config.allowlist, target);
  }

  matchesConfiguredPatterns(patterns, target) {
    if (!Array.isArray(patterns)) return false;
    return patterns.some((pattern) => {
      if (!pattern) return false;
      if (pattern instanceof RegExp) return pattern.test(target);
      if (typeof pattern !== 'string') return false;
      const trimmed = pattern.trim();
      if (trimmed.length === 0) return false;
      if (trimmed.includes('*')) {
        const regex = new RegExp(
          '^' + trimmed.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
        );
        return regex.test(target);
      }
      return target.includes(trimmed);
    });
  }

  /**
   * Determine file type ID
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const relPath = path.isAbsolute(filePath)
      ? path.relative(this.projectRoot, filePath)
      : filePath;

    // Check patterns first
    for (const type of FILE_TYPE_DEFINITIONS) {
      if (type.patterns) {
        if (type.patterns.some((p) => p.test(relPath))) return type.id;
      }
    }

    // Check extensions
    for (const type of FILE_TYPE_DEFINITIONS) {
      if (type.extensions && type.extensions.includes(ext)) return type.id;
    }

    return 'unknown';
  }

  /**
   * Check RBAC
   */
  checkRolePermission(roleDef, action, target) {
    const permissions = roleDef.permissions[action];

    if (!permissions) return false; // No permissions for this action type defined
    if (permissions.includes('*')) return true; // Superuser for this action

    let typeId = 'unknown';
    if (action === 'execute') {
      if (target && ['ai', 'shell', 'tests'].includes(target)) {
        typeId = target;
      } else {
        typeId = 'shell'; // Default for execute unless specifically classified
      }
    } else {
      typeId = this.getFileType(target);
    }

    return permissions.includes(typeId);
  }

  /**
   * Normalize a target path/command for consistent checks
   */
  normalizeTarget(target) {
    if (!target || typeof target !== 'string') return '';
    const trimmed = target.trim();
    if (trimmed.length === 0) return '';
    if (path.isAbsolute(trimmed)) {
      return path.relative(this.projectRoot, trimmed);
    }
    return trimmed;
  }

  /**
   * Enforce file access rules (deny rules)
   */
  getFileAccessRule(action, target) {
    for (const rule of FILE_ACCESS_RULES) {
      if (rule.pattern && rule.pattern.test(target) && rule.deny?.includes(action)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Check if text contains sensitive path patterns
   */
  containsSensitivePath(text) {
    if (!text) return false;
    return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(text));
  }

  /**
   * Check if text contains destructive command patterns
   */
  containsDestructiveCommand(text) {
    if (!text) return false;
    return DESTRUCTIVE_COMMAND_PATTERNS.some((pattern) => pattern.test(text));
  }
}

export const governance = new GovernanceEngine();

function emitGovernanceOperation(entry) {
  initializeGovernanceAuditSink();
  void logger.event('governance.operation', entry, {
    console: false,
    source: 'governance',
  });
}

export async function authorizeOperation({
  agent,
  operation,
  resourceType,
  filePath,
  command,
  content,
  metadata,
} = {}) {
  await governance.init();
  const roleId = agent?.roleId || agent?.id || 'default';

  let target = filePath || command || resourceType || '';
  let action = operation || 'execute';
  if (action === 'delegate') {
    action = 'execute';
    target = 'ai';
  }

  if (resourceType === 'ai') {
    // Router-level constitutional checks for AI execution
    const text = [metadata?.task, metadata?.prompt, content].filter(Boolean).join('\n');
    if (governance.containsDestructiveCommand(text)) {
      const decision = {
        allowed: false,
        reason: 'AI request includes destructive command patterns.',
      };
      emitGovernanceOperation({ agent, operation, resourceType, target, ...decision, metadata });
      return decision;
    }
    if (governance.containsSensitivePath(text)) {
      const decision = { allowed: false, reason: 'AI request references sensitive files.' };
      emitGovernanceOperation({ agent, operation, resourceType, target, ...decision, metadata });
      return decision;
    }
  }

  const decision = governance.authorize(roleId, action, target);
  emitGovernanceOperation({
    agent,
    operation,
    resourceType,
    target,
    allowed: decision.allowed,
    reason: decision.reason,
    metadata,
    content,
  });
  return decision;
}

export function enforceAgentExecution({ agent, _providerId, task, systemPrompt, userPrompt } = {}) {
  const roleId = agent?.roleId || agent?.id || 'default';
  // All AI providers are authorized under 'ai' execution target
  const target = 'ai';

  const decision = governance.authorize(roleId, 'execute', target);
  if (!decision.allowed) {
    throw new AppError(`Governance blocked AI execution: ${decision.reason}`);
  }

  const combined = [task, systemPrompt, userPrompt].filter(Boolean).join('\n');
  if (governance.containsDestructiveCommand(combined)) {
    throw new AppError('Governance blocked AI execution: destructive command patterns detected.');
  }
  if (governance.containsSensitivePath(combined)) {
    throw new AppError('Governance blocked AI execution: sensitive file references detected.');
  }
  if (governance.isBlockedByConfig(combined)) {
    throw new AppError('Governance blocked AI execution: blocked by configuration.');
  }

  emitGovernanceOperation({
    agent,
    operation: 'execute',
    resourceType: 'ai',
    target,
    allowed: true,
    metadata: { task },
  });

  return true;
}

/**
 * Safe execution wrapper with error handling for index
 * @param {Function} fn - Async function to execute
 * @param {string} [context='index'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'index') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
