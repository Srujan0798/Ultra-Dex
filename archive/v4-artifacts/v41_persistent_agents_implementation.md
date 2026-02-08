# 🚀 ULTRA-DEX V4.1.0 - PERSISTENT AGENT SESSIONS

## 🎯 Long-Running Agent Sessions Support

### Objective
Enable agents to work for days/weeks, not just minutes, with checkpoint/resume capabilities and background daemon support.

### Implementation Plan

#### 1. Persistent Session Manager
```javascript
// File: cli/lib/agents/persistent-session.js
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class PersistentSessionManager {
  constructor(options = {}) {
    this.sessionDir = options.sessionDir || path.join(process.cwd(), '.ultra-dex', 'sessions');
    this.sessions = new Map();
    this.activeDaemons = new Set();
  }

  async initialize() {
    await fs.mkdir(this.sessionDir, { recursive: true });
    await this.loadExistingSessions();
  }

  async createSession(task, options = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      task,
      status: 'initialized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      checkpoints: [],
      agentHistory: [],
      metadata: {
        priority: options.priority || 'normal',
        deadline: options.deadline,
        dependencies: options.dependencies || []
      }
    };

    this.sessions.set(sessionId, session);
    await this.saveSession(session);
    
    return session;
  }

  async loadSession(sessionId) {
    try {
      const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
      const content = await fs.readFile(sessionPath, 'utf8');
      const session = JSON.parse(content);
      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      console.error(`Failed to load session ${sessionId}:`, error.message);
      return null;
    }
  }

  async saveSession(session) {
    const sessionPath = path.join(this.sessionDir, `${session.id}.json`);
    session.updatedAt = new Date().toISOString();
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    Object.assign(session, updates, {
      updatedAt: new Date().toISOString()
    });

    await this.saveSession(session);
    return session;
  }

  async addCheckpoint(sessionId, checkpoint) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const checkpointData = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      data: checkpoint,
      progress: checkpoint.progress || session.progress
    };

    session.checkpoints.push(checkpointData);
    session.progress = checkpointData.progress;
    
    await this.saveSession(session);
    return checkpointData;
  }

  async resumeSession(sessionId) {
    const session = await this.loadSession(sessionId);
    if (!session) return null;

    // Find latest checkpoint
    const latestCheckpoint = session.checkpoints
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (latestCheckpoint) {
      session.status = 'resumed';
      session.currentCheckpoint = latestCheckpoint.id;
    } else {
      session.status = 'restarted';
    }

    await this.saveSession(session);
    return session;
  }

  async listSessions(filter = {}) {
    const sessions = Array.from(this.sessions.values());
    
    if (filter.status) {
      return sessions.filter(s => s.status === filter.status);
    }
    
    if (filter.priority) {
      return sessions.filter(s => s.metadata.priority === filter.priority);
    }

    return sessions;
  }

  async loadExistingSessions() {
    try {
      const files = await fs.readdir(this.sessionDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.replace('.json', '');
          await this.loadSession(sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to load existing sessions:', error.message);
    }
  }

  async startBackgroundDaemon() {
    if (this.activeDaemons.has('main')) return;

    this.activeDaemons.add('main');
    
    // Background processing loop
    setInterval(async () => {
      await this.processPendingSessions();
    }, 30000); // Check every 30 seconds

    console.log('Background agent daemon started');
  }

  async processPendingSessions() {
    const pendingSessions = await this.listSessions({ status: 'running' });
    
    for (const session of pendingSessions) {
      // Check if session needs attention
      if (this.shouldProcessSession(session)) {
        await this.processSession(session);
      }
    }
  }

  shouldProcessSession(session) {
    // Logic to determine if session should be processed
    const now = new Date();
    const lastUpdate = new Date(session.updatedAt);
    const timeSinceUpdate = now - lastUpdate;
    
    // Process if it's been more than 5 minutes since last update
    return timeSinceUpdate > 5 * 60 * 1000;
  }

  async processSession(session) {
    // Placeholder for actual session processing
    // This would integrate with agent systems
    console.log(`Processing session ${session.id}`);
  }
}
```

#### 2. Agent Session Integration
```javascript
// File: cli/lib/agents/session-integration.js
import { PersistentSessionManager } from './persistent-session.js';

export class AgentSessionIntegration {
  constructor() {
    this.sessionManager = new PersistentSessionManager();
  }

  async initialize() {
    await this.sessionManager.initialize();
  }

  async startPersistentAgent(task, agentType, options = {}) {
    // Create persistent session
    const session = await this.sessionManager.createSession(task, {
      priority: options.priority || 'normal',
      deadline: options.deadline,
      agentType
    });

    // Start agent with session context
    const agentResult = await this.runAgentWithSession(session, agentType, options);
    
    return {
      sessionId: session.id,
      result: agentResult,
      session
    };
  }

  async runAgentWithSession(session, agentType, options) {
    // Integrate with existing agent system
    // This would call the appropriate agent with session context
    const agentResult = await this.executeAgent(agentType, session.task, {
      ...options,
      sessionContext: session
    });

    // Update session with result
    await this.sessionManager.updateSession(session.id, {
      status: 'running',
      progress: agentResult.progress || 0,
      agentHistory: [...session.agentHistory, agentResult]
    });

    return agentResult;
  }

  async resumeAgent(sessionId) {
    const session = await this.sessionManager.resumeSession(sessionId);
    if (!session) return null;

    // Resume agent from checkpoint
    const agentResult = await this.executeAgent(
      session.metadata.agentType,
      session.task,
      {
        resumeFrom: session.currentCheckpoint,
        sessionContext: session
      }
    );

    return agentResult;
  }

  async executeAgent(agentType, task, options = {}) {
    // Placeholder - integrate with existing agent system
    // This would call the appropriate agent implementation
    return {
      status: 'completed',
      progress: 100,
      output: `Agent ${agentType} processed task: ${task}`,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 3. Background Daemon
```javascript
// File: cli/lib/agents/daemon.js
import { PersistentSessionManager } from './persistent-session.js';
import { printInfo, printSuccess } from '../utils/output.js';

export class AgentDaemon {
  constructor() {
    this.sessionManager = new PersistentSessionManager();
    this.isRunning = false;
    this.processInterval = null;
  }

  async start(options = {}) {
    if (this.isRunning) {
      printInfo('Agent daemon already running');
      return;
    }

    await this.sessionManager.initialize();
    
    this.isRunning = true;
    
    // Start processing loop
    this.processInterval = setInterval(async () => {
      await this.processSessions();
    }, options.interval || 60000); // Default: 1 minute

    printSuccess('Agent daemon started successfully');
    printInfo(`Checking sessions every ${options.interval || 60000}ms`);
  }

  async stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    this.isRunning = false;
    printInfo('Agent daemon stopped');
  }

  async processSessions() {
    try {
      const sessions = await this.sessionManager.listSessions({ status: 'running' });
      
      for (const session of sessions) {
        await this.processSession(session);
      }
    } catch (error) {
      console.error('Error processing sessions:', error.message);
    }
  }

  async processSession(session) {
    // Check if session needs attention
    const now = new Date();
    const lastUpdate = new Date(session.updatedAt);
    const timeSinceUpdate = now - lastUpdate;

    if (timeSinceUpdate > 5 * 60 * 1000) { // 5 minutes
      // Resume or continue the agent task
      await this.resumeSessionIfNeeded(session);
    }
  }

  async resumeSessionIfNeeded(session) {
    // Logic to resume session if needed
    printInfo(`Resuming session ${session.id} for task: ${session.task.substring(0, 50)}...`);
    
    // Update session to show it's being processed
    await this.sessionManager.updateSession(session.id, {
      status: 'processing',
      updatedAt: new Date().toISOString()
    });
  }
}
```

#### 4. CLI Commands for Persistent Sessions
```javascript
// File: cli/lib/commands/persistent-agents.js
import { PersistentSessionManager } from '../agents/persistent-session.js';
import { AgentSessionIntegration } from '../agents/session-integration.js';
import { AgentDaemon } from '../agents/daemon.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export async function registerPersistentAgentsCommand(program) {
  const persistentCmd = program
    .command('persistent')
    .alias('persist')
    .description('Manage persistent agent sessions');

  const sessionManager = new PersistentSessionManager();
  const agentIntegration = new AgentSessionIntegration();
  const daemon = new AgentDaemon();

  await sessionManager.initialize();

  persistentCmd
    .command('start <task>')
    .description('Start a persistent agent session')
    .option('-a, --agent <type>', 'Agent type to use', 'planner')
    .option('-p, --priority <level>', 'Priority level', 'normal')
    .option('-d, --deadline <date>', 'Deadline for completion')
    .action(async (task, options) => {
      try {
        const session = await agentIntegration.startPersistentAgent(task, options.agent, {
          priority: options.priority,
          deadline: options.deadline
        });

        printSuccess(`Persistent session started: ${session.sessionId}`);
        printInfo(`Task: ${task}`);
        printInfo(`Agent: ${options.agent}`);
        printInfo(`Priority: ${options.priority}`);
      } catch (error) {
        printError(`Failed to start persistent session: ${error.message}`);
      }
    });

  persistentCmd
    .command('resume <sessionId>')
    .description('Resume a persistent agent session')
    .action(async (sessionId) => {
      try {
        const result = await agentIntegration.resumeAgent(sessionId);
        if (result) {
          printSuccess(`Session ${sessionId} resumed successfully`);
        } else {
          printWarning(`Session ${sessionId} not found or cannot be resumed`);
        }
      } catch (error) {
        printError(`Failed to resume session: ${error.message}`);
      }
    });

  persistentCmd
    .command('list')
    .description('List all persistent sessions')
    .option('-s, --status <status>', 'Filter by status')
    .option('-p, --priority <priority>', 'Filter by priority')
    .action(async (options) => {
      try {
        const sessions = await sessionManager.listSessions({
          status: options.status,
          priority: options.priority
        });

        if (sessions.length === 0) {
          printInfo('No persistent sessions found');
          return;
        }

        printInfo(`Found ${sessions.length} persistent sessions:`);
        sessions.forEach(session => {
          printInfo(`  ID: ${session.id}`);
          printInfo(`  Task: ${session.task.substring(0, 60)}...`);
          printInfo(`  Status: ${session.status}`);
          printInfo(`  Progress: ${session.progress}%`);
          printInfo(`  Created: ${session.createdAt}`);
          printInfo(`  Updated: ${session.updatedAt}`);
          printInfo('');
        });
      } catch (error) {
        printError(`Failed to list sessions: ${error.message}`);
      }
    });

  persistentCmd
    .command('daemon')
    .description('Manage background agent daemon')
    .option('--start', 'Start the daemon')
    .option('--stop', 'Stop the daemon')
    .option('--interval <ms>', 'Check interval in milliseconds', '60000')
    .action(async (options) => {
      if (options.start) {
        await daemon.start({ interval: parseInt(options.interval) });
      } else if (options.stop) {
        await daemon.stop();
      } else {
        printInfo('Use --start to start daemon or --stop to stop daemon');
      }
    });

  persistentCmd
    .command('checkpoint <sessionId>')
    .description('Add a checkpoint to a session')
    .action(async (sessionId) => {
      try {
        const checkpoint = await sessionManager.addCheckpoint(sessionId, {
          timestamp: new Date().toISOString(),
          progress: 50, // Placeholder
          status: 'checkpoint-added'
        });

        if (checkpoint) {
          printSuccess(`Checkpoint added to session ${sessionId}: ${checkpoint.id}`);
        } else {
          printWarning(`Failed to add checkpoint to session ${sessionId}`);
        }
      } catch (error) {
        printError(`Failed to add checkpoint: ${error.message}`);
      }
    });
}
```

#### 5. Update Main CLI Registration
```javascript
// Add to cli/bin/ultra-dex.js
import { registerPersistentAgentsCommand } from './lib/commands/persistent-agents.js';

// Add after other registrations
registerPersistentAgentsCommand(program);
```

### Testing Plan
1. Test persistent session creation and storage
2. Verify checkpoint/resume functionality
3. Test background daemon operation
4. Validate session state management
5. Benchmark long-running task performance

### Success Criteria
- ✅ Persistent sessions survive process restarts
- ✅ Checkpoint/resume functionality works reliably
- ✅ Background daemon monitors sessions
- ✅ Long-running tasks can be paused/resumed
- ✅ Session state is properly maintained

---

**Estimated Timeline:** 4 days
**Priority:** 🔴 CRITICAL
**Status:** Ready for implementation