/**
 * @fileoverview Analytics Posthog module
 * @module features/analytics-posthog
 */

// PostHog Analytics Template (GDPR mode)

import posthog from 'posthog-js';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function initAnalytics() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    persistence: 'localStorage',
    disable_session_recording: true,
    advanced_disable_decide: false,
    opt_out_capturing_by_default: true,
  });
}

export function useAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return {
    capture: (event: string, properties?: Record<string, unknown>) => {
      posthog.capture(event, properties);
    },
    identify: (userId: string, traits?: Record<string, unknown>) => {
      posthog.identify(userId, traits);
    },
    consent: () => {
      posthog.opt_in_capturing();
    },
    revoke: () => {
      posthog.opt_out_capturing();
    },
  };
}

export function trackWebVitals(metric: { id: string; name: string; value: number }) {
  posthog.capture('web_vitals', {
    metric: metric.name,
    value: metric.value,
    id: metric.id,
  });
}

/**
 * Error handler for analytics-posthog
 * @param {Error} error - Error to handle
 */
function handleAnalyticsposthogError(error) {
  try {
    console.error('[analytics-posthog]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
