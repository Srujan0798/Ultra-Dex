export interface AnalyticsEvent {
  name: string;
  category?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

function safeLog(scope: string, payload: unknown): void {
  try {
    console.info(`[analytics:${scope}]`, payload);
  } catch {
    // no-op
  }
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', event.name, {
      event_category: event.category,
      value: event.value,
      ...event.metadata,
    });
    return;
  }

  safeLog('event', event);
}

export function trackPageView(path: string): void {
  trackEvent({
    name: 'page_view',
    category: 'navigation',
    metadata: { path },
  });
}

export function captureError(error: unknown, context: string): void {
  safeLog('error', { context, error: error instanceof Error ? error.message : String(error) });
}
