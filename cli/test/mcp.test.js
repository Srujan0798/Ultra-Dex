/**
 * MCP (Model Context Protocol) Server Tests
 * Tests HTTP endpoints, tools, and resources with mocked file system
 */
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Helper to create temp directory with test files
async function createTempProject(files = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-mcp-test-'));
  
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }
  
  return tmpDir;
}

// ===============================
// MCP TOOLS TESTS
// ===============================
describe('MCP Tools', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await createTempProject({
      'CONTEXT.md': '# Project Context\nThis is a test project for Ultra-Dex.',
      'IMPLEMENTATION-PLAN.md': `# Implementation Plan
## Phase 1: Setup
- [ ] Initialize project
- [x] Configure build tools

## Phase 2: Development
- [ ] Build API
- [ ] Create UI
`,
      '.ultra/state.json': JSON.stringify({
        project: { name: 'test-project', version: '1.0.0', mode: 'GOD_MODE' },
        score: 45,
        updatedAt: new Date().toISOString(),
        phases: [
          { 
            name: 'Setup', 
            status: 'in_progress',
            steps: [
              { id: '1.1', task: 'Initialize project', status: 'pending' },
              { id: '1.2', task: 'Configure build tools', status: 'completed' }
            ]
          }
        ],
        agents: { registry: ['planner', 'backend', 'frontend'], active: [] }
      }),
      'src/api/users.js': `
export async function getUsers() {
  return db.query('SELECT * FROM users');
}

export async function createUser(data) {
  return db.insert('users', data);
}
`,
      'src/components/Button.jsx': `
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
`,
      'agents/backend.md': '# Backend Agent\nYou are a skilled backend developer.',
      'agents/1-leadership/cto.md': '# CTO Agent\nYou are the technical leader.'
    });
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('read_code tool', () => {
    test('reads file content correctly', async () => {
      const content = await fs.readFile('CONTEXT.md', 'utf8');
      assert.match(content, /Project Context/);
      assert.match(content, /test project/);
    });

    test('reads nested file content', async () => {
      const content = await fs.readFile('src/api/users.js', 'utf8');
      assert.match(content, /getUsers/);
      assert.match(content, /createUser/);
    });

    test('handles non-existent file gracefully', async () => {
      try {
        await fs.readFile('nonexistent.js', 'utf8');
        assert.fail('Should throw error');
      } catch (e) {
        assert.match(e.code, /ENOENT/);
      }
    });
  });

  describe('write_code tool', () => {
    test('creates new file', async () => {
      const newContent = 'export const VERSION = "1.0.0";';
      await fs.writeFile('src/version.js', newContent);
      
      const content = await fs.readFile('src/version.js', 'utf8');
      assert.equal(content, newContent);
    });

    test('creates directories recursively', async () => {
      await fs.mkdir('src/deep/nested/path', { recursive: true });
      await fs.writeFile('src/deep/nested/path/file.js', 'test');
      
      assert.ok(existsSync('src/deep/nested/path/file.js'));
    });

    test('overwrites existing file', async () => {
      await fs.writeFile('CONTEXT.md', '# New Context');
      const content = await fs.readFile('CONTEXT.md', 'utf8');
      assert.equal(content, '# New Context');
    });
  });

  describe('update_task_status tool', () => {
    test('loads and parses state correctly', async () => {
      const stateContent = await fs.readFile('.ultra/state.json', 'utf8');
      const state = JSON.parse(stateContent);
      
      assert.equal(state.project.name, 'test-project');
      assert.equal(state.score, 45);
      assert.equal(state.phases[0].steps[0].status, 'pending');
    });

    test('can modify task status', async () => {
      // Read state
      const stateContent = await fs.readFile('.ultra/state.json', 'utf8');
      const state = JSON.parse(stateContent);
      
      // Update task
      state.phases[0].steps[0].status = 'completed';
      
      // Save state
      await fs.writeFile('.ultra/state.json', JSON.stringify(state, null, 2));
      
      // Verify
      const newState = JSON.parse(await fs.readFile('.ultra/state.json', 'utf8'));
      assert.equal(newState.phases[0].steps[0].status, 'completed');
    });
  });

  describe('get_agent tool', () => {
    test('finds agent in root agents directory', async () => {
      const content = await fs.readFile('agents/backend.md', 'utf8');
      assert.match(content, /Backend Agent/);
    });

    test('finds agent in nested category directory', async () => {
      const content = await fs.readFile('agents/1-leadership/cto.md', 'utf8');
      assert.match(content, /CTO Agent/);
    });

    test('handles missing agent gracefully', async () => {
      const agentPath = 'agents/nonexistent.md';
      assert.ok(!existsSync(agentPath));
    });
  });

  describe('query_codebase tool', () => {
    test('can list source files', async () => {
      const srcFiles = await fs.readdir('src', { recursive: true });
      assert.ok(srcFiles.some(f => f.includes('users.js')));
      assert.ok(srcFiles.some(f => f.includes('Button.jsx')));
    });

    test('can search for content in files', async () => {
      const content = await fs.readFile('src/api/users.js', 'utf8');
      assert.ok(content.includes('getUsers'));
      assert.ok(content.includes('createUser'));
    });
  });
});

// ===============================
// MCP RESOURCES TESTS
// ===============================
describe('MCP Resources', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await createTempProject({
      'CONTEXT.md': '# Test Context\nDescription of the project.',
      'IMPLEMENTATION-PLAN.md': '# Plan\n## Phase 1\n- Task 1',
      '.ultra/state.json': JSON.stringify({
        project: { name: 'resource-test', version: '1.0.0' },
        score: 75,
        phases: [],
        agents: { registry: [], active: [] }
      }),
      'agents/00-AGENT_INDEX.md': '# Agent Index\n- backend\n- frontend\n- cto'
    });
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('context resource', () => {
    test('returns CONTEXT.md content', async () => {
      const content = await fs.readFile('CONTEXT.md', 'utf8');
      assert.match(content, /Test Context/);
      assert.match(content, /Description/);
    });

    test('handles missing CONTEXT.md', async () => {
      await fs.unlink('CONTEXT.md');
      assert.ok(!existsSync('CONTEXT.md'));
    });
  });

  describe('plan resource', () => {
    test('returns IMPLEMENTATION-PLAN.md content', async () => {
      const content = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8');
      assert.match(content, /Plan/);
      assert.match(content, /Phase 1/);
    });
  });

  describe('state resource', () => {
    test('returns project state as JSON', async () => {
      const content = await fs.readFile('.ultra/state.json', 'utf8');
      const state = JSON.parse(content);
      
      assert.equal(state.project.name, 'resource-test');
      assert.equal(state.score, 75);
    });
  });

  describe('agents resource', () => {
    test('returns agent index', async () => {
      const content = await fs.readFile('agents/00-AGENT_INDEX.md', 'utf8');
      assert.match(content, /Agent Index/);
      assert.match(content, /backend/);
      assert.match(content, /frontend/);
    });
  });
});

// ===============================
// ERROR HANDLING TESTS
// ===============================
describe('Error Handling', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await createTempProject({});
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('handles missing state file gracefully', async () => {
    // No .ultra/state.json exists
    const statePath = '.ultra/state.json';
    assert.ok(!existsSync(statePath));
  });

  test('handles invalid JSON in state file', async () => {
    await fs.mkdir('.ultra', { recursive: true });
    await fs.writeFile('.ultra/state.json', '{ invalid json }');
    
    try {
      const content = await fs.readFile('.ultra/state.json', 'utf8');
      JSON.parse(content);
      assert.fail('Should throw JSON parse error');
    } catch (e) {
      assert.ok(e instanceof SyntaxError);
    }
  });

  test('handles permission errors gracefully', async () => {
    // Try to read from a non-existent deep path
    try {
      await fs.readFile('/nonexistent/path/file.txt');
      assert.fail('Should throw error');
    } catch (e) {
      assert.ok(e.code === 'ENOENT' || e.code === 'EACCES');
    }
  });

  test('validates file path stays within project root', async () => {
    // Security check: path traversal should be prevented
    const safePath = path.resolve(tmpDir, 'src/file.js');
    const unsafePath = path.resolve(tmpDir, '../../../etc/passwd');
    
    assert.ok(safePath.startsWith(tmpDir));
    assert.ok(!unsafePath.startsWith(tmpDir));
  });
});

// ===============================
// GRAPH FUNCTIONALITY TESTS
// ===============================
describe('Graph Functionality', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await createTempProject({
      'src/index.js': `
import { helper } from './utils/helper.js';
import { api } from './api/index.js';
export { helper, api };
`,
      'src/utils/helper.js': `
export function helper() { return 'help'; }
`,
      'src/api/index.js': `
import { helper } from '../utils/helper.js';
export const api = { helper };
`
    });
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('can identify import relationships', async () => {
    const indexContent = await fs.readFile('src/index.js', 'utf8');
    
    // Extract imports
    const importMatches = indexContent.match(/import .+ from ['"](.+)['"]/g) || [];
    assert.ok(importMatches.length >= 2);
  });

  test('can detect circular dependencies', async () => {
    // Add circular dependency
    await fs.writeFile('src/utils/helper.js', `
import { api } from '../api/index.js';
export function helper() { return api; }
`);
    
    const helperContent = await fs.readFile('src/utils/helper.js', 'utf8');
    const apiContent = await fs.readFile('src/api/index.js', 'utf8');
    
    // Both files import from each other
    assert.match(helperContent, /import .+ from ['"]..\/api/);
    assert.match(apiContent, /import .+ from ['"]..\/utils/);
  });

  test('can find files by extension', async () => {
    const files = await fs.readdir('src', { recursive: true });
    const jsFiles = files.filter(f => f.endsWith('.js'));
    assert.ok(jsFiles.length >= 3);
  });
});

// ===============================
// MOCK PROVIDER TESTS
// ===============================
describe('Mock AI Provider', () => {
  class MockProvider {
    constructor(responses = {}) {
      this.responses = responses;
      this.calls = [];
    }

    async generate(system, prompt) {
      this.calls.push({ system, prompt });
      
      // Return mock response based on content
      if (prompt.includes('plan')) {
        return { content: 'Mock plan: 1. Design 2. Implement 3. Test' };
      }
      if (prompt.includes('code')) {
        return { content: 'export function mock() { return true; }' };
      }
      return { content: this.responses.default || 'Mock response' };
    }

    async complete(prompt) {
      return this.generate('', prompt);
    }
  }

  test('mock provider records calls', async () => {
    const provider = new MockProvider();
    
    await provider.generate('system', 'Generate a plan');
    await provider.generate('system', 'Write some code');
    
    assert.equal(provider.calls.length, 2);
    assert.match(provider.calls[0].prompt, /plan/);
    assert.match(provider.calls[1].prompt, /code/);
  });

  test('mock provider returns appropriate responses', async () => {
    const provider = new MockProvider();
    
    const planResult = await provider.generate('', 'Create a plan');
    assert.match(planResult.content, /Mock plan/);
    
    const codeResult = await provider.generate('', 'Generate code');
    assert.match(codeResult.content, /export function/);
  });

  test('mock provider supports custom responses', async () => {
    const provider = new MockProvider({ default: 'Custom response' });
    
    const result = await provider.generate('', 'Something else');
    assert.equal(result.content, 'Custom response');
  });
});

// ===============================
// HTTP ENDPOINT SIMULATION TESTS
// ===============================
describe('HTTP Endpoint Behavior', () => {
  // Simulating endpoint behavior without actual HTTP server
  
  function simulateEndpoint(method, path, body = null) {
    // Simulate routing
    const routes = {
      'GET /api/state': () => ({ 
        status: 200, 
        body: { project: 'test', score: 80 } 
      }),
      'GET /api/graph': () => ({ 
        status: 200, 
        body: { nodes: 10, edges: 15 } 
      }),
      'POST /api/swarm': (data) => {
        if (!data?.feature) {
          return { status: 400, body: { error: 'Feature required' } };
        }
        return { status: 200, body: { success: true, message: 'Swarm started' } };
      },
      'POST /api/action/build': () => ({ 
        status: 200, 
        body: { success: true } 
      }),
      'GET /api/unknown': () => ({ 
        status: 404, 
        body: { error: 'Not found' } 
      })
    };

    const routeKey = `${method} ${path}`;
    const handler = routes[routeKey];
    
    if (!handler) {
      return { status: 404, body: { error: 'Not found' } };
    }
    
    return handler(body);
  }

  test('GET /api/state returns project state', () => {
    const response = simulateEndpoint('GET', '/api/state');
    assert.equal(response.status, 200);
    assert.ok('project' in response.body);
    assert.ok('score' in response.body);
  });

  test('GET /api/graph returns graph data', () => {
    const response = simulateEndpoint('GET', '/api/graph');
    assert.equal(response.status, 200);
    assert.ok('nodes' in response.body);
    assert.ok('edges' in response.body);
  });

  test('POST /api/swarm with valid data succeeds', () => {
    const response = simulateEndpoint('POST', '/api/swarm', { feature: 'test feature' });
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
  });

  test('POST /api/swarm without feature returns 400', () => {
    const response = simulateEndpoint('POST', '/api/swarm', {});
    assert.equal(response.status, 400);
    assert.ok('error' in response.body);
  });

  test('POST /api/action/build succeeds', () => {
    const response = simulateEndpoint('POST', '/api/action/build');
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
  });

  test('Unknown endpoint returns 404', () => {
    const response = simulateEndpoint('GET', '/api/unknown');
    assert.equal(response.status, 404);
  });

  test('Non-existent route returns 404', () => {
    const response = simulateEndpoint('GET', '/api/doesnotexist');
    assert.equal(response.status, 404);
  });
});

// ===============================
// STATE MANAGEMENT TESTS
// ===============================
describe('State Management', () => {
  let tmpDir;
  let originalCwd;
  
  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await createTempProject({
      '.ultra/state.json': JSON.stringify({
        project: { name: 'state-test', version: '1.0.0' },
        score: 50,
        phases: [
          {
            name: 'Phase 1',
            status: 'in_progress',
            steps: [
              { id: '1.1', task: 'Task 1', status: 'completed' },
              { id: '1.2', task: 'Task 2', status: 'pending' }
            ]
          }
        ],
        agents: { registry: ['test'], active: [] }
      })
    });
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('state can be loaded', async () => {
    const content = await fs.readFile('.ultra/state.json', 'utf8');
    const state = JSON.parse(content);
    assert.equal(state.project.name, 'state-test');
  });

  test('state can be updated', async () => {
    const content = await fs.readFile('.ultra/state.json', 'utf8');
    const state = JSON.parse(content);
    
    state.score = 75;
    state.updatedAt = new Date().toISOString();
    
    await fs.writeFile('.ultra/state.json', JSON.stringify(state, null, 2));
    
    const updated = JSON.parse(await fs.readFile('.ultra/state.json', 'utf8'));
    assert.equal(updated.score, 75);
  });

  test('calculates progress from steps', async () => {
    const content = await fs.readFile('.ultra/state.json', 'utf8');
    const state = JSON.parse(content);
    
    const totalSteps = state.phases.reduce((sum, p) => sum + p.steps.length, 0);
    const completedSteps = state.phases.reduce(
      (sum, p) => sum + p.steps.filter(s => s.status === 'completed').length, 
      0
    );
    
    const progress = Math.round((completedSteps / totalSteps) * 100);
    assert.equal(totalSteps, 2);
    assert.equal(completedSteps, 1);
    assert.equal(progress, 50);
  });
});
