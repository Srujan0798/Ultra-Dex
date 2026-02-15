// Copyright (c) 2026 Ultra-Dex
// Audit Logger Service - Append-only log for sensitive actions

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(__dirname, '../../../../logs');
    this.logFile = options.logFile || 'audit.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.retentionDays = options.retentionDays || 90;
    this.enabled = options.enabled ?? true;
    
    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  async log(action, userId, resource, metadata = {}, ipAddress = null, userAgent = null) {
    if (!this.enabled) return;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      resource,
      metadata,
      ipAddress,
      userAgent,
      sessionId: metadata.sessionId || null,
      correlationId: metadata.correlationId || this.generateCorrelationId()
    };

    const logLine = JSON.stringify(auditEntry) + '\n';

    try {
      const logFilePath = path.join(this.logDir, this.logFile);
      
      // Check file size and rotate if needed
      await this.rotateLogFileIfNeeded(logFilePath);
      
      // Append to log file
      await fs.appendFile(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async rotateLogFileIfNeeded(logFilePath) {
    try {
      const stats = await fs.stat(logFilePath);
      if (stats.size > this.maxFileSize) {
        const rotatedFilePath = `${logFilePath}.${Date.now()}.bak`;
        await fs.rename(logFilePath, rotatedFilePath);
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
      if (error.code !== 'ENOENT') {
        console.error('Error checking log file size:', error);
      }
    }
  }

  async logLogin(userId, ipAddress, userAgent) {
    await this.log('LOGIN', userId, 'AUTHENTICATION', {}, ipAddress, userAgent);
  }

  async logLogout(userId, ipAddress) {
    await this.log('LOGOUT', userId, 'AUTHENTICATION', {}, ipAddress);
  }

  async logResourceAccess(userId, resourceId, resourceType, ipAddress) {
    await this.log('RESOURCE_ACCESS', userId, `${resourceType}:${resourceId}`, {}, ipAddress);
  }

  async logResourceCreate(userId, resourceId, resourceType, metadata, ipAddress) {
    await this.log('RESOURCE_CREATE', userId, `${resourceType}:${resourceId}`, metadata, ipAddress);
  }

  async logResourceUpdate(userId, resourceId, resourceType, metadata, ipAddress) {
    await this.log('RESOURCE_UPDATE', userId, `${resourceType}:${resourceId}`, metadata, ipAddress);
  }

  async logResourceDelete(userId, resourceId, resourceType, metadata, ipAddress) {
    await this.log('RESOURCE_DELETE', userId, `${resourceType}:${resourceId}`, metadata, ipAddress);
  }

  async logAdminAction(userId, action, targetUserId, metadata, ipAddress) {
    await this.log(`ADMIN_${action.toUpperCase()}`, userId, `USER:${targetUserId}`, metadata, ipAddress);
  }

  async logSecurityEvent(eventType, userId, details, ipAddress) {
    await this.log(`SECURITY_${eventType.toUpperCase()}`, userId, 'SECURITY', details, ipAddress);
  }

  async logApiKeyAction(action, apiKeyId, userId, resource, ipAddress) {
    await this.log(`API_KEY_${action.toUpperCase()}`, userId, `API_KEY:${apiKeyId}`, { resource }, ipAddress);
  }

  async logSensitiveOperation(operation, userId, details, ipAddress) {
    await this.log(`SENSITIVE_${operation.toUpperCase()}`, userId, 'SENSITIVE_OPERATION', details, ipAddress);
  }

  generateCorrelationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Method to search audit logs (for compliance/reports)
  async searchLogs(filters = {}) {
    const logFilePath = path.join(this.logDir, this.logFile);
    
    try {
      const content = await fs.readFile(logFilePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      let logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(log => log !== null);
      
      // Apply filters
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() <= endDate);
      }
      
      if (filters.resource) {
        logs = logs.filter(log => log.resource.includes(filters.resource));
      }
      
      return logs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet
      }
      console.error('Error searching audit logs:', error);
      throw error;
    }
  }

  // Method to generate compliance reports
  async generateComplianceReport(startDate, endDate) {
    const logs = await this.searchLogs({ startDate, endDate });
    
    const report = {
      period: { start: startDate, end: endDate },
      totalEvents: logs.length,
      byUser: {},
      byAction: {},
      securityEvents: [],
      adminActions: []
    };
    
    logs.forEach(log => {
      // Count by user
      report.byUser[log.userId] = (report.byUser[log.userId] || 0) + 1;
      
      // Count by action
      report.byAction[log.action] = (report.byAction[log.action] || 0) + 1;
      
      // Track security events
      if (log.action.startsWith('SECURITY_')) {
        report.securityEvents.push(log);
      }
      
      // Track admin actions
      if (log.action.startsWith('ADMIN_')) {
        report.adminActions.push(log);
      }
    });
    
    return report;
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

export default auditLogger;