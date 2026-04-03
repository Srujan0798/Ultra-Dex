// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createProvider } from '../providers/index.js';
import { projectGraph } from '../mcp/graph.js';
import { errorRecovery } from '../utils/error-recovery.js';
import { dashboardNotifier } from '../utils/dashboard-notifier.js';
import { authorizeOperation } from '../governance/index.js';
import { verifyLinting, verifyTypeSafety, verifySecurityPatterns } from '../quality/automation.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { authorizeAgentAccess } from '../enterprise/agent-access.js';
import { recordAgentPerformance, recordTokenUsage, recordError } from '../analytics/index.js';
import { estimateTokens } from '../utils/token-forecast.js';

const execAsync = promisify(exec);

const AGENTS = {
  planner: {
    name: '@Planner',
    role: 'Task Breakdown Specialist',
    systemPrompt: `You are @Planner. Break down features into atomic tasks.
Use >> SEARCH_CODE: "query" to find existing patterns.
Output format:
## Task Breakdown
### Task 1: [Name]
- Agent: @Backend | @Frontend | ...
- Description: ...
`,
  },
  cto: {
    name: '@CTO',
    role: 'Technical Architecture Lead',
    systemPrompt: `You are @CTO. Make tech decisions, design architecture, set standards.
Use >> READ_CODE: "path/to/file" to review existing architecture.`,
  },
  backend: {
    name: '@Backend',
    role: 'API & Business Logic Developer',
    systemPrompt: `You are @Backend. Write API/Service code.
Available commands:
>> READ_CODE: "path" - Read a file
>> WRITE_CODE: "path" "content" - Create/Update a file
>> SEARCH_CODE: "query" - Search codebase
>> DELEGATE: @AgentName "Task" - Delegate work`,
  },
  frontend: {
    name: '@Frontend',
    role: 'UI/UX Developer',
    systemPrompt: `You are @Frontend. Build React/Next.js components.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"
>> SEARCH_CODE: "query"`,
  },
  database: {
    name: '@Database',
    role: 'Database Architect',
    systemPrompt: `You are @Database. Design schemas.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  testing: {
    name: '@Testing',
    role: 'QA Engineer',
    systemPrompt: `You are @Testing. Write tests.
Available commands:
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"`,
  },
  reviewer: {
    name: '@Reviewer',
    role: 'Code Review Specialist',
    systemPrompt: `You are @Reviewer. Audit code.
Available commands:
>> READ_CODE: "path"
>> SEARCH_CODE: "query"`,
  },
  debugger: {
    name: '@Debugger',
    role: 'Bug Fixing Specialist',
    systemPrompt: `You are @Debugger. Analyze logs and code to identify and fix bugs.
Available commands:
>> READ_CODE: "path"
>> SEARCH_CODE: "query"
>> WRITE_CODE: "path" "content"`,
  },
  devops: {
    name: '@DevOps',
    role: 'CI/CD & Infrastructure Specialist',
    systemPrompt: `You are @DevOps. Manage deployment, infrastructure, and git operations.
Available commands:
>> RUN_SHELL: "command"
>> READ_CODE: "path"
>> WRITE_CODE: "path" "content"
>> SEARCH_CODE: "query"`,
  },
};

export async function runAgentLoop(agentName, task, provider, projectContext, depth = 0) {
  if (depth > 5) return `[System]: Max delegation depth reached.`;

  const agentId = agentName.toLowerCase();
  const agent = AGENTS[agentId];
  if (!agent) return `[System]: Unknown agent @${agentName}`;

  const startedAt = Date.now();

  const access = await authorizeAgentAccess(agentId);
  if (!access.allowed) {
    return `[Access]: Role "${access.role}" cannot run @${agentName}`;
  }

  const spinner = ora(`\${agent.name} is working...`).start();

  // Notify Dashboard
  await dashboardNotifier.sendAgentStatus(agentName, 'working', task.substring(0, 50));

  const graphInfo = projectContext.graph
    ? `## Codebase Graph\n- Files: ${projectContext.graph.nodeCount}\n- Dependencies: ${projectContext.graph.edgeCount}\n`
    : '';

  const historySection = projectContext.history
    ? `## Execution History\n${projectContext.history}\n\n`
    : '';
  const contextSection = projectContext.context
    ? `## Context\n${projectContext.context.slice(0, 3000)}\n\n${graphInfo}${historySection}`
    : '';
  const prompt = `${contextSection}## Task\n${task}\n\nYou can use tools by outputting:
>> READ_CODE: "filePath"
>> WRITE_CODE: "filePath" "fullContent"
>> SEARCH_CODE: "query"
>> RUN_SHELL: "command"
>> DELEGATE: @AgentName "Task"`;

  const agentContext = buildAgentContext(agentId, agent);
  const providerInstance = typeof provider === 'function' ? provider(agentId) : provider;

  try {
    const executionDecision = await authorizeOperation({
      agent: agentContext,
      operation: 'execute',
      resourceType: 'ai',
      metadata: { task, agentTitle: agent.role },
    });
    if (!executionDecision.allowed) {
      spinner.fail(`${agent.name} blocked: ${executionDecision.reason}`);
      return `[Governance]: ${executionDecision.reason}`;
    }

    const result = await errorRecovery.executeWithRecovery(
      'ai-provider',
      async () => {
        return await providerInstance.generate(agent.systemPrompt, prompt);
      },
      {
        maxRetries: 2,
        retryDelay: 2000,
      }
    );

    try {
      const durationMs = Date.now() - startedAt;
      await recordAgentPerformance({
        agent: agentId,
        durationMs,
        success: true,
        task,
        provider: providerInstance?.getName?.() || 'provider',
      });

      const inputTokens = result?.usage?.inputTokens ?? estimateTokens(agent.systemPrompt + prompt);
      const outputTokens = result?.usage?.outputTokens ?? estimateTokens(result?.content || '');
      await recordTokenUsage({
        agent: agentId,
        model: result?.model || providerInstance?.model || null,
        inputTokens,
        outputTokens,
      });
    } catch {
      // analytics should not block execution
    }

    spinner.succeed(`\${agent.name} completed.`);
    await dashboardNotifier.sendAgentStatus(agentName, 'completed', 'Task finished');

    let content = result.content;

    // Tool Execution Logic (God Mode)
    const readMatch = content.match(/>>\s*READ_CODE:\s*["'](.+?)["']/);
    const writeMatch = content.match(/>>\s*WRITE_CODE:\s*["'](.+?)["']\s*["']([\s\S]+?)["']/);
    const _searchMatch = content.match(/>>\s*SEARCH_CODE:\s*["'](.+?)["']/);
    const runShellMatch = content.match(/>>\s*RUN_SHELL:\s*["'](.+?)["']/);
    const delegateMatch = content.match(/>>\s*DELEGATE:\s*@(\w+)\s*["'](.+?)["']/);

    if (readMatch) {
      let filePath = readMatch[1];
      // Sanitize file path to prevent directory traversal
      filePath = path.normalize(filePath);
      if (filePath.includes('../') || filePath.includes('..\\')) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError reading ${filePath}: Path traversal detected`,
          provider,
          projectContext,
          depth + 1
        );
      }

      const readDecision = await authorizeOperation({
        agent: agentContext,
        operation: 'read',
        filePath,
        metadata: { agentTitle: agent.role },
      });
      if (!readDecision.allowed) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nGovernance blocked READ_CODE on ${filePath}: ${readDecision.reason}`,
          provider,
          projectContext,
          depth + 1
        );
      }

      printInfo(chalk.cyan(`\n🔍 \${agent.name} is reading \${filePath}...`));
      await dashboardNotifier.sendLog(`@\${agentName} is reading \${filePath}`, 'info');
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        // Additional check to ensure path is within project directory
        if (!fullPath.startsWith(process.cwd())) {
          return await runAgentLoop(
            agentName,
            `${task}\n\nError reading ${filePath}: Path outside project root`,
            provider,
            projectContext,
            depth + 1
          );
        }

        const fileContent = await fs.readFile(fullPath, 'utf8');
        const nextPrompt = `Output of READ_CODE "${filePath}":\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease proceed with your task.`;
        return await runAgentLoop(
          agentName,
          `${task}\n\n${nextPrompt}`,
          provider,
          projectContext,
          depth + 1
        );
      } catch (e) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError reading ${filePath}: ${e.message}`,
          provider,
          projectContext,
          depth + 1
        );
      }
    }

    if (writeMatch) {
      let filePath = writeMatch[1];
      const newContent = writeMatch[2];

      // Sanitize file path to prevent directory traversal
      filePath = path.normalize(filePath);
      if (filePath.includes('../') || filePath.includes('..\\')) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError writing ${filePath}: Path traversal detected`,
          provider,
          projectContext,
          depth + 1
        );
      }

      const writeDecision = await authorizeOperation({
        agent: agentContext,
        operation: 'write',
        filePath,
        content: newContent,
        metadata: { agentTitle: agent.role },
      });
      if (!writeDecision.allowed) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nGovernance blocked WRITE_CODE on ${filePath}: ${writeDecision.reason}`,
          provider,
          projectContext,
          depth + 1
        );
      }

      printInfo(chalk.green(`\n💾 \${agent.name} is writing to \${filePath}...`));
      await dashboardNotifier.sendLog(`@\${agentName} is writing to \${filePath}`, 'success');
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        // Additional check to ensure path is within project directory
        if (!fullPath.startsWith(process.cwd())) {
          return await runAgentLoop(
            agentName,
            `${task}\n\nError writing ${filePath}: Path outside project root`,
            provider,
            projectContext,
            depth + 1
          );
        }

        // Prevent writing to sensitive files
        const forbiddenPaths = ['.git', 'node_modules', '.env', 'package-lock.json'];
        const pathParts = fullPath.split(path.sep);
        if (pathParts.some((part) => forbiddenPaths.includes(part))) {
          return await runAgentLoop(
            agentName,
            `${task}\n\nError writing ${filePath}: Cannot write to sensitive file`,
            provider,
            projectContext,
            depth + 1
          );
        }

        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, newContent, 'utf8');

        // --- Active Verification Hook ---
        printInfo(chalk.yellow(`\n🛡️  Running Active Verification Gates...`));
        const projectDir = process.cwd();
        const lintRes = await verifyLinting(projectDir);
        const typeRes = await verifyTypeSafety(projectDir);
        const secRes = await verifySecurityPatterns(projectDir);

        const failures = [];
        if (lintRes.status === 'FAIL') failures.push(`Linting Failed: ${lintRes.message}`);
        if (typeRes.status === 'FAIL') failures.push(`Type Safety Failed: ${typeRes.message}`);
        if (secRes.status === 'FAIL') failures.push(`Security Check Failed: ${secRes.message}`);

        if (failures.length > 0) {
          printError(`\n❌ Verification Failed!`);
          failures.forEach((f) => printError(`  - ${f}`));

          // Return failure to agent so it can fix it
          const errorMsg = `Code written to ${filePath}, BUT verification failed. YOU MUST FIX THIS:\n${failures.join('\n')}`;
          return await runAgentLoop(
            agentName,
            `${task}\n\n${errorMsg}`,
            provider,
            projectContext,
            depth + 1
          );
        }

        printSuccess(`\n✅ Verification Passed`);
        // --------------------------------

        const nextPrompt = `Successfully wrote ${filePath} and passed verification. Please proceed or delegate verification.`;
        return await runAgentLoop(
          agentName,
          `${task}\n\n${nextPrompt}`,
          provider,
          projectContext,
          depth + 1
        );
      } catch (e) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError writing ${filePath}: ${e.message}`,
          provider,
          projectContext,
          depth + 1
        );
      }
    }

    if (runShellMatch) {
      const command = runShellMatch[1];
      const execDecision = await authorizeOperation({
        agent: agentContext,
        operation: 'execute',
        resourceType: 'shell',
        command,
        metadata: { agentTitle: agent.role },
      });
      if (!execDecision.allowed) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nGovernance blocked RUN_SHELL "${command}": ${execDecision.reason}`,
          provider,
          projectContext,
          depth + 1
        );
      }
      printInfo(chalk.yellow(`\n⚡ ${agent.name} is executing shell command: ${command}...`));

      try {
        const { stdout, stderr } = await execAsync(command);
        const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
        const nextPrompt = `Output of RUN_SHELL "${command}":\n\`\`\`\n${output}\n\`\`\`\n\nPlease proceed with your task.`;
        return await runAgentLoop(
          agentName,
          `${task}\n\n${nextPrompt}`,
          provider,
          projectContext,
          depth + 1
        );
      } catch (e) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError executing ${command}: ${e.message}`,
          provider,
          projectContext,
          depth + 1
        );
      }
    }

    if (delegateMatch) {
      const nextAgent = delegateMatch[1];
      const nextTask = delegateMatch[2];
      const delegateDecision = await authorizeOperation({
        agent: agentContext,
        operation: 'delegate',
        metadata: { to: nextAgent, agentTitle: agent.role },
      });
      if (!delegateDecision.allowed) {
        return `${content}\n\n[Governance]: Delegation blocked - ${delegateDecision.reason}`;
      }
      printInfo(chalk.cyan(`\n↪️  ${agent.name} is delegating to @${nextAgent}: "${nextTask}"`));
      const subResult = await runAgentLoop(
        nextAgent,
        nextTask,
        provider,
        projectContext,
        depth + 1
      );
      return `${content}\n\n---\n\n## Delegated Result from @${nextAgent}\n${subResult}`;
    }

    return content;
  } catch (err) {
    spinner.fail(`${agent.name} failed: ${err.message}`);
    try {
      await recordAgentPerformance({
        agent: agentId,
        durationMs: Date.now() - startedAt,
        success: false,
        task,
        provider: providerInstance?.getName?.() || 'provider',
      });
      await recordError({
        message: err.message,
        command: 'run',
        stack: err.stack,
        metadata: { agent: agentId },
      });
    } catch {
      // ignore analytics failures
    }
    return `[Error]: ${err.message}`;
  }
}

function buildAgentContext(agentId, agent) {
  return {
    id: agentId,
    name: agent?.name || agentId,
    roleId: agentId,
    title: agent?.role,
  };
}

export function createAgentProviderFactory(providerId, options = {}) {
  const cache = new Map();
  return (agentId) => {
    const key = agentId.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    const agent = AGENTS[key];
    const agentContext = buildAgentContext(key, agent);
    const provider = createProvider(providerId, { ...options, agent: agentContext });
    cache.set(key, provider);
    return provider;
  };
}
