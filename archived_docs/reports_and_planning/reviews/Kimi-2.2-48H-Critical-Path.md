# Kimi 2.2 - 48-Hour Critical Path Implementation Guide

## Overview

**Title:** From Template Generator to AI Operating System

**Timeline:** February 1-2, 2026

**Goal:** Transform Ultra-Dex from a 6.2/10 to 8.5/10 tool

**Focus:** Interactive REPL + Streaming + Code Execution

---

## 🕐 Hour 0-8: Emergency Stabilization

### Task 1.1: Fix Import Errors (30 min)

**File:** `cli/bin/ultra-dex.js`

**Current (Broken):**
```javascript
import { registerCloudCommand } from '../lib/commands/cloud.js';
// cloud.js exports cloudCommand, not registerCloudCommand
```

**Fix:**
```javascript
import { cloudCommand } from '../lib/commands/cloud.js';
// Then use: program.command('cloud').action(cloudCommand);
```

**Checklist:**
- [ ] Audit all imports in ultra-dex.js
- [ ] Verify each command file exports correctly
- [ ] Fix mismatched import/export pairs

---

### Task 1.2: Fix Package Dependencies (30 min)

**File:** `cli/package.json`

**Current (Optional - Wrong):**
```json
"optionalDependencies": {
  "@anthropic-ai/sdk": "^0.30.0",
  "openai": "^4.70.0",
  "@google/generative-ai": "^0.21.0"
}
```

**Fix (Required):**
```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.30.0",
  "openai": "^4.70.0",
  "@google/generative-ai": "^0.21.0",
  "ai": "^4.0.0",
  "@ai-sdk/anthropic": "^1.0.0",
  "@ai-sdk/openai": "^1.0.0"
}
```

**Checklist:**
- [ ] Move AI SDKs from optional to required
- [ ] Add Vercel AI SDK for streaming
- [ ] Run npm install to verify

---

### Task 1.3: Fix Test Paths (1 hour)

**Files:** `cli/test/*.test.js`

**Current (Broken in cli.test.js):**
```javascript
import { something } from '../../lib/commands/init.js';
```

**Fix:**
```javascript
import { something } from '../lib/commands/init.js';
```

**Checklist:**
- [ ] Fix all relative paths in tests
- [ ] Run npm test to verify
- [ ] Ensure 13 new tests pass

---

### Task 1.4: Create Health Check Command (30 min)

**File:** `cli/lib/commands/health.js` (NEW)

```javascript
export function registerHealthCommand(program) {
  program
    .command('doctor')
    .description('Check Ultra-Dex installation health')
    .action(async () => {
      const checks = [
        { name: 'Node version', check: () => process.version >= 'v18.0.0' },
        { name: 'Dependencies', check: checkDependencies },
        { name: 'Config file', check: () => fs.existsSync('.ultra-dex.json') },
        { name: 'MCP server', check: checkMCPConnection },
      ];
      
      for (const { name, check } of checks) {
        const status = await check() ? '✅' : '❌';
        console.log(`${status} ${name}`);
      }
    });
}
```

**Checklist:**
- [ ] Create health.js
- [ ] Add to ultra-dex.js imports
- [ ] Test with `ultra-dex doctor`

---

## 🕐 Hour 8-24: Interactive REPL

### Task 2.1: Create REPL Core (2 hours)

**File:** `cli/lib/repl/index.js` (NEW)

```javascript
import readline from 'readline';
import chalk from 'chalk';
import { createSession, getSession, saveSession } from './session.js';
import { executeSlashCommand } from './commands.js';
import { streamAIResponse } from '../providers/streaming.js';

export async function startREPL(options = {}) {
  const session = options.continue 
    ? await getSession('latest')
    : await createSession();
    
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('ultra-dex> '),
  });
  
  console.log(chalk.green('🚀 Ultra-Dex Interactive Mode'));
  console.log(chalk.dim('Type /help for commands, /exit to quit\n'));
  
  rl.prompt();
  
  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (trimmed.startsWith('/')) {
      await executeSlashCommand(trimmed, session);
    } else if (trimmed) {
      await streamAIResponse(trimmed, session, (token) => {
        process.stdout.write(token);
      });
      console.log('\n');
    }
    
    await saveSession(session);
    rl.prompt();
  });
}
```

**Checklist:**
- [ ] Create repl/ directory
- [ ] Implement session management
- [ ] Add readline interface
- [ ] Test basic input/output

---

### Task 2.2: Create Session Management (1 hour)

**File:** `cli/lib/repl/session.js` (NEW)

```javascript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SESSION_DIR = path.join(os.homedir(), '.ultra-dex', 'sessions');

export async function createSession() {
  const session = {
    id: generateSessionId(),
    createdAt: Date.now(),
    messages: [],
    context: {},
  };
  await saveSession(session);
  return session;
}

export async function getSession(id) {
  if (id === 'latest') {
    const sessions = await listSessions();
    id = sessions[0]?.id;
  }
  const file = path.join(SESSION_DIR, `${id}.json`);
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
}

export async function saveSession(session) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const file = path.join(SESSION_DIR, `${session.id}.json`);
  await fs.writeFile(file, JSON.stringify(session, null, 2));
}

export async function listSessions() {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const files = await fs.readdir(SESSION_DIR);
  const sessions = await Promise.all(
    files
      .filter(f => f.endsWith('.json'))
      .map(async f => {
        const data = await fs.readFile(path.join(SESSION_DIR, f), 'utf8');
        return JSON.parse(data);
      })
  );
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

**Checklist:**
- [ ] Create session directory structure
- [ ] Implement CRUD operations
- [ ] Add session listing
- [ ] Test persistence

---

### Task 2.3: Create Slash Commands (1 hour)

**File:** `cli/lib/repl/commands.js` (NEW)

```javascript
const commands = {
  '/help': {
    description: 'Show available commands',
    handler: showHelp,
  },
  '/clear': {
    description: 'Clear conversation history',
    handler: clearHistory,
  },
  '/context': {
    description: 'Show current context usage',
    handler: showContext,
  },
  '/compact': {
    description: 'Compress conversation history',
    handler: compactHistory,
  },
  '/model': {
    description: 'Switch AI model',
    handler: switchModel,
    args: '<model>',
  },
  '/memory': {
    description: 'Edit CLAUDE.md memory',
    handler: editMemory,
  },
  '/exit': {
    description: 'Exit REPL',
    handler: exitREPL,
  },
};

export async function executeSlashCommand(input, session) {
  const [cmd, ...args] = input.split(' ');
  const command = commands[cmd];
  
  if (!command) {
    console.log(chalk.red(`Unknown command: ${cmd}`));
    console.log(chalk.dim('Type /help for available commands'));
    return;
  }
  
  await command.handler(args, session);
}

async function showHelp() {
  console.log(chalk.bold('\nAvailable Commands:'));
  for (const [name, { description, args }] of Object.entries(commands)) {
    const argStr = args ? ` ${chalk.yellow(args)}` : '';
    console.log(`  ${chalk.cyan(name)}${argStr} - ${description}`);
  }
  console.log('');
}

async function clearHistory(session) {
  session.messages = [];
  console.log(chalk.green('Conversation history cleared'));
}

async function showContext(session) {
  const messageCount = session.messages.length;
  const contextSize = JSON.stringify(session).length;
  console.log(chalk.bold('Context Usage:'));
  console.log(`  Messages: ${messageCount}`);
  console.log(`  Size: ${(contextSize / 1024).toFixed(2)} KB`);
}

async function exitREPL() {
  console.log(chalk.green('Goodbye! 👋'));
  process.exit(0);
}
```

**Checklist:**
- [ ] Implement all slash commands
- [ ] Add command help
- [ ] Test each command

---

### Task 2.4: Integrate REPL into CLI (30 min)

**File:** `cli/bin/ultra-dex.js`

```javascript
// ADD IMPORT:
import { startREPL } from '../lib/repl/index.js';

// ADD BEFORE program.parse():
// If no arguments, start REPL
if (process.argv.length === 2) {
  await startREPL();
  process.exit(0);
}

// ADD FLAGS:
program
  .option('-c, --continue', 'Continue last session')
  .option('-r, --resume <session>', 'Resume specific session');

// HANDLE FLAGS:
if (program.opts().continue) {
  await startREPL({ continue: true });
  process.exit(0);
}

if (program.opts().resume) {
  await startREPL({ resume: program.opts().resume });
  process.exit(0);
}
```

**Checklist:**
- [ ] Add REPL import
- [ ] Add --continue flag
- [ ] Add --resume flag
- [ ] Test REPL startup

---

## 🕐 Hour 24-36: Streaming Implementation

### Task 3.1: Add Vercel AI SDK (30 min)

**Command:**
```bash
cd cli && npm install ai @ai-sdk/anthropic @ai-sdk/openai
```

---

### Task 3.2: Create Streaming Provider (1 hour)

**File:** `cli/lib/providers/streaming.js` (NEW)

```javascript
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const providers = {
  anthropic: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
};

export async function streamAIResponse(prompt, session, onToken) {
  const provider = providers[getProvider(session)];
  const model = getModel(session);
  
  const { textStream } = await streamText({
    model: provider(model),
    messages: [
      { role: 'system', content: getSystemPrompt(session) },
      ...session.messages,
      { role: 'user', content: prompt },
    ],
  });
  
  let fullResponse = '';
  for await (const token of textStream) {
    fullResponse += token;
    onToken(token);
  }
  
  // Save to session
  session.messages.push({ role: 'user', content: prompt });
  session.messages.push({ role: 'assistant', content: fullResponse });
  
  return fullResponse;
}

function getProvider(session) {
  return session.config?.provider || 'anthropic';
}

function getModel(session) {
  return session.config?.model || 'claude-3-sonnet-20240229';
}

function getSystemPrompt(session) {
  return `You are Ultra-Dex, an AI orchestration assistant.
Context: ${session.context?.projectName || 'Unknown Project'}
Follow the 34-section template and 21-step verification.`;
}
```

**Checklist:**
- [ ] Install AI SDK
- [ ] Create streaming provider
- [ ] Add multi-provider support
- [ ] Test streaming

---

### Task 3.3: Update Generate Command (1 hour)

**File:** `cli/lib/commands/generate.js`

```javascript
import { streamAIResponse } from '../providers/streaming.js';
import ora from 'ora';

export function registerGenerateCommand(program) {
  program
    .command('generate <idea>')
    .description('Generate implementation plan from idea')
    .option('--stream', 'Stream AI response in real-time')
    .action(async (idea, options) => {
      if (options.stream) {
        const spinner = ora('Generating plan...').start();
        spinner.stop();
        
        console.log(chalk.bold('\n🤖 Generating Plan:\n'));
        
        await streamAIResponse(
          `Generate an implementation plan for: ${idea}`,
          { messages: [], config: { provider: 'anthropic' } },
          (token) => process.stdout.write(token)
        );
        
        console.log('\n');
      } else {
        // Existing non-streaming implementation
      }
    });
}
```

**Checklist:**
- [ ] Add --stream flag
- [ ] Implement streaming output
- [ ] Add progress indicator
- [ ] Test with real AI calls

---

### Task 3.4: Add Streaming to REPL (30 min)

**File:** `cli/lib/repl/index.js` (UPDATE)

```javascript
// Already implemented in Task 2.1
// The streamAIResponse function is called for all non-slash input
```

**Checklist:**
- [ ] Verify REPL uses streaming
- [ ] Test with long responses
- [ ] Ensure tokens appear in real-time

---

## 🕐 Hour 36-48: Code Execution

### Task 4.1: Create Docker Sandbox (1 hour)

**File:** `cli/lib/sandbox/docker.js` (NEW)

```javascript
import { execa } from 'execa';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const SANDBOX_IMAGE = 'ultra-dex-sandbox:latest';

export async function createSandbox() {
  const sandboxDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-'));
  
  // Create Dockerfile if not exists
  const dockerfile = `
FROM node:20-alpine
WORKDIR /workspace
RUN apk add --no-cache git python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
`;
  
  await fs.writeFile(path.join(sandboxDir, 'Dockerfile'), dockerfile);
  
  return {
    dir: sandboxDir,
    async build() {
      await execa('docker', ['build', '-t', SANDBOX_IMAGE, sandboxDir]);
    },
    async run(command, options = {}) {
      const args = [
        'run',
        '--rm',
        '-v', `${sandboxDir}:/workspace`,
        '-w', '/workspace',
        '--network', options.network ? 'host' : 'none',
        '--memory', options.memory || '512m',
        '--cpus', options.cpus || '1',
        SANDBOX_IMAGE,
        ...command.split(' '),
      ];
      
      return execa('docker', args, { 
        timeout: options.timeout || 60000,
        cwd: sandboxDir,
      });
    },
    async cleanup() {
      await fs.rm(sandboxDir, { recursive: true, force: true });
    },
  };
}
```

**Checklist:**
- [ ] Create Docker sandbox
- [ ] Add resource limits
- [ ] Add timeout handling
- [ ] Test container execution

---

### Task 4.2: Implement Exec Command (1 hour)

**File:** `cli/lib/commands/exec.js` (COMPLETE REWRITE)

```javascript
import chalk from 'chalk';
import { createSandbox } from '../sandbox/docker.js';
import { streamAIResponse } from '../providers/streaming.js';

export function registerExecCommand(program) {
  program
    .command('exec <task>')
    .description('Execute AI-generated code for a task')
    .option('--dry-run', 'Show plan without executing')
    .option('--sandbox', 'Run in Docker sandbox (default: true)', true)
    .option('--unsafe', 'Run without sandbox (DANGEROUS)')
    .action(async (task, options) => {
      console.log(chalk.bold(`🚀 Executing: ${task}\n`));
      
      // Step 1: Generate plan
      console.log(chalk.dim('Step 1: Generating execution plan...'));
      const plan = await generateExecutionPlan(task);
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n📋 Execution Plan (Dry Run):'));
        console.log(plan);
        return;
      }
      
      // Step 2: Confirm with user
      console.log(chalk.yellow('\n📋 Execution Plan:'));
      console.log(plan);
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Execute this plan?',
        default: false,
      }]);
      
      if (!confirm) {
        console.log(chalk.dim('Execution cancelled'));
        return;
      }
      
      // Step 3: Execute
      console.log(chalk.dim('\nStep 2: Executing...'));
      
      if (options.sandbox && !options.unsafe) {
        const sandbox = await createSandbox();
        try {
          for (const step of plan.steps) {
            console.log(chalk.dim(`  Running: ${step.command}`));
            const result = await sandbox.run(step.command, {
              timeout: step.timeout || 60000,
            });
            console.log(result.stdout);
            if (result.stderr) console.log(chalk.yellow(result.stderr));
          }
        } finally {
          await sandbox.cleanup();
        }
      } else {
        console.log(chalk.red('⚠️  Running without sandbox!'));
        // Direct execution (dangerous)
      }
      
      console.log(chalk.green('\n✅ Execution complete!'));
    });
}

async function generateExecutionPlan(task) {
  // Use AI to generate execution steps
  const response = await streamAIResponse(
    `Generate an execution plan for: ${task}\n` +
    `Return as JSON with steps array: [{"command": "...", "description": "...", "timeout": 60000}]`,
    { messages: [], config: { provider: 'anthropic' } },
    () => {} // Don't stream, collect full response
  );
  
  try {
    return JSON.parse(response);
  } catch {
    return { steps: [{ command: 'echo "No plan generated"', description: 'Fallback' }] };
  }
}
```

**Checklist:**
- [ ] Rewrite exec command
- [ ] Add sandbox integration
- [ ] Add dry-run mode
- [ ] Add user confirmation
- [ ] Test execution

---

### Task 4.3: Add File System Permissions (30 min)

**File:** `cli/lib/sandbox/permissions.js` (NEW)

```javascript
import path from 'path';

const ALLOWED_PATHS = [
  process.cwd(),
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'dist'),
];

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf /*',
  'dd if=/dev/zero',
  '> /dev/sda',
  ':(){ :|:& };:', // Fork bomb
];

export function validatePath(filePath) {
  const resolved = path.resolve(filePath);
  return ALLOWED_PATHS.some(allowed => resolved.startsWith(allowed));
}

export function validateCommand(command) {
  return !BLOCKED_COMMANDS.some(blocked => 
    command.includes(blocked)
  );
}

export function sanitizeCommand(command) {
  // Remove dangerous characters
  return command
    .replace(/[;&|`$]/g, '')
    .trim();
}
```

**Checklist:**
- [ ] Create permission system
- [ ] Add path validation
- [ ] Add command blocklist
- [ ] Test security

---

### Task 4.4: Test End-to-End (30 min)

**Test Script:**
```bash
# Test the complete flow
cd /tmp
echo "Test" > test.txt
ultra-dex init test-project
cd test-project

# Test REPL
ultra-dex
> /help
> "Create a simple Express server"
> /exit

# Test streaming
ultra-dex generate "Build auth system" --stream

# Test execution (dry run)
ultra-dex exec "Install Express" --dry-run

# Test execution (sandboxed)
ultra-dex exec "Install Express"
```

**Checklist:**
- [ ] Test REPL mode
- [ ] Test streaming
- [ ] Test execution
- [ ] Verify sandbox isolation

---

## 📋 Verification Checklist

### Hour 8 Checkpoints
- [ ] All imports fixed
- [ ] Dependencies correct
- [ ] Tests passing
- [ ] `ultra-dex doctor` works

### Hour 24 Checkpoints
- [ ] REPL starts with `ultra-dex`
- [ ] Slash commands work
- [ ] Sessions persist
- [ ] `--continue` flag works

### Hour 36 Checkpoints
- [ ] Streaming shows tokens in real-time
- [ ] `--stream` flag works
- [ ] Multiple providers supported
- [ ] REPL uses streaming

### Hour 48 Checkpoints
- [ ] `ultra-dex exec` runs code
- [ ] Docker sandbox works
- [ ] Permissions enforced
- [ ] End-to-end flow tested

---

## 🎯 Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **Overall Score** | 6.2/10 | ? | 8.5/10 |
| **Active Execution** | 6/10 | ? | 9/10 |
| **2026 Integration** | 5/10 | ? | 8/10 |
| **Tech Readiness** | 5/10 | ? | 8/10 |

---

## 🚀 Post-48H Roadmap

### Week 2: Polish
- Voice input (`--voice` flag)
- Browser automation (`ultra-dex browser`)
- Plugin system

### Week 3: Scale
- LangGraph integration
- Vector search
- Team collaboration features

### Week 4: Launch
- v4.0.0 release
- Marketing push
- Community onboarding

---

**Execute or die. No excuses. 🔥**