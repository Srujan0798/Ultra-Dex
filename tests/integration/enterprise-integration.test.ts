// Copyright (c) 2026 Ultra-Dex
/**
 * Comprehensive Enterprise Integration Tests
 * End-to-end testing for all enterprise services
 *
 * @module tests/integration/enterprise-integration.test
 */

import 'reflect-metadata';
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TeamManager } from '../../src/core/team/team-manager.js';
const teamManager = new TeamManager();
import { rbacManager } from '../../src/core/auth/rbac-manager.js';
import { auditLogger } from '../../src/services/audit/audit-logger.js';
import { approvalWorkflowManager } from '../../src/services/governance/approval-workflow.js';
import { webhookManager } from '../../src/services/webhooks/webhook-manager.js';
import { ssoService } from '../../src/services/auth/sso-service.js';
import { rateLimiter } from '../../src/services/security/rate-limiter.js';
import { encryptionService } from '../../src/services/security/encryption-service.js';
import { complianceService } from '../../src/services/compliance/compliance-service.js';

describe('Enterprise Integration Tests', () => {
  describe('End-to-End: Complete Enterprise Workflow', () => {
    test('Full enterprise setup workflow', async () => {
      // 1. Create organization (simulated)
      const orgId = 'org-test-123';

      // 2. Create team
      const team = await teamManager.createTeam('Engineering', 'admin-user', 'Engineering team');
      assert.ok(team.id);
      assert.strictEqual(team.members.length, 1);

      // 3. Configure SSO
      const ssoConfig = await ssoService.configureSAML(
        orgId,
        'Corporate SSO',
        {
          entryPoint: 'https://sso.example.com/saml',
          issuer: 'ultra-dex',
          cert: '-----BEGIN CERTIFICATE-----\n...',
          wantAssertionsSigned: true,
          wantResponseSigned: true,
          signatureAlgorithm: 'rsa-sha256',
          digestAlgorithm: 'sha256',
        },
        {
          email: 'user.email',
          firstName: 'user.firstName',
          lastName: 'user.lastName',
          groups: 'user.groups',
        }
      );
      assert.strictEqual(ssoConfig.providerType, 'saml');

      // 4. Set up rate limiting
      const rateConfig = await rateLimiter.configureOrganizationLimit(orgId, 'enterprise', {
        maxRequests: 10000,
        windowMs: 60000,
      });
      assert.strictEqual(rateConfig.maxRequests, 10000);

      // 5. Create approval policy
      const request = await approvalWorkflowManager.submitRequest(
        'admin-user',
        'Admin User',
        'production-deployment',
        'Deploy to production',
        'Deploy v2.0 to production environment',
        {
          projectId: 'project-123',
          teamId: team.id,
          operationType: 'production-deployment',
          estimatedCost: 50,
        },
        'high'
      );
      assert.strictEqual(request.status, 'pending');

      // 6. Configure webhook
      const webhook = await webhookManager.createWebhook(
        orgId,
        'Production Notifications',
        'https://hooks.slack.com/services/...',
        ['project.deployed', 'approval.approved'],
        'admin-user'
      );
      assert.ok(webhook.secret);

      // 7. Initialize encryption
      await encryptionService.initialize('master-key-hex');
      const encrypted = await encryptionService.encrypt('sensitive data');
      const decrypted = await encryptionService.decrypt(encrypted);
      assert.strictEqual(decrypted, 'sensitive data');

      // 8. Generate compliance report
      const report = await complianceService.generateSOC2Report(
        orgId,
        { start: new Date(Date.now() - 30 * 24 * 3600000), end: new Date() },
        'admin-user'
      );
      assert.strictEqual(report.framework, 'soc2');
      assert.strictEqual(report.status, 'completed');

      // 9. Verify audit trail
      const auditEvents = await auditLogger.query({
        limit: 100,
      });
      assert.ok(auditEvents.length > 0);

      console.log('✓ Full enterprise workflow completed successfully');
    });
  });

  describe('Security: Authentication & Authorization', () => {
    test('SSO authentication flow', async () => {
      const orgId = 'org-sso-test';

      const config = await ssoService.configureOAuth2(
        orgId,
        'Google Workspace',
        {
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
          authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
          tokenURL: 'https://oauth2.googleapis.com/token',
          scope: ['openid', 'email', 'profile'],
        },
        { email: 'email', firstName: 'given_name', lastName: 'family_name' }
      );

      assert.ok(config);
      assert.strictEqual(config.providerType, 'oauth2');
    });

    test('Rate limiting enforcement', async () => {
      const userId = 'user-rate-test';

      // Exceed rate limit
      let lastResult;
      for (let i = 0; i < 105; i++) {
        lastResult = await rateLimiter.checkLimit(`user:${userId}:api`, 'free');
      }

      assert.strictEqual(lastResult?.allowed, false);
      assert.ok(lastResult?.retryAfter);
    });

    test('Encryption and decryption', async () => {
      await encryptionService.initialize();

      const sensitiveData = 'password123';
      const encrypted = await encryptionService.encrypt(sensitiveData);

      assert.ok(encrypted.ciphertext);
      assert.ok(encrypted.iv);
      assert.ok(encrypted.authTag);

      const decrypted = await encryptionService.decrypt(encrypted);
      assert.strictEqual(decrypted, sensitiveData);
    });

    test('Hash verification', async () => {
      const password = 'secure-password';
      const hashed = encryptionService.hash(password);

      assert.ok(encryptionService.verifyHash(password, hashed));
      assert.ok(!encryptionService.verifyHash('wrong-password', hashed));
    });
  });

  describe('Governance: Approvals & Compliance', () => {
    test('Multi-level approval workflow', async () => {
      const request = await approvalWorkflowManager.submitRequest(
        'user-1',
        'User One',
        'ai-generation',
        'Expensive AI Operation',
        'Process large dataset',
        { operationType: 'ai-generation', estimatedCost: 100 },
        'critical'
      );

      // First approval (authorized approver)
      const result1 = await approvalWorkflowManager.processDecision(
        request.id,
        'admin-1',
        'Admin One',
        'approved',
        'Looks good'
      );

      assert.strictEqual(result1.decisions.length, 1);

      // Second approval (another authorized approver)
      const result2 = await approvalWorkflowManager.processDecision(
        request.id,
        'team-lead-1',
        'Team Lead One',
        'approved',
        'Approved'
      );

      assert.strictEqual(result2.status, 'approved');
    });

    test('Compliance report generation', async () => {
      const report = await complianceService.generateSOC2Report(
        'org-compliance-test',
        {
          start: new Date(Date.now() - 7 * 24 * 3600000),
          end: new Date(),
        },
        'admin-user'
      );

      assert.strictEqual(report.framework, 'soc2');
      assert.ok(report.data.security);
      assert.ok(report.data.availability);
      assert.ok(report.files.length > 0);
    });

    test('GDPR data export', async () => {
      const report = await complianceService.generateGDPRDataExport(
        'org-gdpr-test',
        'user-gdpr-123',
        'admin-user'
      );

      assert.strictEqual(report.framework, 'gdpr');
      assert.strictEqual(report.type, 'data-export');
      assert.ok(report.data.auditLog);
    });
  });

  describe('Integrations: Webhooks & APIs', () => {
    test('Webhook event delivery', async () => {
      const webhook = await webhookManager.createWebhook(
        'org-webhook-test',
        'Test Webhook',
        'https://httpbin.org/post',
        ['project.created', 'user.login'],
        'admin-user'
      );

      // Note: This would actually call the webhook in real test
      assert.ok(webhook.id);
      assert.strictEqual(webhook.events.length, 2);
    });

    test('Webhook signature generation', async () => {
      const payload = {
        event: 'test.event',
        timestamp: new Date().toISOString(),
        data: { test: true },
      };

      // Signature generation is internal, but webhook creation validates URL
      const webhook = await webhookManager.createWebhook(
        'org-sig-test',
        'Signature Test',
        'https://example.com/webhook',
        ['security.alert'],
        'test-user'
      );

      assert.ok(webhook.secret.length > 0);
    });
  });

  describe('Performance: Load & Stress', () => {
    test('Bulk audit log operations', async () => {
      const startTime = Date.now();

      // Generate 100 audit events
      for (let i = 0; i < 100; i++) {
        await auditLogger.log({
          type: 'ai.request',
          severity: 'info',
          action: 'TEST_ACTION',
          resource: 'test',
          resourceId: `test-${i}`,
          details: { test: true, index: i },
        });
      }

      const duration = Date.now() - startTime;
      assert.ok(duration < 10000, 'Should complete in under 10 seconds');

      // Query logs
      const logs = await auditLogger.query({ limit: 100 });
      assert.ok(logs.length > 0);
    });

    test('Encryption performance', async () => {
      await encryptionService.initialize();

      const startTime = Date.now();

      // Encrypt/decrypt 100 items
      for (let i = 0; i < 100; i++) {
        const data = `sensitive-data-${i}`;
        const encrypted = await encryptionService.encrypt(data);
        const decrypted = await encryptionService.decrypt(encrypted);
        assert.strictEqual(decrypted, data);
      }

      const duration = Date.now() - startTime;
      assert.ok(duration < 20000, 'Should complete in under 20 seconds');
    });
  });

  describe('Team Collaboration: Multi-user Scenarios', () => {
    test('Team member invitation and role assignment', async () => {
      const team = await teamManager.createTeam(
        'Collaboration Team',
        'owner-user',
        'Team for collaboration testing'
      );

      // Invite member
      const member = await teamManager.addMember(team.id, 'new-member', 'member', 'owner-user');

      assert.strictEqual(member.role, 'member');
      assert.strictEqual(member.status, 'pending');

      // Assign RBAC role
      const assignment = await rbacManager.assignRole(
        'new-member',
        'role-developer',
        { type: 'team', id: team.id },
        'owner-user'
      );

      assert.strictEqual(assignment.scope.type, 'team');
    });

    test('Project sharing across teams', async () => {
      const team1 = await teamManager.createTeam('Team 1', 'user-1', 'First team');
      const team2 = await teamManager.createTeam('Team 2', 'user-2', 'Second team');

      const share = await teamManager.shareProject('project-shared-123', team2.id, 'user-1', [
        'view',
        'edit',
      ]);

      assert.strictEqual(share.permissions.length, 2);
      assert.ok(share.permissions.includes('view'));
    });
  });
});
