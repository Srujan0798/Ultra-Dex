// Copyright (c) 2026 Ultra-Dex

/**
 * FalkorDB Client (best-effort)
 * Uses Redis protocol via optional "redis" package when available.
 */

export class FalkorDBClient {
  constructor(options = {}) {
    this.url = options.url || process.env.FALKORDB_URL || 'redis://localhost:6379';
    this.graph = options.graph || process.env.FALKORDB_GRAPH || 'ultra_dex';
    this.client = null;
    this.available = false;
  }

  async connect() {
    try {
      const redisModule = await import('redis');
      const createClient = redisModule.createClient || redisModule.default?.createClient;
      if (!createClient) {
        throw new Error('redis client not available');
      }
      this.client = createClient({ url: this.url });
      this.client.on('error', () => {});
      await this.client.connect();
      this.available = true;
      return true;
    } catch (error) {
      this.available = false;
      throw new Error(`FalkorDB client unavailable: ${error.message}`);
    }
  }

  async run(query, params = {}) {
    if (!this.available || !this.client) {
      throw new Error('FalkorDB client not connected');
    }

    // Simple parameter interpolation (best-effort)
    let interpolated = query;
    for (const [key, value] of Object.entries(params)) {
      const safe = String(value).replace(/"/g, '\\"');
      interpolated = interpolated.replace(new RegExp(`\\$${key}`, 'g'), `"${safe}"`);
    }

    const args = ['GRAPH.QUERY', this.graph, interpolated, '--compact'];
    const response = await this.client.sendCommand(args);
    return response;
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
    this.available = false;
  }
}

export default FalkorDBClient;
