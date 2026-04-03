import { v4 as uuidv4 } from 'uuid';
import semver from 'semver';
import { Plugin, PluginCreate, PluginUpdate, PluginCategory } from '../models/plugin.js';
import { dbService } from './database.js';
import { logger } from '../utils/logger.js';

export class PluginService {
  async createPlugin(pluginData: PluginCreate): Promise<Plugin> {
    // Validate dependencies versions
    for (const [dep, version] of Object.entries(pluginData.dependencies)) {
      if (!semver.valid(version)) {
        throw new Error(`Invalid version format for dependency ${dep}: ${version}`);
      }
    }

    const plugin: Omit<Plugin, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      ...pluginData,
      downloads: 0,
      rating: 0,
      reviews: 0,
      published: false,
    };

    await dbService.createPlugin(plugin);

    const created = await dbService.getPlugin(plugin.id);
    if (!created) throw new Error('Failed to create plugin');

    logger.info(`Plugin created: ${plugin.name} v${plugin.version} by ${plugin.author}`);
    return created;
  }

  async getPlugin(id: string): Promise<Plugin | null> {
    return dbService.getPlugin(id);
  }

  async getPlugins(filters?: {
    category?: PluginCategory;
    author?: string;
    published?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Plugin[]> {
    return dbService.getPlugins(filters);
  }

  async updatePlugin(id: string, updates: PluginUpdate): Promise<Plugin | null> {
    const existing = await this.getPlugin(id);
    if (!existing) return null;

    // Validate version if updating
    if (updates.version && !semver.valid(updates.version)) {
      throw new Error(`Invalid version format: ${updates.version}`);
    }

    // Validate dependencies if updating
    if (updates.dependencies) {
      for (const [dep, version] of Object.entries(updates.dependencies)) {
        if (!semver.valid(version)) {
          throw new Error(`Invalid version format for dependency ${dep}: ${version}`);
        }
      }
    }

    await dbService.updatePlugin(id, updates);

    const updated = await this.getPlugin(id);
    if (updated) {
      logger.info(`Plugin updated: ${updated.name} v${updated.version}`);
    }
    return updated;
  }

  async deletePlugin(id: string): Promise<boolean> {
    const existing = await this.getPlugin(id);
    if (!existing) return false;

    await dbService.deletePlugin(id);
    logger.info(`Plugin deleted: ${existing.name}`);
    return true;
  }

  async publishPlugin(id: string): Promise<Plugin | null> {
    return this.updatePlugin(id, { published: true });
  }

  async unpublishPlugin(id: string): Promise<Plugin | null> {
    return this.updatePlugin(id, { published: false });
  }

  async incrementDownloads(id: string): Promise<void> {
    await dbService.incrementDownloads(id);
  }

  async searchPlugins(query: string, category?: PluginCategory): Promise<Plugin[]> {
    const allPlugins = await this.getPlugins({ category, published: true });
    const lowerQuery = query.toLowerCase();

    return allPlugins.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery) ||
        plugin.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        plugin.author.toLowerCase().includes(lowerQuery)
    );
  }
}

export const pluginService = new PluginService();
