// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex Kernel — Intelligent Agent Runtime
// The Cognitive Core: Connects Context + AI + Tools

import { renderer } from '../ui/renderer.js';
import { theme } from '../ui/theme.js';
import { getProvider, createProvider, getDefaultProvider } from '../providers/index.js';
import { context } from './context.js';
import { editor } from './editor.js';
import { execSync } from 'child_process';
import { routeIntent } from '../nlp/router.js';
import { session } from './session.js';
import { tools } from './tools.js';

import {
  verifyTypeSafety,
  _verifyLinting,
  verifySecurityPatterns,
  verifyConsoleLogs,
} from '../quality/automation.js';
import { modelOrchestrator } from '../ai/model-router.js';
import { tokenBudget } from '../ui/TokenBudget.js';

import { governance } from '../governance/index.js';
import { configManager } from '../utils/config-manager.js';

export class Agent {
  constructor() {
    this.name = 'Ultra-Dex';
    this.provider = null;
    this.role = 'default';
  }

  async initialize(modelId = null) {
    // Initialize Governance
    await governance.init();
    const config = await configManager.loadGlobal();
    this.role = config?.user?.role || 'default';

    // If specific model requested, create specific provider
    if (modelId) {
      // Determine provider type from model ID
      let providerType = getDefaultProvider();

      if (modelId.startsWith('claude')) providerType = 'claude';
      else if (modelId.startsWith('gpt')) providerType = 'openai';
      else if (modelId.startsWith('gemini')) providerType = 'gemini';
      else if (
        modelId.startsWith('ollama') ||
        modelId.startsWith('llama') ||
        modelId.startsWith('mixtral')
      )
        providerType = 'ollama';

      if (providerType) {
        try {
          return createProvider(providerType, { model: modelId });
        } catch (_e) {
          // Fallback to default if creation fails
          process.stderr.write(
            `⚠️ Failed to create provider for ${modelId}, falling back to default.\n`
          );
        }
      }
    }

    if (!this.provider) {
      this.provider = getProvider();
    }
    return this.provider;
  }

  /**
   * The Main Agent Loop (Multi-Turn)
   * Input -> Think -> [Tool Use -> Think] -> Action
   */
  async execute(intent, input) {
    // 1. Route the Task (Intelligence Phase)
    let routing = { model: null, classification: { category: 'general' } };
    try {
      routing = await modelOrchestrator.router.routeTask(input);
    } catch (_e) {
      // Router failure shouldn't stop execution
    }

    const provider = await this.initialize(routing.model);

    // 2. Fallback: IDE Companion Mode (No API Key)
    if (!provider) {
      await this.runOfflineMode(input);
      return;
    }

    // Record User Input
    session.addUserMessage(input);

    // 3. Think Phase (Visuals)
    await renderer.thinking('Cognitive Architecture Analysis', [
      `Classified task: ${routing.classification.category}`,
      `Routed to model: ${routing.model || 'default'}`,
      'Parsing natural language objective...',
      'Querying Code Property Graph (CPG)...',
      'Cross-referencing IMPLEMENTATION-PLAN.md...',
      'Building multi-agent task orchestration...',
      'Verifying architectural constraints...',
    ]);

    const projectCtx = await context.scan();
    let turnCount = 0;
    const maxTurns = 8; // Increased for verification loops

    // Forecast Cost
    const estimatedContext = 5000; // Base context size
    const forecast = tokenBudget.forecast(provider.model, estimatedContext, 1000);
    renderer.box(
      `Estimated Cost: $${forecast.cost.toFixed(4)}\nInput: ~${forecast.inputTokens} tokens`,
      'Token Budget Forecast',
      'info'
    );

    while (turnCount < maxTurns) {
      turnCount++;

      // Build Context for this Turn
      const history = session
        .getContext()
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');
      const toolDefs = JSON.stringify(tools.getDefinitions(), null, 2);

      const systemPrompt = `
You are Ultra-Dex, an expert AI Software Engineer.
Your goal is to execute the user's request. You have access to tools to explore the codebase.

## PROJECT CONTEXT
- **Stack:** ${projectCtx.stack}
- **Branch:** ${projectCtx.git.branch}
- **Root:** ${context.projectRoot}
- **Key Files:** ${projectCtx.files.slice(0, 20).join(', ')}...

## CONVERSATION HISTORY
${history}

## AVAILABLE TOOLS
${toolDefs}

## INSTRUCTION
Decide the next step. If you need more info or verification, use a tool. 
If you edit a file, the system will automatically run a quality scan.

RETURN ONLY JSON:
{
  "type": "tool_use" | "command" | "edit" | "chat",
  "tool": "tool_name",
  "params": { ...args },
  "command": "full cli command",
  "file": "path", "code": "content",
  "reasoning": "brief thought process",
  "response": "message to user"
}
`;

      try {
        let llmOutput = '';
        if (provider.complete) {
          llmOutput = await provider.complete(systemPrompt);
        } else {
          const res = await provider.generate(systemPrompt);

          if (res.usage) {
            await tokenBudget.track(provider.model, res.usage.inputTokens, res.usage.outputTokens);
          }

          llmOutput = res.content || res.text || JSON.stringify(res);
        }

        const jsonMatch = llmOutput.match(/\{[\s\S]*\}/);
        const decision = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { type: 'chat', response: llmOutput };

        // 4. Handle Tool Use (Recursive Step)
        if (decision.type === 'tool_use') {
          // GOVERNANCE CHECK
          let govAction = null;
          let govTarget = null;

          if (decision.tool === 'read_file' || decision.tool === 'list_files') {
            govAction = 'read';
            govTarget = decision.params.path;
          } else if (decision.tool === 'run_shell') {
            govAction = 'execute';
            govTarget = decision.params.command;
          }

          if (govAction && govTarget) {
            const auth = governance.authorize(this.role, govAction, govTarget);
            if (!auth.allowed) {
              renderer.fail(`Governance Block: ${auth.reason}`);
              session.addAgentMessage(`Action blocked by governance: ${auth.reason}`);
              await renderer.text(`> 🛡️ Governance violation blocked. Retrying...`, false);
              continue;
            }
          }

          renderer.succeed(`Action: ${decision.reasoning}`);
          let toolResult = '';

          if (decision.tool === 'read_file') {
            toolResult = await tools.readFile(decision.params.path);
          } else if (decision.tool === 'list_files') {
            toolResult = await tools.listFiles(decision.params.path);
          } else if (decision.tool === 'search_code') {
            toolResult = await tools.search(decision.params.query);
          } else if (decision.tool === 'run_shell') {
            toolResult = await tools.runShell(decision.params.command);
          }

          // Feed result back into history for next turn
          session.addAgentMessage(
            `Tool '${decision.tool}' Output:\n${toolResult.slice(0, 2000)}...`
          );
          await renderer.text(`> Checked ${decision.tool}. Analyzing results...`, false);
          continue; // Loop back
        }

        // 5. Handle Terminal Actions (Final Steps)
        if (decision.type === 'command') {
          // GOVERNANCE CHECK
          const auth = governance.authorize(this.role, 'execute', decision.command);
          if (!auth.allowed) {
            renderer.fail(`Governance Block: ${auth.reason}`);
            session.addAgentMessage(`Command blocked by governance: ${auth.reason}`);
            await renderer.text(`> 🛡️ Destructive command blocked.`, false);
            continue;
          }

          renderer.succeed(decision.reasoning);
          renderer.box(decision.command, 'Executing Plan', 'info');
          session.addAgentMessage(`Executed: ${decision.command}`);
          const cmd = decision.command.replace(/^ultra-dex\s+/, '');
          if (cmd === 'exit') process.exit(0);
          execSync(`npx ultra-dex ${cmd}`, { stdio: 'inherit' });
          break;
        } else if (decision.type === 'edit') {
          // GOVERNANCE CHECK
          const auth = governance.authorize(this.role, 'write', decision.file);
          if (!auth.allowed) {
            renderer.fail(`Governance Block: ${auth.reason}`);
            session.addAgentMessage(`Edit blocked by governance: ${auth.reason}`);
            await renderer.text(`> 🛡️ File access blocked.`, false);
            continue;
          }

          renderer.succeed('Generating Code Change...');
          const success = await editor.edit(
            decision.file,
            decision.code,
            decision.reasoning,
            false
          );

          if (success) {
            // AUTOMATIC QUALITY SCAN (Self-Healing)
            renderer.startSpinner('Verifying changes...');

            const results = [];
            const projectDir = context.projectRoot;

            // Run core quality gates
            results.push({ name: 'Security', ...(await verifySecurityPatterns(projectDir)) });
            results.push({ name: 'Console Logs', ...(await verifyConsoleLogs(projectDir)) });

            // Only run slow gates if relevant
            if (decision.file.endsWith('.ts') || decision.file.endsWith('.tsx')) {
              results.push({ name: 'Type Safety', ...(await verifyTypeSafety(projectDir)) });
            }

            const failures = results.filter((r) => r.status === 'FAIL');

            if (failures.length > 0) {
              renderer.fail(`Verification failed: Found ${failures.length} regression(s).`);
              const issueSummary = failures.map((f) => `- [${f.name}] ${f.message}`).join('\n');
              session.addAgentMessage(
                `Edit verification FAILED. Issues found:\n${issueSummary}\nPLEASE FIX THESE ISSUES.`
              );
              await renderer.text(
                `I've detected quality regressions. Attempting self-healing...`,
                false
              );
              continue; // RECURSIVE FIX
            } else {
              renderer.succeed('Changes verified. All quality checks passed.');
              session.addAgentMessage(`Edited ${decision.file} and verified changes.`);
              break;
            }
          }
          break;
        } else if (decision.type === 'chat') {
          renderer.succeed('Analysis Complete.');
          await renderer.text(decision.response);
          session.addAgentMessage(decision.response);
          break;
        } else {
          renderer.fail(decision.response || "I couldn't process that request.");
          break;
        }
      } catch (e) {
        renderer.fail(`Cognitive Failure: ${e.message}`);
        await renderer.text(`**Error Details:**\n${e.message}`);
        break;
      }
    }
  }

  /**
   * IDE Companion Mode (Offline)
   * Uses Regex for commands, generates Context Packets for complex requests.
   */
  async runOfflineMode(input) {
    // A. Check for simple commands (e.g. "status", "build")
    const simpleIntent = routeIntent(input);

    if (simpleIntent && simpleIntent !== 'help' && simpleIntent !== 'exit') {
      renderer.succeed(`Offline Mode: Executing '${simpleIntent}'`);
      try {
        execSync(`npx ultra-dex ${simpleIntent}`, { stdio: 'inherit' });
      } catch (e) {
        renderer.fail(`Execution failed: ${e.message}`);
      }
      return;
    }

    // B. Complex Request -> Generate Prompt for Cursor/Windsurf
    const projectCtx = await context.scan();

    const contextPacket = `
**Copy this into Cursor / Windsurf / ChatGPT:**

I am working on a **${projectCtx.stack}** project.
Current Git Branch: **${projectCtx.git.branch}**

**Context:**
- Root: 
${context.projectRoot}
- Key Files: ${projectCtx.files.slice(0, 15).join(', ')}...

**Task:**
${input}

**Instruction:**
Please analyze the file structure and implement the requested changes.
`;

    renderer.succeed('Context Packet Generated');
    process.stdout.write(
      theme.warning('  ⚠ No API Key detected. IDE Companion Mode active.') + '\n'
    );
    process.stdout.write('\n');
    renderer.box(contextPacket, '📋 COPY TO IDE', 'info');
    process.stdout.write(
      theme.dim('  (Use this prompt in your AI Code Editor to get the best result)') + '\n'
    );
  }
}

export const agent = new Agent();
