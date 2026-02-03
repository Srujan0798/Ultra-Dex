// Ultra-Dex Kernel — Session Manager
// Manages conversational history and short-term memory for the Agent

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
    constructor() {
        this.sessionId = uuidv4();
        this.history = [];
        this.projectRoot = process.cwd();
        this.sessionDir = path.join(this.projectRoot, '.ultra-dex', 'sessions');
    }

    async initialize() {
        await fs.mkdir(this.sessionDir, { recursive: true });
    }

    /**
     * Add a user message to history
     */
    addUserMessage(content) {
        this.history.push({ role: 'user', content, timestamp: Date.now() });
        this.save();
    }

    /**
     * Add an agent response to history
     */
    addAgentMessage(content) {
        this.history.push({ role: 'assistant', content, timestamp: Date.now() });
        this.save();
    }

    /**
     * Get the recent conversation context for the LLM
     * @param {number} limit - Number of recent turns to return
     */
    getContext(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * Persist session to disk
     */
    async save() {
        const filePath = path.join(this.sessionDir, `${this.sessionId}.json`);
        try {
            await fs.writeFile(filePath, JSON.stringify(this.history, null, 2));
        } catch (e) {
            // Silently fail if we can't save history (non-critical)
        }
    }

    /**
     * Clear current session history
     */
    clear() {
        this.history = [];
    }
}

export const session = new SessionManager();
session.initialize();
