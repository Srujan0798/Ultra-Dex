import fs from 'fs/promises';
import path from 'path';
import { PluginManager } from '../infrastructure/plugin-manager.js';

function pluginIdFromPackageJson(packageJson) {
  return (
    packageJson.ultraDex?.id ||
    packageJson.manifest?.id ||
    packageJson.name?.replace(/^@ultra-dex\/plugin-/, '')
  );
}

export class MCPRegistry {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || path.join(process.cwd(), '.ultra-dex', 'mcp'),
      registryFile: config.registryFile || path.join(process.cwd(), '.ultra-dex', 'mcp', 'registry.json'),
      pluginManagerOptions: config.pluginManagerOptions || {},
      pluginManager: config.pluginManager || null,
      ...config,
    };
    this.pluginManager =
      this.config.pluginManager ||
      new PluginManager(this.config.pluginManagerOptions);
    this.store = {
      published: {},
      installed: {},
    };
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    await fs.mkdir(this.config.dataDir, { recursive: true });
    await this.loadStore();
    await this.pluginManager.initialize();
    this.initialized = true;
  }

  async loadStore() {
    try {
      const raw = await fs.readFile(this.config.registryFile, 'utf8');
      this.store = JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async saveStore() {
    await fs.mkdir(path.dirname(this.config.registryFile), { recursive: true });
    await fs.writeFile(this.config.registryFile, JSON.stringify(this.store, null, 2));
  }

  async publish(pluginPackagePath) {
    await this.initialize();

    const packageJsonPath = path.join(pluginPackagePath, 'package.json');
    const indexPath = path.join(pluginPackagePath, 'index.js');
    await fs.access(packageJsonPath);
    await fs.access(indexPath);

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const pluginId = pluginIdFromPackageJson(packageJson);
    if (!pluginId) {
      throw new Error('Plugin package is missing a resolvable plugin id');
    }

    const manifest = {
      id: pluginId,
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || '',
      author: packageJson.author || '',
      localPath: pluginPackagePath,
      publishedAt: new Date().toISOString(),
      manifest: packageJson.ultraDex || packageJson.manifest || {},
    };

    if (!this.store.published[pluginId]) {
      this.store.published[pluginId] = [];
    }

    this.store.published[pluginId] = this.store.published[pluginId]
      .filter((entry) => entry.version !== manifest.version)
      .concat(manifest)
      .sort((left, right) => left.version.localeCompare(right.version));

    await this.saveStore();
    return manifest;
  }

  async discover(filter = {}) {
    await this.initialize();

    const query = String(filter.query || '').toLowerCase();
    const published = Object.values(this.store.published).flat();

    return published.filter((entry) => {
      if (!query) {
        return true;
      }
      return [entry.id, entry.name, entry.description, entry.author]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }

  getPublishedRecord(pluginId, version = null) {
    const entries = this.store.published[pluginId] || [];
    if (entries.length === 0) {
      return null;
    }
    if (!version || version === 'latest') {
      return entries[entries.length - 1];
    }
    return entries.find((entry) => entry.version === version) || null;
  }

  async ensurePluginKnown(pluginId, version = null) {
    await this.pluginManager.discoverPlugins();
    let plugin = this.pluginManager.plugins.get(pluginId);
    if (plugin) {
      return plugin;
    }

    const published = this.getPublishedRecord(pluginId, version);
    if (!published?.localPath) {
      return null;
    }

    const validated = await this.pluginManager.validatePluginDirectory(published.localPath);
    if (validated) {
      this.pluginManager.plugins.set(validated.id, validated);
      plugin = validated;
    }

    return plugin;
  }

  async install(pluginId, version = 'latest') {
    await this.initialize();
    const plugin = await this.ensurePluginKnown(pluginId, version);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not available in the registry`);
    }

    const installed = await this.pluginManager.install(pluginId);
    this.store.installed[pluginId] = {
      version: version === 'latest' ? installed.version : version,
      installedAt: new Date().toISOString(),
    };
    await this.saveStore();
    return installed;
  }

  async load(pluginId, context = {}) {
    await this.initialize();
    return await this.pluginManager.activate(pluginId, context);
  }

  async unload(pluginId) {
    await this.initialize();
    return await this.pluginManager.deactivate(pluginId);
  }

  async uninstall(pluginId) {
    await this.initialize();
    await this.pluginManager.uninstall(pluginId);
    delete this.store.installed[pluginId];
    await this.saveStore();
    return true;
  }

  list() {
    return this.pluginManager.list().map((plugin) => ({
      ...plugin,
      installed: Boolean(this.store.installed[plugin.id]),
      installedAt: this.store.installed[plugin.id]?.installedAt || null,
    }));
  }

  getPlugin(pluginId) {
    return this.getPublishedRecord(pluginId) || null;
  }

  getStats() {
    return {
      published: Object.keys(this.store.published).length,
      installed: Object.keys(this.store.installed).length,
      pluginManager: this.pluginManager.getStats(),
    };
  }
}

export default MCPRegistry;
