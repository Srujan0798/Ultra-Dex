// Copyright (c) 2026 Ultra-Dex

/**
 * Capability Router compatibility export.
 * Keeps RFC references stable while delegating to the core router.
 */

import { capabilitiesRouter } from './router.js';

export { capabilitiesRouter, CapabilitiesRouter } from './router.js';

/**
 * Validate capabilities for a tool against context and policy
 * @param {string} toolName - Name of the tool to validate
 * @param {object} context - Context for validation
 * @returns {Promise<object>} Validation result
 */
export async function validateCapabilities(toolName, context) {
  try {
    // Check capabilities match permissions
    const capability = capabilitiesRouter.getCapability(toolName);

    if (!capability) {
      return {
        valid: true,
        reason: 'No specific capability requirements defined for tool'
      };
    }

    // Block if risk score too high based on context
    const riskScore = capability.riskScore || 'low';
    const riskLevelMap = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    // In certain contexts, we might want to block higher risk tools
    if (context && context.securityMode === 'strict') {
      if (riskLevelMap[riskScore] > riskLevelMap['medium']) {
        return {
          valid: false,
          reason: `Tool blocked in strict mode due to risk level: ${riskScore}`
        };
      }
    }

    // Check if requires approval
    if (capability.requiresApproval) {
      return {
        valid: false,
        requiresApproval: true,
        reason: 'Tool requires explicit user approval'
      };
    }

    // Check rate limiting
    if (capability.rateLimit) {
      try {
        await capabilitiesRouter.enforceRateLimit(toolName, capability.rateLimit);
      } catch (error) {
        return {
          valid: false,
          reason: error.message
        };
      }
    }

    return {
      valid: true,
      capability,
      reason: 'All capability checks passed'
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Validation error: ${error.message}`
    };
  }
}

