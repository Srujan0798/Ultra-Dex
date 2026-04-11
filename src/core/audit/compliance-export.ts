import fs from 'fs/promises';
import { AuditTrail, type AuditFilters, type DateRange } from './audit-trail.ts';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export class ComplianceExport {
  private readonly auditTrail: AuditTrail;

  constructor(auditTrail = new AuditTrail()) {
    this.auditTrail = auditTrail;
  }

  async exportJSON(
    dateRange: DateRange = {},
    filters: AuditFilters = {},
    outputPath?: string
  ): Promise<unknown[]> {
    const events = await this.auditTrail.read(dateRange, filters);
    if (outputPath) {
      await fs.writeFile(outputPath, JSON.stringify(events, null, 2), 'utf8');
    }
    return events;
  }

  async exportCSV(
    dateRange: DateRange = {},
    filters: AuditFilters = {},
    outputPath?: string
  ): Promise<string> {
    const events = await this.auditTrail.read(dateRange, filters);
    const headers = ['timestamp', 'userId', 'teamId', 'action', 'resource', 'result', 'cost', 'details'];
    const rows = [
      headers.join(','),
      ...events.map((event) =>
        headers
          .map((header) => {
            const value = (event as Record<string, unknown>)[header];
            return csvEscape(value);
          })
          .join(',')
      ),
    ];
    const csv = rows.join('\n');
    if (outputPath) {
      await fs.writeFile(outputPath, csv, 'utf8');
    }
    return csv;
  }

  async exportSOC2(dateRange: DateRange = {}): Promise<Record<string, unknown>> {
    const events = await this.auditTrail.read(dateRange, {});
    const accessControlActions = ['team.join', 'rbac.change', 'config.update', 'memory.read', 'memory.write'];
    const providerActions = ['provider.call', 'task.run', 'task.complete', 'task.fail'];

    const accessControls = events.filter((event) => accessControlActions.includes(String(event.action)));
    const dataHandling = events.filter((event) => providerActions.includes(String(event.action)));

    return {
      reportType: 'SOC2',
      generatedAt: new Date().toISOString(),
      period: dateRange,
      controls: {
        accessControls: {
          count: accessControls.length,
          events: accessControls,
        },
        dataHandling: {
          count: dataHandling.length,
          events: dataHandling,
        },
      },
    };
  }
}

