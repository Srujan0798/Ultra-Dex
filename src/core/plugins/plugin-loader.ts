import { PluginManifest, InstalledPlugin } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class PluginLoader {
  private pluginsDir: string;

  constructor() {
    this.pluginsDir = path.join(os.homedir(), '.ultra-dex', 'plugins');
  }

  /**
   * Load plugin from local directory
   */
  async loadFromPath(dir: string): Promise<InstalledPlugin> {
    const manifestPath = path.join(dir, 'agent.json');

    // Read and parse manifest
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest: PluginManifest = JSON.parse(content);

    // Validate
    await this.validateManifest(manifest);

    // Resolve dependencies
    await this.resolveDependencies(manifest);

    return {
      manifest,
      path: dir,
      installedAt: new Date(),
      status: 'active',
    };
  }

  /**
   * Load plugin from npm package
   */
  async loadFromNpm(packageName: string): Promise<InstalledPlugin> {
    const { execSync } = require('child_process');
    const installDir = path.join(this.pluginsDir, 'node_modules', packageName);

    // Install via npm
    execSync(`npm install ${packageName}`, {
      cwd: this.pluginsDir,
      stdio: 'pipe',
    });

    return this.loadFromPath(installDir);
  }

  /**
   * Load plugin from git repository
   */
  async loadFromGit(repoUrl: string): Promise<InstalledPlugin> {
    const { execSync } = require('child_process');
    const repoName = path.basename(repoUrl, '.git');
    const cloneDir = path.join(this.pluginsDir, repoName);

    // Clone repository
    execSync(`git clone ${repoUrl} ${cloneDir}`, {
      stdio: 'pipe',
    });

    return this.loadFromPath(cloneDir);
  }

  /**
   * Validate plugin manifest
   */
  async validateManifest(manifest: PluginManifest): Promise<boolean> {
    const required = ['name', 'version', 'description', 'author', 'minUltraDexVersion'];

    for (const field of required) {
      if (!(field in manifest)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^(\d+\.){2}\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format. Use semver (e.g., 1.0.0)');
    }

    // Check minUltraDexVersion
    const currentVersion = '4.0.0';
    if (this.compareVersions(currentVersion, manifest.minUltraDexVersion) < 0) {
      throw new Error(`Plugin requires Ultra-Dex ${manifest.minUltraDexVersion}`);
    }

    return true;
  }

  /**
   * Resolve plugin dependencies
   */
  async resolveDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies?.length) return;

    for (const dep of manifest.dependencies) {
      const depPath = path.join(this.pluginsDir, dep);
      try {
        await fs.access(depPath);
      } catch {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (pa[i] > pb[i]) return 1;
      if (pa[i] < pb[i]) return -1;
    }
    return 0;
  }
}
