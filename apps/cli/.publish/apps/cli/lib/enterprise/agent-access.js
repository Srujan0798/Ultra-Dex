// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise Agent Access Control
 * Enforces role-based access to agents using team configuration.
 */

import fs from 'fs/promises';
import path from 'path';
import { configManager } from '../utils/config-manager.js';

const TEAM_PATH = path.resolve(process.cwd(), '.ultra-dex', 'team.json');

export const DEFAULT_AGENT_ACCESS = {
  admin: ['*'],
  maintainer: ['*'],
  member: [
    'architect',
    'meta-orchestrator',
    'orchestrator',
    'cto',
    'planner',
    'research',
    'backend',
    'frontend',
    'database',
    'auth',
    'security',
    'devops',
    'testing',
    'reviewer',
    'debugger',
    'documentation',
    'performance',
    'refactoring',
  ],
  viewer: ['reviewer', 'documentation'],
};

function normalizeAgentName(name) {
  if (!name) return '';
  return String(name).replace(/^@/, '').trim().toLowerCase();
}

async function loadTeamConfig() {
  try {
    const data = await fs.readFile(TEAM_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    return null;
  }
}

async function resolveUserRole(teamConfig) {
  try {
    if (!configManager.loaded) {
      await configManager.load();
    }
  } catch {
    // ignore
  }

  const user = configManager.get('user', null);
  const fallbackRole = user?.role || 'viewer';

  if (!teamConfig || !teamConfig.members || !user?.username) {
    return fallbackRole;
  }

  const username = String(user.username).trim().toLowerCase();
  const member = teamConfig.members.find(
    (m) =>
      String(m.email || '')
        .trim()
        .toLowerCase() === username
  );
  return member?.role || fallbackRole;
}

function allowedAgentsForRole(role, teamConfig) {
  const normalizedRole = (role || 'viewer').toLowerCase();
  const teamAccess = teamConfig?.agentAccess?.[normalizedRole];
  if (Array.isArray(teamAccess) && teamAccess.length > 0) {
    return teamAccess;
  }
  return DEFAULT_AGENT_ACCESS[normalizedRole] || DEFAULT_AGENT_ACCESS.member;
}

export async function authorizeAgentAccess(agentName) {
  const teamConfig = await loadTeamConfig();
  if (!teamConfig) {
    return { allowed: true, role: 'admin', allowedAgents: ['*'], reason: 'no-team-config' };
  }

  const role = await resolveUserRole(teamConfig);

  // If no team config (local dev), default to admin
  if (!teamConfig || role === 'viewer') {
    return { allowed: true, role: 'admin', allowedAgents: ['*'] };
  }

  const allowedList = allowedAgentsForRole(role, teamConfig).map(normalizeAgentName);

  if (allowedList.includes('*')) {
    return { allowed: true, role, allowedAgents: ['*'] };
  }

  const normalized = normalizeAgentName(agentName);
  const allowed = allowedList.includes(normalized);
  return { allowed, role, allowedAgents: allowedList };
}

export async function filterAgentsByAccess(agentNames = []) {
  const teamConfig = await loadTeamConfig();
  if (!teamConfig) {
    return { role: 'admin', allowedAgents: agentNames, restrictedAgents: [] };
  }

  const role = await resolveUserRole(teamConfig);
  const allowedList = allowedAgentsForRole(role, teamConfig).map(normalizeAgentName);

  if (allowedList.includes('*')) {
    return { role, allowedAgents: agentNames, restrictedAgents: [] };
  }

  const allowedSet = new Set(allowedList);
  const allowedAgents = agentNames.filter((name) => allowedSet.has(normalizeAgentName(name)));
  const restrictedAgents = agentNames.filter((name) => !allowedSet.has(normalizeAgentName(name)));

  return { role, allowedAgents, restrictedAgents };
}

export async function getAgentAccessConfig() {
  const teamConfig = await loadTeamConfig();
  return {
    teamAccess: teamConfig?.agentAccess || null,
    defaults: DEFAULT_AGENT_ACCESS,
  };
}

export const agentAccessConfigPath = TEAM_PATH;
