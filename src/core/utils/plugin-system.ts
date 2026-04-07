var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import chalk from "chalk";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from './logging.js';
const PLUGIN_DIR = ".ultra/plugins";
const PLUGIN_MANIFEST = "ultra-dex-plugin.json";
const execAsync = promisify(exec);
let PluginManager = class {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.plugins = /* @__PURE__ */ new Map();
    this.hooks = /* @__PURE__ */ new Map();
  }
  /**
   * Discover and load all plugins
   */
  async loadPlugins() {
    const pluginDir = path.join(this.projectRoot, PLUGIN_DIR);
    try {
      const entries = await fs.readdir(pluginDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.loadPlugin(path.join(pluginDir, entry.name));
        }
      }
    } catch {
    }
  }
  /**
   * Load a single plugin
   */
  async loadPlugin(pluginPath) {
    try {
      const manifestPath = path.join(pluginPath, PLUGIN_MANIFEST);
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      if (!manifest.name || !manifest.version) {
        logger.warn(chalk.yellow(`Invalid plugin manifest: ${pluginPath}`));
        return;
      }
      const indexPath = path.join(pluginPath, manifest.main || "index.js");
      const pluginModule = await import(pathToFileURL(indexPath).href);
      const plugin = {
        manifest,
        module: pluginModule,
        path: pluginPath,
        hooks: /* @__PURE__ */ new Set()
      };
      this.plugins.set(manifest.name, plugin);
      if (pluginModule.default?.activate) {
        await pluginModule.default.activate(this);
      }
      logger.log(chalk.green(`\u2713 Loaded plugin: ${manifest.name} v${manifest.version}`));
    } catch (error) {
      logger.warn(chalk.yellow(`Failed to load plugin ${pluginPath}:`), error.message);
    }
  }
  /**
   * Register a hook that plugins can subscribe to
   */
  registerHook(name, fn) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(fn);
  }
  /**
   * Execute all hooks for an event
   */
  async executeHook(name, context = {}) {
    const hooks = this.hooks.get(name) || [];
    const results = [];
    for (const hook of hooks) {
      try {
        const result = await hook(context);
        results.push(result);
      } catch (error) {
        logger.warn(chalk.yellow(`Hook ${name} failed:`), error.message);
      }
    }
    return results;
  }
  /**
   * Get list of loaded plugins
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map((p) => ({
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author
    }));
  }
  /**
   * Install a plugin from npm or git
   */
  async installPlugin(source) {
    const pluginDir = path.join(this.projectRoot, PLUGIN_DIR);
    await fs.mkdir(pluginDir, { recursive: true });
    logger.log(chalk.blue(`Installing plugin from ${source}...`));
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ultra-dex-plugin-"));
    let pluginSourceDir = null;
    const exists = async (target) => {
      try {
        await fs.stat(target);
        return true;
      } catch {
        return false;
      }
    };
    const isDirectory = async (target) => {
      try {
        const stat = await fs.stat(target);
        return stat.isDirectory();
      } catch {
        return false;
      }
    };
    if (await isDirectory(source)) {
      pluginSourceDir = source;
    } else if (source.startsWith("http") || source.endsWith(".git") || source.includes("github.com")) {
      await execAsync(`git clone --depth=1 ${source} ${tempDir}`);
      pluginSourceDir = tempDir;
    } else if (await exists(source) && source.endsWith(".tgz")) {
      await execAsync(`tar -xzf ${source} -C ${tempDir}`);
      pluginSourceDir = path.join(tempDir, "package");
    } else {
      await execAsync(`npm pack ${source}`, { cwd: tempDir });
      const files = await fs.readdir(tempDir);
      const tarball = files.find((f) => f.endsWith(".tgz"));
      if (!tarball) {
        throw new Error("Failed to download npm package");
      }
      await execAsync(`tar -xzf ${tarball} -C ${tempDir}`, { cwd: tempDir });
      pluginSourceDir = path.join(tempDir, "package");
    }
    const manifestPath = path.join(pluginSourceDir, PLUGIN_MANIFEST);
    if (!await exists(manifestPath)) {
      throw new Error(`Missing ${PLUGIN_MANIFEST} in plugin`);
    }
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    if (!manifest.name) {
      throw new Error("Plugin manifest missing name");
    }
    const targetPath = path.join(pluginDir, manifest.name);
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.cp(pluginSourceDir, targetPath, { recursive: true });
    await this.loadPlugin(targetPath);
    logger.log(chalk.green(`\u2713 Plugin installed: ${manifest.name}`));
    logger.log(chalk.gray("Restart Ultra-Dex to reload plugins if already running"));
  }
  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    if (plugin.module.default?.deactivate) {
      await plugin.module.default.deactivate();
    }
    await fs.rm(plugin.path, { recursive: true });
    this.plugins.delete(name);
    logger.log(chalk.green(`\u2713 Uninstalled plugin: ${name}`));
  }
};
PluginManager = __decorateClass([
  singleton()
], PluginManager);
const PLUGIN_MANIFEST_EXAMPLE = {
  name: "my-awesome-plugin",
  version: "1.0.0",
  description: "Does awesome things with Ultra-Dex",
  main: "index.js",
  author: "Your Name",
  license: "MIT",
  hooks: ["pre-init", "post-generate"],
  commands: [
    {
      name: "my-command",
      description: "Custom command provided by plugin"
    }
  ],
  dependencies: {
    "ultra-dex": ">=3.0.0"
  }
};
const PLUGIN_EXAMPLE = `
// index.js - Example Ultra-Dex Plugin

export default {
  // Called when plugin is loaded
  async activate(pluginManager) {
    logger.log('My plugin activated!');
    
    // Register hooks
    pluginManager.registerHook('pre-init', async (context) => {
      logger.log('About to init:', context);
    });
    
    pluginManager.registerHook('post-generate', async (context) => {
      logger.log('Generated:', context);
    });
  },
  
  // Called when plugin is unloaded
  async deactivate() {
    logger.log('My plugin deactivated');
  },
  
  // Custom commands
  commands: {
    'my-command': async (args, options) => {
      logger.log('Running my custom command');
    }
  }
};
`;
var plugin_system_default = { PluginManager, PLUGIN_MANIFEST_EXAMPLE };
export {
  PLUGIN_EXAMPLE,
  PLUGIN_MANIFEST_EXAMPLE,
  PluginManager,
  plugin_system_default as default
};
