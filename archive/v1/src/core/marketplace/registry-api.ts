// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { marketplaceSearch, PluginMetadata, SearchFilters } from './search.js';
import { semverManager } from './versioning.js';

export interface PublishRequest {
  manifest: any;
  tarballPath: string;
}

export interface PublishResult {
  success: boolean;
  name: string;
  version: string;
}

export class MarketplaceAPI {
  private registryDir: string;
  private pluginsMetadata: Map<string, any> = new Map();

  constructor() {
    this.registryDir = path.join(process.cwd(), '.ultra-dex', 'registry');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.registryDir, { recursive: true });
    } catch (e) {
      // Ignore
    }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    await this.initialize();
    const { manifest, tarballPath } = request;

    if (!manifest.name || !manifest.version) {
      throw new Error('Manifest missing name or version');
    }

    if (!semverManager.validateVersion(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}`);
    }

    const pluginDir = path.join(this.registryDir, manifest.name);
    await fs.mkdir(pluginDir, { recursive: true });

    // Store tarball
    const destTarball = path.join(pluginDir, `${manifest.version}.tgz`);
    await fs.copyFile(tarballPath, destTarball);

    // Save manifest
    const destManifest = path.join(pluginDir, 'manifest.json');
    await fs.writeFile(destManifest, JSON.stringify(manifest, null, 2));

    const meta: PluginMetadata = {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description || '',
      author: manifest.author || 'unknown',
      category: manifest.category || 'tools',
      downloads: 0,
      rating: 0,
      publishedAt: new Date().toISOString(),
      minVersion: manifest.minUltraDexVersion,
    };

    // Update in-memory tracking
    this.pluginsMetadata.set(manifest.name, {
      ...manifest,
      versions: [manifest.version],
      ...meta,
    });

    marketplaceSearch.indexPlugin(meta);

    return {
      success: true,
      name: manifest.name,
      version: manifest.version,
    };
  }

  async download(name: string, version?: string): Promise<{ tarballPath: string; manifest: any }> {
    const meta = this.pluginsMetadata.get(name);
    if (!meta) {
      throw new Error(`Plugin not found: ${name}`);
    }

    const resolvedVersion = version || meta.versions[0]; // simplistic version resolution
    const pluginDir = path.join(this.registryDir, name);
    const tarballPath = path.join(pluginDir, `${resolvedVersion}.tgz`);

    try {
      await fs.access(tarballPath);
    } catch {
      throw new Error(`Version ${resolvedVersion} not found for plugin ${name}`);
    }

    // Increment downloads
    meta.downloads = (meta.downloads || 0) + 1;
    marketplaceSearch.indexPlugin(meta); // Update search index

    return {
      tarballPath,
      manifest: meta,
    };
  }

  async getMetadata(name: string): Promise<any> {
    const meta = this.pluginsMetadata.get(name);
    if (!meta) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return meta;
  }

  async search(query: string, filters: SearchFilters = {}): Promise<PluginMetadata[]> {
    return marketplaceSearch.search(query, filters);
  }

  listCategories(): string[] {
    return ['coding', 'testing', 'devops', 'security', 'docs', 'tools'];
  }
}

export const registryApi = new MarketplaceAPI();
