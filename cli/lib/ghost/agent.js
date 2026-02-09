// Copyright (c) 2026 Ultra-Dex
// Project Ghost: Agent Brain (The Intelligence)
// Orchestrates Vision -> VLM -> Action loop

import { inputController } from './input.js';
import { visionSystem } from './vision.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer'; // For safety confirmation

export class GhostAgent {
    constructor(options = {}) {
        this.openai = null; // Lazy init
        this.maxSteps = options.maxSteps || 20;
        this.debug = options.debug || false;
        this.safetyMode = options.safetyMode ?? true; // Default to requiring confirmation
    }

    /**
     * Execute a high-level goal
     * @param {string} goal - "Open hacker news and find the top story"
     */
    async run(goal) {
        // Lazy init OpenAI client
        if (!this.openai) {
            if (!process.env.OPENAI_API_KEY) {
                console.error('❌ Ghost Agent requires OPENAI_API_KEY to run.');
                return;
            }
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
        console.log(`👻 Ghost Agent active. Goal: "${goal}"`);

        let step = 0;
        const history = [];

        while (step < this.maxSteps) {
            console.log(`\n🔄 Step ${step + 1}/${this.maxSteps}`);

            // 1. Vision: Capture Screen
            const screenshotBase64 = await visionSystem.captureForVLM(0.5); // Downscale for speed/cost

            // 2. Intelligence: Ask VLM
            const response = await this.queryVLM(goal, screenshotBase64, history);

            if (!response) {
                console.log('❌ VLM failed to respond.');
                break;
            }

            console.log(`🧠 Thought: ${response.thought}`);
            console.log(`👉 Planned Action: ${response.action} ${JSON.stringify(response.params)}`);

            // 3. Safety: User Confirmation
            if (this.safetyMode) {
                const { confirm } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'confirm',
                    message: `Allow Ghost to ${response.action}?`,
                    default: true
                }]);

                if (!confirm) {
                    console.log('🛑 Action denied by user.');
                    break;
                }
            }

            // 4. Action: Execute
            await this.executeAction(response);
            history.push({
                role: 'assistant',
                content: `Step ${step}: I executed ${response.action}. Result: Success.`
            });

            if (response.action === 'done') {
                console.log('✅ Goal achieved!');
                return;
            }

            step++;
            // Wait for UI to settle
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    async queryVLM(goal, imageBase64, history) {
        const systemPrompt = `
    You are a Computer Use Agent capable of controlling a mouse and keyboard.
    You will receive a screenshot of the user's screen and a goal.
    
    You must output a JSON object with the following structure:
    {
      "thought": "Analysis of the screen state and next step",
      "action": "click" | "type" | "move" | "scroll" | "done",
      "params": { 
        "x": number, "y": number, // for click/move
        "text": string, // for type
        "amount": number // for scroll
      }
    }
    
    Visual Grounding:
    - The screenshot resolution is scaled.
    - Estimate coordinates (x, y) relative to the image size.
    
    Goal: ${goal}
    `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o', // Or claude-3-5-sonnet if available in this wrapper
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Where should I click or what should I type next?' },
                            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
                        ]
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 300
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (e) {
            console.error('VLM Error:', e.message);
            return null;
        }
    }

    async executeAction(plan) {
        const { action, params } = plan;
        switch (action) {
            case 'move':
                await inputController.move(params.x, params.y);
                break;
            case 'click':
                await inputController.click(params.x, params.y);
                break;
            case 'type':
                await inputController.type(params.text);
                break;
            case 'scroll':
                await inputController.scroll(params.amount);
                break;
            case 'done':
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
    }
}

export const ghostAgent = new GhostAgent();
export default ghostAgent;
