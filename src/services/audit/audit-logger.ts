// Copyright (c) 2026 Ultra-Dex
/**
 * Audit Logging Service
 * Comprehensive audit trail for enterprise compliance
 *
 * @module services/audit/audit-logger
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager, MemoryManager } from '../../core/memory/manager.js';

const memoryManager: MemoryManager = ppmManager;

/**
 * Audit event types
 */
export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.management'
  | 'team.created'
  | 'team.updated'
  | 'team.deleted'
  | 'team.member.invited'
  | 'team.member.removed'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.shared'
  | 'ai.request'
  | 'ai.response'
  | 'tool.executed'
  | 'code.modified'
  | 'deployment.created'
  | 'organization.management'
  | 'organization.created'
  | 'security.alert'
  | 'security.event'
  | 'permission.changed'
  | 'role.assigned'
  | 'role.revoked'
  | 'api.access'
  | 'config.changed';

/**
 * Audit event severity
 */
export type AuditSeverity = 'info' | 'low' | 'warning' | 'medium' | 'high' | 'error' | 'critical';

/**
 * Audit event interface
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  teamId?: string;
  projectId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
}

/**
 * Audit filter options
 */
export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  types?: AuditEventType[];
  severities?: AuditSeverity[];
  userId?: string;
  teamId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit statistics
 */
export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  uniqueUsers: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Audit Logger class
 */
export class AuditLogger {
  private initialized: boolean = false;
  private version: string = '6.0.0';

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();

    // Write to stderr for initialization notice (avoid structured logging during bootstrap)
    process.stderr.write('[AUDIT] ✓ Audit logging system initialized\n');
    this.initialized = true;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'metadata'>): Promise<AuditEvent> {
    await this.initialize();

    const auditEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      ...event,
      metadata: {
        source: 'ultra-dex-core',
        version: this.version,
        environment: process.env.NODE_ENV || 'development',
      },
    };

    // Store in persistent memory
    await ppmManager.add({
      content: `Audit: ${event.action} on ${event.resource}`,
      type: `audit:${event.type}`,
      importance: this.getImportanceForSeverity(event.severity),
      metadata: {
        auditEvent: auditEvent,
        userId: event.userId,
        teamId: event.teamId,
        projectId: event.projectId,
      },
    });

    // Log to stderr for critical events (avoid self-reference)
    if (event.severity === 'critical' || event.severity === 'error') {
      process.stderr.write(`[AUDIT ${event.severity.toUpperCase()}] ${event.action}: ${event.resource}\n`);
    }

    return auditEvent;
  }

  /**
   * Get importance level based on severity
   */
  private getImportanceForSeverity(severity: AuditSeverity): number {
    switch (severity) {
      case 'critical':
        return 10;
      case 'error':
        return 8;
      case 'warning':
        return 5;
      case 'info':
        return 3;
      default:
        return 3;
    }
  }

  /**
   * Log user login event
   */
  async logUserLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    failureReason?: string
  ): Promise<AuditEvent> {
    return this.log({
      type: 'user.login',
      severity: success ? 'info' : 'warning',
      userId,
      ipAddress,
      userAgent,
      action: success ? 'USER_LOGIN_SUCCESS' : 'USER_LOGIN_FAILURE',
      resource: 'authentication',
      resourceId: userId,
      details: {
        success,
        failureReason,
        method: 'password', // or 'sso', 'mfa', etc.
      },
    });
  }

  /**
   * Log AI request/response
   */
  async logAIInteraction(
    userId: string,
    projectId: string,
    agentId: string,
    requestType: string,
    tokensUsed: number,
    success: boolean,
    duration: number
  ): Promise<AuditEvent> {
    return this.log({
      type: 'ai.request',
      severity: success ? 'info' : 'error',
      userId,
      projectId,
      action: 'AI_REQUEST',
      resource: 'ai-agent',
      resourceId: agentId,
      details: {
        requestType,
        tokensUsed,
        success,
        duration,
        model: process.env.ULTRA_DEX_MODEL || 'default',
      },
    });
  }

  /**
   * Log code modification
   */
  async logCodeChange(
    userId: string,
    projectId: string,
    filePath: string,
    changeType: 'create' | 'modify' | 'delete',
    linesChanged: number,
    agentId?: string
  ): Promise<AuditEvent> {
    return this.log({
      type: 'code.modified',
      severity: 'info',
      userId,
      projectId,
      action: `CODE_${changeType.toUpperCase()}`,
      resource: 'source-code',
      resourceId: filePath,
      details: {
        filePath,
        changeType,
        linesChanged,
        agentId,
        language: this.detectLanguage(filePath),
      },
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    resourceType: string,
    resourceId: string,
    oldPermissions: string[],
    newPermissions: string[],
    changedBy: string
  ): Promise<AuditEvent> {
    return this.log({
      type: 'permission.changed',
      severity: 'warning',
      userId: changedBy,
      action: 'PERMISSION_CHANGE',
      resource: resourceType,
      resourceId: resourceId,
      details: {
        targetUserId,
        oldPermissions,
        newPermissions,
        resourceType,
        resourceId,
      },
    });
  }

  /**
   * Log security alert
   */
  async logSecurityAlert(
    alertType: string,
    severity: AuditSeverity,
    details: Record<string, any>,
    userId?: string
  ): Promise<AuditEvent> {
    return this.log({
      type: 'security.alert',
      severity,
      userId,
      action: `SECURITY_${alertType.toUpperCase()}`,
      resource: 'security',
      resourceId: alertType,
      details,
    });
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    await this.initialize();

    // Search for audit events in memory
    let searchQuery = 'audit:';
    if (filter.types && filter.types.length > 0) {
      searchQuery += filter.types[0]; // Search for first type
    }

    const results = await ppmManager.search(searchQuery);
    let events: AuditEvent[] = [];

    for (const result of results || []) {
      const metadata = result.metadata as { auditEvent?: AuditEvent };
      if (metadata?.auditEvent) {
        const event = metadata.auditEvent;

        // Apply filters
        if (this.matchesFilter(event, filter)) {
          events.push(event);
        }
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    events = events.slice(offset, offset + limit);

    return events;
  }

  /**
   * Check if event matches filter
   */
  private matchesFilter(event: AuditEvent, filter: AuditFilter): boolean {
    if (filter.startDate && event.timestamp < filter.startDate) return false;
    if (filter.endDate && event.timestamp > filter.endDate) return false;
    if (filter.types && !filter.types.includes(event.type)) return false;
    if (filter.severities && !filter.severities.includes(event.severity)) return false;
    if (filter.userId && event.userId !== filter.userId) return false;
    if (filter.teamId && event.teamId !== filter.teamId) return false;
    if (filter.projectId && event.projectId !== filter.projectId) return false;

    return true;
  }

  /**
   * Get audit statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<AuditStats> {
    await this.initialize();

    const events = await this.query({ startDate, endDate, limit: 10000 });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      if (event.userId) uniqueUsers.add(event.userId);
    }

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      uniqueUsers: uniqueUsers.size,
      timeRange: { start: startDate, end: endDate },
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<string> {
    await this.initialize();

    const events = await this.query({ startDate, endDate, limit: 10000 });
    const stats = await this.getStats(startDate, endDate);

    const report = {
      generatedAt: new Date().toISOString(),
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: stats,
      events: events.map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        type: e.type,
        severity: e.severity,
        userId: e.userId,
        action: e.action,
        resource: e.resource,
      })),
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      // Simple CSV conversion
      const headers = 'id,timestamp,type,severity,userId,action,resource\n';
      const rows = events
        .map(
          (e) =>
            `${e.id},${e.timestamp.toISOString()},${e.type},${e.severity},${e.userId || ''},${e.action},${e.resource}`
        )
        .join('\n');
      return headers + rows;
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languages: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
    };
    return languages[ext || ''] || 'unknown';
  }

  /**
   * Purge old audit logs
   */
  async purgeOldLogs(olderThan: Date): Promise<number> {
    await this.initialize();

    // In a real implementation, this would delete old records
    // For now, we just log the action
    process.stderr.write(`[AUDIT] ✓ Purge request for logs older than ${olderThan.toISOString()}\n`);

    return 0;
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
export default auditLogger;
