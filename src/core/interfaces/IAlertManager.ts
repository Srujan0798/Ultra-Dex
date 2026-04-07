export enum AlertSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  timestamp: Date;
  source: string;
  message: string;
  metrics: Record<string, number>;
  context?: Record<string, unknown>;
}

export interface AlertFilter {
  type?: string;
  severity?: AlertSeverity;
  since?: Date;
  source?: string;
}

export interface IAlertManager {
  emitAlert(alert: SystemAlert): void;
  getHistory(filter?: AlertFilter): SystemAlert[];
  subscribe(callback: (alert: SystemAlert) => void): () => void;
  on(event: 'alert' | 'auto-heal:trigger' | 'pager-duty:escalate', callback: (alert: SystemAlert) => void): void;
}
