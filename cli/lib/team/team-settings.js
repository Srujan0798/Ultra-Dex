/**
 * Team settings storage
 */

import fs from 'fs/promises';
import path from 'path';

const TEAM_DIR = '.ultra-dex';
const SETTINGS_FILE = 'team-settings.json';

const DEFAULT_SETTINGS = {
  version: 1,
  roles: ['admin', 'maintainer', 'member', 'viewer'],
  defaultRole: 'member',
  contextSync: true,
  auditLogging: true,
  createdAt: new Date().toISOString()
};

function resolveSettingsPath(workspace = process.cwd()) {
  return path.join(workspace, TEAM_DIR, SETTINGS_FILE);
}

export async function loadTeamSettings(workspace) {
  const filePath = resolveSettingsPath(workspace);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveTeamSettings(settings, workspace) {
  const filePath = resolveSettingsPath(workspace);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
  return filePath;
}

export async function updateTeamSettings(patch, workspace) {
  const current = await loadTeamSettings(workspace);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await saveTeamSettings(next, workspace);
  return next;
}
