// Ultra-Dex Kernel — Intelligent Agent Runtime
// The Cognitive Core: Connects Context + AI + Tools

import { renderer } from '../ui/renderer.js';
import { theme } from '../ui/theme.js';
import { getProvider } from '../providers/index.js';
import { context } from './context.js';
import { editor } from './editor.js';
import { execSync } from 'child_process';
import { routeIntent } from '../nlp/router.js'; // Import Regex Router

export class Agent {
    constructor() {
        this.name = 'Ultra-Dex';
        this.provider = null;
    }

    async initialize() {
        if (!this.provider) {
            this.provider = getProvider();
        }
        return this.provider;
    }

    /**
     * The Main Agent Loop
     * Input -> Think (LLM) -> Plan -> Act -> Result
     */
    async execute(intent, input) {
        const provider = await this.initialize();
        
        // 1. Fallback: IDE Companion Mode (No API Key)
        if (!provider) {
            await this.runOfflineMode(input);
            return;
        }

        // 2. Think Phase (Visuals)
        await renderer.thinking('Cognitive Processing', [
            'Analyzing natural language intent...',
            'Loading project context...',
            'Formulating execution plan...'
        ]);

        // 3. Context Injection
        const projectCtx = await context.scan();
        const systemPrompt = `
You are Ultra-Dex, an expert AI Software Engineer.
Your goal is to execute the user's request in the context of their project.

## PROJECT CONTEXT
- **Stack:** ${projectCtx.stack}
- **Branch:** ${projectCtx.git.branch}
- **Root:** ${context.projectRoot}
- **Key Files:** ${projectCtx.files.slice(0, 20).join(', ')}...

## CAPABILITIES
You can run the following CLI commands or edit files directly:
- 'init': Start new project
- 'generate <idea>': Create implementation plan
- 'build': Auto-implement the plan
- 'swarm <task>': Run agent pipeline
- 'status': Show dashboard
- 'edit_file': Modify or create a file (Use this for direct code changes)

## INSTRUCTION
Decide the best course of action for the user's input: "${input}"

RETURN ONLY JSON:
{
  "type": "command" | "edit" | "chat" | "error",
  "command": "full cli command to run" (if type is command),
  "file": "path/to/file" (if type is edit),
  "code": "full new content of file" (if type is edit),
  "reasoning": "brief explanation of why",
  "response": "chat response" (if type is chat)
}
`;

        // 4. LLM Decision (The "Brain")
        try {
            let llmOutput = "";
            if (provider.complete) {
                llmOutput = await provider.complete(systemPrompt);
            } else {
                const res = await provider.generate(systemPrompt);
                llmOutput = res.content || res.text || JSON.stringify(res);
            }

            // Parse JSON (Rough heuristic for robustness)
            const jsonMatch = llmOutput.match(/\{[\s\S]*\}/);
            const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: 'chat', response: llmOutput };

            // 5. Execution Logic
            if (decision.type === 'command') {
                renderer.succeed(decision.reasoning);
                renderer.box(decision.command, 'Executing Plan', 'info');
                
                const cmd = decision.command.replace(/^ultra-dex\s+/, '');
                
                if (cmd === 'exit') process.exit(0);
                
                console.log(theme.dim(`  [System] Spawning process: ${cmd}`));
                execSync(`npx ultra-dex ${cmd}`, { stdio: 'inherit' });
                
            } else if (decision.type === 'edit') {
                // Interactive Editing Mode
                renderer.succeed('Generating Code Change...');
                await editor.edit(decision.file, decision.code, decision.reasoning);

            } else if (decision.type === 'chat') {
                renderer.succeed('Analysis Complete.');
                await renderer.text(decision.response);
            } else {
                renderer.fail(decision.response || "I couldn't process that request.");
            }

        } catch (e) {
            renderer.fail(`Cognitive Failure: ${e.message}`);
            await renderer.text(`**Error Details:**\n${e.message}`);
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
- Root: \`${context.projectRoot}\`
- Key Files: ${projectCtx.files.slice(0, 15).join(', ')}...

**Task:**
${input}

**Instruction:**
Please analyze the file structure and implement the requested changes.
`;

        renderer.succeed('Context Packet Generated');
        console.log(theme.warning('  ⚠ No API Key detected. IDE Companion Mode active.'));
        console.log('');
        renderer.box(contextPacket, '📋 COPY TO IDE', 'info');
        console.log(theme.dim('  (Use this prompt in your AI Code Editor to get the best result)'));
    }
}
export const agent = new Agent();