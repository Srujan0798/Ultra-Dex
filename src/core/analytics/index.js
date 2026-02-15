/**
 * Analytics index shim
 * Provides a stub recordError export for modules that import it.
 */

export function recordError(error, context = {}) {
    // Stub — logs to console until enterprise analytics is wired up
    if (process.env.NODE_ENV !== 'test') {
        console.error('[analytics:error]', error?.message || error, context);
    }
}

export function trackEvent(name, data = {}) {
    // Stub for future analytics
}

export { default as EnterpriseAnalytics } from './enterprise-analytics.js';
