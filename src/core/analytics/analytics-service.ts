export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  
  track(event: string, properties: Record<string, unknown> = {}, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId,
      properties,
      timestamp: new Date()
    };
    
    this.events.push(analyticsEvent);
    
    // Log to console (replace with PostHog/Segment in production)
    console.log('[Analytics]', analyticsEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }
  
  getEvents(filter?: { event?: string; userId?: string }): AnalyticsEvent[] {
    let filtered = this.events;
    
    if (filter?.event) {
      filtered = filtered.filter(e => e.event === filter.event);
    }
    
    if (filter?.userId) {
      filtered = filtered.filter(e => e.userId === filter.userId);
    }
    
    return filtered;
  }
  
  getDashboardStats(): {
    totalEvents: number;
    uniqueUsers: number;
    topEvents: Array<{ event: string; count: number }>;
  } {
    const uniqueUsers = new Set(this.events.filter(e => e.userId).map(e => e.userId)).size;
    
    const eventCounts = this.events.reduce((acc, e) => {
      acc[e.event] = (acc[e.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));
    
    return {
      totalEvents: this.events.length,
      uniqueUsers,
      topEvents
    };
  }
}

export const analytics = new AnalyticsService();
