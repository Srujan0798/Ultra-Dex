// Copyright (c) 2026 Ultra-Dex

/**
 * Template Registry (JSON-based)
 */

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_REGISTRY = {
  templates: [
    {
      name: 'next15-saas',
      version: '1.0.0',
      description: 'Next.js 15 SaaS starter',
      category: 'saas',
      stack: ['next15', 'prisma', 'stripe', 'clerk'],
      source: 'local',
      path: 'cli/assets/live-templates/next15-saas',
    },
    {
      name: 'remix-saas',
      version: '1.0.0',
      description: 'Remix SaaS starter',
      category: 'saas',
      stack: ['remix', 'prisma', 'stripe', 'clerk'],
      source: 'local',
      path: 'cli/assets/live-templates/remix-saas',
    },
    {
      name: 'sveltekit-saas',
      version: '1.0.0',
      description: 'SvelteKit SaaS starter',
      category: 'saas',
      stack: ['sveltekit', 'prisma', 'stripe', 'clerk'],
      source: 'local',
      path: 'cli/assets/live-templates/sveltekit-saas',
    },
  ],
};

const REGISTRY_PATH = path.resolve(process.cwd(), '.ultra-dex', 'template-registry.json');

export function parseTemplateSpecifier(specifier) {
  const [name, version] = specifier.split('@');
  return { name, version: version || null };
}

export async function loadTemplateRegistry() {
  try {
    const content = await fs.readFile(REGISTRY_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return DEFAULT_REGISTRY;
  }
}

export async function saveTemplateRegistry(registry) {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function selectTemplateVersion(entry, requestedVersion) {
  if (!entry) return null;
  if (!requestedVersion || requestedVersion === 'latest') return entry.version;
  return requestedVersion;
}

export const registryPath = REGISTRY_PATH;
