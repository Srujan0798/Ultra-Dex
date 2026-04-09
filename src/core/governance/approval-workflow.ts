var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
let ApprovalWorkflow = class {
  constructor() {
    this.requests = /* @__PURE__ */ new Map();
    this.policies = /* @__PURE__ */ new Map();
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
      createdAt: /* @__PURE__ */ new Date().toISOString(),
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
    if (!currentStep.approvers.includes(approverId)) {
      throw new Error(`Approver ${approverId} is not authorized for step ${currentStep.name}`);
    }
    currentStep.status =
      decision === 'approve' ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.REJECTED;
    currentStep.decidedBy = approverId;
    currentStep.decidedAt = /* @__PURE__ */ new Date().toISOString();
    currentStep.comment = comment;
    if (decision === 'reject') {
      request.status = APPROVAL_STATUS.REJECTED;
      return request;
    }
    request.currentStep++;
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
};
ApprovalWorkflow = __decorateClass([singleton()], ApprovalWorkflow);
var approval_workflow_default = ApprovalWorkflow;
export { APPROVAL_STATUS, ApprovalWorkflow, approval_workflow_default as default };
