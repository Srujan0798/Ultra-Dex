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
import { EventEmitter } from 'events';
let Handshake = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      timeout: options.timeout || 1e4,
      retryAttempts: options.retryAttempts || 3,
      ...options,
    };
    this.activeHandshakes = /* @__PURE__ */ new Map();
    this.agreements = /* @__PURE__ */ new Map();
  }
  /**
   * Initiate handshake
   */
  async initiateHandshake(agentId, targetId, config = {}) {
    const handshakeId = `${agentId}-${targetId}-${Date.now()}`;
    const handshake = {
      id: handshakeId,
      initiator: agentId,
      target: targetId,
      status: 'pending',
      createdAt: Date.now(),
      config,
      capabilities: [],
      agreements: {},
    };
    this.activeHandshakes.set(handshakeId, handshake);
    this.emit('handshake.initiated', { handshakeId, initiator: agentId, target: targetId });
    try {
      const result = await this.performHandshake(handshake);
      return result;
    } catch (error) {
      handshake.status = 'failed';
      this.emit('handshake.failed', { handshakeId, error });
      throw error;
    }
  }
  /**
   * Perform handshake protocol
   */
  async performHandshake(handshake) {
    handshake.status = 'in-progress';
    const capabilities = await this.exchangeCapabilities(handshake);
    handshake.capabilities = capabilities;
    const agreement = await this.negotiateAgreement(handshake);
    handshake.agreements = agreement;
    handshake.status = 'completed';
    this.agreements.set(handshake.id, agreement);
    this.emit('handshake.completed', { handshakeId: handshake.id, agreement });
    return { success: true, agreement };
  }
  /**
   * Exchange capabilities
   */
  async exchangeCapabilities(handshake) {
    return {
      initiatorCapabilities: handshake.config.capabilities || [],
      targetCapabilities: [],
      // Would be fetched from target agent
    };
  }
  /**
   * Negotiate agreement
   */
  async negotiateAgreement(handshake) {
    return {
      protocolVersion: '1.0',
      communicationStyle: 'async',
      retryPolicy: {
        maxRetries: this.config.retryAttempts,
        backoffMultiplier: 2,
      },
      timeout: this.config.timeout,
      agreeTime: Date.now(),
    };
  }
  /**
   * Accept handshake
   */
  async acceptHandshake(handshakeId, config = {}) {
    const handshake = this.activeHandshakes.get(handshakeId);
    if (!handshake) {
      throw new Error(`Handshake ${handshakeId} not found`);
    }
    handshake.status = 'accepted';
    handshake.config = { ...handshake.config, ...config };
    this.emit('handshake.accepted', { handshakeId });
    return handshake;
  }
  /**
   * Reject handshake
   */
  rejectHandshake(handshakeId, reason = '') {
    const handshake = this.activeHandshakes.get(handshakeId);
    if (!handshake) return false;
    handshake.status = 'rejected';
    handshake.rejectReason = reason;
    this.emit('handshake.rejected', { handshakeId, reason });
    return true;
  }
  /**
   * Complete handshake
   */
  completeHandshake(handshakeId) {
    const handshake = this.activeHandshakes.get(handshakeId);
    if (!handshake) return false;
    handshake.status = 'completed';
    handshake.completedAt = Date.now();
    this.emit('handshake.finalized', { handshakeId });
    return true;
  }
  /**
   * Get handshake status
   */
  getHandshakeStatus(handshakeId) {
    return this.activeHandshakes.get(handshakeId);
  }
  /**
   * List active handshakes
   */
  listActiveHandshakes() {
    return Array.from(this.activeHandshakes.values()).filter((h) => h.status === 'in-progress');
  }
  /**
   * Get agreement
   */
  getAgreement(handshakeId) {
    return this.agreements.get(handshakeId);
  }
  /**
   * Validate agreement
   */
  validateAgreement(agreement) {
    return {
      valid: agreement && agreement.protocolVersion && agreement.timeout,
      agreement,
    };
  }
};
Handshake = __decorateClass([singleton()], Handshake);
var handshake_default = Handshake;
export { Handshake, handshake_default as default };
