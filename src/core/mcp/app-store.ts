var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
let MCPAppStore = class {
  constructor(registry, pluginManager, logger) {
    this.registry = registry;
    this.pluginManager = pluginManager;
    this.logger = logger;
  }
  plugins = /* @__PURE__ */ new Map();
  downloads = /* @__PURE__ */ new Map();
  ratings = /* @__PURE__ */ new Map();
  async initialize() {
    await this.registry.initialize();
    await this.pluginManager.initialize();
    this.logger.info('MCPAppStore initialized');
  }
  /**
   * Publish a plugin to the store
   */
  async publish(plugin) {
    this.logger.info(`Publishing plugin: ${plugin.id}@${plugin.version}`);
    const audit = await this.auditPlugin(plugin);
    if (!audit.passed) {
      this.logger.warn(`Plugin ${plugin.id} failed security audit`, {
        findings: audit.findings,
      });
      return {
        success: false,
        errors: audit.findings.map((f) => `[${f.severity}] ${f.type}: ${f.message}`),
      };
    }
    const validation = this.validatePlugin(plugin);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }
    this.plugins.set(plugin.id, plugin);
    if (!this.downloads.has(plugin.id)) {
      this.downloads.set(plugin.id, 0);
    }
    this.logger.info(`Plugin ${plugin.id}@${plugin.version} published successfully`, {
      securityScore: audit.score,
    });
    return {
      success: true,
      pluginId: plugin.id,
      version: plugin.version,
    };
  }
  /**
   * Search for plugins
   */
  async search(query, filters) {
    let results = Array.from(this.plugins.values());
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.id.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters?.capabilities) {
      results = results.filter((p) =>
        filters.capabilities.some((cap) => p.capabilities.includes(cap))
      );
    }
    if (filters?.author) {
      results = results.filter((p) => p.author === filters.author);
    }
    const searchResults = results.map((p) => {
      const ratings = this.ratings.get(p.id) || [];
      const avgRating =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const installed = this.registry.list().some((r) => r.id === p.id);
      const installedRecord = this.registry.getPublishedRecord(p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        author: p.author,
        version: p.version,
        downloads: this.downloads.get(p.id) || 0,
        rating: avgRating,
        capabilities: p.capabilities,
        installed,
        installedVersion: installedRecord?.version,
      };
    });
    if (filters?.minRating) {
      return searchResults.filter((r) => r.rating >= filters.minRating);
    }
    return searchResults.sort((a, b) => b.downloads - a.downloads);
  }
  /**
   * Install a plugin
   */
  async install(pluginId, version) {
    this.logger.info(`Installing plugin: ${pluginId}@${version || 'latest'}`);
    try {
      await this.registry.install(pluginId, version || 'latest');
      const current = this.downloads.get(pluginId) || 0;
      this.downloads.set(pluginId, current + 1);
      this.logger.info(`Plugin ${pluginId} installed successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to install plugin ${pluginId}`, error);
      return false;
    }
  }
  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId) {
    this.logger.info(`Uninstalling plugin: ${pluginId}`);
    try {
      await this.registry.uninstall(pluginId);
      this.logger.info(`Plugin ${pluginId} uninstalled successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to uninstall plugin ${pluginId}`, error);
      return false;
    }
  }
  /**
   * Load/activate a plugin
   */
  async load(pluginId, context) {
    return this.registry.load(pluginId, context);
  }
  /**
   * Rate a plugin
   */
  rate(pluginId, rating) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    if (!this.ratings.has(pluginId)) {
      this.ratings.set(pluginId, []);
    }
    this.ratings.get(pluginId).push(rating);
  }
  /**
   * Get plugin details
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }
  /**
   * Get installed plugins
   */
  getInstalled() {
    const registryPlugins = this.registry.list();
    return registryPlugins.map((r) => {
      const plugin = this.plugins.get(r.id);
      const ratings = this.ratings.get(r.id) || [];
      return {
        id: r.id,
        name: plugin?.name || r.id,
        description: plugin?.description || '',
        author: plugin?.author || 'Unknown',
        version: r.version,
        downloads: this.downloads.get(r.id) || 0,
        rating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
        capabilities: plugin?.capabilities || [],
        installed: true,
        installedVersion: r.version,
      };
    });
  }
  /**
   * Security audit a plugin
   */
  async auditPlugin(plugin) {
    const findings = [];
    const dangerousPermissions = ['filesystem:write', 'network:all', 'process:spawn'];
    for (const perm of plugin.permissions) {
      if (dangerousPermissions.includes(perm)) {
        findings.push({
          severity: 'medium',
          type: 'dangerous-permission',
          message: `Plugin requests dangerous permission: ${perm}`,
        });
      }
    }
    const suspiciousPackages = ['malicious-package', 'eval-lib'];
    for (const dep of Object.keys(plugin.dependencies)) {
      if (suspiciousPackages.includes(dep)) {
        findings.push({
          severity: 'critical',
          type: 'suspicious-dependency',
          message: `Plugin depends on known suspicious package: ${dep}`,
        });
      }
    }
    if (plugin.entryPoint.includes('eval') || plugin.entryPoint.includes(' Function')) {
      findings.push({
        severity: 'high',
        type: 'suspicious-entry-point',
        message: 'Entry point may contain code execution risks',
      });
    }
    let score = 100;
    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    return {
      passed: findings.filter((f) => f.severity === 'critical').length === 0,
      findings,
      score: Math.max(0, score),
    };
  }
  /**
   * Validate plugin structure
   */
  validatePlugin(plugin) {
    const errors = [];
    if (!plugin.id) errors.push('Plugin ID is required');
    if (!plugin.name) errors.push('Plugin name is required');
    if (!plugin.version) errors.push('Version is required');
    if (!plugin.entryPoint) errors.push('Entry point is required');
    if (plugin.version && !/^\d+\.\d+\.\d+/.test(plugin.version)) {
      errors.push('Version must follow semantic versioning (e.g., 1.0.0)');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  getStats() {
    const totalDownloads = Array.from(this.downloads.values()).reduce((a, b) => a + b, 0);
    const allRatings = Array.from(this.ratings.values()).flat();
    const averageRating =
      allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
    return {
      totalPlugins: this.plugins.size,
      totalDownloads,
      averageRating,
    };
  }
};
MCPAppStore = __decorateClass(
  [
    singleton(),
    __decorateParam(0, inject(DI_TOKENS.MCPRegistry)),
    __decorateParam(1, inject(DI_TOKENS.PluginManager)),
    __decorateParam(2, inject(DI_TOKENS.Logger)),
  ],
  MCPAppStore
);
export { MCPAppStore };
