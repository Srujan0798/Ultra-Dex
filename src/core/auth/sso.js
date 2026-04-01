// Copyright (c) 2026 Ultra-Dex
// SSO - Single Sign-On integration

import { EventEmitter } from 'events';

export class SSO extends EventEmitter {
    constructor(options = {}) {
        super();
        this.providers = new Map();
        this.sessions = new Map();
        this.config = options;
    }

    registerProvider(name, provider) {
        this.providers.set(name, provider);
        this.emit('provider.registered', { name, provider: provider.name });
    }

    async authenticate(provider, credentials) {
        const ssoProvider = this.providers.get(provider);
        if (!ssoProvider) {
            throw new Error(`SSO provider not found: ${provider}`);
        }

        try {
            const user = await ssoProvider.authenticate(credentials);
            const sessionId = this.createSession(user, provider);
            
            this.emit('authentication.success', { 
                user: user.id, 
                provider, 
                sessionId 
            });
            
            return { user, sessionId };
        } catch (error) {
            this.emit('authentication.failed', { 
                provider, 
                error: error.message 
            });
            throw error;
        }
    }

    createSession(user, provider) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId: user.id,
            provider,
            created: new Date(),
            lastAccessed: new Date(),
            user
        };

        this.sessions.set(sessionId, session);
        return sessionId;
    }

    async validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        session.lastAccessed = new Date();
        return session;
    }

    async logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            this.emit('logout', { 
                user: session.userId, 
                provider: session.provider,
                sessionId 
            });
        }
    }

    generateSessionId() {
        return `sso_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }

    middleware() {
        return async (req, res, next) => {
            const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
            
            if (!sessionId) {
                return res.status(401).json({ error: 'Session ID required' });
            }

            const session = await this.validateSession(sessionId);
            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            req.user = session.user;
            req.session = session;
            next();
        };
    }

    getStats() {
        return {
            providers: this.providers.size,
            activeSessions: this.sessions.size,
            providerNames: Array.from(this.providers.keys())
        };
    }
}

export default SSO;
