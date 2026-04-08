// Copyright (c) 2026 Ultra-Dex
/**
 * Session Management Service
 * Handles user sessions, monitoring, and security tracking
 *
 * @module services/auth/session-service
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import errorHandler from '../../../apps/cli/lib/utils/error-handler.js';

export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  status: 'active' | 'expired' | 'terminated';
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  terminatedAt?: Date;
  terminationReason?: string;
}

export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  sessionId: string;
  userId: string;
  type: 'suspicious_login' | 'unusual_activity' | 'multiple_failed_attempts' | 'session_hijacking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  detectedAt: Date;
  resolved: boolean;
}

/**
 * Session Management Service
 */
export class SessionService {
  private initialized: boolean = false;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours
  private activityLogRetention: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    // Start cleanup task
    this.startCleanupTask();

    process.stdout.write('✓ Session service initialized\n');
    this.initialized = true;
  }

  /**
   * Create new session
   */
  async createSession(
    userId: string,
    organizationId: string,
    ipAddress: string,
    userAgent: string,
    deviceInfo?: Session['deviceInfo'],
    location?: Session['location']
  ): Promise<Session> {
    await this.initialize();

    const session: Session = {
      id: uuidv4(),
      userId,
      organizationId,
      ipAddress,
      userAgent,
      deviceInfo,
      location,
      status: 'active',
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionTimeout),
    };

    await ppmManager.add({
      content: `Session created: ${session.id}`,
      type: 'session-created',
      importance: 5,
      metadata: session,
    });

    // Check for suspicious activity
    await this.checkForSuspiciousActivity(session);

    await this.logActivity(session.id, userId, 'session_created', 'authentication', {
      ipAddress,
      userAgent,
      deviceInfo,
      location,
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    await this.initialize();

    const results = await ppmManager.search(`session:${sessionId}`);
    if (results && results.length > 0) {
      return results[0].metadata as Session;
    }
    return null;
  }

  /**
   * Validate and update session activity
   */
  async validateSession(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    if (session.status !== 'active') return null;

    const now = new Date();

    // Check expiration
    if (now > session.expiresAt) {
      await this.terminateSession(sessionId, 'expired');
      return null;
    }

    // Update last activity
    session.lastActivityAt = now;
    await this.updateSession(session);

    // Check for IP/User-Agent changes (potential hijacking)
    if (ipAddress && ipAddress !== session.ipAddress) {
      await this.createSecurityAlert(session.id, session.userId, 'session_hijacking', 'high', {
        description: 'IP address changed during session',
        oldIp: session.ipAddress,
        newIp: ipAddress,
      });
    }

    if (userAgent && userAgent !== session.userAgent) {
      await this.createSecurityAlert(session.id, session.userId, 'unusual_activity', 'medium', {
        description: 'User agent changed during session',
        oldUserAgent: session.userAgent,
        newUserAgent: userAgent,
      });
    }

    return session;
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<Session[]> {
    await this.initialize();

    const results = await ppmManager.search(`user-sessions:${userId}`);
    const sessions: Session[] = [];

    for (const result of results || []) {
      const session = result.metadata as Session;
      if (session.status === 'active' && new Date() < session.expiresAt) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string, reason: string = 'user_logout'): Promise<boolean> {
    await this.initialize();

    const session = await this.getSession(sessionId);
    if (!session) return false;

    session.status = 'terminated';
    session.terminatedAt = new Date();
    session.terminationReason = reason;

    await this.updateSession(session);

    await this.logActivity(sessionId, session.userId, 'session_terminated', 'authentication', {
      reason,
    });

    await auditLogger.log({
      type: 'security.event',
      severity: 'info',
      action: 'SESSION_TERMINATED',
      userId: session.userId,
      resource: 'sessions',
      resourceId: sessionId,
      details: {
        reason,
      },
    });

    return true;
  }

  /**
   * Terminate all user sessions
   */
  async terminateAllUserSessions(
    userId: string,
    reason: string = 'security_action'
  ): Promise<void> {
    await this.initialize();

    const sessions = await this.getUserActiveSessions(userId);

    for (const session of sessions) {
      await this.terminateSession(session.id, reason);
    }

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'ALL_SESSIONS_TERMINATED',
      userId,
      resource: 'sessions',
      details: {
        reason,
        sessionCount: sessions.length,
      },
    });
  }

  /**
   * Extend session
   */
  async extendSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session || session.status !== 'active') return false;

    session.expiresAt = new Date(Date.now() + this.sessionTimeout);
    session.lastActivityAt = new Date();

    await this.updateSession(session);
    return true;
  }

  /**
   * Log session activity
   */
  async logActivity(
    sessionId: string,
    userId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.initialize();

    const activity: SessionActivity = {
      id: uuidv4(),
      sessionId,
      userId,
      action,
      resource,
      ipAddress: '', // Would be set from request
      userAgent: '', // Would be set from request
      timestamp: new Date(),
      metadata,
    };

    await ppmManager.add({
      content: `Session activity: ${action}`,
      type: 'session-activity',
      importance: 3,
      metadata: activity,
    });
  }

  /**
   * Get session activity log
   */
  async getSessionActivity(sessionId: string, limit: number = 50): Promise<SessionActivity[]> {
    await this.initialize();

    const results = await ppmManager.search(`session-activity:${sessionId}`);
    const activities = results?.map((r) => r.metadata as SessionActivity) || [];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Get security alerts for user
   */
  async getSecurityAlerts(userId: string, resolved: boolean = false): Promise<SecurityAlert[]> {
    await this.initialize();

    const results = await ppmManager.search(`security-alerts:${userId}`);
    const alerts = results?.map((r) => r.metadata as SecurityAlert) || [];

    return alerts.filter((a) => a.resolved === resolved);
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(
    sessionId: string,
    userId: string,
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    details: Record<string, any>
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: uuidv4(),
      sessionId,
      userId,
      type,
      severity,
      description: details.description || type,
      details,
      detectedAt: new Date(),
      resolved: false,
    };

    await ppmManager.add({
      content: `Security alert: ${type}`,
      type: 'security-alert',
      importance: severity === 'critical' ? 10 : severity === 'high' ? 8 : 6,
      metadata: alert,
    });

    await auditLogger.log({
      type: 'security.alert',
      severity,
      action: 'SECURITY_ALERT',
      userId,
      resource: 'sessions',
      resourceId: sessionId,
      details: {
        alertType: type,
        ...details,
      },
    });
  }

  /**
   * Check for suspicious activity
   */
  private async checkForSuspiciousActivity(session: Session): Promise<void> {
    // Check for multiple concurrent sessions from different locations
    const userSessions = await this.getUserActiveSessions(session.userId);
    const locations = userSessions
      .filter((s) => s.location?.country)
      .map((s) => s.location!.country)
      .filter((v, i, a) => a.indexOf(v) === i);

    if (locations.length > 2) {
      await this.createSecurityAlert(session.id, session.userId, 'suspicious_login', 'medium', {
        description: 'Multiple active sessions from different countries',
        countries: locations,
        sessionCount: userSessions.length,
      });
    }

    // Check for unusual login times or rapid successive logins
    // Implementation would check login patterns
  }

  /**
   * Update session
   */
  private async updateSession(session: Session): Promise<void> {
    const results = await ppmManager.search(`session:${session.id}`);
    if (results && results.length > 0) {
      await ppmManager.update(results[0].id, {
        content: `Session updated: ${session.id}`,
        metadata: session,
      });
    }
  }

  /**
   * Start cleanup task for expired sessions and old activity logs
   */
  private startCleanupTask(): void {
    // Run cleanup every hour
    setInterval(
      async () => {
        try {
          await this.cleanupExpiredSessions();
          await this.cleanupOldActivityLogs();
        } catch (error) {
          console.error('Session cleanup error:', error);
        }
      },
      60 * 60 * 1000
    ); // 1 hour
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    // Find and terminate expired sessions
    const results = await ppmManager.search('session-created');
    const now = new Date();

    for (const result of results || []) {
      const session = result.metadata as Session;
      if (session.status === 'active' && now > session.expiresAt) {
        await this.terminateSession(session.id, 'expired');
      }
    }
  }

  /**
   * Cleanup old activity logs
   */
  private async cleanupOldActivityLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - this.activityLogRetention);
    // Implementation would remove old activity logs
    // For now, just log that cleanup ran
    process.stdout.write(`Session cleanup completed at ${new Date().toISOString()}\n`);
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
