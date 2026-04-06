import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { MarketplaceAPI } from '../../src/core/mcp/marketplace-api.js';

describe('MarketplaceAPI', () => {
  let tempDir;
  let cachePath;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-marketplace-'));
    cachePath = path.join(tempDir, 'cache.json');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('searches, gets plugin metadata, downloads, and publishes through the marketplace interface', async () => {
    const requests = [];
    const api = new MarketplaceAPI({
      cachePath,
      registryUrl: 'https://registry.example.test',
      fetchImpl: async (url, options = {}) => {
        requests.push({ url, options });
        if (url.includes('/plugins?q=jira')) {
          return {
            ok: true,
            async json() {
              return { plugins: [{ id: 'jira', version: '1.0.0' }] };
            },
          };
        }
        if (url.endsWith('/plugins/jira')) {
          return {
            ok: true,
            async json() {
              return { id: 'jira', description: 'Jira integration' };
            },
          };
        }
        if (url.includes('/download')) {
          return {
            ok: true,
            async arrayBuffer() {
              return new TextEncoder().encode('plugin-binary').buffer;
            },
          };
        }
        return {
          ok: true,
          async json() {
            return { success: true };
          },
        };
      },
    });

    const searchResults = await api.search('jira');
    const plugin = await api.getPlugin('jira');
    const artifact = await api.download('jira', '1.0.0');
    const pluginFile = path.join(tempDir, 'plugin.tgz');
    await fs.writeFile(pluginFile, 'archive');
    const published = await api.publish(pluginFile, 'secret');

    assert.strictEqual(searchResults[0].id, 'jira');
    assert.strictEqual(plugin.id, 'jira');
    assert.strictEqual(artifact.toString(), 'plugin-binary');
    assert.strictEqual(published.success, true);
    assert.strictEqual(requests.length, 4);
  });
});
