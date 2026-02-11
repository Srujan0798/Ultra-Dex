// Copyright (c) 2026 Ultra-Dex

/**
 * Template Marketplace Helpers
 */

import fs from 'fs/promises';
import path from 'path';
import {
  loadTemplateRegistry,
  parseTemplateSpecifier,
  selectTemplateVersion,
  saveTemplateRegistry,
} from './template-registry.js';

const TEMPLATE_DIR = path.resolve(process.cwd(), '.ultra-dex', 'templates');

async function ensureTemplateDir() {
  await fs.mkdir(TEMPLATE_DIR, { recursive: true });
}

export async function listInstalledTemplates() {
  try {
    const entries = await fs.readdir(TEMPLATE_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function searchTemplates(query = '') {
  const registry = await loadTemplateRegistry();
  const q = query.toLowerCase();
  return registry.templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
  );
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function installTemplate(specifier, options = {}) {
  await ensureTemplateDir();

  const { name, version } = parseTemplateSpecifier(specifier);
  const registry = await loadTemplateRegistry();
  const entry = registry.templates.find((t) => t.name === name) || null;
  const resolvedVersion = selectTemplateVersion(entry, version) || 'latest';

  if (!entry) {
    throw new Error(`Template not found: ${name}`);
  }

  const targetDir = path.join(TEMPLATE_DIR, name);

  if (entry.source === 'local' && entry.path) {
    const sourcePath = path.resolve(process.cwd(), entry.path);
    await copyDirectory(sourcePath, targetDir);
  } else {
    // Fallback: create a minimal placeholder
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      path.join(targetDir, 'README.md'),
      `# ${name}\n\nTemplate fetched from registry.\n`
    );
  }

  await fs.writeFile(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(
      {
        name,
        version: resolvedVersion,
        installedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  return { name, version: resolvedVersion, path: targetDir };
}

export async function uninstallTemplate(name) {
  const targetDir = path.join(TEMPLATE_DIR, name);
  await fs.rm(targetDir, { recursive: true, force: true });
  return true;
}

export async function publishTemplate(manifest, templatePath) {
  const registry = await loadTemplateRegistry();
  registry.templates = registry.templates || [];

  const entry = {
    ...manifest,
    source: 'local',
    path: templatePath,
  };

  registry.templates = registry.templates.filter((t) => t.name !== manifest.name);
  registry.templates.push(entry);
  await saveTemplateRegistry(registry);

  return entry;
}

export const templatePaths = {
  directory: TEMPLATE_DIR,
};
