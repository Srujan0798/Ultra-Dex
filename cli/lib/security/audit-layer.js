/**
 * Decentralized Audit Layer Optimization
 * Performance-optimized cryptographic signing with async mode
 */

import crypto from 'crypto';

export class AuditLayer {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.asyncMode = options.asyncMode || false; // Non-blocking signing
        this.performanceMode = options.performanceMode || false; // Skip non-critical audits
        this.queue = [];
        this.signedCache = new Map();
    }

    /**
     * Sign an action (sync mode)
     */
    signAction(action) {
        if (!this.enabled) return { ...action, signed: false };

        const payload = JSON.stringify({
            type: action.type,
            data: action.data,
            timestamp: Date.now()
        });

        const signature = crypto
            .createHmac('sha256', this.getSecretKey())
            .update(payload)
            .digest('hex');

        return {
            ...action,
            signed: true,
            signature,
            signedAt: new Date().toISOString()
        };
    }

    /**
     * Sign action asynchronously (non-blocking)
     */
    async signActionAsync(action) {
        if (!this.enabled) return { ...action, signed: false };

        // Queue for batch processing
        return new Promise((resolve) => {
            setImmediate(() => {
                const signed = this.signAction(action);
                resolve(signed);
            });
        });
    }

    /**
     * Batch sign multiple actions
     */
    batchSign(actions) {
        return actions.map(action => this.signAction(action));
    }

    /**
     * Verify action signature
     */
    verifyAction(signedAction) {
        if (!signedAction.signature) return false;

        const payload = JSON.stringify({
            type: signedAction.type,
            data: signedAction.data,
            timestamp: new Date(signedAction.signedAt).getTime()
        });

        const expectedSignature = crypto
            .createHmac('sha256', this.getSecretKey())
            .update(payload)
            .digest('hex');

        return signedAction.signature === expectedSignature;
    }

    /**
     * Get or generate secret key
     */
    getSecretKey() {
        if (!this._secretKey) {
            // In production, this should come from secure key storage
            this._secretKey = process.env.AUDIT_SECRET_KEY ||
                crypto.randomBytes(32).toString('hex');
        }
        return this._secretKey;
    }

    /**
     * Determine if action requires audit
     */
    requiresAudit(action) {
        if (this.performanceMode) {
            // Skip non-critical actions in performance mode
            const criticalTypes = ['execute', 'deploy', 'delete', 'write'];
            return criticalTypes.includes(action.type);
        }
        return true;
    }

    /**
     * Smart audit - only when needed
     */
    smartAudit(action) {
        if (!this.requiresAudit(action)) {
            return { ...action, audited: false, reason: 'performance-mode' };
        }

        if (this.asyncMode) {
            return this.signActionAsync(action);
        }

        return this.signAction(action);
    }

    /**
     * Create audit log entry
     */
    createLogEntry(action, result) {
        return {
            id: crypto.randomUUID(),
            action: action.type,
            user: action.userId || 'system',
            timestamp: new Date().toISOString(),
            result: result.success ? 'success' : 'failure',
            signature: action.signature,
            metadata: {
                duration: result.duration,
                tokensUsed: result.tokensUsed
            }
        };
    }

    /**
     * Get audit statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            asyncMode: this.asyncMode,
            performanceMode: this.performanceMode,
            queueSize: this.queue.length,
            cacheSize: this.signedCache.size
        };
    }

    /**
     * Toggle audit modes
     */
    setMode(mode) {
        switch (mode) {
            case 'full':
                this.enabled = true;
                this.asyncMode = false;
                this.performanceMode = false;
                break;
            case 'async':
                this.enabled = true;
                this.asyncMode = true;
                this.performanceMode = false;
                break;
            case 'performance':
                this.enabled = true;
                this.asyncMode = true;
                this.performanceMode = true;
                break;
            case 'off':
                this.enabled = false;
                break;
        }

        return this.getStats();
    }
}

export const auditLayer = new AuditLayer();

export default AuditLayer;
