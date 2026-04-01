// Copyright (c) 2026 Ultra-Dex
// Enterprise Gateway - API gateway for enterprise features

import { EventEmitter } from 'events';

export class EnterpriseGateway extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = {
            rateLimit: options.rateLimit || 1000,
            authentication: options.authentication || true,
            logging: options.logging || true,
            monitoring: options.monitoring || true,
            ...options
        };
        
        this.routes = new Map();
        this.middleware = [];
        this.rateLimiter = new Map();
    }

    route(path, handler, options = {}) {
        this.routes.set(path, {
            handler,
            options: {
                method: 'POST',
                auth: true,
                rateLimit: true,
                ...options
            }
        });
        return this;
    }

    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }

    async handle(request) {
        const { path, method = 'POST', user, headers = {} } = request;
        
        try {
            // Apply middleware
            for (const middleware of this.middleware) {
                const result = await middleware(request);
                if (result === false) {
                    throw new Error('Request blocked by middleware');
                }
            }

            // Find route
            const route = this.routes.get(path);
            if (!route) {
                throw new Error(`Route not found: ${path}`);
            }

            // Check method
            if (route.options.method !== method) {
                throw new Error(`Method not allowed: ${method}`);
            }

            // Check authentication
            if (route.options.auth && !user) {
                throw new Error('Authentication required');
            }

            // Check rate limit
            if (route.options.rateLimit) {
                const isAllowed = this.checkRateLimit(user?.id || 'anonymous', path);
                if (!isAllowed) {
                    throw new Error('Rate limit exceeded');
                }
            }

            // Execute handler
            const response = await route.handler(request);
            
            this.emit('request.success', {
                path,
                user: user?.id,
                response,
                timestamp: new Date()
            });

            return {
                success: true,
                data: response,
                timestamp: new Date()
            };

        } catch (error) {
            this.emit('request.error', {
                path,
                user: user?.id,
                error: error.message,
                timestamp: new Date()
            });

            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    checkRateLimit(userId, path) {
        const key = `${userId}:${path}`;
        const now = Date.now();
        const window = 60 * 1000; // 1 minute window
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, {
                count: 1,
                resetTime: now + window
            });
            return true;
        }

        const limit = this.rateLimiter.get(key);
        
        if (now > limit.resetTime) {
            // Reset window
            limit.count = 1;
            limit.resetTime = now + window;
            return true;
        }

        if (limit.count >= this.config.rateLimit) {
            return false;
        }

        limit.count++;
        return true;
    }

    getStats() {
        return {
            routes: this.routes.size,
            middleware: this.middleware.length,
            rateLimitEntries: this.rateLimiter.size,
            config: this.config
        };
    }
}

export default EnterpriseGateway;
