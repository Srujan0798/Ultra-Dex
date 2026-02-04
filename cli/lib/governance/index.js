/**
 * Agent Governance Engine
 * Enforces security, role-based access, and constitutional AI rules
 */

import path from 'path';
import { 
  ROLE_DEFINITIONS, 
  FILE_TYPE_DEFINITIONS, 
  SENSITIVE_PATH_PATTERNS, 
  FILE_ACCESS_RULES,
  DESTRUCTIVE_COMMAND_PATTERNS 
} from './rules.js';
import { printWarning, printError } from '../utils/output.js';
import { configManager } from '../utils/config-manager.js';

export class GovernanceEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    this.config = null;
  }

  async init() {
    // Load project-specific governance config if available
    const globalConfig = await configManager.load();
    this.config = globalConfig?.governance || {};
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
    
    // 1. Constitutional Checks (Global Bans)
    if (action === 'execute') {
      if (this.isDestructiveCommand(target)) {
        return { allowed: false, reason: 'Command is destructive and banned by constitution.' };
      }
    }

    if (action === 'write' || action === 'read') {
      if (this.isSensitivePath(target)) {
        // Strict sensitive file block
        return { allowed: false, reason: `Access to sensitive file '${path.basename(target)}' is restricted.` };
      }
      
      // Path Traversal Check
      if (!this.isPathSafe(target)) {
        return { allowed: false, reason: 'Path traversal detected. Stay within project root.' };
      }
    }

    // 2. Role-Based Access Control (RBAC)
    if (!this.checkRolePermission(roleDef, action, target)) {
      return { 
        allowed: false, 
        reason: `Role '${agentRole}' is not authorized to ${action} ${this.getFileType(target)} files.` 
      };
    }

    // 3. User Configuration (Allow/Block Lists)
    if (this.config) {
      if (this.isBlockedByConfig(target)) {
        return { allowed: false, reason: 'Blocked by project configuration.' };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if command is destructive
   */
  isDestructiveCommand(command) {
    return DESTRUCTIVE_COMMAND_PATTERNS.some(pattern => pattern.test(command));
  }

  /**
   * Check if path is sensitive
   */
  isSensitivePath(filePath) {
    const relPath = path.isAbsolute(filePath) ? path.relative(this.projectRoot, filePath) : filePath;
    return SENSITIVE_PATH_PATTERNS.some(pattern => pattern.test(relPath) || pattern.test('/' + relPath));
  }

  /**
   * Check if path is safe (within project root)
   */
  isPathSafe(filePath) {
    const resolved = path.resolve(this.projectRoot, filePath);
    return resolved.startsWith(this.projectRoot);
  }

  /**
   * Check if blocked by user config
   */
  isBlockedByConfig(target) {
    if (!this.config?.blocklist) return false;
    // Simple substring match for now, could be glob
    return this.config.blocklist.some(term => target.includes(term));
  }

  /**
   * Determine file type ID
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const relPath = path.isAbsolute(filePath) ? path.relative(this.projectRoot, filePath) : filePath;

    // Check patterns first
    for (const type of FILE_TYPE_DEFINITIONS) {
      if (type.patterns) {
        if (type.patterns.some(p => p.test(relPath))) return type.id;
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
      typeId = 'shell'; // Default for execute unless specifically classified
      // In future, we could classify commands
    } else {
      typeId = this.getFileType(target);
    }

    return permissions.includes(typeId);
  }
}

export const governance = new GovernanceEngine();