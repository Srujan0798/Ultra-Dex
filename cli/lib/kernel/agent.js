// Ultra-Dex Kernel — Intelligent Agent Runtime
// The Cognitive Core: Connects Context + AI + Tools

import { renderer } from '../ui/renderer.js';
import { theme } from '../ui/theme.js';
import { getProvider } from '../providers/index.js';
import { context } from './context.js';
import { execSync } from 'child_process';

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
        
        // 1. Fallback if no AI is configured (Safety Net)
        if (!provider) {
            renderer.box(
                `To enable the AI Brain, please set an API Key:\n` +
                `export ANTHROPIC_API_KEY=... (Recommended)\n` +
                `export GOOGLE_AI_KEY=...`,
                'Missing Cognitive Module', 'error'
            );
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
You can run the following CLI commands:
- 'init': Start new project
- 'generate <idea>': Create implementation plan
- 'build': Auto-implement the plan
- 'review': Analyze code quality
- 'fix': Apply self-healing fixes
- 'swarm <task>': Run agent pipeline
- 'status': Show dashboard

## INSTRUCTION
Decide the best course of action for the user's input: "${input}"

RETURN ONLY JSON:
{
  "type": "command" | "chat" | "error",
  "command": "full cli command to run" (if type is command),
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
                
                // execute the command (strip 'ultra-dex ' prefix if present)
                const cmd = decision.command.replace(/^ultra-dex\s+/, '');
                
                // Delegate to internal tool runner (simulated for safety in this step)
                if (cmd === 'exit') process.exit(0);
                
                // We use a new spinner for the actual work
                console.log(theme.dim(`  [System] Spawning process: ${cmd}`));
                execSync(`npx ultra-dex ${cmd}`, { stdio: 'inherit' });
                
            } else if (decision.type === 'chat') {
                renderer.succeed('Analysis Complete.');
                await renderer.text(decision.response);
            } else {
                renderer.fail(decision.response || "I couldn't process that request.");
            }

        } catch (e) {
            renderer.fail(`Cognitive Failure: ${e.message}`);
            // Fallback to basic chat if JSON parsing fails
            await renderer.text(`**Error Details:**\n${e.message}`);
        }
    }
}

export const agent = new Agent();