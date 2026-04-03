/**
 * @class UserBehaviorTracker
 * Tracks and analyzes user behavior patterns
 */

export class UserBehaviorTracker {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.behaviors = new Map();
    this.sessions = new Map();
    this.patterns = new Map();
  }

  async initialize() {
    this.logger.info('User Behavior Tracker initialized');
  }

  async trackEvent(userId, eventType, eventData) {
    const event = {
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(userId),
    };

    if (!this.behaviors.has(userId)) {
      this.behaviors.set(userId, []);
    }

    this.behaviors.get(userId).push(event);

    // Update patterns
    await this.updatePatterns(userId, event);

    this.logger.debug(`Tracked event: ${eventType} for user ${userId}`);
  }

  async startSession(userId, metadata = {}) {
    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      metadata,
      events: [],
      active: true,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      session.active = false;
      session.duration = new Date(session.endTime) - new Date(session.startTime);
    }
  }

  getSessionId(userId) {
    // Find active session for user
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && session.active) {
        return sessionId;
      }
    }

    // Create new session if none active
    return this.startSession(userId);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async updatePatterns(userId, event) {
    const userPatterns = this.patterns.get(userId) || {
      eventFrequency: {},
      sessionPatterns: [],
      preferences: {},
      anomalies: [],
    };

    // Update event frequency
    userPatterns.eventFrequency[event.eventType] =
      (userPatterns.eventFrequency[event.eventType] || 0) + 1;

    // Detect patterns
    await this.detectUsagePatterns(userId, userPatterns);

    this.patterns.set(userId, userPatterns);
  }

  async detectUsagePatterns(userId, userPatterns) {
    const events = this.behaviors.get(userId) || [];
    if (events.length < 5) return;

    // Time-based patterns
    const hourlyUsage = this.analyzeHourlyUsage(events);
    const dailyUsage = this.analyzeDailyUsage(events);

    userPatterns.usagePatterns = {
      hourly: hourlyUsage,
      daily: dailyUsage,
      peakHours: this.findPeakHours(hourlyUsage),
      preferredDays: this.findPreferredDays(dailyUsage),
    };

    // Feature usage patterns
    const featureUsage = this.analyzeFeatureUsage(events);
    userPatterns.featurePreferences = featureUsage;

    // Session patterns
    const sessionData = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.endTime
    );

    if (sessionData.length > 0) {
      userPatterns.sessionPatterns = {
        averageDuration: this.calculateAverageSessionDuration(sessionData),
        sessionFrequency: this.calculateSessionFrequency(sessionData),
        bounceRate: this.calculateBounceRate(sessionData),
      };
    }
  }

  analyzeHourlyUsage(events) {
    const hourly = new Array(24).fill(0);

    events.forEach((event) => {
      const hour = new Date(event.timestamp).getHours();
      hourly[hour]++;
    });

    return hourly;
  }

  analyzeDailyUsage(events) {
    const daily = new Array(7).fill(0); // Sunday = 0

    events.forEach((event) => {
      const day = new Date(event.timestamp).getDay();
      daily[day]++;
    });

    return daily;
  }

  findPeakHours(hourlyUsage) {
    const maxUsage = Math.max(...hourlyUsage);
    return hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .filter((item) => item.usage > maxUsage * 0.7)
      .sort((a, b) => b.usage - a.usage);
  }

  findPreferredDays(dailyUsage) {
    const maxUsage = Math.max(...dailyUsage);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return dailyUsage
      .map((usage, day) => ({ day: dayNames[day], usage }))
      .filter((item) => item.usage > maxUsage * 0.7)
      .sort((a, b) => b.usage - a.usage);
  }

  analyzeFeatureUsage(events) {
    const featureCount = {};

    events.forEach((event) => {
      const feature = event.eventData.feature || event.eventType;
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });

    const total = events.length;
    const preferences = {};

    Object.entries(featureCount).forEach(([feature, count]) => {
      preferences[feature] = {
        usage: count,
        percentage: (count / total) * 100,
        preference: count > total * 0.2 ? 'high' : count > total * 0.1 ? 'medium' : 'low',
      };
    });

    return preferences;
  }

  calculateAverageSessionDuration(sessions) {
    const durations = sessions.map((s) => s.duration);
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  calculateSessionFrequency(sessions) {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const intervals = [];
    for (let i = 1; i < sortedSessions.length; i++) {
      const interval =
        new Date(sortedSessions[i].startTime) -
        new Date(sortedSessions[i - 1].endTime || sortedSessions[i - 1].startTime);
      intervals.push(interval);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length / (1000 * 60 * 60 * 24); // days
  }

  calculateBounceRate(sessions) {
    const bouncedSessions = sessions.filter(
      (s) => s.events.length === 1 || (s.duration && s.duration < 30000) // Less than 30 seconds
    );

    return (bouncedSessions.length / sessions.length) * 100;
  }

  async getUserProfile(userId) {
    const patterns = this.patterns.get(userId);
    const behaviors = this.behaviors.get(userId) || [];
    const sessions = Array.from(this.sessions.values()).filter((s) => s.userId === userId);

    if (!patterns) {
      return {
        userId,
        status: 'insufficient_data',
        message: 'Not enough data to generate user profile',
      };
    }

    return {
      userId,
      totalEvents: behaviors.length,
      totalSessions: sessions.length,
      patterns,
      lastActivity: behaviors.length > 0 ? behaviors[behaviors.length - 1].timestamp : null,
      insights: this.generateUserInsights(patterns),
    };
  }

  generateUserInsights(patterns) {
    const insights = [];

    if (patterns.usagePatterns) {
      const { peakHours, preferredDays } = patterns.usagePatterns;

      if (peakHours.length > 0) {
        insights.push({
          type: 'usage_pattern',
          title: 'Peak Usage Hours',
          description: `Most active during hours: ${peakHours.map((h) => `${h.hour}:00`).join(', ')}`,
          recommendation: 'Schedule maintenance during off-peak hours',
        });
      }

      if (preferredDays.length > 0) {
        insights.push({
          type: 'usage_pattern',
          title: 'Preferred Days',
          description: `Most active on: ${preferredDays.map((d) => d.day).join(', ')}`,
          recommendation: 'Focus marketing efforts on preferred days',
        });
      }
    }

    if (patterns.sessionPatterns) {
      const { averageDuration, sessionFrequency, bounceRate } = patterns.sessionPatterns;

      if (bounceRate > 50) {
        insights.push({
          type: 'engagement',
          title: 'High Bounce Rate',
          description: `Bounce rate of ${bounceRate.toFixed(1)}% indicates engagement issues`,
          recommendation: 'Improve onboarding and initial user experience',
        });
      }

      if (sessionFrequency > 7) {
        // Daily usage
        insights.push({
          type: 'engagement',
          title: 'High Engagement',
          description: 'User engages with the system daily',
          recommendation: 'Consider premium features or advanced capabilities',
        });
      }
    }

    if (patterns.featurePreferences) {
      const highPreferenceFeatures = Object.entries(patterns.featurePreferences)
        .filter(([, data]) => data.preference === 'high')
        .map(([feature]) => feature);

      if (highPreferenceFeatures.length > 0) {
        insights.push({
          type: 'feature_usage',
          title: 'Popular Features',
          description: `Frequently used features: ${highPreferenceFeatures.join(', ')}`,
          recommendation: 'Focus development efforts on these features',
        });
      }
    }

    return insights;
  }

  async getAggregatedInsights() {
    const allPatterns = Array.from(this.patterns.values());
    if (allPatterns.length === 0) return [];

    const insights = [];

    // Aggregate usage patterns across all users
    const peakHourCounts = {};
    const dayPreferenceCounts = {};

    allPatterns.forEach((pattern) => {
      if (pattern.usagePatterns) {
        pattern.usagePatterns.peakHours?.forEach((hour) => {
          peakHourCounts[hour.hour] = (peakHourCounts[hour.hour] || 0) + 1;
        });

        pattern.usagePatterns.preferredDays?.forEach((day) => {
          dayPreferenceCounts[day.day] = (dayPreferenceCounts[day.day] || 0) + 1;
        });
      }
    });

    const mostPopularHour = Object.entries(peakHourCounts).sort(([, a], [, b]) => b - a)[0];

    if (mostPopularHour) {
      insights.push({
        type: 'aggregate',
        title: 'System Peak Hour',
        description: `Most users are active around ${mostPopularHour[0]}:00`,
        recommendation: 'Schedule system maintenance during less popular hours',
      });
    }

    const mostPopularDay = Object.entries(dayPreferenceCounts).sort(([, a], [, b]) => b - a)[0];

    if (mostPopularDay) {
      insights.push({
        type: 'aggregate',
        title: 'Most Popular Day',
        description: `Users prefer ${mostPopularDay[0]} for system usage`,
        recommendation: 'Schedule important updates on less popular days',
      });
    }

    return insights;
  }

  async shutdown() {
    this.behaviors.clear();
    this.sessions.clear();
    this.patterns.clear();
    this.logger.info('User Behavior Tracker shut down');
  }
}
