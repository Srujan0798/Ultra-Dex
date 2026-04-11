// Copyright (c) 2026 Ultra-Dex

/**
 * Approval Workflow - Multi-step approval process
 */

import { v4 as uuidv4 } from 'uuid';

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export class ApprovalWorkflow {
  constructor() {
    this.requests = new Map();
    this.policies = new Map();
  }

  definePolicy(action, policy) {
    this.policies.set(action, policy);
  }

  async createRequest(action, requesterId) {
    const policy = this.policies.get(action);
    if (!policy) {
      throw new Error(`No policy defined for action: ${action}`);
    }

    const requestId = uuidv4();
    const steps = policy.steps.map((step, index) => ({
      ...step,
      status: APPROVAL_STATUS.PENDING,
      decidedAt: null,
      decidedBy: null,
      comment: null,
    }));

    const request = {
      id: requestId,
      action,
      requesterId,
      status: APPROVAL_STATUS.PENDING,
      steps,
      currentStep: 0,
      createdAt: new Date().toISOString(),
    };

    this.requests.set(requestId, request);
    return request;
  }

  async submitDecision(requestId, approverId, decision, comment = '') {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new Error(`Request is no longer pending: ${request.status}`);
    }

    const currentStep = request.steps[request.currentStep];
    if (!currentStep) {
      throw new Error('No more steps to approve');
    }

    // Check if approver is authorized for this step
    if (!currentStep.approvers.includes(approverId)) {
      throw new Error(`Approver ${approverId} is not authorized for step ${currentStep.name}`);
    }

    // Record decision
    currentStep.status =
      decision === 'approve' ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED;
    currentStep.decidedBy = approverId;
    currentStep.decidedAt = new Date().toISOString();
    currentStep.comment = comment;

    if (decision === 'reject') {
      request.status = APPROVAL_STATUS.REJECTED;
      return request;
    }

    // Move to next step
    request.currentStep++;

    // Check if all steps completed
    if (request.currentStep >= request.steps.length) {
      request.status = APPROVAL_STATUS.APPROVED;
    }

    return request;
  }

  getRequest(requestId) {
    return this.requests.get(requestId);
  }

  getPendingRequests() {
    return Array.from(this.requests.values()).filter(
      (req) => req.status === APPROVAL_STATUS.PENDING
    );
  }
}

export default ApprovalWorkflow;
