/**
 * Ultra-Dex Audit Logging System
 * Secure, immutable logging for compliance and security.
 */

import fs from 'fs/promises';
import path from 'path';

const AUDIT_DIR = '.ultra-dex/audit';

export const AUDIT_EVENTS = {
  // Security
  LOGIN_SUCCESS: 'security.login.success',
  LOGIN_FAILURE: 'security.login.failure',
  PERMISSION_DENIED: 'security.permission.denied',
  
  // Team
  TEAM_CREATED: 'team.created',
  MEMBER_ADDED: 'team.member.added',
  MEMBER_REMOVED: 'team.member.removed',
  ROLE_CHANGED: 'team.role.changed',
  
  // Billing
  PLAN_CHANGED: 'billing.plan.changed',
  LIMIT_EXCEEDED: 'billing.limit.exceeded',
  
  // Governance
  POLICY_CREATED: 'governance.policy.created',
  REQUEST_APPROVED: 'governance.request.approved',
  REQUEST_REJECTED: 'governance.request.rejected',
  
  // System
  CONFIG_CHANGED: 'system.config.changed'
};

class AuditLogger {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.logPath = path.resolve(this.cwd, AUDIT_DIR);
  }

  async log(event, actor, details = {}, ip = 'local') {
    if (!Object.values(AUDIT_EVENTS).includes(event)) {
      console.warn(`[Audit] Warning: Unknown event type '${event}'`);
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toISOString(),
      event,
      actor: {
        id: actor.id || 'system',
        name: actor.name || 'System',
        role: actor.role || 'system'
      },
      ip,
      details,
      integrity: '' // TODO: Add HMAC signature for tampering detection
    };

    // Ensure directory exists
    await fs.mkdir(this.logPath, { recursive: true });

    // Rotate logs by date (YYYY-MM-DD)
    const dateStr = entry.timestamp.split('T')[0];
    const logFile = path.join(this.logPath, `audit-${dateStr}.jsonl`);

    // Append to file
    await fs.appendFile(logFile, JSON.stringify(entry) + '
');
    
    return entry;
  }

  async search(filter = {}) {
    // Simple implementation: read all logs (optimized versions would use indexing)
    // For MVP/CLI, reading recent logs is sufficient.
    try {
      const files = await fs.readdir(this.logPath);
      const logs = [];
      
      for (const file of files.filter(f => f.endsWith('.jsonl'))) {
        const content = await fs.readFile(path.join(this.logPath, file), 'utf8');
        const lines = content.trim().split('
');
        for (const line of lines) {
          if (!line) continue;
          try {
            const entry = JSON.parse(line);
            if (this._matches(entry, filter)) {
              logs.push(entry);
            }
          } catch (e) {
            // ignore corrupted lines
          }
        }
      }
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  _matches(entry, filter) {
    if (filter.event && entry.event !== filter.event) return false;
    if (filter.actorId && entry.actor.id !== filter.actorId) return false;
    // Add more filters as needed
    return true;
  }
}

export default AuditLogger;
