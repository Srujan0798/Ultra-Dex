// Copyright (c) 2026 Ultra-Dex
/**
 * @ultra-dex/compliance
 * Comprehensive compliance and audit logging package
 *
 * @module @ultra-dex/compliance
 */

export {
  AuditLogger,
  auditLogger,
  type AuditEvent,
  type AuditEventType,
  type AuditSeverity,
  type DataClassification,
  type AuditFilter,
  type AuditStats,
  type AuditConfig,
} from './audit-logger.js';

export {
  ComplianceService,
  complianceService,
  type ComplianceFramework,
  type ReportType,
  type ComplianceReport,
  type ReportFile,
  type ComplianceFinding,
  type DataSubjectRequest,
  type ConsentRecord,
  type DataClassificationPolicy,
  type RetentionPolicy,
  type SOC2Control,
  type HIPAASecurityRule,
  type PCIDSSRequirement,
} from './compliance-service.js';

// Re-export commonly used types
export type {
  AuditEvent as IAuditEvent,
  ComplianceReport as IComplianceReport,
  DataSubjectRequest as IDataSubjectRequest,
};
