# Ultra-Dex CLI Test Suite Documentation

## Overview

The Ultra-Dex CLI test suite uses Node.js built-in test runner. This document provides comprehensive information about the test structure, coverage, and how to run tests.

## Test Structure

All tests are located in `cli/test/` directory:

```
cli/test/
├── agents.test.js        # Agent command utilities (40+ tests)
├── cli.test.js           # CLI entry point tests (7 tests)
├── commands.test.js      # Command integration tests (60+ tests)
├── critical-commands.test.js # Critical command tests (30+ tests)
├── delegation.test.js    # Agent delegation tests
├── files.test.js         # File utility tests (40+ tests)
├── mcp-graph.test.js     # MCP graph tests (8 tests)
├── mcp.test.js           # MCP server tests
├── state.test.js         # State management tests (19 tests)
├── theme.test.js         # UI theme tests (50+ tests)
├── utils.test.js         # Utility tests (18 tests)
├── validation.test.js    # Validation tests (35+ tests)
└── v2-commands.test.js   # v2 command smoke tests (6 tests)

Total: 13 test files, 281 test cases
```

## Coverage Report

**Current Coverage: 41.27%** (target: 70%)

| Metric | Current | Target |
|--------|---------|--------|
| Statements | 41.27% | 70% |
| Branches | 78.7% | 70% |
| Functions | 26.34% | 70% |
| Lines | 41.27% | 70% |

## Test Categories

### 1. Unit Tests (utils, validation, theme)
- **Location**: `utils.test.js`, `validation.test.js`, `files.test.js`, `theme.test.js`
- **Purpose**: Test individual utility functions in isolation
- **Speed**: Fast (< 100ms each)
- **Coverage**: High (90%+ for tested utilities)

### 2. Integration Tests (commands)
- **Location**: `commands.test.js`, `critical-commands.test.js`, `v2-commands.test.js`
- **Purpose**: Test command execution and interactions
- **Speed**: Medium (1-5s each)
- **Coverage**: Medium (50-70%)

### 3. State Management Tests
- **Location**: `state.test.js`, `mcp-graph.test.js`
- **Purpose**: Test state operations and graph functionality
- **Speed**: Fast-Medium
- **Coverage**: Good (80%+)

### 4. Agent Tests
- **Location**: `agents.test.js`, `delegation.test.js`
- **Purpose**: Test agent utilities and coordination
- **Speed**: Fast
- **Coverage**: Good (85%+)

## Running Tests

### Run all tests
```bash
cd cli
npm test
```

### Run with coverage
```bash
cd cli
npm run test:coverage
```

### Run specific test file
```bash
cd cli
node --test test/utils.test.js
```

### Run multiple test files
```bash
cd cli
node --test test/utils.test.js test/validation.test.js test/files.test.js
```

### CI mode (with thresholds)
```bash
cd cli
npm run test:ci
```

## Test Utilities

### Helper Functions

Most test files include these helpers:

```javascript
// Create temp directory for isolated tests
async function createTempProject(files = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }
  return tmpDir;
}

// Run CLI command in test
function runCli(args, options = {}) {
  const cliPath = path.resolve(process.cwd(), 'cli/bin/ultra-dex.js');
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent' },
    encoding: 'utf8'
  });
}
```

## Key Test Files Explained

### utils.test.js
Tests for core utilities:
- Agent definitions and properties
- Theme state management (doomsday mode)
- Version constants
- Provider factory functions

### validation.test.js
Tests for input validation:
- Project name validation (regex, special chars, path traversal)
- Safe path validation
- Path assertion functions
- Edge cases (empty, whitespace, null)

### files.test.js
Tests for file operations:
- Safe file reading with fallbacks
- Path existence checking (file vs dir)
- Asset path resolution
- Directory copying (recursive, empty dirs)

### theme.test.js
Tests for UI components:
- Color constants and gradients
- Box drawing functions
- Status icons
- Progress bars
- Table formatting

### state.test.js
Tests for state management:
- State locking mechanism
- Load/save operations
- State updates with locking
- State computation from files

### agents.test.js
Tests for agent utilities:
- Agent registry and lookup
- Custom agent management
- Agent file operations

## Best Practices

### 1. Isolation
Each test should be independent:
```javascript
describe('my feature', () => {
  let tmpDir;
  
  beforeEach(async () => {
    tmpDir = await createTempProject();
    process.chdir(tmpDir);
  });
  
  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true });
  });
});
```

### 2. Async Testing
Always handle async operations:
```javascript
test('async operation', async () => {
  const result = await someAsyncFunction();
  assert.strictEqual(result, 'expected');
});
```

### 3. Error Testing
Test error cases explicitly:
```javascript
test('throws on invalid input', async () => {
  await assert.rejects(
    async () => await functionThatThrows(),
    /expected error message/
  );
});
```

### 4. Edge Cases
Test boundary conditions:
```javascript
test('handles empty string', () => {
  assert.strictEqual(validateProjectName(''), 'Project name is required');
});

test('handles very long input', () => {
  const longName = 'a'.repeat(1000);
  assert.strictEqual(typeof validateProjectName(longName), 'string');
});
```

## Coverage Gaps

Modules needing more tests to reach 70%:

1. **Commands** (currently ~30%)
   - `agents.js` - Command handlers
   - `swarm.js` - Parallel execution logic
   - `serve.js` - HTTP server and MCP
   - `brain.js` - Brain sync functionality
   - `monitoring.js` - Monitoring commands

2. **Providers** (currently ~20%)
   - `claude.js` - Claude API integration
   - `openai.js` - OpenAI API integration
   - `gemini.js` - Gemini API integration
   - `ollama.js` - Local Ollama integration
   - `router.js` - Semantic routing

3. **MCP** (currently ~40%)
   - `server.js` - MCP server implementation
   - `websocket.js` - WebSocket handling
   - `tools/` - Individual MCP tools

4. **Config** (currently ~10%)
   - `paths.js` - Path resolution
   - `urls.js` - URL generation

## CI/CD Integration

Tests run automatically on:
- Every push to main/master/develop
- Every pull request
- Manual workflow dispatch

Coverage reports are uploaded as artifacts and can be viewed in GitHub Actions.

## Adding New Tests

1. Create test file in `cli/test/`
2. Use descriptive test names
3. Group related tests in `describe` blocks
4. Clean up resources in `afterEach`
5. Run tests locally before committing
6. Update this documentation

## Troubleshooting

### Tests fail with "Cannot find module"
Check that the CLI is installed:
```bash
cd cli && npm install
```

### Tests timeout
Some integration tests take >30s. Increase timeout:
```bash
node --test --test-timeout=60000 test/commands.test.js
```

### Coverage not generating
Ensure c8 is installed:
```bash
cd cli && npm install --save-dev c8
```

## Resources

- [Node.js Test Runner Docs](https://nodejs.org/api/test.html)
- [C8 Coverage Docs](https://github.com/bcoe/c8)
- [Ultra-Dex Contributing Guide](../CONTRIBUTING.md)

---

*Last updated: February 2026*
*Test count: 350+*
*Coverage: 41.27% → 70% (in progress)*
