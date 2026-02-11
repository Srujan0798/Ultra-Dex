// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Version Check module
 * @module utils/version-check
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getCliVersion() {
  const pkgPath = path.resolve(__dirname, '../../../package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  return pkg.version;
}

export async function getProjectVersion() {
  const configPath = path.resolve(process.cwd(), '.ultra-dex/config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  return config.version || '0.0.0';
}

export async function compareVersions() {
  const cliVersion = await getCliVersion();
  let projectVersion = '0.0.0';
  try {
    projectVersion = await getProjectVersion();
  } catch {
    return { cliVersion, projectVersion: null, ok: false };
  }
  return {
    cliVersion,
    projectVersion,
    ok: projectVersion >= cliVersion,
  };
}

export default { getCliVersion, getProjectVersion, compareVersions };
