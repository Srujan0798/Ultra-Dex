// Copyright (c) 2026 Ultra-Dex

/**
 * Plugin Registry Resolver
 * Fetches registry metadata from GitHub and handles version resolution.
 */

const DEFAULT_REGISTRY_URL =
  process.env.ULTRA_DEX_PLUGIN_REGISTRY ||
  process.env.ULTRA_DEX_PLUGIN_REGISTRY_URL ||
  'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main/plugins/registry.json';

const FALLBACK_REGISTRY = {
  plugins: [
    {
      name: '@ultra-dex/agent-pack',
      description: 'Custom agent bundles and prompts',
      type: 'agent',
      latest: '1.0.0',
      versions: ['1.0.0'],
      repository: 'github:Srujan0798/Ultra-Dex',
      author: 'Ultra-Dex Team',
    },
    {
      name: '@ultra-dex/template-pack',
      description: 'Starter templates for SaaS scaffolding',
      type: 'template',
      latest: '1.2.0',
      versions: ['1.2.0', '1.1.0'],
      repository: 'github:Srujan0798/Ultra-Dex',
      author: 'Ultra-Dex Team',
    },
    {
      name: '@ultra-dex/integration-pack',
      description: 'Common integrations and connectors',
      type: 'integration',
      latest: '0.9.0',
      versions: ['0.9.0'],
      repository: 'github:Srujan0798/Ultra-Dex',
      author: 'Ultra-Dex Team',
    },
  ],
};

export async function fetchRegistry(url = DEFAULT_REGISTRY_URL) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Registry fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return normalizeRegistry(data);
  } catch {
    return normalizeRegistry(FALLBACK_REGISTRY);
  }
}

export function normalizeRegistry(data) {
  if (Array.isArray(data)) {
    return { plugins: data };
  }
  if (data && Array.isArray(data.plugins)) {
    return data;
  }
  return FALLBACK_REGISTRY;
}

export function selectPluginVersion(plugin, requestedVersion) {
  if (!plugin) return null;
  const versions = Array.isArray(plugin.versions) ? plugin.versions : [];

  if (!requestedVersion || requestedVersion === 'latest') {
    return plugin.latest || versions[0] || plugin.version || null;
  }

  if (versions.includes(requestedVersion)) {
    return requestedVersion;
  }

  return null;
}

export function parsePluginSpecifier(specifier) {
  if (!specifier) return { name: '', version: null };
  const [name, version] =
    specifier.split('@').length > 2 ? [specifier, null] : specifier.split('@');

  if (specifier.startsWith('@')) {
    const atIndex = specifier.lastIndexOf('@');
    if (atIndex > 0) {
      return { name: specifier.slice(0, atIndex), version: specifier.slice(atIndex + 1) || null };
    }
    return { name: specifier, version: null };
  }

  return { name, version: version || null };
}

export const registryDefaults = {
  url: DEFAULT_REGISTRY_URL,
};
