/**
 * Ultra-Dex Plugin Marketplace
 * JSON-based registry with search/install/uninstall and templates.
 */

import fs from 'fs/promises';
import path from 'path';
import { pluginRegistry } from '../plugins/index.js';
import { fetchRegistry, parsePluginSpecifier, selectPluginVersion } from './registry.js';

const MARKETPLACE_DIR = path.resolve(process.cwd(), '.ultra-dex', 'marketplace');
const LOCAL_REGISTRY_PATH = path.join(MARKETPLACE_DIR, 'plugins.json');

export const PLUGIN_TEMPLATES = {
  agent: {
    description: 'Custom agent extension',
    files: {
      'index.js': `export default {
  async activate(pluginManager) {
    // Register new agent prompt or hooks here
    pluginManager.registerHook('agent.register', 'Register custom agents');
  }
};
`,
      'README.md': '# Agent Plugin\n\nExtend Ultra-Dex with custom agents.\n'
    }
  },
  template: {
    description: 'Project template extension',
    files: {
      'index.js': `export default {
  async activate(pluginManager) {
    // Register new scaffolding templates here
    pluginManager.registerHook('template.register', 'Register custom templates');
  }
};
`,
      'README.md': '# Template Plugin\n\nExtend Ultra-Dex with new project templates.\n'
    }
  },
  integration: {
    description: 'Tool integration extension',
    files: {
      'index.js': `export default {
  async activate(pluginManager) {
    // Register new tool integrations here
    pluginManager.registerHook('integration.register', 'Register integrations');
  }
};
`,
      'README.md': '# Integration Plugin\n\nExtend Ultra-Dex with tool integrations.\n'
    }
  }
};

async function loadLocalRegistry() {
  try {
    const data = await fs.readFile(LOCAL_REGISTRY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { installed: {} };
    }
    return { installed: {} };
  }
}

async function saveLocalRegistry(registry) {
  await fs.mkdir(MARKETPLACE_DIR, { recursive: true });
  await fs.writeFile(LOCAL_REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export async function listInstalledPlugins() {
  await pluginRegistry.initialize();
  return pluginRegistry.getInstalledPlugins();
}

export async function searchPlugins(query = '') {
  const registry = await fetchRegistry();
  const normalized = query.toLowerCase();
  return registry.plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(normalized) ||
    plugin.description.toLowerCase().includes(normalized)
  );
}

export async function installPlugin(specifier, options = {}) {
  await pluginRegistry.initialize();

  const { name, version } = parsePluginSpecifier(specifier);
  const registry = await fetchRegistry();
  const entry = registry.plugins.find(p => p.name === name) || null;
  const resolvedVersion = selectPluginVersion(entry, version) || 'latest';

  const result = await pluginRegistry.installPlugin(name, options);

  if (result?.success) {
    const localRegistry = await loadLocalRegistry();
    localRegistry.installed = localRegistry.installed || {};
    localRegistry.installed[name] = {
      name,
      version: resolvedVersion,
      installedAt: new Date().toISOString(),
      source: entry?.repository || 'registry'
    };
    await saveLocalRegistry(localRegistry);
  }

  return result;
}

export async function uninstallPlugin(name) {
  await pluginRegistry.initialize();
  const result = await pluginRegistry.uninstallPlugin(name);

  if (result?.success !== false) {
    const localRegistry = await loadLocalRegistry();
    if (localRegistry.installed) {
      delete localRegistry.installed[name];
      await saveLocalRegistry(localRegistry);
    }
  }

  return result;
}

export async function createPluginFromTemplate(name, type = 'agent', targetDir = null) {
  const template = PLUGIN_TEMPLATES[type] || PLUGIN_TEMPLATES.agent;
  const pluginDir = targetDir || path.join(process.cwd(), '.ultra-dex', 'plugins', name);

  await fs.mkdir(pluginDir, { recursive: true });

  const manifest = {
    name,
    version: '1.0.0',
    description: template.description,
    main: 'index.js',
    type
  };

  await fs.writeFile(
    path.join(pluginDir, 'ultra-dex-plugin.json'),
    JSON.stringify(manifest, null, 2)
  );

  const fileEntries = Object.entries(template.files);
  for (const [fileName, content] of fileEntries) {
    await fs.writeFile(path.join(pluginDir, fileName), content, 'utf8');
  }

  return pluginDir;
}

export const marketplacePaths = {
  registry: LOCAL_REGISTRY_PATH,
  directory: MARKETPLACE_DIR
};
