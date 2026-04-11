// Copyright (c) 2026 Ultra-Dex

/**
 * Security Policies for Agent Execution
 * Defines and enforces security policies for agent operations
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { printWarning, printError, printInfo } from '../utils/output.js';

const POLICIES_DIR = path.join(process.cwd(), '.ultra-dex', 'security');
const POLICIES_FILE = path.join(POLICIES_DIR, 'agent-policies.json');

export const SECURITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const EXECUTION_POLICIES = {
  SANDBOXED: 'sandboxed',
  RESTRICTED: 'restricted',
  UNRESTRICTED: 'unrestricted',
};

const AgentSecurityPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  securityLevel: z.enum([
    SECURITY_LEVELS.LOW,
    SECURITY_LEVELS.MEDIUM,
    SECURITY_LEVELS.HIGH,
    SECURITY_LEVELS.CRITICAL,
  ]),
  executionPolicy: z.enum([
    EXECUTION_POLICIES.SANDBOXED,
    EXECUTION_POLICIES.RESTRICTED,
    EXECUTION_POLICIES.UNRESTRICTED,
  ]),
  allowedOperations: z.array(z.string()),
  blockedOperations: z.array(z.string()),
  resourceLimits: z
    .object({
      maxCpuTime: z.number().optional(),
      maxMemory: z.number().optional(),
      maxFileSize: z.number().optional(),
      maxNetworkRequests: z.number().optional(),
      timeout: z.number().optional(),
    })
    .optional(),
  dataSensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  auditLevel: z.enum(['minimal', 'standard', 'detailed']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class AgentSecurityPolicies {
  constructor() {
    this.policies = new Map();
    this.defaultPolicies = this.createDefaultPolicies();
  }

  /**
   * Create default security policies
   */
  createDefaultPolicies() {
    const now = new Date().toISOString();

    return {
      'basic-agent': {
        id: 'basic-agent',
        name: 'Basic Agent Policy',
        description: 'Basic security policy for standard agent operations',
        securityLevel: SECURITY_LEVELS.MEDIUM,
        executionPolicy: EXECUTION_POLICIES.SANDBOXED,
        allowedOperations: [
          'file:read',
          'file:write',
          'network:http_get',
          'network:http_post',
          'ai:execute',
        ],
        blockedOperations: ['system:exec', 'file:delete_system', 'network:raw_socket'],
        resourceLimits: {
          maxCpuTime: 30000, // 30 seconds
          maxMemory: 128 * 1024 * 1024, // 128MB
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxNetworkRequests: 100,
          timeout: 60000, // 1 minute
        },
        dataSensitivity: 'internal',
        auditLevel: 'standard',
        createdAt: now,
        updatedAt: now,
      },

      'trusted-agent': {
        id: 'trusted-agent',
        name: 'Trusted Agent Policy',
        description: 'Relaxed security policy for trusted agent operations',
        securityLevel: SECURITY_LEVELS.LOW,
        executionPolicy: EXECUTION_POLICIES.RESTRICTED,
        allowedOperations: [
          'file:read',
          'file:write',
          'file:delete',
          'system:exec_safe',
          'network:http_get',
          'network:http_post',
          'network:websocket',
          'ai:execute',
          'database:query',
        ],
        blockedOperations: [
          'system:exec_dangerous',
          'file:delete_system',
          'network:raw_socket',
          'system:shutdown',
        ],
        resourceLimits: {
          maxCpuTime: 120000, // 2 minutes
          maxMemory: 512 * 1024 * 1024, // 512MB
          maxFileSize: 100 * 1024 * 1024, // 100MB
          maxNetworkRequests: 1000,
          timeout: 300000, // 5 minutes
        },
        dataSensitivity: 'confidential',
        auditLevel: 'detailed',
        createdAt: now,
        updatedAt: now,
      },

      'admin-agent': {
        id: 'admin-agent',
        name: 'Admin Agent Policy',
        description: 'Full access policy for administrative agents',
        securityLevel: SECURITY_LEVELS.CRITICAL,
        executionPolicy: EXECUTION_POLICIES.UNRESTRICTED,
        allowedOperations: ['*'],
        blockedOperations: [],
        resourceLimits: {},
        dataSensitivity: 'restricted',
        auditLevel: 'detailed',
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  /**
   * Load policies from disk
   */
  async loadPolicies() {
    try {
      await fs.mkdir(POLICIES_DIR, { recursive: true });
      const data = await fs.readFile(POLICIES_FILE, 'utf8');
      const policies = JSON.parse(data);

      for (const [id, policy] of Object.entries(policies)) {
        this.policies.set(id, policy);
      }

      printInfo('📋 Agent security policies loaded');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(`⚠️ Could not load security policies: ${error.message}`);
      }
      // Load defaults
      for (const [id, policy] of Object.entries(this.defaultPolicies)) {
        this.policies.set(id, policy);
      }
    }
  }

  /**
   * Save policies to disk
   */
  async savePolicies() {
    try {
      await fs.mkdir(POLICIES_DIR, { recursive: true });
      const policiesObj = Object.fromEntries(this.policies);
      await fs.writeFile(POLICIES_FILE, JSON.stringify(policiesObj, null, 2));
      printInfo('💾 Agent security policies saved');
    } catch (error) {
      printError(`Failed to save security policies: ${error.message}`);
    }
  }

  /**
   * Create a new security policy
   */
  async createPolicy(policyData) {
    try {
      const validatedData = AgentSecurityPolicySchema.parse({
        ...policyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (this.policies.has(validatedData.id)) {
        throw new Error(`Policy ${validatedData.id} already exists`);
      }

      this.policies.set(validatedData.id, validatedData);
      await this.savePolicies();

      printInfo(`✅ Security policy created: ${validatedData.name}`);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId) {
    return this.policies.get(policyId) || this.defaultPolicies[policyId];
  }

  /**
   * Update policy
   */
  async updatePolicy(policyId, updates) {
    const existing = this.policies.get(policyId);
    if (!existing) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const validated = AgentSecurityPolicySchema.parse(updated);
    this.policies.set(policyId, validated);
    await this.savePolicies();

    printInfo(`✅ Security policy updated: ${validated.name}`);
    return validated;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId) {
    if (!this.policies.has(policyId)) {
      throw new Error(`Policy ${policyId} not found`);
    }

    this.policies.delete(policyId);
    await this.savePolicies();

    printInfo(`✅ Security policy deleted: ${policyId}`);
  }

  /**
   * Check if operation is allowed under policy
   */
  isOperationAllowed(policyId, operation) {
    const policy = this.getPolicy(policyId);
    if (!policy) return false;

    // Admin policies allow everything
    if (policy.executionPolicy === EXECUTION_POLICIES.UNRESTRICTED) {
      return true;
    }

    // Check blocked operations
    if (policy.blockedOperations.includes(operation)) {
      return false;
    }

    // Check allowed operations
    if (policy.allowedOperations.includes('*')) {
      return true;
    }

    return policy.allowedOperations.includes(operation);
  }

  /**
   * Enforce resource limits
   */
  enforceResourceLimits(policyId, usage) {
    const policy = this.getPolicy(policyId);
    if (!policy || !policy.resourceLimits) return;

    const limits = policy.resourceLimits;

    if (limits.maxCpuTime && usage.cpuTime > limits.maxCpuTime) {
      throw new Error(`CPU time limit exceeded: ${usage.cpuTime}ms > ${limits.maxCpuTime}ms`);
    }

    if (limits.maxMemory && usage.memory > limits.maxMemory) {
      throw new Error(`Memory limit exceeded: ${usage.memory} > ${limits.maxMemory}`);
    }

    if (limits.maxFileSize && usage.fileSize > limits.maxFileSize) {
      throw new Error(`File size limit exceeded: ${usage.fileSize} > ${limits.maxFileSize}`);
    }

    if (limits.maxNetworkRequests && usage.networkRequests > limits.maxNetworkRequests) {
      throw new Error(
        `Network requests limit exceeded: ${usage.networkRequests} > ${limits.maxNetworkRequests}`
      );
    }
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  /**
   * Get policy for agent based on context
   */
  getPolicyForAgent(agentType, userRole = 'member') {
    // Map agent types to policies
    const agentPolicyMap = {
      architect: 'trusted-agent',
      'meta-orchestrator': 'trusted-agent',
      orchestrator: 'basic-agent',
      cto: 'trusted-agent',
      planner: 'basic-agent',
      research: 'basic-agent',
      backend: 'basic-agent',
      frontend: 'basic-agent',
      database: 'trusted-agent',
      auth: 'trusted-agent',
      security: 'trusted-agent',
      devops: 'trusted-agent',
      testing: 'basic-agent',
      reviewer: 'basic-agent',
      debugger: 'basic-agent',
      documentation: 'basic-agent',
      performance: 'basic-agent',
      refactoring: 'basic-agent',
    };

    // Admin users get admin policy
    if (userRole === 'admin' || userRole === 'super-admin') {
      return this.getPolicy('admin-agent');
    }

    const policyId = agentPolicyMap[agentType] || 'basic-agent';
    return this.getPolicy(policyId);
  }
}

// Singleton instance
export const agentSecurityPolicies = new AgentSecurityPolicies();

// Initialize on import
agentSecurityPolicies.loadPolicies().catch(console.error);
