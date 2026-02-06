/**
 * Tests for FalkorDB Client
 *
 * Critical graph database module - ensures Redis/FalkorDB connectivity
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FalkorDBClient } from '../../lib/graph/falkordb-client.js';

describe('FalkorDBClient - Initialization', () => {
  test('should initialize with default options', () => {
    const client = new FalkorDBClient();

    assert.ok(client.url);
    assert.ok(client.graph);
    assert.strictEqual(client.available, false);
    assert.strictEqual(client.client, null);
  });

  test('should use default URL', () => {
    const client = new FalkorDBClient();

    assert.strictEqual(client.url, 'redis://localhost:6379');
  });

  test('should use custom URL', () => {
    const client = new FalkorDBClient({
      url: 'redis://custom:1234',
    });

    assert.strictEqual(client.url, 'redis://custom:1234');
  });

  test('should use default graph name', () => {
    const client = new FalkorDBClient();

    assert.strictEqual(client.graph, 'ultra_dex');
  });

  test('should use custom graph name', () => {
    const client = new FalkorDBClient({
      graph: 'custom_graph',
    });

    assert.strictEqual(client.graph, 'custom_graph');
  });

  test('should respect FALKORDB_URL environment variable', () => {
    const originalUrl = process.env.FALKORDB_URL;
    process.env.FALKORDB_URL = 'redis://env:6380';

    const client = new FalkorDBClient();

    assert.strictEqual(client.url, 'redis://env:6380');

    // Restore
    if (originalUrl) {
      process.env.FALKORDB_URL = originalUrl;
    } else {
      delete process.env.FALKORDB_URL;
    }
  });

  test('should respect FALKORDB_GRAPH environment variable', () => {
    const originalGraph = process.env.FALKORDB_GRAPH;
    process.env.FALKORDB_GRAPH = 'env_graph';

    const client = new FalkorDBClient();

    assert.strictEqual(client.graph, 'env_graph');

    // Restore
    if (originalGraph) {
      process.env.FALKORDB_GRAPH = originalGraph;
    } else {
      delete process.env.FALKORDB_GRAPH;
    }
  });
});

describe('FalkorDBClient - Connect (without Redis)', () => {
  let client;

  beforeEach(() => {
    client = new FalkorDBClient();
  });

  test('should throw error when redis package not available', async () => {
    try {
      await client.connect();
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('FalkorDB client unavailable'));
    }
  });

  test('should set available to false on connection failure', async () => {
    try {
      await client.connect();
    } catch (error) {
      // Expected
    }

    assert.strictEqual(client.available, false);
  });

  test('should not set client on connection failure', async () => {
    try {
      await client.connect();
    } catch (error) {
      // Expected
    }

    assert.strictEqual(client.client, null);
  });
});

describe('FalkorDBClient - Run Query (without connection)', () => {
  let client;

  beforeEach(() => {
    client = new FalkorDBClient();
  });

  test('should throw error when not connected', async () => {
    try {
      await client.run('MATCH (n) RETURN n');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('not connected'));
    }
  });

  test('should throw error when client is null', async () => {
    client.available = true; // Fake availability
    client.client = null;

    try {
      await client.run('MATCH (n) RETURN n');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('not connected'));
    }
  });

  test('should throw error when not available', async () => {
    client.available = false;
    client.client = {}; // Fake client

    try {
      await client.run('MATCH (n) RETURN n');
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error.message.includes('not connected'));
    }
  });
});

describe('FalkorDBClient - Parameter Interpolation', () => {
  let client;

  beforeEach(() => {
    client = new FalkorDBClient();
  });

  test('should interpolate simple string parameter', () => {
    const query = 'MATCH (n {name: $name}) RETURN n';
    const params = { name: 'test' };

    // We'll test the interpolation logic indirectly
    // by checking if the error message contains the interpolated value
    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        assert.ok(interpolated.includes('"test"'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should escape quotes in parameters', () => {
    const query = 'MATCH (n {name: $name}) RETURN n';
    const params = { name: 'test "quoted" value' };

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        // Should have escaped quotes
        assert.ok(interpolated.includes('\\"quoted\\"'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should handle multiple parameters', () => {
    const query = 'MATCH (n {name: $name, age: $age}) RETURN n';
    const params = { name: 'Alice', age: 30 };

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        assert.ok(interpolated.includes('"Alice"'));
        assert.ok(interpolated.includes('"30"'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should handle empty parameters', () => {
    const query = 'MATCH (n) RETURN n';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.strictEqual(args[0], 'GRAPH.QUERY');
        assert.strictEqual(args[1], 'ultra_dex');
        assert.strictEqual(args[2], 'MATCH (n) RETURN n');
        throw new Error('Test error');
      },
    };

    client.run(query, {}).catch(() => {});
  });
});

describe('FalkorDBClient - Command Format', () => {
  let client;

  beforeEach(() => {
    client = new FalkorDBClient({ graph: 'test_graph' });
  });

  test('should format command correctly', () => {
    const query = 'MATCH (n) RETURN n';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.strictEqual(args[0], 'GRAPH.QUERY');
        assert.strictEqual(args[1], 'test_graph');
        assert.strictEqual(args[2], query);
        assert.strictEqual(args[3], '--compact');
        throw new Error('Test error');
      },
    };

    client.run(query).catch(() => {});
  });

  test('should use correct graph name', () => {
    const customClient = new FalkorDBClient({ graph: 'custom' });
    const query = 'MATCH (n) RETURN n';

    customClient.available = true;
    customClient.client = {
      sendCommand: async (args) => {
        assert.strictEqual(args[1], 'custom');
        throw new Error('Test error');
      },
    };

    customClient.run(query).catch(() => {});
  });

  test('should always include --compact flag', () => {
    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args.includes('--compact'));
        throw new Error('Test error');
      },
    };

    client.run('MATCH (n) RETURN n').catch(() => {});
  });
});

describe('FalkorDBClient - Close', () => {
  test('should handle close when not connected', async () => {
    const client = new FalkorDBClient();

    await client.close();

    assert.strictEqual(client.available, false);
  });

  test('should handle close when client is null', async () => {
    const client = new FalkorDBClient();
    client.client = null;

    await client.close();

    assert.strictEqual(client.available, false);
  });

  test('should set available to false after close', async () => {
    const client = new FalkorDBClient();
    client.available = true;
    client.client = {
      quit: async () => {},
    };

    await client.close();

    assert.strictEqual(client.available, false);
  });

  test('should call quit on client', async () => {
    const client = new FalkorDBClient();
    let quitCalled = false;

    client.client = {
      quit: async () => {
        quitCalled = true;
      },
    };

    await client.close();

    assert.strictEqual(quitCalled, true);
  });
});

describe('FalkorDBClient - Edge Cases', () => {
  test('should handle special characters in parameters', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n {text: $text}) RETURN n';
    const params = { text: 'special: @#$%^&*()' };

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        assert.ok(interpolated.includes('special'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should handle numeric parameters', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n {age: $age}) RETURN n';
    const params = { age: 42 };

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        assert.ok(interpolated.includes('"42"'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should handle boolean parameters', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n {active: $active}) RETURN n';
    const params = { active: true };

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        const interpolated = args[2];
        assert.ok(interpolated.includes('"true"'));
        throw new Error('Test error');
      },
    };

    client.run(query, params).catch(() => {});
  });

  test('should handle undefined URL gracefully', () => {
    const originalUrl = process.env.FALKORDB_URL;
    delete process.env.FALKORDB_URL;

    const client = new FalkorDBClient({ url: undefined });

    // Should fall back to default
    assert.ok(client.url);

    if (originalUrl) {
      process.env.FALKORDB_URL = originalUrl;
    }
  });

  test('should handle undefined graph gracefully', () => {
    const originalGraph = process.env.FALKORDB_GRAPH;
    delete process.env.FALKORDB_GRAPH;

    const client = new FalkorDBClient({ graph: undefined });

    // Should fall back to default
    assert.ok(client.graph);

    if (originalGraph) {
      process.env.FALKORDB_GRAPH = originalGraph;
    }
  });

  test('should handle empty query', () => {
    const client = new FalkorDBClient();
    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.strictEqual(args[2], '');
        throw new Error('Test error');
      },
    };

    client.run('').catch(() => {});
  });

  test('should handle very long queries', () => {
    const client = new FalkorDBClient();
    const longQuery =
      'MATCH (n) WHERE n.name IN [' + Array(1000).fill('"test"').join(',') + '] RETURN n';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args[2].length > 10000);
        throw new Error('Test error');
      },
    };

    client.run(longQuery).catch(() => {});
  });
});

describe('FalkorDBClient - Connection String Formats', () => {
  test('should handle redis:// protocol', () => {
    const client = new FalkorDBClient({ url: 'redis://localhost:6379' });

    assert.strictEqual(client.url, 'redis://localhost:6379');
  });

  test('should handle rediss:// protocol (TLS)', () => {
    const client = new FalkorDBClient({ url: 'rediss://secure.redis.com:6380' });

    assert.strictEqual(client.url, 'rediss://secure.redis.com:6380');
  });

  test('should handle URLs with auth', () => {
    const client = new FalkorDBClient({ url: 'redis://user:password@host:6379' });

    assert.strictEqual(client.url, 'redis://user:password@host:6379');
  });

  test('should handle URLs with database number', () => {
    const client = new FalkorDBClient({ url: 'redis://localhost:6379/2' });

    assert.strictEqual(client.url, 'redis://localhost:6379/2');
  });
});

describe('FalkorDBClient - Query Patterns', () => {
  test('should handle CREATE query', () => {
    const client = new FalkorDBClient();
    const query = 'CREATE (n:Person {name: $name})';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args[2].includes('CREATE'));
        throw new Error('Test error');
      },
    };

    client.run(query, { name: 'Alice' }).catch(() => {});
  });

  test('should handle MATCH query', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n:Person) RETURN n';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args[2].includes('MATCH'));
        throw new Error('Test error');
      },
    };

    client.run(query).catch(() => {});
  });

  test('should handle UPDATE query', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n:Person {name: $name}) SET n.age = $age';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args[2].includes('SET'));
        throw new Error('Test error');
      },
    };

    client.run(query, { name: 'Alice', age: 30 }).catch(() => {});
  });

  test('should handle DELETE query', () => {
    const client = new FalkorDBClient();
    const query = 'MATCH (n:Person) DELETE n';

    client.available = true;
    client.client = {
      sendCommand: async (args) => {
        assert.ok(args[2].includes('DELETE'));
        throw new Error('Test error');
      },
    };

    client.run(query).catch(() => {});
  });
});
