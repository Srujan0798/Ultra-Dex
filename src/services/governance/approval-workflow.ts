// Copyright (c) 2026 Ultra-Dex
/**
 * Approval Workflow System
 * Enterprise-grade approval processes for AI operations
 *
 * @module services/governance/approval-workflow
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';
import errorHandler from '../../../apps/cli/lib/utils/error-handler.js';

/**
 * Approval status types
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';

/**
 * Approval request priority
 */
export type ApprovalPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Approval request interface
 */
export interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  requestorId: string;
  requestorName: string;
  approverIds: string[];
  status: ApprovalStatus;
  priority: ApprovalPriority;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata: {
    projectId?: string;
    teamId?: string;
    operationType: string;
    estimatedCost?: number;
    affectedFiles?: string[];
    aiGenerated: boolean;
  };
  decisions: ApprovalDecision[];
  escalationLevel: number;
  comments: ApprovalComment[];
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  id: string;
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected';
  reason?: string;
  timestamp: Date;
}

/**
 * Approval comment
 */
export interface ApprovalComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
}

/**
 * Approval policy
 */
export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  conditions: {
    operationTypes: string[];
    minCost?: number;
    maxCost?: number;
    affectedFileCount?: number;
    requiredApprovers: number;
    approverRoles: string[];
    autoApprove?: boolean;
    autoReject?: boolean;
  };
  escalationRules: {
    enabled: boolean;
    timeoutHours: number;
    escalationLevels: {
      level: number;
      approverRoles: string[];
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Approval Workflow Manager
 */
export class ApprovalWorkflowManager {
  private initialized: boolean = false;
  private policies: Map<string, ApprovalPolicy> = new Map();
  private inMemoryRequests: Map<string, ApprovalRequest> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    // Initialize default policies
    this.initializeDefaultPolicies();

    console.log('✓ Approval workflow system initialized');
    this.initialized = true;
  }

  /**
   * Initialize default approval policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: ApprovalPolicy[] = [
      {
        id: 'policy-high-cost',
        name: 'High Cost Operations',
        description: 'Requires approval for expensive AI operations',
        conditions: {
          operationTypes: ['ai-generation', 'deployment', 'infrastructure-change'],
          minCost: 10,
          requiredApprovers: 1,
          approverRoles: ['admin', 'team-lead'],
        },
        escalationRules: {
          enabled: true,
          timeoutHours: 24,
          escalationLevels: [
            { level: 1, approverRoles: ['admin'] },
            { level: 2, approverRoles: ['super-admin'] },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'policy-security',
        name: 'Security Critical',
        description: 'Requires approval for security-sensitive operations',
        conditions: {
          operationTypes: ['security-change', 'auth-modification', 'permission-change'],
          requiredApprovers: 2,
          approverRoles: ['security-admin', 'admin'],
        },
        escalationRules: {
          enabled: true,
          timeoutHours: 4,
          escalationLevels: [
            { level: 1, approverRoles: ['security-admin'] },
            { level: 2, approverRoles: ['super-admin'] },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'policy-production',
        name: 'Production Deployment',
        description: 'Requires approval for production deployments',
        conditions: {
          operationTypes: ['production-deployment', 'database-migration'],
          requiredApprovers: 2,
          approverRoles: ['admin', 'devops-lead'],
        },
        escalationRules: {
          enabled: true,
          timeoutHours: 2,
          escalationLevels: [
            { level: 1, approverRoles: ['admin'] },
            { level: 2, approverRoles: ['cto', 'super-admin'] },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const policy of defaultPolicies) {
      this.policies.set(policy.id, policy);
    }
  }

  /**
   * Submit approval request
   */
  async submitRequest(
    requestorId: string,
    requestorName: string,
    type: string,
    title: string,
    description: string,
    metadata: ApprovalRequest['metadata'],
    priority: ApprovalPriority = 'medium'
  ): Promise<ApprovalRequest> {
    await this.initialize();

    // Check if approval is required based on policies
    const applicablePolicy = this.findApplicablePolicy(type, metadata);

    if (applicablePolicy?.conditions.autoApprove) {
      console.log(`✓ Auto-approved: ${title}`);
      return this.createAutoApprovedRequest(
        requestorId,
        requestorName,
        type,
        title,
        description,
        metadata
      );
    }

    if (applicablePolicy?.conditions.autoReject) {
      throw errorHandler.createError(
        'FORBIDDEN',
        `Operation blocked by policy: ${applicablePolicy.name}`,
        { policyId: applicablePolicy.id }
      );
    }

    // Find approvers based on policy
    const approverIds = await this.findApprovers(applicablePolicy);

    const request: ApprovalRequest = {
      id: uuidv4(),
      type,
      title,
      description,
      requestorId,
      requestorName,
      approverIds,
      status: 'pending',
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: applicablePolicy
        ? new Date(Date.now() + applicablePolicy.escalationRules.timeoutHours * 3600000)
        : undefined,
      metadata,
      decisions: [],
      escalationLevel: 0,
      comments: [],
    };

    // Store in internal memory for fast lookup
    this.inMemoryRequests.set(request.id, request);

    // Store in ppmManager for persistence
    await ppmManager.add({
      content: `Approval request submitted: ${title}`,
      type: 'approval-request',
      importance: priority === 'critical' ? 9 : priority === 'high' ? 7 : 5,
      metadata: {
        requestId: request.id,
        requestorId,
        type,
        priority,
      },
    });

    // Log to audit
    await auditLogger.log({
      type: 'security.alert',
      severity: priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : 'info',
      userId: requestorId,
      action: 'APPROVAL_REQUEST_SUBMITTED',
      resource: 'approval-workflow',
      resourceId: request.id,
      details: {
        title,
        type,
        priority,
        approverCount: approverIds.length,
      },
    });

    console.log(`✓ Approval request submitted: ${title} (ID: ${request.id})`);
    return request;
  }

  /**
   * Process approval decision
   */
  async processDecision(
    requestId: string,
    approverId: string,
    approverName: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<ApprovalRequest> {
    await this.initialize();

    // Retrieve request from memory
    const request = this.inMemoryRequests.get(requestId);
    
    if (!request) {
      throw errorHandler.createError(
        'RESOURCE_NOT_FOUND',
        `Approval request ${requestId} not found`
      );
    }

    // Check if approver is authorized
    if (!request.approverIds.includes(approverId)) {
      throw errorHandler.createError('FORBIDDEN', 'You are not authorized to approve this request');
    }

    // Add decision
    const approvalDecision: ApprovalDecision = {
      id: uuidv4(),
      approverId,
      approverName,
      decision,
      reason,
      timestamp: new Date(),
    };

    request.decisions.push(approvalDecision);
    request.updatedAt = new Date();

    // Determine final status
    const requiredApprovals = await this.getRequiredApprovalCount(request);
    const approvalCount = request.decisions.filter((d) => d.decision === 'approved').length;
    const rejectionCount = request.decisions.filter((d) => d.decision === 'rejected').length;

    if (decision === 'rejected') {
      request.status = 'rejected';
    } else if (approvalCount >= requiredApprovals) {
      request.status = 'approved';
    }

    // Update in memory
    await ppmManager.add({
      content: `Approval decision: ${decision} for ${request.title}`,
      type: 'approval-decision',
      importance: 6,
      metadata: {
        requestId,
        approverId,
        decision,
        newStatus: request.status,
      },
    });

    // Log to audit
    await auditLogger.log({
      type: 'security.alert',
      severity: decision === 'rejected' ? 'warning' : 'info',
      userId: approverId,
      action: `APPROVAL_REQUEST_${decision.toUpperCase()}`,
      resource: 'approval-workflow',
      resourceId: requestId,
      details: {
        decision,
        reason,
        newStatus: request.status,
        approvalCount,
        requiredApprovals,
      },
    });

    console.log(`✓ Approval decision recorded: ${decision} for ${request.title}`);
    return request;
  }

  /**
   * Find applicable policy
   */
  private findApplicablePolicy(
    operationType: string,
    metadata: ApprovalRequest['metadata']
  ): ApprovalPolicy | null {
    for (const policy of this.policies.values()) {
      const conditions = policy.conditions;

      // Check operation type
      if (!conditions.operationTypes.includes(operationType)) {
        continue;
      }

      // Check cost constraints
      if (conditions.minCost !== undefined && (metadata.estimatedCost || 0) < conditions.minCost) {
        continue;
      }
      if (conditions.maxCost !== undefined && (metadata.estimatedCost || 0) > conditions.maxCost) {
        continue;
      }

      return policy;
    }

    return null;
  }

  /**
   * Find approvers for policy
   */
  private async findApprovers(policy: ApprovalPolicy | null): Promise<string[]> {
    if (!policy) {
      // Default approvers - return admin users
      return ['admin-1', 'admin-2'];
    }

    // In real implementation, this would query user database
    // based on approverRoles from the policy
    return ['admin-1', 'team-lead-1'];
  }

  /**
   * Get required approval count
   */
  private async getRequiredApprovalCount(request: ApprovalRequest): Promise<number> {
    const policy = this.findApplicablePolicy(request.type, request.metadata);
    return policy?.conditions.requiredApprovers || 1;
  }

  /**
   * Create auto-approved request
   */
  private createAutoApprovedRequest(
    requestorId: string,
    requestorName: string,
    type: string,
    title: string,
    description: string,
    metadata: ApprovalRequest['metadata']
  ): ApprovalRequest {
    return {
      id: uuidv4(),
      type,
      title,
      description,
      requestorId,
      requestorName,
      approverIds: [],
      status: 'approved',
      priority: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
      decisions: [
        {
          id: uuidv4(),
          approverId: 'system',
          approverName: 'Auto-Approval System',
          decision: 'approved',
          reason: 'Auto-approved based on policy',
          timestamp: new Date(),
        },
      ],
      escalationLevel: 0,
      comments: [],
    };
  }

  /**
   * Escalate pending request
   */
  async escalateRequest(requestId: string, reason: string): Promise<ApprovalRequest> {
    await this.initialize();

    const request = this.inMemoryRequests.get(requestId);
    
    if (!request) {
      throw errorHandler.createError(
        'RESOURCE_NOT_FOUND',
        `Approval request ${requestId} not found`
      );
    }

    request.escalationLevel++;
    request.updatedAt = new Date();

    // Add escalation comment
    request.comments.push({
      id: uuidv4(),
      authorId: 'system',
      authorName: 'Escalation System',
      content: `Escalated to level ${request.escalationLevel}: ${reason}`,
      timestamp: new Date(),
    });

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'APPROVAL_REQUEST_ESCALATED',
      resource: 'approval-workflow',
      resourceId: requestId,
      details: {
        newLevel: request.escalationLevel,
        reason,
      },
    });

    console.log(
      `✓ Approval request escalated: ${request.title} (Level ${request.escalationLevel})`
    );
    return request;
  }

  /**
   * Get pending requests for user
   */
  async getPendingRequestsForUser(userId: string): Promise<ApprovalRequest[]> {
    await this.initialize();

    const requests: ApprovalRequest[] = [];

    for (const request of this.inMemoryRequests.values()) {
      if (request.approverIds.includes(userId) && request.status === 'pending') {
        requests.push(request);
      }
    }

    return requests.sort((a, b) => {
      // Sort by priority (critical > high > medium > low)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get request statistics
   */
  async getStatistics(timeWindowDays: number = 30): Promise<{
    totalRequests: number;
    approved: number;
    rejected: number;
    pending: number;
    averageResponseTime: number;
  }> {
    await this.initialize();

    const cutoff = new Date(Date.now() - timeWindowDays * 86400000);
    
    let total = 0;
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    let totalResponseTime = 0;
    let completedRequests = 0;

    for (const request of this.inMemoryRequests.values()) {
      if (request.createdAt >= cutoff) {
        total++;

        if (request.status === 'approved') approved++;
        else if (request.status === 'rejected') rejected++;
        else if (request.status === 'pending') pending++;

        // Calculate response time for completed requests
        if (request.status !== 'pending' && request.decisions.length > 0) {
          const firstDecision = request.decisions[0];
          const responseTime = firstDecision.timestamp.getTime() - request.createdAt.getTime();
          totalResponseTime += responseTime;
          completedRequests++;
        }
      }
    }

    return {
      totalRequests: total,
      approved,
      rejected,
      pending,
      averageResponseTime: completedRequests > 0 ? totalResponseTime / completedRequests : 0,
    };
  }
}

// Export singleton instance
export const approvalWorkflowManager = new ApprovalWorkflowManager();
export default approvalWorkflowManager;
