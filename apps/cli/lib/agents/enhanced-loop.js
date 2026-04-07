/**
 * Enhanced agent loop with improved tool calling support
 */

import chalk from 'chalk';

import ora from '../utils/ora.js';
import path from 'path';
import { dashboardNotifier } from '../utils/dashboard-notifier.js';
import { authorizeOperation } from '../governance/index.js';
import { verifyLinting, verifyTypeSafety, verifySecurityPatterns } from '../quality/automation.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';
import { errorRecovery } from '../utils/error-recovery.js';
import { executeTool, processToolCalls } from '../tools/execution.js';
import { logger } from '../utils/logger.js';
import { initializeAnalyticsSink } from '../analytics/index.js';

/**
 * Helper to safely format code blocks preventing markdown injection
 * @param {string} content - The content to wrap in code block
 * @returns {string} - Formatted code block
 */
function formatCodeBlock(content) {
  // If content contains triple backticks, use 4 backticks, and so on
  let fence = '```';
  while (content.includes(fence)) {
    fence += '`';
  }
  return `${fence}\n${content}\n${fence}`;
}

/**
 * Enhanced agent loop with improved tool calling support
 * @param {string} agentName - Name of the agent to run
 * @param {string} task - Task for the agent to execute
 * @param {Object} provider - AI provider instance
 * @param {Object} projectContext - Project context information
 * @param {number} depth - Recursion depth (to prevent infinite loops)
 * @returns {Promise<string>} - Result of the agent execution
 */
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
>> RUN_SHELL: "command"
>> DELEGATE: @AgentName "Task"`;

  const agentContext = buildAgentContext(agentId, agent);
  const providerInstance = typeof provider === 'function' ? await provider(agentId) : provider;

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
        // Check if provider supports tool calling
        if (typeof providerInstance.generateWithTools === 'function') {
          // Define available tools for the agent
          const tools = [
            {
              type: "function",
              function: {
                name: "read_file",
                description: "Read a file from the project",
                parameters: {
                  type: "object",
                  properties: {
                    filePath: {
                      type: "string",
                      description: "Path to the file to read"
                    }
                  },
                  required: ["filePath"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "write_file",
                description: "Write content to a file in the project",
                parameters: {
                  type: "object",
                  properties: {
                    filePath: {
                      type: "string",
                      description: "Path to the file to write"
                    },
                    content: {
                      type: "string",
                      description: "Content to write to the file"
                    }
                  },
                  required: ["filePath", "content"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "run_shell",
                description: "Execute a shell command",
                parameters: {
                  type: "object",
                  properties: {
                    command: {
                      type: "string",
                      description: "Command to execute"
                    }
                  },
                  required: ["command"]
                }
              }
            }
          ];
          
          // Use tool calling if available
          return await providerInstance.generateWithTools(
            agent.systemPrompt,
            prompt,
            tools,
            { maxTokens: 2000, temperature: 0.7 }
          );
        } else {
          // Fall back to regular generation
          return await providerInstance.generate(agent.systemPrompt, prompt);
        }
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

    // Check if the provider returned tool calls
    if (result.toolCalls && result.toolCalls.length > 0) {
      // Process tool calls using the new tool execution system
      printInfo(chalk.cyan(`\n🔧 ${agent.name} is executing ${result.toolCalls.length} tool calls...`));
      
      try {
        const toolResults = await processToolCalls(result.toolCalls, process.cwd());
        
        // Format tool results for the agent
        let toolOutput = "## Tool Execution Results\n";
        for (const toolResult of toolResults) {
          const { result: toolResultData } = toolResult;
          
          if (toolResultData.success) {
            toolOutput += `\n✅ Tool executed successfully:\n${JSON.stringify(toolResultData, null, 2)}\n`;
          } else {
            toolOutput += `\n❌ Tool execution failed:\n${JSON.stringify(toolResultData, null, 2)}\n`;
          }
        }
        
        // Feed the tool results back to the agent
        const nextPrompt = `${content}\n\n${toolOutput}\n\nPlease continue with your task based on these results.`;
        return await runAgentLoop(
          agentName,
          nextPrompt,
          provider,
          projectContext,
          depth + 1
        );
      } catch (e) {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError executing tools: ${e.message}`,
          provider,
          projectContext,
          depth + 1
        );
      }
    }
    
    // Legacy parsing for backward compatibility
    const readMatch = content.match(/>>\s*READ_CODE:\s*["'](.+?)["']/);
    const writeMatch = content.match(/>>\s*WRITE_CODE:\s*["'](.+?)["']\s*["']([\s\S]+?)["']/);
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

      printInfo(chalk.cyan(`\n🔍 ${agent.name} is reading ${filePath}...`));
      await dashboardNotifier.sendLog(`@${agentName} is reading ${filePath}`, 'info');

      const result = await executeTool({
        function: {
          name: 'read_file',
          arguments: JSON.stringify({ filePath })
        }
      });

      if (result.success) {
        const nextPrompt = `Output of READ_CODE "${filePath}":\n${formatCodeBlock(result.content)}\n\nPlease proceed with your task.`;
        return await runAgentLoop(
          agentName,
          `${task}\n\n${nextPrompt}`,
          provider,
          projectContext,
          depth + 1
        );
      } else {
        return await runAgentLoop(
          agentName,
          `${task}\n\nError reading ${filePath}: ${result.error}`,
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

      printInfo(chalk.green(`\n💾 ${agent.name} is writing to ${filePath}...`));
      await dashboardNotifier.sendLog(`@${agentName} is writing to ${filePath}`, 'success');
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

        const writeResult = await executeTool({
          function: {
            name: 'write_file',
            arguments: JSON.stringify({ filePath, content: newContent })
          }
        });

        if (!writeResult.success) {
          throw new Error(writeResult.error);
        }

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

      const result = await executeTool({
        function: {
          name: 'run_shell',
          arguments: JSON.stringify({ command })
        }
      });

      if (result.success) {
        const output = result.stdout + (result.stderr ? `\nSTDERR:\n${result.stderr}` : '');
        const nextPrompt = `Output of RUN_SHELL "${command}":\n${formatCodeBlock(output)}\n\nPlease proceed with your task.`;
        return await runAgentLoop(
          agentName,
          `${task}\n\n${nextPrompt}`,
          provider,
          projectContext,
          depth + 1
        );
      } else {
        const output = (result.stdout || '') + (result.stderr ? `\nSTDERR:\n${result.stderr}` : '');
        const errorMsg = result.error || 'Unknown error';
        return await runAgentLoop(
          agentName,
          `${task}\n\nError executing ${command}: ${errorMsg}\nPartial Output:\n${formatCodeBlock(output)}`,
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

// Define the agents (this would normally come from the original file)
export const AGENTS = [
  {
    name: 'architect',
    description: 'Manifest reality from a raw idea',
    file: '0-orchestration/architect.md',
    tier: 'Orchestration',
  },
  {
    name: 'planner',
    description: 'Task breakdown & planning',
    file: '1-leadership/planner.md',
    tier: 'Leadership',
  },
  {
    name: 'cto',
    description: 'Architecture & tech decisions',
    file: '1-leadership/cto.md',
    tier: 'Leadership',
  },
  {
    name: 'backend',
    description: 'API & server logic',
    file: '2-development/backend.md',
    tier: 'Development',
  },
  {
    name: 'frontend',
    description: 'UI & components',
    file: '2-development/frontend.md',
    tier: 'Development',
  },
  {
    name: 'database',
    description: 'Schema design & queries',
    file: '2-development/database.md',
    tier: 'Development',
  },
  {
    name: 'debugger',
    description: 'Bug fixing & troubleshooting',
    file: '5-quality/debugger.md',
    tier: 'Quality',
  },
  {
    name: 'reviewer',
    description: 'Code review & quality check',
    file: '5-quality/reviewer.md',
    tier: 'Quality',
  },
  {
    name: 'testing',
    description: 'QA & test automation',
    file: '5-quality/testing.md',
    tier: 'Quality',
  },
];

/**
 * Build agent context for authorization
 * @param {string} agentId - Agent ID
 * @param {Object} agent - Agent definition
 * @returns {Object} Agent context
 */
function buildAgentContext(agentId, agent) {
  return {
    id: agentId,
    name: agent?.name || agentId,
    roleId: agentId,
    title: agent?.role,
  };
}

/**
 * Placeholder functions that would be imported from other modules
 */
async function authorizeAgentAccess(_agentId) {
  return { allowed: true, role: 'admin' };
}

async function recordAgentPerformance(performanceData) {
  initializeAnalyticsSink();
  await logger.event('analytics.agent_performance', performanceData, {
    console: false,
    source: 'enhanced-loop',
  });
}

async function recordTokenUsage(tokenData) {
  initializeAnalyticsSink();
  await logger.event('analytics.token_usage', tokenData, {
    console: false,
    source: 'enhanced-loop',
  });
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4); // Rough estimation
}

async function recordError(errorData) {
  initializeAnalyticsSink();
  await logger.event('analytics.error', errorData, {
    console: false,
    source: 'enhanced-loop',
  });
}

export default { runAgentLoop };
