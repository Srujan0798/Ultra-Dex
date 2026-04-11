var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import fs from 'fs/promises';
import path from 'path';
let AuditLogger = class {
  constructor(options = {}) {
    this.logPath = options.logPath || './logs/audit.log';
    this.maxFileSize = options.maxFileSize || 100 * 1024 * 1024;
    this.retentionDays = options.retentionDays || 90;
    this.buffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5e3;
    this.startFlushTimer();
    this.ensureLogDirectory();
  }
  async ensureLogDirectory() {
    const dir = path.dirname(this.logPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error('Failed to create audit log directory:', error);
    }
  }
  log(event, details = {}) {
    const entry = {
      timestamp: /* @__PURE__ */ new Date().toISOString(),
      event,
      details,
      id: this.generateId(),
    };
    this.buffer.push(entry);
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
    return entry.id;
  }
  async flush() {
    if (this.buffer.length === 0) return;
    const entries = this.buffer.splice(0);
    const logText = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
    try {
      await fs.appendFile(this.logPath, logText);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      this.buffer.unshift(...entries);
    }
  }
  startFlushTimer() {
    setInterval(() => this.flush(), this.flushInterval);
  }
  // Audit event helpers
  logAccess(user, resource, action, result = 'success') {
    return this.log('access', {
      user,
      resource,
      action,
      result,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
    });
  }
  logDataChange(user, table, recordId, changes, operation = 'update') {
    return this.log('data_change', {
      user,
      table,
      recordId,
      changes,
      operation,
    });
  }
  logSecurityEvent(type, details, severity = 'medium') {
    return this.log('security', {
      type,
      details,
      severity,
      timestamp: /* @__PURE__ */ new Date(),
    });
  }
  logSystemEvent(component, event, status = 'info') {
    return this.log('system', {
      component,
      event,
      status,
    });
  }
  logComplianceEvent(regulation, requirement, status, details) {
    return this.log('compliance', {
      regulation,
      requirement,
      status,
      details,
    });
  }
  async search(criteria = {}) {
    try {
      const data = await fs.readFile(this.logPath, 'utf8');
      const lines = data.split('\n').filter((line) => line.trim());
      const entries = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((entry) => entry !== null);
      let filtered = entries;
      if (criteria.event) {
        filtered = filtered.filter((e) => e.event === criteria.event);
      }
      if (criteria.user) {
        filtered = filtered.filter((e) => e.details.user === criteria.user);
      }
      if (criteria.from) {
        filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(criteria.from));
      }
      if (criteria.to) {
        filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(criteria.to));
      }
      return filtered.slice(0, criteria.limit || 1e3);
    } catch (error) {
      console.error('Failed to search audit log:', error);
      return [];
    }
  }
  async getStats() {
    try {
      const data = await fs.readFile(this.logPath, 'utf8');
      const lines = data.split('\n').filter((line) => line.trim());
      const events = {};
      lines.forEach((line) => {
        try {
          const entry = JSON.parse(line);
          events[entry.event] = (events[entry.event] || 0) + 1;
        } catch {}
      });
      const stats = await fs.stat(this.logPath).catch(() => null);
      return {
        totalEntries: lines.length,
        eventTypes: events,
        fileSize: stats?.size || 0,
        bufferedEntries: this.buffer.length,
        lastModified: stats?.mtime,
      };
    } catch (error) {
      return {
        totalEntries: 0,
        eventTypes: {},
        fileSize: 0,
        bufferedEntries: this.buffer.length,
        error: error.message,
      };
    }
  }
  getClientIP() {
    return 'unknown';
  }
  getUserAgent() {
    return 'unknown';
  }
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
};
AuditLogger = __decorateClass([singleton()], AuditLogger);
var audit_logger_default = AuditLogger;
export { AuditLogger, audit_logger_default as default };
