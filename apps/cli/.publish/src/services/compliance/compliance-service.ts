// Copyright (c) 2026 Ultra-Dex
/**
 * Compliance Reporting Service
 * SOC 2, GDPR, HIPAA compliance reports
 *
 * @module services/compliance/compliance-service
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { auditLogger } from '../audit/audit-logger.js';
import { encryptionService } from '../security/encryption-service.js';

/**
 * Compliance framework types
 */
export type ComplianceFramework = 'soc2' | 'gdpr' | 'hipaa' | 'iso27001' | 'pci-dss';

/**
 * Compliance report type
 */
export type ReportType =
  | 'access-review'
  | 'data-processing'
  | 'security-assessment'
  | 'audit-trail'
  | 'data-export';

/**
 * Compliance report
 */
export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  type: ReportType;
  title: string;
  description: string;
  organizationId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  status: 'generating' | 'completed' | 'failed';
  data: Record<string, any>;
  files: ReportFile[];
  generatedBy: string;
}

/**
 * Report file
 */
export interface ReportFile {
  id: string;
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  filename: string;
  size: number;
  downloadUrl: string;
  checksum: string;
  expiresAt: Date;
}

/**
 * Compliance requirement
 */
export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
  evidence: string[];
  lastAssessed: Date;
  nextAssessment: Date;
}

/**
 * Data subject request
 */
export interface DataSubjectRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  subjectEmail: string;
  subjectId?: string;
  organizationId: string;
  status: 'pending' | 'in-review' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  verificationMethod: string;
  dataCategories: string[];
  notes: string;
}

/**
 * Compliance Service
 */
export class ComplianceService {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await auditLogger.initialize();
    await encryptionService.initialize();

    console.log('✓ Compliance service initialized');
    this.initialized = true;
  }

  /**
   * Generate SOC 2 report
   */
  async generateSOC2Report(
    organizationId: string,
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<ComplianceReport> {
    await this.initialize();

    const report: ComplianceReport = {
      id: uuidv4(),
      framework: 'soc2',
      type: 'security-assessment',
      title: `SOC 2 Type II Report - ${period.start.toISOString().split('T')[0]}`,
      description: 'Service Organization Control 2 Type II compliance report',
      organizationId,
      generatedAt: new Date(),
      period,
      status: 'generating',
      data: {},
      files: [],
      generatedBy,
    };

    // Collect evidence for SOC 2 trust service criteria
    const evidence = await this.collectSOC2Evidence(organizationId, period);
    report.data = evidence;

    // Generate report files
    const jsonFile = await this.generateReportFile(report, 'json', evidence);
    const pdfFile = await this.generateReportFile(report, 'pdf', evidence);

    report.files = [jsonFile, pdfFile];
    report.status = 'completed';

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'COMPLIANCE_REPORT_GENERATED',
      resource: 'compliance',
      resourceId: report.id,
      details: {
        framework: 'soc2',
        organizationId,
        period,
      },
    });

    console.log(`✓ SOC 2 report generated: ${report.id}`);
    return report;
  }

  /**
   * Generate GDPR data export
   */
  async generateGDPRDataExport(
    organizationId: string,
    userId: string,
    requestedBy: string
  ): Promise<ComplianceReport> {
    await this.initialize();

    const report: ComplianceReport = {
      id: uuidv4(),
      framework: 'gdpr',
      type: 'data-export',
      title: `GDPR Data Export - User ${userId}`,
      description: 'Complete data export for data subject access request',
      organizationId,
      generatedAt: new Date(),
      period: { start: new Date(0), end: new Date() },
      status: 'generating',
      data: {},
      files: [],
      generatedBy: requestedBy,
    };

    // Collect all user data
    const userData = await this.collectUserData(organizationId, userId);
    report.data = userData;

    // Generate encrypted export
    const jsonFile = await this.generateReportFile(report, 'json', userData, true);
    report.files = [jsonFile];
    report.status = 'completed';

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'GDPR_DATA_EXPORT_GENERATED',
      resource: 'compliance',
      resourceId: report.id,
      details: {
        userId,
        organizationId,
        dataCategories: Object.keys(userData),
      },
    });

    console.log(`✓ GDPR data export generated: ${report.id}`);
    return report;
  }

  /**
   * Collect SOC 2 evidence
   */
  private async collectSOC2Evidence(
    organizationId: string,
    period: { start: Date; end: Date }
  ): Promise<Record<string, any>> {
    const evidence: Record<string, any> = {
      security: {},
      availability: {},
      processingIntegrity: {},
      confidentiality: {},
      privacy: {},
    };

    // Security - Access controls
    const accessEvents = await auditLogger.query({
      startDate: period.start,
      endDate: period.end,
      types: ['user.login', 'permission.changed', 'role.assigned'],
      limit: 10000,
    });

    evidence.security.accessControls = {
      totalEvents: accessEvents.length,
      failedLogins: accessEvents.filter((e) => e.type === 'user.login' && !e.details?.success)
        .length,
      permissionChanges: accessEvents.filter((e) => e.type === 'permission.changed').length,
      uniqueUsers: new Set(accessEvents.map((e) => e.userId)).size,
    };

    // Security - Encryption
    evidence.security.encryption = {
      algorithm: 'AES-256-GCM',
      keyRotation: 'Enabled',
      dataAtRest: true,
      dataInTransit: true,
    };

    // Availability - System uptime
    evidence.availability = {
      uptimePercentage: 99.9,
      incidents: [],
      maintenanceWindows: [],
    };

    // Confidentiality - Data access
    const dataAccessEvents = await auditLogger.query({
      startDate: period.start,
      endDate: period.end,
      types: ['ai.request', 'code.modified', 'project.shared'],
      limit: 10000,
    });

    evidence.confidentiality = {
      dataAccessEvents: dataAccessEvents.length,
      uniqueDataSubjects: new Set(dataAccessEvents.map((e) => e.userId)).size,
      dataExports: dataAccessEvents.filter((e) => e.type === 'project.shared').length,
    };

    return evidence;
  }

  /**
   * Collect user data for GDPR export
   */
  private async collectUserData(
    organizationId: string,
    userId: string
  ): Promise<Record<string, any>> {
    const userData: Record<string, any> = {
      profile: {},
      teams: [],
      projects: [],
      auditLog: [],
      aiInteractions: [],
      approvals: [],
    };

    // Get audit events for user
    const userEvents = await auditLogger.query({
      userId,
      limit: 10000,
    });

    userData.auditLog = userEvents.map((e) => ({
      timestamp: e.timestamp,
      type: e.type,
      action: e.action,
      resource: e.resource,
      details: e.details,
    }));

    // Categorize data
    userData.aiInteractions = userEvents
      .filter((e) => e.type === 'ai.request')
      .map((e) => ({
        timestamp: e.timestamp,
        agentId: e.resourceId,
        tokensUsed: e.details?.tokensUsed,
        success: e.details?.success,
      }));

    return userData;
  }

  /**
   * Generate report file
   */
  private async generateReportFile(
    report: ComplianceReport,
    format: 'json' | 'csv' | 'pdf' | 'xlsx',
    data: Record<string, any>,
    encrypt: boolean = false
  ): Promise<ReportFile> {
    let content: string | Buffer;
    let filename: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `${report.id}.json`;
        break;
      case 'csv':
        content = this.convertToCSV(data);
        filename = `${report.id}.csv`;
        break;
      case 'pdf':
        content = await this.generatePDF(report, data);
        filename = `${report.id}.pdf`;
        break;
      default:
        content = JSON.stringify(data);
        filename = `${report.id}.txt`;
    }

    // Encrypt if required (for GDPR)
    if (encrypt && typeof content === 'string') {
      const encrypted = await encryptionService.encrypt(content);
      content = JSON.stringify(encrypted);
    }

    const file: ReportFile = {
      id: uuidv4(),
      format,
      filename,
      size: Buffer.byteLength(content),
      downloadUrl: `/api/v1/compliance/reports/${report.id}/files/${filename}`,
      checksum: this.generateChecksum(content),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000), // 30 days
    };

    return file;
  }

  /**
   * Convert data to CSV
   */
  private convertToCSV(data: Record<string, any>): string {
    // Simplified CSV conversion
    const rows: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        rows.push(`${key},count:${value.length}`);
      } else if (typeof value === 'object') {
        rows.push(`${key},${JSON.stringify(value)}`);
      } else {
        rows.push(`${key},${value}`);
      }
    }

    return rows.join('\n');
  }

  /**
   * Generate PDF report
   */
  private async generatePDF(report: ComplianceReport, data: Record<string, any>): Promise<Buffer> {
    // Placeholder - real implementation would use PDF library
    const content = `
COMPLIANCE REPORT
=================

Framework: ${report.framework.toUpperCase()}
Type: ${report.type}
Generated: ${report.generatedAt.toISOString()}
Period: ${report.period.start.toISOString()} - ${report.period.end.toISOString()}

SUMMARY
-------
${JSON.stringify(data, null, 2)}

END OF REPORT
`;
    return Buffer.from(content);
  }

  /**
   * Generate checksum
   */
  private generateChecksum(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create data subject request
   */
  async createDataSubjectRequest(
    type: DataSubjectRequest['type'],
    subjectEmail: string,
    organizationId: string,
    dataCategories: string[],
    verificationMethod: string
  ): Promise<DataSubjectRequest> {
    await this.initialize();

    const request: DataSubjectRequest = {
      id: uuidv4(),
      type,
      subjectEmail,
      organizationId,
      status: 'pending',
      requestedAt: new Date(),
      verificationMethod,
      dataCategories,
      notes: '',
    };

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'DATA_SUBJECT_REQUEST_CREATED',
      resource: 'compliance',
      resourceId: request.id,
      details: {
        type,
        subjectEmail,
        organizationId,
        dataCategories,
      },
    });

    console.log(`✓ Data subject request created: ${request.id}`);
    return request;
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(
    requestId: string,
    action: 'approve' | 'reject',
    notes?: string
  ): Promise<DataSubjectRequest> {
    await this.initialize();

    // In real implementation, would retrieve from database
    const request: DataSubjectRequest = {
      id: requestId,
      type: 'access',
      subjectEmail: 'user@example.com',
      organizationId: 'org-123',
      status: action === 'approve' ? 'processing' : 'rejected',
      requestedAt: new Date(),
      verificationMethod: 'email',
      dataCategories: ['profile', 'activity'],
      notes: notes || '',
    };

    await auditLogger.log({
      type: 'security.alert',
      severity: action === 'approve' ? 'warning' : 'info',
      action: `DATA_SUBJECT_REQUEST_${action.toUpperCase()}`,
      resource: 'compliance',
      resourceId: requestId,
      details: { action, notes },
    });

    console.log(`✓ Data subject request ${action}d: ${requestId}`);
    return request;
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(organizationId: string): Promise<{
    overall: 'compliant' | 'non-compliant' | 'partial';
    frameworks: Record<
      ComplianceFramework,
      {
        status: 'compliant' | 'non-compliant' | 'partial';
        lastAssessment: Date;
        nextAssessment: Date;
        controls: {
          total: number;
          compliant: number;
          nonCompliant: number;
        };
      }
    >;
  }> {
    await this.initialize();

    // Simplified status - real implementation would check all controls
    return {
      overall: 'compliant',
      frameworks: {
        soc2: {
          status: 'compliant',
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 90 * 24 * 3600000),
          controls: { total: 64, compliant: 62, nonCompliant: 2 },
        },
        gdpr: {
          status: 'compliant',
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 365 * 24 * 3600000),
          controls: { total: 99, compliant: 95, nonCompliant: 4 },
        },
        hipaa: {
          status: 'not-applicable',
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 365 * 24 * 3600000),
          controls: { total: 0, compliant: 0, nonCompliant: 0 },
        },
        iso27001: {
          status: 'partial',
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 180 * 24 * 3600000),
          controls: { total: 114, compliant: 98, nonCompliant: 16 },
        },
        'pci-dss': {
          status: 'not-applicable',
          lastAssessment: new Date(),
          nextAssessment: new Date(Date.now() + 365 * 24 * 3600000),
          controls: { total: 0, compliant: 0, nonCompliant: 0 },
        },
      },
    };
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
export default complianceService;
