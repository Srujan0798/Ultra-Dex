/**
 * Audit Store Interface
 * Defines the contract for audit trail persistence
 */

export interface AuditEvent {
  id: string;
  action: string;
  agentId: string;
  task?: string;
  resource?: string;
  result?: string;
  outcome?: string;
  details?: any;
  timestamp: number;
}

export interface AuditFilters {
  agentId?: string;
  action?: string;
  resource?: string;
  since?: number;
  until?: number;
  limit?: number;
}

export interface IAuditStore {
  /**
   * Log an audit event
   */
  logEvent(event: Partial<AuditEvent>): Promise<void>;

  /**
   * Query audit events
   */
  queryEvents(filters: AuditFilters): Promise<AuditEvent[]>;

  /**
   * Export audit log to CSV
   */
  exportCSV(dateRange?: { since?: number; until?: number }): Promise<string>;
}
