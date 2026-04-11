// Copyright (c) 2026 Ultra-Dex

/**
 * Template Pack Manager
 * Downloads verified template packs from a remote registry or GitHub repo.
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const execAsync = promisify(exec);

const DEFAULT_REGISTRY_URL =
  'https://raw.githubusercontent.com/ultra-dex/registry/main/templates.json';

async function fetchRegistry(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return null;
  }
}

async function loadLocalRegistry() {
  const candidates = [
    path.join(process.cwd(), 'config', 'template-registry.json'),
    path.join(process.cwd(), '.ultra-dex', 'template-registry.json'),
  ];

  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  return null;
}

export async function installTemplatePack(name, options = {}) {
  const registryUrl = options.registryUrl || DEFAULT_REGISTRY_URL;
  const registry = (await fetchRegistry(registryUrl)) || (await loadLocalRegistry());

  if (!registry) {
    throw new Error('Template registry unavailable. Provide a local registry or check network.');
  }

  const entry = registry.templates?.find((tpl) => tpl.name === name || tpl.id === name);
  if (!entry) {
    throw new Error(`Template '${name}' not found in registry.`);
  }

  const targetDir = path.resolve(options.targetDir || path.join(process.cwd(), 'templates', name));
  await fs.mkdir(targetDir, { recursive: true });

  if (entry.repo) {
    printInfo(`Cloning ${entry.repo} into ${targetDir}...`);
    await execAsync(`git clone --depth 1 ${entry.repo} "${targetDir}"`);
    printSuccess(`Template '${name}' installed.`);
    return targetDir;
  }

  // Fallback: write metadata file
  const infoPath = path.join(targetDir, 'PACK-INFO.md');
  const info = `# ${entry.name}\n\n${entry.description || 'Template pack'}\n\n`;
  await fs.writeFile(infoPath, info);
  printWarning(`Template '${name}' installed with metadata only (no repo URL).`);
  return targetDir;
}

export async function listRemoteTemplates(options = {}) {
  const registryUrl = options.registryUrl || DEFAULT_REGISTRY_URL;
  const registry = (await fetchRegistry(registryUrl)) || (await loadLocalRegistry());
  return registry?.templates || [];
}

export default {
  installTemplatePack,
  listRemoteTemplates,
};
