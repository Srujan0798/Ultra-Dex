// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Multi-Tier Memory System
 * Implements Hot/Warm/Cold memory tiers for persistent project context
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync } from 'fs';
import { glob } from 'glob';

class MemoryTier {
  constructor(name, ttl, maxSize) {
    this.name = name;
    this.ttl = ttl; // Time to live in milliseconds
    this.maxSize = maxSize; // Max items or size
    this.storage = new Map();
    this.lastAccess = new Map();
  }

  async get(key) {
    if (!this.storage.has(key)) {
      return null;
    }

    const item = this.storage.get(key);
    this.lastAccess.set(key, Date.now());

    // Check if item has expired
    if (this.ttl > 0) {
      const age = Date.now() - this.lastAccess.get(key);
      if (age > this.ttl) {
        this.storage.delete(key);
        this.lastAccess.delete(key);
        return null;
      }
    }

    return item;
  }

  async set(key, value) {
    // Check size limits
    if (this.maxSize && this.storage.size >= this.maxSize) {
      // Remove oldest items
      const sortedEntries = Array.from(this.lastAccess.entries()).sort((a, b) => a[1] - b[1]); // Sort by access time

      if (sortedEntries.length > 0) {
        const oldestKey = sortedEntries[0][0];
        this.storage.delete(oldestKey);
        this.lastAccess.delete(oldestKey);
      }
    }

    this.storage.set(key, value);
    this.lastAccess.set(key, Date.now());
  }

  async clear() {
    this.storage.clear();
    this.lastAccess.clear();
  }

  getStats() {
    return {
      name: this.name,
      size: this.storage.size,
      ttl: this.ttl,
      maxSize: this.maxSize,
    };
  }
}

class PersistentMemorySystem {
  constructor() {
    // Hot Memory: Recent commits, active files, current task context (short-lived)
    this.hotMemory = new MemoryTier('hot', 5 * 60 * 1000, 100); // 5 minutes, 100 items

    // Warm Memory: PR summaries, design decisions, architecture docs (medium-lived)
    this.warmMemory = new MemoryTier('warm', 2 * 60 * 60 * 1000, 500); // 2 hours, 500 items

    // Cold Memory: Full repo history, tickets, logs, incidents (long-lived)
    this.coldMemory = new MemoryTier('cold', 24 * 60 * 60 * 1000, 2000); // 24 hours, 2000 items

    this.projectRoot = process.cwd();
    this.memoryDir = path.join(this.projectRoot, '.ultra-dex', 'memory');
  }

  async initialize() {
    await fs.mkdir(this.memoryDir, { recursive: true });
  }

  // Hot Memory Operations
  async getHot(key) {
    return await this.hotMemory.get(key);
  }

  async setHot(key, value) {
    await this.hotMemory.set(key, value);
    // Also persist to disk for persistence across restarts
    await this._persistToDisk('hot', key, value);
  }

  // Warm Memory Operations
  async getWarm(key) {
    return await this.warmMemory.get(key);
  }

  async setWarm(key, value) {
    await this.warmMemory.set(key, value);
    await this._persistToDisk('warm', key, value);
  }

  // Cold Memory Operations
  async getCold(key) {
    return await this.coldMemory.get(key);
  }

  async setCold(key, value) {
    await this.coldMemory.set(key, value);
    await this._persistToDisk('cold', key, value);
  }

  // Internal: Persist to disk
  async _persistToDisk(tier, key, value) {
    try {
      const tierDir = path.join(this.memoryDir, tier);
      await fs.mkdir(tierDir, { recursive: true });

      const filePath = path.join(tierDir, `${encodeURIComponent(key)}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(
          {
            key,
            value,
            timestamp: Date.now(),
            ttl: this[`${tier}Memory`].ttl,
          },
          null,
          2
        )
      );
    } catch (error) {
      logger.error(`Failed to persist ${tier} memory for key ${key}:`, error.message);
    }
  }

  // Internal: Load from disk
  async _loadFromDisk(tier) {
    try {
      const tierDir = path.join(this.memoryDir, tier);
      if (!existsSync(tierDir)) return;

      const files = await fs.readdir(tierDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(tierDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);

          // Check if still valid based on TTL
          if (data.ttl > 0) {
            const age = Date.now() - data.timestamp;
            if (age <= data.ttl) {
              await this[`${tier}Memory`].set(data.key, data.value);
            }
          } else {
            await this[`${tier}Memory`].set(data.key, data.value);
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to load ${tier} memory from disk:`, error.message);
    }
  }

  // Load all tiers from persistent storage
  async load() {
    await this._loadFromDisk('hot');
    await this._loadFromDisk('warm');
    await this._loadFromDisk('cold');
  }

  // Index recent commits for hot memory
  async indexRecentCommits() {
    try {
      const { execSync } = await import('child_process');
      const commits = execSync('git log --oneline -10', { encoding: 'utf8' });

      const commitList = commits
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, ...message] = line.split(' ');
          return { hash, message: message.join(' ') };
        });

      await this.setHot('recent-commits', commitList);
      return commitList;
    } catch (error) {
      logger.warn('Git not available or no commits found:', error.message);
      return [];
    }
  }

  // Index active files for hot memory
  async indexActiveFiles() {
    try {
      const activeFiles = await glob('**/*.{js,ts,jsx,tsx,md,json}', {
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'],
        cwd: this.projectRoot,
      });

      // Get recently modified files (last 1 hour)
      const recentFiles = [];
      for (const file of activeFiles) {
        try {
          const stat = await fs.stat(path.join(this.projectRoot, file));
          const hourAgo = Date.now() - 60 * 60 * 1000;
          if (stat.mtimeMs > hourAgo) {
            recentFiles.push({
              path: file,
              size: stat.size,
              modified: stat.mtime.toISOString(),
            });
          }
        } catch (e) {
          // Skip files that can't be accessed
        }
      }

      await this.setHot('active-files', recentFiles);
      return recentFiles;
    } catch (error) {
      logger.error('Failed to index active files:', error.message);
      return [];
    }
  }

  // Index PR summaries for warm memory
  async indexPRSummaries() {
    // In a real implementation, this would connect to GitHub API
    // For now, we'll look for any PR-related files in the project
    try {
      const prFiles = await glob('**/{pr,pull-request,pull_request,changeset}*.md', {
        cwd: this.projectRoot,
      });

      const summaries = [];
      for (const file of prFiles) {
        try {
          const content = await fs.readFile(path.join(this.projectRoot, file), 'utf8');
          // Extract summary information from PR files
          const lines = content.split('\n');
          const title = lines.find((l) => l.startsWith('# '))?.substring(2) || 'Unknown PR';
          summaries.push({
            file,
            title,
            lines: lines.length,
            firstLine: lines[0]?.substring(0, 100),
          });
        } catch (e) {
          // Skip files that can't be read
        }
      }

      await this.setWarm('pr-summaries', summaries);
      return summaries;
    } catch (error) {
      logger.error('Failed to index PR summaries:', error.message);
      return [];
    }
  }

  // Index architectural decisions for warm memory
  async indexArchitecturalDecisions() {
    try {
      const decFiles = await glob('**/{adr,decision,architecture}*.md', {
        cwd: this.projectRoot,
      });

      const decisions = [];
      for (const file of decFiles) {
        try {
          const content = await fs.readFile(path.join(this.projectRoot, file), 'utf8');
          decisions.push({
            file,
            contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            length: content.length,
          });
        } catch (e) {
          // Skip files that can't be read
        }
      }

      await this.setWarm('architectural-decisions', decisions);
      return decisions;
    } catch (error) {
      logger.error('Failed to index architectural decisions:', error.message);
      return [];
    }
  }

  // Index full repo history for cold memory
  async indexRepoHistory() {
    try {
      // This would normally connect to GitHub/GitLab API for full history
      // For now, we'll gather file statistics and structure
      const allFiles = await glob('**/*', {
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        cwd: this.projectRoot,
      });

      const fileStats = allFiles
        .map((file) => {
          try {
            const stat = statSync(path.join(this.projectRoot, file));
            return {
              path: file,
              size: stat.size,
              type: stat.isDirectory() ? 'directory' : 'file',
              extension: path.extname(file),
              modified: stat.mtime.toISOString(),
            };
          } catch (e) {
            return {
              path: file,
              error: e.message,
            };
          }
        })
        .filter((stat) => !stat.error);

      await this.setCold('repo-history', {
        totalFiles: fileStats.length,
        fileStats: fileStats.slice(0, 100), // Limit to first 100 for performance
        projectStructure: this._buildProjectStructure(fileStats),
      });

      return {
        totalFiles: fileStats.length,
        sampleSize: Math.min(100, fileStats.length),
      };
    } catch (error) {
      logger.error('Failed to index repo history:', error.message);
      return { totalFiles: 0, sampleSize: 0 };
    }
  }

  _buildProjectStructure(fileStats) {
    const structure = {};
    for (const file of fileStats) {
      const parts = file.path.split(path.sep);
      let current = structure;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { _files: [], _dirs: {} };
        }
        current = current[part]._dirs;
      }

      const lastPart = parts[parts.length - 1];
      if (current[lastPart]?._files) {
        current[lastPart]._files.push(file);
      } else {
        current[lastPart] = { _files: [file], _dirs: {} };
      }
    }
    return structure;
  }

  // Query memory across tiers
  async query(query, options = {}) {
    const { includeHot = true, includeWarm = true, includeCold = true } = options;

    const results = {
      hot: includeHot ? await this._searchTier(this.hotMemory, query) : [],
      warm: includeWarm ? await this._searchTier(this.warmMemory, query) : [],
      cold: includeCold ? await this._searchTier(this.coldMemory, query) : [],
    };

    return results;
  }

  async _searchTier(tier, query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [key, value] of tier.storage) {
      if (key.toLowerCase().includes(lowerQuery)) {
        results.push({ key, value, tier: tier.name });
      } else if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
        results.push({ key, value, tier: tier.name });
      } else if (typeof value === 'object') {
        // Search in object properties
        const valueStr = JSON.stringify(value).toLowerCase();
        if (valueStr.includes(lowerQuery)) {
          results.push({ key, value, tier: tier.name });
        }
      }
    }

    return results;
  }

  // Get memory statistics
  getStats() {
    return {
      hot: this.hotMemory.getStats(),
      warm: this.warmMemory.getStats(),
      cold: this.coldMemory.getStats(),
      projectRoot: this.projectRoot,
    };
  }

  // Clear specific tier or all memory
  async clear(tier = null) {
    if (tier) {
      await this[`${tier}Memory`].clear();
      // Also clear from disk
      const tierDir = path.join(this.memoryDir, tier);
      if (existsSync(tierDir)) {
        await fs.rm(tierDir, { recursive: true, force: true });
      }
    } else {
      await this.hotMemory.clear();
      await this.warmMemory.clear();
      await this.coldMemory.clear();

      // Clear all from disk
      if (existsSync(this.memoryDir)) {
        await fs.rm(this.memoryDir, { recursive: true, force: true });
      }
    }
  }

  // Index the entire project for all memory tiers
  async indexProject() {
    logger.log('🧠 Indexing project for multi-tier memory...');

    // Hot tier: recent activity
    await this.indexRecentCommits();
    await this.indexActiveFiles();

    // Warm tier: architectural information
    await this.indexPRSummaries();
    await this.indexArchitecturalDecisions();

    // Cold tier: full project history
    await this.indexRepoHistory();

    logger.log('✅ Project indexed across all memory tiers');
  }
}

// Global instance
export const multiTierMemory = new PersistentMemorySystem();

// Initialize and load on import
multiTierMemory.initialize().then(() => {
  multiTierMemory.load().catch(console.error);
});

export default multiTierMemory;
