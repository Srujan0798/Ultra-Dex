// Copyright (c) 2026 Ultra-Dex
/**
 * Audit Logging Engine
 * Comprehensive audit trail for enterprise compliance
 *
 * @module @ultra-dex/compliance/audit-logger
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import winston from 'winston';
import { z } from 'zod';

/**
 * Audit event types
 */
export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
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
  | 'security.alert'
  | 'permission.changed'
  | 'role.assigned'
  | 'role.revoked'
  | 'api.access'
  | 'config.changed'
  | 'data.access'
  | 'data.modified'
  | 'data.deleted'
  | 'consent.granted'
  | 'consent.revoked'
  | 'retention.executed';

/**
 * Audit event severity
 */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Data classification levels
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

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
  resourceId: string;
  details: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    environment: string;
    classification?: DataClassification;
    retentionPeriod?: number; // days
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
  resource?: string;
  resourceId?: string;
  classification?: DataClassification;
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
  eventsByClassification: Record<string, number>;
  uniqueUsers: number;
  uniqueResources: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  logLevel: AuditSeverity;
  retentionPeriod: number; // days
  maxEventsPerQuery: number;
  encryptionEnabled: boolean;
  storageBackend: 'memory' | 'file' | 'database';
  logFilePath?: string;
  databaseUrl?: string;
}

/**
 * Audit Logger class
 */
export class AuditLogger {
  private initialized: boolean = false;
  private version: string = '2.0.0';
  private config: AuditConfig;
  private winstonLogger: winston.Logger;
  private events: AuditEvent[] = [];

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      logLevel: 'info',
      retentionPeriod: 2555, // 7 years
      maxEventsPerQuery: 10000,
      encryptionEnabled: true,
      storageBackend: 'memory',
      ...config,
    };

    this.winstonLogger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    if (this.config.storageBackend === 'file' && this.config.logFilePath) {
      this.winstonLogger.add(
        new winston.transports.File({
          filename: this.config.logFilePath,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        })
      );
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize storage backend
    if (this.config.storageBackend === 'database' && this.config.databaseUrl) {
      // Initialize database connection (placeholder)
      this.winstonLogger.info('Audit logger initialized with database backend');
    } else {
      this.winstonLogger.info('Audit logger initialized with memory backend');
    }

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
        source: event.details?.source || 'ultra-dex-compliance',
        version: this.version,
        environment: process.env.NODE_ENV || 'development',
        classification: this.determineClassification(event),
        retentionPeriod: this.config.retentionPeriod,
        ...event.details?.metadata,
      },
    };

    // Encrypt sensitive data if enabled
    if (this.config.encryptionEnabled && auditEvent.metadata.classification === 'restricted') {
      auditEvent.details = await this.encryptSensitiveData(auditEvent.details);
    }

    // Store event
    await this.storeEvent(auditEvent);

    // Log to Winston
    this.winstonLogger.log(auditEvent.severity, 'AUDIT_EVENT', {
      eventId: auditEvent.id,
      type: auditEvent.type,
      action: auditEvent.action,
      userId: auditEvent.userId,
      resource: auditEvent.resource,
    });

    return auditEvent;
  }

  /**
   * Determine data classification based on event type and content
   */
  private determineClassification(
    event: Omit<AuditEvent, 'id' | 'timestamp' | 'metadata'>
  ): DataClassification {
    // Restricted: Health data, payment data, secrets
    if (
      event.resource.includes('health') ||
      event.resource.includes('payment') ||
      event.resource.includes('card') ||
      event.details?.containsPHI ||
      event.details?.containsPCI ||
      event.action.includes('SECRET') ||
      event.action.includes('KEY')
    ) {
      return 'restricted';
    }

    // Confidential: User data, customer data, IP
    if (
      event.type.includes('user') ||
      event.resource.includes('customer') ||
      event.resource.includes('personal') ||
      event.details?.personalData
    ) {
      return 'confidential';
    }

    // Internal: Business operations, configurations
    if (
      event.type.includes('config') ||
      event.type.includes('deployment') ||
      event.resource.includes('system')
    ) {
      return 'internal';
    }

    // Public: General operations
    return 'public';
  }

  /**
   * Encrypt sensitive data
   */
  private async encryptSensitiveData(data: Record<string, any>): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {};
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.AUDIT_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);

    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string' && v.length > 0) {
        const cipher = crypto.createCipher(algorithm, key);
        let encryptedValue = cipher.update(v, 'utf8', 'hex');
        encryptedValue += cipher.final('hex');
        encrypted[k] = `encrypted:${encryptedValue}:${iv.toString('hex')}`;
      } else {
        encrypted[k] = v;
      }
    }

    return encrypted;
  }

  /**
   * Store event based on backend
   */
  private async storeEvent(event: AuditEvent): Promise<void> {
    switch (this.config.storageBackend) {
      case 'memory':
        this.events.push(event);
        // Clean up old events
        this.events = this.events.filter(
          (e) => Date.now() - e.timestamp.getTime() < this.config.retentionPeriod * 24 * 3600000
        );
        break;
      case 'file':
        // Events are logged via Winston
        break;
      case 'database':
        // Store in database (placeholder)
        break;
    }
  }

  /**
   * Log user authentication events
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
        method: 'password',
      },
    });
  }

  /**
   * Log AI interactions
   */
  async logAIInteraction(
    userId: string,
    projectId: string,
    agentId: string,
    requestType: string,
    tokensUsed: number,
    success: boolean,
    duration: number,
    model?: string
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
        model: model || process.env.ULTRA_DEX_MODEL || 'default',
        classification: 'confidential', // AI interactions may contain sensitive data
      },
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    classification: DataClassification,
    reason?: string
  ): Promise<AuditEvent> {
    return this.log({
      type: 'data.access',
      severity: classification === 'restricted' ? 'warning' : 'info',
      userId,
      action: `DATA_${action.toUpperCase()}`,
      resource: resourceType,
      resourceId,
      details: {
        action,
        classification,
        reason,
        classification: classification,
      },
    });
  }

  /**
   * Log consent events
   */
  async logConsentEvent(
    userId: string,
    consentType: string,
    action: 'granted' | 'revoked' | 'updated',
    details: Record<string, any>
  ): Promise<AuditEvent> {
    return this.log({
      type: action === 'granted' ? 'consent.granted' : 'consent.revoked',
      severity: 'info',
      userId,
      action: `CONSENT_${action.toUpperCase()}`,
      resource: 'consent',
      resourceId: userId,
      details: {
        consentType,
        ...details,
        classification: 'confidential',
      },
    });
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    await this.initialize();

    let events = [...this.events];

    // Apply filters
    if (filter.startDate) {
      events = events.filter((e) => e.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      events = events.filter((e) => e.timestamp <= filter.endDate!);
    }
    if (filter.types && filter.types.length > 0) {
      events = events.filter((e) => filter.types!.includes(e.type));
    }
    if (filter.severities && filter.severities.length > 0) {
      events = events.filter((e) => filter.severities!.includes(e.severity));
    }
    if (filter.userId) {
      events = events.filter((e) => e.userId === filter.userId);
    }
    if (filter.teamId) {
      events = events.filter((e) => e.teamId === filter.teamId);
    }
    if (filter.projectId) {
      events = events.filter((e) => e.projectId === filter.projectId);
    }
    if (filter.resource) {
      events = events.filter((e) => e.resource === filter.resource);
    }
    if (filter.resourceId) {
      events = events.filter((e) => e.resourceId === filter.resourceId);
    }
    if (filter.classification) {
      events = events.filter((e) => e.metadata.classification === filter.classification);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = Math.min(
      filter.limit || this.config.maxEventsPerQuery,
      this.config.maxEventsPerQuery
    );
    events = events.slice(offset, offset + limit);

    return events;
  }

  /**
   * Get audit statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<AuditStats> {
    await this.initialize();

    const events = await this.query({ startDate, endDate, limit: this.config.maxEventsPerQuery });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByClassification: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueResources = new Set<string>();

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      eventsByClassification[event.metadata.classification || 'unknown'] =
        (eventsByClassification[event.metadata.classification || 'unknown'] || 0) + 1;

      if (event.userId) uniqueUsers.add(event.userId);
      uniqueResources.add(event.resource);
    }

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      eventsByClassification,
      uniqueUsers: uniqueUsers.size,
      uniqueResources: uniqueResources.size,
      timeRange: { start: startDate, end: endDate },
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    await this.initialize();

    const events = await this.query({ startDate, endDate, limit: this.config.maxEventsPerQuery });
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
        classification: e.metadata.classification,
      })),
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report.events);
      case 'xml':
        return this.convertToXML(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Convert events to CSV
   */
  private convertToCSV(events: any[]): string {
    if (events.length === 0) return '';

    const headers = Object.keys(events[0]).join(',');
    const rows = events.map((event) =>
      Object.values(event)
        .map((value) => `"${value}"`)
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Convert report to XML
   */
  private convertToXML(report: any): string {
    // Simple XML conversion (placeholder)
    return `<audit-report>
  <generated-at>${report.generatedAt}</generated-at>
  <period>
    <start>${report.period.start}</start>
    <end>${report.period.end}</end>
  </period>
  <total-events>${report.summary.totalEvents}</total-events>
</audit-report>`;
  }

  /**
   * Purge old audit logs
   */
  async purgeOldLogs(olderThan: Date): Promise<number> {
    await this.initialize();

    const initialCount = this.events.length;
    this.events = this.events.filter((e) => e.timestamp >= olderThan);

    const purgedCount = initialCount - this.events.length;
    this.winstonLogger.info(`Purged ${purgedCount} old audit logs`);

    return purgedCount;
  }

  /**
   * Get retention policy for event type
   */
  getRetentionPeriod(eventType: AuditEventType): number {
    const retentionPolicies: Record<AuditEventType, number> = {
      'user.login': 365, // 1 year
      'user.logout': 365,
      'user.created': 2555, // 7 years
      'user.updated': 2555,
      'user.deleted': 2555,
      'security.alert': 2555,
      'data.access': 2555,
      'consent.granted': 2555,
      'consent.revoked': 2555,
      // Default 1 year for others
      default: 365,
    };

    return retentionPolicies[eventType] || retentionPolicies.default;
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export types
export type { AuditEvent, AuditFilter, AuditStats, AuditConfig };
