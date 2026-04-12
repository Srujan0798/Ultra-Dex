/**
 * Analytics index shim
 * Provides a stub recordError export for modules that import it.
 */

export function recordError(error, context = {}) {
  // Stub — logs to console until enterprise analytics is wired up
  if (process.env.NODE_ENV !== 'test') {
    logger.error('[analytics:error]', error?.message || error, context);
  }
}

export function trackEvent(name, data = {}) {
  // Stub for future analytics
}

export async function loadEnterpriseAnalytics() {
  const mod = await import('./enterprise-analytics.js');
  return mod.default;
}

export async function getEnterpriseAnalyticsInstance() {
  const mod = await import('./enterprise-analytics.js');
  return mod.enterpriseAnalytics;
}
