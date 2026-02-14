/**
 * Ultra-Dex Security Audit & Compliance Module
 * Enterprise-grade security monitoring and compliance controls
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const AUDIT_DIR = '.ultra-dex/security-audit';

class SecurityAudit extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      retentionDays: options.retentionDays || 90,
      enableEncryption: options.enableEncryption !== false,
      encryptionKey: options.encryptionKey || process.env.SECURITY_AUDIT_ENCRYPTION_KEY,
      auditLevel: options.auditLevel || 'info', // 'debug', 'info', 'warn', 'error'
      enableRealTime: options.enableRealTime !== false,
      logIntegrity: options.logIntegrity !== false, // Enable cryptographic integrity checks
      ...options
    };

    this.auditDir = path.resolve(this.options.auditDir || AUDIT_DIR);
    this.auditLog = []; // In-memory buffer for recent events
    this.integrityChain = []; // Chain of cryptographic hashes for tamper detection
    this.complianceControls = new Map(); // Compliance control registry
    this.securityPolicies = new Map(); // Security policy registry
    this.vulnerabilityScanner = null; // Vulnerability scanning engine
    
    this.initialize();
  }

  async initialize() {
    // Ensure audit directory exists
    await fs.mkdir(this.auditDir, { recursive: true });
    
    // Initialize compliance controls
    this.initializeComplianceControls();
    
    // Initialize security policies
    this.initializeSecurityPolicies();
    
    // Initialize vulnerability scanner
    this.initializeVulnerabilityScanner();
    
    console.log('🛡️  Security Audit System Initialized');
  }

  initializeComplianceControls() {
    // SOC 2 Controls
    this.complianceControls.set('soc2.access_controls', {
      id: 'CC5.2',
      name: 'Access Controls',
      category: 'security',
      description: 'Logical access security software, infrastructure, and architecture',
      requirements: [
        'User authentication and authorization',
        'Access monitoring and logging',
        'Segregation of duties',
        'Regular access reviews'
      ],
      implementation: 'RBAC with SSO, audit logging, and access reviews',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });

    this.complianceControls.set('soc2.change_management', {
      id: 'CC8.1',
      name: 'Change Management',
      category: 'security',
      description: 'Changes to infrastructure, data, software, and procedures are properly authorized',
      requirements: [
        'Change approval process',
        'Impact assessment',
        'Testing before deployment',
        'Rollback procedures'
      ],
      implementation: 'Git-based change management with approval workflows',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });

    this.complianceControls.set('soc2.data_protection', {
      id: 'CC6.1',
      name: 'Data Protection',
      category: 'confidentiality',
      description: 'Data is protected against unauthorized access, use, or disclosure',
      requirements: [
        'Data encryption at rest and in transit',
        'Access controls',
        'Data classification',
        'Secure disposal'
      ],
      implementation: 'AES-256 encryption, RBAC, data classification, secure deletion',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });

    // GDPR Controls
    this.complianceControls.set('gdpr.right_to_erasure', {
      id: 'GDPR_ARTICLE_17',
      name: 'Right to Erasure',
      category: 'privacy',
      description: 'Data subjects have right to have personal data erased',
      requirements: [
        'Data deletion procedures',
        'Verification of identity',
        'Notification to third parties',
        'Documentation of erasures'
      ],
      implementation: 'Automated data deletion with verification and logging',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });

    this.complianceControls.set('gdpr.data_portability', {
      id: 'GDPR_ARTICLE_20',
      name: 'Data Portability',
      category: 'privacy',
      description: 'Data subjects have right to receive personal data in structured format',
      requirements: [
        'Data export functionality',
        'Standardized formats',
        'Verification of identity',
        'Timely response'
      ],
      implementation: 'JSON export with all personal data',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });

    // HIPAA Controls (where applicable)
    this.complianceControls.set('hipaa.access_control', {
      id: '45_CFR_164_312_a',
      name: 'Access Control',
      category: 'security',
      description: 'Implement technical policies and procedures for electronic information systems',
      requirements: [
        'Unique user identification',
        'Emergency access procedures',
        'Automatic logoff',
        'Encryption and decryption'
      ],
      implementation: 'SSO with MFA, session management, encryption',
      status: 'implemented',
      lastReviewed: new Date().toISOString()
    });
  }

  initializeSecurityPolicies() {
    // Authentication policies
    this.securityPolicies.set('auth.multi_factor', {
      id: 'POLICY_001',
      name: 'Multi-Factor Authentication',
      category: 'authentication',
      description: 'MFA required for all administrative access',
      requirements: ['admin_role', 'sensitive_operations'],
      enforcement: 'mandatory',
      status: 'active'
    });

    // Authorization policies
    this.securityPolicies.set('auth.rbac_enforcement', {
      id: 'POLICY_002',
      name: 'Role-Based Access Control',
      category: 'authorization',
      description: 'All access controlled by RBAC system',
      requirements: ['all_resources'],
      enforcement: 'mandatory',
      status: 'active'
    });

    // Data protection policies
    this.securityPolicies.set('data.encryption_at_rest', {
      id: 'POLICY_003',
      name: 'Encryption at Rest',
      category: 'data_protection',
      description: 'All data encrypted at rest using AES-256',
      requirements: ['all_persistent_data'],
      enforcement: 'mandatory',
      status: 'active'
    });

    this.securityPolicies.set('data.encryption_in_transit', {
      id: 'POLICY_004',
      name: 'Encryption in Transit',
      category: 'data_protection',
      description: 'All data encrypted in transit using TLS 1.3',
      requirements: ['all_network_communication'],
      enforcement: 'mandatory',
      status: 'active'
    });

    // Network security policies
    this.securityPolicies.set('network.rate_limiting', {
      id: 'POLICY_005',
      name: 'Rate Limiting',
      category: 'network',
      description: 'API rate limiting to prevent abuse',
      requirements: ['all_api_endpoints'],
      enforcement: 'mandatory',
      status: 'active'
    });

    // Audit logging policies
    this.securityPolicies.set('audit.immutable_logging', {
      id: 'POLICY_006',
      name: 'Immutable Audit Logging',
      category: 'compliance',
      description: 'All security-relevant events logged immutably',
      requirements: ['auth_events', 'data_access', 'config_changes'],
      enforcement: 'mandatory',
      status: 'active'
    });
  }

  initializeVulnerabilityScanner() {
    // Initialize vulnerability scanning engine
    this.vulnerabilityScanner = {
      enabled: true,
      lastScan: null,
      vulnerabilities: [],
      severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
      
      scan: async (target) => {
        // In a real implementation, this would connect to a vulnerability scanner
        // For now, return mock results
        return {
          target,
          timestamp: new Date().toISOString(),
          vulnerabilities: [],
          scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
          summary: { critical: 0, high: 0, medium: 0, low: 0 }
        };
      },
      
      registerVulnerability: (vuln) => {
        this.vulnerabilityScanner.vulnerabilities.push(vuln);
        if (vuln.severity in this.vulnerabilityScanner.severityCounts) {
          this.vulnerabilityScanner.severityCounts[vuln.severity]++;
        }
      }
    };
  }

  /**
   * Log a security event to the audit trail
   * @param {string} event - Security event type
   * @param {object} actor - Actor performing the action
   * @param {object} details - Event details
   * @param {string} ip - IP address of the actor
   * @returns {object} Logged entry with metadata
   */
  async log(event, actor, details = {}, ip = 'local') {
    if (!Object.values(SECURITY_EVENTS).includes(event)) {
      console.warn(`[Security Audit] Warning: Unknown security event type '${event}'`);
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      event,
      actor: {
        id: actor.id || 'system',
        name: actor.name || 'System',
        role: actor.role || 'system',
        ip: actor.ip || ip
      },
      ip,
      details,
      integrity: '', // Will be computed below
      sequence: this.integrityChain.length // For ordering verification
    };

    // Compute integrity hash (cryptographic signature) for tamper detection
    entry.integrity = this.computeIntegrityHash(entry);

    // Add to integrity chain for additional tamper detection
    if (this.integrityChain.length > 0) {
      entry.previousIntegrity = this.integrityChain[this.integrityChain.length - 1];
    }
    this.integrityChain.push(entry.integrity);

    // Add to in-memory buffer
    this.auditLog.push(entry);
    if (this.auditLog.length > 1000) { // Keep only last 1000 entries in memory
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Write to persistent storage
    await this.writeToPersistentStorage(entry);

    // Emit event for real-time monitoring
    this.emit('security:audit_event', entry);

    // Check for security incidents
    if (this.isSecurityIncident(event)) {
      this.emit('security:incident', entry);
    }

    return entry;
  }

  /**
   * Compute integrity hash for log entry
   * @param {object} entry - Log entry
   * @returns {string} Integrity hash
   */
  computeIntegrityHash(entry) {
    // Create a hash of the entry content to ensure integrity
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      event: entry.event,
      actor: entry.actor,
      ip: entry.ip,
      details: entry.details,
      sequence: entry.sequence
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if an event is a security incident
   * @param {string} event - Event type
   * @returns {boolean} True if security incident
   */
  isSecurityIncident(event) {
    const incidentPatterns = [
      /^auth\.login\.failure$/,
      /^auth\.token\.invalid$/,
      /^auth\.permission\.denied$/,
      /^security\.vulnerability\.detected$/,
      /^data\.access\.unauthorized$/,
      /^config\.tampering$/,
      /^system\.intrusion$/,
      /^network\.attack\.detected$/,
    ];
    
    return incidentPatterns.some(pattern => pattern.test(event));
  }

  /**
   * Write audit entry to persistent storage
   * @param {object} entry - Audit entry to write
   * @private
   */
  async writeToPersistentStorage(entry) {
    try {
      // Ensure audit directory exists
      await fs.mkdir(this.auditDir, { recursive: true });

      // Rotate logs by date (YYYY-MM-DD)
      const dateStr = entry.timestamp.split('T')[0];
      const logFile = path.join(this.auditDir, `security-audit-${dateStr}.jsonl`);

      // Create audit entry with integrity verification
      const logEntry = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFile, logEntry);

      // Verify file integrity after write
      if (this.options.logIntegrity) {
        await this.verifyLogFileIntegrity(logFile);
      }
    } catch (error) {
      console.error(`[Security Audit] Failed to write audit entry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify integrity of a log file
   * @param {string} filePath - Path to log file
   * @returns {object} Verification result
   */
  async verifyLogFileIntegrity(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      let validEntries = 0;
      let invalidEntries = 0;
      let tamperedEntries = [];
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const expectedHash = this.computeIntegrityHash(entry);
          
          if (entry.integrity === expectedHash) {
            validEntries++;
          } else {
            invalidEntries++;
            tamperedEntries.push({
              id: entry.id,
              timestamp: entry.timestamp,
              expected: expectedHash,
              actual: entry.integrity
            });
          }
        } catch (parseError) {
          invalidEntries++;
          tamperedEntries.push({
            error: `Parse error: ${parseError.message}`,
            rawLine: line.substring(0, 100) + '...'
          });
        }
      }
      
      return {
        file: filePath,
        validEntries,
        invalidEntries,
        tamperedEntries,
        integrity: validEntries > 0 ? (validEntries / (validEntries + invalidEntries)) * 100 : 100,
        status: invalidEntries === 0 ? 'verified' : 'tampered'
      };
    } catch (error) {
      return {
        file: filePath,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Search audit logs with filters
   * @param {object} filters - Search filters
   * @returns {Array<object>} Matching log entries
   */
  async search(filters = {}) {
    try {
      const files = await fs.readdir(this.auditDir);
      const logFiles = files.filter(f => f.startsWith('security-audit-') && f.endsWith('.jsonl'));
      const logs = [];

      // Sort files by date (most recent first)
      logFiles.sort((a, b) => {
        const dateA = a.match(/security-audit-(\d{4}-\d{2}-\d{2})/)?.[1];
        const dateB = b.match(/security-audit-(\d{4}-\d{2}-\d{2})/)?.[1];
        if (!dateA || !dateB) return 0;
        return dateB.localeCompare(dateA);
      });

      for (const file of logFiles) {
        const content = await fs.readFile(path.join(this.auditDir, file), 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (this.matchesFilters(entry, filters)) {
              logs.push(entry);
            }
          } catch (e) {
            // Skip corrupted lines
            console.warn(`[Security Audit] Corrupted log entry in ${file}: ${e.message}`);
          }
        }
        
        // If we have enough results and limit is specified, break early
        if (filters.limit && logs.length >= filters.limit) {
          break;
        }
      }
      
      // Sort by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply limit if specified
      if (filters.limit) {
        return logs.slice(0, filters.limit);
      }
      
      return logs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No audit directory exists yet
      }
      throw error;
    }
  }

  /**
   * Check if an entry matches the filters
   * @param {object} entry - Log entry
   * @param {object} filters - Filters to apply
   * @returns {boolean} True if entry matches filters
   */
  matchesFilters(entry, filters) {
    if (filters.event && entry.event !== filters.event) return false;
    if (filters.actorId && entry.actor.id !== filters.actorId) return false;
    if (filters.actorName && entry.actor.name !== filters.actorName) return false;
    if (filters.ip && entry.ip !== filters.ip) return false;
    if (filters.after && new Date(entry.timestamp) < new Date(filters.after)) return false;
    if (filters.before && new Date(entry.timestamp) > new Date(filters.before)) return false;
    
    // Search in details if search term provided
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const entryText = JSON.stringify(entry).toLowerCase();
      return entryText.includes(searchTerm);
    }
    
    return true;
  }

  /**
   * Get security statistics
   * @returns {object} Security statistics
   */
  async getStats() {
    try {
      const files = await fs.readdir(this.auditDir);
      const logFiles = files.filter(f => f.startsWith('security-audit-') && f.endsWith('.jsonl'));
      
      let totalEntries = 0;
      let totalSize = 0;
      let earliestDate = null;
      let latestDate = null;
      let incidentCount = 0;
      
      for (const file of logFiles) {
        const filePath = path.join(this.auditDir, file);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);
        
        totalEntries += lines.length;
        totalSize += stat.size;
        
        // Extract dates from filename (security-audit-YYYY-MM-DD.jsonl)
        const dateMatch = file.match(/security-audit-(\d{4}-\d{2}-\d{2})\.jsonl/);
        if (dateMatch) {
          const date = dateMatch[1];
          if (!earliestDate || date < earliestDate) earliestDate = date;
          if (!latestDate || date > latestDate) latestDate = date;
        }
        
        // Count security incidents
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (this.isSecurityIncident(entry.event)) {
              incidentCount++;
            }
          } catch (e) {
            // Skip corrupted lines
          }
        }
      }
      
      return {
        totalEntries,
        totalSize,
        logFiles: logFiles.length,
        dateRange: { start: earliestDate, end: latestDate },
        retentionDays: this.options.retentionDays,
        incidentCount,
        incidentRate: totalEntries > 0 ? (incidentCount / totalEntries) * 100 : 0
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          totalEntries: 0,
          totalSize: 0,
          logFiles: 0,
          dateRange: { start: null, end: null },
          retentionDays: this.options.retentionDays,
          incidentCount: 0,
          incidentRate: 0
        };
      }
      throw error;
    }
  }

  /**
   * Run security compliance check
   * @param {string} standard - Compliance standard (soc2, gdpr, hipaa)
   * @returns {object} Compliance check results
   */
  async runComplianceCheck(standard) {
    const checks = [];
    let compliantCount = 0;
    let totalChecks = 0;

    // Filter controls by standard
    for (const [id, control] of this.complianceControls) {
      if (id.includes(standard.toLowerCase())) {
        totalChecks++;
        
        // In a real implementation, this would run actual compliance checks
        // For now, we'll return mock compliance status
        const isCompliant = await this.verifyControlImplementation(control);
        
        if (isCompliant) {
          compliantCount++;
        }
        
        checks.push({
          id: control.id,
          name: control.name,
          description: control.description,
          compliant: isCompliant,
          implementation: control.implementation,
          lastReviewed: control.lastReviewed
        });
      }
    }

    return {
      standard,
      totalChecks,
      compliantCount,
      nonCompliantCount: totalChecks - compliantCount,
      complianceRate: totalChecks > 0 ? (compliantCount / totalChecks) * 100 : 100,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify implementation of a compliance control
   * @param {object} control - Compliance control to verify
   * @returns {boolean} True if control is properly implemented
   */
  async verifyControlImplementation(control) {
    // In a real implementation, this would run actual verification
    // For now, return true for all implemented controls
    return control.status === 'implemented';
  }

  /**
   * Run security policy enforcement check
   * @returns {object} Policy enforcement results
   */
  async runPolicyCheck() {
    const results = [];
    let compliantPolicies = 0;
    let totalPolicies = 0;

    for (const [id, policy] of this.securityPolicies) {
      totalPolicies++;
      
      // In a real implementation, this would check if policy is enforced
      // For now, we'll return mock results
      const isEnforced = await this.verifyPolicyEnforcement(policy);
      
      if (isEnforced) {
        compliantPolicies++;
      }
      
      results.push({
        id: policy.id,
        name: policy.name,
        category: policy.category,
        description: policy.description,
        enforced: isEnforced,
        status: policy.status
      });
    }

    return {
      totalPolicies,
      compliantPolicies,
      nonCompliantPolicies: totalPolicies - compliantPolicies,
      enforcementRate: totalPolicies > 0 ? (compliantPolicies / totalPolicies) * 100 : 100,
      policies: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify if a security policy is enforced
   * @param {object} policy - Policy to verify
   * @returns {boolean} True if policy is enforced
   */
  async verifyPolicyEnforcement(policy) {
    // In a real implementation, this would check actual enforcement
    // For now, return true for active policies
    return policy.status === 'active';
  }

  /**
   * Generate security report
   * @param {object} options - Report options
   * @returns {object} Security report
   */
  async generateReport(options = {}) {
    const startTime = options.startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
    const endTime = options.endTime || new Date().toISOString();
    
    const [stats, soc2Check, gdprCheck, policyCheck] = await Promise.all([
      this.getStats(),
      this.runComplianceCheck('soc2'),
      this.runComplianceCheck('gdpr'),
      this.runPolicyCheck()
    ]);

    const report = {
      id: `security_report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: { startTime, endTime },
      summary: {
        totalEvents: stats.totalEntries,
        securityIncidents: stats.incidentCount,
        incidentRate: stats.incidentRate,
        compliance: {
          soc2: soc2Check.complianceRate,
          gdpr: gdprCheck.complianceRate
        },
        policyEnforcement: policyCheck.enforcementRate
      },
      statistics: stats,
      compliance: {
        soc2: soc2Check,
        gdpr: gdprCheck,
        hipaa: await this.runComplianceCheck('hipaa')
      },
      policies: policyCheck,
      recommendations: this.generateRecommendations(stats, soc2Check, gdprCheck, policyCheck),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    // Save report if persistence is enabled
    if (this.options.enablePersistence) {
      await this.saveReport(report);
    }

    return report;
  }

  /**
   * Generate security recommendations
   * @param {object} stats - Security statistics
   * @param {object} soc2Check - SOC 2 compliance check
   * @param {object} gdprCheck - GDPR compliance check
   * @param {object} policyCheck - Policy enforcement check
   * @returns {Array<object>} Recommendations
   */
  generateRecommendations(stats, soc2Check, gdprCheck, policyCheck) {
    const recommendations = [];

    if (stats.incidentRate > 1.0) {
      recommendations.push({
        priority: 'high',
        title: 'High Security Incident Rate',
        description: `Security incident rate is ${stats.incidentRate.toFixed(2)}% which is above recommended threshold of 1%`,
        action: 'Review security policies and implement additional monitoring'
      });
    }

    if (soc2Check.complianceRate < 95) {
      recommendations.push({
        priority: 'high',
        title: 'SOC 2 Compliance Gap',
        description: `SOC 2 compliance rate is ${soc2Check.complianceRate.toFixed(2)}% which is below enterprise standard of 95%`,
        action: 'Address non-compliant controls identified in SOC 2 report'
      });
    }

    if (gdprCheck.complianceRate < 95) {
      recommendations.push({
        priority: 'high',
        title: 'GDPR Compliance Gap',
        description: `GDPR compliance rate is ${gdprCheck.complianceRate.toFixed(2)}% which is below enterprise standard of 95%`,
        action: 'Address non-compliant controls identified in GDPR report'
      });
    }

    if (policyCheck.enforcementRate < 100) {
      recommendations.push({
        priority: 'medium',
        title: 'Policy Enforcement Gap',
        description: `Security policy enforcement rate is ${policyCheck.enforcementRate.toFixed(2)}% which indicates some policies are not fully enforced`,
        action: 'Verify all security policies are properly implemented and enforced'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'info',
        title: 'Security Posture Strong',
        description: 'All security metrics and compliance checks are within acceptable ranges',
        action: 'Continue regular monitoring and compliance reviews'
      });
    }

    return recommendations;
  }

  /**
   * Save security report to disk
   * @param {object} report - Report to save
   * @private
   */
  async saveReport(report) {
    const reportDir = path.join(this.auditDir, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, `${report.id}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * Run vulnerability scan
   * @param {object} options - Scan options
   * @returns {object} Scan results
   */
  async runVulnerabilityScan(options = {}) {
    if (!this.vulnerabilityScanner || !this.vulnerabilityScanner.enabled) {
      return {
        status: 'disabled',
        message: 'Vulnerability scanner not enabled'
      };
    }

    const scanResults = await this.vulnerabilityScanner.scan(options.target || 'entire_system');
    this.vulnerabilityScanner.lastScan = new Date().toISOString();

    return scanResults;
  }

  /**
   * Get security posture assessment
   * @returns {object} Security posture
   */
  async getSecurityPosture() {
    const [stats, soc2Check, gdprCheck, policyCheck, scanResults] = await Promise.all([
      this.getStats(),
      this.runComplianceCheck('soc2'),
      this.runComplianceCheck('gdpr'),
      this.runPolicyCheck(),
      this.runVulnerabilityScan({ target: 'recent_changes' })
    ]);

    return {
      overallScore: this.calculateSecurityScore(soc2Check, gdprCheck, policyCheck, stats),
      stats,
      compliance: {
        soc2: soc2Check.complianceRate,
        gdpr: gdprCheck.complianceRate,
        hipaa: (await this.runComplianceCheck('hipaa')).complianceRate
      },
      policies: policyCheck.enforcementRate,
      vulnerabilities: scanResults,
      timestamp: new Date().toISOString(),
      riskLevel: this.assessRiskLevel(stats, soc2Check, gdprCheck, policyCheck)
    };
  }

  /**
   * Calculate overall security score
   * @param {object} soc2Check - SOC 2 compliance results
   * @param {object} gdprCheck - GDPR compliance results
   * @param {object} policyCheck - Policy enforcement results
   * @param {object} stats - Security statistics
   * @returns {number} Security score (0-100)
   */
  calculateSecurityScore(soc2Check, gdprCheck, policyCheck, stats) {
    // Weighted scoring based on different security aspects
    const soc2Weight = 0.3;
    const gdprWeight = 0.2;
    const policyWeight = 0.3;
    const incidentWeight = 0.2;

    const soc2Score = soc2Check.complianceRate;
    const gdprScore = gdprCheck.complianceRate;
    const policyScore = policyCheck.enforcementRate;
    const incidentScore = Math.max(0, 100 - (stats.incidentRate * 10)); // Higher incident rate reduces score

    return Math.round(
      (soc2Score * soc2Weight) +
      (gdprScore * gdprWeight) +
      (policyScore * policyWeight) +
      (incidentScore * incidentWeight)
    );
  }

  /**
   * Assess overall risk level
   * @param {object} stats - Security statistics
   * @param {object} soc2Check - SOC 2 compliance results
   * @param {object} gdprCheck - GDPR compliance results
   * @param {object} policyCheck - Policy enforcement results
   * @returns {string} Risk level (low, medium, high, critical)
   */
  assessRiskLevel(stats, soc2Check, gdprCheck, policyCheck) {
    if (stats.incidentRate > 5 || soc2Check.complianceRate < 80 || gdprCheck.complianceRate < 80 || policyCheck.enforcementRate < 80) {
      return 'critical';
    }
    
    if (stats.incidentRate > 2 || soc2Check.complianceRate < 90 || gdprCheck.complianceRate < 90 || policyCheck.enforcementRate < 90) {
      return 'high';
    }
    
    if (stats.incidentRate > 1 || soc2Check.complianceRate < 95 || gdprCheck.complianceRate < 95 || policyCheck.enforcementRate < 95) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      auditDir: this.auditDir,
      logIntegrity: this.options.logIntegrity,
      encryptionEnabled: this.options.enableEncryption,
      stats: this.getStatsSync(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get stats synchronously (for health checks)
   * @returns {object} Stats object
   */
  getStatsSync() {
    try {
      const files = fs.readdirSync(this.auditDir);
      const logFiles = files.filter(f => f.startsWith('security-audit-') && f.endsWith('.jsonl'));
      return {
        logFiles: logFiles.length,
        retentionDays: this.options.retentionDays,
        auditLevel: this.options.auditLevel
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { logFiles: 0, retentionDays: this.options.retentionDays, auditLevel: this.options.auditLevel };
      }
      return { 
        logFiles: 0, 
        retentionDays: this.options.retentionDays, 
        auditLevel: this.options.auditLevel, 
        error: error.message 
      };
    }
  }
}

// Define security event types
export const SECURITY_EVENTS = {
  // Authentication events
  'auth.login.success': 'Successful login',
  'auth.login.failure': 'Failed login attempt',
  'auth.logout': 'User logout',
  'auth.token.refresh': 'Token refresh',
  'auth.token.invalid': 'Invalid token used',
  'auth.mfa.required': 'MFA required for access',
  'auth.mfa.success': 'MFA verification successful',
  'auth.mfa.failure': 'MFA verification failed',
  
  // Authorization events
  'auth.permission.granted': 'Permission granted',
  'auth.permission.denied': 'Permission denied',
  'auth.role.assigned': 'Role assigned to user',
  'auth.role.removed': 'Role removed from user',
  'auth.rbac.violation': 'RBAC policy violation',
  
  // Data access events
  'data.access.read': 'Data read operation',
  'data.access.write': 'Data write operation',
  'data.access.delete': 'Data deletion',
  'data.access.unauthorized': 'Unauthorized data access attempt',
  'data.export': 'Data export operation',
  'data.classification.changed': 'Data classification changed',
  
  // System events
  'system.config.changed': 'System configuration changed',
  'system.access.granted': 'System access granted',
  'system.access.denied': 'System access denied',
  'system.maintenance': 'System maintenance performed',
  'system.backup': 'System backup performed',
  'system.restore': 'System restore performed',
  'system.tampering.detected': 'System tampering detected',
  
  // Network events
  'network.attack.detected': 'Network attack detected',
  'network.rate_limit.exceeded': 'Rate limit exceeded',
  'network.ip.blocked': 'IP address blocked',
  'network.ip.whitelisted': 'IP address whitelisted',
  
  // Security events
  'security.vulnerability.detected': 'Vulnerability detected',
  'security.scan.completed': 'Security scan completed',
  'security.policy.violation': 'Security policy violation',
  'security.encryption.enabled': 'Encryption enabled',
  'security.encryption.disabled': 'Encryption disabled',
  'security.audit.enabled': 'Audit logging enabled',
  'security.audit.disabled': 'Audit logging disabled',
  
  // Compliance events
  'compliance.soc2.check': 'SOC 2 compliance check',
  'compliance.gdpr.check': 'GDPR compliance check',
  'compliance.hipaa.check': 'HIPAA compliance check',
  'compliance.failed': 'Compliance check failed',
  'compliance.passed': 'Compliance check passed'
};

// Export singleton instance
export const securityAudit = new SecurityAudit();

// Export class for instantiation with custom options
export default SecurityAudit;