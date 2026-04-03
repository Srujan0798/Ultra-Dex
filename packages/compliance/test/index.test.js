// Copyright (c) 2026 Ultra-Dex
/**
 * Compliance Package Tests
 *
 * @module @ultra-dex/compliance/test
 */

import { describe, it, beforeAll } from 'node:test';
import assert from 'node:assert';
import { auditLogger, complianceService } from '../src/index.js';

describe('@ultra-dex/compliance', () => {
  beforeAll(async () => {
    await auditLogger.initialize();
    await complianceService.initialize();
  });

  describe('AuditLogger', () => {
    it('should log audit events', async () => {
      const event = await auditLogger.log({
        type: 'user.login',
        severity: 'info',
        userId: 'test-user',
        action: 'USER_LOGIN',
        resource: 'authentication',
        resourceId: 'test-user',
        details: { success: true },
      });

      assert(event.id);
      assert(event.timestamp);
      assert.equal(event.type, 'user.login');
      assert.equal(event.userId, 'test-user');
    });

    it('should query audit events', async () => {
      const events = await auditLogger.query({
        types: ['user.login'],
        limit: 10,
      });

      assert(Array.isArray(events));
    });

    it('should generate compliance report', async () => {
      const report = await auditLogger.generateComplianceReport(
        new Date(Date.now() - 24 * 3600000),
        new Date()
      );

      assert(typeof report === 'string');
    });
  });

  describe('ComplianceService', () => {
    it('should classify data', () => {
      const classification = complianceService.classifyData('test@example.com', {});
      assert(['public', 'internal', 'confidential', 'restricted'].includes(classification));
    });

    it('should generate SOC 2 report', async () => {
      const report = await complianceService.generateSOC2Report(
        'test-org',
        {
          start: new Date(Date.now() - 30 * 24 * 3600000),
          end: new Date(),
        },
        'test-user'
      );

      assert(report.id);
      assert.equal(report.framework, 'soc2');
      assert(report.score !== undefined);
    });

    it('should create data subject request', async () => {
      const request = await complianceService.createDataSubjectRequest(
        'access',
        'user@example.com',
        'test-org',
        ['profile', 'activity'],
        'email'
      );

      assert(request.id);
      assert.equal(request.type, 'access');
    });
  });
});
