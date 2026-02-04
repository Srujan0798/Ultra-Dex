/**
 * Agent governance / constitutional AI layer
 */

import path from 'path';
import {
  ROLE_DEFINITIONS,
  FILE_TYPE_DEFINITIONS,
  SENSITIVE_PATH_PATTERNS,
  FILE_ACCESS_RULES,
  DESTRUCTIVE_COMMAND_PATTERNS,
} from './rules.js';
import { logOperation } from './audit.js';

const PROJECT_ROOT = process.cwd();

function normalizePath(inputPath) {
  if (!inputPath) return null;
  const normalized = path.normalize(inputPath);
  return normalized.split(path.sep).join('/');
}

export function getFileType(filePath) {
  if (!filePath) return 'unknown';
  const normalized = normalizePath(filePath);
  const ext = path.extname(normalized).toLowerCase();

  for (const def of FILE_TYPE_DEFINITIONS) {
    if (def.extensions?.includes(ext)) return def.id;
    if (def.patterns?.some(pattern => pattern.test(normalized))) return def.id;
  }

  return 'unknown';
}

export function isSensitivePath(filePath) {
  if (!filePath) return false;
  const normalized = normalizePath(filePath);
  return SENSITIVE_PATH_PATTERNS.some(pattern => pattern.test(normalized));
}

function resolveAgentProfile(agent) {
  if (!agent) return { id: 'unknown', roleId: 'default', role: ROLE_DEFINITIONS.default };
  if (typeof agent === 'string') {
    const roleId = agent.toLowerCase();
    return { id: roleId, roleId, role: ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.default };
  }

  const id = (agent.id || agent.name || 'unknown').toString().toLowerCase();
  const roleId = (agent.roleId || agent.role || id || 'default').toString().toLowerCase();
  const role = ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.default;
  return {
    id,
    name: agent.name || id,
    roleId,
    role,
  };
}

function hasPermission(role, operation, fileType) {
  const permissions = role?.permissions || {};
  const allowed = permissions[operation] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(fileType);
}

function checkFileAccessRules(filePath, operation, roleId) {
  if (!filePath) return null;
  const normalized = normalizePath(filePath);

  for (const rule of FILE_ACCESS_RULES) {
    if (rule.pattern.test(normalized)) {
      const deny = rule.deny || [];
      if (deny.includes(operation)) {
        return {
          id: rule.id,
          reason: rule.reason || 'File-level access rule blocked operation',
        };
      }
    }
  }

  return null;
}

function isDestructiveCommand(command) {
  if (!command) return false;
  return DESTRUCTIVE_COMMAND_PATTERNS.some(pattern => pattern.test(command));
}

function evaluateOperationContext(context) {
  const agentProfile = resolveAgentProfile(context.agent);
  const operation = context.operation;
  const command = context.command;
  const resourceType = context.resourceType;
  const rawPath = context.filePath;
  const normalizedPath = normalizePath(rawPath);
  const resolvedPath = rawPath ? path.resolve(PROJECT_ROOT, rawPath) : null;
  const outsideRoot = resolvedPath ? !resolvedPath.startsWith(PROJECT_ROOT) : false;
  const pathTraversal = normalizedPath ? normalizedPath.split('/').includes('..') : false;
  const sensitive = normalizedPath ? isSensitivePath(normalizedPath) : false;

  let fileType = context.fileType;
  if (!fileType) {
    if (operation === 'execute' && command) {
      fileType = 'shell';
    } else if (operation === 'execute' && resourceType === 'ai') {
      fileType = 'ai';
    } else {
      fileType = getFileType(normalizedPath);
    }
  }

  if (operation === 'delegate') {
    return {
      allowed: true,
      ruleId: 'allow',
      reason: 'Delegation allowed',
      fileType,
      agentProfile,
    };
  }

  // Constitutional checks
  if (pathTraversal) {
    return { allowed: false, ruleId: 'no-path-traversal', reason: 'Path traversal detected', fileType, agentProfile };
  }

  if (outsideRoot) {
    return { allowed: false, ruleId: 'stay-in-repo', reason: 'Path resolves outside project root', fileType, agentProfile };
  }

  if (sensitive) {
    return { allowed: false, ruleId: 'block-sensitive', reason: 'Sensitive file access blocked', fileType, agentProfile };
  }

  const fileRule = checkFileAccessRules(normalizedPath, operation, agentProfile.roleId);
  if (fileRule) {
    return { allowed: false, ruleId: fileRule.id, reason: fileRule.reason, fileType, agentProfile };
  }

  if (operation === 'execute' && isDestructiveCommand(command)) {
    return { allowed: false, ruleId: 'command-safety', reason: 'Destructive command blocked', fileType, agentProfile };
  }

  if (!hasPermission(agentProfile.role, operation, fileType)) {
    return {
      allowed: false,
      ruleId: 'role-permission',
      reason: `Role ${agentProfile.roleId} cannot ${operation} ${fileType} resources`,
      fileType,
      agentProfile,
    };
  }

  return {
    allowed: true,
    ruleId: 'allow',
    reason: 'Operation allowed',
    fileType,
    agentProfile,
  };
}

export function evaluateOperation(context) {
  return evaluateOperationContext(context);
}

export async function authorizeOperation(context) {
  const decision = evaluateOperationContext(context);
  await logOperation({
    allowed: decision.allowed,
    ruleId: decision.ruleId,
    reason: decision.reason,
    operation: context.operation,
    fileType: decision.fileType,
    filePath: context.filePath,
    command: context.command?.slice(0, 300),
    resourceType: context.resourceType,
    agent: {
      id: decision.agentProfile.id,
      role: decision.agentProfile.roleId,
      name: decision.agentProfile.name || decision.agentProfile.id,
    },
    metadata: context.metadata,
    content: context.content,
  });
  return decision;
}

export function enforceOperation(context) {
  const decision = evaluateOperationContext(context);
  void logOperation({
    allowed: decision.allowed,
    ruleId: decision.ruleId,
    reason: decision.reason,
    operation: context.operation,
    fileType: decision.fileType,
    filePath: context.filePath,
    command: context.command?.slice(0, 300),
    resourceType: context.resourceType,
    agent: {
      id: decision.agentProfile.id,
      role: decision.agentProfile.roleId,
      name: decision.agentProfile.name || decision.agentProfile.id,
    },
    metadata: context.metadata,
    content: context.content,
  });

  if (!decision.allowed) {
    const error = new Error(decision.reason);
    error.ruleId = decision.ruleId;
    error.operation = context.operation;
    throw error;
  }

  return decision;
}

export function checkAgentExecution({ agent, providerId, task }) {
  return evaluateOperationContext({
    agent,
    operation: 'execute',
    resourceType: 'ai',
    metadata: { providerId, task },
  });
}

export function enforceAgentExecution({ agent, providerId, task }) {
  return enforceOperation({
    agent,
    operation: 'execute',
    resourceType: 'ai',
    metadata: { providerId, task },
  });
}

export function getAgentRoleDefinition(roleId) {
  return ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.default;
}
