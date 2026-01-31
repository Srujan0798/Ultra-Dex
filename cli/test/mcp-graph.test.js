/**
 * Unit tests for MCP graph module
 * Tests: projectGraph, file scanning, dependency tracking
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { projectGraph } from '../lib/mcp/graph.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('MCP Graph Module', () => {
  let tmpDir;

  beforeEach(async () => {
    // Create a fresh temp directory for each test
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-graph-test-'));
  });

  test('projectGraph has required methods', () => {
    assert.ok(typeof projectGraph.scan === 'function', 'Should have scan method');
    assert.ok(typeof projectGraph.getSummary === 'function', 'Should have getSummary method');
    assert.ok(typeof projectGraph.findRefereces === 'function', 'Should have findRefereces method');
  });

  test('projectGraph initializes with empty state', () => {
    assert.ok(projectGraph.nodes instanceof Map, 'Should have nodes Map');
    assert.ok(Array.isArray(projectGraph.edges), 'Should have edges array');
  });

  test('scan creates nodes for files', async () => {
    // Create test files
    await fs.writeFile(path.join(tmpDir, 'test.js'), 'const x = 1;');
    await fs.writeFile(path.join(tmpDir, 'test2.js'), 'const y = 2;');

    // Change to temp directory for scanning
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await projectGraph.scan();
      
      // Should have created nodes
      assert.ok(projectGraph.nodes.size > 0, 'Should have created nodes');
      
      // Check that JS files were detected
      let jsFilesFound = 0;
      for (const [filePath, node] of projectGraph.nodes) {
        if (filePath.endsWith('.js')) {
          jsFilesFound++;
          assert.ok(node, 'Node should have data');
        }
      }
      
      assert.ok(jsFilesFound >= 2, `Should have found at least 2 JS files, found ${jsFilesFound}`);
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('getSummary returns valid structure', async () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await projectGraph.scan();
      const summary = projectGraph.getSummary();
      
      assert.ok(typeof summary === 'object', 'Summary should be an object');
      assert.ok(typeof summary.nodeCount === 'number', 'Should have nodeCount');
      assert.ok(typeof summary.edgeCount === 'number', 'Should have edgeCount');
      assert.ok(summary.nodeCount >= 0, 'nodeCount should be non-negative');
      assert.ok(summary.edgeCount >= 0, 'edgeCount should be non-negative');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('handles empty directory gracefully', async () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      // Scan empty directory (or one with no JS/TS files)
      await projectGraph.scan();
      
      const summary = projectGraph.getSummary();
      // Should have valid structure even if empty
      assert.ok(typeof summary.nodeCount === 'number', 'Should have numeric nodeCount');
      assert.ok(typeof summary.edgeCount === 'number', 'Should have numeric edgeCount');
      assert.ok(summary.nodeCount >= 0, 'nodeCount should be non-negative');
      assert.ok(summary.edgeCount >= 0, 'edgeCount should be non-negative');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('handles node_modules exclusion', async () => {
    // Create node_modules with files
    const nodeModulesDir = path.join(tmpDir, 'node_modules');
    await fs.mkdir(nodeModulesDir, { recursive: true });
    await fs.writeFile(path.join(nodeModulesDir, 'test.js'), 'module.exports = {};');
    
    // Create regular file
    await fs.writeFile(path.join(tmpDir, 'app.js'), 'const x = 1;');

    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await projectGraph.scan();
      
      // Check that node_modules files are not included
      for (const filePath of projectGraph.nodes.keys()) {
        assert.ok(!filePath.includes('node_modules'), `Should not include node_modules files: ${filePath}`);
      }
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('findRefereces returns array', async () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      await projectGraph.scan();
      const refs = projectGraph.findRefereces('non-existent.js');
      assert.ok(Array.isArray(refs), 'Should return array');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('caching works correctly', async () => {
    await fs.writeFile(path.join(tmpDir, 'cached.js'), 'const x = 1;');
    
    const originalCwd = process.cwd();
    process.chdir(tmpDir);

    try {
      // First scan
      await projectGraph.scan();
      const firstSummary = projectGraph.getSummary();
      
      // Second scan with cache should return cached results
      const secondSummary = await projectGraph.scan(true);
      
      assert.strictEqual(secondSummary.nodeCount, firstSummary.nodeCount, 'Cached scan should return same node count');
      
      // Force fresh scan
      await projectGraph.scan(false);
      const freshSummary = projectGraph.getSummary();
      
      assert.ok(freshSummary.nodeCount >= firstSummary.nodeCount, 'Fresh scan should have same or more nodes');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
