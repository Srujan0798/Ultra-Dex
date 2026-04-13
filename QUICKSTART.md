# Ultra-Dex V2.0 Quick Start Guide

**Get up and running with Ultra-Dex in 5 minutes.**

---

## What is Ultra-Dex?

Ultra-Dex is **"Kubernetes for AI workflows"** — a deterministic orchestration engine that manages multi-agent workflows with proper dependency resolution, state management, and execution guarantees.

---

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install from Source

```bash
git clone https://github.com/yourusername/ultra-dex.git
cd ultra-dex
npm install
```

### Verify Installation

```bash
npx tsx cli/index.ts --version
```

---

## Your First Workflow

### 1. Create a Workflow File

Create `hello-world.dex`:

```yaml
version: dexgraph/v1
name: hello-world
description: My first Ultra-Dex workflow

context:
  project: my-first-project

tasks:
  - id: plan
    role: architect
    instruction: Create a plan for a simple greeting feature
    output: plan-result

  - id: build
    role: engineer
    instruction: Implement the greeting feature
    depends_on: [plan]
    output: build-result

  - id: test
    role: tester
    instruction: Test the greeting feature
    depends_on: [build]
    output: test-results
```

### 2. Run the Workflow

```bash
npx tsx cli/index.ts run hello-world.dex
```

**Output:**
```
hello-world
  My first Ultra-Dex workflow

────────────────────────────────────────────────────────────
  ID                    ROLE        DEPS          STATE
────────────────────────────────────────────────────────────
  plan                   architect   none          CREATED
  build                  engineer    plan          CREATED
  test                   tester      build         CREATED
────────────────────────────────────────────────────────────
  3 nodes · 2 edges

  Running workflow hello-world-1234567890

  → plan running...
  ✓ plan 45ms
  → build running...
  ✓ build 52ms
  → test running...
  ✓ test 48ms

────────────────────────────────────────────────────────────
  ✓ Workflow completed in 145ms
────────────────────────────────────────────────────────────
```

### 3. Check Workflow Status

```bash
npx tsx cli/index.ts status
```

### 4. Inspect Results

```bash
npx tsx cli/index.ts inspect hello-world-1234567890
```

---

## Using Real LLM Adapters

### OpenAI Adapter

```typescript
import { ExecutionEngine, OpenAIAdapter } from './sdk/index.js';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
});

const engine = new ExecutionEngine(adapter);
const result = await engine.run('./my-workflow.dex');
```

### Anthropic Adapter

```typescript
import { ExecutionEngine, AnthropicAdapter } from './sdk/index.js';

const adapter = new AnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
});

const engine = new ExecutionEngine(adapter);
const result = await engine.run('./my-workflow.dex');
```

### Environment Variables

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Workflow DSL Reference

### Task Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique task identifier |
| `role` | string | ✅ | architect, engineer, tester, reviewer |
| `instruction` | string | ✅ | Task description |
| `depends_on` | string[] | ❌ | Task dependencies |
| `output` | string | ❌ | Output artifact name |
| `verify` | object | ❌ | Verification rules |
| `parallel` | boolean | ❌ | Run in parallel (default: false) |

### Verification Rules

```yaml
tasks:
  - id: implement
    role: engineer
    instruction: Implement the feature
    verify:
      type: unit_test
      command: npm test
```

**Verification Types:**
- `unit_test` - Run unit tests
- `llm_check` - LLM-based verification
- `file_exists` - Check file exists
- `custom` - Custom command

### Context Injection

Tasks can reference outputs from previous tasks:

```yaml
tasks:
  - id: plan
    role: architect
    instruction: Create plan
    output: architecture

  - id: build
    role: engineer
    instruction: |
      Build according to plan:
      {{plan.output}}
    depends_on: [plan]
```

---

## Observability

### Structured Logging

```typescript
import { getGlobalLogger } from './sdk/index.js';

const logger = getGlobalLogger();
logger.info('Workflow started', { workflowId: '123' });
```

### Metrics

```typescript
import { getGlobalMetrics, createUltraDexMetrics } from './sdk/index.js';

const registry = getGlobalMetrics();
const metrics = createUltraDexMetrics(registry);

metrics.workflowTotal.inc({ status: 'success' });
```

### Tracing

```typescript
import { getGlobalTracer } from './sdk/index.js';

const tracer = getGlobalTracer();
const span = tracer.startTrace('workflow');
// ... do work ...
tracer.endSpan(span);
```

---

## Security

### RBAC

```typescript
import { RBAC, createUser, createResource } from './sdk/index.js';

const rbac = new RBAC();
const user = createUser('user-1', 'Alice', ['operator']);
const resource = createResource('workflow', 'wf-1', 'user-1');

const result = rbac.check({
  user,
  resource,
  permission: 'workflow:execute',
});

if (!result.allowed) {
  console.error(result.reason);
}
```

### Encryption

```typescript
import { EncryptionService } from './sdk/index.js';

const crypto = new EncryptionService({
  masterKey: process.env.ENCRYPTION_KEY,
});

const encrypted = crypto.encrypt('sensitive data');
const decrypted = crypto.decrypt(encrypted);
```

---

## Caching

### LRU Cache

```typescript
import { LRUCache } from './sdk/index.js';

const cache = new LRUCache<string>({
  maxSize: 1000,
  defaultTTL: 60_000, // 1 minute
});

cache.set('key', 'value');
const value = cache.get('key');
```

### Namespaced Cache

```typescript
import { NamespacedCache } from './sdk/index.js';

const workflowCache = new NamespacedCache('workflows', {
  maxSize: 100,
});

workflowCache.set('wf-1', workflowData);
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `init [name]` | Create new project scaffold |
| `run <workflow>` | Execute workflow |
| `status [id]` | Check workflow status |
| `resume <id>` | Resume failed workflow |
| `inspect <id>` | Show workflow details |

---

## Advanced Example

```yaml
version: dexgraph/v1
name: feature-implementation
description: Full feature development workflow

context:
  project: my-app
  tech_stack: [typescript, nodejs]
  constraints:
    - Must pass all tests
    - Must follow coding standards

on_failure:
  retry: 2
  rollback: true

tasks:
  - id: analyze
    role: architect
    instruction: |
      Analyze the requirements and create a detailed plan.
      Consider edge cases and error handling.
    output: architecture-plan
    verify:
      type: llm_check
      policy: Check for completeness

  - id: setup
    role: engineer
    instruction: |
      Set up project structure based on:
      {{analyze.output}}
    depends_on: [analyze]
    output: project-structure

  - id: implement-core
    role: engineer
    instruction: Implement core functionality
    depends_on: [setup]
    output: core-implementation
    parallel: true

  - id: implement-tests
    role: engineer
    instruction: Implement unit tests
    depends_on: [setup]
    output: test-implementation
    parallel: true

  - id: integrate
    role: engineer
    instruction: Integrate core and tests
    depends_on: [implement-core, implement-tests]
    output: integrated-code

  - id: verify
    role: tester
    instruction: Run all verification tests
    depends_on: [integrate]
    verify:
      type: unit_test
      command: npm run test:full
    output: verification-report

  - id: review
    role: reviewer
    instruction: Review final implementation
    depends_on: [verify]
    output: review-feedback
```

---

## Troubleshooting

### "Cannot find module"

```bash
npm install
```

### "TypeScript compilation errors"

```bash
node_modules/typescript/bin/tsc --noEmit
```

### "Workflow fails to parse"

- Check YAML indentation
- Validate task IDs are unique
- Ensure `version: dexgraph/v1` is set

### "Adapter authentication fails"

- Verify API keys are set in environment
- Check key has required permissions

---

## Next Steps

- 📖 Read [ARCHITECTURE.md](ARCHITECTURE.md) for design details
- 🔧 Check [docs/](docs/) for advanced topics
- 🧪 Run `npm test` to see all tests
- 💡 Create your own adapters for custom LLMs

---

## Support

- GitHub Issues: [github.com/yourusername/ultra-dex/issues](https://github.com/yourusername/ultra-dex/issues)
- Documentation: [docs.ultra-dex.dev](https://docs.ultra-dex.dev)

---

**Built with ❤️ by the Ultra-Dex Team**
