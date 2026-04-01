// Copyright (c) 2026 Ultra-Dex
// Context Manager - Manages conversation and task context

export class ContextManager {
    constructor(options = {}) {
        this.maxContextSize = options.maxContextSize || 32000;
        this.contexts = new Map();
        this.compressionThreshold = options.compressionThreshold || 0.8;
    }

    async createContext(sessionId, initialData = {}) {
        const context = {
            id: sessionId,
            messages: [],
            variables: new Map(),
            metadata: initialData,
            created: new Date(),
            lastAccessed: new Date(),
            tokenCount: 0
        };
        
        this.contexts.set(sessionId, context);
        return context;
    }

    async addMessage(sessionId, message) {
        const context = this.contexts.get(sessionId);
        if (!context) {
            throw new Error(`Context not found: ${sessionId}`);
        }

        context.messages.push({
            ...message,
            timestamp: new Date(),
            id: this.generateMessageId()
        });

        context.lastAccessed = new Date();
        context.tokenCount += this.estimateTokens(message.content || '');

        // Check if compression is needed
        if (context.tokenCount > this.maxContextSize * this.compressionThreshold) {
            await this.compressContext(sessionId);
        }

        return context;
    }

    async getContext(sessionId) {
        const context = this.contexts.get(sessionId);
        if (context) {
            context.lastAccessed = new Date();
        }
        return context;
    }

    async compressContext(sessionId) {
        const context = this.contexts.get(sessionId);
        if (!context) return;

        // Simple compression: keep recent messages, summarize older ones
        const recentMessages = context.messages.slice(-10);
        const olderMessages = context.messages.slice(0, -10);
        
        if (olderMessages.length > 0) {
            const summary = {
                role: 'system',
                content: `[Compressed ${olderMessages.length} previous messages from this conversation]`,
                timestamp: new Date(),
                id: this.generateMessageId(),
                compressed: true
            };
            
            context.messages = [summary, ...recentMessages];
            context.tokenCount = this.estimateTokens(summary.content) + 
                               recentMessages.reduce((sum, msg) => sum + this.estimateTokens(msg.content || ''), 0);
        }
    }

    async setVariable(sessionId, key, value) {
        const context = this.contexts.get(sessionId);
        if (!context) {
            throw new Error(`Context not found: ${sessionId}`);
        }
        
        context.variables.set(key, value);
        context.lastAccessed = new Date();
        return context;
    }

    async getVariable(sessionId, key) {
        const context = this.contexts.get(sessionId);
        if (!context) return undefined;
        
        context.lastAccessed = new Date();
        return context.variables.get(key);
    }

    estimateTokens(text) {
        // Rough estimation: ~4 chars per token
        return Math.ceil(text.length / 4);
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const cutoff = new Date(Date.now() - maxAge);
        const toDelete = [];
        
        for (const [sessionId, context] of this.contexts) {
            if (context.lastAccessed < cutoff) {
                toDelete.push(sessionId);
            }
        }
        
        for (const sessionId of toDelete) {
            this.contexts.delete(sessionId);
        }
        
        return toDelete.length;
    }

    getStats() {
        return {
            totalContexts: this.contexts.size,
            totalTokens: Array.from(this.contexts.values()).reduce((sum, ctx) => sum + ctx.tokenCount, 0),
            averageContextSize: this.contexts.size > 0 ? 
                Array.from(this.contexts.values()).reduce((sum, ctx) => sum + ctx.tokenCount, 0) / this.contexts.size : 0
        };
    }
}

export default ContextManager;
