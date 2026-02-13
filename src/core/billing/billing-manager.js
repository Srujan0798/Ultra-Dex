/**
 * Ultra-Dex Billing Orchestrator (BillOrc)
 * Manages subscriptions, credits, and feature gating.
 */

import { EventEmitter } from 'events';

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    limits: {
      seats: 2,
      projects: 1,
      monthlyCredits: 1000 // ~$10 API value
    },
    features: ['basic_agents', 'community_support']
  },
  PRO: {
    id: 'pro',
    name: 'Pro Tier',
    price: 2900, // $29.00
    limits: {
      seats: 10,
      projects: 50,
      monthlyCredits: 10000 // ~$100 API value
    },
    features: ['all_agents', 'priority_support', 'team_collaboration']
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom
    limits: {
      seats: 9999,
      projects: 9999,
      monthlyCredits: 1000000
    },
    features: ['all_agents', 'sso', 'audit_logs', 'dedicated_support']
  }
};

class BillingManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map(); // teamId -> subscription
    this.usage = new Map(); // teamId -> { creditsUsed: number, resetsAt: Date }
  }

  /**
   * Get subscription details for a team
   */
  getSubscription(teamId) {
    return this.subscriptions.get(teamId) || {
      planId: PLANS.FREE.id,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Upgrade or downgrade a team's plan
   */
  async changePlan(teamId, planId) {
    const plan = Object.values(PLANS).find(p => p.id === planId);
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    // Mock payment processing logic here
    const subscription = {
      teamId,
      planId,
      status: 'active',
      updatedAt: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.subscriptions.set(teamId, subscription);
    this.emit('subscription:changed', subscription);
    return subscription;
  }

  /**
   * Record usage for billing
   * @param {string} teamId 
   * @param {number} credits Cost in internal credits
   */
  async recordUsage(teamId, credits) {
    const usage = this.usage.get(teamId) || { creditsUsed: 0, resetsAt: this._getNextReset() };
    const sub = this.getSubscription(teamId);
    const plan = Object.values(PLANS).find(p => p.id === sub.planId);

    if (usage.creditsUsed + credits > plan.limits.monthlyCredits) {
      throw new Error(`Monthly credit limit exceeded for ${plan.name}`);
    }

    usage.creditsUsed += credits;
    this.usage.set(teamId, usage);
    this.emit('usage:recorded', { teamId, credits, total: usage.creditsUsed });
    return usage;
  }

  /**
   * Check if a specific feature is enabled for the team's plan
   */
  checkFeatureAccess(teamId, feature) {
    const sub = this.getSubscription(teamId);
    const plan = Object.values(PLANS).find(p => p.id === sub.planId);
    return plan.features.includes(feature) || plan.features.includes('all');
  }

  _getNextReset() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d;
  }
}

export default BillingManager;
