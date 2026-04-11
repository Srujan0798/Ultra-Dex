import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Plugin } from '../models/plugin.js';
import { logger } from '../utils/logger.js';

export class DatabaseService {
  private db: Database | null = null;

  async init(): Promise<void> {
    this.db = await open({
      filename: './marketplace.db',
      driver: sqlite3.Database,
    });

    await this.createTables();
    logger.info('Database initialized');
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        version TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        dependencies TEXT DEFAULT '{}',
        manifest TEXT NOT NULL,
        downloads INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        reviews INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published BOOLEAN DEFAULT 0
      )
    `);
  }

  async createPlugin(plugin: Omit<Plugin, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `
      INSERT INTO plugins (id, name, description, version, author, category, tags, dependencies, manifest, downloads, rating, reviews, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        plugin.id,
        plugin.name,
        plugin.description,
        plugin.version,
        plugin.author,
        plugin.category,
        JSON.stringify(plugin.tags),
        JSON.stringify(plugin.dependencies),
        JSON.stringify(plugin.manifest),
        plugin.downloads,
        plugin.rating,
        plugin.reviews,
        plugin.published ? 1 : 0,
      ]
    );
  }

  async getPlugin(id: string): Promise<Plugin | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(
      `
      SELECT * FROM plugins WHERE id = ?
    `,
      id
    );

    if (!row) return null;

    return this.mapRowToPlugin(row);
  }

  async getPlugins(filters?: {
    category?: string;
    author?: string;
    published?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Plugin[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM plugins WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.author) {
      query += ' AND author = ?';
      params.push(filters.author);
    }

    if (filters?.published !== undefined) {
      query += ' AND published = ?';
      params.push(filters.published ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = await this.db.all(query, params);
    return rows.map(this.mapRowToPlugin);
  }

  async updatePlugin(id: string, updates: Partial<Plugin>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = [];
    const params = [];

    if (updates.name) {
      fields.push('name = ?');
      params.push(updates.name);
    }
    if (updates.description) {
      fields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.version) {
      fields.push('version = ?');
      params.push(updates.version);
    }
    if (updates.tags) {
      fields.push('tags = ?');
      params.push(JSON.stringify(updates.tags));
    }
    if (updates.dependencies) {
      fields.push('dependencies = ?');
      params.push(JSON.stringify(updates.dependencies));
    }
    if (updates.manifest) {
      fields.push('manifest = ?');
      params.push(JSON.stringify(updates.manifest));
    }
    if (updates.downloads !== undefined) {
      fields.push('downloads = ?');
      params.push(updates.downloads);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      params.push(updates.rating);
    }
    if (updates.reviews !== undefined) {
      fields.push('reviews = ?');
      params.push(updates.reviews);
    }
    if (updates.published !== undefined) {
      fields.push('published = ?');
      params.push(updates.published ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.db.run(
        `
        UPDATE plugins SET ${fields.join(', ')} WHERE id = ?
      `,
        params
      );
    }
  }

  async deletePlugin(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM plugins WHERE id = ?', id);
  }

  async incrementDownloads(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `
      UPDATE plugins SET downloads = downloads + 1 WHERE id = ?
    `,
      id
    );
  }

  private mapRowToPlugin(row: any): Plugin {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      author: row.author,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      dependencies: JSON.parse(row.dependencies || '{}'),
      manifest: JSON.parse(row.manifest),
      downloads: row.downloads,
      rating: row.rating,
      reviews: row.reviews,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      published: row.published === 1,
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const dbService = new DatabaseService();
