/**
 * Ultra-Dex Enterprise Middleware
 * Multi-tenancy enforcement and security controls
 */

import { organizationsManager } from '../auth/organizations.js';
import { multiTenancyManager } from '../auth/multi-tenancy.js';

/**
 * Middleware to enforce organization-based access control
 */
export function orgAccessControl(req, res, next) {
  const orgId = req.headers['x-org-id'] || req.query.orgId;
  const userId = req.user?.id;

  if (!orgId) {
    return res.status(400).json({
      error: 'Organization ID required',
      code: 'ORG_ID_REQUIRED'
    });
  }

  if (!userId) {
    return res.status(401).json({
      error: 'User authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user has access to organization
  if (!organizationsManager.hasAccess(userId, orgId)) {
    return res.status(403).json({
      error: 'User does not have access to this organization',
      code: 'ORG_ACCESS_DENIED'
    });
  }

  // Attach organization context to request
  req.organization = organizationsManager.getOrganization(orgId);
  next();
}

/**
 * Middleware to enforce tenant-based resource isolation
 */
export function tenantIsolation(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  const userId = req.user?.id;

  if (!tenantId) {
    return res.status(400).json({
      error: 'Tenant ID required',
      code: 'TENANT_ID_REQUIRED'
    });
  }

  if (!userId) {
    return res.status(401).json({
      error: 'User authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user has access to tenant
  if (!multiTenancyManager.hasAccess(userId, tenantId)) {
    return res.status(403).json({
      error: 'User does not have access to this tenant',
      code: 'TENANT_ACCESS_DENIED'
    });
  }

  // Check resource quotas
  const resourceType = req.path.split('/')[1]; // Get resource type from path
  if (resourceType && !await multiTenancyManager.checkQuota(tenantId, resourceType)) {
    return res.status(429).json({
      error: 'Resource quota exceeded for tenant',
      code: 'QUOTA_EXCEEDED'
    });
  }

  // Attach tenant context to request
  req.tenant = multiTenancyManager.getTenant(tenantId);
  next();
}

/**
 * Middleware to enforce role-based access control
 */
export function rbacMiddleware(requiredRole) {
  return (req, res, next) => {
    const userId = req.user?.id;
    const orgId = req.headers['x-org-id'] || req.query.orgId;
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    let hasAccess = false;

    if (orgId) {
      hasAccess = organizationsManager.hasAccess(userId, orgId, requiredRole);
    } else if (tenantId) {
      hasAccess = multiTenancyManager.hasAccess(userId, tenantId, requiredRole);
    } else {
      // For system-level operations, check user role
      hasAccess = req.user?.role === 'admin' || req.user?.role === 'owner';
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: `Insufficient permissions. Required role: ${requiredRole}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
}

/**
 * Middleware to enforce security policies
 */
export function securityMiddleware(req, res, next) {
  // Rate limiting per tenant/organization
  const tenantId = req.headers['x-tenant-id'];
  const orgId = req.headers['x-org-id'];
  
  if (tenantId || orgId) {
    const key = tenantId || orgId;
    // Implement rate limiting logic here
    // For now, just continue
  }

  // Input validation
  if (req.body) {
    // Sanitize input to prevent injection attacks
    req.body = sanitizeInput(req.body);
  }

  // Log the request for audit purposes
  logRequest(req);

  next();
}

/**
 * Sanitize input to prevent injection attacks
 * @param {object} input - Input object to sanitize
 * @returns {object} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Remove potential SQL injection patterns
      input[key] = value.replace(/('|;|--|\/\*|\*\/|xp_|sp_|sys\.|exec|drop|create|alter|delete|insert|select|union|script|<script|javascript:)/gi, '');
    } else if (typeof value === 'object') {
      input[key] = sanitizeInput(value);
    }
  }

  return input;
}

/**
 * Log request for audit purposes
 * @param {object} req - Request object
 */
function logRequest(req) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    tenantId: req.headers['x-tenant-id'],
    orgId: req.headers['x-org-id'],
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    params: req.params,
    query: req.query,
    body: req.body ? { ...req.body } : null // Shallow copy to prevent modification
  };

  // Remove sensitive data from log
  if (logEntry.body) {
    delete logEntry.body.password;
    delete logEntry.body.apiKey;
    delete logEntry.body.token;
  }

  // In a real implementation, this would be sent to an audit log
  console.log('[AUDIT]', JSON.stringify(logEntry));
}

/**
 * Middleware to enforce data residency policies
 */
export function dataResidencyMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'];
  if (tenantId) {
    const tenant = multiTenancyManager.getTenant(tenantId);
    if (tenant?.settings?.dataResidency && tenant.settings.dataResidency !== 'global') {
      // Implement data residency enforcement here
      // For now, just continue
      console.log(`Data residency enforcement for tenant ${tenantId}: ${tenant.settings.dataResidency}`);
    }
  }
  next();
}

/**
 * Middleware to enforce encryption requirements
 */
export function encryptionMiddleware(req, res, next) {
  // Check if request contains sensitive data that requires encryption
  const sensitivePaths = ['/api/v1/agents', '/api/v1/memory', '/api/v1/projects'];
  const isSensitivePath = sensitivePaths.some(path => req.path.startsWith(path));

  if (isSensitivePath && req.method !== 'GET') {
    // Verify request is encrypted (HTTPS)
    if (!req.secure && !req.headers['x-forwarded-proto'] === 'https') {
      return res.status(400).json({
        error: 'HTTPS required for sensitive operations',
        code: 'HTTPS_REQUIRED'
      });
    }
  }

  next();
}

/**
 * Middleware to enforce compliance policies
 */
export function complianceMiddleware(req, res, next) {
  // Check for compliance requirements based on tenant/org settings
  const tenantId = req.headers['x-tenant-id'];
  const orgId = req.headers['x-org-id'];

  if (tenantId) {
    const tenant = multiTenancyManager.getTenant(tenantId);
    if (tenant?.settings?.auditLogging) {
      // Ensure audit logging is enabled for this request
      console.log(`[COMPLIANCE] Audit logging enabled for tenant ${tenantId}`);
    }
  }

  if (orgId) {
    const org = organizationsManager.getOrganization(orgId);
    if (org?.settings?.auditLogging) {
      // Ensure audit logging is enabled for this request
      console.log(`[COMPLIANCE] Audit logging enabled for org ${orgId}`);
    }
  }

  next();
}

// Export all middleware functions
export default {
  orgAccessControl,
  tenantIsolation,
  rbacMiddleware,
  securityMiddleware,
  dataResidencyMiddleware,
  encryptionMiddleware,
  complianceMiddleware
};