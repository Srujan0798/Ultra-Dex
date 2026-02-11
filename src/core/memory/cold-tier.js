// Copyright (c) 2026 Ultra-Dex

/**
 * Cold Tier Memory (Relational Knowledge Graph)
 * Manages long-term architectural decisions and cross-references.
 */

import { sqliteProvider } from './sqlite.js';

export class ColdTier {
  constructor() {
    this.provider = sqliteProvider;
  }

  async add(record) {
    await this.provider.add('cold', record);
    
    // Auto-create relations if metadata contains links
    if (record.metadata?.relatesTo) {
      for (const targetId of record.metadata.relatesTo) {
        await this.createRelation(record.id, targetId, 'relates_to');
      }
    }
    
    return record;
  }

  async createRelation(fromId, toId, type) {
    await this.provider.init();
    // Use the metadata field in SQLite to store relations as a temporary graph solution
    const record = await this.provider.get('cold', fromId);
    if (record) {
      const metadata = record.metadata || {};
      metadata.relations = metadata.relations || [];
      metadata.relations.push({ to: toId, type });
      await this.provider.add('cold', { ...record, metadata });
    }
  }

  async findImpact(nodeId) {
    const record = await this.provider.get('cold', nodeId);
    if (!record) return [];
    
    // Simple BFS for impact analysis (max depth 3)
    const impact = [];
    const queue = [{ id: nodeId, depth: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth > 3 || visited.has(id)) continue;
      visited.add(id);

      const node = await this.provider.get('cold', id);
      if (node) {
        impact.push(node);
        if (node.metadata?.relations) {
          for (const rel of node.metadata.relations) {
            queue.push({ id: rel.to, depth: depth + 1 });
          }
        }
      }
    }

    return impact;
  }
}

export const coldTier = new ColdTier();