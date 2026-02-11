// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra Protocol Handler
 * Custom protocol handler for ultra:// URLs
 */

import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

// Protocol schemes and their handlers
const PROTOCOL_HANDLERS = {
  project: {
    pattern: /^project\/(.+)$/,
    handler: handleProjectRequest,
  },
  context: {
    pattern: /^context\/(.+)$/,
    handler: handleContextRequest,
  },
  memory: {
    pattern: /^memory\/(.+)$/,
    handler: handleMemoryRequest,
  },
  state: {
    pattern: /^state\/(.+)$/,
    handler: handleStateRequest,
  },
  agent: {
    pattern: /^agent\/(.+)$/,
    handler: handleAgentRequest,
  },
};

/**
 * Handle ultra:// protocol URL
 */
export async function handleUltraProtocol(protocolUrl) {
  try {
    // Parse the protocol URL
    const parsed = new URL(protocolUrl);

    // Extract the path after ultra://
    const path = parsed.pathname.substring(1); // Remove leading slash

    printInfo(`🔗 Processing ultra:// request: ${path}`);

    // Find matching handler
    for (const [scheme, config] of Object.entries(PROTOCOL_HANDLERS)) {
      const match = path.match(config.pattern);
      if (match) {
        return await config.handler(match[1], parsed);
      }
    }

    // If no handler matches, show error
    throw new Error(`No handler found for path: ${path}`);
  } catch (error) {
    printError(`Invalid ultra:// URL: ${error.message}`);
    return null;
  }
}

/**
 * Handle project-related requests
 */
async function handleProjectRequest(subPath, urlObj) {
  const [projectName, ...rest] = subPath.split('/');

  switch (rest[0]) {
    case 'state':
      return await handleProjectState(projectName);
    case 'open':
      return await openProject(projectName);
    case 'status':
      return await getProjectStatus(projectName);
    default:
      return await handleProjectDefault(projectName, subPath);
  }
}

/**
 * Handle context-related requests
 */
async function handleContextRequest(subPath, urlObj) {
  const [contextType, ...rest] = subPath.split('/');

  switch (contextType) {
    case 'decisions':
      return await handleContextDecisions(rest.join('/'));
    case 'search':
      return await handleContextSearch(rest.join('/'));
    case 'refresh':
      return await refreshContext();
    default:
      return await handleContextDefault(subPath);
  }
}

/**
 * Handle memory-related requests
 */
async function handleMemoryRequest(subPath, urlObj) {
  const [memoryType, ...rest] = subPath.split('/');

  switch (memoryType) {
    case 'search':
      return await handleMemorySearch(rest.join('/'));
    case 'recall':
      return await handleMemoryRecall(rest.join('/'));
    case 'store':
      return await handleMemoryStore(rest.join('/'), urlObj.searchParams);
    default:
      return await handleMemoryDefault(subPath);
  }
}

/**
 * Handle state-related requests
 */
async function handleStateRequest(subPath, urlObj) {
  const [stateType, ...rest] = subPath.split('/');

  switch (stateType) {
    case 'current':
      return await getCurrentState();
    case 'history':
      return await getStateHistory();
    case 'update':
      return await updateState(rest.join('/'), urlObj.searchParams);
    default:
      return await handleStateDefault(subPath);
  }
}

/**
 * Handle agent-related requests
 */
async function handleAgentRequest(subPath, urlObj) {
  const [agentName, ...rest] = subPath.split('/');

  switch (agentName) {
    case 'execute':
      return await executeAgent(rest.join('/'), urlObj.searchParams);
    case 'status':
      return await getAgentStatus(rest.join('/'));
    case 'list':
      return await listAgents();
    default:
      return await handleAgentDefault(agentName, rest.join('/'));
  }
}

// Project handlers
async function handleProjectState(projectName) {
  printInfo(`📊 Getting state for project: ${projectName}`);

  // Look for project state file
  const statePaths = [
    path.join(process.cwd(), projectName, '.ultra', 'state.json'),
    path.join(process.cwd(), projectName, 'state.json'),
    path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      'projects',
      projectName,
      '.ultra',
      'state.json'
    ),
  ];

  for (const statePath of statePaths) {
    try {
      const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
      printSuccess(`✅ Project ${projectName} state loaded`);
      return state;
    } catch (error) {
      // Try next path
      continue;
    }
  }

  printWarning(`⚠️  No state found for project: ${projectName}`);
  return { project: projectName, status: 'not_found' };
}

async function openProject(projectName) {
  printInfo(`📂 Opening project: ${projectName}`);

  const projectPath = path.join(process.cwd(), projectName);

  try {
    await fs.access(projectPath);
    printSuccess(`✅ Project ${projectName} exists at: ${projectPath}`);

    // Optionally open in default editor
    const openEditor = await import('open');
    await openEditor.default(projectPath);

    return { opened: true, path: projectPath };
  } catch (error) {
    printError(`❌ Project ${projectName} not found: ${error.message}`);
    return { opened: false, error: error.message };
  }
}

async function getProjectStatus(projectName) {
  printInfo(`📈 Getting status for project: ${projectName}`);

  // Simulate project status check
  const status = {
    project: projectName,
    status: 'active',
    lastUpdated: new Date().toISOString(),
    files: Math.floor(Math.random() * 100),
    branches: ['main', 'develop'],
    dependencies: Math.floor(Math.random() * 20),
  };

  printSuccess(`✅ Status retrieved for ${projectName}`);
  return status;
}

async function handleProjectDefault(projectName, subPath) {
  printInfo(`🔍 Project request: ${projectName}/${subPath}`);
  return { project: projectName, request: subPath, type: 'project' };
}

// Context handlers
async function handleContextDecisions(filter) {
  printInfo(`📋 Getting decisions with filter: ${filter || 'all'}`);

  // Look for decision log
  const decisionPath = path.join(process.cwd(), 'DECISION_LOG.md');

  try {
    const content = await fs.readFile(decisionPath, 'utf8');

    // Simple parsing of decisions
    const decisionRegex =
      /### Decision (\d+): (.+?)\n[\s\S]*?#### Decision\n([\s\S]*?)\n[\s\S]*?#### Consequences\n([\s\S]*?)\n---/g;
    const decisions = [];
    let match;

    while ((match = decisionRegex.exec(content)) !== null) {
      const [, id, title, decision, consequences] = match;
      if (!filter || title.toLowerCase().includes(filter.toLowerCase())) {
        decisions.push({
          id,
          title,
          decision: decision.trim().substring(0, 100) + '...',
          consequences: consequences.trim().substring(0, 100) + '...',
        });
      }
    }

    printSuccess(`✅ Found ${decisions.length} decisions`);
    return { decisions, filter };
  } catch (error) {
    printWarning(`⚠️  No decision log found: ${error.message}`);
    return { decisions: [], filter };
  }
}

async function handleContextSearch(query) {
  printInfo(`🔍 Searching context for: ${query}`);

  // Search across context files
  const contextFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'README.md', 'docs/**/*.md'];

  const results = [];

  for (const filePattern of contextFiles) {
    try {
      const glob = await import('glob');
      const files = await glob.glob(filePattern, { cwd: process.cwd(), absolute: true });

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: path.relative(process.cwd(), file),
            matches: content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g'))?.length || 0,
          });
        }
      }
    } catch (error) {
      // Skip if pattern doesn't match
    }
  }

  printSuccess(`✅ Found ${results.length} context matches for: ${query}`);
  return { query, results };
}

async function refreshContext() {
  printInfo(`🔄 Refreshing context...`);

  // Simulate context refresh
  await new Promise((resolve) => setTimeout(resolve, 1000));

  printSuccess(`✅ Context refreshed`);
  return { refreshed: true, timestamp: new Date().toISOString() };
}

async function handleContextDefault(subPath) {
  printInfo(`🔍 Context request: ${subPath}`);
  return { request: subPath, type: 'context' };
}

// Memory handlers
async function handleMemorySearch(query) {
  printInfo(`🧠 Searching memory for: ${query}`);

  // Simulate memory search
  const mockResults = [
    { id: 'mem-001', content: `Result for ${query}`, relevance: 0.95 },
    { id: 'mem-002', content: `Related to ${query}`, relevance: 0.87 },
  ];

  printSuccess(`✅ Found ${mockResults.length} memory matches for: ${query}`);
  return { query, results: mockResults };
}

async function handleMemoryRecall(memoryId) {
  printInfo(`🧠 Recalling memory: ${memoryId}`);

  // Simulate memory recall
  const mockMemory = {
    id: memoryId,
    content: `Content of memory ${memoryId}`,
    timestamp: new Date().toISOString(),
    type: 'knowledge',
  };

  printSuccess(`✅ Recalled memory: ${memoryId}`);
  return mockMemory;
}

async function handleMemoryStore(content, params) {
  printInfo(`🧠 Storing memory: ${content.substring(0, 50)}...`);

  // Simulate storing memory
  const memoryId = `mem-${Date.now()}`;

  printSuccess(`✅ Stored memory: ${memoryId}`);
  return { id: memoryId, stored: true };
}

async function handleMemoryDefault(subPath) {
  printInfo(`🧠 Memory request: ${subPath}`);
  return { request: subPath, type: 'memory' };
}

// State handlers
async function getCurrentState() {
  printInfo(`📊 Getting current state...`);

  // Look for state file
  const statePaths = [
    path.join(process.cwd(), '.ultra', 'state.json'),
    path.join(process.cwd(), 'state.json'),
  ];

  for (const statePath of statePaths) {
    try {
      const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
      printSuccess(`✅ Current state loaded`);
      return state;
    } catch (error) {
      // Try next path
      continue;
    }
  }

  printWarning(`⚠️  No state file found`);
  return { status: 'no_state' };
}

async function getStateHistory() {
  printInfo(`📜 Getting state history...`);

  // Simulate state history
  const history = [
    { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'init' },
    { timestamp: new Date(Date.now() - 43200000).toISOString(), action: 'update' },
  ];

  printSuccess(`✅ Retrieved ${history.length} state changes`);
  return { history };
}

async function updateState(newState, params) {
  printInfo(`🔄 Updating state: ${newState}`);

  // Simulate state update
  printSuccess(`✅ State updated: ${newState}`);
  return { updated: true, newState };
}

async function handleStateDefault(subPath) {
  printInfo(`📊 State request: ${subPath}`);
  return { request: subPath, type: 'state' };
}

// Agent handlers
async function executeAgent(task, params) {
  printInfo(`🤖 Executing agent task: ${task}`);

  // Simulate agent execution
  await new Promise((resolve) => setTimeout(resolve, 2000));

  printSuccess(`✅ Agent task completed: ${task}`);
  return { task, completed: true, result: 'success' };
}

async function getAgentStatus(agentName) {
  printInfo(`👀 Getting status for agent: ${agentName}`);

  // Simulate agent status
  const status = {
    agent: agentName,
    status: 'idle',
    lastActivity: new Date().toISOString(),
    tasksCompleted: Math.floor(Math.random() * 100),
  };

  printSuccess(`✅ Agent status retrieved: ${agentName}`);
  return status;
}

async function listAgents() {
  printInfo(`👥 Listing available agents...`);

  // Simulate agent list
  const agents = [
    { name: '@Planner', status: 'active', description: 'Project planning' },
    { name: '@CTO', status: 'idle', description: 'Architecture decisions' },
    { name: '@Backend', status: 'working', description: 'Backend development' },
  ];

  printSuccess(`✅ Found ${agents.length} agents`);
  return { agents };
}

async function handleAgentDefault(agentName, subPath) {
  printInfo(`🤖 Agent request: ${agentName}/${subPath}`);
  return { agent: agentName, request: subPath, type: 'agent' };
}

/**
 * Register protocol command
 */
export function registerProtocolCommand(program) {
  program
    .command('protocol')
    .description('Ultra protocol handler (ultra:// URLs)')
    .argument('<url>', 'Ultra protocol URL (e.g., ultra://project/my-app/state)')
    .action(async (url) => {
      try {
        if (!url.startsWith('ultra://')) {
          printError('URL must start with ultra://');
          return;
        }

        const result = await handleUltraProtocol(url);
        if (result) {
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        printError(`Protocol handler error: ${error.message}`);
      }
    });
}

export default {
  handleUltraProtocol,
  registerProtocolCommand,
};
