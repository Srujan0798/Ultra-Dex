// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Workflow Registry module
 * @module marketplace/workflow-registry
 */

const DEFAULT_WORKFLOW_REGISTRY_URL =
  process.env.ULTRA_DEX_WORKFLOW_REGISTRY ||
  'https://raw.githubusercontent.com/Srujan0798/Ultra-Dex/main/workflows/registry.json';

const FALLBACK_WORKFLOWS = {
  workflows: [
    {
      name: '@ultra-dex/auth-flow',
      description: 'Complete authentication workflow with tests',
      latest: '1.0.0',
      versions: ['1.0.0'],
      tags: ['auth', 'security', 'backend'],
    },
    {
      name: '@ultra-dex/api-builder',
      description: 'REST API scaffolding workflow',
      latest: '1.2.0',
      versions: ['1.2.0', '1.1.0'],
      tags: ['api', 'backend'],
    },
    {
      name: '@ultra-dex/testing-suite',
      description: 'Full test automation workflow',
      latest: '0.9.0',
      versions: ['0.9.0'],
      tags: ['tests', 'qa'],
    },
  ],
};

export async function fetchWorkflowRegistry(url = DEFAULT_WORKFLOW_REGISTRY_URL) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Registry fetch failed');
    const data = await response.json();
    return normalizeWorkflowRegistry(data);
  } catch {
    return normalizeWorkflowRegistry(FALLBACK_WORKFLOWS);
  }
}

export function normalizeWorkflowRegistry(data) {
  if (Array.isArray(data)) {
    return { workflows: data };
  }
  if (data && Array.isArray(data.workflows)) {
    return data;
  }
  return FALLBACK_WORKFLOWS;
}

export function selectWorkflowVersion(entry, requestedVersion) {
  if (!entry) return null;
  const versions = Array.isArray(entry.versions) ? entry.versions : [];
  if (!requestedVersion || requestedVersion === 'latest') {
    return entry.latest || versions[0] || entry.version || null;
  }
  if (versions.includes(requestedVersion)) return requestedVersion;
  return null;
}

export function parseWorkflowSpecifier(specifier) {
  if (!specifier) return { name: '', version: null };
  const atIndex = specifier.lastIndexOf('@');
  if (specifier.startsWith('@') && atIndex > 0) {
    return { name: specifier.slice(0, atIndex), version: specifier.slice(atIndex + 1) || null };
  }
  const [name, version] = specifier.split('@');
  return { name, version: version || null };
}

export const workflowRegistryDefaults = {
  url: DEFAULT_WORKFLOW_REGISTRY_URL,
};
