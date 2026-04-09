// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced Data Retention and Cleanup Policies
 * Automated data lifecycle management with compliance-aware retention
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const RETENTION_DIR = path.join(process.cwd(), '.ultra-dex', 'retention');
const POLICIES_FILE = path.join(RETENTION_DIR, 'policies.json');
const CLEANUP_LOG = path.join(RETENTION_DIR, 'cleanup.log');

export const RETENTION_CATEGORIES = {
  AUDIT_LOGS: 'audit_logs',
  USER_DATA: 'user_data',
  SESSION_DATA: 'session_data',
  ANALYTICS: 'analytics',
  BACKUPS: 'backups',
  TEMP_FILES: 'temp_files',
  CACHE: 'cache',
  COMPLIANCE_RECORDS: 'compliance_records',
};

export const RETENTION_PERIODS = {
  SHORT: 7 * 24 * 60 * 60 * 1000, // 7 days
  MEDIUM: 30 * 24 * 60 * 60 * 1000, // 30 days
  LONG: 90 * 24 * 60 * 60 * 1000, // 90 days
  YEAR: 365 * 24 * 60 * 60 * 1000, // 1 year
  FOREVER: -1, // Never delete
};

class DataRetentionManager {
  constructor() {
    this.policies = new Map();
    this.defaultPolicies = this.createDefaultPolicies();
    this.cleanupInterval = null;
  }

  /**
   * Create default retention policies
   */
  createDefaultPolicies() {
    return {
      [RETENTION_CATEGORIES.AUDIT_LOGS]: {
        category: RETENTION_CATEGORIES.AUDIT_LOGS,
        retentionPeriod: RETENTION_PERIODS.YEAR,
        compliance: ['GDPR', 'HIPAA', 'SOC2'],
        autoCleanup: true,
        backupBeforeDelete: true,
      },

      [RETENTION_CATEGORIES.USER_DATA]: {
        category: RETENTION_CATEGORIES.USER_DATA,
        retentionPeriod: RETENTION_PERIODS.FOREVER,
        compliance: ['GDPR', 'HIPAA'],
        autoCleanup: false,
        backupBeforeDelete: true,
      },

      [RETENTION_CATEGORIES.SESSION_DATA]: {
        category: RETENTION_CATEGORIES.SESSION_DATA,
        retentionPeriod: RETENTION_PERIODS.MEDIUM,
        compliance: [],
        autoCleanup: true,
        backupBeforeDelete: false,
      },

      [RETENTION_CATEGORIES.ANALYTICS]: {
        category: RETENTION_CATEGORIES.ANALYTICS,
        retentionPeriod: RETENTION_PERIODS.LONG,
        compliance: ['GDPR'],
        autoCleanup: true,
        backupBeforeDelete: false,
      },

      [RETENTION_CATEGORIES.BACKUPS]: {
        category: RETENTION_CATEGORIES.BACKUPS,
        retentionPeriod: RETENTION_PERIODS.YEAR,
        compliance: ['GDPR', 'HIPAA', 'SOC2'],
        autoCleanup: true,
        backupBeforeDelete: false,
      },

      [RETENTION_CATEGORIES.TEMP_FILES]: {
        category: RETENTION_CATEGORIES.TEMP_FILES,
        retentionPeriod: RETENTION_PERIODS.SHORT,
        compliance: [],
        autoCleanup: true,
        backupBeforeDelete: false,
      },

      [RETENTION_CATEGORIES.CACHE]: {
        category: RETENTION_CATEGORIES.CACHE,
        retentionPeriod: RETENTION_PERIODS.MEDIUM,
        compliance: [],
        autoCleanup: true,
        backupBeforeDelete: false,
      },

      [RETENTION_CATEGORIES.COMPLIANCE_RECORDS]: {
        category: RETENTION_CATEGORIES.COMPLIANCE_RECORDS,
        retentionPeriod: RETENTION_PERIODS.FOREVER,
        compliance: ['GDPR', 'HIPAA', 'SOC2'],
        autoCleanup: false,
        backupBeforeDelete: true,
      },
    };
  }

  /**
   * Initialize retention manager
   */
  async initialize() {
    await fs.mkdir(RETENTION_DIR, { recursive: true });
    await this.loadPolicies();

    // Start automatic cleanup
    this.startAutoCleanup();

    printSuccess('🗂️ Data retention manager initialized');
  }

  /**
   * Load retention policies
   */
  async loadPolicies() {
    try {
      const data = await fs.readFile(POLICIES_FILE, 'utf8');
      const policies = JSON.parse(data);

      for (const [category, policy] of Object.entries(policies)) {
        this.policies.set(category, policy);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(`⚠️ Could not load retention policies: ${error.message}`);
      }
      // Load defaults
      for (const [category, policy] of Object.entries(this.defaultPolicies)) {
        this.policies.set(category, policy);
      }
    }
  }

  /**
   * Save retention policies
   */
  async savePolicies() {
    try {
      const policiesObj = Object.fromEntries(this.policies);
      await fs.writeFile(POLICIES_FILE, JSON.stringify(policiesObj, null, 2));
    } catch (error) {
      printError(`Failed to save retention policies: ${error.message}`);
    }
  }

  /**
   * Set retention policy for category
   */
  async setRetentionPolicy(category, policy) {
    const fullPolicy = {
      ...policy,
      category,
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(category, fullPolicy);
    await this.savePolicies();

    printInfo(`📋 Retention policy updated: ${category}`);
    return fullPolicy;
  }

  /**
   * Get retention policy for category
   */
  getRetentionPolicy(category) {
    return this.policies.get(category) || this.defaultPolicies[category];
  }

  /**
   * Calculate retention cutoff date
   */
  getRetentionCutoff(category) {
    const policy = this.getRetentionPolicy(category);
    if (!policy || policy.retentionPeriod === RETENTION_PERIODS.FOREVER) {
      return null; // Never delete
    }

    return new Date(Date.now() - policy.retentionPeriod);
  }

  /**
   * Check if data should be retained
   */
  shouldRetain(category, dataTimestamp) {
    const cutoff = this.getRetentionCutoff(category);
    if (!cutoff) return true; // Keep forever

    const dataDate = new Date(dataTimestamp);
    return dataDate > cutoff;
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(category, dataFiles = []) {
    const policy = this.getRetentionPolicy(category);
    if (!policy || !policy.autoCleanup) {
      return { cleaned: 0, reason: 'cleanup disabled' };
    }

    const cutoff = this.getRetentionCutoff(category);
    if (!cutoff) {
      return { cleaned: 0, reason: 'no retention cutoff' };
    }

    let cleaned = 0;
    const cleanupLog = [];

    for (const filePath of dataFiles) {
      try {
        const stats = await fs.stat(filePath);
        const fileDate = new Date(stats.mtime);

        if (fileDate < cutoff) {
          // Backup if required
          if (policy.backupBeforeDelete) {
            await this.backupFile(filePath, category);
          }

          // Delete file
          await fs.unlink(filePath);
          cleaned++;

          cleanupLog.push({
            action: 'deleted',
            file: filePath,
            category,
            timestamp: new Date().toISOString(),
            fileModified: stats.mtime.toISOString(),
          });
        }
      } catch (error) {
        printWarning(`⚠️ Failed to cleanup ${filePath}: ${error.message}`);
      }
    }

    // Log cleanup
    if (cleanupLog.length > 0) {
      await this.logCleanup(cleanupLog);
    }

    return { cleaned, totalFiles: dataFiles.length };
  }

  /**
   * Backup file before deletion
   */
  async backupFile(filePath, category) {
    try {
      const backupDir = path.join(RETENTION_DIR, 'backups', category);
      await fs.mkdir(backupDir, { recursive: true });

      const fileName = path.basename(filePath);
      const timestamp = Date.now();
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.backup`);

      await fs.copyFile(filePath, backupPath);

      return backupPath;
    } catch (error) {
      printWarning(`⚠️ Failed to backup ${filePath}: ${error.message}`);
    }
  }

  /**
   * Log cleanup actions
   */
  async logCleanup(logEntries) {
    try {
      const logData = logEntries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(CLEANUP_LOG, logData);
    } catch (error) {
      printError(`Failed to log cleanup: ${error.message}`);
    }
  }

  /**
   * Run full cleanup cycle
   */
  async runFullCleanup() {
    printInfo('🧹 Starting data cleanup cycle...');

    const results = {};

    // Cleanup audit logs
    const auditLogFiles = await this.findFiles('.ultra-dex/audit/*.jsonl');
    results.audit = await this.cleanupExpiredData(RETENTION_CATEGORIES.AUDIT_LOGS, auditLogFiles);

    // Cleanup analytics
    const analyticsFiles = await this.findFiles('.ultra-dex/analytics/*.jsonl');
    results.analytics = await this.cleanupExpiredData(
      RETENTION_CATEGORIES.ANALYTICS,
      analyticsFiles
    );

    // Cleanup temp files
    const tempFiles = await this.findFiles('tmp/*', { age: RETENTION_PERIODS.SHORT });
    results.temp = await this.cleanupExpiredData(RETENTION_CATEGORIES.TEMP_FILES, tempFiles);

    // Cleanup cache
    const cacheFiles = await this.findFiles('.ultra-dex/cache/*');
    results.cache = await this.cleanupExpiredData(RETENTION_CATEGORIES.CACHE, cacheFiles);

    // Cleanup old backups
    const backupFiles = await this.findFiles('.ultra-dex/retention/backups/*/*');
    results.backups = await this.cleanupExpiredData(RETENTION_CATEGORIES.BACKUPS, backupFiles);

    const totalCleaned = Object.values(results).reduce((sum, r) => sum + (r.cleaned || 0), 0);

    printSuccess(`✅ Cleanup completed: ${totalCleaned} files removed`);

    return results;
  }

  /**
   * Find files matching pattern
   */
  async findFiles(pattern, options = {}) {
    try {
      const { glob } = await import('glob');
      const files = await glob(pattern, { cwd: process.cwd() });

      if (options.age) {
        const cutoff = new Date(Date.now() - options.age);
        const filtered = [];

        for (const file of files) {
          try {
            const stats = await fs.stat(file);
            if (new Date(stats.mtime) < cutoff) {
              filtered.push(file);
            }
          } catch {
            // Skip inaccessible files
          }
        }

        return filtered;
      }

      return files;
    } catch {
      return [];
    }
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup() {
    // Run cleanup every 24 hours
    this.cleanupInterval = setInterval(
      async () => {
        try {
          await this.runFullCleanup();
        } catch (error) {
          printError(`Automatic cleanup failed: ${error.message}`);
        }
      },
      24 * 60 * 60 * 1000
    );

    // Initial cleanup
    setTimeout(() => this.runFullCleanup(), 60000); // Start after 1 minute
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats() {
    const stats = {
      policies: this.policies.size,
      categories: Array.from(this.policies.keys()),
      autoCleanupEnabled: !!this.cleanupInterval,
      lastCleanup: null,
    };

    // Check last cleanup log
    try {
      const logContent = await fs.readFile(CLEANUP_LOG, 'utf8');
      const lines = logContent.split('\n').filter(Boolean);
      if (lines.length > 0) {
        const lastEntry = JSON.parse(lines[lines.length - 1]);
        stats.lastCleanup = lastEntry.timestamp;
      }
    } catch {
      // No cleanup log yet
    }

    return stats;
  }

  /**
   * Manual retention check for specific data
   */
  checkRetention(category, dataTimestamp) {
    const shouldRetain = this.shouldRetain(category, dataTimestamp);
    const cutoff = this.getRetentionCutoff(category);
    const policy = this.getRetentionPolicy(category);

    return {
      category,
      shouldRetain,
      cutoffDate: cutoff ? cutoff.toISOString() : null,
      retentionPeriod: policy ? policy.retentionPeriod : null,
      dataDate: dataTimestamp,
      daysUntilExpiry: cutoff
        ? Math.ceil((new Date(dataTimestamp) - cutoff) / (24 * 60 * 60 * 1000))
        : null,
    };
  }
}

// Singleton instance
export const dataRetentionManager = new DataRetentionManager();

// Initialize on import
dataRetentionManager.initialize().catch(console.error);
