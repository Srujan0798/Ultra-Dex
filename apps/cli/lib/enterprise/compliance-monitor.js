// Copyright (c) 2026 Ultra-Dex

/**
 * Compliance Reporting and Monitoring
 * GDPR, HIPAA, SOC2 compliance monitoring and reporting
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printError } from '../utils/output.js';
import { enterpriseFeatures } from './features.js';

const COMPLIANCE_DIR = path.join(process.cwd(), '.ultra-dex', 'compliance');
const REPORTS_DIR = path.join(COMPLIANCE_DIR, 'reports');

export class ComplianceMonitor {
  constructor() {
    this.monitors = {
      gdpr: new GDPRMonitor(),
      hipaa: new HIPAACompliance(),
      soc2: new SOC2Compliance(),
    };
  }

  /**
   * Run compliance check for all standards
   */
  async runComplianceCheck() {
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    const results = {};
    const timestamp = new Date().toISOString();

    for (const [standard, monitor] of Object.entries(this.monitors)) {
      try {
        printInfo(`🔍 Checking ${standard.toUpperCase()} compliance...`);
        const result = await monitor.checkCompliance();
        results[standard] = {
          ...result,
          checkedAt: timestamp,
        };
        printSuccess(`✅ ${standard.toUpperCase()} check completed`);
      } catch (error) {
        printError(`❌ ${standard.toUpperCase()} check failed: ${error.message}`);
        results[standard] = {
          status: 'error',
          error: error.message,
          checkedAt: timestamp,
        };
      }
    }

    // Save compliance report
    const reportPath = path.join(REPORTS_DIR, `compliance-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

    return {
      results,
      reportPath,
      summary: this.generateSummary(results),
    };
  }

  /**
   * Generate compliance summary
   */
  generateSummary(results) {
    const summary = {
      overall: 'compliant',
      standards: {},
      issues: [],
      recommendations: [],
    };

    for (const [standard, result] of Object.entries(results)) {
      summary.standards[standard] = result.status;

      if (result.status === 'non-compliant' || result.status === 'error') {
        summary.overall = 'non-compliant';
        summary.issues.push(...(result.issues || []));
        summary.recommendations.push(...(result.recommendations || []));
      }
    }

    return summary;
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus() {
    const results = {};

    for (const [standard, monitor] of Object.entries(this.monitors)) {
      try {
        results[standard] = await monitor.getStatus();
      } catch (error) {
        results[standard] = {
          status: 'error',
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(options = {}) {
    const { format = 'json', includeAudit = true } = options;
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    const report = {
      generatedAt: new Date().toISOString(),
      organization: 'Ultra-Dex',
      standards: {},
    };

    // Get compliance data for each standard
    for (const [standard, monitor] of Object.entries(this.monitors)) {
      report.standards[standard] = await monitor.generateReport();
    }

    // Include audit data if requested
    if (includeAudit) {
      report.auditLogs = enterpriseFeatures.getAuditLog({}, 100);
      report.complianceRecords = Array.from(enterpriseFeatures.complianceRecords.values());
    }

    // Save report
    const reportPath = path.join(REPORTS_DIR, `full-report-${Date.now()}.${format}`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return {
      report,
      path: reportPath,
    };
  }
}

class GDPRMonitor {
  async checkCompliance() {
    const issues = [];
    const recommendations = [];

    // Check data processing consent
    const consentRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'GDPR' && r.type === 'consent'
    );

    if (consentRecords.length === 0) {
      issues.push('No GDPR consent records found');
      recommendations.push('Implement consent management system');
    }

    // Check data retention policies
    const retentionPolicies = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'GDPR' && r.type === 'retention'
    );

    if (retentionPolicies.length === 0) {
      issues.push('No data retention policies defined');
      recommendations.push('Define data retention policies for all data types');
    }

    // Check for PII handling
    const piiRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'GDPR' && r.type === 'pii_processing'
    );

    if (piiRecords.length === 0) {
      issues.push('No PII processing records found');
      recommendations.push('Document PII processing activities');
    }

    const status = issues.length === 0 ? 'compliant' : 'non-compliant';

    return {
      status,
      issues,
      recommendations,
      metrics: {
        consentRecords: consentRecords.length,
        retentionPolicies: retentionPolicies.length,
        piiRecords: piiRecords.length,
      },
    };
  }

  async getStatus() {
    const result = await this.checkCompliance();
    return {
      status: result.status,
      lastChecked: new Date().toISOString(),
      issues: result.issues.length,
    };
  }

  async generateReport() {
    const result = await this.checkCompliance();

    return {
      standard: 'GDPR',
      status: result.status,
      issues: result.issues,
      recommendations: result.recommendations,
      metrics: result.metrics,
      dataProcessing: {
        consent: result.metrics.consentRecords > 0,
        retention: result.metrics.retentionPolicies > 0,
        piiProcessing: result.metrics.piiRecords > 0,
      },
    };
  }
}

class HIPAACompliance {
  async checkCompliance() {
    const issues = [];
    const recommendations = [];

    // Check for PHI data handling
    const phiRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'HIPAA' && r.type === 'phi_handling'
    );

    if (phiRecords.length === 0) {
      issues.push('No PHI data handling records found');
      recommendations.push('Implement PHI data handling procedures');
    }

    // Check access controls
    const accessControls = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'HIPAA' && r.type === 'access_control'
    );

    if (accessControls.length === 0) {
      issues.push('No access control records for PHI data');
      recommendations.push('Implement role-based access controls for PHI');
    }

    // Check audit logging
    const auditRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'HIPAA' && r.type === 'audit_logging'
    );

    if (auditRecords.length === 0) {
      issues.push('No audit logging for PHI access');
      recommendations.push('Enable comprehensive audit logging for PHI access');
    }

    // Check encryption
    const encryptionRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'HIPAA' && r.type === 'encryption'
    );

    if (encryptionRecords.length === 0) {
      issues.push('No encryption records for PHI data');
      recommendations.push('Implement encryption for PHI data at rest and in transit');
    }

    const status = issues.length === 0 ? 'compliant' : 'non-compliant';

    return {
      status,
      issues,
      recommendations,
      metrics: {
        phiRecords: phiRecords.length,
        accessControls: accessControls.length,
        auditRecords: auditRecords.length,
        encryptionRecords: encryptionRecords.length,
      },
    };
  }

  async getStatus() {
    const result = await this.checkCompliance();
    return {
      status: result.status,
      lastChecked: new Date().toISOString(),
      issues: result.issues.length,
    };
  }

  async generateReport() {
    const result = await this.checkCompliance();

    return {
      standard: 'HIPAA',
      status: result.status,
      issues: result.issues,
      recommendations: result.recommendations,
      metrics: result.metrics,
      securityControls: {
        accessControl: result.metrics.accessControls > 0,
        auditLogging: result.metrics.auditRecords > 0,
        encryption: result.metrics.encryptionRecords > 0,
        phiHandling: result.metrics.phiRecords > 0,
      },
    };
  }
}

class SOC2Compliance {
  async checkCompliance() {
    const issues = [];
    const recommendations = [];

    // Check security controls
    const securityRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'SOC2' && r.type === 'security'
    );

    if (securityRecords.length === 0) {
      issues.push('No security control records found');
      recommendations.push('Implement SOC2 security controls');
    }

    // Check availability
    const availabilityRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'SOC2' && r.type === 'availability'
    );

    if (availabilityRecords.length === 0) {
      issues.push('No availability monitoring records');
      recommendations.push('Implement availability monitoring and reporting');
    }

    // Check processing integrity
    const integrityRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'SOC2' && r.type === 'processing_integrity'
    );

    if (integrityRecords.length === 0) {
      issues.push('No processing integrity controls');
      recommendations.push('Implement data processing integrity controls');
    }

    // Check confidentiality
    const confidentialityRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'SOC2' && r.type === 'confidentiality'
    );

    if (confidentialityRecords.length === 0) {
      issues.push('No confidentiality controls');
      recommendations.push('Implement confidentiality controls for sensitive data');
    }

    // Check privacy
    const privacyRecords = Array.from(enterpriseFeatures.complianceRecords.values()).filter(
      (r) => r.standard === 'SOC2' && r.type === 'privacy'
    );

    if (privacyRecords.length === 0) {
      issues.push('No privacy controls documented');
      recommendations.push('Document privacy controls and procedures');
    }

    const status = issues.length === 0 ? 'compliant' : 'non-compliant';

    return {
      status,
      issues,
      recommendations,
      metrics: {
        securityRecords: securityRecords.length,
        availabilityRecords: availabilityRecords.length,
        integrityRecords: integrityRecords.length,
        confidentialityRecords: confidentialityRecords.length,
        privacyRecords: privacyRecords.length,
      },
    };
  }

  async getStatus() {
    const result = await this.checkCompliance();
    return {
      status: result.status,
      lastChecked: new Date().toISOString(),
      issues: result.issues.length,
    };
  }

  async generateReport() {
    const result = await this.checkCompliance();

    return {
      standard: 'SOC2',
      status: result.status,
      issues: result.issues,
      recommendations: result.recommendations,
      metrics: result.metrics,
      trustPrinciples: {
        security: result.metrics.securityRecords > 0,
        availability: result.metrics.availabilityRecords > 0,
        processingIntegrity: result.metrics.integrityRecords > 0,
        confidentiality: result.metrics.confidentialityRecords > 0,
        privacy: result.metrics.privacyRecords > 0,
      },
    };
  }
}

// Singleton instance
export const complianceMonitor = new ComplianceMonitor();
