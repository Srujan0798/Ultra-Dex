// Ultra-Dex Kernel — Intelligent Agent Runtime
// The Cognitive Core: Connects Context + AI + Tools

import { renderer } from '../ui/renderer.js';

import { theme } from '../ui/theme.js';

import { getProvider } from '../providers/index.js';

import { context } from './context.js';

import { editor } from './editor.js';

import { execSync } from 'child_process';

import { routeIntent } from '../nlp/router.js';

import { session } from './session.js';

import { tools } from './tools.js'; 

import { runQualityScan } from '../quality/scanner.js'; // Import Quality Scanner



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

     * The Main Agent Loop (Multi-Turn)

     * Input -> Think -> [Tool Use -> Think] -> Action

     */

    async execute(intent, input) {

        const provider = await this.initialize();

        

        // 1. Fallback: IDE Companion Mode (No API Key)

        if (!provider) {

            await this.runOfflineMode(input);

            return;

        }



        // Record User Input

        session.addUserMessage(input);



        // 2. Think Phase (Visuals)

        await renderer.thinking('Cognitive Processing', [

            'Analyzing natural language intent...',

            'Loading project context...',

            'Reviewing conversation history...',

            'Formulating execution plan...'

        ]);



        const projectCtx = await context.scan();

        let turnCount = 0;

        const maxTurns = 8; // Increased for verification loops



        while (turnCount < maxTurns) {

            turnCount++;

            

            // Build Context for this Turn

            const history = session.getContext().map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

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

                let llmOutput = "";

                if (provider.complete) {

                    llmOutput = await provider.complete(systemPrompt);

                } else {

                    const res = await provider.generate(systemPrompt);

                    llmOutput = res.content || res.text || JSON.stringify(res);

                }



                const jsonMatch = llmOutput.match(/\{[\s\S]*\}/);

                const decision = jsonMatch ? JSON.parse(jsonMatch[0]) : { type: 'chat', response: llmOutput };



                // 4. Handle Tool Use (Recursive Step)

                if (decision.type === 'tool_use') {

                    renderer.succeed(`Action: ${decision.reasoning}`);

                    let toolResult = "";

                    

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

                    session.addAgentMessage(`Tool '${decision.tool}' Output:\n${toolResult.slice(0, 2000)}...`);

                    await renderer.text(`> Checked ${decision.tool}. Analyzing results...`, false);

                    continue; // Loop back

                }



                // 5. Handle Terminal Actions (Final Steps)

                if (decision.type === 'command') {

                    renderer.succeed(decision.reasoning);

                    renderer.box(decision.command, 'Executing Plan', 'info');

                    session.addAgentMessage(`Executed: ${decision.command}`);

                    const cmd = decision.command.replace(/^ultra-dex\s+/, '');

                    if (cmd === 'exit') process.exit(0);

                    execSync(`npx ultra-dex ${cmd}`, { stdio: 'inherit' });

                    break;



                } else if (decision.type === 'edit') {

                    renderer.succeed('Generating Code Change...');

                    const success = await editor.edit(decision.file, decision.code, decision.reasoning, false);

                    

                    if (success) {

                        // AUTOMATIC QUALITY SCAN (Self-Healing)

                        renderer.startSpinner('Verifying changes...');

                        const scanResults = await runQualityScan(context.projectRoot);

                        

                        if (scanResults.failed > 0) {

                            renderer.fail(`Verification failed: Found ${scanResults.failed} critical issues.`);

                            const issueSummary = scanResults.details.map(d => `- [${d.severity}] ${d.file}: ${d.message}`).join('\n');

                            session.addAgentMessage(`Edit verification FAILED. Issues found:\n${issueSummary}\nPLEASE FIX THESE ISSUES.`);

                            await renderer.text(`I've detected quality regressions. Attempting self-healing...`, false);

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
        console.log(theme.warning('  ⚠ No API Key detected. IDE Companion Mode active.'));
        console.log('');
        renderer.box(contextPacket, '📋 COPY TO IDE', 'info');
        console.log(theme.dim('  (Use this prompt in your AI Code Editor to get the best result)'));
    }
}

export const agent = new Agent();